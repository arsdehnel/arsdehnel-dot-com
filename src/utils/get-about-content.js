import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const aboutContentDir = path.join(process.cwd(), "content/about");

export default async function getAboutContent() {
	const aboutFiles = await fs.readdir(aboutContentDir);

	const aboutContent = [];

	await Promise.all(
		aboutFiles.map(async (dirEntry) => {
			// catching things like .DS_store and other non-entry-files
			if (!dirEntry.endsWith(".md")) {
				return;
			}

			const slugPartial = dirEntry.replace(".md", "");
			const fileContents = await fs.readFile(
				path.join(aboutContentDir, dirEntry),
				"utf-8",
			);
			const { data, content } = matter(fileContents);

			aboutContent.push({ slugPartial, ...data, content: content.toString() });
		}),
	);

	return aboutContent
		.sort((a, b) => {
			if (a.order > b.order) return 1;
			if (a.order < b.order) return -1;
			return 0;
		})
		.reduce((acc, { content }) => {
			acc += content + "\n\n";
			return acc;
		}, "");
}
