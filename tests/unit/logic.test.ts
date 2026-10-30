import { describe, expect, it } from 'vitest';
import { estimateReadTime, formatPeriod, formatRelative, formatYears, parseLocalDateTime } from '@/lib/format';
import { decideRateLimit, isBlocked } from '@/lib/rate-limit-core';
import { isValidSlug, slugify, uniqueSlug } from '@/lib/slug';
import { isSafeKey, keyFromUrl } from '@/lib/storage';

describe('slugify', () => {
  it('retire les accents et sépare par des tirets', () => {
    expect(slugify('Détection de communautés')).toBe('detection-de-communautes');
    expect(slugify('SCAT : suivi de cibles par drones')).toBe('scat-suivi-de-cibles-par-drones');
  });

  it('gère les apostrophes, les ligatures et les symboles', () => {
    expect(slugify("L'œuvre & l'été")).toBe('l-oeuvre-l-ete');
    expect(slugify('  C / C++  ')).toBe('c-c');
  });

  it('produit toujours un slug valide ou vide', () => {
    for (const title of ['Sujets & corrigés', '---', 'Réseaux 5G', '']) {
      const slug = slugify(title);
      expect(slug === '' || isValidSlug(slug)).toBe(true);
    }
  });
});

describe('uniqueSlug', () => {
  it('ajoute un suffixe tant que le slug est pris', async () => {
    const taken = new Set(['marketplace', 'marketplace-2']);
    expect(await uniqueSlug('Marketplace', async (slug) => taken.has(slug))).toBe('marketplace-3');
    expect(await uniqueSlug('Nouveau projet', async () => false)).toBe('nouveau-projet');
  });
});

describe('formatPeriod', () => {
  it('affiche « Depuis » pour un poste actuel', () => {
    expect(formatPeriod({ start: '2025-09', isCurrent: true })).toBe('Depuis sept. 2025');
    expect(formatPeriod({ start: '2024', isCurrent: true })).toBe('Depuis 2024');
  });

  it('affiche un mois seul, puis une plage dans la même année ou sur plusieurs années', () => {
    expect(formatPeriod({ start: '2023-03', end: '' })).toBe('Mars 2023');
    expect(formatPeriod({ start: '2023-03', end: '2023-03' })).toBe('Mars 2023');
    expect(formatPeriod({ start: '2024-01', end: '2024-02' })).toBe('Janv. - févr. 2024');
    expect(formatPeriod({ start: '2024-09', end: '2026-06' })).toBe('Sept. 2024 - juin 2026');
  });
});

describe('autres formats', () => {
  it('formate les années de formation', () => {
    expect(formatYears(2024, 2026)).toBe('2024-2026');
    expect(formatYears(null, 2020)).toBe('2020');
    expect(formatYears(null, null)).toBe('');
  });

  it('formate les dates relatives de la boîte de réception', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    expect(formatRelative(new Date('2026-10-10T11:59:40Z'), now)).toBe("à l'instant");
    expect(formatRelative(new Date('2026-10-10T10:00:00Z'), now)).toBe('il y a 2 h');
    expect(formatRelative(new Date('2026-10-09T10:00:00Z'), now)).toBe('hier');
    expect(formatRelative(new Date('2026-10-03T10:00:00Z'), now)).toBe('3 oct.');
  });

  it('estime le temps de lecture', () => {
    expect(estimateReadTime('un deux trois')).toBe(1);
    expect(estimateReadTime(Array(1000).fill('mot').join(' '))).toBe(5);
  });

  it('interprète une date de publication en heure GMT', () => {
    expect(parseLocalDateTime('2026-10-12T09:00')?.toISOString()).toBe('2026-10-12T09:00:00.000Z');
    expect(parseLocalDateTime('')).toBeNull();
    expect(parseLocalDateTime('pas une date')).toBeNull();
  });
});

describe('limitation de débit', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  const windowMs = 15 * 60 * 1000;

  it('ouvre une fenêtre au premier essai', () => {
    expect(decideRateLimit(null, now, 5, windowMs)).toEqual({
      allowed: true,
      count: 1,
      resetAt: new Date(now.getTime() + windowMs),
    });
  });

  it('autorise 5 essais puis bloque le sixième', () => {
    const resetAt = new Date(now.getTime() + 60_000);
    expect(decideRateLimit({ count: 4, resetAt }, now, 5, windowMs)).toMatchObject({ allowed: true, count: 5 });
    expect(decideRateLimit({ count: 5, resetAt }, now, 5, windowMs)).toEqual({ allowed: false, resetAt });
  });

  it('repart de zéro une fois la fenêtre expirée', () => {
    const expired = new Date(now.getTime() - 1);
    expect(decideRateLimit({ count: 5, resetAt: expired }, now, 5, windowMs)).toMatchObject({
      allowed: true,
      count: 1,
    });
  });

  it('signale un blocage sans compter de nouvel essai', () => {
    const resetAt = new Date(now.getTime() + 60_000);
    expect(isBlocked(null, now, 5)).toBe(false);
    expect(isBlocked({ count: 4, resetAt }, now, 5)).toBe(false);
    expect(isBlocked({ count: 5, resetAt }, now, 5)).toBe(true);
    expect(isBlocked({ count: 5, resetAt: new Date(now.getTime() - 1) }, now, 5)).toBe(false);
  });
});

describe('clés de stockage', () => {
  it('accepte les clés générées par le site', () => {
    expect(isSafeKey('public/projets/2026-10-0123456789abcdef01.webp')).toBe(true);
    expect(isSafeKey('prive/justificatifs/2026-10-abcdef.pdf')).toBe(true);
  });

  it('refuse les chemins dangereux', () => {
    for (const key of [
      '../.env',
      'public/../../etc/passwd',
      'public/projets/../x.webp',
      'autre/projets/a.webp',
      'public/a.webp',
    ]) {
      expect(isSafeKey(key)).toBe(false);
    }
  });

  it('ne reconnaît que les adresses de fichiers du site', () => {
    expect(keyFromUrl('/fichiers/public/cv/2026-10-abc.pdf')).toBe('public/cv/2026-10-abc.pdf');
    expect(keyFromUrl('https://exemple.com/fichier.pdf')).toBeNull();
    expect(keyFromUrl('/fichiers/../.env')).toBeNull();
    expect(keyFromUrl(null)).toBeNull();
  });
});

describe('schéma animé SCAT', () => {
  it('couvre la cible en continu sur tout son parcours', async () => {
    const { coveredShare } = await import('@/lib/scat-diagram');
    const { allWindows, chiefWindows, droneWindows } = await import('@/lib/scat-scene');
    // Le schéma illustre « 100 % de couverture » : aucun instant sans drone actif.
    expect(coveredShare(allWindows)).toBeCloseTo(1, 5);
    // Chaque drone participe, et les deux clusters se relaient.
    expect(droneWindows.flat().every((windows) => windows.length > 0)).toBe(true);
    expect(chiefWindows.every((windows) => windows.length > 0)).toBe(true);
  });

  it('génère des images clés bornées entre 0 % et 100 %', async () => {
    const { opacityKeyframes, pulseKeyframes } = await import('@/lib/scat-diagram');
    const css =
      opacityKeyframes('test', [
        { start: 0, end: 0.12 },
        { start: 0.95, end: 1 },
      ]) + pulseKeyframes('p', [{ start: 0.2, end: 0.4 }]);
    const stops = [...css.matchAll(/([\d.]+)%\{/g)].map((match) => Number(match[1]));
    expect(stops.every((stop) => stop >= 0 && stop <= 100)).toBe(true);
    // Une fenêtre à cheval sur la fin et le début de la boucle reste allumée à la jonction.
    expect(css).toContain('0%{opacity:1}');
    expect(css).toContain('100%{opacity:1}');
  });
});
