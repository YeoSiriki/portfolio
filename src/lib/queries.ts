// Lecture du contenu public. Chaque fonction est mise en cache et étiquetée : les pages sont
// générées statiquement, puis régénérées dès qu'une action de l'admin invalide l'étiquette.
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { CONTENT_TAG } from './constants';
import { prisma } from './db';
import { homeSchema } from './schemas';

export async function getProfile() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  if (!profile) throw new Error('Profil introuvable : lancez « npm run db:seed ».');
  return { ...profile, home: homeSchema.parse(profile.home) };
}

export type PublicProfile = Awaited<ReturnType<typeof getProfile>>;

export async function getProjects() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  // Seuls les champs des cartes sont lus : la fiche détaillée a sa propre requête.
  return prisma.project.findMany({
    where: { isPublished: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      state: true,
      year: true,
      summary: true,
      techs: true,
      coverUrl: true,
    },
  });
}

export type PublicProject = Awaited<ReturnType<typeof getProjects>>[number];

export async function getProjectBySlug(slug: string) {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  return prisma.project.findFirst({
    where: { slug, isPublished: true },
    include: { images: { orderBy: { position: 'asc' } } },
  });
}

export type ProjectWithImages = NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>;

export async function getPublications() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  return prisma.publication.findMany({
    where: { isPublished: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
}

export type PublicPublication = Awaited<ReturnType<typeof getPublications>>[number];

/** Publication disposant d'une page dédiée (la page SCAT). */
export async function getPublicationPage(slug: string) {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  return prisma.publication.findFirst({ where: { slug, isPublished: true, hasPage: true } });
}

export async function getExperiences() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  return prisma.experience.findMany({
    where: { isPublished: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
}

export type PublicExperience = Awaited<ReturnType<typeof getExperiences>>[number];

/** Le justificatif (proofUrl) est privé : il n'est jamais sélectionné ici. */
export async function getEducation() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  return prisma.education.findMany({
    where: { isPublished: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    omit: { proofUrl: true },
  });
}

export type PublicEducation = Awaited<ReturnType<typeof getEducation>>[number];

export async function getSkillGroups() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  const skills = await prisma.skill.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
  const groups: { name: string; labels: string[] }[] = [];
  for (const skill of skills) {
    const group = groups.find((item) => item.name === skill.group);
    if (group) group.labels.push(skill.label);
    else groups.push({ name: skill.group, labels: [skill.label] });
  }
  return groups;
}

export type SkillGroup = Awaited<ReturnType<typeof getSkillGroups>>[number];

/** L'adresse du fichier n'est jamais exposée : le téléchargement passe par une route contrôlée. */
export async function getResources() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('max');
  const resources = await prisma.resource.findMany({
    where: { status: 'PUBLIE' },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
  return resources.map(({ fileUrl, ...resource }) => ({
    ...resource,
    canDownload: Boolean(fileUrl) && resource.allowDownload,
  }));
}

export type PublicResource = Awaited<ReturnType<typeof getResources>>[number];

// Un article programmé devient visible une fois sa date passée : le cache des articles est donc court.
function visiblePosts() {
  return {
    OR: [{ status: 'PUBLIE' as const }, { status: 'PROGRAMME' as const, publishAt: { lte: new Date() } }],
  };
}

export async function getPosts() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('minutes');
  return prisma.post.findMany({
    where: visiblePosts(),
    orderBy: [{ publishAt: 'desc' }, { createdAt: 'desc' }],
    omit: { content: true },
  });
}

export type PublicPostSummary = Awaited<ReturnType<typeof getPosts>>[number];

export async function getPostBySlug(slug: string) {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('minutes');
  return prisma.post.findFirst({ where: { slug, ...visiblePosts() } });
}

export type PublicPost = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;

/** Pour le pied de page : le lien vers le blog n'apparaît que s'il y a des articles. */
export async function hasPosts() {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('hours');
  return (await prisma.post.count({ where: visiblePosts() })) > 0;
}

export async function getCurrentYear() {
  'use cache';
  cacheLife('days');
  return new Date().getUTCFullYear();
}
