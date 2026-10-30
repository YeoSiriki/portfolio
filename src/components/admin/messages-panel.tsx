'use client';

import { Archive, ArchiveRestore, Mail, MailOpen, OctagonAlert, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { deleteMessage, replyToMessage, setMessageStatus } from '@/actions/messages';
import type { MessageStatus } from '@/lib/constants';
import { ConfirmDialog } from './confirm-dialog';

export type MessageItem = {
  id: string;
  name: string;
  email: string;
  topic: string;
  body: string;
  status: MessageStatus;
  when: string;
  replyBody: string | null;
  repliedWhen: string | null;
};

export function MessagesPanel({
  messages,
  selectedId,
  basePath,
  ownerEmail,
  mailReady,
}: {
  messages: MessageItem[];
  selectedId: string | null;
  basePath: string;
  ownerEmail: string;
  mailReady: boolean;
}) {
  const router = useRouter();
  const selected = messages.find((message) => message.id === selectedId) ?? null;
  const [reply, setReply] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  // Ouvrir un message non lu le marque comme lu.
  useEffect(() => {
    if (selected?.status !== 'NEW') return;
    void setMessageStatus(selected.id, 'READ');
  }, [selected?.id, selected?.status]);

  const run = (action: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setFeedback({ tone: 'error', text: result.error ?? 'Action impossible.' });
          return;
        }
        if (result.message) setFeedback({ tone: 'ok', text: result.message });
        after?.();
        router.refresh();
      } catch {
        setFeedback({ tone: 'error', text: 'Action impossible. Vérifie ta connexion.' });
      }
    });
  };

  const mailto = selected
    ? `mailto:${selected.email}?subject=${encodeURIComponent(`Re : ${selected.topic}`)}${reply ? `&body=${encodeURIComponent(reply)}` : ''}`
    : '#';

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
      <div className="card overflow-hidden bg-surface-admin">
        {messages.length === 0 ? (
          <p className="p-6 text-sm text-ink-3">Aucun message ici.</p>
        ) : (
          <ul className="divide-y divide-line">
            {messages.map((message) => {
              const active = message.id === selectedId;
              return (
                <li key={message.id}>
                  <Link
                    href={`${basePath}${basePath.includes('?') ? '&' : '?'}id=${message.id}#message`}
                    aria-current={active ? 'true' : undefined}
                    className={`flex gap-3 p-5 transition-colors hover:bg-surface ${active ? 'bg-surface' : ''}`}
                  >
                    <span
                      className={`mt-2 size-2 shrink-0 rounded-full ${message.status === 'NEW' ? 'bg-accent' : 'bg-transparent'}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className={`truncate text-[0.95rem] text-ink ${message.status === 'NEW' ? 'font-bold' : 'font-semibold'}`}
                        >
                          {message.name}
                          {message.status === 'NEW' && <span className="sr-only"> (non lu)</span>}
                        </span>
                        <span className="meta-mono shrink-0 text-xs">{message.when}</span>
                      </span>
                      <span className="block truncate text-sm text-accent">{message.topic}</span>
                      <span className="block truncate text-sm text-ink-3">{message.body}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div id="message" className="scroll-mt-6">
        {selected ? (
          <article className="card bg-surface-admin p-6 sm:p-7">
            <header className="border-b border-line pb-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-2xl font-bold [font-stretch:112%] text-ink">{selected.topic}</h2>
                <span className="meta-mono text-xs">{selected.when}</span>
              </div>
              <p className="mt-1.5 text-[0.95rem] text-ink-2">
                {selected.name} <span aria-hidden>·</span>{' '}
                <a href={`mailto:${selected.email}`} className="link">
                  {selected.email}
                </a>
              </p>
            </header>

            <p className="border-b border-line py-5 leading-relaxed whitespace-pre-wrap text-ink">{selected.body}</p>

            {selected.replyBody && (
              <div className="border-b border-line py-5">
                <p className="meta-mono text-xs">Réponse envoyée {selected.repliedWhen}</p>
                <p className="mt-2 leading-relaxed whitespace-pre-wrap text-ink-2">{selected.replyBody}</p>
              </div>
            )}

            <form
              className="pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                run(
                  () => replyToMessage(selected.id, { body: reply }),
                  () => setReply(''),
                );
              }}
            >
              <label htmlFor="reponse" className="field-label">
                Répondre (réponses adressées à {ownerEmail})
              </label>
              <textarea
                id="reponse"
                rows={5}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Ta réponse..."
                className="field resize-y"
              />
              {!mailReady && (
                <p className="mt-2 text-[0.8125rem] text-progress">
                  L&apos;envoi d&apos;e-mails n&apos;est pas configuré : utilise le bouton « Ouvrir dans ma messagerie
                  ».
                </p>
              )}

              {feedback && (
                <p
                  role={feedback.tone === 'error' ? 'alert' : 'status'}
                  className={`mt-4 rounded-[10px] border px-4 py-3 text-sm ${
                    feedback.tone === 'error'
                      ? 'border-danger/40 bg-danger-bg text-danger'
                      : 'border-accent/30 bg-done-bg text-accent'
                  }`}
                >
                  {feedback.text}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={pending || !mailReady || reply.trim() === ''}
                >
                  <Send size={16} aria-hidden /> Envoyer
                </button>
                <a href={mailto} className="btn btn-secondary">
                  <Mail size={16} aria-hidden /> Ouvrir dans ma messagerie
                </a>
                {selected.status === 'ARCHIVED' || selected.status === 'SPAM' ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={pending}
                    onClick={() => run(() => setMessageStatus(selected.id, 'READ'))}
                  >
                    <ArchiveRestore size={16} aria-hidden /> Remettre en boîte de réception
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={pending}
                      onClick={() => run(() => setMessageStatus(selected.id, 'ARCHIVED'))}
                    >
                      <Archive size={16} aria-hidden /> Archiver
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => setMessageStatus(selected.id, 'NEW'),
                          () => router.replace(basePath),
                        )
                      }
                    >
                      <MailOpen size={16} aria-hidden /> Marquer non lu
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={pending}
                      onClick={() => run(() => setMessageStatus(selected.id, 'SPAM'))}
                    >
                      <OctagonAlert size={16} aria-hidden /> Indésirable
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-danger ml-auto"
                  disabled={pending}
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 size={16} aria-hidden /> Supprimer
                </button>
              </div>
            </form>

            <ConfirmDialog
              open={confirming}
              title="Supprimer ce message ?"
              description={`Le message de ${selected.name} sera supprimé définitivement.`}
              pending={pending}
              onCancel={() => setConfirming(false)}
              onConfirm={() =>
                run(
                  () => deleteMessage(selected.id),
                  () => {
                    setConfirming(false);
                    router.replace(basePath);
                  },
                )
              }
            />
          </article>
        ) : (
          <p className="card bg-surface-admin p-8 text-sm text-ink-3">Sélectionne un message pour le lire.</p>
        )}
      </div>
    </div>
  );
}
