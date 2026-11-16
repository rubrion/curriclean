import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function AuthHeading({ title, description }: { title: string; description?: React.ReactNode }) {
	return (
		<div className="mb-6 flex flex-col gap-1.5">
			<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
			{description && <p className="text-sm text-muted-foreground">{description}</p>}
		</div>
	);
}

export function AuthNotice({ kind, children }: { kind: "success" | "error"; children: React.ReactNode }) {
	return kind === "success" ? (
		<Alert className="border-success/30 bg-success-soft/60">
			<CheckCircle2Icon className="text-success" />
			<AlertDescription className="text-foreground/85">{children}</AlertDescription>
		</Alert>
	) : (
		<Alert className="border-danger/30 bg-danger-soft/60">
			<AlertCircleIcon className="text-danger" />
			<AlertDescription className="text-foreground/85">{children}</AlertDescription>
		</Alert>
	);
}
