// Scène du schéma SCAT : deux clusters, leurs drones, et la boucle que parcourt la cible.
// Les coordonnées sont celles du viewBox SVG (480 x 240).
import {
  type Point,
  type Window,
  closedSpline,
  coverageWindows,
  mergeWindows,
  pathData,
  travelPositions,
} from './scat-diagram';

/** Dimensions de la scène (unités du schéma). */
export const SCENE_WIDTH = 480;
export const SCENE_HEIGHT = 240;

/** Durée d'un tour complet de la cible, en secondes. */
export const LOOP_SECONDS = 22;
/** Avance de la position prédite sur la cible, en fraction de tour. */
export const LEAD = 0.045;
/** Portée de détection d'un drone. */
export const RANGE = 52;

export const clusters: { chief: Point; drones: Point[] }[] = [
  {
    chief: { x: 150, y: 124 },
    drones: [
      { x: 82, y: 84 },
      { x: 200, y: 62 },
      { x: 196, y: 186 },
      { x: 94, y: 176 },
    ],
  },
  {
    chief: { x: 344, y: 118 },
    drones: [
      { x: 292, y: 56 },
      { x: 412, y: 70 },
      { x: 404, y: 172 },
      { x: 300, y: 184 },
    ],
  },
];

// La cible longe les huit drones tour à tour, en passant d'un cluster à l'autre.
const waypoints: Point[] = [
  { x: 60, y: 130 },
  { x: 118, y: 74 },
  { x: 246, y: 76 },
  { x: 330, y: 62 },
  { x: 430, y: 118 },
  { x: 356, y: 186 },
  { x: 248, y: 168 },
  { x: 140, y: 192 },
];

const segments = closedSpline(waypoints);
/** Positions successives de la cible, à vitesse constante (une valeur par 1/400 de tour). */
export const targetPositions = travelPositions(segments);
const positions = targetPositions;

export const targetPath = pathData(segments);

/** Fenêtres de couverture de chaque drone, cluster par cluster. */
export const droneWindows: Window[][][] = clusters.map((cluster) =>
  cluster.drones.map((drone) => coverageWindows(positions, drone, RANGE, LEAD)),
);

/** Un Chef d'Essaim est actif dès qu'un de ses drones couvre la cible. */
export const chiefWindows: Window[][] = droneWindows.map((windows) => mergeWindows(windows.flat()));

export const allWindows: Window[] = droneWindows.flat(2);
