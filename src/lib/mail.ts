import 'server-only';
import { lookup } from 'node:dns/promises';
import nodemailer from 'nodemailer';

type MailResult = { sent: true } | { sent: false; reason: 'non-configure' | 'echec' };

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

async function transport() {
  const host = process.env.SMTP_HOST ?? '';
  const port = Number(process.env.SMTP_PORT ?? 587);
  // Nodemailer cherche aussi une adresse IPv6 avant de se connecter : sur un réseau dont le DNS ne répond pas
  // aux requêtes IPv6, il attend jusqu'à 30 s. On résout donc l'adresse IPv4 nous-mêmes ; le nom du serveur
  // reste utilisé pour vérifier son certificat TLS.
  const address = await lookup(host, { family: 4 })
    .then((result) => result.address)
    .catch(() => host);
  return nodemailer.createTransport({
    host: address,
    port,
    secure: port === 465,
    tls: { servername: host },
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
}

export async function sendMail(message: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<MailResult> {
  if (!mailConfigured()) {
    console.warn(`[mail] SMTP non configuré, e-mail non envoyé : ${message.subject}`);
    return { sent: false, reason: 'non-configure' };
  }
  try {
    await (await transport()).sendMail({ from: process.env.MAIL_FROM, ...message });
    return { sent: true };
  } catch (error) {
    console.error('[mail] échec de l’envoi', error);
    return { sent: false, reason: 'echec' };
  }
}
