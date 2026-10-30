import { NextResponse } from 'next/server';
import { type UploadKind, toWebp, validateUpload } from '@/lib/files';
import { getAdmin } from '@/lib/guard';
import { type Visibility, buildKey, putObject, urlForKey } from '@/lib/storage';

const KINDS: UploadKind[] = ['image', 'document', 'justificatif'];
const FOLDERS = ['projets', 'publications', 'ressources', 'blog', 'profil', 'cv', 'justificatifs'];
// Dossiers jamais servis au public : justificatifs (privés) et ressources (téléchargement contrôlé).
const PRIVATE_FOLDERS = ['justificatifs', 'ressources'];

function refuse(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  // Protection CSRF : la requête doit venir du site lui-même.
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return refuse('Requête refusée.', 403);

  if (!(await getAdmin())) return refuse('Session expirée. Reconnecte-toi.', 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return refuse('Envoi invalide.');
  }

  const file = form.get('file');
  const kind = String(form.get('kind') ?? '') as UploadKind;
  const folder = String(form.get('folder') ?? '');
  if (!(file instanceof File)) return refuse('Aucun fichier reçu.');
  if (!KINDS.includes(kind) || !FOLDERS.includes(folder)) return refuse('Envoi invalide.');

  const buffer = Buffer.from(await file.arrayBuffer());
  const check = validateUpload({ kind, filename: file.name, buffer });
  if (!check.ok) return refuse(check.error);

  const isImage = check.type === 'jpeg' || check.type === 'png' || check.type === 'webp';
  let body: Buffer;
  try {
    body = isImage ? await toWebp(buffer) : buffer;
  } catch {
    return refuse('Cette image est illisible ou endommagée. Essaie avec un autre fichier.');
  }

  const visibility: Visibility = PRIVATE_FOLDERS.includes(folder) ? 'prive' : 'public';
  const key = buildKey(visibility, folder, isImage ? 'webp' : check.type);
  await putObject(key, body);

  return NextResponse.json({ url: urlForKey(key), name: file.name });
}
