import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { Journey } from '@/components/sections';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/views';
import { getEducation, getExperiences, getProfile } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Parcours',
  description: 'Expériences professionnelles, formation, certifications et langues.',
  alternates: { canonical: '/parcours' },
};

export default async function JourneyPage() {
  const [profile, experiences, education] = await Promise.all([getProfile(), getExperiences(), getEducation()]);

  return (
    <PageTransition>
      <Container className="py-12 sm:py-16">
        <PageHeader label="/Parcours" title="Expériences & formation" />
        <div className="mt-12">
          <Journey experiences={experiences} education={education} languages={profile.home.languages} level={2} />
        </div>
      </Container>
    </PageTransition>
  );
}
