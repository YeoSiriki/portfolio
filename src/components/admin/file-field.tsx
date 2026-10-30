'use client';

import { ArrowDown, ArrowUp, FileText, Trash2, Upload } from 'lucide-react';
import { type DragEvent, useId, useState } from 'react';
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES } from '@/lib/constants';

export type UploadKind = 'image' | 'document' | 'justificatif';

const ACCEPT: Record<UploadKind, string> = {
  image: 'image/jpeg,image/png,image/webp',
  document: 'application/pdf,.pdf,.tex',
  justificatif: 'application/pdf,.pdf,image/jpeg,image/png,image/webp',
};

const DROP_LABEL: Record<UploadKind, string> = {
  image: 'Glisser une image ou choisir un fichier',
  document: 'Glisser un document ou choisir un fichier',
  justificatif: 'Glisser un justificatif ou choisir un fichier',
};

const isImageUrl = (url: string) => url.endsWith('.webp');

/** Envoie un fichier à /api/upload. Le serveur revérifie tout ; ce contrôle-ci évite un envoi inutile. */
async function upload(file: File, kind: UploadKind, folder: string): Promise<{ url: string } | { error: string }> {
  const isImage = file.type.startsWith('image/');
  const limit = isImage ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (kind === 'image' && !isImage) return { error: 'Format refusé : image JPEG, PNG ou WebP uniquement.' };
  if (file.size > limit) {
    return { error: `Fichier trop lourd : ${Math.round(limit / (1024 * 1024))} Mo maximum.` };
  }

  const body = new FormData();
  body.set('file', file);
  body.set('kind', kind);
  body.set('folder', folder);
  try {
    const response = await fetch('/api/upload', { method: 'POST', body });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) return { error: payload.error ?? "L'envoi a échoué." };
    return { url: payload.url };
  } catch {
    return { error: "L'envoi a échoué. Vérifie ta connexion." };
  }
}

function useUploader(kind: UploadKind, folder: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Envoie les fichiers un à un et renvoie les adresses de ceux qui ont été acceptés. */
  async function send(files: FileList | File[] | null): Promise<string[]> {
    if (!files || files.length === 0) return [];
    setBusy(true);
    setError(null);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const result = await upload(file, kind, folder);
      if ('error' in result) {
        setError(`${file.name} : ${result.error}`);
        break;
      }
      urls.push(result.url);
    }
    setBusy(false);
    return urls;
  }

  return { busy, error, send };
}

function DropZone({
  inputId,
  kind,
  busy,
  multiple,
  onFiles,
  describedBy,
}: {
  inputId: string;
  kind: UploadKind;
  busy: boolean;
  multiple?: boolean;
  onFiles: (files: FileList | null) => void;
  describedBy?: string;
}) {
  const [over, setOver] = useState(false);

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setOver(false);
    onFiles(event.dataTransfer.files);
  };

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed px-4 py-5 text-center text-sm transition-colors focus-within:border-accent ${
        over ? 'border-accent bg-done-bg/40 text-ink' : 'border-field text-ink-3 hover:border-ink-3'
      }`}
    >
      <Upload size={20} aria-hidden />
      <span>{busy ? 'Envoi en cours...' : DROP_LABEL[kind]}</span>
      <input
        id={inputId}
        type="file"
        accept={ACCEPT[kind]}
        multiple={multiple}
        disabled={busy}
        aria-describedby={describedBy}
        className="sr-only"
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </label>
  );
}

/** Champ fichier unique : image (aperçu) ou document (lien). */
export function FileField({
  kind,
  folder,
  value,
  onChange,
  describedBy,
}: {
  kind: UploadKind;
  folder: string;
  value: string;
  onChange: (url: string) => void;
  describedBy?: string;
}) {
  const inputId = useId();
  const { busy, error, send } = useUploader(kind, folder);
  const replace = async (files: FileList | null) => {
    const [url] = await send(files);
    if (url) onChange(url);
  };

  return (
    <div>
      {value ? (
        <div className="flex flex-wrap items-center gap-4 rounded-[12px] border border-line p-3">
          {isImageUrl(value) ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu d'admin, y compris de fichiers privés
            <img src={value} alt="" className="h-20 w-28 rounded-lg object-cover" />
          ) : (
            <FileText size={28} className="text-ink-3" aria-hidden />
          )}
          <a href={value} target="_blank" rel="noopener noreferrer" className="link text-sm text-ink">
            Voir le fichier
          </a>
          <div className="ml-auto flex gap-2">
            <label htmlFor={inputId} className="btn btn-secondary cursor-pointer text-sm">
              {busy ? 'Envoi...' : 'Remplacer'}
              <input
                id={inputId}
                type="file"
                accept={ACCEPT[kind]}
                disabled={busy}
                aria-describedby={describedBy}
                className="sr-only"
                onChange={(event) => {
                  void replace(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            <button type="button" className="btn btn-secondary text-sm" onClick={() => onChange('')}>
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <DropZone
          inputId={inputId}
          kind={kind}
          busy={busy}
          onFiles={(files) => void replace(files)}
          describedBy={describedBy}
        />
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export type GalleryItem = { url: string; alt: string };

/** Galerie d'images ordonnée, avec un texte alternatif par image. */
export function GalleryField({
  folder,
  value,
  onChange,
}: {
  folder: string;
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  const inputId = useId();
  const { busy, error, send } = useUploader('image', folder);
  const add = async (files: FileList | null) => {
    const urls = await send(files);
    if (urls.length > 0) onChange([...value, ...urls.map((url) => ({ url, alt: '' }))]);
  };

  const move = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li key={item.url} className="flex items-center gap-3 rounded-[12px] border border-line p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu d'admin */}
              <img src={item.url} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
              <label className="min-w-0 flex-1">
                <span className="sr-only">Texte alternatif de l&apos;image {index + 1}</span>
                <input
                  type="text"
                  value={item.alt}
                  placeholder="Texte alternatif (ce que montre l'image)"
                  className="field text-sm"
                  onChange={(event) =>
                    onChange(value.map((entry, i) => (i === index ? { ...entry, alt: event.target.value } : entry)))
                  }
                />
              </label>
              <div className="flex shrink-0">
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center text-ink-3 hover:text-ink disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Monter l'image ${index + 1}`}
                >
                  <ArrowUp size={17} aria-hidden />
                </button>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center text-ink-3 hover:text-ink disabled:opacity-30"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Descendre l'image ${index + 1}`}
                >
                  <ArrowDown size={17} aria-hidden />
                </button>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center text-ink-3 hover:text-danger"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  aria-label={`Retirer l'image ${index + 1}`}
                >
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <DropZone inputId={inputId} kind="image" busy={busy} multiple onFiles={(files) => void add(files)} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
