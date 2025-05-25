import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import imgAltTexts from "../image-alt-texts.json" with { type: "json" };

export default async function saveAltTexts( imgPath, altText ) {

    imgAltTexts[ imgPath ] = altText;

    const sortedObject = {}

    Object.keys( imgAltTexts ).sort().forEach( key => {
        sortedObject[ key ] = imgAltTexts[ key ];
    })

    await fs.writeFile( resolve( import.meta.dirname, '../image-alt-texts.json' ), JSON.stringify( sortedObject, null, 4 ) );

}