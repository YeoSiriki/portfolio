import { describe, expect, it } from 'vitest';
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES } from '@/lib/constants';
import { sniffType, validateUpload } from '@/lib/files';
import { contactSchema, experienceSchema, fieldErrors, homeSchema, postSchema, projectSchema } from '@/lib/schemas';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
const EXE = [0x4d, 0x5a, 0x90, 0x00];

const bytes = (head: number[], size = 64) => {
  const buffer = new Uint8Array(size).fill(0x20);
  buffer.set(head);
  return buffer;
};

describe('type réel des fichiers', () => {
  it('reconnaît les formats autorisés à leur signature', () => {
    expect(sniffType(bytes(PNG))).toBe('png');
    expect(sniffType(bytes(JPEG))).toBe('jpeg');
    expect(sniffType(bytes(WEBP))).toBe('webp');
    expect(sniffType(bytes(PDF))).toBe('pdf');
    expect(sniffType(bytes(EXE))).toBeNull();
  });

  it('refuse un exécutable renommé en image', () => {
    const result = validateUpload({ kind: 'image', filename: 'photo.png', buffer: bytes(EXE) });
    expect(result).toEqual({ ok: false, error: 'Format refusé : image JPEG, PNG ou WebP uniquement.' });
  });

  it('refuse un PDF envoyé comme image, et une image envoyée comme document', () => {
    expect(validateUpload({ kind: 'image', filename: 'cv.pdf', buffer: bytes(PDF) }).ok).toBe(false);
    expect(validateUpload({ kind: 'document', filename: 'photo.png', buffer: bytes(PNG) }).ok).toBe(false);
  });

  it('refuse les fichiers trop lourds avec un message clair', () => {
    const image = validateUpload({ kind: 'image', filename: 'a.png', buffer: bytes(PNG, MAX_IMAGE_BYTES + 1) });
    expect(image).toEqual({ ok: false, error: 'Image trop lourde : 5 Mo maximum.' });
    const document = validateUpload({
      kind: 'document',
      filename: 'a.pdf',
      buffer: bytes(PDF, MAX_DOCUMENT_BYTES + 1),
    });
    expect(document).toEqual({ ok: false, error: 'Document trop lourd : 20 Mo maximum.' });
  });

  it('accepte un .tex en texte brut et refuse un binaire renommé en .tex', () => {
    const tex = new TextEncoder().encode('\\documentclass{article}\n\\begin{document}Été\\end{document}');
    expect(validateUpload({ kind: 'document', filename: 'sujet.tex', buffer: tex })).toEqual({ ok: true, type: 'tex' });
    expect(
      validateUpload({ kind: 'document', filename: 'sujet.tex', buffer: new Uint8Array([0x00, 0x01, 0x02]) }).ok,
    ).toBe(false);
  });

  it('accepte PDF et image comme justificatif, refuse le reste et les fichiers vides', () => {
    expect(validateUpload({ kind: 'justificatif', filename: 'd.pdf', buffer: bytes(PDF) }).ok).toBe(true);
    expect(validateUpload({ kind: 'justificatif', filename: 'd.jpg', buffer: bytes(JPEG) }).ok).toBe(true);
    expect(
      validateUpload({ kind: 'justificatif', filename: 'd.tex', buffer: new TextEncoder().encode('texte') }).ok,
    ).toBe(false);
    expect(validateUpload({ kind: 'image', filename: 'vide.png', buffer: new Uint8Array() }).ok).toBe(false);
  });
});

const project = {
  title: 'Projet',
  slug: '',
  category: 'RECHERCHE',
  state: 'TERMINE',
  year: 2026,
  summary: '',
  role: '',
  body: '',
  techs: [],
  linkUrl: '',
  coverUrl: '',
  images: [],
  isPublished: false,
};

describe('schémas des formulaires', () => {
  it('exige le titre du projet, seul champ obligatoire', () => {
    expect(projectSchema.safeParse(project).success).toBe(true);
    const result = projectSchema.safeParse({ ...project, title: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)).toEqual({ title: 'Le titre est obligatoire.' });
  });

  it('refuse un slug mal formé, un lien sans protocole et une année absente', () => {
    expect(projectSchema.safeParse({ ...project, slug: 'Mon Projet' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, slug: 'mon-projet' }).success).toBe(true);
    expect(projectSchema.safeParse({ ...project, linkUrl: 'github.com/x' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, linkUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, year: Number.NaN }).success).toBe(false);
  });

  it("n'accepte que des fichiers du site comme image", () => {
    expect(projectSchema.safeParse({ ...project, coverUrl: 'https://exemple.com/a.png' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, coverUrl: '/fichiers/public/projets/2026-10-ab.webp' }).success).toBe(
      true,
    );
  });

  it('valide le format des périodes des expériences', () => {
    const experience = {
      role: 'Poste',
      org: '',
      city: '',
      kind: 'EMPLOI',
      start: '2025-09',
      end: '',
      isCurrent: true,
      missions: [],
      tools: [],
      isPublished: true,
    };
    expect(experienceSchema.safeParse(experience).success).toBe(true);
    expect(experienceSchema.safeParse({ ...experience, start: '09/2025' }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...experience, start: '2025-13' }).success).toBe(false);
  });

  it('exige une date pour programmer un article', () => {
    const post = {
      title: 'Article',
      slug: '',
      category: '',
      status: 'PROGRAMME',
      publishAt: '',
      readTime: 0,
      coverUrl: '',
      excerpt: '',
      content: '',
    };
    const result = postSchema.safeParse(post);
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(fieldErrors(result.error))).toEqual(['publishAt']);
    expect(postSchema.safeParse({ ...post, publishAt: '2026-11-01T08:00' }).success).toBe(true);
    expect(postSchema.safeParse({ ...post, status: 'BROUILLON' }).success).toBe(true);
  });

  it('valide le formulaire de contact', () => {
    const message = {
      name: 'Awa Koné',
      email: 'awa@exemple.ci',
      topic: 'Opportunité de doctorat',
      body: 'Bonjour, une proposition.',
    };
    expect(contactSchema.safeParse(message).success).toBe(true);
    expect(contactSchema.safeParse({ ...message, email: 'pas-un-email' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...message, body: 'court' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...message, topic: 'Sujet inventé' }).success).toBe(false);
  });

  it('impose trois chiffres clés et trois phases au bloc SCAT', () => {
    const pair = { value: '1', label: 'a' };
    const phase = { title: 'a', text: 'b' };
    const block = { tag: 'a', title: 'b', text: 'c' };
    const home = {
      scat: {
        title: 'SCAT',
        tagline: '',
        problem: '',
        solution: '',
        kpis: [pair, pair, pair],
        phases: [phase, phase, phase],
      },
      teaching: { intro: '', blocks: [block, block, block] },
      languages: [],
      contactIntro: '',
    };
    expect(homeSchema.safeParse(home).success).toBe(true);
    expect(homeSchema.safeParse({ ...home, scat: { ...home.scat, kpis: [pair] } }).success).toBe(false);
  });
});
