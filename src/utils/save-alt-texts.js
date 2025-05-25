import fs from 'node:fs/promises';
import { resolve } from 'node:path';

export default async function saveAltTexts( altTextObj ) {

    await fs.writeFile( resolve( import.meta.dirname, '../image-alt-texts.json' ), JSON.stringify( altTextObj, null, 4 ) );

}