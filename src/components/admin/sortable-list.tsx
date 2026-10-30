'use client';

import { ArrowDown, ArrowUp, GripVertical, Plus, Search } from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { reorderEntities, setEntityVisibility } from '@/actions/entities';

export type Row = {
  id: string;
  title: string;
  cells: [string, string];
  visible: boolean;
  visibilityLabel: string;
  thumbnail?: string | null;
};

const GRID = 'grid grid-cols-[2.75rem_minmax(0,1fr)_8.5rem_7rem_6.5rem_11.5rem] items-center gap-2 px-3';

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Liste d'un module de l'admin : recherche, visibilité, et ordre d'affichage par glisser-déposer.
 * Les boutons monter/descendre offrent la même action au clavier et au toucher.
 */
export function SortableList({
  moduleKey,
  rows: initialRows,
  columns,
  selectedId,
  sortable,
  basePath,
  searchPlaceholder,
  newLabel,
  emptyLabel,
}: {
  moduleKey: string;
  rows: Row[];
  columns: [string, string, string];
  selectedId: string | null;
  sortable: boolean;
  basePath: string;
  searchPlaceholder: string;
  newLabel: string;
  emptyLabel: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Les données du serveur font foi dès qu'elles changent (après un enregistrement, par exemple).
  const [source, setSource] = useState(initialRows);
  if (source !== initialRows) {
    setSource(initialRows);
    setRows(initialRows);
  }

  const needle = normalize(query.trim());
  const filtered = needle
    ? rows.filter((row) => normalize([row.title, ...row.cells].join(' ')).includes(needle))
    : rows;
  const canSort = sortable && !needle;

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || to >= rows.length) return;
    const moved = rows[from];
    const next = moveItem(rows, from, to);
    setRows(next);
    setError(null);
    setAnnouncement(`« ${moved.title} » déplacé en position ${to + 1} sur ${rows.length}.`);
    startTransition(async () => {
      const result = await reorderEntities(
        moduleKey,
        next.map((row) => row.id),
      );
      if (!result.ok) {
        setError(result.error);
        setRows(initialRows);
        return;
      }
      router.refresh();
    });
  };

  const toggleVisibility = (row: Row) => {
    setError(null);
    startTransition(async () => {
      const result = await setEntityVisibility(moduleKey, row.id, !row.visible);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  };

  const endDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="card overflow-hidden bg-surface-admin">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4 sm:p-5">
          <div className="relative min-w-48 flex-1">
            <label htmlFor={`recherche-${moduleKey}`} className="sr-only">
              {searchPlaceholder}
            </label>
            <Search
              size={17}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
              aria-hidden
            />
            <input
              id={`recherche-${moduleKey}`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="field pl-10"
            />
          </div>
          <Link href={`${basePath}?nouveau=1#formulaire`} className="btn btn-primary">
            <Plus size={17} aria-hidden /> {newLabel}
          </Link>
        </div>

        {error && (
          <p role="alert" className="border-b border-line bg-danger-bg px-5 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>

        {/* Tableau défilant horizontalement sur petit écran. */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className={`${GRID} border-b border-line py-3 font-mono text-xs text-ink-3`}>
              <span />
              <span>{columns[0]}</span>
              <span>{columns[1]}</span>
              <span>{columns[2]}</span>
              <span>Visibilité</span>
              <span />
            </div>

            {filtered.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-3">{needle ? 'Aucun résultat.' : emptyLabel}</p>
            ) : (
              <ul>
                {filtered.map((row) => {
                  const index = rows.findIndex((item) => item.id === row.id);
                  const selected = row.id === selectedId;
                  return (
                    // L'animation « layout » fait glisser les lignes vers leur nouvelle place après un déplacement.
                    <motion.li key={row.id} layout transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                      <div
                        draggable={canSort}
                        onDragStart={(event) => {
                          setDragId(row.id);
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', row.id);
                        }}
                        onDragOver={(event) => {
                          if (!canSort || !dragId) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          if (overId !== row.id) setOverId(row.id);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const from = rows.findIndex((item) => item.id === dragId);
                          endDrag();
                          reorder(from, index);
                        }}
                        onDragEnd={endDrag}
                        className={`${GRID} border-b border-line py-2 text-sm ${selected ? 'bg-surface' : ''} ${
                          dragId === row.id ? 'opacity-40' : ''
                        } ${overId === row.id && dragId !== row.id ? 'shadow-[inset_0_2px_0_0_var(--color-accent)]' : ''}`}
                      >
                        <span
                          className={`inline-flex size-11 items-center justify-center text-ink-3 ${
                            canSort ? 'cursor-grab active:cursor-grabbing' : 'opacity-30'
                          }`}
                          aria-hidden
                          title={canSort ? 'Glisser pour réordonner' : undefined}
                        >
                          <GripVertical size={18} />
                        </span>

                        <span className="flex min-w-0 items-center gap-3">
                          {row.thumbnail !== undefined &&
                            (row.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element -- vignette d'admin
                              <img
                                src={row.thumbnail}
                                alt=""
                                draggable={false}
                                className="h-8 w-11 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <span className="h-8 w-11 shrink-0 rounded-md bg-line" aria-hidden />
                            ))}
                          <span className="truncate font-semibold text-ink">{row.title}</span>
                        </span>
                        <span className="truncate text-ink-2">{row.cells[0]}</span>
                        <span className="truncate text-ink-2">{row.cells[1]}</span>

                        <span>
                          <button
                            type="button"
                            onClick={() => toggleVisibility(row)}
                            disabled={pending}
                            aria-pressed={row.visible}
                            aria-label={`${row.title} : ${row.visibilityLabel}. Changer la visibilité`}
                            className={`badge min-h-11 cursor-pointer px-3 transition-opacity hover:opacity-80 ${
                              row.visible ? 'bg-done-bg text-accent' : 'bg-line text-ink-2'
                            }`}
                          >
                            {row.visibilityLabel}
                          </button>
                        </span>

                        <span className="flex items-center justify-end">
                          {sortable && (
                            <>
                              <button
                                type="button"
                                className="inline-flex size-11 items-center justify-center text-ink-3 hover:text-ink disabled:opacity-25"
                                disabled={!canSort || index === 0 || pending}
                                onClick={() => reorder(index, index - 1)}
                                aria-label={`Monter « ${row.title} »`}
                              >
                                <ArrowUp size={17} aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="inline-flex size-11 items-center justify-center text-ink-3 hover:text-ink disabled:opacity-25"
                                disabled={!canSort || index === rows.length - 1 || pending}
                                onClick={() => reorder(index, index + 1)}
                                aria-label={`Descendre « ${row.title} »`}
                              >
                                <ArrowDown size={17} aria-hidden />
                              </button>
                            </>
                          )}
                          <Link
                            href={`${basePath}?id=${row.id}#formulaire`}
                            draggable={false}
                            aria-current={selected ? 'true' : undefined}
                            className="btn btn-secondary ml-1 px-3 text-sm"
                          >
                            Modifier<span className="sr-only"> « {row.title} »</span>
                          </Link>
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
