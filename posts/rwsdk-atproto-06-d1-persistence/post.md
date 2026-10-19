---
title: "RWSDK + ATP: D1 Persistence"
excerpt: "Every worker restart wipes the in-memory status store. This post adds Cloudflare D1 and Drizzle ORM so indexed webhook data survives restarts — no separate database to run, no cloud setup required for local dev."
thumbnail: thumbnail.png
date: '2026-10-15T14:00:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

[Post 5](https://arsdehnel.com/posts/rwsdk-atproto-05-tap-sync) set up Tap to deliver webhook events and an SSE connection to push them live to the browser. At the end of that post the in-memory status store has a comment on it:

```typescript
// Module-level per-isolate state.
// Production gap: state is lost on Worker restart. Post 6 adds D1.
export const statusStore = new Map<string, StatusEntry>();
```

This post is that fix.

The payoff is modest and honest: pick a status, restart the worker, refresh the page — your status is still there. That's it. But it's the right foundation for Post 7, where the feed becomes a cross-user index across everyone on the network.

## Why module-level state doesn't survive restarts

In a Cloudflare Worker, module-level variables are initialized once per isolate. In development, that means once per `pnpm dev` session. When the dev server restarts (ie every file save in dev server mode) a new isolate starts with fresh module state. The Map is empty.

In production the situation is worse: Cloudflare runs many isolates across many machines, and any given request can land on any of them. A Map set by one request is invisible to every other isolate.

The fix is to stop treating module-level memory as a data store and use an actual database instead.

## D1: local dev with no cloud setup

Cloudflare D1 is a SQLite-compatible database that runs at the edge. For local development, Wrangler emulates it with a local SQLite file under `.wrangler/state/v3/d1/` (note: no Cloudflare account required, no `wrangler d1 create` needed until you're ready to deploy).

The binding goes in `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "rwsdk-atproto-starter-local",
    "database_id": "local",
    "migrations_dir": "drizzle"
  }
]
```

`database_id: "local"` is a placeholder that satisfies the schema requirement without pointing at anything in Cloudflare's API. Wrangler uses `database_name` for local state. For production you'd run `wrangler d1 create rwsdk-atproto-starter` and replace this with the real UUID.

After adding the binding, run `pnpm run generate` (which runs `wrangler types`) to regenerate `worker-configuration.d.ts` so TypeScript knows about `DB: D1Database`.

## Drizzle setup

Install the packages:

```sh
pnpm add drizzle-orm
pnpm add -D drizzle-kit
```

The config file points Drizzle Kit at the schema and tells it to output migrations to `./drizzle`, matching the `migrations_dir` in `wrangler.jsonc`:

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
```

The schema mirrors the existing `StatusEntry` shape — one row per DID, updated in place:

```typescript
// src/db/schema.ts
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const statuses = sqliteTable("statuses", {
  did: text("did").primaryKey(),
  handle: text("handle"),
  status: text("status").notNull(),
  updatedAt: text("updated_at").notNull(),
});
```

The `db` instance is created once at module scope using `env.DB` from `cloudflare:workers`:

```typescript
// src/db/db.ts
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export const db = drizzle(env.DB, { schema });
```

Three scripts handle the migration lifecycle:

```jsonc
"migrate:new": "drizzle-kit generate",
"migrate:dev": "wrangler d1 migrations apply DB --local",
"migrate:prod": "wrangler d1 migrations apply DB --remote"
```

`migrate:new` generates a SQL migration file from the schema diff. `migrate:dev` applies pending migrations to the local SQLite file. Run both once to get started:

```sh
pnpm run migrate:new
pnpm run migrate:dev
```

## The webhook handler: Map → upsert

The `statusStore.set` and `statusStore.delete` calls become D1 operations. For creates and updates, Drizzle's `onConflictDoUpdate` handles the upsert — insert a new row, or update the existing one if the DID already exists:

```typescript
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { statuses } from "@/db/schema";

// create or update
await db
  .insert(statuses)
  .values({ did: event.did, handle, status, updatedAt: new Date().toISOString() })
  .onConflictDoUpdate({
    target: statuses.did,
    set: { handle, status, updatedAt: new Date().toISOString() },
  });

// delete
await db.delete(statuses).where(eq(statuses.did, event.did));
```

After the write, a `db.select()` fetches the current full list to push to SSE clients — same as before, just sourced from D1 instead of the Map:

```typescript
const allStatuses = await db.select().from(statuses);
pushToSseClients(allStatuses);
```

## Page load: query D1 instead of the Map

The home page previously read `statusStore.get(did)` for the current user's status and `Array.from(statusStore.values())` for the feed. Both become D1 queries:

```typescript
// current user's status
const [currentEntry] = did
  ? await db.select({ status: statuses.status }).from(statuses).where(eq(statuses.did, did))
  : [];
const currentStatus = currentEntry?.status ?? null;

// initial feed
<StatusFeed initialStatuses={await db.select().from(statuses)} />
```

The destructuring `const [currentEntry] = ...` is idiomatic Drizzle for a single-row select — the query returns an array, and the first element is either the row or `undefined`.

## The SSE endpoint: async before the stream

The SSE handler sends the current snapshot immediately when a client connects. Previously it read from the synchronous Map inside `ReadableStream.start()`. D1 queries are async, and `start()` doesn't support `await`, so the fetch has to happen before the stream is constructed:

```typescript
export async function get(): Promise<Response> {
  const initialStatuses = await db.select().from(statuses);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      sseClients.add(controller);
      controller.enqueue(
        encoder.encode(`event: statuses\ndata: ${JSON.stringify(initialStatuses)}\n\n`)
      );
    },
    cancel() {
      sseClients.delete(ctrl);
    },
  });

  return new Response(stream, { /* SSE headers */ });
}
```

The snapshot is captured before the stream opens and closed over in `start()`. New updates still arrive via the webhook → SSE push path.

## What's next

The data model is already multi-user — the schema has no user filter, and the upsert keyed on DID means every user who sets a status gets their own row. Post 7 completes both halves of the read pattern introduced in Post 5: it adds the optimistic update path so your own writes land in D1 immediately without waiting for the relay, and it moves the status board outside the auth gate so anyone can read it without logging in. That's what makes this a real AppView.

## Setup

```sh
git checkout post/06-d1-drizzle
pnpm install
pnpm docker:up
pnpm migrate:dev
pnpm dev
```

Log in with `alice.devnet.test` / `alice-devnet-pass` at `http://127.0.0.1:5173`. Pick a status. Then stop the dev server and restart it with `pnpm dev`. Refresh the page — the status picker shows your last pick. That's the whole demo, and it's enough.
