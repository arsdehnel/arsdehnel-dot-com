import fs from 'fs/promises';
import matter from "gray-matter";

import markdownToHtml from './markdown-to-html';

const imgParseRegex = new RegExp( /!\[(?<altText>.*)\]\s*\((?<filename>.*?)(?=\"|\))(?<title>\".*\")?\)/g );

export default async function parsePost(filePath) {

    const pathChunks = filePath.split( '/' ).slice( -2, -1 );
    const slugPartial = pathChunks[ 0 ];
    const fileContents = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContents);

    const matches = content.matchAll( imgParseRegex );

    let postContent = content;
    for( const match of matches ) {
        const [ originalRef, altText, originalFilename, title ] = match;
        const filename = `${ process.env.CI ? "/arsdehnel-dot-com" : "" }/posts/${ slugPartial }/${ originalFilename }`;
        const updTitle = title ? ( title.charAt( 0 ) === "\"" ? title.substring( 1, title.length - 2 ) : title ) : '';
        const updRef = `![${ altText }](${ filename } "${ updTitle }")`
        postContent = postContent.replace( originalRef, updRef )
    }

    return {
        ...data,
        coverImage: `/posts/${ slugPartial }/thumbnail.jpg`,
        ogImage: {
            url: `/posts/${ slugPartial }/thumbnail.jpg`
        },
        content: await markdownToHtml(postContent)
    }

}