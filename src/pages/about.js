import getAboutContent from "@/utils/get-about-content";
import markdownToHtml from "@/utils/markdown-to-html";

export default function About({ html }) {
	// biome-ignore lint: yeah it's hacky but we need it
	return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export async function getStaticProps() {
	const content = await getAboutContent();
	const html = await markdownToHtml(content);

	return {
		props: {
			html,
		},
	};
}
