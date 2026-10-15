---
title: "Lexicons and Writing to Your PDS"
excerpt: Lexicons are how AT Protocol knows what a record means. This post defines one, generates typed TypeScript from it, and uses it to write a record to the local PDS — then reads it back publicly without touching authentication.
thumbnail: thumbnail.png
date: '2026-10-15T20:00:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

[Post 3](https://arsdehnel.com/posts/rwsdk-atproto-03-devnet) set up a local AT Protocol devnet so nothing has to touch Bluesky or anything on the ATmosphere during development. Post 4 uses it: we define a lexicon, generate TypeScript from it, and write an actual record to the local PDS. We also hit a real infrastructure problem with OAuth session storage, which turns out to be worth solving now.

## What a lexicon is

Every record type in AT Protocol is defined by a lexicon — a JSON schema identified by an NSID (Namespace Identifier). NSIDs follow a reverse-DNS convention: `xyz.statusphere.status` means the `status` record type under the `statusphere` namespace, owned by whoever controls `xyz`. The NSID doubles as the collection name when records are stored in a repo.

The `xyz.statusphere.status` lexicon comes from Bluesky's [Statusphere tutorial](https://atproto.com/tutorials/statusphere). It defines a simple record: one emoji status and a timestamp.

```json
{
  "lexicon": 1,
  "id": "xyz.statusphere.status",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["status", "createdAt"],
        "properties": {
          "status": { "type": "string", "maxGraphemes": 1, "maxLength": 32, "minLength": 1 },
          "createdAt": { "type": "string", "format": "datetime" }
        }
      }
    }
  }
}
```

The `key: "tid"` field means records in this collection are identified by a TID (timestamp-based ID). We'll override that in a moment to make it behave as a singleton.

## Installing and generating

The `@atproto/lex` package ships a CLI with two commands:

```sh
lex install xyz.statusphere.status   # fetches the lexicon JSON from the network
lex build                            # generates TypeScript from the fetched JSON
```

`lex install` fetches the lexicon from where it lives in the AT Protocol network — in this case, a record published by the Statusphere tutorial authors — and pins its CID in `lexicons.json`:

```json
{
  "version": 1,
  "lexicons": ["xyz.statusphere.status"],
  "resolutions": {
    "xyz.statusphere.status": {
      "uri": "at://did:plc:cgglmcdlre7x4iknufqyajbo/com.atproto.lexicon.schema/xyz.statusphere.status",
      "cid": "bafyreifmakho22qjptfycciab2gm6hyl4yeav7b2sp6us2ndotavqn4qgi"
    }
  }
}
```

`lexicons.json` is committed. The JSON files fetched into `lexicons/` and the TypeScript generated into `src/lexicons/` are both gitignored. They're reproducible build artifacts, not source. Both directories go in `.gitignore`, and both steps get added to `dev:init` so a fresh clone is one command away:

```jsonc
"dev:init": "pnpm lex:install && pnpm lex:generate && rw-scripts dev-init",
"lex:install": "lex install --ci",
"lex:generate": "lex build --import-ext \"\"",
```

The `--ci` flag on `lex install` pins behavior to the CIDs in `lexicons.json` rather than re-resolving — same idea as `npm ci` vs `npm install`.

## What gets generated

`lex build` outputs a TypeScript representation of the lexicon under `src/lexicons/`. The interesting file is `xyz/statusphere/status.defs.ts`:

```typescript
const main = l.record<'tid', Main>(
  'tid',
  'xyz.statusphere.status',
  l.object({
    status: l.string({ maxLength: 32, minLength: 1, maxGraphemes: 1 }),
    createdAt: l.string({ format: 'datetime' }),
  }),
)
```

This `main` object is the schema — a runtime value that the `@atproto/lex` `Client` class uses for typed reads and writes. `status.ts` re-exports it as the default export, which is what gets imported in application code.

## Writing a record

The `@atproto/lex` `Client` wraps an OAuth session and provides high-level methods for record operations: `create`, `put`, `get`, `list`, `delete`. Each takes a schema object as its first argument, which is how it knows the NSID, key type, and shape of the record.

For `xyz.statusphere.status` we want a singleton — one record per user, updated in place rather than appended. AT Protocol has no PATCH operation; `put` replaces the record wholesale. The singleton behavior comes from using a fixed `rkey` of `"self"`:

```typescript
import { Client, type DatetimeString } from "@atproto/lex";
import statusSchema from "@/lexicons/xyz/statusphere/status";

const oauthSession = await oauthClient.restore(did);
const lexClient = new Client(oauthSession);

const res = await lexClient.put(
  statusSchema,
  { status: emoji, createdAt: new Date().toISOString() as DatetimeString },
  { rkey: "self" }
);
```

Any future `put` with the same `rkey` replaces the previous record. The `lexicon: "tid"` key type still applies for new records created without an explicit rkey — we're just overriding it for this one.

The lower-level API (`createRecord`, `putRecord`, etc.) returns the full `XrpcResponse` object with the body under `.body`. The high-level methods — `put`, `get`, etc. — return the body directly, which is what you want in most cases.

## OAuth scope for writes

Post 3 used a scope of `"atproto"` which grants full repo access. For writes, a more specific scope can be requested:

```typescript
export const SCOPE = "atproto repo:xyz.statusphere.status";
```

The `repo:xyz.statusphere.status` scope explicitly requests write access to that collection. The PDS enforces this when the record is created — the access token must carry the scope that covers the collection being written to.

Changing the scope means existing sessions are no longer valid for the new scope. Users need to log out and re-authenticate.

## The OAuth session storage problem

There's an infrastructure problem that's been deferred since Post 2 and that now actually breaks things: `NodeOAuthClient` needs a `stateStore` and `sessionStore` to persist OAuth state and tokens. The previous implementation used in-memory Maps on `globalThis`. This works within a single worker process session but falls apart the moment the worker restarts — which happens constantly during development when files change.

The symptom: the `UserSession` Durable Object (which stores the HTTP session cookie → DID mapping) survives worker restarts because it's backed by SQLite. So the user still appears logged in. But the OAuth tokens stored in the in-memory Map are gone, so `client.restore(did)` throws "The session was deleted by another process" when the app tries to write a record.

The fix is two Cloudflare KV namespaces:

```jsonc
"kv_namespaces": [
  { "binding": "OAUTH_STATE_KV", "id": "OAUTH_STATE_KV_LOCAL" },
  { "binding": "OAUTH_SESSION_KV", "id": "OAUTH_SESSION_KV_LOCAL" }
]
```

Two namespaces rather than one with key prefixes because they have meaningfully different lifecycles. State entries are ephemeral — OAuth flow state only needs to survive the seconds between the authorization redirect and the callback. Session entries are durable — they need to survive restarts and (in production) isolate evictions.

```typescript
stateStore: {
  async get(key) {
    const raw = await env.OAUTH_STATE_KV.get(key);
    return raw ? JSON.parse(raw) : undefined;
  },
  async set(key, value) {
    await env.OAUTH_STATE_KV.put(key, JSON.stringify(value), {
      expirationTtl: 600, // 10 minutes
    });
  },
  async del(key) { await env.OAUTH_STATE_KV.delete(key); },
},
sessionStore: {
  async get(did) {
    const raw = await env.OAUTH_SESSION_KV.get(did);
    return raw ? JSON.parse(raw) : undefined;
  },
  async set(did, value) {
    await env.OAUTH_SESSION_KV.put(did, JSON.stringify(value));
  },
  async del(did) { await env.OAUTH_SESSION_KV.delete(did); },
},
```

One remaining gap worth naming: in production, the `stateStore` is still not safe across multiple Worker isolates. The authorization redirect and OAuth callback are likely to land on different isolates, and KV reads are eventually consistent rather than strongly consistent. For a single-instance dev setup this is fine; for production the fix is either a Durable Object or accepting that some login attempts will fail and require a retry. Post 8 covers making this production-ready.

## Reading back publicly

After writing, the app reads the status collection back from the PDS to display the raw record. This is where something worth understanding shows up: `com.atproto.repo.listRecords` is a public endpoint. No OAuth required.

```
GET http://localhost:3000/xrpc/com.atproto.repo.listRecords?repo={did}&collection=xyz.statusphere.status
```

You can open that URL in a browser, or run it with curl, and see the same JSON the app displays. The write required authentication; the read doesn't. This is the AT Protocol data model: your repo is publicly readable by anyone, writes require OAuth authorization from you.

The response shows what the record actually looks like on the wire:

```json
{
  "records": [{
    "uri": "at://did:plc:.../xyz.statusphere.status/self",
    "cid": "bafyrei...",
    "value": {
      "$type": "xyz.statusphere.status",
      "status": "🔥",
      "createdAt": "2026-10-15T20:00:00.000Z"
    }
  }]
}
```

The `uri` is an AT URI — `at://` scheme, the DID as the authority, the NSID as the collection, the rkey as the final segment. The `cid` is a content-addressed hash of the record value, used for compare-and-swap operations. The `$type` field identifies the lexicon.

## The anti-pattern to notice

The app reads the status back from the same PDS it just wrote to. This works, and it's fine for a demo. But it's not how the AT Protocol ecosystem is designed to work.

In the real atmosphere, you wouldn't ask the PDS for your data after writing it. You'd ask an AppView — a service that has already indexed the relevant records from across the network and can serve them efficiently. The PDS is the source of truth for writes; AppViews are the right place to read from.

Post 5 covers this: Tap and Jetstream let you react to record changes as they propagate through the network, which is the pattern that replaces polling your own PDS for data you already wrote.

## Setup

```sh
git checkout post/04-lexicons
pnpm install
pnpm docker:up
pnpm dev:init
pnpm dev
```

Log in with `alice.devnet.test` / `alice-devnet-pass` at `http://127.0.0.1:5173`. Pick an emoji — the raw PDS record appears below the picker immediately after the write, without a page reload.
