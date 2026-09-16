---
title: Running a bun-based CLI locally in a pnpm project
excerpt: Working on changes to an open-source CLI via my local fork got a little gnarly. Figured others might hit this pattern, too.
thumbnail: bun-and-pnpm.png
date: '2026-09-16'
categories:
  - development
---

I needed to work on a CLI tool that's built with `bun`, while using it inside a project that's managed with `pnpm`. Instead of publishing a package every time I changed something, I just linked the local source straight in.  Seems straightforward enough but I hit a couple things so I thought I'd throw this out there for others that might hit them, too.

## The idea

`pnpm`'s docs put it simply:

> When you use `pnpm link`, the linked package is symlinked from the source code. You can modify the source code of the linked package, and the changes will be reflected in your project.

So the CLI's source lives wherever it lives (in my case, a local fork), and instead of installing it from a registry, my project just points at that folder.

## Setting it up

In the CLI's own directory (wherever its `package.json` is), install it globally and start it in watch mode:

```bash
pnpm add -g .
bun watch
```

That registers the CLI globally as a symlink back to the source, and `bun watch` keeps rebuilding it as I make changes.

## Using it

From my project, I just run the CLI like normal:

```bash
my-cli --arg-1 --dry-run --verbose
```

Any edits I make to the CLI's source get picked up automatically, no reinstall or relink needed.

## One gotcha

Because the CLI and the project use different package managers, dependencies for the CLI's source aren't installed automatically as part of the project's install step — I have to install those manually in the CLI's own directory. Worth remembering if things suddenly start throwing "module not found" errors after a fresh clone.

That's it — a small trick, but handy any time you need to mix package managers across a local project and a tool you're actively hacking on.
