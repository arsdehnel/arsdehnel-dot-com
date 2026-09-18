---
title: Git Setup for Individual Contributors
excerpt: I spend my days as a platform engineering consultant and am involved in multiple software projects on the side.  As a result my `git` config was getting pretty unruly.  I created a bit more structure to it now and thought I'd share what I'm doing.
date: '2026-09-17'
thumbnail: thumbnail.png
categories:
  - development
---

For many years I had my work computer setup for my work's VCS and my home computer setup for github.com.  That works for a long time and I am _not_ here to say that the work-life separation should be dissolved!  But now I am in consulting as a day job and not everything is on github.com for those side projects; both sides are messier and have multiple `git` configurations to deal with.

## Prior Work

I tried a couple other things in my evolution to what I have today.  And I will likely continue to evolve beyond this as life and technology changes and grows.

### Initial Approach: repo-scoped git config

Perhaps the _simplest_ approach is to keep everything at the repo level.  Never use [`--global`](https://git-scm.com/docs/git-config#Documentation/git-config.txt---global) settings in `git` and every repo gets setup with local settings.  This does work but it can get pretty annoying if you have a lot of repos under the same client/org/group.  One client I ended up with something like 75 repos locally.  Setting up each of those separately would be tedious and cumbersome particularly if I had to change a signing cert or something across all of them.  

### Second Approach: virtual host trickery

Since I knew the repo-scoped `git config` wasn't going to work I had fallen back to a single global config that fit the "best" host.  This use of "best" usually translated to "the project I'm on now" which worked fine for a while but when the next client came in and I changed that global setting then things got really messy really quickly.  

One day I was venting to a co-worker and they suggested using some virtual-host based trickery.  The idea was that you could setup sort of a "fake" virtual host locally to allow host rules in `git` to apply different configs even if they were hitting the same actual host (ie `github.com`).  

It was more-or-less the same as [this gist](https://gist.github.com/0xcafed00d/a04502f5cc876b3b482a44e10b647b9d) walks through.  If you're using `ssh` to push code then this might be worth looking at as my setup is only being used over `https`.  Most of it is the same but there are some differences that might be worth checking out.  One important note that mine does include that this does not is having signed/verified commits.  

## Current Approach: includeIf

The virtual host trickery approach also uses `includeIf` but [`includeIf`](https://git-scm.com/docs/git-config#_includes) does most of the heavy lifting for me here.  This allows a `git`-native mechanism to pick a config based on either the `git` remove origin or the local directory where the command is being run.  

### 1. Pick a "Profile" Name

Before doing anything else, settle on a naming profile convention — you'll reuse this name across the SSH key filename, the scoped `git` config filename, and likely the local directory where these repos live. This isn't true "profile" in a formal sense, but it's helpful to correlate the name across these different parts of the setup. Something like `githubcom-arsdehnel` or `gitlabexamplecom-adamdehnel` works well: it encodes both the host and the identity so you can tell at a glance what a file is for.

### 2. Create SSH Key

Using the email associated with the account on this host, generate a new key:

```sh
ssh-keygen -t ed25519 -C "username@example.com"
```

When prompted for a location, use the name you chose in step 1 rather than the default `id_ed25519`. This keeps your `~/.ssh` directory from becoming an unnamed pile of keys:

```sh
~/.ssh/githubcom-arsdehnel
```

### 3. Load SSH Key into ssh-agent

Once the key is generated, add it to the SSH agent so it's available when signing commits:

```sh
ssh-add ~/.ssh/githubcom-arsdehnel
```

On macOS you probably also want to pass `--apple-use-keychain` so the passphrase is stored in Keychain and the key loads automatically after a reboot.

### 4. Create Scoped gitconfig

Rather than using [`--global`](https://git-scm.com/docs/git-config#Documentation/git-config.txt---global) flags, you'll create a separate config file for each identity. Create `~/.gitconfig-githubcom-arsdehnel` with the following:

```ini
# ~/.gitconfig-githubcom-arsdehnel
[user]
    name = Your Name
    email = username@example.com
    signingkey = /Users/<your username>/.ssh/githubcom-arsdehnel.pub

[gpg]
    format = ssh

[gpg "ssh"]
    allowedSignersFile = /Users/<your username>/.config/git/allowed_signers

[commit]
    gpgsign = true
```

**Note:** `git` config loading doesn't expand the `~/` into your user directory so you must provide the full path.

The [`gpg.ssh.allowedSignersFile`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-gpgsshallowedSignersFile) tells `git` which keys to trust when verifying signatures locally. You'll need to add an entry for this key to that file:

```txt
username@example.com ssh-ed25519 <contents of ~/.ssh/githubcom-arsdehnel.pub>
```

You can get the value to paste with:

```sh
cat ~/.ssh/githubcom-arsdehnel.pub
```

### 5. Reference Scoped gitconfig in Main gitconfig

With the scoped config file in place, point your main `~/.gitconfig` at it using [`includeIf`](https://git-scm.com/docs/git-config#_conditional_includes). The [`gitdir:`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-gitdir) rule activates the included config whenever `git` is run from inside a matching directory path:

```ini
[includeIf "gitdir:~/Projects/githubcom-arsdehnel/"]
    path = ~/.gitconfig-githubcom-arsdehnel
```

This means any repo you clone under `~/Projects/githubcom-arsdehnel/` will automatically pick up the right identity and signing key — no per-repo config needed.

### 6. Add to Remote via Their UI

The final step is registering the public key with the remote host as a signing key. The flow varies by host.

#### GitHub

Go to GitHub's Settings and navigate to the [SSH and GPG keys panel](https://github.com/settings/keys). Click **New SSH Key**, give it a recognizable title (using your naming convention from step 1 is a good idea), and importantly set the **Key Type** to **Signing Key** — not Authentication Key.

Copy your public key to the clipboard:

```sh
pbcopy < ~/.ssh/githubcom-arsdehnel.pub
```

Paste it into the **Key** field and save. Once registered, GitHub will display a verified badge on commits signed with this key.

## References

- [Setting Up SSH for Commit Signing](https://www.git-tower.com/blog/setting-up-ssh-for-commit-signing)
- [Working with Multiple GitHub Accounts](https://andrewstiefel.com/working-multiple-github-accounts/)
- [Multiple Git Identities via Virtual Hosts](https://gist.github.com/0xcafed00d/a04502f5cc876b3b482a44e10b647b9d)