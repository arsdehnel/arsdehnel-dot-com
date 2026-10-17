import chalkTemplate from 'chalk-template';
import getAllPosts from './utils/get-all-posts.js';

const posts = await getAllPosts();
const missing = [];

for (const post of posts) {
	for (const img of post.images) {
		if (!img.altText) {
			missing.push({ slug: post.slug, filename: img.filename });
		}
	}
}

if (missing.length === 0) {
	console.log(chalkTemplate`{green ✓} All images have alt text`);
	process.exit(0);
}

console.error(chalkTemplate`{red ✖} Missing alt text for ${missing.length} image(s):\n`);

for (const { slug, filename } of missing) {
	console.error(chalkTemplate`  {yellow ${slug}}/{cyan ${filename}}`);
}

console.error(chalkTemplate`\nRun {white node src/alt-text-generation.js} to generate missing alt text.`);
process.exit(1);
