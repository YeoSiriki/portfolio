import { ArrowUpRight, LogOut } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { type ReactNode, Suspense } from 'react';
import { logout } from '@/actions/auth';
import { AdminHint } from '@/components/admin-hint';
import { AdminNav, AdminNavList } from '@/components/admin/admin-nav';
import { PanelSkeleton } from '@/components/admin/panel-skeleton';
import { Wordmark } from '@/components/ui';
import { prisma } from '@/lib/db';
import { getAdmin, requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

/** Barrière d'accès : rien de ce qui est sous l'admin n'est rendu sans session administrateur. */
async function Gate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminHint />
      {children}
    </>
  );
}

async function UnreadBadge() {
  if (!(await getAdmin())) return null;
  const count = await prisma.message.count({ where: { status: 'NEW' } });
  if (count === 0) return null;
  return (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 font-mono text-xs font-medium text-on-accent">
      {count}
      <span className="sr-only"> non lus</span>
    </span>
  );
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  const badge = (
    <Suspense fallback={null}>
      <UnreadBadge />
    </Suspense>
  );

  return (
    <div className="min-h-svh bg-bg-admin lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-line px-4 pt-5 lg:sticky lg:top-0 lg:h-svh lg:border-r lg:border-b-0 lg:pb-5">
        <p className="flex items-center gap-2 px-3">
          <Wordmark /> <span className="font-mono text-xs text-ink-3">admin</span>
        </p>

        <nav aria-label="Administration" className="mt-6 flex-1">
          {/* usePathname n'est connu qu'à la requête : la liste sans surbrillance sert de repli. */}
          <Suspense fallback={<AdminNavList />}>
            <AdminNav badge={badge} />
          </Suspense>
        </nav>

        <div className="hidden border-t border-line pt-4 lg:block">
          <Link
            href="/"
            target="_blank"
            className="nudge flex min-h-11 items-center gap-1.5 px-3 text-sm text-ink-2 hover:text-ink"
          >
            Voir le site <ArrowUpRight size={15} aria-hidden />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-ink-2 hover:text-danger"
            >
              <LogOut size={15} aria-hidden /> Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <Suspense fallback={<PanelSkeleton />}>
          <Gate>
            <div className="p-5 sm:p-8 lg:p-11">{children}</div>
          </Gate>
        </Suspense>

        {/* Sur petit écran, les actions de bas de barre latérale passent en pied de page. */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 lg:hidden">
          <Link href="/" target="_blank" className="nudge flex min-h-11 items-center gap-1.5 text-sm text-ink-2">
            Voir le site <ArrowUpRight size={15} aria-hidden />
          </Link>
          <form action={logout}>
            <button type="submit" className="flex min-h-11 items-center gap-2 text-sm text-ink-2">
              <LogOut size={15} aria-hidden /> Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
