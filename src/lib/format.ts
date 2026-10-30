const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function parsePoint(value: string): { year: string; month: string | null } {
  const [year, month] = value.split('-');
  return { year, month: month ? (MONTHS[Number(month) - 1] ?? null) : null };
}

/** « 2023-03 » devient « mars 2023 », « 2024 » reste « 2024 ». */
export function formatPoint(value: string): string {
  const { year, month } = parsePoint(value);
  return month ? `${month} ${year}` : year;
}

/** Période d'une expérience, à partir de dates « AAAA » ou « AAAA-MM ». */
export function formatPeriod(period: { start: string; end?: string | null; isCurrent?: boolean }): string {
  const { start, end, isCurrent } = period;
  if (isCurrent) return `Depuis ${formatPoint(start)}`;
  if (!end || end === start) return capitalize(formatPoint(start));
  const from = parsePoint(start);
  const to = parsePoint(end);
  if (from.year === to.year && from.month && to.month) {
    return `${capitalize(from.month)} - ${to.month} ${to.year}`;
  }
  return `${capitalize(formatPoint(start))} - ${formatPoint(end)}`;
}

export function formatYears(startYear: number | null, endYear: number | null): string {
  if (startYear && endYear && startYear !== endYear) return `${startYear}-${endYear}`;
  return String(endYear ?? startYear ?? '');
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** Date relative courte pour la boîte de réception : « il y a 2 h », « hier », « 3 oct. ». */
export function formatRelative(date: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  if (hours < 48) return 'hier';
  return shortDateFormatter.format(date);
}

/** Temps de lecture estimé en minutes (200 mots par minute, 1 minute au minimum). */
export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Valeur d'un champ datetime-local, interprétée en UTC (heure de Côte d'Ivoire). */
export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const date = new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toLocalDateTimeInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 16) : '';
}
