import type { MetadataRoute } from 'next';
import { getPosts, getProjects, getPublications } from '@/lib/queries';
import { siteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, publications, posts] = await Promise.all([getProjects(), getPublications(), getPosts()]);

  const staticPaths = [
    '',
    '/recherche',
    '/projets',
    '/parcours',
    '/enseignement',
    '/blog',
    '/contact',
    '/cv',
    '/confidentialite',
    '/conditions-utilisation',
  ];

  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}`, priority: path === '' ? 1 : 0.7 })),
    ...publications
      .filter((publication) => publication.hasPage)
      .map((publication) => ({
        url: `${siteUrl}/recherche/${publication.slug}`,
        lastModified: publication.updatedAt,
        priority: 0.9,
      })),
    ...projects.map((project) => ({ url: `${siteUrl}/projets/${project.slug}`, priority: 0.8 })),
    ...posts.map((post) => ({ url: `${siteUrl}/blog/${post.slug}`, lastModified: post.updatedAt, priority: 0.6 })),
  ];
}
