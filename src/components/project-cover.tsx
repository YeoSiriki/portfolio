// Illustration d'une carte de projet sans capture. Ce n'est ni une photo ni une image de l'interface :
// un dessin au trait propre à chaque catégorie (réseau de drones, fibres, code, courbe), varié selon le projet.
import type { ProjectCategory } from '@/lib/constants';
import { between, seeded } from '@/lib/pattern';

type ArtProps = { seed: string };

const IVORY = '#f4f2ec';
const GOLD = '#d8b66c';

// Coordonnées arrondies : sinus et cosinus peuvent différer au dernier chiffre d'un navigateur à l'autre.
const round = (value: number) => Math.round(value * 10) / 10;

export const coverBackground: Record<ProjectCategory, string> = {
  RECHERCHE: 'cover-research',
  RESEAUX: 'cover-network',
  DEVELOPPEMENT: 'cover-dev',
  ENSEIGNEMENT: 'cover-teach',
};

/** Clusters de drones : chaque Chef d'Essaim relie ses drones, les chefs sont reliés entre eux. */
function ResearchArt({ seed }: ArtProps) {
  const random = seeded(seed);
  const chiefs = [70, 165, 258].map((x) => ({ x: x + between(random, -12, 12), y: between(random, 62, 138) }));
  return (
    <g>
      {chiefs.map((chief, c) => {
        const count = 3 + Math.floor(random() * 2);
        const start = random() * Math.PI * 2;
        const drones = Array.from({ length: count }, (_, d) => {
          const angle = start + (d / count) * Math.PI * 2 + between(random, -0.3, 0.3);
          const radius = between(random, 26, 40);
          return { x: round(chief.x + Math.cos(angle) * radius), y: round(chief.y + Math.sin(angle) * radius) };
        });
        return (
          <g key={c}>
            <circle
              cx={chief.x}
              cy={chief.y}
              r={50}
              fill="none"
              stroke={IVORY}
              strokeOpacity={0.16}
              strokeDasharray="3 5"
            />
            {drones.map((drone, d) => (
              <line key={d} x1={chief.x} y1={chief.y} x2={drone.x} y2={drone.y} stroke={IVORY} strokeOpacity={0.4} />
            ))}
            {drones.map((drone, d) => (
              <circle key={d} cx={drone.x} cy={drone.y} r={3.2} fill={IVORY} />
            ))}
          </g>
        );
      })}
      <polyline
        points={chiefs.map((chief) => `${chief.x},${chief.y}`).join(' ')}
        fill="none"
        stroke={GOLD}
        strokeWidth={1.6}
      />
      {chiefs.map((chief, c) => (
        <g key={c}>
          <circle cx={chief.x} cy={chief.y} r={6.5} fill="var(--cover-bg)" stroke={GOLD} strokeWidth={1.8} />
          <circle cx={chief.x} cy={chief.y} r={2.6} fill={GOLD} />
        </g>
      ))}
    </g>
  );
}

/** Faisceau de fibres qui converge vers un boîtier d'épissure, puis repart vers les abonnés. */
function NetworkArt({ seed }: ArtProps) {
  const random = seeded(seed);
  const box = { x: between(random, 136, 168), y: between(random, 88, 106) };
  const count = 7;
  return (
    <g fill="none">
      {Array.from({ length: count }, (_, i) => {
        const yIn = 28 + (i * 144) / (count - 1) + between(random, -6, 6);
        const yOut = 22 + (i * 156) / (count - 1) + between(random, -6, 6);
        const yBox = box.y - 9 + (i * 18) / (count - 1);
        const highlight = i === 2 || i === 5;
        return (
          <g key={i} stroke={highlight ? GOLD : IVORY} strokeOpacity={highlight ? 0.95 : 0.3 + (i % 3) * 0.2}>
            <path
              d={`M-10 ${yIn} C ${box.x - 70} ${yIn}, ${box.x - 60} ${yBox}, ${box.x - 22} ${yBox}`}
              strokeWidth={1.4}
            />
            <path
              d={`M${box.x + 22} ${yBox} C ${box.x + 60} ${yBox}, ${box.x + 80} ${yOut}, 330 ${yOut}`}
              strokeWidth={1.4}
            />
            {highlight && <circle cx={box.x + 96 + between(random, 0, 70)} cy={yOut} r={3} fill={GOLD} stroke="none" />}
          </g>
        );
      })}
      <rect
        x={box.x - 24}
        y={box.y - 16}
        width={48}
        height={32}
        rx={7}
        fill="var(--cover-bg)"
        stroke={IVORY}
        strokeWidth={1.6}
      />
      <line x1={box.x - 12} y1={box.y} x2={box.x + 12} y2={box.y} stroke={GOLD} strokeWidth={1.6} />
    </g>
  );
}

/** Fenêtre d'éditeur : lignes de code indentées, quelques-unes surlignées. */
function DevArt({ seed }: ArtProps) {
  const random = seeded(seed);
  const rows = Array.from({ length: 7 }, (_, i) => ({
    y: 78 + i * 13,
    indent: [0, 1, 2, 2, 1, 2, 0][i] * 14 + (random() < 0.3 ? 14 : 0),
    width: between(random, 36, 120),
    second: random() < 0.45 ? between(random, 18, 50) : 0,
    gold: random() < 0.28,
  }));
  return (
    <g>
      <rect
        x={42}
        y={34}
        width={236}
        height={142}
        rx={10}
        fill={IVORY}
        fillOpacity={0.07}
        stroke={IVORY}
        strokeOpacity={0.5}
      />
      <line x1={42} y1={56} x2={278} y2={56} stroke={IVORY} strokeOpacity={0.3} />
      {[56, 68, 80].map((x) => (
        <circle key={x} cx={x} cy={45} r={3} fill={IVORY} fillOpacity={0.55} />
      ))}
      {rows.map((row, i) => (
        <g key={i}>
          <rect
            x={60 + row.indent}
            y={row.y}
            width={row.width}
            height={6}
            rx={3}
            fill={row.gold ? GOLD : IVORY}
            fillOpacity={row.gold ? 0.95 : 0.5}
          />
          {row.second > 0 && (
            <rect
              x={66 + row.indent + row.width}
              y={row.y}
              width={row.second}
              height={6}
              rx={3}
              fill={IVORY}
              fillOpacity={0.25}
            />
          )}
        </g>
      ))}
    </g>
  );
}

/** Repère, quadrillage et courbe : la feuille de mathématiques. */
function TeachArt({ seed }: ArtProps) {
  const random = seeded(seed);
  const ink = '#161c2c';
  const origin = { x: 64, y: 150 };
  const kind = random() < 0.5 ? 'parabole' : 'sinus';
  const points = Array.from({ length: 41 }, (_, i) => {
    const x = 30 + i * 6.5;
    const t = (x - 160) / 80;
    const y = kind === 'parabole' ? 60 + t * t * 70 : 100 - Math.sin(t * 2.4) * 42;
    return { x, y: round(Math.max(20, Math.min(185, y))) };
  });
  const marked = [8, 20, 32].map((index) => points[index]);
  return (
    <g>
      {Array.from({ length: 17 }, (_, i) => (
        <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2={200} stroke={ink} strokeOpacity={0.08} />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 20} x2={320} y2={i * 20} stroke={ink} strokeOpacity={0.08} />
      ))}
      <g stroke={ink} strokeOpacity={0.7} strokeWidth={1.4} fill="none">
        <path d={`M16 ${origin.y} H300 M294 ${origin.y - 5} L300 ${origin.y} L294 ${origin.y + 5}`} />
        <path d={`M${origin.x} 190 V16 M${origin.x - 5} 22 L${origin.x} 16 L${origin.x + 5} 22`} />
      </g>
      <polyline
        points={points.map((point) => `${point.x},${point.y}`).join(' ')}
        fill="none"
        stroke="#1f3a70"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {marked.map((point) => (
        <g key={point.x}>
          <line
            x1={point.x}
            y1={point.y}
            x2={point.x}
            y2={origin.y}
            stroke={ink}
            strokeOpacity={0.35}
            strokeDasharray="3 4"
          />
          <circle cx={point.x} cy={point.y} r={4} fill="#b08a3e" />
        </g>
      ))}
    </g>
  );
}

// Chaque dessin crée son propre générateur à partir de la graine : React peut rendre un composant
// plusieurs fois, et un générateur partagé donnerait alors un dessin différent à chaque rendu.
export function ProjectCover({ category, seed }: { category: ProjectCategory; seed: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      className="cover-art size-full"
      aria-hidden
      focusable="false"
    >
      {category === 'RECHERCHE' && <ResearchArt seed={seed} />}
      {category === 'RESEAUX' && <NetworkArt seed={seed} />}
      {category === 'DEVELOPPEMENT' && <DevArt seed={seed} />}
      {category === 'ENSEIGNEMENT' && <TeachArt seed={seed} />}
    </svg>
  );
}
