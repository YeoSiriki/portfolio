// Accès aux données pour l'admin : un « dépôt » par module, derrière la même interface.
// Aucune vérification de droits ici : elle est faite par les pages et les actions qui appellent ce fichier.
import 'server-only';
import {
  educationKindLabel,
  experienceKindLabel,
  postStatusLabel,
  projectCategoryLabel,
  projectStateLabel,
  publicationStatusLabel,
  publicationTypeLabel,
  resourceKindLabel,
} from './constants';
import { prisma } from './db';
import type { ModuleKey } from './forms';
import {
  estimateReadTime,
  formatDate,
  formatPeriod,
  formatYears,
  parseLocalDateTime,
  toLocalDateTimeInput,
} from './format';
import type {
  EducationInput,
  ExperienceInput,
  PostInput,
  ProjectInput,
  PublicationInput,
  ResourceInput,
} from './schemas';
import { uniqueSlug } from './slug';

export type ListRow = {
  id: string;
  title: string;
  cells: [string, string];
  visible: boolean;
  visibilityLabel: string;
  thumbnail?: string | null;
};

type Values = Record<string, unknown>;

export type Repo = {
  list(): Promise<ListRow[]>;
  getValues(id: string): Promise<Values | null>;
  /** Fichiers référencés par l'élément, pour nettoyer le stockage après modification ou suppression. */
  files(id: string): Promise<(string | null)[]>;
  /** Renvoie l'identifiant, ou une erreur de champ (slug déjà pris). */
  save(id: string | null, data: never): Promise<{ id: string } | { fieldErrors: Record<string, string> }>;
  remove(id: string): Promise<void>;
  reorder(ids: string[]): Promise<void>;
  setVisible(id: string, visible: boolean): Promise<void>;
};

const orNull = (value: string) => (value === '' ? null : value);
const SLUG_TAKEN = { fieldErrors: { slug: 'Cette adresse est déjà utilisée par un autre élément.' } };

async function nextPosition(max: Promise<{ _max: { position: number | null } }>): Promise<number> {
  return ((await max)._max.position ?? 0) + 1;
}

/** Slug saisi : vérifie l'unicité. Slug vide : le génère depuis le titre. */
async function resolveSlug(
  input: string,
  title: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string | null> {
  if (input === '') return uniqueSlug(title, isTaken);
  return (await isTaken(input)) ? null : input;
}

const projects: Repo = {
  async list() {
    const rows = await prisma.project.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      cells: [projectCategoryLabel[row.category], projectStateLabel[row.state]],
      visible: row.isPublished,
      visibilityLabel: row.isPublished ? 'Visible' : 'Masqué',
      thumbnail: row.coverUrl,
    }));
  },
  async getValues(id) {
    const row = await prisma.project.findUnique({
      where: { id },
      include: { images: { orderBy: { position: 'asc' } } },
    });
    if (!row) return null;
    return {
      title: row.title,
      slug: row.slug,
      category: row.category,
      state: row.state,
      year: row.year,
      summary: row.summary,
      role: row.role,
      body: row.body,
      techs: row.techs,
      linkUrl: row.linkUrl ?? '',
      coverUrl: row.coverUrl ?? '',
      images: row.images.map((image) => ({ url: image.url, alt: image.alt })),
      isPublished: row.isPublished,
    };
  },
  async files(id) {
    const row = await prisma.project.findUnique({ where: { id }, include: { images: true } });
    return row ? [row.coverUrl, ...row.images.map((image) => image.url)] : [];
  },
  async save(id, data: ProjectInput) {
    const slug = await resolveSlug(data.slug, data.title, async (candidate) =>
      Boolean(await prisma.project.findFirst({ where: { slug: candidate, NOT: id ? { id } : undefined } })),
    );
    if (!slug) return SLUG_TAKEN;
    const { images, ...fields } = data;
    const values = { ...fields, slug, linkUrl: orNull(data.linkUrl), coverUrl: orNull(data.coverUrl) };
    const gallery = images.map((image, position) => ({ url: image.url, alt: image.alt, position }));
    if (id) {
      await prisma.$transaction([
        prisma.projectImage.deleteMany({ where: { projectId: id } }),
        prisma.project.update({ where: { id }, data: { ...values, images: { create: gallery } } }),
      ]);
      return { id };
    }
    const position = await nextPosition(prisma.project.aggregate({ _max: { position: true } }));
    const created = await prisma.project.create({ data: { ...values, position, images: { create: gallery } } });
    return { id: created.id };
  },
  async remove(id) {
    await prisma.project.delete({ where: { id } });
  },
  async reorder(ids) {
    await prisma.$transaction(
      ids.map((id, index) => prisma.project.update({ where: { id }, data: { position: index + 1 } })),
    );
  },
  async setVisible(id, visible) {
    await prisma.project.update({ where: { id }, data: { isPublished: visible } });
  },
};

const publications: Repo = {
  async list() {
    const rows = await prisma.publication.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      cells: [publicationTypeLabel[row.type], publicationStatusLabel[row.status]],
      visible: row.isPublished,
      visibilityLabel: row.isPublished ? 'Visible' : 'Masqué',
    }));
  },
  async getValues(id) {
    const row = await prisma.publication.findUnique({ where: { id } });
    if (!row) return null;
    return {
      title: row.title,
      slug: row.slug,
      type: row.type,
      status: row.status,
      authors: row.authors,
      venue: row.venue,
      date: row.date,
      abstract: row.abstract,
      keywords: row.keywords,
      url: row.url ?? '',
      pdfUrl: row.pdfUrl ?? '',
      hasPage: row.hasPage,
      body: row.body,
      isPublished: row.isPublished,
    };
  },
  async files(id) {
    const row = await prisma.publication.findUnique({ where: { id } });
    return row ? [row.pdfUrl] : [];
  },
  async save(id, data: PublicationInput) {
    const slug = await resolveSlug(data.slug, data.title, async (candidate) =>
      Boolean(await prisma.publication.findFirst({ where: { slug: candidate, NOT: id ? { id } : undefined } })),
    );
    if (!slug) return SLUG_TAKEN;
    const values = { ...data, slug, url: orNull(data.url), pdfUrl: orNull(data.pdfUrl) };
    if (id) {
      await prisma.publication.update({ where: { id }, data: values });
      return { id };
    }
    const position = await nextPosition(prisma.publication.aggregate({ _max: { position: true } }));
    const created = await prisma.publication.create({ data: { ...values, position } });
    return { id: created.id };
  },
  async remove(id) {
    await prisma.publication.delete({ where: { id } });
  },
  async reorder(ids) {
    await prisma.$transaction(
      ids.map((id, index) => prisma.publication.update({ where: { id }, data: { position: index + 1 } })),
    );
  },
  async setVisible(id, visible) {
    await prisma.publication.update({ where: { id }, data: { isPublished: visible } });
  },
};

const experiences: Repo = {
  async list() {
    const rows = await prisma.experience.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    return rows.map((row) => ({
      id: row.id,
      title: row.org ? `${row.role}, ${row.org}` : row.role,
      cells: [experienceKindLabel[row.kind], formatPeriod(row)],
      visible: row.isPublished,
      visibilityLabel: row.isPublished ? 'Visible' : 'Masqué',
    }));
  },
  async getValues(id) {
    const row = await prisma.experience.findUnique({ where: { id } });
    if (!row) return null;
    return {
      role: row.role,
      org: row.org,
      city: row.city,
      kind: row.kind,
      start: row.start,
      end: row.end,
      isCurrent: row.isCurrent,
      missions: row.missions,
      tools: row.tools,
      isPublished: row.isPublished,
    };
  },
  async files() {
    return [];
  },
  async save(id, data: ExperienceInput) {
    const values = { ...data, end: data.isCurrent ? '' : data.end };
    if (id) {
      await prisma.experience.update({ where: { id }, data: values });
      return { id };
    }
    const position = await nextPosition(prisma.experience.aggregate({ _max: { position: true } }));
    const created = await prisma.experience.create({ data: { ...values, position } });
    return { id: created.id };
  },
  async remove(id) {
    await prisma.experience.delete({ where: { id } });
  },
  async reorder(ids) {
    await prisma.$transaction(
      ids.map((id, index) => prisma.experience.update({ where: { id }, data: { position: index + 1 } })),
    );
  },
  async setVisible(id, visible) {
    await prisma.experience.update({ where: { id }, data: { isPublished: visible } });
  },
};

const education: Repo = {
  async list() {
    const rows = await prisma.education.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      cells: [educationKindLabel[row.kind], formatYears(row.startYear, row.endYear)],
      visible: row.isPublished,
      visibilityLabel: row.isPublished ? 'Visible' : 'Masqué',
    }));
  },
  async getValues(id) {
    const row = await prisma.education.findUnique({ where: { id } });
    if (!row) return null;
    return {
      title: row.title,
      kind: row.kind,
      school: row.school,
      city: row.city,
      startYear: row.startYear,
      endYear: row.endYear,
      mention: row.mention,
      description: row.description,
      proofUrl: row.proofUrl ?? '',
      isPublished: row.isPublished,
    };
  },
  async files(id) {
    const row = await prisma.education.findUnique({ where: { id } });
    return row ? [row.proofUrl] : [];
  },
  async save(id, data: EducationInput) {
    const values = { ...data, proofUrl: orNull(data.proofUrl) };
    if (id) {
      await prisma.education.update({ where: { id }, data: values });
      return { id };
    }
    const position = await nextPosition(prisma.education.aggregate({ _max: { position: true } }));
    const created = await prisma.education.create({ data: { ...values, position } });
    return { id: created.id };
  },
  async remove(id) {
    await prisma.education.delete({ where: { id } });
  },
  async reorder(ids) {
    await prisma.$transaction(
      ids.map((id, index) => prisma.education.update({ where: { id }, data: { position: index + 1 } })),
    );
  },
  async setVisible(id, visible) {
    await prisma.education.update({ where: { id }, data: { isPublished: visible } });
  },
};

const resources: Repo = {
  async list() {
    const rows = await prisma.resource.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      cells: [row.level, resourceKindLabel[row.kind]],
      visible: row.status === 'PUBLIE',
      visibilityLabel: row.status === 'PUBLIE' ? 'Publié' : 'Brouillon',
    }));
  },
  async getValues(id) {
    const row = await prisma.resource.findUnique({ where: { id } });
    if (!row) return null;
    return {
      title: row.title,
      level: row.level,
      subject: row.subject,
      kind: row.kind,
      status: row.status,
      description: row.description,
      fileUrl: row.fileUrl ?? '',
      allowDownload: row.allowDownload,
    };
  },
  async files(id) {
    const row = await prisma.resource.findUnique({ where: { id } });
    return row ? [row.fileUrl] : [];
  },
  async save(id, data: ResourceInput) {
    const values = { ...data, fileUrl: orNull(data.fileUrl) };
    if (id) {
      await prisma.resource.update({ where: { id }, data: values });
      return { id };
    }
    const position = await nextPosition(prisma.resource.aggregate({ _max: { position: true } }));
    const created = await prisma.resource.create({ data: { ...values, position } });
    return { id: created.id };
  },
  async remove(id) {
    await prisma.resource.delete({ where: { id } });
  },
  async reorder(ids) {
    await prisma.$transaction(
      ids.map((id, index) => prisma.resource.update({ where: { id }, data: { position: index + 1 } })),
    );
  },
  async setVisible(id, visible) {
    await prisma.resource.update({ where: { id }, data: { status: visible ? 'PUBLIE' : 'BROUILLON' } });
  },
};

const posts: Repo = {
  async list() {
    const rows = await prisma.post.findMany({ orderBy: [{ publishAt: 'desc' }, { createdAt: 'desc' }] });
    const now = Date.now();
    return rows.map((row) => {
      const live =
        row.status === 'PUBLIE' ||
        (row.status === 'PROGRAMME' && row.publishAt !== null && row.publishAt.getTime() <= now);
      return {
        id: row.id,
        title: row.title,
        cells: [row.category, row.publishAt ? formatDate(row.publishAt) : ''],
        visible: live,
        visibilityLabel: live ? 'Publié' : postStatusLabel[row.status],
        thumbnail: row.coverUrl,
      };
    });
  },
  async getValues(id) {
    const row = await prisma.post.findUnique({ where: { id } });
    if (!row) return null;
    return {
      title: row.title,
      slug: row.slug,
      category: row.category,
      status: row.status,
      publishAt: toLocalDateTimeInput(row.publishAt),
      readTime: row.readTime,
      coverUrl: row.coverUrl ?? '',
      excerpt: row.excerpt,
      content: row.content,
    };
  },
  async files(id) {
    const row = await prisma.post.findUnique({ where: { id } });
    return row ? [row.coverUrl] : [];
  },
  async save(id, data: PostInput) {
    const slug = await resolveSlug(data.slug, data.title, async (candidate) =>
      Boolean(await prisma.post.findFirst({ where: { slug: candidate, NOT: id ? { id } : undefined } })),
    );
    if (!slug) return SLUG_TAKEN;
    const scheduled = parseLocalDateTime(data.publishAt);
    const values = {
      ...data,
      slug,
      coverUrl: orNull(data.coverUrl),
      readTime: data.readTime > 0 ? data.readTime : estimateReadTime(data.content),
      // Un article publié sans date reçoit la date du jour.
      publishAt: scheduled ?? (data.status === 'PUBLIE' ? new Date() : null),
    };
    if (id) {
      await prisma.post.update({ where: { id }, data: values });
      return { id };
    }
    const created = await prisma.post.create({ data: values });
    return { id: created.id };
  },
  async remove(id) {
    await prisma.post.delete({ where: { id } });
  },
  async reorder() {
    // Les articles sont classés par date : pas d'ordre manuel.
  },
  async setVisible(id, visible) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return;
    await prisma.post.update({
      where: { id },
      data: {
        status: visible ? 'PUBLIE' : 'BROUILLON',
        publishAt: visible ? (post.publishAt ?? new Date()) : post.publishAt,
      },
    });
  },
};

export const repos: Record<ModuleKey, Repo> = {
  projets: projects,
  recherche: publications,
  experiences,
  formation: education,
  enseignement: resources,
  blog: posts,
};
