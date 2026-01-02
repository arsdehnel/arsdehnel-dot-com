import getAllPosts from '@/utils/get-all-posts';
import PostCard from '@/components/post-card';

export default function Home({ latestPost }) {
	return (
		<>
			<div className="home-columns">
				<div>
					<h1>👋 Welcome to my site!</h1>
					<p>This site is about me in all aspects of life. It started as a place to share technology-related things I&apos;m curious about as they relate to my career but evolved into just something about me. It&apos;s important to know more about a person than just what code repositories they have and how they approach modern software development. This tries to cover what&apos;s important to me and how I approach all things in life, not just software and technology.</p>
					<div className="site-section-cards">
						<div className="site-section-card">
							<h3>Father</h3>
							<p>Being a father is the most important role I play in life.  The other roles exist to support this or really could be expressed as just a part of this.</p>
						</div>
						<div className="site-section-card">
							<h3>Nerd</h3>
							<p>Starting as a teenager in my parents&apos; basement breaking their 386 SX regularly I&apos;ve been a lifelong technology tinkerer.</p>
						</div>
						<div className="site-section-card">
							<h3>Cook</h3>
							<p>I certainly have childhood memories of food and helping in the kitchen but my passion for cooking has been on a slow simmer building throughout my life to where now it&apos;s something I think about all the time.</p>
						</div>
						<div className="site-section-card">
							<h3>Woodworker</h3>
							<p>My grandfather had a workshop in their basement and I have incredibly fond memories of spending time there.  I&apos;ve built up quite the shop myself now and love every minute I spend out there.</p>
						</div>
					</div>
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