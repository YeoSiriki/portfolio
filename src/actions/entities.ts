'use server';

import { updateTag } from 'next/cache';
import { repos } from '@/lib/admin-repo';
import { CONTENT_TAG } from '@/lib/constants';
import { type ActionResult, type ModuleKey, forms, isModuleKey, modules } from '@/lib/forms';
import { getAdmin } from '@/lib/guard';
import { fieldErrors } from '@/lib/schemas';
import { deleteUnusedFiles } from '@/lib/storage';

const SESSION_EXPIRED: ActionResult = { ok: false, error: 'Session expirée. Reconnecte-toi pour continuer.' };
const UNKNOWN_MODULE: ActionResult = { ok: false, error: 'Module inconnu.' };

// Chaque action revérifie les droits : une action serveur est un point d'entrée public.
async function authorize(moduleKey: string): Promise<ModuleKey | ActionResult> {
  if (!(await getAdmin())) return SESSION_EXPIRED;
  return isModuleKey(moduleKey) ? moduleKey : UNKNOWN_MODULE;
}

export async function saveEntity(moduleKey: string, id: string | null, input: unknown): Promise<ActionResult> {
  const key = await authorize(moduleKey);
  if (typeof key !== 'string') return key;

  const parsed = forms[key].schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Certains champs sont à corriger.', fieldErrors: fieldErrors(parsed.error) };
  }

  const repo = repos[key];
  const filesBefore = id ? await repo.files(id) : [];
  const result = await repo.save(id, parsed.data as never);
  if ('fieldErrors' in result) {
    return { ok: false, error: 'Certains champs sont à corriger.', fieldErrors: result.fieldErrors };
  }
  await deleteUnusedFiles(filesBefore, await repo.files(result.id));

  updateTag(CONTENT_TAG);
  return { ok: true, id: result.id, message: 'Enregistré. Le site public est à jour.' };
}

export async function deleteEntity(moduleKey: string, id: string): Promise<ActionResult> {
  const key = await authorize(moduleKey);
  if (typeof key !== 'string') return key;

  const repo = repos[key];
  const files = await repo.files(id);
  await repo.remove(id);
  await deleteUnusedFiles(files, []);

  updateTag(CONTENT_TAG);
  return { ok: true, message: 'Supprimé.' };
}

export async function reorderEntities(moduleKey: string, ids: string[]): Promise<ActionResult> {
  const key = await authorize(moduleKey);
  if (typeof key !== 'string') return key;
  if (!modules[key].sortable) return { ok: false, error: 'Ce module ne se trie pas à la main.' };
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string') || ids.length > 500) {
    return { ok: false, error: 'Ordre invalide.' };
  }

  await repos[key].reorder(ids);
  updateTag(CONTENT_TAG);
  return { ok: true };
}

export async function setEntityVisibility(moduleKey: string, id: string, visible: boolean): Promise<ActionResult> {
  const key = await authorize(moduleKey);
  if (typeof key !== 'string') return key;

  await repos[key].setVisible(id, Boolean(visible));
  updateTag(CONTENT_TAG);
  return { ok: true, message: visible ? 'Visible sur le site.' : 'Masqué du site.' };
}
