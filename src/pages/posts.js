import { useRouter } from 'next/router'

import Categories from '@/components/categories/categories';
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
			<h2>Posts</h2>
			<Categories categories={ categories } />
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