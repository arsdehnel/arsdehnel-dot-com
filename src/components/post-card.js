import Image from "next/image";
import { useRouter } from "next/router";

export default function PostCard({
	slug,
	title,
	date,
	excerpt,
	coverImage,
	coverImageAltText,
}) {
	const router = useRouter();

	return (
		// biome-ignore lint: yeah it's hacky but we need it
		<div className="post-card" onClick={(_e) => router.push(slug)}>
			<Image
				src={coverImage}
				alt={coverImageAltText}
				height={400}
				width={400}
			/>
			<h3>{title}</h3>
			<p className="post-excerpt">{excerpt}</p>
			<div className="post-date">{date}</div>
		</div>
	);
}
