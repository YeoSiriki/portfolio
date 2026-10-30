// Base PostgreSQL locale au projet, pour le développement (données dans .postgres/, port 5434).
//   npm run db:local        crée la base si besoin, puis la démarre
//   npm run db:local:stop   l'arrête
// « npm run dev » la démarre tout seul quand DATABASE_URL pointe dessus.
import 'dotenv/config';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const PORT = process.env.LOCAL_PG_PORT ?? '5434';
const USER = 'portfolio';
const DATABASE = 'portfolio';
const root = path.resolve('.postgres');
const data = path.join(root, 'data');
export const localUrl = `postgresql://${USER}@localhost:${PORT}/${DATABASE}`;

/** Dossier des exécutables PostgreSQL : PG_BIN, sinon l'installation Windows la plus récente, sinon le PATH. */
function binDirectory(): string {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  const base = 'C:\\Program Files\\PostgreSQL';
  if (!existsSync(base)) return '';
  const versions = readdirSync(base)
    .filter((version) => existsSync(path.join(base, version, 'bin', 'pg_ctl.exe')))
    .sort((a, b) => Number(b) - Number(a));
  return versions[0] ? path.join(base, versions[0], 'bin') : '';
}

const bin = binDirectory();
const exe = (name: string) => (bin ? path.join(bin, process.platform === 'win32' ? `${name}.exe` : name) : name);
const run = (name: string, args: string[]) => spawnSync(exe(name), args, { encoding: 'utf8' });
const isReady = () => run('pg_isready', ['-h', 'localhost', '-p', PORT]).status === 0;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function start() {
  if (!existsSync(data)) {
    mkdirSync(root, { recursive: true });
    console.log('Création de la base locale dans .postgres/ ...');
    // Authentification « trust » : la base n'écoute que sur cette machine (localhost).
    const init = run('initdb', ['-D', data, '-U', USER, '-A', 'trust', '-E', 'UTF8', '--locale=C']);
    if (init.status !== 0) {
      throw new Error(`initdb a échoué. PostgreSQL est-il installé ? (variable PG_BIN)\n${init.stderr ?? ''}`);
    }
  }

  if (!isReady()) {
    const args = ['-D', data, '-o', `-p ${PORT}`, '-l', path.join(root, 'server.log'), 'start'];
    if (process.platform === 'win32') {
      // Sous Windows, la base est lancée dans sa propre fenêtre masquée : un Ctrl+C ou la fermeture
      // du terminal qui a lancé « npm run dev » ne l'arrête pas en même temps.
      const quoted = args.map((arg) => `'"${arg.replace(/'/g, "''")}"'`).join(',');
      spawnSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-Command',
          `Start-Process -FilePath '${exe('pg_ctl').replace(/'/g, "''")}' -ArgumentList ${quoted} -WindowStyle Hidden`,
        ],
        { stdio: 'ignore' },
      );
    } else {
      spawn(exe('pg_ctl'), args, { detached: true, stdio: 'ignore' }).unref();
    }
    for (let attempt = 0; attempt < 40 && !isReady(); attempt += 1) await sleep(500);
    if (!isReady()) throw new Error(`La base locale ne démarre pas. Voir ${path.join(root, 'server.log')}`);
  }

  const exists = run('psql', [
    '-h',
    'localhost',
    '-p',
    PORT,
    '-U',
    USER,
    '-d',
    'postgres',
    '-tAc',
    `select 1 from pg_database where datname = '${DATABASE}'`,
  ]);
  if (exists.stdout?.trim() !== '1') run('createdb', ['-h', 'localhost', '-p', PORT, '-U', USER, DATABASE]);

  console.log(`Base locale prête : ${localUrl}`);
}

function stop() {
  if (!existsSync(data)) return console.log('Aucune base locale à arrêter.');
  run('pg_ctl', ['-D', data, '-m', 'fast', 'stop']);
  console.log('Base locale arrêtée.');
}

/** Démarre la base locale seulement si le projet est configuré pour l'utiliser. */
async function ensure() {
  const url = process.env.DATABASE_URL ?? '';
  if (/@(localhost|127\.0\.0\.1):/.test(url) && url.includes(`:${PORT}/`) && existsSync(data)) await start();
}

const command = process.argv[2] ?? 'start';
const task = command === 'stop' ? Promise.resolve(stop()) : command === 'ensure' ? ensure() : start();

task.catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
