import Link from "next/link";
import { useRouter } from "next/router";
import { AiFillGithub, AiFillGitlab, AiFillLinkedin } from "react-icons/ai";

export default function Layout({ children, mainClass }) {
	const router = useRouter();
	return (
		<div className="layout-wrapper">
			<nav className="nav-main">
				<Link
					href="/posts"
					className={router.pathname.startsWith("/posts") ? "active" : ""}
					id="secondary-link"
				>
					Posts
				</Link>
				<Link
					href="/"
					className={router.pathname === "/" ? "active" : ""}
					id="home"
				>
					Adam Dehnel
				</Link>
				<Link
					href="/about"
					className={router.pathname === "/about" ? "active" : ""}
					id="secondary-link"
				>
					About
				</Link>
			</nav>
			<main className={mainClass}>
				<div className="content-wrapper">{children}</div>
			</main>
			<footer>
				<a href="https://github.com/arsdehnel">
					<AiFillGithub />
				</a>
				<a href="https://www.linkedin.com/in/adamdehnel/">
					<AiFillLinkedin />
				</a>
				<a href="https://gitlab.com/arsdehnel">
					<AiFillGitlab />
				</a>
			</footer>
		</div>
	);
}
