"use client";

import { AlertCircleIcon, CoinsIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { errorKeys, type FriendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * A friendly error with the right next step: Retry for server errors and
 * timeouts (never for 4xx input errors), Buy credits when out of credits.
 * Pass `title`/`message` to show custom copy instead of the error code's.
 */
export function ErrorAlert({
	error,
	title,
	message,
	onRetry,
	className,
}: {
	error?: FriendlyError;
	title?: string;
	message?: string;
	onRetry?: () => void;
	className?: string;
}) {
	const { t } = useI18n();
	const keys = error ? errorKeys(error) : null;
	const showRetry = Boolean(error?.retryable && onRetry);
	return (
		<Alert className={cn("border-danger/30 bg-danger-soft/60", className)}>
			<AlertCircleIcon className="text-danger" />
			<AlertTitle>{title ?? (keys ? t(keys.title) : "")}</AlertTitle>
			<AlertDescription className="text-foreground/80">
				<p>{message ?? (keys ? t(keys.message) : "")}</p>
				{showRetry || error?.needsCredits ? (
					<div className="mt-2 flex gap-2">
						{showRetry && (
							<Button size="sm" variant="outline" onClick={onRetry}>
								<RotateCcwIcon />
								{t("errors.tryAgain")}
							</Button>
						)}
						{error?.needsCredits && (
							<Button size="sm" asChild>
								<Link href="/billing">
									<CoinsIcon />
									{t("errors.buyCredits")}
								</Link>
							</Button>
						)}
					</div>
				) : null}
			</AlertDescription>
		</Alert>
	);
}
