// Sauvegarde de la base PostgreSQL dans ./backups (format compressé de pg_dump).
// À planifier une fois par jour (Planificateur de tâches Windows, cron...) : npm run db:backup
// Les 14 sauvegardes les plus récentes sont conservées.
// Restauration : pg_restore --clean --dbname "$DATABASE_URL" backups/portfolio-AAAA-MM-JJ.dump
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const KEEP = 14;
const directory = path.resolve('backups');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL est absent du fichier .env.');
  process.exit(1);
}

mkdirSync(directory, { recursive: true });
const file = path.join(directory, `portfolio-${new Date().toISOString().slice(0, 10)}.dump`);

// PG_DUMP_PATH permet d'indiquer l'exécutable s'il n'est pas dans le PATH
// (par exemple C:\Program Files\PostgreSQL\18\bin\pg_dump.exe).
const result = spawnSync(
  process.env.PG_DUMP_PATH ?? 'pg_dump',
  ['--format=custom', '--no-owner', `--file=${file}`, databaseUrl],
  {
    stdio: 'inherit',
  },
);

if (result.error || result.status !== 0) {
  console.error('La sauvegarde a échoué. Vérifiez que pg_dump est installé (ou renseignez PG_DUMP_PATH).');
  process.exit(1);
}

const dumps = readdirSync(directory)
  .filter((name) => /^portfolio-\d{4}-\d{2}-\d{2}\.dump$/.test(name))
  .sort();
for (const old of dumps.slice(0, Math.max(0, dumps.length - KEEP))) unlinkSync(path.join(directory, old));

console.log(`Sauvegarde écrite : ${file}`);
