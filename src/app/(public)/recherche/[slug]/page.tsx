import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicationPage } from '@/components/views';
import { publicationTypeLabel } from '@/lib/constants';
import { getProfile, getPublicationPage, getPublications } from '@/lib/queries';
import { jsonLd, siteUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

// La page attend son contenu complet avant de s'afficher : une adresse inconnue reçoit ainsi un vrai
// code 404, et le titre de la carte peut se transformer en titre de la fiche pendant la navigation.
export const instant = false;

// Seules les publications dotées d'une page dédiée ont une adresse ici (la page SCAT : /recherche/scat).
export async function generateStaticParams() {
  const pages = (await getPublications()).filter((publication) => publication.hasPage);
  return pages.length > 0 ? pages.map((publication) => ({ slug: publication.slug })) : [{ slug: '__aucun__' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const publication = await getPublicationPage((await params).slug);
  if (!publication) return { title: 'Publication introuvable' };
  return {
    title: publication.title,
    description: publication.abstract || undefined,
    alternates: { canonical: `/recherche/${publication.slug}` },
    openGraph: { title: publication.title, description: publication.abstract || undefined, type: 'article' },
  };
}

export default async function PublicationRoute({ params }: Props) {
  const [publication, profile] = await Promise.all([getPublicationPage((await params).slug), getProfile()]);
  if (!publication) notFound();

  const article = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: publication.title,
    name: publication.title,
    abstract: publication.abstract || undefined,
    author: { '@type': 'Person', name: profile.fullName, url: siteUrl },
    genre: publicationTypeLabel[publication.type],
    inLanguage: 'fr',
    keywords: publication.keywords.join(', ') || undefined,
    datePublished: publication.date || undefined,
    publisher: publication.venue ? { '@type': 'Organization', name: publication.venue } : undefined,
    url: `${siteUrl}/recherche/${publication.slug}`,
  };

  return (
    <PageTransition>
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(article) }} />
        <PublicationPage publication={publication} kpis={profile.home.scat.kpis.filter((kpi) => kpi.value)} />
      </>
    </PageTransition>
  );
}
