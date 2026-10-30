import { getAdmin } from '@/lib/guard';
import { contentTypeForKey, getObject, isSafeKey } from '@/lib/storage';

// Sert les fichiers téléversés. Les fichiers publics sont mis en cache longtemps (leur nom est unique) ;
// les fichiers privés (justificatifs, ressources) ne sont remis qu'à l'administrateur.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join('/');
  if (!isSafeKey(key)) return new Response('Introuvable', { status: 404 });

  const isPrivate = key.startsWith('prive/');
  if (isPrivate && !(await getAdmin())) return new Response('Introuvable', { status: 404 });

  const body = await getObject(key);
  if (!body) return new Response('Introuvable', { status: 404 });

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': contentTypeForKey(key),
      'Content-Length': String(body.length),
      'Cache-Control': isPrivate ? 'private, no-store' : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
