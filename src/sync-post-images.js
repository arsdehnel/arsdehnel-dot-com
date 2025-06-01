import chalkTemplate from 'chalk-template';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

const srcDir = path.resolve( import.meta.dirname, '../posts' )
const destDir = path.resolve( import.meta.dirname, '../public/posts' )
const postImages = await glob( `${ srcDir }/**/*.jpg` );

console.log( '\n👉 Syncing post images to the public directory so they actually end up on the site' );

for ( const srcPath of postImages ) {

    const relativePath = srcPath.replace( srcDir, '' );
    const destPath = srcPath.replace( srcDir, destDir );

    console.log( chalkTemplate`\n  📁 Processing {cyan ${ relativePath }}` );
    console.log( chalkTemplate`    Source: {blue ${ srcPath }}` );
    console.log( chalkTemplate`    Dest:   {green ${ destPath }}` );

    await fs.mkdir( path.dirname( destPath ), { recursive: true } );
    await fs.copyFile( srcPath, destPath );

}