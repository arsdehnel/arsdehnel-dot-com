import classnames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { AiFillGithub, AiFillGitlab, AiFillLinkedin } from "react-icons/ai";

export default function Layout({ children, mainClass }) {
	const router = useRouter();
	return (
		<div className="layout-wrapper">
			<div
				style={{
					position: "sticky",
					top: 0,
					right: 0,
					height: 20,
					zIndex: 100,
				}}
			>
				<button
					type="button"
					onClick={() => (document.body.className = "font-roboto")}
				>
					Roboto
				</button>
				<button
					type="button"
					onClick={() => (document.body.className = "font-inconsolata")}
				>
					Inconsolata
				</button>
				<button
					type="button"
					onClick={() => (document.body.className = "font-pt")}
				>
					PT Mono
				</button>
			</div>
			<nav className="nav-main">
				<Link
					href="/posts"
					className={classnames({
						active: router.pathname.startsWith("/posts"),
						"secondary-link": true,
					})}
					id="secondary-link"
				>
					Posts
				</Link>
				<Link
					href="/"
					className={classnames({
						active: router.pathname === "/",
						"home-link": true,
					})}
				>
					Adam Dehnel
				</Link>
				<Link
					href="/about"
					className={classnames({
						active: router.pathname === "/about",
						"secondary-link": true,
					})}
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
