import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
	return (
		<Html>
			<Head>
				<meta name="description" content="Personal site for Adam Dehnel" />
				<link rel="icon" href="/favicon.ico" />
				<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel='stylesheet' />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}