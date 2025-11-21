import {
	AutoProcessor,
	AutoModelForImageTextToText,
	load_image,
	ModelOutput,
} from "@huggingface/transformers";

// Load processor and model
const model_id = "onnx-community/FastVLM-0.5B-ONNX";
const processor = await AutoProcessor.from_pretrained(model_id);
const tokenizer = processor.tokenizer;
if (!tokenizer) {
	throw new Error("Tokenizer not found in processor");
}
console.log("Processor and tokenizer loaded");
const model = await AutoModelForImageTextToText.from_pretrained(model_id, {
	dtype: {
		embed_tokens: "fp16",
		vision_encoder: "q4",
		decoder_model_merged: "q4",
	},
});
console.log("Model loaded");

// Prepare prompt
const messages = [
	{
		role: "user",
		content: `
			You are an expert in assistive technology.

			You will analyze the image <image>
			and generate a short description alt text for the image.

			- Do not include alt text in the description.
			- Keep it very short (one sentence) but descriptive.
			- Do not generate the [ character.
		`,
	},
];
const prompt = processor.apply_chat_template(messages, {
	add_generation_prompt: true,
});

console.log("Prompt prepared");

// Prepare inputs
const image = await load_image(
	"/Users/hloth/Downloads/aakljsdjklasjkldjskladljkasjkldasjkld.jpg",
);

console.log("Image loaded");

const inputs = await processor(image, prompt, {
	add_special_tokens: false,
});
console.log("Inputs prepared");

performance.mark("model-inference-start");
// Generate output
const outputs = await model.generate({
	...inputs,
	max_new_tokens: 500,
	do_sample: false,
});
console.log("Output generated");

if (outputs instanceof ModelOutput) {
	console.error(outputs);
	throw new Error("Expected generated tokens, but got ModelOutput");
}

// Decode output
const decoded = processor.batch_decode(
	outputs.slice(null, [inputs.input_ids.dims.at(-1), null]),
	{ skip_special_tokens: true },
);
console.log("======DONE======");
performance.mark("model-inference-end");

console.log(
	performance.measure(
		"model-inference",
		"model-inference-start",
		"model-inference-end",
	).duration,
);
const trimPrefix = (result: string, prefix: string) => {
	if (result.startsWith(prefix)) {
		return result.substring(prefix.length).trim();
	}
	return result;
};
const trimSuffix = (result: string, suffix: string) => {
	if (result.endsWith(suffix)) {
		return result.slice(0, -suffix.length).trim();
	}
	return result;
};
let result = trimSuffix(
	trimPrefix(decoded[0].trim(), "The image depicts"),
	".",
);
result = result.at(0)?.toUpperCase() + result.slice(1);
console.log("Generated alt text:", result);
