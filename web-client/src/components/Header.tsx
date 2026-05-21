import Link from "next/link";

export function Header() {
	return (
		<header className="border-b border-[#fafafa]/20">
			<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
				<Link href="/applications" className="flex items-center gap-3">
					<svg width="28" height="28" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
						<g fill="#fafafa">
							<path d="M60 0 L12 28 V65 L35 52 V36 L60 22 L85 36 L108 23 L60 0Z" />
							<path d="M35 78 L60 63 L85 78 V62 L60 47 L35 62 V78Z" />
							<path d="M12 75 V102 L60 130 L108 102 V55 L85 68 V93 L60 108 L35 93 V89 L12 75Z" />
						</g>
					</svg>
					<span className="text-lg font-semibold tracking-tight">SpecFit</span>
				</Link>
				<nav className="flex items-center gap-4 text-sm">
					<Link href="/applications" className="hover:underline">
						Applications
					</Link>
					<Link
						href="/applications/new"
						className="border border-[#fafafa] px-3 py-1.5 hover:bg-[#fafafa] hover:text-[#09090b] transition-colors"
					>
						New
					</Link>
				</nav>
			</div>
		</header>
	);
}
