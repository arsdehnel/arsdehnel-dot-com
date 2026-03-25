import Image from "next/image";
import PostListing from "@/components/post-listing";
import getAllPosts from "@/utils/get-all-posts";

export default function Home({ latestPosts }) {
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
					<div className="site-section-card">
						<Image
							className="home-card-image"
							src="/about-cards/father.jpg"
							width={400}
							height={400}
							alt="alt text here"
						/>
						<h3>Father</h3>
						<p>
							Being a father is the most important role I play in life. The
							other roles exist to support this or really could be expressed as
							just a part of this.
						</p>
					</div>
					<div className="site-section-card">
						<Image
							className="home-card-image"
							src="/about-cards/nerd.jpg"
							width={400}
							height={400}
							alt="alt text here"
						/>
						<h3>Nerd</h3>
						<p>
							Starting as a teenager in my parents&apos; basement breaking their
							386 SX regularly I&apos;ve been a lifelong technology tinkerer.
						</p>
					</div>
					<div className="site-section-card">
						<Image
							className="home-card-image"
							src="/about-cards/cook.jpg"
							width={400}
							height={400}
							alt="alt text here"
						/>
						<h3>Cook</h3>
						<p>
							I certainly have childhood memories of food and helping in the
							kitchen but my passion for cooking has been on a slow simmer
							building throughout my life to where now it&apos;s something I
							think about all the time.
						</p>
					</div>
					<div className="site-section-card">
						<Image
							className="home-card-image"
							src="/about-cards/woodworker.jpg"
							width={400}
							height={400}
							alt="alt text here"
						/>
						<h3>Woodworker</h3>
						<p>
							My grandfather had a workshop in his basement and I have
							incredibly fond memories of spending time there. I&apos;ve built
							up quite the shop myself now and love every minute I spend out
							there.
						</p>
					</div>
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

	return {
		props: {
			latestPosts: posts.slice(0, 3),
			mainClass: "home",
		},
	};
}
