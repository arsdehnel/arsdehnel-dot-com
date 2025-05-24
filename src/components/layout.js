import {useRouter} from 'next/router';
import Link from "next/link";
import { AiFillGithub, AiFillLinkedin, AiFillGitlab } from "react-icons/ai";

export default function Layout({ children }) {
	const router = useRouter()
	return (
		<>
			<div className="layout-wrapper">
				<header>
					<div className="header-box">
						<h1>Adam Dehnel</h1>
						<div className="tagline">father | nerd | cook | woodworker</div>
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
				<footer>
					<a href="https://github.com/arsdehnel"><AiFillGithub /></a>
					<a href="https://www.linkedin.com/in/adamdehnel/"><AiFillLinkedin /></a>
					<a href="https://gitlab.com/arsdehnel"><AiFillGitlab /></a>
				</footer>
			</div>
		</>
	)
}