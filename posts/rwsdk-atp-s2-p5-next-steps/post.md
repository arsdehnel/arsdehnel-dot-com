---
title: "RWSDK + ATP: Next Steps"
excerpt: The series ends with a production-ready app. Here's what to harden before shipping further, how to connect to the real Bluesky network, and where to keep reading.
thumbnail: thumbnail.png
date: '2026-10-28T22:06:00'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

[Post 4](./rwsdk-atp-s2-p4-deploy-prep) worked through how to get things deployed. This is the final post in the series, there's no new code here. Instead it is a look at what the series built, what's genuinely production-ready, what you'd want to revisit before shipping to real users at scale, and where to go from here in the AT Protocol ecosystem.

## What the series built

Through these two series and ten posts we've gone from a bare RWSDK worker to a deployed AT Protocol AppView running on Cloudflare Workers. The specific things that got built:

**Series 1 — local development foundation:**
- A local AT Protocol stack (PDS, PLC, Tap) running in Docker, approximating the Atmosphere without touching any production services
- OAuth 2.0 login against the local PDS using the loopback client
- Lexicon definition and TypeScript codegen for `xyz.statusphere.status`
- Writing records to the PDS using the `@atproto/lex` client
- Real-time sync via Tap webhooks → Durable Object → `useSyncedState` WebSocket push

**Series 2 — production-readiness:**
- Discoverable confidential OAuth client that works against any AT Protocol PDS
- Encrypted OAuth state in KV and encrypted OAuth sessions in a Durable Object, with key rotation support
- Token refresh serialization via the DO's lock mechanism
- D1 as a persistent relational store for status records, with Drizzle ORM
- AppView-style aggregate queries from D1
- DID document-based handle resolution (works with any PDS, not just the local one)
- Durable Object cold-start bootstrap from D1
- Server actions replacing the API route
- Wrangler environments for integration/staging/production

## What's production-ready

The foundations are solid. OAuth is secure, token storage is encrypted, handle resolution is correct, and the data layer supports real queries.

The `AppViewSyncState` DO seeds itself from D1 on cold start. The webhook handler is idempotent. Encryption key rotation works without downtime. The app degrades gracefully when Tap isn't running — the live feed just doesn't update.

## Things to think about before scaling

**The DO memory ceiling.** `AppViewSyncState` holds the full `statusMap` in memory. For a small community that's not an issue. If you're indexing millions of users you'd want to reconsider what lives in the DO versus what you query from D1 on demand.

**Tap in production.** The local Tap container is the one piece that doesn't have a direct Cloudflare Workers equivalent. [Post 4](./rwsdk-atp-s2-p4-deploy-prep) covers the three realistic options — a cron-based Worker, running Tap on Workers anyway, or a long-lived host — and the trade-offs between them.

**Observability.** The app has `console.error` calls but no structured observability. Before real traffic you'd want error tracking (Sentry, Honeybadger, or Cloudflare's built-in Workers analytics), request tracing, and metrics on webhook throughput and D1 query latency. Cloudflare's [Workers Observability](https://developers.cloudflare.com/workers/observability/) is a natural starting point since it requires no additional infrastructure.

## Connecting to the real Atmoshphere

Everything in Series 2 was designed to work against real AT Protocol infrastructure, not just the local dev stack. To actually connect:

1. Deploy with `APP_URL` set to your real Workers URL
2. Point your Tap instance at `wss://bsky.network` (the main Bluesky relay)
3. Log in with a real Atmosphere account — the OAuth flow uses the same discoverable client metadata

Because `xyz.statusphere.status` is a real lexicon in the AT Protocol network (published by the Statusphere tutorial authors), your app will index real status records as they appear on the firehose. You can also write a status from your own Atmosphere account and watch it show up in your deployed app.

## Where to go from here

These series focused on the combination of three technologies (AT Protocol, Cloudflare, and RedwoodSDK), each have a number of resources where you can go deeper.

### AT Protocol

The AT Protocol ecosystem is still relatively young but actively growing. A few places to go deeper:

- [atproto.com](https://atproto.com) — the main developer site. The [overview](https://atproto.com/guides/overview) and [AT Stack guide](https://atproto.com/guides/the-at-stack) give a solid mental model of how all the pieces fit together.
- [Statusphere tutorial](https://atproto.com/guides/statusphere-tutorial) — the official tutorial this series builds on. Worth reading in full if you haven't; it covers lexicons, AppViews, and the data model in more depth than we did here.
- [Lexicon docs](https://atproto.com/guides/lexicon) — everything about defining and publishing your own record types. The `@atproto/lex` CLI can install any published lexicon; Bluesky's own feed generators, labelers, and starter packs are all lexicon-defined and indexable.
- [Firehose / streaming data](https://atproto.com/guides/streaming-data) — how the relay-based event stream works at the protocol level.
- **Feed generators** — the Bluesky app lets users subscribe to custom algorithmic feeds. A feed generator is just an HTTP endpoint that returns a list of AT URIs. If you're already indexing records from the firehose, you're most of the way there.
- **Labels** — a first-class moderation primitive in AT Protocol. If your app surfaces community content, worth understanding early.
- [atproto.com/blog](https://atproto.com/blog) — protocol announcements and deeper technical writing from the Bluesky team, including the [Tap introduction](https://atproto.com/blog/introducing-tap) that covers the signal collection design behind what we used in this series.

### Cloudflare

All of the Cloudflare primitives this series used have thorough documentation:

- [Workers](https://developers.cloudflare.com/workers/) — the runtime foundation. The [how Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/) page is useful if the isolate model is new to you.
- [Durable Objects](https://developers.cloudflare.com/durable-objects/) — the coordination primitive behind the live status feed. Worth reading the full overview if you're building anything with real-time state.
- [D1](https://developers.cloudflare.com/d1/) — the SQLite-based relational database we used for persistence and aggregation.
- [KV](https://developers.cloudflare.com/kv/) — the eventually-consistent key-value store we used for OAuth state.
- [Workers Observability](https://developers.cloudflare.com/workers/observability/) — structured logging, tail workers, and analytics. The natural first stop before wiring in external error tracking.
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) — the full reference for `wrangler.jsonc`, including environments, bindings, and secrets.
- [Cloudflare Community](https://community.cloudflare.com) — active forum with a dedicated Workers section for questions that go beyond the docs.

### RedwoodSDK

- [rwsdk.dev](https://rwsdk.dev) — the main site with getting started guides and an overview of what the SDK provides.
- [docs.rwsdk.com](https://docs.rwsdk.com) — the full documentation. Key sections relevant to this series: [React Server Components](https://docs.rwsdk.com/core/react-server-components), [Server Actions](https://docs.rwsdk.com/core/server-actions/), and [Realtime / useSyncedState](https://docs.rwsdk.com/experimental/realtime).
- [GitHub — redwoodjs/sdk](https://github.com/redwoodjs/sdk) — the source. Worth watching for new releases; the SDK is under active development.

## The companion code

The [`post/series-2/05-next-steps`](https://github.com/arsdehnel/rwsdk-atproto-starter/tree/post/series-2/05-next-steps) branch is the final state of the series — a production-ready app you can fork and build on. The [series overview page](https://arsdehnel.github.io/rwsdk-atproto-starter/) has the full branch list.
