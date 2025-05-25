import path from 'path';
import fs from 'fs/promises';
import matter from "gray-matter";

import markdownToHtml from './markdown-to-html.js';
import imgAltTexts from "../image-alt-texts.json" with { type: "json" };

const postsDirectory = path.join(process.cwd(), 'posts')
const imgParseRegex = new RegExp( /!\[(?<altText>.*)\]\s*\((?<filename>.*?)(?=\"|\))(?<title>\".*\")?\)/g );

export default async function parsePost( slug ) {

    let postPath = path.join( postsDirectory, `${ slug }.md` ) 
    try {
        await fs.access( path.join( postsDirectory, slug ) );
        postPath = path.join( postsDirectory, slug, 'post.md' )
    } catch( err ) {
        // nothing, just need to use the try/catch to determine if the post is in a directory or just the root posts folder as a markdown file
    }
    
    const pathChunks = postPath.split( '/' ).slice( -2, -1 );
    const slugPartial = pathChunks[ 0 ];
    const fileContents = await fs.readFile(postPath, 'utf8')
    const { data, content } = matter(fileContents);

    const imageRefs = content.matchAll( imgParseRegex );
    const images = [];

    let postContent = content;
    for( const imageRef of imageRefs ) {
        let [ originalRef, altText, srcFilename, title ] = imageRef;
        srcFilename = srcFilename.trim();
        const updTitle = title ? ( title.charAt( 0 ) === "\"" ? title.substring( 1, title.length - 2 ) : title ) : '';
        const imgPath = `posts/${ slugPartial }/${ srcFilename }`;
        const publishAltText = altText ? altText : imgAltTexts[ imgPath ];
        images.push( {
            ref: originalRef, 
            altText: publishAltText, 
            filename: srcFilename, 
            title: updTitle
        })
        const servedPath = `${ process.env.CI ? "/arsdehnel-dot-com/" : "/" }${ imgPath }`;
        const updRef = `![${ publishAltText }](${ servedPath } "${ updTitle }")`
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