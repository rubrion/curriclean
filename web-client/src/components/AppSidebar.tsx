"use client";

import {
	ChevronsUpDownIcon,
	CoinsIcon,
	KanbanSquareIcon,
	LayoutDashboardIcon,
	ListIcon,
	LogOutIcon,
	PlusIcon,
	SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useBilling } from "@/lib/billing";

const NAV = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
	{ href: "/applications", label: "Applications", icon: ListIcon },
	{ href: "/applications?view=board", label: "Pipeline board", icon: KanbanSquareIcon },
	{ href: "/billing", label: "Credits & billing", icon: CoinsIcon },
];

export function AppSidebar() {
	const pathname = usePathname();
	const board = useSearchParams().get("view") === "board";
	const { setOpenMobile } = useSidebar();

	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarHeader>
				<Link href="/dashboard" className="flex h-10 items-center px-1.5" onClick={() => setOpenMobile(false)}>
					<Logo className="group-data-[collapsible=icon]:hidden" />
					<Logo withWordmark={false} className="hidden group-data-[collapsible=icon]:flex" markClassName="h-6" />
				</Link>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									tooltip="New application"
									className="bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
								>
									<Link href="/applications/new" onClick={() => setOpenMobile(false)}>
										<PlusIcon />
										<span>New application</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Workspace</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV.map((item) => {
								const [path, query] = item.href.split("?");
								const active =
									path === "/applications"
										? pathname.startsWith("/applications") &&
											!pathname.startsWith("/applications/new") &&
											(query ? board : !board)
										: pathname.startsWith(path);
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton asChild isActive={active} tooltip={item.label}>
											<Link href={item.href} onClick={() => setOpenMobile(false)}>
												<item.icon />
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<CreditsCard />
				<UserMenu />
			</SidebarFooter>
		</Sidebar>
	);
}

function CreditsCard() {
	const { billing } = useBilling();
	if (!billing) return null;
	return (
		<div className="rounded-lg border bg-card p-3 text-sm group-data-[collapsible=icon]:hidden">
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-1.5 font-medium">
					<SparklesIcon className="size-3.5 text-primary" />
					Free credit today
				</span>
				<span className="font-mono text-xs tabular-nums text-muted-foreground">
					{billing.daily_credit_left}/{billing.daily_credit}
				</span>
			</div>
			<Progress
				value={(billing.daily_credit_left / Math.max(1, billing.daily_credit)) * 100}
				className="mt-2 h-1.5"
			/>
			<div className="mt-3 flex items-center justify-between">
				<span className="text-muted-foreground">
					<span className="font-semibold tabular-nums text-foreground">{billing.credits}</span> credits
				</span>
				<Button asChild size="xs" variant="outline">
					<Link href="/billing">Top up</Link>
				</Button>
			</div>
		</div>
	);
}

function UserMenu() {
	const { data } = useSession();
	const { isMobile } = useSidebar();
	const user = data?.user;
	if (!user) return null;
	const initials = (user.name ?? user.email ?? "?")
		.split(/[\s@.]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((s) => s[0]?.toUpperCase())
		.join("");

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
							<Avatar className="size-8 rounded-lg">
								{user.image && <AvatarImage src={user.image} alt="" />}
								<AvatarFallback className="rounded-lg bg-accent text-accent-foreground">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name ?? "Your account"}</span>
								<span className="truncate text-xs text-muted-foreground">{user.email}</span>
							</div>
							<ChevronsUpDownIcon className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side={isMobile ? "bottom" : "right"}
						align="end"
						className="min-w-56"
					>
						<DropdownMenuLabel className="truncate font-normal text-muted-foreground">
							{user.email}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href="/billing">
								<CoinsIcon />
								Credits & billing
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
							<LogOutIcon />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
