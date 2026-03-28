import getAboutSections from "@/utils/get-about-sections";
import markdownToHtml from "@/utils/markdown-to-html";

export default function About({ html }) {
	// biome-ignore lint: yeah it's hacky but we need it
	return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export async function getStaticProps() {
	const sections = await getAboutSections();
	const content = sections.map(({ content }) => content).join("\n\n");
	const html = await markdownToHtml(content);

	return {
		props: {
			html,
		},
	};
}
