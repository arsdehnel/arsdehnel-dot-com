import Image from 'next/image'
import Link from 'next/link'

import getAllPosts from '@/utils/get-all-posts';

export default function Posts({ posts }) {
	return (
		<>
			<h2>Posts</h2>
			<div className="posts-wrapper">
				{
					posts.map( p => {
						return (
							<div key={ p.key }>
								<h3><Link href={ p.slug }>{ p.title }</Link></h3>
								<div>Date: { p.date }</div>
								<p>{ p.excerpt }</p>
							</div>
						)
					}) 
				}
			</div>
		</>
	);
}

export async function getStaticProps() {

	const posts = await getAllPosts();

	return {
		props: {
			posts
		},
	}
}