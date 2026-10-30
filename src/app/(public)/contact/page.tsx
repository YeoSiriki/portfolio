import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { ContactBlock } from '@/components/sections';
import { Container } from '@/components/ui';
import { getProfile } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Proposition de thèse, collaboration de recherche ou projet : formulaire de contact et coordonnées.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const profile = await getProfile();

  return (
    <PageTransition>
      <Container className="py-12 sm:py-16">
        <ContactBlock profile={profile} headingId="titre-contact" as="h1" />
      </Container>
    </PageTransition>
  );
}
