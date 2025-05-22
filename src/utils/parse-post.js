import fs from 'fs/promises';
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export default async function parsePost(filePath) {

    const fileContents = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContents);

    // coverImage: "/assets/blog/dynamic-routing/cover.jpg"
    // ogImage:
    //   url: "/assets/blog/dynamic-routing/cover.jpg"

    return {
        data,
        content: await markdownToHtml(content)
    }

}

async function markdownToHtml(markdown) {
    const result = await remark().use(html).process(markdown);
    return result.toString();
}
