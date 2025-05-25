import PostCard from '@/components/post-card';
import getAllPosts from '@/utils/get-all-posts';

export default function Posts({ posts }) {
	return (
		<>
			<h2>Posts</h2>
			<div className="posts-wrapper">
				{
					posts.map( p => <PostCard key={ p.key } { ...p } /> ) 
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