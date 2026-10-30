'use client';

import { useEffect, useRef } from 'react';

/** Fenêtre de confirmation (élément <dialog> natif : focus piégé et touche Échap gérés par le navigateur). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Supprimer',
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirmation-titre"
      className="m-auto w-[min(92vw,28rem)] rounded-card border border-line bg-surface p-7 text-ink"
    >
      <h2 id="confirmation-titre" className="text-xl font-bold [font-stretch:112%]">
        {title}
      </h2>
      <p className="mt-3 leading-relaxed text-ink-2">{description}</p>
      <div className="mt-7 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending} autoFocus>
          Annuler
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={pending}>
          {pending ? 'Suppression...' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
