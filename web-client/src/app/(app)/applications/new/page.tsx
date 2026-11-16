"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorAlert } from "@/components/ErrorAlert";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api";
import { type FriendlyError, toFriendlyError } from "@/lib/errors";
import { STATUS_META } from "@/lib/format";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";
import { useBearer } from "@/lib/useBearer";

export default function NewApplicationPage() {
	const router = useRouter();
	const bearer = useBearer();
	const { t } = useI18n();
	const [company, setCompany] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [appliedAt, setAppliedAt] = useState(() => new Date().toISOString().slice(0, 10));
	const [statusValue, setStatusValue] = useState<ApplicationStatus>("saved");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<FriendlyError | null>(null);

	async function onSubmit(e?: React.FormEvent) {
		e?.preventDefault();
		if (!bearer) return;
		setError(null);
		setSubmitting(true);
		try {
			const created = await api.createApplication(bearer, {
				company: company.trim(),
				title: title.trim(),
				description,
				applied_at: `${appliedAt}T12:00:00.000Z`, // midday UTC: the same calendar day in every timezone
				status: statusValue,
			});
			toast.success(t("new.saved"));
			router.push(`/applications/${created.id}`);
		} catch (err) {
			setError(toFriendlyError(err));
			setSubmitting(false);
		}
	}

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-2">
			<Button asChild variant="ghost" size="sm" className="self-start text-muted-foreground">
				<Link href="/applications">
					<ArrowLeftIcon />
					{t("common.back")}
				</Link>
			</Button>
			<PageHeader
				title={t("new.title")}
				description={t("new.subtitle")}
			/>
			<form onSubmit={onSubmit}>
				<Card>
					<CardContent>
						<FieldGroup>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field>
									<FieldLabel htmlFor="title">{t("new.role")}</FieldLabel>
									<Input
										id="title"
										required
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder={t("new.rolePlaceholder")}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="company">{t("new.company")}</FieldLabel>
									<Input
										id="company"
										required
										value={company}
										onChange={(e) => setCompany(e.target.value)}
										placeholder={t("new.companyPlaceholder")}
									/>
								</Field>
							</div>
							<Field>
								<FieldLabel htmlFor="description">{t("new.description")}</FieldLabel>
								<Textarea
									id="description"
									required
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={12}
									placeholder={t("new.descriptionPlaceholder")}
									className="min-h-56"
								/>
								<FieldDescription>{t("new.descriptionHint")}</FieldDescription>
							</Field>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field>
									<FieldLabel htmlFor="applied">{t("new.date")}</FieldLabel>
									<Input
										id="applied"
										type="date"
										required
										value={appliedAt}
										onChange={(e) => setAppliedAt(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel>{t("new.stage")}</FieldLabel>
									<Select value={statusValue} onValueChange={(v) => setStatusValue(v as ApplicationStatus)}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{APPLICATION_STATUSES.map((s) => (
												<SelectItem key={s} value={s}>
													{t(STATUS_META[s].label)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							</div>
							{error && <ErrorAlert error={error} onRetry={() => onSubmit()} />}
						</FieldGroup>
					</CardContent>
					<CardFooter className="justify-end gap-2 border-t bg-muted/30 py-3">
						<Button type="button" variant="ghost" onClick={() => router.back()}>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting && <Spinner />}
							{t("new.save")}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}
