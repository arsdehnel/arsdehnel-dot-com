import path from 'path';
import fs from 'fs/promises';

import parsePost from '@/utils/parse-post';

const postsDirectory = path.join(process.cwd(), 'posts')

export default async function getAllPosts() {

    const postsFiles = await fs.readdir(postsDirectory)
    let postEntries = await Promise.all( postsFiles.map( async dirEntry => {
        const stats = await fs.lstat( path.join( postsDirectory, dirEntry ) );
        return {
            dirEntry,
            isDir: stats.isDirectory()
        }
    }))

    postEntries = postEntries.filter( p => p.isDir || p.dirEntry.endsWith( '.md' ) )

    return await Promise.all(postEntries.map(async ( { dirEntry, isDir } ) => {

        const slugPartial = isDir ? dirEntry : dirEntry.replace( '.md', '' );
        const post = await parsePost(slugPartial)

        return {
            key: dirEntry,
            filename: dirEntry,
            ...post,
            slug: `/posts/${slugPartial}`,
        }

    }))

}