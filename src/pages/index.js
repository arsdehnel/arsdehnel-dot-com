import AboutSectionCard from "@/components/about-section-card";
import PostListing from "@/components/post-listing";
import getAboutSections from "@/utils/get-about-sections";
import getAllPosts from "@/utils/get-all-posts";

export default function Home({ latestPosts, aboutSections }) {
	return (
		<div className="home-columns">
			<section className="home-image" />

			<section className="home-hero">
				<div className="home-hero-content">
					<h1>👋 Welcome to my site!</h1>
					<p>
						This site is about me in all aspects of life. It started as a place
						to share technology-related things I&apos;m curious about as they
						relate to my career but evolved into just something about me.
						It&apos;s important to know more about a person than just what code
						repositories they have and how they approach modern software
						development. This tries to cover what&apos;s important to me and how
						I approach all things in life, not just software and technology.
					</p>
				</div>
			</section>

			<section className="home-who-am-i">
				<div className="section-intro">
					<h2>Who I Am</h2>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
				</div>
				<div className="site-section-cards">
					{aboutSections?.map(({ slugPartial, title, intro, image }) => (
						<AboutSectionCard
							key={slugPartial}
							title={title}
							intro={intro}
							image={image}
						/>
					))}
				</div>
				<a className="more-link" href="/about">
					More About Me
				</a>
			</section>

			<section className="posts">
				<div className="section-intro">
					<h2>Latest Posts</h2>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
	const sections = await getAboutSections();
	const aboutSections = sections.filter((s) => s.title);

	return {
		props: {
			latestPosts: posts.slice(0, 3),
			mainClass: "home",
			aboutSections,
		},
	};
}
