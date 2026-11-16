"use client";

import { AlertCircleIcon, CoinsIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { FriendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * A friendly error with the right next step: Retry for server errors and
 * timeouts (never for 4xx input errors), Buy credits when out of credits.
 */
export function ErrorAlert({
	error,
	onRetry,
	className,
}: {
	error: FriendlyError;
	onRetry?: () => void;
	className?: string;
}) {
	return (
		<Alert className={cn("border-danger/30 bg-danger-soft/60", className)}>
			<AlertCircleIcon className="text-danger" />
			<AlertTitle>{error.title}</AlertTitle>
			<AlertDescription className="text-foreground/80">
				<p>{error.message}</p>
				{(error.retryable && onRetry) || error.needsCredits ? (
					<div className="mt-2 flex gap-2">
						{error.retryable && onRetry && (
							<Button size="sm" variant="outline" onClick={onRetry}>
								<RotateCcwIcon />
								Try again
							</Button>
						)}
						{error.needsCredits && (
							<Button size="sm" asChild>
								<Link href="/billing">
									<CoinsIcon />
									Buy credits
								</Link>
							</Button>
						)}
					</div>
				) : null}
			</AlertDescription>
		</Alert>
	);
}
