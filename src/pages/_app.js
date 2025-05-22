import Head from 'next/head'

import "@/styles/globals.css";
import "@/styles/home.scss";
import "@/styles/main.scss";
import "@/styles/nav.scss";
import "@/styles/posts.scss";

import Layout from '../components/layout'

export default function App({ Component, pageProps }) {
	return (
		<>
			<Head>
				<title>Adam Dehnel</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>
			<Layout>
				<Component {...pageProps} />
			</Layout>
		</>
	)
}