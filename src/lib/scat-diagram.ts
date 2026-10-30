// Géométrie du schéma animé SCAT : trajectoire de la cible, fenêtres de couverture des drones
// et images clés CSS qui en découlent. Tout est calculé une fois, côté serveur : aucune ligne de
// JavaScript n'est envoyée au navigateur pour cette animation.

export type Point = { x: number; y: number };
/** Portion du parcours de la cible, en fractions de tour (0 à 1). */
export type Window = { start: number; end: number };
type Bezier = [Point, Point, Point, Point];

/** Courbe fermée et lisse passant par tous les points (spline de Catmull-Rom convertie en Bézier). */
export function closedSpline(points: Point[]): Bezier[] {
  const at = (index: number) => points[(index + points.length) % points.length];
  return points.map((point, index) => {
    const previous = at(index - 1);
    const next = at(index + 1);
    const afterNext = at(index + 2);
    return [
      point,
      { x: point.x + (next.x - previous.x) / 6, y: point.y + (next.y - previous.y) / 6 },
      { x: next.x - (afterNext.x - point.x) / 6, y: next.y - (afterNext.y - point.y) / 6 },
      next,
    ];
  });
}

const round = (value: number) => Math.round(value * 10) / 10;

export function pathData(segments: Bezier[]): string {
  const [first] = segments;
  const curves = segments.map(
    ([, c1, c2, end]) =>
      `C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(end.x)} ${round(end.y)}`,
  );
  return `M ${round(first[0].x)} ${round(first[0].y)} ${curves.join(' ')} Z`;
}

function bezierPoint([p0, p1, p2, p3]: Bezier, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Positions de la cible à intervalles réguliers de distance parcourue : la cible avance à vitesse
 * constante (comme `offset-distance` en CSS), l'indice d'un point vaut donc une fraction de tour.
 */
export function travelPositions(segments: Bezier[], count = 400): Point[] {
  const fine = segments.flatMap((segment) => Array.from({ length: 60 }, (_, step) => bezierPoint(segment, step / 60)));
  fine.push(segments[0][0]);

  const lengths = [0];
  for (let index = 1; index < fine.length; index += 1) {
    lengths.push(lengths[index - 1] + distance(fine[index - 1], fine[index]));
  }
  const total = lengths[lengths.length - 1];

  const positions: Point[] = [];
  let cursor = 1;
  for (let step = 0; step < count; step += 1) {
    const target = (step / count) * total;
    while (cursor < lengths.length - 1 && lengths[cursor] < target) cursor += 1;
    const span = lengths[cursor] - lengths[cursor - 1] || 1;
    const ratio = (target - lengths[cursor - 1]) / span;
    positions.push({
      x: fine[cursor - 1].x + (fine[cursor].x - fine[cursor - 1].x) * ratio,
      y: fine[cursor - 1].y + (fine[cursor].y - fine[cursor - 1].y) * ratio,
    });
  }
  return positions;
}

/**
 * Moments où un drone couvre la cible. Il s'active dès que la position PRÉDITE (en avance de `lead`
 * tour) entre dans sa portée, et reste actif tant que la cible réelle s'y trouve : la couverture
 * est donc en place avant l'arrivée de la cible.
 */
export function coverageWindows(positions: Point[], drone: Point, range: number, lead: number): Window[] {
  const count = positions.length;
  const ahead = Math.round(lead * count);
  const active = positions.map(
    (position, index) =>
      distance(position, drone) <= range || distance(positions[(index + ahead) % count], drone) <= range,
  );

  const windows: Window[] = [];
  let start: number | null = null;
  for (let index = 0; index <= count; index += 1) {
    const on = index < count && active[index];
    if (on && start === null) start = index;
    if (!on && start !== null) {
      windows.push({ start: start / count, end: index / count });
      start = null;
    }
  }
  return windows;
}

/** Fusionne des fenêtres qui se chevauchent (couverture d'un cluster entier, par exemple). */
export function mergeWindows(windows: Window[]): Window[] {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const merged: Window[] = [];
  for (const window of sorted) {
    const last = merged[merged.length - 1];
    if (last && window.start <= last.end + 1e-9) last.end = Math.max(last.end, window.end);
    else merged.push({ ...window });
  }
  return merged;
}

/** Part du tour pendant laquelle au moins une fenêtre est active (1 = couverture continue). */
export function coveredShare(windows: Window[]): number {
  return mergeWindows(windows).reduce((total, window) => total + (window.end - window.start), 0);
}

const percent = (fraction: number) => `${Math.round(Math.min(1, Math.max(0, fraction)) * 10000) / 100}%`;

/** Images clés d'opacité : visible pendant les fenêtres, avec un fondu d'entrée et de sortie. */
export function opacityKeyframes(name: string, windows: Window[], fade = 0.012): string {
  const stops: [number, number][] = [];
  for (const { start, end } of windows) {
    // Une fenêtre collée au début ou à la fin du tour reste allumée à la jonction de la boucle.
    stops.push([start <= 0 ? 0 : Math.max(0, start - fade), start <= 0 ? 1 : 0], [start, 1]);
    stops.push([end, 1], [end >= 1 ? 1 : Math.min(1, end + fade), end >= 1 ? 1 : 0]);
  }
  const wraps = windows.some((window) => window.start <= 0) && windows.some((window) => window.end >= 1);
  const edge = wraps ? 1 : 0;
  const all: [number, number][] = [[0, edge], ...stops, [1, edge]];
  const unique = new Map<string, number>();
  for (const [position, value] of all.sort((a, b) => a[0] - b[0])) {
    const key = percent(position);
    unique.set(key, Math.max(unique.get(key) ?? 0, value));
  }
  const body = [...unique].map(([position, value]) => `${position}{opacity:${value}}`).join('');
  return `@keyframes ${name}{${body}}`;
}

/** Images clés d'une balise radio : un anneau qui s'élargit au début de chaque fenêtre. */
export function pulseKeyframes(name: string, windows: Window[], length = 0.05): string {
  const parts = ['0%{opacity:0;transform:scale(0.35)}'];
  for (const { start } of windows) {
    if (start <= 0 || start + length >= 1) continue;
    parts.push(
      `${percent(start - 0.001)}{opacity:0;transform:scale(0.35)}`,
      `${percent(start)}{opacity:0.9;transform:scale(0.35)}`,
      `${percent(start + length)}{opacity:0;transform:scale(1)}`,
    );
  }
  parts.push('100%{opacity:0;transform:scale(1)}');
  return `@keyframes ${name}{${parts.join('')}}`;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Position d'un marqueur sur la scène, en unités de conteneur (cqw / cqh) : la scène peut changer
 * de taille sans recalcul. Le losange est un carré tourné de 45 degrés.
 */
export function moveTransform(point: Point, width: number, height: number): string {
  return `translate(${round2((point.x / width) * 100)}cqw,${round2((point.y / height) * 100)}cqh) rotate(45deg)`;
}

/**
 * Images clés du trajet de la cible. On anime `transform` (et non `offset-path`) : le navigateur
 * confie alors l'animation au compositeur graphique, sans recalcul de style à chaque image.
 */
export function moveKeyframes(name: string, positions: Point[], width: number, height: number, stops = 100): string {
  const parts: string[] = [];
  for (let index = 0; index <= stops; index += 1) {
    const point = positions[Math.round((index / stops) * positions.length) % positions.length];
    parts.push(`${percent(index / stops)}{transform:${moveTransform(point, width, height)}}`);
  }
  return `@keyframes ${name}{${parts.join('')}}`;
}
