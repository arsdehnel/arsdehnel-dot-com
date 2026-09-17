export default function BlueskyListing({ posts }) {
	return (
		<>
			{posts.map(p => (
				<div className="bluesky-post" key={p.filename}>
					<article
						className="bluesky-post-content"
						// biome-ignore lint: yeah it's hacky but we need it
						dangerouslySetInnerHTML={{ __html: p.content }}
					/>
					<a href={p.link} target="_blank" rel="noopener noreferrer">
						View on Bluesky
					</a>
				</div>
			))}
		</>
	);
}
