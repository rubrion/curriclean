"use client";

import { Trash2Icon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { ErrorAlert } from "@/components/ErrorAlert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api";
import { toFriendlyError, type FriendlyError } from "@/lib/errors";
import { useBearer } from "@/lib/useBearer";

/** Confirms, deletes the account and all its data, then signs out. */
export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const bearer = useBearer();
	const { t } = useI18n();
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<FriendlyError | null>(null);

	async function remove() {
		setDeleting(true);
		setError(null);
		try {
			await api.deleteAccount(bearer);
			await signOut({ callbackUrl: "/login?deleted=1" });
		} catch (e) {
			setError(toFriendlyError(e));
			setDeleting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !deleting && onOpenChange(o)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("delete.title")}</DialogTitle>
					<DialogDescription>{t("delete.desc")}</DialogDescription>
				</DialogHeader>
				{error && <ErrorAlert error={error} onRetry={remove} />}
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
						{t("delete.cancel")}
					</Button>
					<Button variant="destructive" onClick={remove} disabled={deleting || !bearer}>
						{deleting ? <Spinner /> : <Trash2Icon />}
						{t("delete.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Button that opens the delete dialog (public /delete-account page). */
export function DeleteAccountButton() {
	const { t } = useI18n();
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button variant="destructive" onClick={() => setOpen(true)}>
				<Trash2Icon />
				{t("delete.confirm")}
			</Button>
			<DeleteAccountDialog open={open} onOpenChange={setOpen} />
		</>
	);
}
