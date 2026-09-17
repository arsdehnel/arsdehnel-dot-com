import AboutSectionCard from '@/components/about-section-card';
import BlueskyListing from '@/components/bluesky-listing';
import PostListing from '@/components/post-listing';
import getAboutSections from '@/utils/get-about-sections';
import getAllPosts from '@/utils/get-all-posts';
import getLatestBlueskyPosts from '@/utils/get-bluesky-posts';

export default function Home({ latestPosts, aboutSections, latestBlueskyPosts }) {
	return (
		<div className="home-columns">
			<section className="home-image" />

			<section className="home-hero">
				<div className="home-hero-content">
					<h1>👋 Welcome to my site!</h1>
					<p>
						This site is about me in all aspects of life. It started as a place to share technology-related things
						I&apos;m curious about as they relate to my career but evolved into just something about me. It&apos;s
						important to know more about a person than just what code repositories they have and how they approach
						modern software development. This tries to cover what&apos;s important to me and how I approach all things
						in life, not just software and technology.
					</p>
				</div>
			</section>

			<section className="home-who-am-i">
				<div className="section-intro">
					<h2>Who I Am</h2>
					<p>
						I sort of hate to categorize myself or slot my life into just a few buckets but these cover the major
						personas I like to consider for myself as part of daily life.
					</p>
				</div>
				<div className="site-section-cards">
					{aboutSections?.map(({ slugPartial, title, intro, image }) => (
						<AboutSectionCard key={slugPartial} title={title} intro={intro} image={image} />
					))}
				</div>
				<a className="more-link" href="/about">
					More About Me
				</a>
			</section>

			<section className="bluesky-posts">
				<div className="section-intro">
					<h2>Latest Bluesky Posts</h2>
					<p>
						I&apos;ve been posting on Bluesky for a while now and I try to share things that are interesting to me and
						things I think others might find interesting as well. It&apos;s a great platform for sharing thoughts and
						ideas in a more casual way than a blog post.
					</p>
				</div>
				<BlueskyListing posts={latestBlueskyPosts} />
				<a className="more-link" href="https://bsky.app/profile/arsdehnel.com" target="_blank" rel="noopener noreferrer">
					Read All Bluesky Posts
				</a>
			</section>

			<section className="posts">
				<div className="section-intro">
					<h2>Latest Posts</h2>
					<p>
						I'm always trying to post more and share what's going on in life and in my head. Certainly they don't
						cover everything but it's at least a glimpse into my inner workings.
					</p>
				</div>
				<div className="home-posts">
					<PostListing posts={latestPosts} />
				</div>
				<a className="more-link" href="/posts">
					Read All Posts
				</a>
			</section>
		</div>
	);
}

export async function getStaticProps() {
	const posts = await getAllPosts();
	const latestBlueskyPosts = await getLatestBlueskyPosts();
	const sections = await getAboutSections();
	const aboutSections = sections.filter(s => s.title);

	return {
		props: {
			latestPosts: posts.slice(0, 3),
			latestBlueskyPosts,
			mainClass: 'home',
			aboutSections,
		},
	};
}
