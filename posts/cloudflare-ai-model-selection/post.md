---
title: Cloudflare Workers AI Model Selection
excerpt: >-
  I'm not an AI enthusiast by any means but feeling the need to be able to speak intelligently about the whole situation.  Picking a model for my exploration of Cloudflare Workers AI was just one of the aspects of this whole AI thing that gives me anxiety.
thumbnail: cf-logo.png
date: "2026-07-25"
categories:
  - development
---

## Situation

While I'm somewhere between AI skeptic and against AI entirely I feel forced to learn about it for my job in software development.  The details of the entirety of my feelings on that tension will get a post of its own here soon.  This post is about my exploration into Cloudflare's Workers AI for one of my little side projects of a Jeopardy-ish game.  I've been using hardcoded categories and clues for development and initial testing but for most users those questions aren't going to work.  Having an option to generate a categories would be pretty useful so I thought I'd give it a whirl.

## Constraints

Given that this is a low-effort side project with literally no budget I'm limited to using the Cloudflare-hosted free plan-eligible models and usage limits.  Mostly this is fine but it trims down the list to a much smaller subset right off the bat.  

## Approach

As with all of my AI exploration and usage I'm being very intentional in the choices I'm making.  I have no allusions to making the perfect choice nor do I believe my choices are the ones that are right for anyone other than me.  I'm learning and navigating an ever-growing ecosystem with my own history, preferences, comfort-level, and motives.  Everyone should be making their own decisions here but I encourage everyone to actually make those decisions rather than accepting the decisions made for you.

## Models / Providers

Now to the actual models and providers along with my quick barely-researched decision making process.  Yes I know the _truly right way_ to do this is deeply research these things but in weighing the time that would take to pick a model versus other ways to spend my time I did a pretty limited amount of reseach.  I'm just being upfront about that and caveating everything below with it as it could mean I made a bad decision. I'm making some broad generalizations in the below analysis and I sort of hate that but at this stage in my AI path they're the generalizations that help me through decisions and acceptance of the full situation.

### Chinese Providers

While I personally am not at all "against China" or feel that they are doing sketchy things there are too many general concerns about data management and usage for me to choose a model that's coming out of China.  Honestly even if China is totally doing things the right way and being innovative in their technology I worry that the current US administration's relationship with China will make the usage of their models problematic. I have little of my own personal knowledge to base this on but given other options I categorically skipped these models and providers.

- [`Kimi` family](https://platform.kimi.ai/docs/models) from [Moonshot AI](https://www.moonshot.ai/)
- [`GLM`](https://z.ai/blog/glm-5.2) from [Zhipu AI](https://www.zhipuai.cn/en)
- [`Qwen`](https://qwen.ai/home) from [Alibaba Cloud](https://www.alibabacloud.com/)
- [`Deepseek`](https://deepseek.com/en/index.html) from [High-Flyer](https://www.high-flyer.cn/)

### Cloud Providers

I'm generally annoyed at these providers for their role in pushing the entire "AI is the solution to everything" story forward at such an alarming pace at the cost of so much we all hold dear.  They know people will pay for these models as long as it seems like the sales pitch is true and once the true cost hits consumers these providers will be rich enough it won't matter how their customers are impacted.  

- `Gemma` from Google
- `Phi` from Microsoft
- `Granite` from IBM

### US Tech Giants & AI Companies

It's hard for me to decide if I am more upset with these giants or the cloud providers in the world of who is to blame for the runaway AI bubble but I don't want to use their models if I can help it even if I plan to stay on the free tier.

- `Llama` from Meta
- `ChatGPT` from OpenAI
- `Nemotron` from NVIDIA

### Remaining Options

From what I can tell on the [Cloudflare models page](https://developers.cloudflare.com/workers-ai/models/) that leaves me with two model families for my [text generation](https://developers.cloudflare.com/workers-ai/models/?tasks=Text+Generation) needs.  

- `Mistral` from... well... [Mistral](https://mistral.ai/)
- `Hermes` from [nousresearch](https://nousresearch.com/)

My first option here was `Hermes` as Nous is an open-source company that at least aligns with _that_ part of my own preference and approach to software.  Anyone training models at the scale these providers are training them at runs counter to many of my own values but that again is a topic for a separate post.  Being an open source company seems at least marginally better than the others listed here. However when I go to actually use this model I get `This model was deprecated on 2026-05-30. Please use an alternative model.` so that won't work. 

While `Mistral` is quite possibly just another giant AI company burning the world and promoting AI as the solution to every CEO's problems the fact that they are France-based gives me a little hope that they are a little less unhinged in their quest for money.  Perhaps that's a bad assumption but it is sort of all I have to go on at the moment so I'm moving forward with their models.  At least for now.
