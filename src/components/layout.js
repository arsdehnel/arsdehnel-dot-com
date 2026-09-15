import classnames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaBluesky, FaGithub, FaGitlab, FaLinkedin } from 'react-icons/fa6';

export default function Layout({ children, mainClass }) {
	const router = useRouter();
	return (
		<div className="layout-wrapper">
			<nav className="nav-main">
				<Link
					href="/posts"
					className={classnames({
						active: router.pathname.startsWith('/posts'),
						'secondary-link': true,
					})}
					id="secondary-link"
				>
					Posts
				</Link>
				<Link
					href="/"
					className={classnames({
						active: router.pathname === '/',
						'home-link': true,
					})}
				>
					Adam Dehnel
				</Link>
				<Link
					href="/about"
					className={classnames({
						active: router.pathname === '/about',
						'secondary-link': true,
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
					<FaGithub />
				</a>
				<a href="https://www.linkedin.com/in/adamdehnel/">
					<FaLinkedin />
				</a>
				<a href="https://gitlab.com/arsdehnel">
					<FaGitlab />
				</a>
				<a href="https://bsky.app/profile/arsdehnel.com">
					<FaBluesky />
				</a>
			</footer>
		</div>
	);
}
