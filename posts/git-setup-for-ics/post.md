---
title: Git Setup for Individual Contributors
excerpt: I spend my days as a platform engineering consultant and am involved in multiple software projects on the side.  As a result my `git` config was getting pretty unruly.  I created a bit more structure to it now and thought I'd share what I'm doing.
date: '2026-09-17'
thumbnail: thumbnail.jpg
categories:
  - development
---

For many years I had my work computer setup for my work's VCS and my home computer setup for github.com.  That works for a long time and I am _not_ here to say that the work-life separation should be dissolved!  But now I am in consulting as a day job and not everything is on github.com for those side projects; both sides are messier and have multiple `git` configurations to deal with.

## Prior Work

I tried a couple other things in my evolution to what I have today.  And I will likely continue to evolve beyond this as life and technology changes and grows.

### Initial Approach: repo-scoped git config

Perhaps the _simplest_ approach is to keep everything at the repo level.  Never use `--global` settings in `git` and every repo gets setup with local settings.  This does work but it can get pretty annoying if you have a lot of repos under the same client/org/group.  One client I ended up with something like 75 repos locally.  Setting up each of those separately would be tedious and cumbersome particularly if I had to change a signing cert or something across all of them.  

### Second Approach: virtual host trickery

Since I knew the repo-scoped `git config` wasn't going to work I had fallen back to a single global config that fit the "best" host.  This use of "best" usually translated to "the project I'm on now" which worked fine for a while but when the next client came in and I changed that global setting then things got really messy really quickly.  

One day I was venting to a co-worker and they suggested using some virtual-host based trickery.  The idea was that you could setup sort of a "fake" virtual host locally to allow host rules in `git` to apply different configs even if they were hitting the same actual host (ie `github.com`).  

It was more-or-less the same as [this gist](https://gist.github.com/0xcafed00d/a04502f5cc876b3b482a44e10b647b9d) walks through.  If you're using `ssh` to push code then this might be worth looking at as my setup is only being used over `https`.  Most of it is the same but there are some differences that might be worth checking out.  One important note that mine does include that this does not is having signed/verified commits.  

## Current Approach: includeIf

The virtual host trickery approach also uses `includeIf` but [`includeIf`](https://git-scm.com/docs/git-config#_includes) does most of the heavy lifting for me here.  This allows a `git`-native mechanism to pick a config based on either the `git` remove origin or the local directory where the command is being run.  

1. Pick a name (ie `githubcom-arsdehnel` or `gitlabexamplecom-adamdehnel`)
2. Create SSH key
3. Load SSH key into ssh-agent
4. Create scoped gitconfig (user, gpg, commit, allowed signers)
5. Reference scoped gitconfig in main gitconfig with appropriate rules
6. Add to remote via their UI