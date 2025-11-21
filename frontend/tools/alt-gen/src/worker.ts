import {
	AutoProcessor,
	AutoModelForImageTextToText,
	load_image,
	ModelOutput,
	Processor,
	PreTrainedModel,
	type DeviceType,
} from "@huggingface/transformers";

const models = new Map<
	string,
	| {
			processor: Processor;
			model: PreTrainedModel;
	  }
	| Promise<{
			processor: Processor;
			model: PreTrainedModel;
	  }>
>();

async function loadModel({
	model_id,
	device,
}: {
	model_id: string;
	device: DeviceType;
}) {
	if (!models.has(model_id)) {
		models.set(
			model_id,
			(async () => {
				const processor = await AutoProcessor.from_pretrained(model_id);
				const model = await AutoModelForImageTextToText.from_pretrained(
					model_id,
					{
						dtype: {
							embed_tokens: "fp32",
							vision_encoder: "q4",
							decoder_model_merged: "q4",
						},
						device,
					},
				);
				console.log(`Model ${model_id} loaded.`);
				return { processor, model };
			})(),
		);
	}
	return await models.get(model_id)!;
}

async function getAlt({
	image,
	backend,
}: {
	image: Buffer;
	backend: DeviceType;
}): Promise<string> {
	return "fake-" + Math.random().toString(36).substring(2, 15);
	const { processor, model } = await loadModel({
		model_id: "onnx-community/FastVLM-0.5B-ONNX",
		device: backend,
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
	const inputs = await processor(await load_image(image), prompt, {
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

process.on("message", (message) => {
	if (!process.send) {
		console.error("Process send function is undefined");
		return;
	}
	if (
		typeof message !== "object" ||
		!message ||
		!("type" in message) ||
		!("data" in message) ||
		message.type !== "Buffer" ||
		!Array.isArray(message.data) ||
		!message.data.every((b) => typeof b === "number")
	) {
		console.error("Worker received invalid message:", message);
		process.send(null);
		return;
	}
	console.log("Worker received image of size:", message.data.length);
	getAlt({ image: Buffer.from(message.data), backend: "cpu" })
		.then((alt) => {
			process.send!(alt);
		})
		.catch((err) => {
			console.error("Worker internal error generating alt text:", err);
			self.postMessage(null);
		});
});
