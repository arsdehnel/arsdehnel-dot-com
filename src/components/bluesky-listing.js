export default function BlueskyListing({ posts }) {
	return (
		<>
			{posts.map(p => (
				<div className="bluesky-post" key={p.filename}>
					<a href={p.link} target="_blank" rel="noopener noreferrer">
						View Post on Bluesky
					</a>
					<p>{p.content}</p>
				</div>
			))}
		</>
	);
}
