---
title: AWS Bedrock Exploration
excerpt: >-
  Figured I should dive into AWS Bedrock, see how it works, and explore the capabilities of the models they have.  
date: '2025-05-18'
categories: 
  - cloud tech
  - development
---

I've never had a situation at work that's driven me to get into Bedrock but it's long overdue.  I created a [quick repo](https://github.com/arsdehnel/bedrock-exploration) to play around with it, capture some scripts, and see where it led.  It was my first real development calling models in a way that would be used for anything semi-real.  I'd done some scripts and `curl` commands to call chatGPT and all that but this had a bit more purpose behind it. 

## Initial Experience

The very first thing you have to do in the console is follow a couple ClickOps things to enable access to the models which is a little awkward.  I get why it needs to be there to avoid accidental spend on a model that could cost a lot of money but it's not the easiest onboarding experience especially because of how the AWS console continues to struggle with good UX.  

After that the experience was actually pretty good.  Once you have a model you can use (the access is granted immediately after finding the flow to request it) there is a playground setup that makes it very easy to interact with them.  This is similar to other AI model interactions, they didn't invent anything new here but also didn't try to be clever like AWS sometimes does.  

Within a few minutes I had a model setup and was making the requests I needed to prove out the use cases I had in mind.  This was easier than I expected and rather pleasant.  I was fooled into thinking this was going to be flawless exploration 😉.

## Moving to the SDK

At this point I figured I was ready to take those clicks I was doing in the console and turn them into some SDK calls.  Being the JavaScript developer that I am I created a `git` repo and installed [the AWS SDK for Bedrock Runtime](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-bedrock-runtime/).  So far so good.  

However moving on to the [Invoke Model Command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-bedrock-runtime/Interface/InvokeModelCommandInput/) and it's only input the [Invoke Model Command Input](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-bedrock-runtime/Interface/InvokeModelCommandInput/) I hit my first stumbling block.  There is essentially no documentation for this method.  Since this is AWS I just figured it wasn't in the SDK docs but that it was somewhere on the internet.  

I was wrong.

Since Bedrock is just a system that runs a variety of models for you the runtime SDK is essentially just an AWS authentication wrapper on the models themselves.  So every model takes a different input and even within models your input might need to be different based on what you are trying to do.  That totally makes sense in hindsight but compared to essentially any other AWS service I've used it's not how they work.  And there doens't seem to be any indication of this anywhere in their docs.  No pointers to suggest that each model is different and you should refer to the docs of that model instead of anything within AWS. Maybe people more familiar with the AI/Model space would know this more readily but I sure didn't and it got quite frustrating.  

## Initial Scripts

Once I got past that stumbling block I got things scripted out pretty easily.  The `Model ID` the API requires isn't _quite_ what the console provides but you just need to prefix the provided ID with `us.` and things work.  Another undocumented thing but not the worst thing to struggle through.  

My first few things were based roughly on asks from the business at work.  While this wasn't on the clock work or even things we were being directly asked to do they were real requirements that I could easily script for to help me figure out how to use Bedrock.  

1. Alt Text Generation: give a model an image and get back a description of the image to be used as Alt Text to improve the accessibility of our site.
2. Ecard Generator: we have a mechanism for sending ecards to coworkers on our site so having AI generate a card for you right in the system seemed pretty handy.
3. Enhance: generic AI text interaction where it can take something you wrote and make it more professional or heart-felt (ironically).  

## Final Thoughts

While these were pretty simple use cases and all are done with prebuilt models it was a good toe-dipping exercise.  While I had some frustration with the AWS API I still was able to get something useful and learn a fair bit about how Bedrock works and where it could be useful.  I'm sure it's not always the most efficient method for running models but it sure is easy and I'm not going to stand up my own model for home projects so having something that's super easy to use and can be baked right into the rest of my infrastructure bill is a welcome option.  