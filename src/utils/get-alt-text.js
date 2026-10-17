import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const prompt = 'Please provide alt text for this image. Please keep it under 125 characters.';

let client;

export default async function getAltText(imgPath) {
	const fullImgPath = resolve(import.meta.dirname, '../..', imgPath);
	const ext = extname(imgPath).toLowerCase().replace('.', '');
	const mediaType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

	const base64Img = await readFile(fullImgPath, 'base64');

	if (!client) {
		client = new Anthropic();
	}

	const response = await client.messages.create({
		model: 'claude-haiku-4-5-20251001',
		max_tokens: 256,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'image',
						source: {
							type: 'base64',
							media_type: mediaType,
							data: base64Img,
						},
					},
					{
						type: 'text',
						text: prompt,
					},
				],
			},
		],
	});

	return response.content[0].text;
}
