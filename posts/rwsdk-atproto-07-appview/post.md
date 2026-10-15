---
title: "RWSDK + ATP: AppView"
excerpt: "The data model from post 6 already handles multiple users. The missing piece was making the status board visible without a login — one structural change that turns your app into a real AppView."
thumbnail: thumbnail.png
date: '2026-10-15T18:00:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

The change in this post is smaller than post 6 promised. That post ended with:

> Post 7 connects the app to the broader firehose to build a real cross-user feed.

The D1 schema from post 6 already has no user filter. The webhook handler upserts by DID — every user who writes a status record gets their own row. The multi-user indexing was already there. The missing piece was one structural decision in `home.tsx`: the status board was inside the auth conditional, invisible to anyone who wasn't signed in.

Moving it out is the entire code change for this post.

## What changed

The `StatusFeed` component was rendered inside `{did ? ... : ...}` — the logged-in branch. Logged-out visitors saw a placeholder that said "Sign in above to see your recent posts." Moving the section outside that conditional makes the board public:

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

1. Normal window: sign in as `alice.devnet.test` / `alice-devnet-pass`, set a status
2. Incognito window: sign in as `bob.devnet.test` / `bob-devnet-pass`, set a different status
3. Open any window without logging in — the status board shows both

That third window is the point. The board isn't gated on session state. Anyone who loads the page sees the full index.

## Status board, not feed

The D1 schema stores one row per DID, updated in place:

```typescript
await db
  .insert(statuses)
  .values({ did, handle, status, updatedAt })
  .onConflictDoUpdate({ target: statuses.did, set: { ... } });
```

This isn't a feed in the chronological sense — it's a snapshot of the latest status per user. "Feed" implies a stream of events; what this renders is a leaderboard of current states. If you wanted a true feed you'd append rows instead of upsert and query by recency. The upsert model is right for this use case — you care about who has what status now, not the history.

## You're an AppView

This is the pattern AT Protocol calls an AppView, and there's nothing special about it:

1. Subscribe to the firehose (Tap handles this, subscribing to the PDS relay)
2. Filter for the record types you care about (`xyz.statusphere.status`)
3. Index them into your own database (D1, upserted by DID)
4. Serve your own query interface (the public status board)

Bluesky's `app.bsky.app` does exactly this — subscribes to the global Relay, indexes posts, likes, follows, and profiles from every PDS on the network, and serves them through its own API. The only difference is scale.

The full data path:

```
User picks status
  → PDS writes xyz.statusphere.status record
  → Tap sees it on the firehose
  → Tap POSTs to /webhooks/tap
  → Worker upserts into D1
  → SSE pushes updated board to all connected browsers
  → Anyone watching sees the change
```

You built each step in this chain one post at a time. This post is the one where the full picture connects.

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
