import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { contentTypeForKey, getObject, keyFromUrl } from '@/lib/storage';

// Téléchargement d'une ressource pédagogique : uniquement si elle est publiée ET que le
// téléchargement est autorisé. L'adresse réelle du fichier n'est jamais exposée.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await prisma.resource.findFirst({ where: { id, status: 'PUBLIE', allowDownload: true } });
  const key = keyFromUrl(resource?.fileUrl);
  if (!resource || !key) return new Response('Introuvable', { status: 404 });

  const body = await getObject(key);
  if (!body) return new Response('Introuvable', { status: 404 });

  const extension = key.split('.').pop();
  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': contentTypeForKey(key),
      'Content-Length': String(body.length),
      'Content-Disposition': `attachment; filename="${slugify(resource.title) || 'ressource'}.${extension}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
