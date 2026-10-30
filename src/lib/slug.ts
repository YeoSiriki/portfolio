const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Transforme un titre en slug d'URL : accents retirés, minuscules, tirets simples. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/['’]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Ajoute un suffixe numérique tant que le slug est déjà pris. */
export async function uniqueSlug(base: string, isTaken: (candidate: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || 'element';
  let candidate = root;
  for (let suffix = 2; await isTaken(candidate); suffix += 1) {
    candidate = `${root}-${suffix}`;
  }
  return candidate;
}
