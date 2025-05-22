import path from 'path';

import parsePost from '@/utils/parse-post';
import getAllPosts from '@/utils/get-all-posts';

export default function Post({ data, content }) {
	return <main>
		<h1>{ data?.title }</h1>
		<article dangerouslySetInnerHTML={{ __html: content }} />
	</main>
}

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return {
		paths: posts.map(p => p.slug),
		fallback: false, // false or "blocking"
	}
}

export async function getStaticProps({ params }) {

	const postPath = path.join( postsDirectory, params.slug, 'post.md' )
	
	const post = await parsePost(postPath)

	// By returning { props: { posts } }, the Post component
	// will receive `posts` as a prop at build time
	return {
		props: {
			...post
		},
	}
}

const postsDirectory = path.join(process.cwd(), 'posts')