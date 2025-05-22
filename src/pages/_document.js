import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
	return (
		<Html>
			<Head>
				<meta name="description" content="Personal site for Adam Dehnel" />
				<link rel="icon" href="/favicon.ico" />
				<link href='https://fonts.googleapis.com/css?family=Open Sans' rel='stylesheet' />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}