import fs from 'node:fs/promises';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@atproto/lex';
import { AtUri } from '@atproto/syntax';
import chalkTemplate from 'chalk-template';
import * as app from '../lexicons/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const bskyPostDir = path.resolve(__dirname, '../../../bluesky-posts');

console.log('\n👉 Pulling 5 latest Bluesky posts...');

(async () => {
	const client = new Client('https://bsky.social');

	const posts = await client.list(app.bsky.feed.post, {
		limit: 5,
		repo: 'arsdehnel.com',
	});

	// empty the bluesky posts directory
	await fs.rm(bskyPostDir, { recursive: true, force: true });
	await fs.mkdir(bskyPostDir, { recursive: true });

	for (const post of posts.records) {
		if (!post.valid) continue;

		const uri = new AtUri(post.uri);
		const postFilePath = path.resolve(bskyPostDir, `${uri.rkey}.md`);
		const postFileContent = getPostContent(post);

		await fs.writeFile(postFilePath, postFileContent);

		console.log(chalkTemplate`📝 Wrote post file {green ${postFilePath}}`);
	}
})();

type BlueskyPost = {
	uri: string;
	value: {
		createdAt: string;
		text: string;
	};
};

function getPostContent(post: BlueskyPost): string {
	const uri = new AtUri(post.uri);
	const linkUrl = `https://bsky.app/profile/arsdehnel.com/post/${uri.rkey}`;
	return `---
date: "${post.value.createdAt}"
link: "${linkUrl}"
---

${post.value.text}
`;
}
