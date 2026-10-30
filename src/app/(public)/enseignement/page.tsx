import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { ResourcesExplorer } from '@/components/resources-explorer';
import { TeachingBlocks } from '@/components/sections';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/views';
import { getProfile, getResources } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Enseignement',
  description:
    'Cours de mathématiques, sujets et corrigés, formation numérique : ressources filtrables par niveau et par type.',
  alternates: { canonical: '/enseignement' },
};

export default async function TeachingPage() {
  const [profile, resources] = await Promise.all([getProfile(), getResources()]);
  const { teaching } = profile.home;

  return (
    <PageTransition>
      <Container className="py-12 sm:py-16">
        <PageHeader label="/Enseignement" title="Transmettre" intro={teaching.intro} />
        <div className="mt-10">
          <TeachingBlocks blocks={teaching.blocks} level={2} />
        </div>

        <section aria-labelledby="titre-ressources" className="mt-20">
          <h2 id="titre-ressources" className="display text-[clamp(1.75rem,4.5vw,2.75rem)] text-ink">
            Ressources pédagogiques
          </h2>
          <div className="mt-8">
            <ResourcesExplorer resources={resources} />
          </div>
        </section>
      </Container>
    </PageTransition>
  );
}
