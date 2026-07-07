"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function Header() {
	const { data } = useSession();
	const email = data?.user?.email;
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	return (
		<header className="border-b border-[#fafafa]/20">
			<div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
				<Link
					href="/applications"
					className="flex min-w-0 items-center gap-3"
					onClick={() => setOpen(false)}
				>
					<Image
						src="/logo.png"
						alt="CurriClean"
						width={20}
						height={28}
						priority
						className="h-7 w-auto shrink-0"
					/>
					<span className="truncate text-lg font-semibold tracking-tight">CurriClean</span>
				</Link>

				<nav className="hidden items-center gap-4 text-sm md:flex">
					<Link href="/applications" className="hover:underline">
						Applications
					</Link>
					<Link
						href="/applications/new"
						className="border border-[#fafafa] px-3 py-1.5 transition-colors hover:bg-[#fafafa] hover:text-[#09090b]"
					>
						New
					</Link>
					{email && (
						<>
							<span className="max-w-[180px] truncate font-mono text-xs text-[#64748b]">
								{email}
							</span>
							<button
								type="button"
								onClick={() => signOut({ callbackUrl: "/login" })}
								className="font-mono text-xs text-[#64748b] transition-colors hover:text-[#fafafa] hover:underline"
							>
								Sign out
							</button>
						</>
					)}
				</nav>

				<button
					type="button"
					aria-label={open ? "Close menu" : "Open menu"}
					aria-expanded={open}
					onClick={() => setOpen((v) => !v)}
					className="flex h-9 w-9 items-center justify-center border border-[#fafafa]/60 transition-colors hover:border-[#fafafa] hover:bg-[#fafafa] hover:text-[#09090b] md:hidden"
				>
					{open ? <CloseIcon /> : <MenuIcon />}
				</button>
			</div>

			{open && (
				<div className="border-t border-[#fafafa]/20 md:hidden">
					<nav className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-3 text-sm">
						<Link
							href="/applications"
							onClick={() => setOpen(false)}
							className="border border-transparent px-3 py-2 transition-colors hover:border-[#fafafa]/40 hover:bg-[#fafafa] hover:text-[#09090b]"
						>
							Applications
						</Link>
						<Link
							href="/applications/new"
							onClick={() => setOpen(false)}
							className="border border-[#fafafa] px-3 py-2 transition-colors hover:bg-[#fafafa] hover:text-[#09090b]"
						>
							New
						</Link>
						{email && (
							<>
								<span className="truncate px-3 pt-3 font-mono text-xs text-[#64748b]">
									{email}
								</span>
								<button
									type="button"
									onClick={() => {
										setOpen(false);
										signOut({ callbackUrl: "/login" });
									}}
									className="border border-[#fafafa]/40 px-3 py-2 text-left font-mono text-xs uppercase tracking-wider transition-colors hover:bg-[#fafafa] hover:text-[#09090b]"
								>
									Sign out
								</button>
							</>
						)}
					</nav>
				</div>
			)}
		</header>
	);
}

function MenuIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="square"
			aria-hidden="true"
		>
			<line x1="4" y1="7" x2="20" y2="7" />
			<line x1="4" y1="12" x2="20" y2="12" />
			<line x1="4" y1="17" x2="20" y2="17" />
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="square"
			aria-hidden="true"
		>
			<line x1="6" y1="6" x2="18" y2="18" />
			<line x1="18" y1="6" x2="6" y2="18" />
		</svg>
	);
}
