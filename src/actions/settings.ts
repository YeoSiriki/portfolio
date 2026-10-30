'use server';

import bcrypt from 'bcryptjs';
import { updateTag } from 'next/cache';
import { CONTENT_TAG } from '@/lib/constants';
import { prisma } from '@/lib/db';
import type { ActionResult } from '@/lib/forms';
import { getAdmin } from '@/lib/guard';
import { fieldErrors, homeSchema, legalSchema, passwordSchema, profileSchema, skillsSchema } from '@/lib/schemas';
import { deleteUnusedFiles } from '@/lib/storage';

const SESSION_EXPIRED: ActionResult = { ok: false, error: 'Session expirée. Reconnecte-toi pour continuer.' };
const SAVED: ActionResult = { ok: true, message: 'Enregistré. Le site public est à jour.' };
const invalid = (errors: Record<string, string>): ActionResult => ({
  ok: false,
  error: 'Certains champs sont à corriger.',
  fieldErrors: errors,
});
const orNull = (value: string) => (value === '' ? null : value);

export async function saveProfile(input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return SESSION_EXPIRED;
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  const before = await prisma.profile.findUnique({ where: { id: 1 } });
  const data = {
    ...parsed.data,
    photoUrl: orNull(parsed.data.photoUrl),
    cvFrUrl: orNull(parsed.data.cvFrUrl),
    cvEnUrl: orNull(parsed.data.cvEnUrl),
    githubUrl: orNull(parsed.data.githubUrl),
    linkedinUrl: orNull(parsed.data.linkedinUrl),
  };
  await prisma.profile.update({ where: { id: 1 }, data });
  await deleteUnusedFiles(
    [before?.photoUrl, before?.cvFrUrl, before?.cvEnUrl],
    [data.photoUrl, data.cvFrUrl, data.cvEnUrl],
  );

  updateTag(CONTENT_TAG);
  return SAVED;
}

export async function saveHome(input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return SESSION_EXPIRED;
  const parsed = homeSchema.safeParse(input);
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  await prisma.profile.update({ where: { id: 1 }, data: { home: parsed.data } });
  updateTag(CONTENT_TAG);
  return SAVED;
}

export async function saveSkills(input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return SESSION_EXPIRED;
  const parsed = skillsSchema.safeParse(input);
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  let position = 0;
  const rows = parsed.data.groups.flatMap((group) =>
    group.labels.map((label) => ({ group: group.name, label, position: (position += 1) })),
  );
  await prisma.$transaction([prisma.skill.deleteMany(), prisma.skill.createMany({ data: rows })]);

  updateTag(CONTENT_TAG);
  return SAVED;
}

export async function saveLegal(input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return SESSION_EXPIRED;
  const parsed = legalSchema.safeParse(input);
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  await prisma.profile.update({ where: { id: 1 }, data: parsed.data });
  updateTag(CONTENT_TAG);
  return SAVED;
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return SESSION_EXPIRED;
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  const user = await prisma.user.findUnique({ where: { id: admin.id } });
  const matches = user?.passwordHash ? await bcrypt.compare(parsed.data.current, user.passwordHash) : false;
  if (!matches) return invalid({ current: 'Mot de passe actuel incorrect.' });

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.next, 12) },
  });
  return { ok: true, message: 'Mot de passe modifié.' };
}
