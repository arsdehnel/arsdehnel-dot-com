import path from 'path';
import fs from 'fs/promises';

import parsePost from '@/utils/parse-post';

const postsDirectory = path.join(process.cwd(), 'posts')

export default async function getAllPosts() {

    const postsFiles = await fs.readdir(postsDirectory)
    const postEntries = await Promise.all( postsFiles.map( async filename => {
        const stats = await fs.lstat( path.join( postsDirectory, filename ) );
        return {
            filename,
            isDir: stats.isDirectory()
        }
    }))

    const postDirs = postEntries.filter( e => e.isDir ).map( e => e.filename );

    return await Promise.all(postDirs.map(async dir => {

        const postPath = path.join( postsDirectory, dir, 'post.md' )

        const post = await parsePost(postPath)

        return {
            key: dir,
            filename: dir,
            ...post,
            slug: `/posts/${dir}`,
        }

    }))

}