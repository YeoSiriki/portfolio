import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { Markdown } from '@/components/markdown';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/views';
import { getProfile } from '@/lib/queries';

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Conditions d'utilisation du site : contenus, propriété intellectuelle, ressources pédagogiques.",
  alternates: { canonical: '/conditions-utilisation' },
};

export default async function TermsPage() {
  const profile = await getProfile();

  return (
    <PageTransition>
      <Container className="max-w-[820px] py-12 sm:py-16">
        <PageHeader label="/Mentions" title="Conditions générales d'utilisation" />
        <div className="mt-10">
          <Markdown>{profile.termsOfUse}</Markdown>
        </div>
      </Container>
    </PageTransition>
  );
}
