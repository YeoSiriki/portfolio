// Règles de rédaction du site : pas de tiret cadratin ni demi-cadratin, pas d'emoji en guise d'icône.
// Le test parcourt le code de l'interface et les données initiales.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');

function collect(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    if (statSync(full).isDirectory()) return name === 'generated' ? [] : collect(full);
    return /\.(tsx?|css)$/.test(name) ? [full] : [];
  });
}

const files = [...collect(path.join(root, 'src')), path.join(root, 'prisma', 'seed.ts')];

function offenders(pattern: RegExp): string[] {
  return files.filter((file) => pattern.test(readFileSync(file, 'utf8'))).map((file) => path.relative(root, file));
}

describe('règles de rédaction', () => {
  it('ne contient aucun tiret cadratin ou demi-cadratin', () => {
    expect(offenders(/[—–]/)).toEqual([]);
  });

  it('ne contient aucun emoji ni symbole pictographique', () => {
    expect(offenders(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u)).toEqual([]);
  });
});
