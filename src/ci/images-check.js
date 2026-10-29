import fs from 'node:fs/promises';
import path from 'node:path';
import chalkTemplate from 'chalk-template';

// Expected format: ![](<file ref> "<human authored title>")
//   - alt text must be empty (injected at publish time)
//   - title (quoted string after filename) must be present

const IMG_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
const HAS_TITLE_REGEX = /\s+"[^"]+"[\s]*$|[\s]+'[^']+'[\s]*$/;

const postsDirectory = path.join(process.cwd(), 'content/posts');
const postDirs = await fs.readdir(postsDirectory);

// Map of relativeFilePath -> [{lineNum, src, reasons[]}]
const violations = new Map();

for (const dirEntry of postDirs) {
	const stats = await fs.lstat(path.join(postsDirectory, dirEntry));
	if (!stats.isDirectory()) continue;

	const postPath = path.join(postsDirectory, dirEntry, 'post.md');
	let contents;
	try {
		contents = await fs.readFile(postPath, 'utf8');
	} catch {
		continue;
	}

	const fileViolations = [];
	const lines = contents.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const lineNum = i + 1;

		for (const match of lines[i].matchAll(IMG_REGEX)) {
			const [src, altText, srcAndTitle] = match;
			const reasons = [];

			if (altText.trim()) {
				reasons.push('has alt text in [] (should be empty; alt text is injected at publish time)');
			}

			if (!HAS_TITLE_REGEX.test(srcAndTitle)) {
				reasons.push('missing title — expected ![](<file> "<title>")');
			}

			if (reasons.length > 0) {
				fileViolations.push({ lineNum, src, reasons });
			}
		}
	}

	if (fileViolations.length > 0) {
		const relPath = path.relative(process.cwd(), postPath);
		violations.set(relPath, fileViolations);
	}
}

if (violations.size === 0) {
	console.log(chalkTemplate`{green ✓} All image references are correctly formatted`);
	process.exit(0);
}

let totalCount = 0;

for (const [filePath, fileViolations] of violations) {
	console.error(chalkTemplate`\n{yellow ${filePath}}`);
	for (const { lineNum, src, reasons } of fileViolations) {
		totalCount++;
		console.error(chalkTemplate`  {cyan ${filePath}:${lineNum}}  {white ${src}}`);
		for (const reason of reasons) {
			console.error(chalkTemplate`    {red ✖} ${reason}`);
		}
	}
}

console.error(chalkTemplate`\n{red ✖} Found {white ${totalCount}} image violation(s) across {white ${violations.size}} file(s).`);
process.exit(1);
