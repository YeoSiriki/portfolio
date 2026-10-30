// Contrôle des fichiers téléversés : taille, type réel (signature binaire) et conversion des images.
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES } from './constants';

export type UploadKind = 'image' | 'document' | 'justificatif';
export type DetectedType = 'jpeg' | 'png' | 'webp' | 'pdf' | 'tex';

type Validation = { ok: true; type: DetectedType } | { ok: false; error: string };

function startsWith(buffer: Uint8Array, bytes: number[], offset = 0): boolean {
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

/** Détecte le type à partir des premiers octets, sans se fier à l'extension ni au type annoncé. */
export function sniffType(buffer: Uint8Array): Exclude<DetectedType, 'tex'> | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
  return null;
}

/** Un fichier .tex est du texte UTF-8 valide, sans octet nul. */
export function isPlainText(buffer: Uint8Array): boolean {
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

const megabytes = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} Mo`;

export function validateUpload(input: { kind: UploadKind; filename: string; buffer: Uint8Array }): Validation {
  const { kind, filename, buffer } = input;
  if (buffer.length === 0) return { ok: false, error: 'Le fichier est vide.' };

  const sniffed = sniffType(buffer);
  const isImage = sniffed === 'jpeg' || sniffed === 'png' || sniffed === 'webp';
  const isTex = sniffed === null && /\.tex$/i.test(filename) && isPlainText(buffer);

  if (kind === 'image') {
    if (!isImage) return { ok: false, error: 'Format refusé : image JPEG, PNG ou WebP uniquement.' };
    if (buffer.length > MAX_IMAGE_BYTES)
      return { ok: false, error: `Image trop lourde : ${megabytes(MAX_IMAGE_BYTES)} maximum.` };
    return { ok: true, type: sniffed };
  }

  if (kind === 'document') {
    if (sniffed !== 'pdf' && !isTex) return { ok: false, error: 'Format refusé : document PDF ou .tex uniquement.' };
    if (buffer.length > MAX_DOCUMENT_BYTES) {
      return { ok: false, error: `Document trop lourd : ${megabytes(MAX_DOCUMENT_BYTES)} maximum.` };
    }
    return { ok: true, type: isTex ? 'tex' : 'pdf' };
  }

  // Justificatif : PDF ou image.
  if (sniffed === 'pdf') {
    if (buffer.length > MAX_DOCUMENT_BYTES) {
      return { ok: false, error: `Document trop lourd : ${megabytes(MAX_DOCUMENT_BYTES)} maximum.` };
    }
    return { ok: true, type: 'pdf' };
  }
  if (isImage) {
    if (buffer.length > MAX_IMAGE_BYTES)
      return { ok: false, error: `Image trop lourde : ${megabytes(MAX_IMAGE_BYTES)} maximum.` };
    return { ok: true, type: sniffed };
  }
  return { ok: false, error: 'Format refusé : PDF ou image (JPEG, PNG, WebP) uniquement.' };
}

/** Redimensionne (1 600 px au plus) et convertit en WebP. */
export async function toWebp(buffer: Buffer, maxSide = 1600): Promise<Buffer> {
  const { default: sharp } = await import('sharp');
  return sharp(buffer)
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
