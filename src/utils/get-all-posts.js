import fs from "node:fs/promises";
import path from "node:path";

import parsePost from "./parse-post.js";

const postsDirectory = path.join(process.cwd(), "posts");

export default async function getAllPosts() {
	const postsFiles = await fs.readdir(postsDirectory);

	const postEntries = await Promise.all(
		postsFiles.map(async (dirEntry) => {
			const stats = await fs.lstat(path.join(postsDirectory, dirEntry));
			const isDir = stats.isDirectory();

			// catching things like .DS_store and other non-entry-files
			if (!isDir && !dirEntry.endsWith(".md")) {
				return;
			}

			const slugPartial = isDir ? dirEntry : dirEntry.replace(".md", "");
			const post = await parsePost(slugPartial);

			if (!post) {
				return;
			}

			return {
				slugPartial,
				filename: dirEntry,
				...post,
				slug: `/posts/${slugPartial}`,
			};
		}),
	);

	// return any defined entries sorted by date to have newest first although right now we're comparing dates as strings which could break later
	return postEntries
		.filter(Boolean)
		.sort((a, b) => b.date.localeCompare(a.date));
}
