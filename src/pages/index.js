import getAllPosts from '@/utils/get-all-posts';
import PostCard from '@/components/post-card';

export default function Home({ latestPost }) {
	return (
		<>
			<div className="home-columns">
				<div>
					<h2>This is Me</h2>
					<p>Welcome to my site. This site is about me in all aspects of life.  It started as a place to share technology-related things I'm curious about as they relate to my career but evolved into just something about me.  It's important to know more about a person than just what code repositories they have and how they approach modern software development. This tries to cover what's important to me and how I approach all things in life, not just software and technology.</p>
				</div>
				<div>
					<h2>Latest Post</h2>
					<PostCard { ...latestPost } />
				</div>
			</div>
		</>
	);
}

export async function getStaticProps() {

	const posts = await getAllPosts();

	return {
		props: {
			latestPost: posts[ 0 ]
		},
	}
}