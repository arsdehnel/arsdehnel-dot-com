import {useRouter} from 'next/router';
import Head from "next/head";
import Link from "next/link";

export default function Layout({ children }) {
	const router = useRouter()
	return (
		<>
			<Head>
				<title>Adam Dehnel</title>
				<meta name="description" content="Personal site for Adam Dehnel" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
				<link href='https://fonts.googleapis.com/css?family=Open Sans' rel='stylesheet' />
			</Head>
			<div className="layout-wrapper">
				<header>
					<div className="header-box">
						<h1>Adam Dehnel</h1>
						<div>father | nerd | cook | woodworker</div>
					</div>
				</header>
				<nav className="nav-main">
					<Link href="/" className={ router.pathname === "/" ? "active" : "" }>
						Home
					</Link>
					<Link href="/posts" className={ router.pathname.startsWith( "/posts" ) ? "active" : "" }>
						Posts
					</Link>
					<Link href="/about" className={ router.pathname === "/about" ? "active" : "" }>
						About
					</Link>
				</nav>
				<main>
					{ children }
				</main>
				<footer>&copy; 2025 Adam Dehnel</footer>
			</div>
		</>
	)
}