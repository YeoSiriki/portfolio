import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { githubLoginEnabled } from '@/auth';
import { LoginForm } from '@/components/admin/login-form';
import { Wordmark } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <section className="flex flex-col justify-between gap-12 border-line p-8 sm:p-14 lg:border-r lg:p-[4.5rem]">
        <Link href="/" className="nudge-back -mx-2 inline-flex min-h-11 w-fit items-center gap-3 px-2 text-ink">
          <ArrowLeft size={16} aria-hidden />
          <Wordmark />
        </Link>

        <div>
          <p className="label-mono rise">/Admin</p>
          <h1
            className="display rise-soft mt-4 text-[clamp(3rem,9vw,6.25rem)] leading-[0.95] text-ink"
            style={{ animationDelay: '100ms' }}
          >
            Espace privé
          </h1>
          <p className="rise mt-6 max-w-md text-lg leading-relaxed text-ink-2" style={{ animationDelay: '180ms' }}>
            Gère tes projets, ta recherche, ton parcours, tes ressources et tes messages sans toucher au code.
          </p>
        </div>

        <p className="font-mono text-xs text-ink-3">Accès réservé au propriétaire du site</p>
      </section>

      <section className="flex items-center justify-center p-8 sm:p-14">
        <LoginForm github={githubLoginEnabled} />
      </section>
    </main>
  );
}
