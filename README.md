# arsdehnel.com

Repo for arsdehnel.com

## Alt Text Generation

To help with accessibility there is a `node src/alt-text-generation.js` script that uses AWS Bedrock's Nova Premier model to generate alt text for the images in posts.  This is only ever intended to be run locally to avoid the complexity of AWS credential storage and access from a GitHub Action or anything like that.  The results are stored in `/src/image-alt-texts.json` so that we don't have to go fetch them again each time.  This file is then also pulled into the parsing of the posts as part of getting things published.  