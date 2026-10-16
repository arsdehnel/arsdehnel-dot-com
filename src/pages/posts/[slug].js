import Link from 'next/link';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6';
import Categories from '@/components/categories/categories';
import getAllPosts from '@/utils/get-all-posts';
import parsePost from '@/utils/parse-post';

export default function Post({ title, categories, content, prevPost, nextPost }) {
	return (
		<>
			<div className="breadcrumbs">
				<Link href="/posts">&lt; Posts</Link>
			</div>
			<h1>{title}</h1>
			<Categories categories={categories} />
			<article
				className="post-content"
				// biome-ignore lint: yeah it's hacky but we need it
				dangerouslySetInnerHTML={{ __html: content }}
			/>
			<div className="posts-nav">
				{prevPost?.slug ? (
					<Link className="posts-nav-left has-link" href={prevPost.slug}>
						<FaAngleLeft />
						{prevPost.title}
					</Link>
				) : (
					<div className="posts-nav-left" />
				)}
				{nextPost?.slug ? (
					<Link className="posts-nav-right has-link" href={nextPost.slug}>
						{nextPost.title}
						<FaAngleRight />
					</Link>
				) : (
					<div className="posts-nav-right" />
				)}
			</div>
		</>
	);
}

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return {
		paths: posts.map(p => p.slug),
		fallback: false, // false or "blocking"
	};
}

export async function getStaticProps({ params }) {
	const post = await parsePost(params.slug);
	const posts = await getAllPosts();
	const crntPostIdx = posts.findIndex(p => p.slug.split('/')[2] === params.slug);

	const prevPost = posts[crntPostIdx + 1] ?? {};
	const nextPost = posts[crntPostIdx - 1] ?? {};

	return {
		props: {
			...post,
			prevPost,
			nextPost,
		},
	};
}
