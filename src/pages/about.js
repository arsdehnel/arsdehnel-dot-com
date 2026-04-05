import classnames from "classnames";
import Image from "next/image";
import getAboutSections from "@/utils/get-about-sections";

export default function About({ sections }) {
	return (
		<>
			<h1>About Me</h1>
			<div className="about-quadrant-wrapper">
				{sections.map(({ slugPartial, title, content, image }) => (
					<div
						key={slugPartial}
						className={classnames(
							"about-quadrant",
							`about-quadrant-${slugPartial}`,
						)}
					>
						<h3>{title}</h3>
						<p>
							<span className="about-quadrant-shape" />
							{content}
						</p>
						<Image
							className="about-quadrant-image"
							src={image.src}
							width={150}
							height={150}
							alt={image.alt}
						/>
					</div>
				))}
				<div className="center-image" />
			</div>
		</>
	);
}

const defaultContent =
	"lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, voluptate. Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, voluptate. Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, voluptate. Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, voluptate. Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, voluptate. Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, voluptate. Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, voluptate. ";

export async function getStaticProps() {
	const sections = await getAboutSections();

	const aboutSections = sections
		.filter(({ slugPartial }) => slugPartial !== "_intro")
		.map(({ slugPartial, ...rest }) => ({
			slugPartial,
			...rest,
			content:
				rest.insights?.map(({ hook }) => `${hook}.`).join(" ") ||
				defaultContent,
		}));

	return {
		props: {
			sections: aboutSections,
		},
	};
}
