---
title: "Your First AT Protocol Read"
excerpt: AT Protocol records are publicly readable over plain HTTP — no account, no auth, no magic. A single fetch call returns real data from the live network.
thumbnail: thumbnail.png
date: '2026-10-14T09:00:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

I've been nerding out on the [AT Protocol](https://atproto.com/) recently mostly around learning what it is, how it works, and why it is awesome.  When it came time to try my hand at _building_ on the protocol, I found things a little rockier than I'd hoped.  While many aspects of the protocol are the same as any traditional web app there are some key differences and it was hard to figure out how to make the mental shift. This is the first post in a series walking through my own experience of taking a framework I'm familiar with and getting something usable built on the protocol.  

While many things about the AT protocol were mind-bending to think about perhaps the thing that surprised me most is that the data is just... public. No API key, no OAuth dance, no account required. You can make a plain `fetch` call to a URL right now and get real records back from real people. That's where I wanted to start this series — with the simplest possible thing that actually works.

## The series

As mentioned, this is Post 1 of an 8-part series building a real AT Protocol app on [RedwoodSDK](https://rwsdk.dev) and [Cloudflare Workers](https://developers.cloudflare.com/workers). Each post has a companion branch in [the starter kit repo](https://github.com/arsdehnel/rwsdk-atproto-starter). By the end we'll have OAuth login against real Bluesky accounts, a typed lexicon client for reading and writing records, and a basic AppView that indexes data from other users. But none of that matters until you understand what a record even is.  The series tries to add these new terms and concepts only as they are needed to avoid overwhelming you with learning before you've built anything.  

## A little vocab

Two terms you'll need for this post:

**PDS** (Personal Data Server) — this is where your AT Protocol records actually live. Bluesky operates one at `bsky.social`. When you sign up for Bluesky, your posts, follows, and likes are stored as records on a PDS. The important thing here is that these records are publicly accessible over HTTP — no auth required to read them.

**XRPC** — the RPC protocol AT Protocol uses to talk to a PDS. It's just HTTP. Endpoints follow the pattern `https://<pds>/xrpc/<nsid>` where the NSID is a reverse-domain identifier for the method, like `com.atproto.repo.listRecords`. If you've ever worked with a REST API this will feel familiar, it just has its own naming conventions.

## The fetch

Here's the whole thing:

```typescript
const response = await fetch(
  "https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=bsky.app&collection=app.bsky.feed.post&limit=3"
);
const data = await response.json();
```

That's it. `repo` is the account you're reading from — you can use a handle like `bsky.app` or a DID directly. `collection` is the type of records you want. `limit` is self-explanatory. [Open that URL in a browser](https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=bsky.app&collection=app.bsky.feed.post&limit=3) and you'll see the same JSON the companion app is rendering.

## The response

The response comes back as a `records` array. Each entry looks like this:

```json
{
  "uri": "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxp32vwd4c24",
  "cid": "bafyreihqdcbrbqnvc5wsbnnfyhh7pq73ckvuxv4532f5ustkvvqkfbvtju",
  "value": {
    "$type": "app.bsky.feed.post",
    "text": "...",
    "langs": ["en"]
  }
}
```

A few things worth understanding here:

**AT URI** — the `uri` field is the globally unique address of this record in the AT Protocol network. It breaks down as `at://<did>/<collection>/<rkey>`. The DID is the account identifier. The collection is the record type. The **rkey** (record key) is the unique ID of this specific record within that collection — in this case `3mxp32vwd4c24`.

**CID** — the content identifier. This is a hash of the record's content, which means it's also a proof of integrity. If the content changes, the CID changes. You'll see CIDs used throughout AT Protocol wherever something needs to reference a specific, immutable version of a record.

**`$type`** — every record has a `$type` field that matches the collection it lives in. `app.bsky.feed.post` is a Bluesky post. Later in the series we'll use lexicons to work with these types in a more structured way, but for now it's just a string in the JSON.

## The companion code

The starter kit puts the fetch directly in the page component, which runs server-side on the Worker:

```typescript
export async function Home(_: RequestInfo) {
  const response = await fetch(ENDPOINT);
  const records = await response.json();

  return <BlueskyFeed endpoint={ENDPOINT} records={records} />;
}
```

No client-side loading state, no effect hooks — the data is in the HTML before it hits the browser. `BlueskyFeed` is a `"use client"` component that renders the JSON, which is also where its scoped CSS lives. The page itself is a server component with no style dependencies of its own.

Check out the `post/01-first-read` branch to see the full code. Post 2 is where things get more interesting — AT Protocol OAuth against a real Bluesky account.
