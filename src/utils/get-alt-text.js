import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const prompt = "Please provide alt text for this image. Please keep it under 125 characters.";

let client;

export default async function getAltText( imgPath ) {

    const fullImgPath = resolve( import.meta.dirname, '../..', imgPath );

    console.log( chalkTemplate`    📂 Reading {cyan ${ fullImgPath }} into a base64 string` );

    const base64Img = await readFile( fullImgPath, "base64" );

    if( !client ) {
        client = new BedrockRuntimeClient({
            region: 'us-west-2'
        });
    }

    const modelCmd = new InvokeModelCommand( {
        modelId: 'us.amazon.nova-premier-v1:0',
        body: JSON.stringify( getInput( base64Img, prompt ) )
    })

    const res = await client.send( modelCmd );

    const answer = JSON.parse( Buffer.from( res.body ).toString( "utf8" ) );

    return answer.output.message.content[ 0 ].text

}

function getInput( base64Img, prompt ) {
    return {
        inferenceConfig: {
            max_new_tokens: 1000
        },
        messages: [
            {
                role: "user",
                content: [
                    {
                        image: {
                            format: "jpeg",
                            source: { bytes: base64Img }
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }
        ]
    }
}
