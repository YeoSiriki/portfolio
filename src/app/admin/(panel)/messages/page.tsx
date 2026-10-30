import type { Metadata } from 'next';
import Link from 'next/link';
import { type MessageItem, MessagesPanel } from '@/components/admin/messages-panel';
import { AdminPageHeader } from '@/components/admin/page-header';
import type { MessageStatus } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { formatDate, formatRelative } from '@/lib/format';
import { requireAdmin } from '@/lib/guard';
import { mailConfigured } from '@/lib/mail';
import { messageRetentionMonths } from '@/lib/site';

export const metadata: Metadata = { title: 'Messages' };

// La page lit la session et dépend de l'adresse (boîte, message ouvert) : elle peut attendre le serveur.
export const instant = false;

const BOXES: Record<string, { label: string; statuses: MessageStatus[] }> = {
  reception: { label: 'Boîte de réception', statuses: ['NEW', 'READ'] },
  archives: { label: 'Archivés', statuses: ['ARCHIVED'] },
  indesirables: { label: 'Indésirables', statuses: ['SPAM'] },
};

type Props = { searchParams: Promise<{ boite?: string; id?: string }> };

export default async function MessagesPage({ searchParams }: Props) {
  await requireAdmin();
  const query = await searchParams;
  const boxKey = query.boite && query.boite in BOXES ? query.boite : 'reception';
  const box = BOXES[boxKey];

  const [rows, counts, profile] = await Promise.all([
    prisma.message.findMany({ where: { status: { in: box.statuses } }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.message.groupBy({ by: ['status'], _count: true }),
    prisma.profile.findUnique({ where: { id: 1 }, select: { publicEmail: true } }),
  ]);
  const now = new Date();

  const messages: MessageItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    topic: row.topic,
    body: row.body,
    status: row.status,
    when: formatRelative(row.createdAt, now),
    replyBody: row.replyBody,
    repliedWhen: row.repliedAt ? `le ${formatDate(row.repliedAt)}` : null,
  }));
  const countFor = (statuses: MessageStatus[]) =>
    counts.filter((entry) => statuses.includes(entry.status)).reduce((total, entry) => total + entry._count, 0);
  const basePath = boxKey === 'reception' ? '/admin/messages' : `/admin/messages?boite=${boxKey}`;
  // Pas de sélection automatique : ouvrir un message le marque comme lu, cela doit rester un geste volontaire.
  const selectedId = query.id && messages.some((message) => message.id === query.id) ? query.id : null;

  return (
    <>
      <AdminPageHeader breadcrumb="/Admin/messages" title="Messages" />

      <nav aria-label="Dossiers" className="mb-5">
        <ul className="flex flex-wrap gap-2">
          {Object.entries(BOXES).map(([key, entry]) => {
            const active = key === boxKey;
            return (
              <li key={key}>
                <Link
                  href={key === 'reception' ? '/admin/messages' : `/admin/messages?boite=${key}`}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] border px-4 text-sm font-semibold transition-colors ${
                    active ? 'border-accent bg-accent text-on-accent' : 'border-field text-ink hover:border-ink-3'
                  }`}
                >
                  {entry.label} <span className="font-mono text-xs opacity-70">{countFor(entry.statuses)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <MessagesPanel
        messages={messages}
        selectedId={selectedId}
        basePath={basePath}
        ownerEmail={profile?.publicEmail ?? ''}
        mailReady={mailConfigured()}
      />

      <p className="mt-6 text-[0.8125rem] text-ink-3">
        Les messages sont supprimés automatiquement après {messageRetentionMonths} mois (protection des données
        personnelles).
      </p>
    </>
  );
}
