import chalk from "chalk-template";
import iconMap from "../components/categories/icon-map.js";
import getAllPosts from "../utils/get-all-posts.js";

const posts = await getAllPosts();

for (const post of posts) {
	for (const category of post.categories) {
		if (!iconMap[category]) {
			console.error(
				chalk`🚨 Post {yellow ${post.title}} has unknown category {red ${category}}.`,
			);
			process.exit(1);
		}
	}
}
