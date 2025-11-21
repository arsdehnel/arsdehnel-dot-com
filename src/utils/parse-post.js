import path from 'path';
import fs from 'fs/promises';
import matter from "gray-matter";

import markdownToHtml from './markdown-to-html.js';
import imgAltTexts from "../image-alt-texts.json" with { type: "json" };

const postsDirectory = path.join(process.cwd(), 'posts')
const imgParseRegex = new RegExp( /!\[(?<altText>.*)\]\s*\((?<filename>.*?)(?=\"|\))(?<title>\".*\")?\)/g );

export default async function parsePost( slug ) {

    const postPath = path.join( postsDirectory, slug, 'post.md' )    
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
        const servedPath = `/${ imgPath }`;
        const updRef = `![${ publishAltText }](${ servedPath } "${ updTitle }")`
        postContent = postContent.replace( originalRef, updRef )
    }

    if( data.thumbnail ) {
        const coverImgPath = `posts/${ slugPartial }/${ data.thumbnail }` 
        data.coverImage = coverImgPath
        data.coverImageAltText = imgAltTexts[ coverImgPath ] || null;
        data.ogImage = {
            url: `posts/${ slugPartial }/${ data.thumbnail }`
        };
        images.push( {
            altText: imgAltTexts[ coverImgPath ] || '', 
            filename: data.thumbnail, 
            title: 'Thumbnail'
        })
    }

    return {
        ...data,
        images,
        content: await markdownToHtml(postContent)
    }

}