import path from 'path';
import fs from 'fs/promises';
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export default function Page({ data, content }) {
	return <main>
		<h1>{ data?.title }</h1>
		<article dangerouslySetInnerHTML={{ __html: content }} />
	</main>
}


export async function getStaticPaths() {
	const posts = await getAllPosts();
	return {
		paths: posts.map(p => p.slug),
		fallback: true, // false or "blocking"
	}
}

export async function getStaticProps({ params }) {

	const post = await getPostBySlug(params.slug);
	// By returning { props: { posts } }, the Blog component
	// will receive `posts` as a prop at build time
	return {
		props: {
			...post
		},
	}
}

const postsDirectory = path.join(process.cwd(), 'posts')

async function markdownToHtml(markdown) {
	const result = await remark().use(html).process(markdown);
	return result.toString();
}

async function getPostBySlug(slug) {

	const filePath = path.join(postsDirectory, `${slug}.md`);
	const fileContents = await fs.readFile(filePath, 'utf8')
	const { data, content } = matter(fileContents);

	return {
		slug,
		data,
		content: await markdownToHtml(content)
	}

}

async function getAllPosts() {

	const filenames = await fs.readdir(postsDirectory)

	return await Promise.all(filenames.map(async filename => {

		const post = await getPostBySlug(filename.replace('.md', ''))

		return {
			filename,
			...post,
			slug: `/posts/${filename.replace('.md', '')}`,
		}

	}))

}