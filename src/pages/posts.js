import path from 'path';
import fs from 'fs/promises';
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export default function Page({ posts }) {
	return (
		<>
			<h2>Posts</h2>
			<div className="posts-wrapper">
				{
					posts.map( p => {
						return (
							<div>
								<h3><a href={ p.slug }>{ p.data.title }</a></h3>
								<div>Date: { p.data.date }</div>
								<div dangerouslySetInnerHTML={ { __html: p.content } } />
							</div>
						)
					})
				}
			</div>
		</>
	);
}

export async function getStaticProps({ params }) {

	const posts = await getAllPosts();

	return {
		props: {
			posts
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