// Schéma de principe animé de SCAT. Ce n'est pas une simulation : il illustre le mécanisme décrit
// dans le texte. La cible parcourt la zone ; chaque drone s'active dès que la position PRÉDITE de la
// cible entre dans sa portée, donc avant son arrivée, puis le relais passe au drone et au cluster
// suivants.
//
// Technique : un SVG statique (peint une seule fois) et, par-dessus, des éléments HTML dont seules
// l'opacité et la transformation sont animées. Les images clés sont calculées côté serveur
// (src/lib/scat-scene.ts) : aucun JavaScript n'est envoyé au navigateur, l'animation est confiée
// au compositeur graphique, et elle s'arrête avec « réduire les animations ».
import type { CSSProperties } from 'react';
import { type Point, moveKeyframes, moveTransform, opacityKeyframes, pulseKeyframes } from '@/lib/scat-diagram';
import {
  LEAD,
  LOOP_SECONDS,
  RANGE,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  chiefWindows,
  clusters,
  droneWindows,
  targetPath,
  targetPositions,
} from '@/lib/scat-scene';

const keyframes = [
  ...droneWindows.flatMap((cluster, c) =>
    cluster.flatMap((windows, d) => [
      opacityKeyframes(`scat-cover-${c}-${d}`, windows),
      pulseKeyframes(`scat-pulse-${c}-${d}`, windows),
    ]),
  ),
  ...chiefWindows.map((windows, c) => opacityKeyframes(`scat-chief-${c}`, windows)),
  moveKeyframes('scat-move', targetPositions, SCENE_WIDTH, SCENE_HEIGHT),
].join('');

const percent = (value: number, total: number) => `${Math.round((value / total) * 10000) / 100}%`;
/** Place un élément en pourcentage de la scène, quelle que soit sa taille à l'écran. */
const at = (point: Point): CSSProperties => ({
  left: percent(point.x, SCENE_WIDTH),
  top: percent(point.y, SCENE_HEIGHT),
});
const width = (units: number): CSSProperties => ({ width: percent(units, SCENE_WIDTH) });

/** Élément allumé à l'instant zéro : c'est l'état figé montré quand les animations sont réduites. */
const staticClass = (windows: { start: number }[]) =>
  windows.some((window) => window.start <= 0) ? ' scat-static' : '';

// Position de départ de la cible et de sa position prédite (utilisée telle quelle sans animation).
const leadIndex = Math.round(LEAD * targetPositions.length);
const targetStart = moveTransform(targetPositions[0], SCENE_WIDTH, SCENE_HEIGHT);
const predictedStart = moveTransform(targetPositions[leadIndex], SCENE_WIDTH, SCENE_HEIGHT);

export function ClusterDiagram() {
  return (
    <figure className="card overflow-hidden" style={{ '--scat-loop': `${LOOP_SECONDS}s` } as CSSProperties}>
      <style>{keyframes}</style>
      <div
        className="scat-stage"
        role="img"
        aria-label="Schéma animé : une cible mobile traverse la zone surveillée. Chaque drone s'active avant son arrivée, à partir de sa position prédite, puis le relais passe d'un drone à l'autre et d'un cluster à l'autre, sans interruption de couverture."
      >
        {/* Calque statique : trajectoire, liens et drones au repos. */}
        <svg
          viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          className="absolute inset-0 size-full"
          aria-hidden
          focusable="false"
        >
          <path
            d={targetPath}
            fill="none"
            className="stroke-warm"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="2 5"
          />
          <line
            x1={clusters[0].chief.x}
            y1={clusters[0].chief.y}
            x2={clusters[1].chief.x}
            y2={clusters[1].chief.y}
            className="stroke-accent"
            strokeOpacity="0.55"
            strokeWidth="1.2"
          />
          {clusters.map((cluster) =>
            cluster.drones.map((drone) => (
              <g key={`${drone.x}-${drone.y}`}>
                <line
                  x1={cluster.chief.x}
                  y1={cluster.chief.y}
                  x2={drone.x}
                  y2={drone.y}
                  className="stroke-ink-3"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />
                <circle cx={drone.x} cy={drone.y} r="28" fill="none" className="stroke-line" strokeWidth="1" />
                <circle cx={drone.x} cy={drone.y} r="4" className="fill-ink-3" />
              </g>
            )),
          )}
        </svg>

        {/* Calques animés : opacité et transformation uniquement. */}
        {clusters.map((cluster, c) =>
          cluster.drones.map((drone, d) => {
            const windows = droneWindows[c][d];
            const cover = `scat-anim scat-cover${staticClass(windows)}`;
            const angle = Math.atan2(drone.y - cluster.chief.y, drone.x - cluster.chief.x);
            const length = Math.hypot(drone.x - cluster.chief.x, drone.y - cluster.chief.y);
            return (
              <span key={`${c}-${d}`}>
                {/* Lien avec le Chef d'Essaim, allumé pendant la couverture. */}
                <span
                  className={`scat-el scat-link ${cover}`}
                  style={{
                    ...at(cluster.chief),
                    ...width(length),
                    transform: `rotate(${Math.round(angle * 1000) / 1000}rad)`,
                    animationName: `scat-cover-${c}-${d}`,
                  }}
                />
                {/* Balise radio au moment de la détection. */}
                <span
                  className="scat-el scat-ring scat-anim scat-pulse"
                  style={{ ...at(drone), ...width(RANGE * 2), animationName: `scat-pulse-${c}-${d}` }}
                />
                {/* Zone de couverture du drone. */}
                <span
                  className={`scat-el scat-disc ${cover}`}
                  style={{ ...at(drone), ...width(56), animationName: `scat-cover-${c}-${d}` }}
                />
              </span>
            );
          }),
        )}

        {clusters.map((cluster, c) => (
          <span key={c}>
            {/* Le Chef d'Essaim s'éclaire tant qu'un drone de son cluster couvre la cible. */}
            <span
              className={`scat-el scat-glow scat-anim scat-cover${staticClass(chiefWindows[c])}`}
              style={{ ...at(cluster.chief), ...width(34), animationName: `scat-chief-${c}` }}
            />
            <span className="scat-el scat-chief" style={{ ...at(cluster.chief), ...width(19) }} />
          </span>
        ))}

        {/* Position prédite, puis cible réelle : même trajet, la prédiction a de l'avance. */}
        <span
          className="scat-el scat-mark scat-mark-ghost scat-anim"
          style={{
            transform: predictedStart,
            animationName: 'scat-move',
            animationDelay: `${-LEAD * LOOP_SECONDS}s`,
          }}
        />
        <span className="scat-el scat-mark scat-anim" style={{ transform: targetStart, animationName: 'scat-move' }} />
      </div>

      <figcaption className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line px-5 py-3.5 font-mono text-xs text-ink-3">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full border-2 border-accent" aria-hidden /> Chef d&apos;Essaim
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-ink-2" aria-hidden /> Drone
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rotate-45 bg-warm" aria-hidden /> Cible
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rotate-45 border border-dashed border-warm" aria-hidden /> Position prédite
        </span>
        <span className="ml-auto">Schéma de principe</span>
      </figcaption>
    </figure>
  );
}
