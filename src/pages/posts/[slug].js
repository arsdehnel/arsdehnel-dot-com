import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6';
import Categories from '@/components/categories/categories';
import getAllPosts from '@/utils/get-all-posts';
import parsePost from '@/utils/parse-post';

export default function Post({ title, categories, content, coverImage, coverImageAltText, date, prevPost, nextPost }) {
	useEffect(() => {
		const buttons = document.querySelectorAll('button[data-name="rehype-pretty-copy-button"]');
		buttons.forEach(btn => {
			btn.addEventListener('click', async () => {
				const pre = btn.closest('pre');
				const code = pre?.querySelector('code')?.innerText ?? pre?.innerText ?? '';
				const duration = Number(btn.getAttribute('data-feedback-duration')) || 2000;
				await navigator.clipboard.writeText(code);
				btn.classList.add('rehype-pretty-copied');
				setTimeout(() => btn.classList.remove('rehype-pretty-copied'), duration);
			});
		});
	}, []);

	return (
		<>
			<div className="breadcrumbs">
				<Link href="/posts">&lt; Posts</Link>
			</div>
			<header className="post-header">
				<div className="post-meta">
					<Image src={`/${coverImage}`} alt={coverImageAltText} height={150} width={150} />
					<div className="post-meta-inner">
						<h1>{title}</h1>
						{date && (
							<div className="post-meta-date">
								{new Intl.DateTimeFormat('en-US', { month: '2-digit', year: '2-digit', day: '2-digit' }).format(
									new Date(date),
								)}
							</div>
						)}
					</div>
				</div>
				<Categories categories={categories} />
			</header>

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
