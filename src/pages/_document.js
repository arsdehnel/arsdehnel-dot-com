import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html>
			<Head>
				<meta name="description" content="Personal site for Adam Dehnel" />
				<link rel="icon" href="/favicon.ico" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
				<link
					href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil:opsz,wght@10..72,100..900&family=Inconsolata:wght@200..900&family=Oswald:wght@200..700&family=PT+Mono&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap"
					rel="stylesheet"
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
