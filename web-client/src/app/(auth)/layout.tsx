import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-[#09090b] text-[#fafafa]">
			<div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-12">
				<Link href="/" className="mb-12 flex items-center gap-3">
					<Image
						src="/logo.png"
						alt="CurriClean"
						width={20}
						height={28}
						priority
						className="h-7 w-auto"
					/>
					<span className="text-lg font-semibold tracking-tight">CurriClean</span>
				</Link>
				<main className="flex flex-1 flex-col">{children}</main>
			</div>
		</div>
	);
}
