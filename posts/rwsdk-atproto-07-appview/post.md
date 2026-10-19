---
title: "RWSDK + ATP: AppView"
excerpt: "Post 5 introduced two read patterns — optimistic update for your own writes, relay for everyone else's. This post wires them both up, opens the status board to the public, and completes the AppView."
thumbnail: thumbnail.png
date: '2026-10-15T18:00:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

[Post 5](https://arsdehnel.com/posts/rwsdk-atproto-05-tap-sync) introduced two complementary patterns for reads in AT Protocol apps: an optimistic update for your own writes (fast, no relay delay), and the relay/firehose path for everyone else's writes (the full picture, including external apps). Post 5 built the relay side. This post adds the optimistic update and opens the status board to unauthenticated visitors.

## Optimistic update for your own writes

When you write a record to the PDS and it succeeds, you already have the data — you sent it. The relay will deliver it back eventually, but there's no reason to wait. The fix is to write into D1 immediately after the PDS confirms the write:

```typescript
const res = await lexClient.put(
  statusSchema,
  { status: emoji, createdAt: new Date().toISOString() as DatetimeString },
  { rkey: "self" }
);

// We already have the data — don't wait for the relay
await db
  .insert(statuses)
  .values({ did, handle, status: emoji, updatedAt: new Date().toISOString() })
  .onConflictDoUpdate({
    target: statuses.did,
    set: { status: emoji, updatedAt: new Date().toISOString() },
  });

const allStatuses = await db.select().from(statuses);
pushToSseClients(allStatuses);
```

The Tap webhook will still arrive for this write — the relay doesn't know you already indexed it. That's fine: the upsert is idempotent, so the second write is a no-op. Both paths converge to the same D1 row.

The benefit is immediate: pick a status and the feed updates instantly. The relay path kicks in for other users' writes and for any external app writing `xyz.statusphere.status` records that never touched your UI.

## Opening the status board

The `StatusFeed` component was rendered inside `{did ? ... : ...}` — only visible when signed in. Moving it outside that conditional makes the board public:

```tsx
// before: board only visible when logged in
{did ? (
  <>
    <StatusPicker ... />
    <StatusFeed initialStatuses={...} />
  </>
) : (
  <LoginForm />
)}

// after: board always visible
{did ? (
  <StatusPicker ... />
) : (
  <LoginForm />
)}

<section>
  <StatusFeed initialStatuses={await db.select().from(statuses)} />
</section>
```

The D1 query hasn't changed. There's no WHERE clause — it always returned all rows. The only thing that changed is who can see them.

## The three-window demo

1. Normal window: sign in as `alice.devnet.test` / `alice-devnet-pass`, set a status — notice the feed updates instantly
2. Incognito window: sign in as `bob.devnet.test` / `bob-devnet-pass`, set a different status — alice's window updates via SSE
3. Open any window without logging in — the status board shows both

The instant update in window 1 is the optimistic path. The cross-window update is the relay path. The third window being readable at all is the public board.

## Status board, not feed

The D1 schema stores one row per DID, updated in place. This isn't a feed in the chronological sense — it's a snapshot of the latest status per user. "Feed" implies a stream of events; what this renders is a leaderboard of current states. If you wanted a true feed you'd append rows instead of upsert and query by recency. The upsert model is right for this use case — you care about who has what status now, not the history.

## You're an AppView

This is the pattern AT Protocol calls an AppView:

1. Subscribe to the firehose (Tap handles this, subscribing to the PDS relay)
2. Filter for the record types you care about (`xyz.statusphere.status`)
3. Index them into your own database (D1, upserted by DID)
4. Serve your own query interface (the public status board)

Bluesky's `app.bsky.app` does exactly this — subscribes to the global Relay, indexes posts, likes, follows, and profiles from every PDS on the network, and serves them through its own API. The only difference is scale.

The full data path, with both read patterns in place:

```
User picks status in your app
  → PDS confirms the write
  → Optimistic update: Worker writes to D1 immediately
  → SSE pushes updated board to all connected browsers

Meanwhile on the relay side:
  → PDS emits firehose event
  → Tap delivers POST /webhooks/tap
  → Worker upserts into D1 (idempotent — same row, same data)
  → SSE push (no visible change, already up to date)

Other user or external app writes a status
  → Relay path only (optimistic path isn't available — not your write)
  → Tap delivers POST /webhooks/tap
  → Worker upserts into D1
  → SSE pushes updated board
```

You built each step in this chain one post at a time. This is where the full picture connects.

## Setup

```sh
git checkout post/07-appview
pnpm install
pnpm docker:up
pnpm migrate:dev
pnpm dev
```

Open `http://127.0.0.1:5173`. Use the three-window demo above to populate the board with multiple users.

If you see duplicate rows for the same user, the devnet was restarted and recreated the account with a new DID. This only happens locally — real AT Protocol DIDs are permanent. Clear the local database and re-run migrations:

```sh
rm -rf .wrangler/state/v3/d1 && pnpm migrate:dev
```
