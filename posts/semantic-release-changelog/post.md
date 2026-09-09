---
title: Semantic Release Changelog Config
excerpt: >-
  Had to get Semantic Release setup to go from just git tags to a proper changelog with artifacts.  Given the nuance of the process it seemed good to document and share.
thumbnail: hero.DXMsy2Hq_Z1CxQaX.webp
date: "2026-09-08"
categories:
  - development
---

# Getting Semantic Release to Actually Do the Useful Stuff

## The Problem

I have a [side project](https://github.com/arsdehnel/rwsdk-jeopardy) that I have been tinkering on quite a bit recently.  In that project I had conventional commits wired up for a while — commitlint enforces the format on every commit via a Husky hook, and semantic-release runs on every push to `main`. Releases were being created: git tags, GitHub releases, the whole thing. Looked great from the outside.

But the changelog was empty. `CHANGELOG.md` didn't exist. `package.json` still said `1.0.0`. The version number in the GitHub release was correct, but nothing in the repo reflected it. The releases were technically happening but none of the artifact that makes them useful to a developer looking at the repo was being produced. 

The setup was doing the ceremonial part of releasing without doing the useful part.

## The Solution

The goal was to create a more meaningful release process with artifacts that correlate to what was changed and link to why those changes were made.

1. Generate and update `CHANGELOG.md` with each release
2. Bump the version in `package.json` in sync with the git tags and GitHub release process
3. Commit those changes back to `main` as part of the release
4. Support dry runs — both locally and on every PR to `main` — so you can see what the next release would look like before it happens

---

## Implementation

### The `release.config.js` Configuration

The initial thing I was missing was the config file telling `semantic-release` what to do as part of a release. The most common format you'll see in docs and examples is `.releaserc.json` — a static JSON file. That works fine for CI, but falls apart as soon as you want to run a local dry run. Probably it is possible to make it work but a JS file was way more doable. 

The problem is that a local dry run has different requirements than a CI release: you don't have a `GITHUB_TOKEN`, you might be on a feature branch that isn't in the `branches` list, and you don't want plugins that write to the repo or publish to npm actually doing anything. With a static JSON config you have to work around all of that at the call site, passing CLI flags and environment variables to try to get things lined up.

The cleaner solution I came across first [in this blog post](https://blog.elantha.com/semantic-release-local-dry-run) is to make the config file aware of how it's being invoked. `semantic-release` supports `release.config.js` as a config format, and since this project has `"type": "module"` in `package.json`, that means ESM. The file exports different configs based on whether `--dry-run` is in `process.argv` — local dry runs get a lightweight local-only config, CI gets the full plugin list.

The `getLocalRepoUrl()` function is the key piece for local dry runs. By pointing `repositoryUrl` at the local `.git` directory, semantic-release reads from the local repo instead of hitting GitHub — no token required, no network call, no remote branch validation. `getCurrentBranch()` handles the branch problem automatically: whatever branch you're on locally is what gets used.

While [the default plugins list](https://semantic-release.org/usage/configuration/#plugins) includes 4 of the 5 CI plugins below, I wanted to tweak a couple settings on the existing ones in addition to adding the changelog plugin. A quick list of plugins that I have enabled and why:

- **Commit Analyzer:** Required for really any useful `semantic-release` process, this analyzes the commits since the last release. For my use case I configured it to use the [Conventional Commits](https://conventional-changelog.js.org/presets/conventional-commits/) preset which matches the default. I just tweaked the `refactor` commits to create a patch release rather than the default of `refactor` creating no release.

    ```js
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [{ type: 'refactor', release: 'patch' }],
      },
    ]
    ```

- **Release Notes Generator:** Another default plugin, this converts those commits into structures by type as noted in [the package docs](https://github.com/semantic-release/release-notes-generator). The particular preset that I'm using is the [conventionalcommits preset](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits) which is an implementation of [the conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. I really like this pattern but the preset has an unfortunate behavior of the `types` [replacing the default list entirely](https://conventional-changelog.js.org/presets/conventional-commits/options/#types) rather than merging in these settings as overrides. So I included my full mapping to get that `refactor` pulled out instead of hidden (which is the default).

    ```js
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'perf', section: 'Performance Improvements' },
            { type: 'revert', section: 'Reverts' },
            { type: 'refactor', section: 'Code Refactoring' },
          ],
        },
      },
    ]
    ```

- **Changelog:** This is the one I actually needed to add for my particular change. The default settings [from the package docs](https://github.com/semantic-release/changelog) are good enough for me so I just needed the plugin invoked.

    ```js
    '@semantic-release/changelog'
    ```

- **NPM:** This is another default plugin I just need to keep in the list. Since I have `private: true` in my `package.json` I can skip explicitly setting `npmPublish: false` here [as noted in their docs](https://github.com/semantic-release/npm).

    ```js
    '@semantic-release/npm'
    ```

- **git:** Manages the `git` commit operation for writing artifacts of the release back to the repository. Per [the package docs](https://github.com/semantic-release/git) I just need to tell it which files I want committed and the commit message template.

    ```js
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'pnpm-lock.yaml', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}',
      },
    ]
    ```

- **GitHub:** Wrapping it all up I use [the GitHub plugin](https://github.com/semantic-release/github) to create the GitHub Release.

    ```js
    '@semantic-release/github'
    ```

So the full `release.config.js`:

```js
import { execSync } from 'node:child_process';

export default isDryRun() ? getDryRunConfig() : getCIConfig();

function isDryRun() {
  return process.argv.includes('--dry-run');
}

function getDryRunConfig() {
  return {
    repositoryUrl: getLocalRepoUrl(),
    branches: [getCurrentBranch()],
    plugins: [
      [
        '@semantic-release/commit-analyzer',
        {
          preset: 'conventionalcommits',
          releaseRules: [{ type: 'refactor', release: 'patch' }],
        },
      ],
      [
        '@semantic-release/release-notes-generator',
        {
          preset: 'conventionalcommits',
          presetConfig: {
            types: [
              { type: 'feat', section: 'Features' },
              { type: 'fix', section: 'Bug Fixes' },
              { type: 'perf', section: 'Performance Improvements' },
              { type: 'revert', section: 'Reverts' },
              { type: 'refactor', section: 'Code Refactoring' },
            ],
          },
        },
      ],
    ],
  };
}

function getCIConfig() {
  return {
    repositoryUrl: 'https://github.com/arsdehnel/rwsdk-jeopardy',
    branches: ['main'],
    plugins: [
      [
        '@semantic-release/commit-analyzer',
        {
          preset: 'conventionalcommits',
          releaseRules: [{ type: 'refactor', release: 'patch' }],
        },
      ],
      [
        '@semantic-release/release-notes-generator',
        {
          preset: 'conventionalcommits',
          presetConfig: {
            types: [
              { type: 'feat', section: 'Features' },
              { type: 'fix', section: 'Bug Fixes' },
              { type: 'perf', section: 'Performance Improvements' },
              { type: 'revert', section: 'Reverts' },
              { type: 'refactor', section: 'Code Refactoring' },
            ],
          },
        },
      ],
      '@semantic-release/changelog',
      '@semantic-release/npm',
      [
        '@semantic-release/git',
        {
          assets: ['package.json', 'pnpm-lock.yaml', 'CHANGELOG.md'],
          message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}',
        },
      ],
      '@semantic-release/github',
    ],
  };
}

function getLocalRepoUrl() {
  const topLevelDir = execSync('git rev-parse --show-toplevel').toString().trim();
  return `file://${topLevelDir}/.git`;
}

function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
}
```

### Semantic Release's Documentation Gap

For what seems like a very common use case — "I have a private/internal project, I want a changelog and version bump but I don't want to publish to npm" — the semantic-release docs don't have a clear end-to-end example. They do have a [community shareable configurations](https://semantic-release.org/extending/shareable-configurations-list/) section which seems like the place for such a contribution.  But without it you end up piecing together the `@semantic-release/npm` docs (for `npmPublish: false`), the `@semantic-release/git` docs (for committing artifacts back), and the `@semantic-release/changelog` docs independently.

There's also a genuinely confusing inconsistency between how the two main plugins handle customization of defaults:
- `@semantic-release/commit-analyzer` is documented to use your custom `releaseRules` as an extension: if a commit matches one of your rules, that rule wins; if nothing matches, it falls back to the preset defaults. The docs are explicit about this. So you only need to specify the rules that differ from the defaults — in this case, one rule to make `refactor` commits trigger a patch release.

- `@semantic-release/release-notes-generator` is the opposite: providing a `types` array in `presetConfig` replaces the defaults entirely. This is documented, but finding that documentation requires following a chain: semantic-release → [`@semantic-release/release-notes-generator`](https://github.com/semantic-release/release-notes-generator) → [`conventional-changelog-conventionalcommits`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits) → [its documentation site](https://conventional-changelog.js.org/presets/conventional-commits/options/#types), where a callout reads: "Setting types overrides the default list entirely, so include every type you want recognized. To tweak the defaults instead, map over the exported DEFAULT_COMMIT_TYPES."

  Each layer is correctly documenting its own behavior — the replace semantics genuinely belong to the conventional-changelog preset, not to the release-notes-generator wrapper. But from a configuration standpoint, you're working in a semantic-release config file, configuring a semantic-release plugin, and the behavior that bites you is owned three levels down by a sub-library of a plugin. The config that was originally copied into this project had specified `feat`, `fix`, and `perf` in the types array alongside `refactor` — not because those needed customizing, but because without them they'd disappear from the changelog entirely. It was accidentally doing the right thing for the wrong reason, and silently dropped `revert` from the changelog in the process.

  This asymmetry — extend in one plugin, replace in the other — is the kind of thing that's very easy to get wrong when assembling config from examples online. Hopefully this saves someone else the detective work.

### The Versioning Problem

Semantic release's own docs [recommend running via `npx` rather than installing as a devDependency](https://semantic-release.org/usage/running/#using-npx-recommended). With pnpm that means `pnpm dlx`. The logic is reasonable — it's a release tool, not a build dependency, and keeping it out of your lockfile means you're not pulling it into every developer's environment.

The problem is that `pnpm dlx` only handles one package at a time unless you use `--package` flags for each one. And semantic-release's plugins aren't bundled with it — they're separate packages that also need to be available. So the full invocation looks like this:

```sh
pnpm dlx \
  --package=semantic-release@25 \
  --package=@semantic-release/commit-analyzer@13 \
  --package=@semantic-release/release-notes-generator@14 \
  --package=@semantic-release/changelog@7 \
  --package=@semantic-release/npm@13 \
  --package=@semantic-release/git@11 \
  --package=@semantic-release/github@12 \
  --package=conventional-changelog-conventionalcommits@9 \
  semantic-release
```

As you can imagine this leads to a bit of fragility in getting the right versions of all of those that play nicely with each other.  For example when putting this together one version incompatibility I ran into: `@semantic-release/release-notes-generator@14` depends on `conventional-changelog-writer@8`, but `conventional-changelog-conventionalcommits@10` added a hard requirement for `conventional-changelog-writer@9`. Using `@10` of the preset with `@14` of the generator produces a cryptic handlebars template error at runtime. The fix is to pin `conventional-changelog-conventionalcommits` to `@9`, which is compatible with `conventional-changelog-writer@8`. This will presumably resolve itself when `release-notes-generator` ships a version that pulls in writer@9, but for now the versions need to be matched manually.

The docs [recommend pinning to major versions](https://semantic-release.org/usage/running/#notes) so you don't get surprise breaking changes from automatic updates. While that makes sense it means these version pins aren't in your `pnpm-lock.yaml`. A tool like Renovate won't automatically pick them up without extra configuration to scan scripts or other files for version references. That's a known limitation worth tracking.

The verbosity of this is genuinely clunky. It doesn't feel like an idiomatic Node.js pattern. But it's the approach the maintainers recommend, so I'm going with it.

### The Shared Script

With the pnpm dlx invocation living in three places — `package.json` for local dry runs, the release workflow, and the dry-run PR workflow — any version bump would need to be changed in three files. That's the kind of thing that gets missed. The fix was a small shell script at `scripts/semantic-release.sh`:

```sh
#!/bin/sh
set -e

pnpm dlx \
  --package=semantic-release@25 \
  --package=@semantic-release/commit-analyzer@13 \
  --package=@semantic-release/release-notes-generator@14 \
  --package=@semantic-release/changelog@7 \
  --package=@semantic-release/npm@13 \
  --package=@semantic-release/git@11 \
  --package=@semantic-release/github@12 \
  --package=conventional-changelog-conventionalcommits@9 \
  semantic-release "$@"
```

The `"$@"` at the end forwards any arguments through, so callers just append whatever flags they need. All three callers become one-liners:

```json
// package.json
"release:dry-run": "./scripts/semantic-release.sh --dry-run --no-ci"
```

```yaml
# release.yaml
run: ./scripts/semantic-release.sh

# release-dry-run.yaml
run: ./scripts/semantic-release.sh --dry-run --no-ci 2>&1 | tee /tmp/release-dry-run.txt
```

A shell script in a TypeScript project feels slightly out of place, but sometimes all you need is bash.

### The Branch Protection Problem

`@semantic-release/git` needs to push a commit back to `main`. If main has branch protection rules that require pull request reviews, that push will fail regardless of what token you use, because the protection applies to everyone unless they're explicitly configured as a bypass actor.

The options are roughly:

1. **Add a bypass actor**: Add `github-actions[bot]` or a specific user as a bypass actor in the branch protection settings. This is surgical but gives that actor broad bypass across all rules, not just for release commits.
2. **Use a PAT with admin privileges**: An admin-owned PAT can bypass protection if the "allow admins to bypass" setting is enabled. Same broad-bypass concern.
3. **Temporarily disable protection**: Save the current protection config, disable it, run the release, re-enable it. More steps, but it scopes the bypass to exactly the release window and doesn't grant any actor permanent bypass rights.

This project uses option 3. The release workflow saves the protection config to a temp file, disables it, runs semantic-release, then re-enables it — with `if: always()` on the re-enable step so it runs even if the release itself fails:

```yaml
- name: Save branch protection
  env:
    GITHUB_TOKEN: ${{ secrets.JEOPARDY_WORKFLOW_AUTOMATION }}
  run: |
    curl --fail-with-body -s \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/repos/arsdehnel/rwsdk-jeopardy/branches/main/protection \
    | jq '{
        restrictions: ...,
        required_status_checks: ...,
        required_pull_request_reviews: ...,
        ...
      }' > /tmp/branch-protection.json

- name: Disable branch protection
  env:
    GITHUB_TOKEN: ${{ secrets.JEOPARDY_WORKFLOW_AUTOMATION }}
  run: |
    curl -X PUT \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/repos/arsdehnel/rwsdk-jeopardy/branches/main/protection \
      -d '{"restrictions":null,"required_status_checks":null,"enforce_admins":false,"required_pull_request_reviews":null}'

- name: Semantic Release
  env:
    GITHUB_TOKEN: ${{ secrets.JEOPARDY_WORKFLOW_AUTOMATION }}
    HUSKY: 0
  run: ./scripts/semantic-release.sh

- name: Re-enable branch protection
  if: always()
  env:
    GITHUB_TOKEN: ${{ secrets.JEOPARDY_WORKFLOW_AUTOMATION }}
  run: |
    curl -X PUT \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/repos/arsdehnel/rwsdk-jeopardy/branches/main/protection \
      -d @/tmp/branch-protection.json
```

The `HUSKY: 0` env var disables Husky hooks during the release commit. Without it, the commit-msg hook would run on the release commit and potentially fail or prompt for input in a non-interactive environment.

It's a clunky pattern. The window where protection is disabled is short — just the duration of the semantic-release run — but it's still a window. Whether that tradeoff is acceptable depends on how much you care about that gap versus the operational complexity of the bypass actor approach.

### The Dry Run

The dry run serves two purposes: a local preview while working on a branch, and an automated preview on every PR to `main`.

**Locally**, the `package.json` script is:

```json
"release:dry-run": "./scripts/semantic-release.sh --dry-run --no-ci"
```

The `--dry-run` flag skips all write operations — no tags, no commits, no GitHub release. The JS config detects `--dry-run` in `process.argv` and returns `getDryRunConfig()`, which points `repositoryUrl` at the local `.git` directory and sets `branches` to the current branch. This means no `GITHUB_TOKEN` is needed, no remote branch validation happens, and only the analyzer and notes generator run — the plugins that produce output without side effects.

**In CI**, every PR to `main` runs the same script and writes the output to the GitHub Actions job summary, making the impact of each PR visible before merging:

```yaml
- name: Release dry run
  run: |
    pnpm release:dry-run 2>&1 | tee /tmp/release-dry-run.txt
    echo "## Release Dry Run" >> $GITHUB_STEP_SUMMARY
    echo '```' >> $GITHUB_STEP_SUMMARY
    sed 's/\x1b\[[0-9;]*m//g' /tmp/release-dry-run.txt >> $GITHUB_STEP_SUMMARY
    echo '```' >> $GITHUB_STEP_SUMMARY
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`--no-ci` is still needed here. It's not about branch validation — it tells semantic-release to skip the check that requires CI environment variables to be present. Without it, semantic-release refuses to run outside of a detected CI environment.

The `sed` call strips ANSI color codes before writing to the summary, since the raw output includes terminal escape sequences that don't render in markdown.

The output lands in the **Summary** tab of the Actions job, not as a PR comment. A comment would be more immediately visible in the PR review flow, but it requires write permissions and a bit more setup to avoid creating duplicate comments on every push to the PR branch. The summary is simpler and sufficient for now.

#### The `ERELEASEBRANCHES` Gotcha

If you run the dry run locally and see this error:

```
ERELEASEBRANCHES The release branches are invalid in the `branches` configuration.
A minimum of 1 and a maximum of 3 release branches are required in the branches configuration.
These branches must exist on the remote repository.
```

The error message says "must exist on the remote repository" but that's easy to miss. semantic-release [silently removes branches from the list](https://github.com/semantic-release/semantic-release/blob/8d905a56e80030c141a71a56c0c4cb870e90470a/lib/branches/expand.js) if they aren't found on the remote, and if the resulting list is empty, it throws this. It's not a config syntax error — it means the branch you're on hasn't been pushed to the remote yet. Push the branch and the error goes away.

---

## Where Things Stand

The setup is working: releases create a proper changelog entry, bump `package.json`, and commit those changes back to the repo. Dry runs work locally (`pnpm release:dry-run`) and in PR checks.

A few things that could improve from here:

**Renovate configuration for shell script version pins:** When Renovate gets set up in this project, it will need configuration to detect the `--package=semantic-release@25` style version references in `scripts/semantic-release.sh`. Renovate supports custom regex managers for exactly this, but it's not automatic.

**GitHub Rulesets instead of legacy branch protection:** GitHub has been rolling out a newer "rulesets" system that has more granular bypass actor controls. It's possible that rulesets would make the disable/re-enable dance unnecessary by allowing the release workflow specifically to bypass only the PR review requirement, without giving that bypass to other contexts. Worth revisiting as that feature matures.

**PR comment instead of job summary:** The dry-run output in the job summary is fine but easy to miss. Posting it as a PR comment — updating the comment on subsequent pushes rather than creating new ones — would surface it more directly in the review flow. It's a small quality-of-life improvement that becomes more valuable if the project has other reviewers looking at PRs.

**Shareable Config:** This config seems entirely reasonable for many projects to use so look into what it takes to create a shareable config that gets listed on the `semantic-release` site for others to consume.  