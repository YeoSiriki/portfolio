'use server';

import { refresh } from 'next/cache';
import { MESSAGE_STATUSES, type MessageStatus } from '@/lib/constants';
import { prisma } from '@/lib/db';
import type { ActionResult } from '@/lib/forms';
import { getAdmin } from '@/lib/guard';
import { sendMail } from '@/lib/mail';
import { replySchema } from '@/lib/schemas';

const SESSION_EXPIRED: ActionResult = { ok: false, error: 'Session expirée. Reconnecte-toi pour continuer.' };

export async function setMessageStatus(id: string, status: MessageStatus): Promise<ActionResult> {
  if (!(await getAdmin())) return SESSION_EXPIRED;
  if (!MESSAGE_STATUSES.includes(status)) return { ok: false, error: 'Statut inconnu.' };
  await prisma.message.update({ where: { id }, data: { status } });
  refresh();
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  if (!(await getAdmin())) return SESSION_EXPIRED;
  await prisma.message.delete({ where: { id } });
  refresh();
  return { ok: true, message: 'Message supprimé.' };
}

export async function replyToMessage(id: string, input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return SESSION_EXPIRED;
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Réponse invalide.' };

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return { ok: false, error: 'Message introuvable.' };
  const profile = await prisma.profile.findUnique({ where: { id: 1 }, select: { publicEmail: true, fullName: true } });

  const result = await sendMail({
    to: message.email,
    replyTo: profile?.publicEmail,
    subject: `Re : ${message.topic}`,
    text: `${parsed.data.body}\n\n${profile?.fullName ?? ''}`.trim(),
  });

  // La réponse n'est enregistrée comme envoyée que si l'e-mail est réellement parti.
  if (!result.sent) {
    return {
      ok: false,
      error:
        result.reason === 'non-configure'
          ? "L'envoi d'e-mails n'est pas configuré (SMTP). Réponds depuis ta messagerie avec le lien ci-dessous."
          : "L'e-mail n'a pas pu être envoyé. Réessaie ou réponds depuis ta messagerie.",
    };
  }

  await prisma.message.update({
    where: { id },
    data: { status: 'READ', replyBody: parsed.data.body, repliedAt: new Date() },
  });
  refresh();
  return { ok: true, message: `Réponse envoyée à ${message.email}.` };
}
