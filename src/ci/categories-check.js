import chalk from 'chalk-template';
import categoryKeys from '../components/categories/category-keys.js';
import getAllPosts from '../utils/get-all-posts.js';

const validCategories = new Set(categoryKeys);
const posts = await getAllPosts();

for (const post of posts) {
	for (const category of post.categories) {
		if (!validCategories.has(category)) {
			console.error(chalk`🚨 Post {yellow ${post.title}} has unknown category {red ${category}}.`);
			process.exit(1);
		}
	}
}
