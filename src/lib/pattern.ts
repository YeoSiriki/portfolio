/**
 * Générateur pseudo-aléatoire déterministe : une même graine donne toujours le même dessin,
 * côté serveur comme dans le navigateur (aucun écart à l'hydratation).
 */
export function seeded(seed: string): () => number {
  let state = 0;
  for (const char of seed) state = (Math.imul(state, 31) + char.charCodeAt(0)) | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Valeur aléatoire entre min et max, arrondie au dixième pour garder un SVG compact. */
export function between(random: () => number, min: number, max: number): number {
  return Math.round((min + random() * (max - min)) * 10) / 10;
}
