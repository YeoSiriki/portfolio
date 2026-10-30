'use server';

import { after } from 'next/server';
import { prisma } from '@/lib/db';
import type { ActionResult } from '@/lib/forms';
import { sendMail } from '@/lib/mail';
import { clientIpHash, rateLimit } from '@/lib/rate-limit';
import { contactSchema, fieldErrors } from '@/lib/schemas';
import { messageRetentionMonths, siteUrl } from '@/lib/site';

const MAX_MESSAGES = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function sendContactMessage(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Certains champs sont à corriger.', fieldErrors: fieldErrors(parsed.error) };
  }
  const { website, ...message } = parsed.data;

  // Champ piège rempli : c'est un robot. On répond comme si tout allait bien, sans rien enregistrer.
  if (website) return { ok: true };

  const ipHash = await clientIpHash();
  if (!(await rateLimit(`contact:${ipHash}`, MAX_MESSAGES, WINDOW_MS)).ok) {
    return { ok: false, error: 'Trop de messages envoyés. Réessayez dans une heure.' };
  }

  await prisma.message.create({ data: { ...message, ipHash } });

  // Conservation limitée : les messages plus anciens que la durée prévue sont supprimés.
  const limit = new Date();
  limit.setUTCMonth(limit.getUTCMonth() - messageRetentionMonths);
  await prisma.message.deleteMany({ where: { createdAt: { lt: limit } } });

  // La notification ne doit jamais faire échouer l'envoi : le message est déjà enregistré. Elle part après la
  // réponse au visiteur, qui voit la confirmation sans attendre le serveur de messagerie.
  const profile = await prisma.profile.findUnique({ where: { id: 1 }, select: { publicEmail: true } });
  const to = process.env.MAIL_TO || profile?.publicEmail;
  if (to) {
    after(() =>
      sendMail({
        to,
        replyTo: message.email,
        subject: `[Portfolio] ${message.topic} : ${message.name}`,
        text: [
          `Nouveau message reçu depuis le formulaire de contact.`,
          '',
          `Nom : ${message.name}`,
          `E-mail : ${message.email}`,
          `Objet : ${message.topic}`,
          '',
          message.body,
          '',
          `Répondre depuis l'admin : ${siteUrl}/admin/messages`,
        ].join('\n'),
      }),
    );
  }

  return { ok: true };
}
