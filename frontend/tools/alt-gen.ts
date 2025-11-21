import {
	AutoProcessor,
	AutoModelForImageTextToText,
	load_image,
	ModelOutput,
} from "@huggingface/transformers";

const model_id = "onnx-community/FastVLM-0.5B-ONNX";

const processor = await AutoProcessor.from_pretrained(model_id);
const model = await AutoModelForImageTextToText.from_pretrained(model_id, {
	dtype: {
		embed_tokens: "fp16",
		vision_encoder: "q4",
		decoder_model_merged: "q4",
	},
});
const prompt = processor.apply_chat_template(
	[
		{
			role: "user",
			content: "<image>Describe in one sentence for alt text",
		},
	],
	{
		add_generation_prompt: true,
	},
);

async function getAlt(fullPath: string): Promise<string> {
	const image = await load_image(fullPath);
	const inputs = await processor(image, prompt, {
		add_special_tokens: false,
	});

	const outputs = await model.generate({
		...inputs,
		max_new_tokens: 500,
		do_sample: false,
	});
	if (outputs instanceof ModelOutput)
		throw new Error("Expected generated tokens, but got ModelOutput");

	const decoded = processor.batch_decode(
		outputs.slice(null, [inputs.input_ids.dims.at(-1), null]),
		{ skip_special_tokens: true },
	);
	let result = decoded[0]?.trim();
	if (!result) throw new Error("No generated text found");

	result = ["The image depicts", "The image captures"].reduce(
		(prev, cur) =>
			prev.startsWith(cur) ? prev.substring(cur.length).trim() : prev,
		result,
	);
	result = ["."].reduce(
		(prev, cur) =>
			prev.endsWith(cur) ? prev.slice(0, -cur.length).trim() : prev,
		result,
	);

	return result.at(0)?.toUpperCase() + result.slice(1);
}

const alt = await getAlt(
	"/Users/hloth/Downloads/aakljsdjklasjkldjskladljkasjkldasjkld.jpg",
);
console.log("Generated alt text:", alt);
