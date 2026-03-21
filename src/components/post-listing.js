import PostCard from "@/components/post-card";

export default function PostListing({ posts, filters }) {
	let filteredPosts = posts;
	if (filters) {
		Object.keys(filters).forEach((prop) => {
			filteredPosts = filteredPosts.filter((p) =>
				filters[prop].some((filterVal) => p[prop].includes(filterVal)),
			);
		});
	}

	return (
		<>
			{filteredPosts.map((p) => (
				<PostCard key={p.slugPartial} {...p} />
			))}
		</>
	);
}
