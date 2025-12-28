import { useRouter } from 'next/router'

import Categories from '@/components/categories';
import getAllPosts from '@/utils/get-all-posts';
import PostListing from '@/components/post-listing';

export default function Posts({ posts, categories }) {

	const router = useRouter()
	
	const filters = {};
	Object.keys( router.query ).forEach( key => {
		filters[ key ] = router.query[ key ].split( ',' );
	})

	return (
		<>
		<div className='post-header'>
			<h1>Posts</h1>
			<Categories categories={ categories } />
		</div>
			<PostListing posts={ posts } filters={ filters } />
		</>
	);
}

export async function getStaticProps() {

	const posts = await getAllPosts();
	const categories = Array.from( new Set( posts.flatMap( p => p.categories ) ) ).sort();

	return {
		props: {
			posts,
			categories
		},
	}

}