# blog.hloth.dev / tools / alt-gen — Image alt's generation using FastVLM transformer AI

This tools generates DRAFT image alt texts using [FastVLM](https://huggingface.co/onnx-community/FastVLM-0.5B-ONNX) by Apple and [HuggingFace Transformers.js](https://huggingface.co/docs/transformers.js/index) library to load the model and process images.

## How does this work?

It does a pretty bad job though. Most of time it just fails to recognize half of important information. The accuracy of recognized objects isn't that good either. It completely hallucinates text, even in English. Sometimes it gets stuck in a loop and just repeates the same thing over and over again until it hits the limit of 500 tokens.

## Why?

I got kinda lazy and didn't want to write ALTs myself. I still have to do this manually because FastVLM is really bad at this but at least it gets like 20% right and enough to motivate me to finish the task for it.

## How to use this?

`bun start ../../src/content/drafts/post-slug/index.mdx`

## Speed?

It's pretty much capped on hardware. I couldn't find any way to push it past about 4 seconds/image on my M1 Pro. The only thing that slightly helps is to run these models in parallel, though it tends to reverse the effect with amount of parallel models running. I found that when running 3 workers in parallel it's about 2.5-3.3 seconds/image on average after processing all images.
