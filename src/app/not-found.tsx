import type { Metadata } from 'next';
import Link from 'next/link';
import { NotFoundContent } from '@/components/not-found-content';
import { Container, Wordmark } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false },
};

// Adresse inconnue : la page est rendue hors de la mise en page du site, d'où son propre en-tête.
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col">
      <Container className="flex h-[4.5rem] items-center">
        <Link href="/" className="-mx-2 inline-flex min-h-11 items-center px-2">
          <Wordmark />
        </Link>
      </Container>
      <NotFoundContent />
    </main>
  );
}
