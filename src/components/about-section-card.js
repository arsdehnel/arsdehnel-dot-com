import Image from "next/image";

export default function AboutSectionCard({ title, intro, image }) {
	return (
		<div className="site-section-card">
			<Image
				className="home-card-image"
				src={image.src}
				width={400}
				height={400}
				alt={image.alt}
			/>
			<div className="site-section-content">
				<h3>{title}</h3>
				<p>{intro}</p>
			</div>
		</div>
	);
}
