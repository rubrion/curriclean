import type { Locale } from "@/i18n/config";
import { CONTACT_EMAIL } from "@/lib/site";

export const PRIVACY_UPDATED = "2026-11-16";

type Section = { title: string; body: string[] };

/** Privacy policy for curriclean.com and the Android app, per language. */
export const PRIVACY: Record<Locale, { title: string; updated: string; intro: string; sections: Section[] }> = {
	en: {
		title: "Privacy policy",
		updated: "Last updated",
		intro:
			"CurriClean (curriclean.com and the CurriClean Android app) is run by Rubrion. This policy explains what we collect, why, who processes it and how to delete it.",
		sections: [
			{
				title: "What we collect",
				body: [
					"Account: your email, name and password (stored only as a bcrypt hash). If you sign in with Google or GitHub, we get your name, email and profile picture from them.",
					"Applications: what you save in the tracker, such as company, job title, job description, status and dates, plus the AI analyses and tailored CV suggestions we generate for them. Those results can quote parts of your CV.",
					"Usage and credits: how many AI runs you use each day, your credit balance and your top-ups (pack, amount, date and the Stripe payment reference).",
				],
			},
			{
				title: "Your CV",
				body: [
					"Your CV text and uploaded PDFs are used only to run the analysis you ask for and are never stored. We keep a one-way hash of the text so we can reuse a result you already paid for instead of running it again.",
				],
			},
			{
				title: "How we use it",
				body: [
					"To run your account, the tracker and the AI features, to send verification and password-reset emails, to apply your daily free credit and your balance, and to prevent abuse. We don't sell your data, show ads or use it to train AI models.",
				],
			},
			{
				title: "Who processes it",
				body: [
					"Cloudflare hosts the site, the database and the AI models (Workers AI) and sends our emails. Stripe processes card payments on the web; we never see your card details. Google and GitHub handle sign-in if you choose them. Each acts on our behalf under its own privacy terms.",
				],
			},
			{
				title: "Cookies and storage",
				body: [
					"We use a sign-in cookie to keep you signed in, a cookie for your language and browser storage for the light/dark theme. There are no tracking, analytics or advertising cookies.",
				],
			},
			{
				title: "Android app",
				body: [
					"The app shows the same service as the website and follows this policy. It doesn't access your contacts, location, camera or microphone; it only reads a file when you pick a CV to upload. Credit purchases aren't available in the app.",
				],
			},
			{
				title: "How long we keep it",
				body: [
					"We keep your data while your account exists. When you delete your account, your data is removed from our database at once and from backups within 30 days. Stripe keeps its own payment records as the law requires.",
				],
			},
			{
				title: "Your rights and deleting your account",
				body: [
					"You can see and edit your applications in the app, and delete your account and all its data at any time from the account menu or at curriclean.com/delete-account. To access, correct or export your data, or for any privacy question, write to " +
						CONTACT_EMAIL +
						".",
				],
			},
			{
				title: "Children",
				body: ["CurriClean is not meant for children under 16 and we don't knowingly collect their data."],
			},
			{
				title: "Changes",
				body: ["If we change this policy, we'll update the date above and, for significant changes, let you know by email."],
			},
		],
	},
	pt: {
		title: "Política de privacidade",
		updated: "Atualizada em",
		intro:
			"O CurriClean (curriclean.com e o app CurriClean para Android) é mantido pela Rubrion. Esta política explica o que coletamos, por quê, quem trata os dados e como excluí-los.",
		sections: [
			{
				title: "O que coletamos",
				body: [
					"Conta: seu e-mail, nome e senha (guardada só como hash bcrypt). Se você entrar com Google ou GitHub, recebemos deles seu nome, e-mail e foto de perfil.",
					"Candidaturas: o que você salva no quadro, como empresa, cargo, descrição da vaga, status e datas, além das análises de IA e sugestões de CV que geramos para elas. Esses resultados podem citar trechos do seu currículo.",
					"Uso e créditos: quantas execuções de IA você usa por dia, seu saldo de créditos e suas recargas (pacote, valor, data e a referência do pagamento na Stripe).",
				],
			},
			{
				title: "Seu currículo",
				body: [
					"O texto do seu currículo e os PDFs enviados são usados só para fazer a análise que você pede e nunca são armazenados. Guardamos um hash irreversível do texto para reaproveitar um resultado que você já pagou em vez de rodá-lo de novo.",
				],
			},
			{
				title: "Como usamos",
				body: [
					"Para manter sua conta, o quadro de candidaturas e os recursos de IA, enviar e-mails de confirmação e de redefinição de senha, aplicar seu crédito grátis diário e seu saldo, e evitar abusos. Não vendemos seus dados, não mostramos anúncios e não os usamos para treinar modelos de IA.",
				],
			},
			{
				title: "Quem trata os dados",
				body: [
					"A Cloudflare hospeda o site, o banco de dados e os modelos de IA (Workers AI) e envia nossos e-mails. A Stripe processa pagamentos com cartão na web; nunca vemos os dados do seu cartão. Google e GitHub cuidam do login, se você escolher usá-los. Cada um atua em nosso nome, sob seus próprios termos de privacidade.",
				],
			},
			{
				title: "Cookies e armazenamento",
				body: [
					"Usamos um cookie de login para manter você conectado, um cookie para o idioma e o armazenamento do navegador para o tema claro/escuro. Não há cookies de rastreamento, análise ou publicidade.",
				],
			},
			{
				title: "App para Android",
				body: [
					"O app mostra o mesmo serviço do site e segue esta política. Ele não acessa seus contatos, localização, câmera ou microfone; só lê um arquivo quando você escolhe um currículo para enviar. A compra de créditos não está disponível no app.",
				],
			},
			{
				title: "Por quanto tempo guardamos",
				body: [
					"Guardamos seus dados enquanto sua conta existir. Quando você exclui a conta, os dados saem do nosso banco na hora e dos backups em até 30 dias. A Stripe mantém seus próprios registros de pagamento, como a lei exige.",
				],
			},
			{
				title: "Seus direitos e exclusão da conta",
				body: [
					"Você pode ver e editar suas candidaturas no app e excluir sua conta e todos os seus dados a qualquer momento pelo menu da conta ou em curriclean.com/delete-account. Para acessar, corrigir ou exportar seus dados, ou para qualquer dúvida sobre privacidade (inclusive direitos da LGPD), escreva para " +
						CONTACT_EMAIL +
						".",
				],
			},
			{
				title: "Crianças",
				body: ["O CurriClean não é destinado a menores de 16 anos e não coletamos dados deles intencionalmente."],
			},
			{
				title: "Mudanças",
				body: ["Se mudarmos esta política, atualizaremos a data acima e, em mudanças importantes, avisaremos por e-mail."],
			},
		],
	},
};
