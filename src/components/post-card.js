import Image from 'next/image';

export default function PostCard({ slug, title, date, excerpt, coverImage, content, coverImageAltText, href }) {
	return (
		<div className="post-card">
			{coverImage && (
				<a href={slug || href}>
					<Image src={coverImage} alt={coverImageAltText} height={400} width={400} />
				</a>
			)}
			{title && (
				<a href={slug || href}>
					<h3>{title}</h3>
				</a>
			)}
			<div className="card-content">{excerpt ? <p>{excerpt}</p> : content}</div>
			<div className="card-date">{date}</div>
			{href && (
				<a href={href} className="card-link" target="_blank" rel="noopener noreferrer">
					View on Bluesky
				</a>
			)}
		</div>
	);
}
