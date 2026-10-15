---
title: "RWSDK + ATP: AT Proto OAuth"
excerpt: AT Protocol OAuth is not a standard passport.js drop-in. Here's what makes it different, the Cloudflare Workers-specific hurdles, and what it takes to get a real Bluesky login working end to end.
thumbnail: thumbnail.png
date: '2026-10-14T13:30:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

[Post 1](https://arsdehnel.com/posts/rwsdk-atproto-01-first-read) showed that AT Protocol data is publicly readable with a plain fetch. That gets you pretty far for read-only apps, but to write records, read private data, or act on behalf of a user, you need OAuth. This is Post 2 of 8, and it's where the interesting complications start.

AT Protocol uses standard OAuth 2.0 under the hood, but pairing that with RWSDK there are a handful of rough edges when running inside Cloudflare's `workerd` runtime instead of Node.js. This post documents those edges and the decisions behind working around them.

## The flow

At a high level the exchange looks like this:

1. User submits their Bluesky handle. The Worker resolves it to a PDS, initiates a Pushed Authorization Request, and returns a redirect URL.
2. The browser redirects to `bsky.social`'s authorization page.
3. User approves. `bsky.social` redirects back to your callback URL with an authorization code.
4. The Worker exchanges the code for a session, saves the user's DID, and redirects home.

The Worker never sees the user's password. It ends up with an OAuth session it can use to make authenticated requests on behalf of the user.

## Before OAuth: session storage

Workers don't share memory across isolates. An in-memory store works within a single instance, but in production a different isolate handles the next request and finds nothing there. This isn't specific to AT Protocol — it's just how Workers work, and it's worth solving before adding any auth logic on top.

The fix is `defineDurableSession` from `rwsdk/auth`. It uses a Cloudflare Durable Object as the backing store — one consistent instance per user, regardless of which Worker instance handles the request. The DO class itself is small: three methods (`getSession`, `saveSession`, `revokeSession`) that read and write a `{ did }` record to `this.ctx.storage`. In `wrangler.jsonc`, register it using the newer `exports` config rather than the older `migrations` array:

```jsonc
"durable_objects": {
  "bindings": [{ "name": "USER_SESSION_DO", "class_name": "UserSession" }]
},
"exports": {
  "UserSession": { "type": "durable-object", "storage": "sqlite" }
}
```

`defineDurableSession` wraps that binding into a `sessionStore` with `load`, `save`, and `remove` that handle cookie signing automatically. In dev the signing key falls back to a built-in value — set `AUTH_SECRET_KEY` as a Worker secret before deploying.

## The OAuth client

The client comes from `@atproto/oauth-client-node`. Two options matter for `workerd`:

**`handleResolver` as a string URL.** The obvious choice is `AtprotoHandleResolverNode`, but it wraps every fetch with `safeFetchWrap`, which pulls in Node.js's `undici`. `undici` isn't available in `workerd`. Passing a plain string URL instead makes the client use a different resolver that calls `globalThis.fetch` — available everywhere.

**`buildAtprotoLoopbackClientMetadata`.** This sets `client_id` to `http://localhost/`, a special value that `bsky.social` recognizes for local development. No app registration, no hosted metadata endpoint required.

```typescript
const client = new NodeOAuthClient({
  handleResolver: "https://bsky.social",
  clientMetadata: buildAtprotoLoopbackClientMetadata({
    scope: "atproto",
    redirect_uris: ["http://127.0.0.1:5173/oauth/callback"],
  }),
  stateStore: { /* in-memory Map on globalThis */ },
  sessionStore: { /* in-memory Map on globalThis */ },
});
```

The `stateStore` and `sessionStore` on the client are worth distinguishing from the DO session we just set up. The DO session answers "which user is this request from?" — it stores `{ did }` and is keyed by a signed session ID cookie. The OAuth client's stores answer "what authenticated access do we have for this DID?" — they hold the actual tokens and DPoP key material, keyed by DID. They serve different purposes and use different keys, so they can't share the same DO instance.

For this post both client stores are in-memory Maps on `globalThis`. That means tokens are lost if the Worker restarts — a real limitation in production. It doesn't matter yet because we only fetch public records here, but it will matter in Post 4 when we need to make authenticated writes. At that point the OAuth token store will need its own durable backing, keyed by DID.

One detail: use `http://127.0.0.1:5173`, not `http://localhost:5173`. After approving access, `bsky.social` redirects to the exact redirect URI you registered. If the app is open at `localhost`, the callback lands on a different origin and the session won't be established.

## Workerd-specific gotchas

### `redirect: "error"` rejection

Cloudflare Workers rejects `redirect: "error"` in fetch options. The `@atproto` packages use this option pervasively as a safety net on outbound requests. The fix is a small Vite plugin that rewrites all occurrences at build time:

```typescript
function patchAtprotoRedirectError(): Plugin {
  return {
    name: "patch-atproto-redirect-error",
    transform(code: string, id: string) {
      if (id.includes("@atproto") || id.includes("atproto-labs")) {
        return code.replace(/redirect:\s*['"]error['"]/g, "redirect: 'follow'");
      }
    },
  };
}
```

This goes first in the Vite plugin list, before the Cloudflare and RedwoodSDK plugins.

### 401 log entries during token exchange

You'll see 401 responses in the Worker logs during the OAuth flow. These are not errors — they're the DPoP nonce handshake. DPoP (Demonstration of Proof of Possession) is the token binding mechanism AT Protocol OAuth uses. The PDS responds to the first token request with a 401 and a `DPoP-Nonce` header; the client retries with that nonce included in the proof and the exchange succeeds. It's entirely handled by `@atproto/oauth-client-node`. The 401s are just visible because the first attempt always has to fail before the nonce is known.

## The companion code

The `post/02-oauth` branch has the full implementation — the DO class, the OAuth client setup, four route handlers (`/oauth/login`, `/oauth/callback`, `/oauth/logout`, `/client-metadata.json`), and the session middleware in `worker.tsx`. Post 3 is the local devnet: Docker Compose, a local PDS, and the remaining gotchas that don't apply when you're hitting real `bsky.social`.
