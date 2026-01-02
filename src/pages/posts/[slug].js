import Link from 'next/link'
import parsePost from '@/utils/parse-post';
import getAllPosts from '@/utils/get-all-posts';
import Categories from '@/components/categories/categories';

export default function Post({ title, categories, content }) {
	return (
		<>
			<div className="breadcrumbs"><Link href="/posts">&lt; Posts</Link></div>
			<h1>{ title }</h1>
			<Categories categories={ categories } />
			<article className="post-content" dangerouslySetInnerHTML={{ __html: content }} />
		</>
	)
}

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return {
		paths: posts.map(p => p.slug),
		fallback: false, // false or "blocking"
	}
}

export async function getStaticProps({ params }) {

	const post = await parsePost(params.slug)

	// By returning { props: { posts } }, the Post component
	// will receive `posts` as a prop at build time
	return {
		props: {
			...post
		},
	}
}