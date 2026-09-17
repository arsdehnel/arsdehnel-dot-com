import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import markdownToHtml from './markdown-to-html.js';

const blueskyDir = path.join(process.cwd(), 'bluesky-posts');

export default async function getLatestBlueskyPosts() {
	const postsFiles = await fs.readdir(blueskyDir);

	const postEntries = await Promise.all(
		postsFiles.map(async dirEntry => {
			const postPath = path.join(blueskyDir, dirEntry);
			const stats = await fs.lstat(postPath);
			const isDir = stats.isDirectory();
			if (isDir) {
				return;
			}

			const fileContents = await fs.readFile(postPath, 'utf8');
			const { data, content } = matter(fileContents);

			return {
				filename: dirEntry,
				...data,
				content: await markdownToHtml(content),
			};
		}),
	);

	// return any defined entries sorted by date to have newest first although right now we're comparing dates as strings which could break later
	return postEntries.filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));
}
