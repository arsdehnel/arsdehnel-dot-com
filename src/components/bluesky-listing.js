import PostCard from './post-card';

export default function BlueskyListing({ posts }) {
	return (
		<>
			{posts.map(p => (
				<PostCard
					key={p.slugPartial}
					href={p.link}
					// biome-ignore lint: yeah it's hacky but we need it
					content={<article dangerouslySetInnerHTML={{ __html: p.content }} />}
				/>
			))}
		</>
	);
}
