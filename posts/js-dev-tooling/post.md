---
title: Javascript Development Tooling
excerpt: >-
  As I've been getting back into JS (and now TS) development I thought it would be good to share some of my tooling choices.  Everyone has their own take on these items and they are always changing but capturing them seems like a rite of passage.
thumbnail: toolbox.jpg
date: "2026-04-07"
categories:
  - development
---

## IDE

> Choice: VS Code

[VSCode](https://code.visualstudio.com/) is my jam these days. I was a Dreamweaver MX guy way back in the day and then moved to Sublime Text. But for nearly a decade I've been a VS Code guy.

## Git Platform

> Choice: GitHub

I really struggle here. I currently am using GitHub for work and personal projects but I am a big fan of GitLab and actually prefer it. The reason I'm using GitHub is mostly that it's the standard and I have been working to build up a more public facing presence. Perhaps I'm just furthering the story that you can't use GitLab and be taken seriously but I'm not ready to tackle that problem.

## Framework

> Choice: React

I'm very happy to say I think the framework wars of a decade ago are more-or-less over. Or maybe I just am out-of-touch with all the hot takes. But either way I'm happy to just stick with React and not get stuck in the debates of what new hotness might be out there.

## Meta Framework

> Choice: RedwoodSDK

I got started on Redwood after listening to [the Syntax FM episode on it](https://syntax.fm/show/901/js-news-new-react-and-svelte-apis-rsc-updates-redwood-and-storybook) last summer. It's been fun to be using something new and running on CloudFlare has been _really_ interesting. I'm planning to write up more on this in the near future so I'll save my soapboxing for that post.

I do still use nextjs for some smaller static sites (like the one you're on actually). I could see changing that in the future to use rwsdk everywhere but where rwsdk shines is leveraging the underlying pieces of CloudFlare seamlessly and this site doesn't need that. So for static sites I still see myself sticking with nextjs' server-side rendering.

It's also worth noting that Redwood started life as a Vite plugin and still relies on Vite as the underlying technology/platform. I had not used Vite before and I'm really enjoying it as a runtime and tooling platform. Since I started with Redwood I have been learning where Vite ends and where Redwood begins sort of backwards.

## Formatter

> Choices: Biome and Prettier

I really wish I could just say Biome is the formatter of choice but since it doesn't handle `less` and `sass` files (which I still like to use) I use Prettier for those files. For as long as I can remember I have used ES Lint for this but it has always seemed a bit too messy to configure and get working how I want. Biome promises (and seems to deliver) on easier configuration and less bikeshedding on options. I've been happy with it in my first few months of usage so I see no reason to look elsewhere. One of the big selling points they make for it is speed which I haven't really measured since most of my projects are pretty tiny and probably would be fine with other tools as well.

## Release Automation

> Choices: Commitlint, Conventional Commits, and Semantic Release

Wasn't sure how to really group this one but the title of "Release Automation" I think is important because that is really the goal of the setup. Commitlint isn't really aimed at releases but my inclusion of it in my projects is because it helps create releases in a consistent and automated manner.

- Commitlint: makes sure that both locally and in CICD commits are following standards
- Conventional Commits: commonly used and well-documented convention for commit messages
- Semantic Release: leverages the work of these other two in order to determine release versions and creates release artifacts

## Testing

> Choices: Vitest and Playwright

For most of my front-end life I've been a Jest user. I never really got into Chai, Sinon, or any of those libraries (mostly because I was not much into unit tests at the time those were the leaders). Getting into proper development (ie development with unit tests as a key ingredient) was all about Jest. As ESM became a reality that team seems to have _really_ dropped the ball. In contrast, moving to Vitest has been seamless and really enjoyable! It works very similarly to Jest but does the things that Jest can't seem to get working. The parity/similarities with Vite also makes this experience smooth and easy.

Testing rendered UI always has its struggles and problems but also has some real value if you can find the right balance and approach. I've just recently started playing around with Playwright for this purpose and it has gone well so far. I don't plan to have an enormous amount of tests as they are fragile and can be tedious but the workflow with Playwright is really nice. Specifically I've liked the ability to use their component-level testing where I can pass in some props and take a snapshot of what that'll look like. Being able to do this sort of testing at the component-level seems really powerful and far less fragile than tests that visually compare a full UI page.

## Styling / Design System

> Choices: Less and Radix

As someone that does this sort of development on the side these choices probably don't make any sense. I should probalby write plan CSS to avoid compilation steps and use a full-featured design system to avoid making my own components and managing styles. But I'm not one to just do what's expected.

While compiling Less to CSS is another step the build tools make it so simple I really don't see it as the burden it was back in the grunt/gulp/webpack days. Both nextjs and vite make compiling Less to CSS trivial. While I don't use a ton of the features it's nice to have them available if/when I need them.

In looking through design systems I spent a good bit of time chatting with a UX friend about some other options, pros and cons, and just the general vibe of things. We both had this inexplicable pull to Radix. Perhaps we're both masochists or something but when it comes down to it these side projects are meant to be fun and building out components is something I enjoy. Certainly bare Radix primitives aren't for everyone and I would not suggest it for all projects/people.

## CICD

> Choices: Husky, Lint Staged, and the integrated CI of your Git platform

As a platform engineer and as a technology leader I very much believe in pushing things "left" (although I hate most talk tracks that focus on that phrase). Keeping developers in the flow and giving them feedback as early in their process as possible is very important. During development this involves things like the Vite dev server, Vitest's UI mode for continually watching tests, and Docker for running things locally that would otherwise be very tedious. Once the development changes are ready to go having Husky installed let's me really make sure everything is clean, consistent, and standardized before getting it into a commit.

A new tool for me that pairs well with Husky is Lint Staged that exists to run some commands (such as linting and formatting) just on the staged files and is designed to run as part of a git hook (like what Husky does). This gives more control over those processes and how to handle results and most importantly manages the messy bit of allowing those commands to run just on the staged files instead of the whole project.

Once things pass through Husky's territory I think using the CICD tool that is baked into your Git platform is your best bet. I spent years using GitLab's pipelines and now am heavily using GitHub's workflows and they both are more-than-adequate for the vast majority of projects, especially these side projects that I'm talking about here. I really like GitHub's reusable and shareable Actions and I see now why GitLab was so aggressively playing catchup on that when I last was engaged in their roadmap.
