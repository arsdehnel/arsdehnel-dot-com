import markdownToHtml from "@/utils/markdown-to-html";

const content = `## About Me

### Father

Holy hell so much of all the feels.

### Nerd

#### Youngster Hack

Growing up I wasn't really sure what I wanted to do &emdash; probably like most kids after we pass the age of thinking we could be a superhero and realize that being a professional athlete or move star is quite the long shot. Got our first desktop computer for Christmas in 1993 and looking back on it I see now it was the first thing that I really felt like I loved to do and was good at. I mean it was Windows 2.5 and seeing what I could do with a \`.bat\` file injected into the boot sequence on a 386SX running at a cracking 16Mhz but somehow that was _so fun_.

#### Figuring Things Out

High school. Band. Choir. Youth Group.

#### College

Lots of games. Dropped the major. Started the side business.

#### Early Career

Learning the ropes

#### Development for Real

FED. Gulp. Grunt. Backbone. Bootstrap.

#### Hitting My Stride

Architect. AWS. Microservices. Leading the team.

### Cook

Started early. Cooking for groups in college.


### Woodworker

Grandpa. Craig. College Desk. Kitchen.`

export default function About({ html }) {
	
	return (
		<>
			<div dangerouslySetInnerHTML={ { __html: html } } />
		</>
	);
}

export async function getStaticProps() {

	const html = await markdownToHtml( content );

	return {
		props: {
			html
		},
	}
}
