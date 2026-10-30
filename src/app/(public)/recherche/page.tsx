import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { RevealGroup, RevealItem } from '@/components/motion';
import { Container } from '@/components/ui';
import { PageHeader, PublicationCard } from '@/components/views';
import { getPublications } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Recherche et publications',
  description: 'Mémoire, articles et communications scientifiques.',
  alternates: { canonical: '/recherche' },
};

export default async function ResearchPage() {
  const publications = await getPublications();

  return (
    <PageTransition>
      <Container className="py-12 sm:py-16">
        <PageHeader label="/Recherche" title="Recherche & publications" />
        {publications.length > 0 ? (
          <RevealGroup className="mt-10 space-y-5">
            {publications.map((publication) => (
              <RevealItem key={publication.id}>
                <PublicationCard publication={publication} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="card mt-10 p-8 text-ink-2">Aucune publication pour le moment.</p>
        )}
      </Container>
    </PageTransition>
  );
}
