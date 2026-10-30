// Stockage des fichiers téléversés : compatible S3 si S3_BUCKET est défini, sinon dossier local.
// Les fichiers sont toujours servis par l'application (/fichiers/...), jamais directement par le bucket.
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type Visibility = 'public' | 'prive';

const KEY_PATTERN = /^(public|prive)\/[a-z0-9-]+\/[a-z0-9-]+\.[a-z0-9]+$/;

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  pdf: 'application/pdf',
  tex: 'text/plain; charset=utf-8',
};

function s3Config() {
  const { S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;
  return {
    bucket: S3_BUCKET,
    region: process.env.S3_REGION ?? 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  };
}

export function storageKind(): 's3' | 'local' {
  return s3Config() ? 's3' : 'local';
}

async function s3() {
  const config = s3Config();
  if (!config) return null;
  const sdk = await import('@aws-sdk/client-s3');
  const client = new sdk.S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: Boolean(config.endpoint),
    credentials: config.credentials,
  });
  return { sdk, client, bucket: config.bucket };
}

function localPath(key: string): string {
  // Le dossier est choisi à l'exécution : inutile que le bundler tente de le suivre.
  const root = path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? './storage');
  return path.join(/* turbopackIgnore: true */ root, ...key.split('/'));
}

export function isSafeKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

export function buildKey(visibility: Visibility, folder: string, extension: string): string {
  const month = new Date().toISOString().slice(0, 7);
  return `${visibility}/${folder}/${month}-${randomBytes(9).toString('hex')}.${extension}`;
}

export function urlForKey(key: string): string {
  return `/fichiers/${key}`;
}

export function keyFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/fichiers/')) return null;
  const key = url.slice('/fichiers/'.length);
  return isSafeKey(key) ? key : null;
}

export function contentTypeForKey(key: string): string {
  return CONTENT_TYPES[key.split('.').pop() ?? ''] ?? 'application/octet-stream';
}

export async function putObject(key: string, body: Buffer): Promise<void> {
  if (!isSafeKey(key)) throw new Error(`Clé de fichier invalide : ${key}`);
  const remote = await s3();
  if (remote) {
    await remote.client.send(
      new remote.sdk.PutObjectCommand({
        Bucket: remote.bucket,
        Key: key,
        Body: body,
        ContentType: contentTypeForKey(key),
      }),
    );
    return;
  }
  const target = localPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
}

export async function getObject(key: string): Promise<Buffer | null> {
  if (!isSafeKey(key)) return null;
  const remote = await s3();
  try {
    if (remote) {
      const result = await remote.client.send(new remote.sdk.GetObjectCommand({ Bucket: remote.bucket, Key: key }));
      const bytes = await result.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    }
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (!isSafeKey(key)) return;
  const remote = await s3();
  try {
    if (remote) {
      await remote.client.send(new remote.sdk.DeleteObjectCommand({ Bucket: remote.bucket, Key: key }));
    } else {
      await unlink(localPath(key));
    }
  } catch {
    // Le fichier a déjà disparu : rien à nettoyer.
  }
}

/** Supprime les fichiers qui ne sont plus référencés après une modification ou une suppression. */
export async function deleteUnusedFiles(before: (string | null | undefined)[], after: (string | null | undefined)[]) {
  const kept = new Set(after.filter(Boolean));
  const removed = before.filter((url) => url && !kept.has(url));
  await Promise.all(
    removed.map((url) => {
      const key = keyFromUrl(url);
      return key ? deleteObject(key) : undefined;
    }),
  );
}
