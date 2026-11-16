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
import { api } from "@/lib/api";
import { type FriendlyError, toFriendlyError } from "@/lib/errors";
import { STATUS_META } from "@/lib/format";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";
import { useBearer } from "@/lib/useBearer";

export default function NewApplicationPage() {
	const router = useRouter();
	const bearer = useBearer();
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
			toast.success("Application saved");
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
					Applications
				</Link>
			</Button>
			<PageHeader
				title="New application"
				description="Paste the job description — you'll match your CV against it next."
			/>
			<form onSubmit={onSubmit}>
				<Card>
					<CardContent>
						<FieldGroup>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field>
									<FieldLabel htmlFor="title">Role</FieldLabel>
									<Input
										id="title"
										required
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Senior Frontend Engineer"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="company">Company</FieldLabel>
									<Input
										id="company"
										required
										value={company}
										onChange={(e) => setCompany(e.target.value)}
										placeholder="Acme Inc."
									/>
								</Field>
							</div>
							<Field>
								<FieldLabel htmlFor="description">Job description</FieldLabel>
								<Textarea
									id="description"
									required
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={12}
									placeholder="Paste the full job posting: responsibilities, requirements, nice-to-haves…"
									className="min-h-56"
								/>
								<FieldDescription>The more complete, the better the match analysis.</FieldDescription>
							</Field>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field>
									<FieldLabel htmlFor="applied">Date</FieldLabel>
									<Input
										id="applied"
										type="date"
										required
										value={appliedAt}
										onChange={(e) => setAppliedAt(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel>Stage</FieldLabel>
									<Select value={statusValue} onValueChange={(v) => setStatusValue(v as ApplicationStatus)}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{APPLICATION_STATUSES.map((s) => (
												<SelectItem key={s} value={s}>
													{STATUS_META[s].label}
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
							Cancel
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting && <Spinner />}
							Save application
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}
