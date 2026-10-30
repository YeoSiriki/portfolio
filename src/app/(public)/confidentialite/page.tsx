import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { Markdown } from '@/components/markdown';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/views';
import { getProfile } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Données personnelles collectées par le formulaire de contact, finalité, durée de conservation et droits.',
  alternates: { canonical: '/confidentialite' },
};

export default async function PrivacyPage() {
  const profile = await getProfile();

  return (
    <PageTransition>
      <Container className="max-w-[820px] py-12 sm:py-16">
        <PageHeader label="/Mentions" title="Politique de confidentialité" />
        <div className="mt-10">
          <Markdown>{profile.privacyPolicy}</Markdown>
        </div>
      </Container>
    </PageTransition>
  );
}
