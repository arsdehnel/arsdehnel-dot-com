# arsdehnel.com

Repo for arsdehnel.com

## AT Protocol / Bluesky

Lexicon schemas are fetched and generated using `@atproto/lex`. The config lives in `lexicons.json`. Generated files go to `src/at/` which has its own `package.json` (`"type": "module"`) so that Node resolves the AT Protocol packages correctly — they are ESM-only and won't load from a CJS context.

To update or regenerate:

```sh
cd src/at

# Fetch/update lexicon schemas (writes to ./lexicons/)
pnpm exec lex install app.bsky.feed.post app.bsky.actor.profile

# Generate TypeScript from schemas
pnpm exec lex build --out lexicons

pnpm run prebuild:bluesky
```

## Thumbnails

The site expects square thumbnails.  Since I'm not a designer I don't have the tools or familiarity to create nice square images all the time.  I arrange crap in Lucidchart, export as png, and then run `sips` to make it square.

```sh
sips -p 520 520 --padColor FFFFFF ./posts/git-setup-for-ics/thumbnail.png --out ./posts/git-setup-for-ics/output-square.png
```

## Alt Text Generation

To help with accessibility there is a `node src/alt-text-generation.js` script that uses AWS Bedrock's Nova Premier model to generate alt text for the images in posts.  This is only ever intended to be run locally to avoid the complexity of AWS credential storage and access from a GitHub Action or anything like that.  The results are stored in `/src/image-alt-texts.json` so that we don't have to go fetch them again each time.  This file is then also pulled into the parsing of the posts as part of getting things published.  