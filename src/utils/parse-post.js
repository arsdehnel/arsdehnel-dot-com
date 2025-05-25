import path from 'path';
import fs from 'fs/promises';
import matter from "gray-matter";

import markdownToHtml from './markdown-to-html.js';

const postsDirectory = path.join(process.cwd(), 'posts')
const imgParseRegex = new RegExp( /!\[(?<altText>.*)\]\s*\((?<filename>.*?)(?=\"|\))(?<title>\".*\")?\)/g );

export default async function parsePost( slug ) {

    let isDir = true;
    try {
        await fs.access( path.join( postsDirectory, slug ) );
    } catch( err ) {
        isDir = false;
    }
    
    // const postPath = path.join( postsDirectory, params.slug, 'post.md' )
    let postPath = path.join( postsDirectory, `${ slug }.md` )
    if( isDir ) {
        postPath = path.join( postsDirectory, slug, 'post.md' )
    }

    const pathChunks = postPath.split( '/' ).slice( -2, -1 );
    const slugPartial = pathChunks[ 0 ];
    const fileContents = await fs.readFile(postPath, 'utf8')
    const { data, content } = matter(fileContents);

    const imageRefs = content.matchAll( imgParseRegex );
    const images = [];

    let postContent = content;
    for( const imageRef of imageRefs ) {
        const [ originalRef, altText, srcFilename, title ] = imageRef;
        const updTitle = title ? ( title.charAt( 0 ) === "\"" ? title.substring( 1, title.length - 2 ) : title ) : '';
        images.push( {
            ref: originalRef, 
            altText, 
            filename: srcFilename.trim(), 
            title: updTitle
        })
        const servedPath = `${ process.env.CI ? "/arsdehnel-dot-com" : "" }/posts/${ slugPartial }/${ srcFilename }`;
        const updRef = `![${ altText }](${ servedPath } "${ updTitle }")`
        postContent = postContent.replace( originalRef, updRef )
    }

    return {
        ...data,
        coverImage: `/posts/${ slugPartial }/thumbnail.jpg`,
        ogImage: {
            url: `/posts/${ slugPartial }/thumbnail.jpg`
        },
        images,
        content: await markdownToHtml(postContent)
    }

}