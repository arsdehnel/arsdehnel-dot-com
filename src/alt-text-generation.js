import chalkTemplate from 'chalk-template';
import getAllPosts from './utils/get-all-posts.js';
import getAltText from './utils/get-alt-text.js';
import saveAltTexts from './utils/save-alt-texts.js';

import imgAltTexts from "./image-alt-texts.json" with { type: "json" };

const posts = await getAllPosts();

for( const post of posts ) {

    console.log( chalkTemplate`\n\n👉 Processing {yellow ${ post.slug }}` );

    for( const img of post.images ) {

        console.log( chalkTemplate`\n  👉 Determining alt text for {cyan ${ img.filename }}` );

        const imgPath = `${ post.slug.substring( 1 ) }/${ img.filename }`

        if( imgAltTexts[ imgPath ] ) {
            console.log( chalkTemplate`    ⏩ Already have alt text` );
            continue;
        }

        const altText = await getAltText( imgPath );

        imgAltTexts[ imgPath ] = altText;

        console.log( chalkTemplate`    ✅ Generated alt text {blue ${ altText }}` );
        
    }

}

await saveAltTexts( imgAltTexts );
