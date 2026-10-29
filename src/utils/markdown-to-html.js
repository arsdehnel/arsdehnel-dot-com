import { transformerCopyButton } from '@rehype-pretty/transformers';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';

export default async function markdownToHtml(markdown) {
	const result = await remark()
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypePrettyCode, {
			theme: 'github-dark',
			transformers: [
				transformerCopyButton({
					visibility: 'hover',
					feedbackDuration: 2000,
					jsx: true,
					copyIcon:
						"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FF7F50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='9' y='9' width='13' height='13' rx='2' ry='2'/%3E%3Cpath d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/%3E%3C/svg%3E",
				}),
			],
		})
		.use(rehypeStringify, { allowDangerousHtml: true })
		.process(markdown);
	return result.toString();
}
