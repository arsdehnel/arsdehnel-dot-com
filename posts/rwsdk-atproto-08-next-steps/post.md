---
title: "Where to Go From Here"
excerpt: "The series ends here but the app has gaps worth knowing about before shipping. Here's what to fix for production, how to connect to the real atmosphere, and where to keep reading."
thumbnail: thumbnail.png
date: '2026-10-15T21:00:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

Post 7 closed the loop — you have a working AppView that indexes records from multiple users and serves a public feed. This post covers what to know before taking it further: two production gaps in the current code, how to connect to the real Bluesky network, and where to go for deeper reading.

## Production gaps

### Tap can't run on a Cloudflare Worker

In development, Tap runs as a local process alongside the Worker. The Worker just receives webhooks — that part is fine for production. Tap itself is not.

For the Cloudflare-aware reading the straightforward-sounding fix might be to move Tap into a Durable Object. Durable Objects support WebSocket connections with hibernation, which sounds like it fits. The catch is direction: DO hibernation only works for *incoming* connections, where the DO is the server. Tap is a WebSocket *client* — it initiates an outgoing connection to the AT Protocol firehose relay. A DO holding an outgoing WebSocket connection cannot hibernate. It either stays alive continuously (burning compute) or the connection breaks when the DO sleeps.

The right answer is to run Tap on a long-lived host — a small VPS, Fly.io, Railway, or similar. Nothing in the Worker code changes. The Worker just needs Tap's webhook URL in production instead of `localhost`. The separation you set up in development is the correct production architecture; it just needs Tap deployed somewhere appropriate.

I'm working through my own preferred approach for this and will have a follow-up post when it's sorted.

### OAuth stateStore eventual consistency

The `NodeOAuthClient`'s `stateStore` is backed by KV (added in post 4). KV is eventually consistent — writes propagate globally but not instantaneously. If the `/oauth/login` handler and `/oauth/callback` handler land on Worker isolates in different regions within a short window, the callback's `get()` might find nothing before the write has propagated.

In practice this window is sub-second for most regions. It's a rare failure, and the user experience is just a failed login that works on retry. But if you need tighter guarantees, there are a few options in order of increasing complexity:

**Accept the rare failure.** For most apps this is the right call. Login is retryable, the window for this race condition is small, and adding complexity to solve an occasional edge case isn't always worth it.

**Retry in the callback.** If the `stateStore.get()` returns nothing, wait briefly and try again. A couple of retries with exponential backoff — 500ms, then 1.5s — would cover nearly all propagation lag without any meaningful impact on the user experience. No new bindings required, and it's entirely self-contained in the callback handler.

**Use a Durable Object for `stateStore`.** DOs provide strong consistency. A single DO instance handles all state reads and writes, so there's no propagation window. This adds a binding and a small amount of boilerplate, but it's the cleanest option if you genuinely need zero-failure-rate login for a high-traffic app.

## Connecting to the real atmosphere

The series used a local devnet throughout. The devnet is configured in `wrangler.jsonc` — those values are what make the Docker Compose setup work locally. Switching to production means replacing or removing those values and verifying the fallback paths in the code hold up. Cloudflare's [Workers deployment docs](https://developers.cloudflare.com/workers/get-started/deploy-a-worker/) and the [RedwoodSDK deployment guide](https://docs.rwsdk.com/deploy/) cover the deployment mechanics from there.

## Designing your own lexicons

The series used `xyz.statusphere.status` from Bluesky's Statusphere tutorial — a lexicon someone else defined. Building your own app means defining your own record types.

The AT Protocol [lexicon spec](https://atproto.com/specs/lexicon) covers the format. The main things to know going in: NSIDs follow reverse-DNS convention (`com.yourapp.recordtype`), so you'll want a domain you control. Lexicons can be published as AT Protocol records themselves, which lets other apps interoperate with your record types. Versioning is done through the NSID — there's no semver, a new major version is a new NSID.

## Further reading

- [AT Protocol docs](https://atproto.com/docs) — the spec, guides, and tutorials from the protocol team
- [Statusphere tutorial](https://atproto.com/guides/statusphere-tutorial) — the official AT Protocol tutorial this series builds on; worth reading alongside the series for the protocol team's framing
- [AT Protocol streaming data guide](https://atproto.com/guides/streaming-data) — the protocol team's overview of the firehose and Jetstream; good framing for understanding the subscription model
- [Feed generator starter kit](https://github.com/bluesky-social/feed-generator) — the official reference implementation for a feed generator (Node.js, not Workers); useful for seeing how the standard approach splits the firehose subscriber from the feed server
- [Tap](https://www.npmjs.com/package/@atproto/tap) — the firehose subscription tool used throughout this series
- [Jetstream](https://github.com/bluesky-social/jetstream) — a lighter-weight alternative to the full firehose relay; useful if you only need a subset of record types and want reduced message volume
- [RedwoodSDK docs](https://docs.rwsdk.com/) — framework docs, deployment, and more
