'use client';

import { Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type ResourceKind, resourceKindLabel } from '@/lib/constants';

export type ResourceCardData = {
  id: string;
  title: string;
  level: string;
  subject: string;
  kind: ResourceKind;
  description: string;
  canDownload: boolean;
};

const ALL = 'TOUS';

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="meta-mono mr-1">{label}</span>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-11 items-center rounded-[10px] border px-3.5 text-[0.9rem] font-semibold transition-colors ${
              active ? 'border-accent bg-accent text-on-accent' : 'border-field text-ink hover:border-ink-3'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ResourcesExplorer({ resources }: { resources: ResourceCardData[] }) {
  const [level, setLevel] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [query, setQuery] = useState('');

  // Les filtres proposés sont déduits des ressources publiées.
  const levels = useMemo(() => [...new Set(resources.map((item) => item.level).filter(Boolean))], [resources]);
  const kinds = useMemo(() => [...new Set(resources.map((item) => item.kind))], [resources]);

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    return resources.filter((item) => {
      if (level !== ALL && item.level !== level) return false;
      if (kind !== ALL && item.kind !== kind) return false;
      if (!needle) return true;
      return normalize([item.title, item.description, item.subject, item.level].join(' ')).includes(needle);
    });
  }, [resources, level, kind, query]);

  if (resources.length === 0) {
    return <p className="card p-8 text-ink-2">Les ressources pédagogiques seront publiées ici prochainement.</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        <Chips
          label="Niveau"
          value={level}
          onChange={setLevel}
          options={[{ value: ALL, label: 'Tous' }, ...levels.map((value) => ({ value, label: value }))]}
        />
        <Chips
          label="Type"
          value={kind}
          onChange={setKind}
          options={[
            { value: ALL, label: 'Tous' },
            ...kinds.map((value) => ({ value, label: resourceKindLabel[value] })),
          ]}
        />
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor="recherche-ressources" className="sr-only">
            Rechercher une ressource
          </label>
          <Search
            size={17}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
            aria-hidden
          />
          <input
            id="recherche-ressources"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titre, matière, notion..."
            className="field pl-10"
          />
        </div>
      </div>

      <p className="sr-only" role="status">
        {visible.length} ressource{visible.length > 1 ? 's' : ''} affichée{visible.length > 1 ? 's' : ''}
      </p>

      {visible.length > 0 ? (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id} className="card flex flex-col p-6">
              <p className="meta-mono">
                {[item.level, resourceKindLabel[item.kind], item.subject].filter(Boolean).join(' · ')}
              </p>
              <h3 className="mt-3 font-serif text-xl leading-snug font-medium text-ink">{item.title}</h3>
              {item.description && <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{item.description}</p>}
              <div className="mt-auto pt-5">
                {item.canDownload ? (
                  <a href={`/enseignement/telecharger/${item.id}`} className="btn btn-secondary nudge-down">
                    <Download size={17} aria-hidden /> Télécharger
                    <span className="sr-only">: {item.title}</span>
                  </a>
                ) : (
                  <p className="text-sm text-ink-3">Document consultable sur demande.</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card mt-8 p-8 text-center text-ink-2">Aucune ressource ne correspond à ces filtres.</p>
      )}
    </div>
  );
}
