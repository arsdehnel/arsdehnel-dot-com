---
title: "Reacting to Changes with Tap"
excerpt: 'Reading data back from your own PDS after writing it is the anti-pattern. This post introduces the right model: Tap subscribes to the AT Protocol firehose and delivers record changes to your app as webhooks, then SSE pushes them to the browser.'
thumbnail: thumbnail.png
date: '2026-10-15T11:00:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

[Post 4](https://arsdehnel.com/posts/rwsdk-atproto-04-lexicons) ended with the app reading a status record back from the PDS immediately after writing it. That works, and the demo is convincing, but the post flagged it as the anti-pattern it is. This post replaces it with how the AT Protocol ecosystem actually expects data to flow: you write to your PDS, events propagate through the network, and an AppView delivers the data to your app.

The full loop:

```
[App] → PUT record → [PDS] → firehose event → [Tap]
[Tap] → POST /webhooks/tap → [App] → SSE → browser
```

## Why the direct PDS read is wrong

When you write a record to your PDS and immediately read it back from the same PDS, you're treating the PDS like a database you own. That works in isolation but it doesn't compose. In AT Protocol, your PDS is the source of truth for *writes*, but it's not the right place to read application data from. The right pattern is to let the network deliver changes to you — which is what AppViews do.

An AppView subscribes to the firehose, indexes the records it cares about, and serves read queries efficiently against that index. Your app doesn't poll the PDS; it receives events and reacts to them.

Tap is a lightweight AppView component that handles the firehose subscription and delivers matching events to your app as HTTP webhooks.

## Adding Tap to Docker Compose

```yaml
tap:
  image: ghcr.io/bluesky-social/indigo/tap:latest
  restart: unless-stopped
  depends_on:
    pds:
      condition: service_healthy
  environment:
    TAP_RELAY_URL: http://pds:3000
    TAP_PLC_URL: http://plc:2582
    TAP_DATABASE_URL: sqlite:///data/tap.db
    TAP_DISABLE_ACKS: "true"
    TAP_WEBHOOK_URL: ${TAP_WEBHOOK_URL:-http://host.docker.internal:5173/webhooks/tap}
    TAP_COLLECTION_FILTERS: xyz.statusphere.status
    TAP_LOG_LEVEL: info
  extra_hosts:
    - "localhost:host-gateway"
  volumes:
    - tap-data:/data
  ports:
    - "2480:2480"
  networks:
    - atproto-devnet
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:2480/health"]
    interval: 60s
    timeout: 5s
    retries: 5
```

A few things worth explaining:

**`TAP_WEBHOOK_URL`:** instead of the WebSocket channel mode (where your app connects to Tap), this puts Tap in webhook mode: it POSTs events to your app's URL. That's the right model for a Cloudflare Worker, which handles incoming requests rather than maintaining persistent outgoing connections. The default points at `host.docker.internal:5173` — Docker Desktop's special hostname that resolves to the host machine from inside a container. On Linux, override this with your Docker bridge IP as this hostname doesn't work there.

**`TAP_COLLECTION_FILTERS`:** Tap only delivers events for this collection. Everything else on the firehose is silently and conveniently dropped before the webhook fires.

**`extra_hosts: ["localhost:host-gateway"]`:** this one is gnarly. When a user's DID is registered on the local PDS, their DID document records the PDS address as `http://localhost:3000`  because `PDS_HOSTNAME: localhost` is there and that is what makes OAuth work from the browser. When Tap later tries to resync a repo, it resolves the DID document and finds `localhost:3000`. Inside the Tap container, `localhost` is the container itself, not the host. `host-gateway` maps `localhost` to the host machine, where the PDS is exposed on port 3000. Without this, every resync attempt logs a connection refused error.

**`TAP_DISABLE_ACKS: "true"`:** in development, fire-and-forget delivery is fine. Acks are for production reliability.

### `TAP_SIGNAL_COLLECTION` and why we're not using it

The [Statusphere tutorial](https://atproto.com/guides/statusphere-tutorial) uses `--signal-collection` to tell Tap to automatically discover any repo on the network that has records in a given collection. That's a useful production feature for indexing the full network.

It doesn't work against the local PDS. The discovery mechanism makes an authenticated API call to enumerate repos by collection, and the local PDS returns a 401 because the Tap service has no PDS credentials. The result is a continuous stream of error logs and no actual discovery.

For a local devnet with known users, explicit registration is simpler and more correct anyway: tell Tap exactly which repo to watch when a user logs in.

### One more Docker networking issue: Vite

Tap's webhook POST arrives at the Vite dev server with `Host: host.docker.internal:5173`. Vite 5+ blocks requests whose `Host` header doesn't match its bound address, returning a 403 before the Worker code runs. The fix is one line in `vite.config.mts`:

```typescript
server: {
  host: "127.0.0.1",
  allowedHosts: ["host.docker.internal"], // <-- this one is the new line to add
},
```

## Registering repos with Tap

Without `TAP_SIGNAL_COLLECTION`, Tap only watches repos it's been explicitly told about. The right time to register a user's repo is right after they log in — the OAuth callback is already the place where you know a user just authenticated:

```typescript
// src/app/api/oauth-callback.ts
export async function get({ request, response }: RequestInfo) {
  const client = await getOAuthClient();
  const { session } = await client.callback(new URL(request.url).searchParams);

  await sessionStore.save(response.headers, { did: session.did });

  try {
    await fetch(`${env.ATPROTO_TAP_URL}/repos/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dids: [session.did] }),
    });
  } catch {
    // Tap may not be running. Non-fatal: the feed just won't update live.
  }

  response.headers.set("Location", "/");
  return new Response(null, { status: 302, headers: response.headers });
}
```

`ATPROTO_TAP_URL: "http://localhost:2480"` goes in `wrangler.jsonc`. The call is wrapped in try/catch because Tap isn't running in production deployments — the feed simply won't update live, which is the correct graceful degradation.  Although there are several places the code in this blog series needs tweaks before going to prod.  More on that later. 

## The webhook endpoint

The `@atproto/tap` npm package ships a `parseTapEvent` helper that validates and parses the JSON body Tap POSTs:

```typescript
import { parseTapEvent } from "@atproto/tap";
import type { LexValue } from "@atproto/lex";

export async function post({ request }: RequestInfo): Promise<Response> {
  const body = await request.json();
  const event = parseTapEvent(body as LexValue);

  if (event.type !== "record" || event.collection !== "xyz.statusphere.status") {
    return new Response("ok");
  }

  if (event.action === "delete") {
    statusStore.delete(event.did);
  } else {
    const handle = await resolveHandle(event.did);
    statusStore.set(event.did, {
      did: event.did,
      handle,
      status: event.record?.status as string,
      updatedAt: new Date().toISOString(),
    });
  }

  pushToSseClients(Array.from(statusStore.values()));
  return new Response("ok");
}
```

`parseTapEvent` covers two event types: `record` (create, update, delete for a specific record) and `identity` (handle changes, account status). We only care about `record` events for our collection.

The handle resolution is a best-effort `describeRepo` call to the PDS (the DID is guaranteed, the handle is display metadata).

## In-memory state and SSE

The statuses are stored in a module-level Map:

```typescript
export const statusStore = new Map<string, StatusEntry>();
export const sseClients = new Set<ReadableStreamDefaultController<Uint8Array>>();
```

Module-level state in a Cloudflare Worker is shared within a single isolate for the lifetime of that isolate. In dev mode that's the duration of the `pnpm dev` session. It's not shared across isolates in a multi-worker production deployment, and it doesn't survive restarts. That's intentional for this post — we're demonstrating the event-driven pattern, not the persistence layer.

The SSE endpoint returns a streaming response and registers the controller:

```typescript
export function get(): Response {
  const encoder = new TextEncoder();
  let ctrl: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      ctrl = controller;
      sseClients.add(ctrl);
      const all = Array.from(statusStore.values());
      ctrl.enqueue(
        encoder.encode(`event: statuses\ndata: ${JSON.stringify(all)}\n\n`)
      );
    },
    cancel() {
      sseClients.delete(ctrl);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
```

When the webhook fires, the handler calls `ctrl.enqueue()` on all registered controllers to push the updated list to every open browser connection.

### The workerd compatibility flag

Cloudflare's workerd runtime enforces strict request context isolation. When the SSE GET response starts streaming, workerd marks that request as completed. When the webhook POST later calls `ctrl.enqueue()`, it's operating on a stream from a different (now-completed) request context, and workerd cancels the continuation by default.

The fix is one line in `wrangler.jsonc`:

```jsonc
"compatibility_flags": ["nodejs_compat", "no_handle_cross_request_promise_resolution"]
```

`no_handle_cross_request_promise_resolution` tells workerd not to detect and cancel these cross-request continuations. The SSE push proceeds normally.

## The client component

A `"use client"` component opens an `EventSource` connection and updates state on each event:

```typescript
"use client";

export function StatusFeed({ initialStatuses }: { initialStatuses: StatusEntry[] }) {
  const [statuses, setStatuses] = useState(initialStatuses);

  useEffect(() => {
    const es = new EventSource("/api/statuses/sse");
    es.addEventListener("statuses", (e) => {
      setStatuses(JSON.parse(e.data));
    });
    return () => es.close();
  }, []);

  // render list...
}
```

`initialStatuses` is passed from the server-rendered page — whatever is in the store at the moment of the page render. The `EventSource` takes over from there, receiving push updates without polling.

The home page drops the old `StatusSection` (which included the direct PDS read) and replaces it with `StatusPicker` for writes and `StatusFeed` for the live display. The current status shown in the picker now comes from `statusStore` rather than a PDS round-trip.

## Setup

```sh
git checkout post/05-tap-sync
pnpm install
pnpm docker:up
pnpm dev
```

Log in with `alice.devnet.test` / `alice-devnet-pass` at `http://127.0.0.1:5173`. Pick a status — the feed below updates in about a second as the event travels through the firehose and back.

If the feed doesn't update, check `docker compose logs -f tap`. You should see a `POST /webhooks/tap` entry with `status:200` shortly after picking a status. If that's missing, the most likely cause is that the sign-in happened before the dev server was running — the `/repos/add` call in the OAuth callback would have failed silently. Sign out and sign back in to re-register with Tap.
