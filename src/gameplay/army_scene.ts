// Army Royale — 3D scene v3: visual feedback, impact VFX, projectiles, tighter field
// Migrated from SDK v0.1.0 to v0.2.4

import { quatFromYawPitch, loadAssetFromUrl } from '@lfg/mini-engine';
import {
  createMeshBuilder, appendBox, appendSphere, appendCone, appendCylinder,
  appendCapsule, appendTorus, appendDisc,
  finalizeMesh, packColor, ensureRuntimeMaterial, registerRuntimeMesh,
  spawnRenderable, updateTransform,
} from '@lfg/mini-engine/procedural';
import {
  LANES, BLUE_WALL_X, RED_WALL_X, FIELD_LEFT, FIELD_RIGHT,
  CAMERA_POSITION, CAMERA_PITCH, CAMERA_YAW, CAMERA_FOV, LIGHTING, CARDS, getCard,
} from './shared_world.js';
import {
  createMatchState, spawnFormationAt, deployBlue, tickMatch,
  type MatchState, type UnitState,
} from './army_simulation.js';

// suppress unused imports (appendTorus, appendDisc are available but not used)
void appendTorus; void appendDisc;

// ═══════════════════════════════════════
// MESH BUILDERS
// ═══════════════════════════════════════

function buildGroundMesh() {
  const b = createMeshBuilder();
  appendBox(b, { center: { x: 0, y: -0.3, z: 0 }, size: { x: 90, y: 0.3, z: 65 }, color: packColor(48, 95, 30) });
  appendBox(b, { center: { x: 0, y: -0.1, z: 0 }, size: { x: 62, y: 0.2, z: 44 }, color: packColor(88, 160, 50) });
  appendBox(b, { center: { x: 0, y: -0.04, z: 0 }, size: { x: 28, y: 0.02, z: 38 }, color: packColor(125, 185, 72) });
  appendBox(b, { center: { x: 0, y: -0.02, z: 0 }, size: { x: 16, y: 0.01, z: 30 }, color: packColor(135, 195, 80) });

  for (const lane of LANES) {
    appendBox(b, { center: { x: 0, y: -0.01, z: lane.z }, size: { x: 52, y: 0.02, z: 8 }, color: packColor(78, 145, 42) });
    appendBox(b, { center: { x: 0, y: 0.01, z: lane.z + 4.2 }, size: { x: 50, y: 0.02, z: 0.15 }, color: packColor(110, 185, 60) });
    appendBox(b, { center: { x: 0, y: 0.01, z: lane.z - 4.2 }, size: { x: 50, y: 0.02, z: 0.15 }, color: packColor(110, 185, 60) });
    appendBox(b, { center: { x: 0, y: 0.005, z: lane.z }, size: { x: 48, y: 0.01, z: 2.5 }, color: packColor(95, 155, 48) });
  }

  appendBox(b, { center: { x: 0, y: 0.03, z: 0 }, size: { x: 0.15, y: 0.06, z: 40 }, color: packColor(140, 200, 255) });
  appendBox(b, { center: { x: 0, y: 0.02, z: 0 }, size: { x: 0.4, y: 0.03, z: 40 }, color: packColor(100, 160, 220) });

  appendBox(b, { center: { x: 0, y: -0.02, z: 21 }, size: { x: 64, y: 0.06, z: 2.5 }, color: packColor(60, 118, 32) });
  appendBox(b, { center: { x: 0, y: -0.02, z: -21 }, size: { x: 64, y: 0.06, z: 2.5 }, color: packColor(60, 118, 32) });

  for (const [px, pz] of [[-12,8],[-8,-10],[10,5],[6,-8],[-15,-5],[14,12],[-5,14],[8,-14]] as [number,number][]) {
    appendBox(b, { center: { x: px, y: 0.005, z: pz }, size: { x: 3.5, y: 0.01, z: 2.5 }, color: packColor(70, 135, 38) });
  }

  appendSphere(b, { center: { x: -20, y: -5, z: 38 }, radius: 8, widthSegments: 8, heightSegments: 5, color: packColor(55, 108, 34) });
  appendSphere(b, { center: { x: 10, y: -4.5, z: 40 }, radius: 7, widthSegments: 8, heightSegments: 5, color: packColor(50, 100, 30) });
  appendSphere(b, { center: { x: -5, y: -5.5, z: 42 }, radius: 9, widthSegments: 8, heightSegments: 5, color: packColor(52, 105, 32) });
  appendSphere(b, { center: { x: 25, y: -5, z: 36 }, radius: 6, widthSegments: 6, heightSegments: 4, color: packColor(48, 98, 28) });
  appendSphere(b, { center: { x: -12, y: -5, z: -36 }, radius: 7, widthSegments: 8, heightSegments: 5, color: packColor(53, 105, 33) });
  appendSphere(b, { center: { x: 18, y: -4.5, z: -38 }, radius: 6, widthSegments: 8, heightSegments: 5, color: packColor(50, 100, 30) });
  appendSphere(b, { center: { x: 0, y: -5.5, z: -40 }, radius: 8, widthSegments: 8, heightSegments: 5, color: packColor(48, 98, 28) });
  appendSphere(b, { center: { x: -42, y: -4, z: 5 }, radius: 6, widthSegments: 6, heightSegments: 4, color: packColor(52, 102, 32) });
  appendSphere(b, { center: { x: -44, y: -4.5, z: -10 }, radius: 7, widthSegments: 6, heightSegments: 4, color: packColor(48, 96, 28) });
  appendSphere(b, { center: { x: 42, y: -4, z: -5 }, radius: 6, widthSegments: 6, heightSegments: 4, color: packColor(50, 100, 30) });
  appendSphere(b, { center: { x: 44, y: -4.5, z: 8 }, radius: 7, widthSegments: 6, heightSegments: 4, color: packColor(46, 94, 26) });

  for (const [rx, rz] of [[-18, 15], [15, -13], [-6, -16], [20, 10], [-20, -3], [17, 3]] as [number,number][]) {
    appendSphere(b, { center: { x: rx, y: 0.12, z: rz }, radius: 0.35, widthSegments: 6, heightSegments: 4, color: packColor(130, 125, 115) });
    appendBox(b, { center: { x: rx, y: 0.005, z: rz }, size: { x: 0.6, y: 0.01, z: 0.5 }, color: packColor(55, 100, 30) });
  }

  appendBox(b, { center: { x: BLUE_WALL_X + 4, y: 0.005, z: 0 }, size: { x: 4, y: 0.01, z: 30 }, color: packColor(120, 100, 60) });
  appendBox(b, { center: { x: RED_WALL_X - 4, y: 0.005, z: 0 }, size: { x: 4, y: 0.01, z: 30 }, color: packColor(120, 100, 60) });

  return finalizeMesh(b);
}

function buildTerrainDetailsMesh() {
  const b = createMeshBuilder();

  const flowerColors = [
    packColor(255, 80, 80), packColor(255, 220, 60), packColor(200, 100, 255),
    packColor(255, 160, 200), packColor(255, 255, 255),
  ];
  const flowerPositions: [number,number][] = [
    [-16, 17], [-14, 16.5], [-15, 18], [12, -16], [13, -15.5], [11, -17],
    [-22, 5], [-21, 6], [22, -4], [21, -3], [-8, 18], [-7, 17.5],
    [8, -18], [7, -17.5], [18, 16], [17, 15], [-19, -14], [-18, -15],
    [20, 8], [19, 9], [-4, 19], [-3, 18.5], [5, -19], [4, -18],
  ];
  for (let i = 0; i < flowerPositions.length; i++) {
    const [fx, fz] = flowerPositions[i];
    const fc = flowerColors[i % flowerColors.length];
    appendSphere(b, { center: { x: fx, y: 0.15, z: fz }, radius: 0.18, widthSegments: 4, heightSegments: 3, color: fc });
    appendBox(b, { center: { x: fx, y: 0.06, z: fz }, size: { x: 0.04, y: 0.12, z: 0.04 }, color: packColor(60, 130, 40) });
  }

  const stonePositions: [number,number][] = [
    [-32, 15], [-33, 16], [-31, 14], [32, -14], [33, -15], [31, -13],
    [-30, -16], [30, 16], [-35, 0], [35, 0],
  ];
  for (const [sx, sz] of stonePositions) {
    const r = 0.3 + Math.abs(sx * sz % 5) * 0.08;
    appendSphere(b, { center: { x: sx, y: r * 0.5, z: sz }, radius: r, widthSegments: 5, heightSegments: 3, color: packColor(145, 138, 125) });
  }
  appendSphere(b, { center: { x: -33, y: 0.4, z: 19 }, radius: 0.7, widthSegments: 6, heightSegments: 4, color: packColor(135, 130, 118) });
  appendSphere(b, { center: { x: 33, y: 0.4, z: -19 }, radius: 0.65, widthSegments: 6, heightSegments: 4, color: packColor(140, 132, 120) });
  appendSphere(b, { center: { x: -33, y: 0.35, z: -19 }, radius: 0.6, widthSegments: 6, heightSegments: 4, color: packColor(138, 128, 115) });
  appendSphere(b, { center: { x: 33, y: 0.38, z: 19 }, radius: 0.55, widthSegments: 6, heightSegments: 4, color: packColor(142, 135, 122) });

  for (const [dx, dz] of [[-25, 12], [25, -10], [-20, -16], [22, 15], [-26, -8], [26, 6]] as [number,number][]) {
    appendBox(b, { center: { x: dx, y: 0.005, z: dz }, size: { x: 2.5, y: 0.01, z: 1.8 }, color: packColor(110, 90, 55) });
  }

  const tuftPositions: [number,number][] = [
    [-15, 23], [12, 24], [-10, -24], [15, -23],
    [-35, 5], [-36, -5], [35, -3], [37, 7],
  ];
  for (const [tx, tz] of tuftPositions) {
    appendCone(b, { center: { x: tx, y: 0.4, z: tz }, radius: 0.3, height: 0.8, radialSegments: 4, color: packColor(65, 130, 38) });
    appendCone(b, { center: { x: tx + 0.3, y: 0.35, z: tz - 0.2 }, radius: 0.25, height: 0.7, radialSegments: 4, color: packColor(58, 120, 34) });
  }

  return finalizeMesh(b);
}

function buildWallMesh(side: 'blue' | 'red') {
  const b = createMeshBuilder();
  const isBlue = side === 'blue';
  const wx = isBlue ? BLUE_WALL_X : RED_WALL_X;
  const c1 = isBlue ? packColor(50, 80, 160) : packColor(160, 50, 45);
  const c2 = isBlue ? packColor(65, 105, 190) : packColor(190, 65, 50);
  const c3 = isBlue ? packColor(35, 60, 125) : packColor(125, 35, 30);
  appendBox(b, { center: { x: wx, y: 5, z: 0 }, size: { x: 5, y: 10, z: 40 }, color: c1 });
  appendBox(b, { center: { x: wx, y: 10.5, z: 0 }, size: { x: 6, y: 0.8, z: 41 }, color: c2 });
  for (let i = -4; i <= 4; i++) appendBox(b, { center: { x: wx, y: 11.5, z: i * 4 }, size: { x: 6, y: 1.6, z: 2 }, color: c2 });
  for (let y = 2; y < 10; y += 1.5) {
    appendBox(b, { center: { x: wx + (isBlue ? 2.6 : -2.6), y, z: 0 }, size: { x: 0.1, y: 0.06, z: 40 }, color: c3 });
  }
  for (const tz of [17, -17]) {
    appendCylinder(b, { center: { x: wx, y: 6, z: tz }, radiusTop: 3.5, radiusBottom: 3.5, height: 12, radialSegments: 14, color: c1 });
    appendCone(b, { center: { x: wx, y: 13.5, z: tz }, radius: 4, height: 5, radialSegments: 14, color: c2 });
    appendSphere(b, { center: { x: wx, y: 16.5, z: tz }, radius: 0.8, widthSegments: 8, heightSegments: 6, color: packColor(255, 215, 50) });
  }
  for (const lane of LANES) {
    appendBox(b, { center: { x: wx, y: 3.5, z: lane.z }, size: { x: 5.5, y: 7, z: 5.5 }, color: c3 });
    appendBox(b, { center: { x: wx, y: 7.5, z: lane.z }, size: { x: 6, y: 1, z: 6 }, color: c2 });
    appendCylinder(b, { center: { x: wx, y: 7, z: lane.z }, radiusTop: 2.5, radiusBottom: 2.5, height: 0.5, radialSegments: 12, color: c2 });
  }
  return finalizeMesh(b);
}

// ═══ ANIMAL CHARACTER MESH BUILDERS ═══

function buildMonkeyMesh(teamR: number, teamG: number, teamB: number) {
  const b = createMeshBuilder();
  const tc = packColor(Math.floor(teamR*255), Math.floor(teamG*255), Math.floor(teamB*255));
  const tcDark = packColor(Math.floor(teamR*180), Math.floor(teamG*180), Math.floor(teamB*180));
  const face = packColor(240, 210, 170);
  appendSphere(b, { center: { x: 0, y: 0.7, z: 0 }, radius: 0.55, widthSegments: 6, heightSegments: 5, color: tc });
  appendSphere(b, { center: { x: 0, y: 1.35, z: 0 }, radius: 0.45, widthSegments: 6, heightSegments: 5, color: tc });
  appendSphere(b, { center: { x: 0, y: 1.28, z: 0.35 }, radius: 0.2, widthSegments: 4, heightSegments: 3, color: face });
  appendSphere(b, { center: { x: -0.42, y: 1.5, z: 0 }, radius: 0.18, widthSegments: 4, heightSegments: 3, color: tc });
  appendSphere(b, { center: { x: 0.42, y: 1.5, z: 0 }, radius: 0.18, widthSegments: 4, heightSegments: 3, color: tc });
  appendCylinder(b, { center: { x: 0.65, y: 0.9, z: 0 }, radiusTop: 0.06, radiusBottom: 0.1, height: 0.8, radialSegments: 4, color: packColor(255, 220, 50) });
  appendBox(b, { center: { x: -0.2, y: 0.15, z: 0 }, size: { x: 0.2, y: 0.3, z: 0.22 }, color: tcDark });
  appendBox(b, { center: { x: 0.2, y: 0.15, z: 0 }, size: { x: 0.2, y: 0.3, z: 0.22 }, color: tcDark });
  return finalizeMesh(b);
}

function buildHamsterMesh(teamR: number, teamG: number, teamB: number) {
  const b = createMeshBuilder();
  const tc = packColor(Math.floor(teamR*255), Math.floor(teamG*255), Math.floor(teamB*255));
  const tcLight = packColor(Math.min(255,Math.floor(teamR*255)+40), Math.min(255,Math.floor(teamG*255)+40), Math.min(255,Math.floor(teamB*255)+40));
  appendSphere(b, { center: { x: 0, y: 0.6, z: 0 }, radius: 0.6, widthSegments: 6, heightSegments: 5, color: tc });
  appendSphere(b, { center: { x: 0, y: 1.2, z: 0.05 }, radius: 0.42, widthSegments: 6, heightSegments: 5, color: tc });
  appendSphere(b, { center: { x: -0.35, y: 1.12, z: 0.15 }, radius: 0.22, widthSegments: 4, heightSegments: 3, color: tcLight });
  appendSphere(b, { center: { x: 0.35, y: 1.12, z: 0.15 }, radius: 0.22, widthSegments: 4, heightSegments: 3, color: tcLight });
  appendSphere(b, { center: { x: -0.28, y: 1.55, z: 0 }, radius: 0.12, widthSegments: 4, heightSegments: 3, color: tcLight });
  appendSphere(b, { center: { x: 0.28, y: 1.55, z: 0 }, radius: 0.12, widthSegments: 4, heightSegments: 3, color: tcLight });
  appendSphere(b, { center: { x: 0.5, y: 0.85, z: 0.2 }, radius: 0.12, widthSegments: 4, heightSegments: 3, color: packColor(140, 90, 40) });
  return finalizeMesh(b);
}

function buildFrogMesh(teamR: number, teamG: number, teamB: number) {
  const b = createMeshBuilder();
  const tc = packColor(Math.floor(teamR*255), Math.floor(teamG*255), Math.floor(teamB*255));
  const tcDark = packColor(Math.floor(teamR*160), Math.floor(teamG*160), Math.floor(teamB*160));
  const eye = packColor(255, 255, 220);
  appendCapsule(b, { center: { x: 0, y: 0.55, z: 0 }, radius: 0.55, height: 0.5, capSegments: 4, radialSegments: 6, color: tc });
  appendBox(b, { center: { x: 0, y: 1.05, z: 0.1 }, size: { x: 0.9, y: 0.5, z: 0.65 }, color: tc });
  appendSphere(b, { center: { x: -0.32, y: 1.4, z: 0.15 }, radius: 0.2, widthSegments: 4, heightSegments: 3, color: eye });
  appendSphere(b, { center: { x: 0.32, y: 1.4, z: 0.15 }, radius: 0.2, widthSegments: 4, heightSegments: 3, color: eye });
  appendSphere(b, { center: { x: -0.32, y: 1.42, z: 0.28 }, radius: 0.08, widthSegments: 3, heightSegments: 2, color: packColor(20, 20, 20) });
  appendSphere(b, { center: { x: 0.32, y: 1.42, z: 0.28 }, radius: 0.08, widthSegments: 3, heightSegments: 2, color: packColor(20, 20, 20) });
  appendBox(b, { center: { x: -0.45, y: 0.2, z: -0.1 }, size: { x: 0.25, y: 0.4, z: 0.35 }, color: tcDark });
  appendBox(b, { center: { x: 0.45, y: 0.2, z: -0.1 }, size: { x: 0.25, y: 0.4, z: 0.35 }, color: tcDark });
  return finalizeMesh(b);
}

function buildDucklingMesh(teamR: number, teamG: number, teamB: number) {
  const b = createMeshBuilder();
  const tc = packColor(Math.floor(teamR*255), Math.floor(teamG*255), Math.floor(teamB*255));
  const beak = packColor(255, 160, 30);
  appendSphere(b, { center: { x: 0, y: 0.4, z: 0 }, radius: 0.38, widthSegments: 6, heightSegments: 5, color: tc });
  appendSphere(b, { center: { x: 0, y: 0.9, z: 0.05 }, radius: 0.32, widthSegments: 6, heightSegments: 5, color: tc });
  appendCone(b, { center: { x: 0, y: 0.82, z: 0.38 }, radius: 0.12, height: 0.22, radialSegments: 4, color: beak });
  appendSphere(b, { center: { x: -0.15, y: 0.98, z: 0.2 }, radius: 0.06, widthSegments: 3, heightSegments: 2, color: packColor(20, 20, 20) });
  appendSphere(b, { center: { x: 0.15, y: 0.98, z: 0.2 }, radius: 0.06, widthSegments: 3, heightSegments: 2, color: packColor(20, 20, 20) });
  appendBox(b, { center: { x: -0.35, y: 0.45, z: 0 }, size: { x: 0.12, y: 0.25, z: 0.3 }, color: tc });
  appendBox(b, { center: { x: 0.35, y: 0.45, z: 0 }, size: { x: 0.12, y: 0.25, z: 0.3 }, color: tc });
  appendBox(b, { center: { x: -0.12, y: 0.04, z: 0.06 }, size: { x: 0.14, y: 0.08, z: 0.2 }, color: beak });
  appendBox(b, { center: { x: 0.12, y: 0.04, z: 0.06 }, size: { x: 0.14, y: 0.08, z: 0.2 }, color: beak });
  return finalizeMesh(b);
}

function buildUnitMesh(cardId: string, bodyColor: [number,number,number], _hatColor: [number,number,number], _skinColor: [number,number,number]) {
  const [br, bg, bb] = bodyColor;
  switch (cardId) {
    case 'monkey':   return buildMonkeyMesh(br, bg, bb);
    case 'hamster':  return buildHamsterMesh(br, bg, bb);
    case 'frog':     return buildFrogMesh(br, bg, bb);
    case 'duckling': return buildDucklingMesh(br, bg, bb);
    default:         return buildMonkeyMesh(br, bg, bb);
  }
}

function buildTreeMesh(s: number) {
  const b = createMeshBuilder();
  appendCylinder(b, { center: { x: 0, y: 1.5*s, z: 0 }, radiusTop: 0.4*s, radiusBottom: 0.4*s, height: 3*s, radialSegments: 8, color: packColor(110,75,40) });
  appendSphere(b, { center: { x: 0, y: 3.5*s, z: 0 }, radius: 2*s, widthSegments: 10, heightSegments: 8, color: packColor(55,125,45) });
  appendSphere(b, { center: { x: 0.5*s, y: 4*s, z: 0.3*s }, radius: 1.5*s, widthSegments: 8, heightSegments: 6, color: packColor(70,150,50) });
  appendSphere(b, { center: { x: -0.4*s, y: 3.8*s, z: -0.3*s }, radius: 1.3*s, widthSegments: 8, heightSegments: 6, color: packColor(60,135,42) });
  return finalizeMesh(b);
}

function buildBushMesh() {
  const b = createMeshBuilder();
  appendSphere(b, { center: { x: 0, y: 0.6, z: 0 }, radius: 1.2, widthSegments: 8, heightSegments: 6, color: packColor(50,115,38) });
  appendSphere(b, { center: { x: 0.7, y: 0.5, z: 0.3 }, radius: 0.9, widthSegments: 6, heightSegments: 4, color: packColor(60,135,45) });
  appendSphere(b, { center: { x: -0.5, y: 0.7, z: -0.2 }, radius: 0.8, widthSegments: 6, heightSegments: 4, color: packColor(48,110,34) });
  return finalizeMesh(b);
}

function buildImpactMesh() {
  const b = createMeshBuilder();
  appendSphere(b, { center: { x: 0, y: 0.4, z: 0 }, radius: 2.5, widthSegments: 10, heightSegments: 8, color: packColor(60, 55, 50) });
  appendSphere(b, { center: { x: 1.5, y: 0.3, z: 1.0 }, radius: 1.8, widthSegments: 8, heightSegments: 6, color: packColor(70, 65, 55) });
  appendSphere(b, { center: { x: -1.3, y: 0.35, z: -0.8 }, radius: 1.6, widthSegments: 8, heightSegments: 6, color: packColor(55, 50, 45) });
  appendSphere(b, { center: { x: 0.8, y: 0.2, z: -1.4 }, radius: 1.4, widthSegments: 6, heightSegments: 4, color: packColor(65, 58, 48) });
  appendSphere(b, { center: { x: 0, y: 1.2, z: 0 }, radius: 2.2, widthSegments: 10, heightSegments: 8, color: packColor(255, 180, 40) });
  appendSphere(b, { center: { x: 0, y: 1.8, z: 0 }, radius: 1.6, widthSegments: 8, heightSegments: 6, color: packColor(255, 140, 20) });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const rx = Math.cos(angle) * 2.2;
    const rz = Math.sin(angle) * 2.2;
    appendSphere(b, { center: { x: rx, y: 0.8 + Math.sin(i) * 0.4, z: rz }, radius: 0.65, widthSegments: 6, heightSegments: 4, color: packColor(255, 120, 15) });
  }
  appendSphere(b, { center: { x: 0, y: 1.5, z: 0 }, radius: 1.2, widthSegments: 8, heightSegments: 6, color: packColor(255, 255, 240) });
  appendSphere(b, { center: { x: 0, y: 2.0, z: 0 }, radius: 0.7, widthSegments: 6, heightSegments: 4, color: packColor(255, 255, 255) });
  appendSphere(b, { center: { x: 0, y: 2.8, z: 0 }, radius: 1.0, widthSegments: 8, heightSegments: 6, color: packColor(255, 200, 50) });
  appendSphere(b, { center: { x: 0.5, y: 3.2, z: 0.3 }, radius: 0.6, widthSegments: 6, heightSegments: 4, color: packColor(255, 160, 30) });
  const sparkPositions: [number,number,number][] = [
    [1.8, 2.5, 0.5], [-1.5, 2.8, -0.8], [0.8, 3.5, -1.0], [-0.5, 3.0, 1.2],
    [2.0, 1.5, -1.5], [-2.2, 1.8, 0.6], [1.0, 3.8, 0.2], [-1.0, 2.2, -1.8],
    [2.5, 1.0, 0.0], [-2.0, 0.8, 1.0], [0.3, 4.0, -0.5], [1.5, 0.6, 1.8],
  ];
  for (const [sx, sy, sz] of sparkPositions) {
    appendSphere(b, { center: { x: sx, y: sy, z: sz }, radius: 0.2, widthSegments: 4, heightSegments: 3, color: packColor(255, 240, 160) });
  }
  return finalizeMesh(b);
}

function buildFireMesh() {
  const b = createMeshBuilder();
  appendCone(b, { center: { x: 0, y: 1.0, z: 0 }, radius: 0.8, height: 2.0, radialSegments: 8, color: packColor(255, 100, 20) });
  appendCone(b, { center: { x: 0.3, y: 1.2, z: 0.2 }, radius: 0.6, height: 2.2, radialSegments: 7, color: packColor(255, 100, 20) });
  appendCone(b, { center: { x: -0.3, y: 1.1, z: -0.2 }, radius: 0.65, height: 2.0, radialSegments: 7, color: packColor(255, 100, 20) });
  appendCone(b, { center: { x: 0, y: 2.0, z: 0 }, radius: 0.5, height: 1.8, radialSegments: 6, color: packColor(255, 220, 80) });
  appendCone(b, { center: { x: 0.2, y: 2.2, z: 0.15 }, radius: 0.35, height: 1.5, radialSegments: 6, color: packColor(255, 220, 80) });
  appendCone(b, { center: { x: -0.2, y: 2.1, z: -0.1 }, radius: 0.4, height: 1.6, radialSegments: 6, color: packColor(255, 180, 40) });
  appendCone(b, { center: { x: 0.6, y: 0.8, z: 0.4 }, radius: 0.4, height: 1.4, radialSegments: 5, color: packColor(255, 60, 10) });
  appendCone(b, { center: { x: -0.6, y: 0.7, z: -0.3 }, radius: 0.45, height: 1.5, radialSegments: 5, color: packColor(255, 60, 10) });
  appendCone(b, { center: { x: 0.1, y: 0.9, z: -0.5 }, radius: 0.35, height: 1.3, radialSegments: 5, color: packColor(255, 60, 10) });
  appendCone(b, { center: { x: -0.4, y: 0.85, z: 0.5 }, radius: 0.38, height: 1.4, radialSegments: 5, color: packColor(255, 60, 10) });
  appendSphere(b, { center: { x: 0, y: 0.5, z: 0 }, radius: 0.7, widthSegments: 8, heightSegments: 6, color: packColor(255, 180, 40) });
  appendSphere(b, { center: { x: 0, y: 1.5, z: 0 }, radius: 0.5, widthSegments: 6, heightSegments: 4, color: packColor(255, 220, 80) });
  appendSphere(b, { center: { x: 0, y: 2.8, z: 0 }, radius: 0.3, widthSegments: 6, heightSegments: 4, color: packColor(255, 220, 80) });
  appendSphere(b, { center: { x: 0.3, y: 3.3, z: 0.1 }, radius: 0.12, widthSegments: 4, heightSegments: 3, color: packColor(255, 180, 40) });
  appendSphere(b, { center: { x: -0.2, y: 3.5, z: -0.15 }, radius: 0.1, widthSegments: 4, heightSegments: 3, color: packColor(255, 220, 80) });
  appendSphere(b, { center: { x: 0.1, y: 3.7, z: 0.2 }, radius: 0.08, widthSegments: 4, heightSegments: 3, color: packColor(255, 240, 160) });
  return finalizeMesh(b);
}

function buildDeployFlashMesh() {
  const b = createMeshBuilder();
  appendCylinder(b, { center: { x: 0, y: 0.03, z: 0 }, radiusTop: 0.6, radiusBottom: 0.6, height: 0.02, radialSegments: 12, color: packColor(90, 160, 240) });
  appendSphere(b, { center: { x: 0, y: 0.15, z: 0 }, radius: 0.12, widthSegments: 6, heightSegments: 4, color: packColor(170, 215, 255) });
  return finalizeMesh(b);
}

function buildDebugOutlinesMesh() {
  const b = createMeshBuilder();
  const outline = (x1: number, z1: number, x2: number, z2: number, color: number, fenceHeight: number, thick: number) => {
    const w = Math.abs(x2 - x1), d = Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const y = fenceHeight / 2;
    appendBox(b, { center: { x: cx, y, z: z1 }, size: { x: w, y: fenceHeight, z: thick }, color });
    appendBox(b, { center: { x: cx, y, z: z2 }, size: { x: w, y: fenceHeight, z: thick }, color });
    appendBox(b, { center: { x: x1, y, z: cz }, size: { x: thick, y: fenceHeight, z: d }, color });
    appendBox(b, { center: { x: x2, y, z: cz }, size: { x: thick, y: fenceHeight, z: d }, color });
    for (const [px, pz] of [[x1,z1],[x2,z1],[x1,z2],[x2,z2]] as [number,number][]) {
      appendBox(b, { center: { x: px, y: fenceHeight, z: pz }, size: { x: thick*2, y: fenceHeight*2, z: thick*2 }, color });
    }
  };
  outline(-45, -32.5, 45, 32.5, packColor(255, 40, 220), 2.5, 0.5);
  outline(-31, -22, 31, 22, packColor(255, 40, 40), 3.0, 0.5);
  outline(-26, -20, 0, 20, packColor(40, 220, 255), 2.0, 0.4);
  return finalizeMesh(b);
}

function buildProjectileMesh() {
  const b = createMeshBuilder();
  appendSphere(b, { center: { x: 0, y: 0, z: 0 }, radius: 0.35, widthSegments: 8, heightSegments: 6, color: packColor(255,240,120) });
  appendSphere(b, { center: { x: 0, y: 0, z: 0.2 }, radius: 0.2, widthSegments: 6, heightSegments: 4, color: packColor(255,200,80) });
  appendSphere(b, { center: { x: 0, y: 0, z: -0.3 }, radius: 0.15, widthSegments: 4, heightSegments: 3, color: packColor(255,180,60) });
  return finalizeMesh(b);
}

// ═══ TEAM-COLORED SPARK MESHES ═══

function buildTeamSparkMesh(team: 'blue' | 'red') {
  const b = createMeshBuilder();
  const core = team === 'blue' ? packColor(120, 180, 255) : packColor(255, 120, 100);
  const bright = team === 'blue' ? packColor(200, 230, 255) : packColor(255, 200, 160);
  const outer = team === 'blue' ? packColor(60, 130, 220) : packColor(220, 60, 50);
  // Central flash
  appendSphere(b, { center: { x: 0, y: 0.6, z: 0 }, radius: 1.2, widthSegments: 8, heightSegments: 6, color: bright });
  appendSphere(b, { center: { x: 0, y: 0.8, z: 0 }, radius: 0.8, widthSegments: 6, heightSegments: 4, color: packColor(255, 255, 240) });
  // Radiating sparks
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const rx = Math.cos(angle) * 1.8;
    const rz = Math.sin(angle) * 1.8;
    appendSphere(b, { center: { x: rx, y: 0.5 + Math.sin(i * 1.1) * 0.3, z: rz }, radius: 0.4, widthSegments: 4, heightSegments: 3, color: core });
  }
  // Outer ring
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.4;
    appendSphere(b, { center: { x: Math.cos(angle) * 2.4, y: 0.3, z: Math.sin(angle) * 2.4 }, radius: 0.25, widthSegments: 4, heightSegments: 3, color: outer });
  }
  return finalizeMesh(b);
}

function buildSlashMesh() {
  const b = createMeshBuilder();
  // Arc-shaped slash trail using flat boxes fanned out
  const slashColor = packColor(255, 255, 220);
  const trailColor = packColor(255, 240, 160);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 0.8 - Math.PI * 0.4;
    const r = 2.0;
    const cx = Math.cos(angle) * r;
    const cz = Math.sin(angle) * r;
    const w = 0.6 - i * 0.04;
    appendBox(b, { center: { x: cx, y: 0.8, z: cz }, size: { x: w, y: 0.08, z: 0.5 }, color: i < 4 ? slashColor : trailColor });
  }
  // Central slash point
  appendSphere(b, { center: { x: 2.0, y: 0.8, z: 0 }, radius: 0.3, widthSegments: 4, heightSegments: 3, color: packColor(255, 255, 255) });
  return finalizeMesh(b);
}

function buildDustCloudMesh() {
  const b = createMeshBuilder();
  const dustColors = [
    packColor(180, 170, 140), packColor(160, 150, 125),
    packColor(195, 185, 155), packColor(170, 160, 135),
  ];
  // Cluster of soft spheres
  appendSphere(b, { center: { x: 0, y: 0.5, z: 0 }, radius: 1.5, widthSegments: 6, heightSegments: 4, color: dustColors[0] });
  appendSphere(b, { center: { x: 1.2, y: 0.4, z: 0.8 }, radius: 1.2, widthSegments: 6, heightSegments: 4, color: dustColors[1] });
  appendSphere(b, { center: { x: -1.0, y: 0.6, z: -0.6 }, radius: 1.0, widthSegments: 6, heightSegments: 4, color: dustColors[2] });
  appendSphere(b, { center: { x: 0.5, y: 0.8, z: -1.0 }, radius: 0.9, widthSegments: 5, heightSegments: 3, color: dustColors[3] });
  appendSphere(b, { center: { x: -0.8, y: 0.3, z: 1.0 }, radius: 0.8, widthSegments: 5, heightSegments: 3, color: dustColors[0] });
  return finalizeMesh(b);
}

function buildFrontlineMarkerMesh() {
  const b = createMeshBuilder();
  // Glowing ground strip — horizontal bar with soft glow
  appendBox(b, { center: { x: 0, y: 0.06, z: 0 }, size: { x: 0.8, y: 0.06, z: 8.5 }, color: packColor(255, 200, 60) });
  appendBox(b, { center: { x: 0, y: 0.04, z: 0 }, size: { x: 1.6, y: 0.03, z: 9.0 }, color: packColor(255, 160, 40) });
  // Animated pips along the line
  for (let i = -3; i <= 3; i++) {
    appendSphere(b, { center: { x: 0, y: 0.15, z: i * 1.1 }, radius: 0.2, widthSegments: 4, heightSegments: 3, color: packColor(255, 240, 120) });
  }
  return finalizeMesh(b);
}

// ═══ VFX SLOT TYPES ═══

interface VfxSlot {
  transformPtr: number;
  active: boolean;
  life: number;
  x: number;
  z: number;
  big?: boolean;
}

interface ProjSlot {
  transformPtr: number;
  active: boolean;
  life: number;
  maxLife: number;
  sx: number; sz: number;
  tx: number; tz: number;
}

interface SlashSlot {
  transformPtr: number;
  active: boolean;
  life: number;
  x: number;
  z: number;
  yaw: number;
}

interface DustSlot {
  transformPtr: number;
  active: boolean;
  life: number;
  x: number;
  z: number;
  drift: number;
}

interface FrontlineSlot {
  transformPtr: number;
  laneId: string;
}

// ═══════════════════════════════════════
// GAME CONTROLLER
// ═══════════════════════════════════════

export interface ArmyRoyaleUI {
  timerEl?: HTMLElement | null;
  blueHpEl?: HTMLElement | null;
  redHpEl?: HTMLElement | null;
  blueHpBar?: HTMLElement | null;
  redHpBar?: HTMLElement | null;
  phaseEl?: HTMLElement | null;
  statusEl?: HTMLElement | null;
  elixirValEl?: HTMLElement | null;
  cardTrayEl?: HTMLElement | null;
}

export class ArmyRoyaleScene {
  private Module: any;
  private Mini: any;
  private scene: number;
  private ui: ArmyRoyaleUI;
  private state: MatchState;
  private meshes: Record<string, any> = {};
  private materials: Record<string, any> = {};
  private unitEntities: Map<number, { entityId: number; transformPtr: number; glb: boolean }> = new Map();
  private impactPool: VfxSlot[] = [];
  private projPool: ProjSlot[] = [];
  private deployFlashPool: VfxSlot[] = [];
  private firePool: VfxSlot[] = [];
  private blueSparkPool: VfxSlot[] = [];
  private redSparkPool: VfxSlot[] = [];
  private slashPool: SlashSlot[] = [];
  private dustPool: DustSlot[] = [];
  private frontlineSlots: FrontlineSlot[] = [];
  private time = 0;
  private countdown = 3.0;
  private started = false;
  private breachPhase: { timer: number; winner: string; duration: number } | null = null;
  private cameraEntityId: number = 0;
  private cameraShake = 0;
  private _resultShown = false;
  private _blueWallEntity: any = null;
  private _redWallEntity: any = null;
  private _deployPreviewEntity: any = null;
  private _deployInvalidEntity: any = null;
  private _deployZoneEntity: any = null;
  private _debugOutlines = false;
  private _startDrag?: (cardId: string, el: HTMLElement, x: number, y: number) => void;
  private _clashVfxTimer = 0;
  private _dustSpawnTimer = 0;
  private glbMeshes: Record<string, { meshHash: number; materialHash: number }> = {};
  private teamMaterials: Record<string, number> = {};

  constructor(Module: any, Mini: any, sceneHandle: number, ui: ArmyRoyaleUI = {}) {
    this.Module = Module;
    this.Mini = Mini;
    this.scene = sceneHandle;
    this.ui = ui;
    this.state = createMatchState();
  }

  async init() {
    this.materials.world = ensureRuntimeMaterial(this.Mini, this.scene, 'army_world', { roughness: 0.85, metallic: 0.02 });
    this.materials.unit = ensureRuntimeMaterial(this.Mini, this.scene, 'army_unit', { roughness: 0.65, metallic: 0.05 });
    this.materials.vfx = ensureRuntimeMaterial(this.Mini, this.scene, 'army_vfx', { roughness: 0.9, metallic: 0.0 });

    this.meshes.ground = registerRuntimeMesh(this.Mini, this.scene, 'army_ground', buildGroundMesh());
    this.meshes.terrainDetails = registerRuntimeMesh(this.Mini, this.scene, 'army_terrain_details', buildTerrainDetailsMesh());
    this.meshes.blueWall = registerRuntimeMesh(this.Mini, this.scene, 'army_blue_wall', buildWallMesh('blue'));
    this.meshes.redWall = registerRuntimeMesh(this.Mini, this.scene, 'army_red_wall', buildWallMesh('red'));
    this.meshes.tree = registerRuntimeMesh(this.Mini, this.scene, 'army_tree', buildTreeMesh(1));
    this.meshes.bush = registerRuntimeMesh(this.Mini, this.scene, 'army_bush', buildBushMesh());
    this.meshes.impact = registerRuntimeMesh(this.Mini, this.scene, 'army_impact', buildImpactMesh());
    this.meshes.fire = registerRuntimeMesh(this.Mini, this.scene, 'army_fire', buildFireMesh());
    this.meshes.projectile = registerRuntimeMesh(this.Mini, this.scene, 'army_proj', buildProjectileMesh());
    this.meshes.deployFlash = registerRuntimeMesh(this.Mini, this.scene, 'army_deploy_flash', buildDeployFlashMesh());
    this.meshes.blueSpark = registerRuntimeMesh(this.Mini, this.scene, 'army_blue_spark', buildTeamSparkMesh('blue'));
    this.meshes.redSpark = registerRuntimeMesh(this.Mini, this.scene, 'army_red_spark', buildTeamSparkMesh('red'));
    this.meshes.slash = registerRuntimeMesh(this.Mini, this.scene, 'army_slash', buildSlashMesh());
    this.meshes.dustCloud = registerRuntimeMesh(this.Mini, this.scene, 'army_dust_cloud', buildDustCloudMesh());
    this.meshes.frontlineMarker = registerRuntimeMesh(this.Mini, this.scene, 'army_frontline_marker', buildFrontlineMarkerMesh());

    this._debugOutlines = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
    if (this._debugOutlines) {
      this.meshes.debugOutlines = registerRuntimeMesh(this.Mini, this.scene, 'army_debug_outlines', buildDebugOutlinesMesh());
    }

    this.meshes.units = {} as Record<string, any>;
    for (const card of CARDS) {
      this.meshes.units[`blue_${card.id}`] = registerRuntimeMesh(this.Mini, this.scene, `unit_blue_${card.id}`,
        buildUnitMesh(card.id, card.blueBody, card.blueHat, card.skin));
      this.meshes.units[`red_${card.id}`] = registerRuntimeMesh(this.Mini, this.scene, `unit_red_${card.id}`,
        buildUnitMesh(card.id, card.redBody, card.redHat, card.skin));
    }

    const all = [this.materials.world, this.materials.unit, this.materials.vfx,
      this.meshes.ground, this.meshes.terrainDetails, this.meshes.blueWall, this.meshes.redWall,
      this.meshes.tree, this.meshes.bush, this.meshes.impact, this.meshes.fire,
      this.meshes.projectile, this.meshes.deployFlash,
      this.meshes.blueSpark, this.meshes.redSpark, this.meshes.slash, this.meshes.dustCloud,
      this.meshes.frontlineMarker, ...Object.values(this.meshes.units as Record<string, any>)];
    if (all.some((r: any) => r.rebuildRequired)) {
      this.Mini.scenes.rebuildRendererResources?.(this.scene);
    }
    this.Mini.scenes.resetRuntime?.(this.scene);

    this._createLighting();
    this._createCamera();
    this._spawnEnvironment();
    this._createVFXPools();
    this._createDeployPreview();
    this._installInput();
    await this._loadGlbAssets();
    this._updateHud();

    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('bench')) {
      (window as any).__ar = this;
    }

    if (this.ui.statusEl) this.ui.statusEl.textContent = '3...';
  }

  private async _loadGlbAssets() {
    const useGlb = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('glb') !== '0'
      : true;
    if (!useGlb) { console.log('[AR] GLB disabled via ?glb=0'); return; }

    try {
      const r = await loadAssetFromUrl('/assets/duckling_swarm.glb', 'duckling_glb') as any;
      if (!r?.ok) { console.warn('[AR] Duckling GLB load failed:', r?.error); return; }

      const inst = this.Mini.scenes.instantiate(this.scene, r.stubScene, {
        position: [0, -1000, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1],
      }) as any;
      if (!inst?.ok) { console.warn('[AR] Duckling instantiate failed'); return; }
      this.Mini.scenes.rebuildRendererResources?.(this.scene);

      const found = this._findMeshRendererEntity(inst.root_entity_id >>> 0);
      if (!found) { console.warn('[AR] No MeshRenderer found in duckling GLB subtree'); return; }
      const mr = this.Mini.ecs.readComponent(this.scene, found, this.Mini.Components.MeshRenderer) as { mesh?: number; material?: number } | null;
      if (!mr || !mr.mesh) { console.warn('[AR] MeshRenderer mesh hash is 0'); return; }
      this.glbMeshes.duckling = { meshHash: mr.mesh >>> 0, materialHash: (mr.material ?? 0) >>> 0 };
      console.log('[AR] Duckling GLB loaded:', this.glbMeshes.duckling);

      const matBlue = ensureRuntimeMaterial(this.Mini, this.scene, 'duckling_blue_material', {
        baseColor: [0.47, 0.67, 1.0, 1.0], roughness: 0.7, metallic: 0.0,
      });
      const matRed = ensureRuntimeMaterial(this.Mini, this.scene, 'duckling_red_material', {
        baseColor: [1.0, 0.30, 0.30, 1.0], roughness: 0.7, metallic: 0.0,
      });
      this.teamMaterials.duckling_blue = matBlue.hash;
      this.teamMaterials.duckling_red = matRed.hash;
      if (matBlue.rebuildRequired || matRed.rebuildRequired) {
        this.Mini.scenes.rebuildRendererResources?.(this.scene);
      }
      console.log('[AR] Duckling team materials:', this.teamMaterials);
    } catch (e) {
      console.warn('[AR] GLB load exception:', e);
    }
  }

  private _findMeshRendererEntity(rootId: number): number | null {
    const NULL = 0xffffffff;
    const stack = [rootId >>> 0];
    const seen = new Set<number>();
    while (stack.length) {
      const eid = stack.pop()!;
      if (eid === NULL || seen.has(eid)) continue;
      seen.add(eid);
      const mr = this.Mini.ecs.readComponent(this.scene, eid, this.Mini.Components.MeshRenderer) as { mesh?: number } | null;
      if (mr && mr.mesh) return eid;
      const h = this.Mini.ecs.readComponent(this.scene, eid, this.Mini.Components.Hierarchy) as { first_child?: number; next_sibling?: number } | null;
      let child = h?.first_child ?? NULL;
      while (child !== NULL && child !== undefined) {
        stack.push(child >>> 0);
        const ch = this.Mini.ecs.readComponent(this.scene, child, this.Mini.Components.Hierarchy) as { next_sibling?: number } | null;
        child = ch?.next_sibling ?? NULL;
      }
    }
    return null;
  }

  private _createLighting() {
    const sun = this.Mini.ecs.createEntity(this.scene);
    this.Mini.ecs.writeComponent(this.scene, sun, this.Mini.Components.DirectionalLight,
      { direction: LIGHTING.sunDirection, illuminance: LIGHTING.illuminance });
    this.Mini.ecs.writeComponent(this.scene, sun, this.Mini.Components.DirectionalLightSettings,
      { sun_color: LIGHTING.sunColor, ambient_intensity: LIGHTING.ambientIntensity });
    this.Mini.ecs.writeComponent(this.scene, sun, this.Mini.Components.EnvironmentSettings,
      { sky_cubemap_name_hash: this.Mini.runtime.sid(LIGHTING.skyCubemapName) });
    const post = this.Mini.ecs.createEntity(this.scene);
    this.Mini.ecs.writeComponent(this.scene, post, this.Mini.Components.PostProcessSettings, LIGHTING.postProcess);
  }

  private _createCamera() {
    const eid = this.Mini.ecs.createEntity(this.scene);
    this.Mini.ecs.writeComponent(this.scene, eid, this.Mini.Components.Transform, {
      position: CAMERA_POSITION,
      rotation: quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH),
      scale: { x: 1, y: 1, z: 1 },
    });
    this.Mini.ecs.writeComponent(this.scene, eid, this.Mini.Components.Camera,
      { fov: CAMERA_FOV, near: 0.1, far: 500 });
    this.Mini.ecs.addComponent(this.scene, eid, this.Mini.Components.MainCamera, {});
    this.cameraEntityId = eid;
  }

  private _setCameraTransform(position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number; w: number }) {
    this.Mini.ecs.writeComponent(this.scene, this.cameraEntityId, this.Mini.Components.Transform, {
      position,
      rotation,
      scale: { x: 1, y: 1, z: 1 },
    });
  }

  private _spawnEnvironment() {
    const mh = this.materials.world.hash;
    const spawn = (name: string, mesh: any, pos?: any, rot?: any, sc?: any) => {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name, meshHash: mesh.hash, materialHash: mh,
        position: pos || { x: 0, y: 0, z: 0 },
        rotation: rot || quatFromYawPitch(0, 0),
        scale: sc || { x: 1, y: 1, z: 1 },
      });
      return e;
    };
    spawn('Ground', this.meshes.ground);
    spawn('TerrainDetails', this.meshes.terrainDetails);
    if (this._debugOutlines && this.meshes.debugOutlines) {
      spawn('DebugOutlines', this.meshes.debugOutlines);
    }
    this._blueWallEntity = spawn('BlueWall', this.meshes.blueWall);
    this._redWallEntity = spawn('RedWall', this.meshes.redWall);
    for (const [x, z, s] of [[-36,22,0.8],[-38,-20,0.7],[36,22,0.75],[38,-20,0.8],[-36,0,0.6],[36,0,0.55],[-20,28,0.5],[20,-28,0.45],[-38,10,0.5],[38,-10,0.5]] as [number,number,number][])
      spawn('Tree', this.meshes.tree, { x, y: 0, z }, quatFromYawPitch(x*0.3, 0), { x: s, y: s, z: s });
    for (const [x, z, s] of [[-32,15,0.5],[32,-15,0.45],[-32,-15,0.4],[32,15,0.45],[-20,24,0.4],[20,-24,0.4]] as [number,number,number][])
      spawn('Bush', this.meshes.bush, { x, y: 0, z }, quatFromYawPitch(z*0.2, 0), { x: s, y: s, z: s });
  }

  private _createDeployPreview() {
    const b = createMeshBuilder();
    appendCylinder(b, { center: { x: 0, y: 0, z: 0 }, radiusTop: 3.5, radiusBottom: 3.5, height: 0.05, radialSegments: 24, color: packColor(80, 170, 255) });
    appendCylinder(b, { center: { x: 0, y: 0.02, z: 0 }, radiusTop: 3.0, radiusBottom: 3.0, height: 0.05, radialSegments: 24, color: packColor(60, 140, 240) });
    appendCylinder(b, { center: { x: 0, y: 0.04, z: 0 }, radiusTop: 0.4, radiusBottom: 0.4, height: 0.06, radialSegments: 8, color: packColor(200, 230, 255) });
    const mesh = registerRuntimeMesh(this.Mini, this.scene, 'army_deploy_preview', finalizeMesh(b));

    const bx = createMeshBuilder();
    appendBox(bx, { center: { x: 0, y: 0.05, z: 0 }, size: { x: 5, y: 0.1, z: 0.5 }, color: packColor(220, 50, 50) });
    appendBox(bx, { center: { x: 0, y: 0.05, z: 0 }, size: { x: 0.5, y: 0.1, z: 5 }, color: packColor(220, 50, 50) });
    const invalidMesh = registerRuntimeMesh(this.Mini, this.scene, 'army_deploy_invalid', finalizeMesh(bx));

    const zoneWidth = Math.abs(BLUE_WALL_X) + 2;
    const zoneCenterX = (BLUE_WALL_X + 2 + 0) / 2;
    const bz = createMeshBuilder();
    appendBox(bz, { center: { x: zoneCenterX, y: 0.03, z: 0 }, size: { x: zoneWidth, y: 0.02, z: 38 }, color: packColor(50, 110, 210) });
    const zoneMesh = registerRuntimeMesh(this.Mini, this.scene, 'army_deploy_zone', finalizeMesh(bz));

    this.Mini.scenes.rebuildRendererResources?.(this.scene);

    const vh = this.materials.vfx.hash;
    this._deployPreviewEntity = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'DeployPreview', meshHash: mesh.hash, materialHash: vh,
      position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
    });
    this._deployInvalidEntity = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'DeployInvalid', meshHash: invalidMesh.hash, materialHash: vh,
      position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0.785, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
    });
    this._deployZoneEntity = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'DeployZone', meshHash: zoneMesh.hash, materialHash: vh,
      position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
    });
  }

  private _createVFXPools() {
    const vh = this.materials.vfx.hash;
    for (let i = 0; i < 80; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Impact_${i}`, meshHash: this.meshes.impact.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.impactPool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0 });
    }
    for (let i = 0; i < 16; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `DeployFlash_${i}`, meshHash: this.meshes.deployFlash.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.deployFlashPool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0 });
    }
    for (let i = 0; i < 50; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Proj_${i}`, meshHash: this.meshes.projectile.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.projPool.push({ transformPtr: e.transformPtr, active: false, life: 0, maxLife: 0.5, sx: 0, sz: 0, tx: 0, tz: 0 });
    }
    for (let i = 0; i < 20; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Fire_${i}`, meshHash: this.meshes.fire.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.firePool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0 });
    }
    // Team-colored spark pools
    for (let i = 0; i < 40; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `BlueSpark_${i}`, meshHash: this.meshes.blueSpark.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.blueSparkPool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0 });
    }
    for (let i = 0; i < 40; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `RedSpark_${i}`, meshHash: this.meshes.redSpark.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.redSparkPool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0 });
    }
    // Slash VFX pool
    for (let i = 0; i < 24; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Slash_${i}`, meshHash: this.meshes.slash.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.slashPool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0, yaw: 0 });
    }
    // Dust cloud pool
    for (let i = 0; i < 16; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Dust_${i}`, meshHash: this.meshes.dustCloud.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.dustPool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0, drift: 0 });
    }
    // Frontline markers (one per lane)
    for (const lane of LANES) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Frontline_${lane.id}`, meshHash: this.meshes.frontlineMarker.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.frontlineSlots.push({ transformPtr: e.transformPtr, laneId: lane.id });
    }
  }

  private _spawnDeployFlash(x: number, z: number) {
    const slot = this.deployFlashPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true; slot.life = 0.8; slot.x = x; slot.z = z;
  }

  private _spawnImpactVFX(x: number, z: number, big: boolean) {
    const slot = this.impactPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true; slot.life = 0.5; slot.x = x; slot.z = z; slot.big = big;
  }

  private _spawnFireVFX(x: number, z: number) {
    const slot = this.firePool.find(s => !s.active);
    if (!slot) return;
    slot.active = true; slot.life = 1.5; slot.x = x; slot.z = z;
  }

  private _spawnProjectileVFX(sx: number, sz: number, tx: number, tz: number) {
    const slot = this.projPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true; slot.life = 0.5; slot.maxLife = 0.5;
    slot.sx = sx; slot.sz = sz; slot.tx = tx; slot.tz = tz;
  }

  private _spawnTeamSpark(x: number, z: number, team: string) {
    const pool = team === 'blue' ? this.blueSparkPool : this.redSparkPool;
    const slot = pool.find(s => !s.active);
    if (!slot) return;
    slot.active = true; slot.life = 0.35; slot.x = x; slot.z = z;
  }

  private _spawnSlashVFX(x: number, z: number, yaw: number) {
    const slot = this.slashPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true; slot.life = 0.3; slot.x = x; slot.z = z; slot.yaw = yaw;
  }

  private _spawnDustCloud(x: number, z: number) {
    const slot = this.dustPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true; slot.life = 2.0; slot.x = x; slot.z = z;
    slot.drift = (Math.random() - 0.5) * 0.4;
  }

  private _updateVFX(dt: number) {
    for (const slot of this.impactPool) {
      if (!slot.active) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }
      const t = slot.life / 0.5;
      const s = (slot.big ? 1.5 : 0.8) * t;
      const y = 0.2 + (1 - t) * 1.0;
      updateTransform(slot.transformPtr, {
        position: { x: slot.x, y, z: slot.z },
        rotation: quatFromYawPitch(this.time * 3, 0),
        scale: { x: s, y: s * 0.8, z: s },
      });
    }
    for (const slot of this.projPool) {
      if (!slot.active) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }
      const t = 1 - slot.life / slot.maxLife;
      const x = slot.sx + (slot.tx - slot.sx) * t;
      const z = slot.sz + (slot.tz - slot.sz) * t;
      const y = 1.5 + Math.sin(t * Math.PI) * 3;
      updateTransform(slot.transformPtr, {
        position: { x, y, z },
        rotation: quatFromYawPitch(t * 6, 0),
        scale: { x: 1, y: 1, z: 1 },
      });
    }
    for (const slot of this.deployFlashPool) {
      if (!slot.active) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }
      const t = slot.life / 0.8;
      const expand = 0.8 + (1 - t) * 1.2;
      const fadeScale = t > 0.15 ? 1.0 : t / 0.15;
      updateTransform(slot.transformPtr, {
        position: { x: slot.x, y: 0.02, z: slot.z },
        rotation: quatFromYawPitch(0, 0),
        scale: { x: expand * fadeScale, y: fadeScale * 0.5, z: expand * fadeScale },
      });
    }
    for (const slot of this.firePool) {
      if (!slot.active) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }
      const t = slot.life / 1.5;
      const flicker = 0.85 + Math.sin(this.time * 12 + slot.x * 3) * 0.15;
      const s = (0.3 + (1 - t) * 0.2) * flicker;
      const y = 0.0 + (1 - t) * 0.5;
      updateTransform(slot.transformPtr, {
        position: { x: slot.x + Math.sin(this.time * 8) * 0.1, y, z: slot.z + Math.cos(this.time * 6) * 0.1 },
        rotation: quatFromYawPitch(this.time * 2 + slot.x, 0),
        scale: { x: s, y: s * (0.8 + t * 0.4), z: s },
      });
    }

    // Team-colored sparks
    for (const pool of [this.blueSparkPool, this.redSparkPool]) {
      for (const slot of pool) {
        if (!slot.active) continue;
        slot.life -= dt;
        if (slot.life <= 0) {
          slot.active = false;
          updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
          continue;
        }
        const t = slot.life / 0.35;
        const s = 0.6 * t;
        const y = 0.3 + (1 - t) * 1.5;
        updateTransform(slot.transformPtr, {
          position: { x: slot.x, y, z: slot.z },
          rotation: quatFromYawPitch(this.time * 5 + slot.x, 0),
          scale: { x: s, y: s * 0.7, z: s },
        });
      }
    }

    // Slash VFX
    for (const slot of this.slashPool) {
      if (!slot.active) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }
      const t = slot.life / 0.3;
      const expand = 0.5 + (1 - t) * 0.5;
      const fadeScale = t > 0.2 ? 1.0 : t / 0.2;
      updateTransform(slot.transformPtr, {
        position: { x: slot.x, y: 0.6 + (1 - t) * 0.5, z: slot.z },
        rotation: quatFromYawPitch(slot.yaw + (1 - t) * 1.2, 0),
        scale: { x: expand * fadeScale, y: fadeScale * 0.4, z: expand * fadeScale },
      });
    }

    // Dust clouds
    for (const slot of this.dustPool) {
      if (!slot.active) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }
      const t = slot.life / 2.0;
      const fadeIn = Math.min(1, (1 - t) * 5); // quick fade in
      const fadeOut = t < 0.3 ? t / 0.3 : 1.0;
      const alpha = fadeIn * fadeOut;
      const s = (0.3 + (1 - t) * 0.15) * alpha;
      const rise = (1 - t) * 1.5;
      updateTransform(slot.transformPtr, {
        position: { x: slot.x + slot.drift * (1 - t), y: 0.2 + rise, z: slot.z + slot.drift * 0.5 * (1 - t) },
        rotation: quatFromYawPitch(this.time * 0.3 + slot.x, 0),
        scale: { x: s, y: s * 0.6, z: s },
      });
    }

    for (const imp of this.state.impacts) {
      if (imp._vfxSpawned) continue;
      imp._vfxSpawned = true;
      // Big wall hits still use the explosive impact VFX
      if (imp.big) {
        this._spawnImpactVFX(imp.x, imp.z, true);
      }
      // Always spawn team-colored spark
      if (imp.team) {
        this._spawnTeamSpark(imp.x, imp.z, imp.team);
      }
      // Melee/breaker attacks get slash VFX
      if (imp.role && imp.role !== 'ranged') {
        this._spawnSlashVFX(imp.x, imp.z, Math.random() * Math.PI * 2);
      }
      // Non-big, non-team impacts still get the neutral VFX
      if (!imp.big && !imp.team) {
        this._spawnImpactVFX(imp.x, imp.z, false);
      }
    }
    for (const proj of this.state.projectiles) {
      if (proj._vfxSpawned) continue;
      proj._vfxSpawned = true;
      this._spawnProjectileVFX(proj.sx, proj.sz, proj.tx, proj.tz);
    }
  }

  private _updateFrontlines() {
    for (const slot of this.frontlineSlots) {
      const lane = LANES.find(l => l.id === slot.laneId);
      if (!lane) continue;
      const blueInLane = this.state.blueUnits.filter(u => u.laneId === slot.laneId && u.spawnTime <= 0);
      const redInLane = this.state.redUnits.filter(u => u.laneId === slot.laneId && u.spawnTime <= 0);

      if (blueInLane.length === 0 || redInLane.length === 0) {
        // No clash in this lane—hide marker
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }

      // Compute average X of each side's frontline units in this lane
      let blueMaxX = -Infinity;
      for (const u of blueInLane) if (u.x > blueMaxX) blueMaxX = u.x;
      let redMinX = Infinity;
      for (const u of redInLane) if (u.x < redMinX) redMinX = u.x;

      const clashX = (blueMaxX + redMinX) * 0.5;
      // Intensity based on how close the forces are
      const gap = Math.abs(blueMaxX - redMinX);
      const intensity = Math.max(0.3, 1 - gap / 20);
      const pulse = 0.9 + Math.sin(this.time * 4 + lane.z) * 0.1;
      const s = intensity * pulse;

      updateTransform(slot.transformPtr, {
        position: { x: clashX, y: 0.05, z: lane.z },
        rotation: quatFromYawPitch(0, 0),
        scale: { x: s * 0.8, y: 0.5 * s, z: s },
      });
    }
  }

  private _screenToWorld(clientX: number, clientY: number): { worldX: number; worldZ: number } {
    const canvasEl = document.getElementById('canvas') as HTMLCanvasElement | null;
    if (!canvasEl) return { worldX: 0, worldZ: 0 };
    const rect = canvasEl.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

    const camY = CAMERA_POSITION.y;
    const camZ = CAMERA_POSITION.z;
    const pitch = CAMERA_PITCH;
    const fov = CAMERA_FOV;
    const aspect = rect.width / rect.height;
    const halfFovY = fov / 2;
    const halfFovX = Math.atan(Math.tan(halfFovY) * aspect);

    const rayDirCamX = Math.tan(halfFovX) * ndcX;
    const rayDirCamY = Math.tan(halfFovY) * ndcY;
    const rayDirCamZ = -1;

    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const rayDirX = rayDirCamX;
    const rayDirY = rayDirCamY * cosPitch - rayDirCamZ * sinPitch;
    const rayDirZ = rayDirCamY * sinPitch + rayDirCamZ * cosPitch;

    if (Math.abs(rayDirY) < 0.0001) return { worldX: 0, worldZ: 0 };
    const t = -camY / rayDirY;
    if (t < 0) return { worldX: 0, worldZ: 0 };

    return { worldX: t * rayDirX, worldZ: camZ + t * rayDirZ };
  }

  private _isValidDeployPos(worldX: number, worldZ: number): boolean {
    return worldX <= 0 && worldX > BLUE_WALL_X + 2 && Math.abs(worldZ) < 20;
  }

  private _installInput() {
    const ghost = document.getElementById('drag-ghost');
    const ghostLabel = ghost?.querySelector('.ghost-label') as HTMLElement | null;
    const deployLine = document.getElementById('deploy-line');
    let dragging: { cardId: string; el: HTMLElement } | null = null;

    const hideAllPreviews = () => {
      const hidden = { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } };
      if (this._deployPreviewEntity) updateTransform(this._deployPreviewEntity.transformPtr, hidden);
      if (this._deployInvalidEntity) updateTransform(this._deployInvalidEntity.transformPtr, hidden);
      if (this._deployZoneEntity) updateTransform(this._deployZoneEntity.transformPtr, hidden);
    };

    const startDrag = (cardId: string, el: HTMLElement, x: number, y: number) => {
      if (!this.started || this.state.phase === 'result') return;
      const card = getCard(cardId);
      if (card.cost > this.state.elixir + 0.01) return;
      dragging = { cardId, el };
      el.classList.add('dragging');
      if (ghost) { ghost.style.display = 'block'; ghost.style.left = (x-28)+'px'; ghost.style.top = (y-55)+'px'; }
      if (ghostLabel) ghostLabel.textContent = card.name + ' ×' + card.count;
      if (deployLine) deployLine.classList.add('active');
      this.state.statusText = `DRAG ${card.name.toUpperCase()} ONTO BLUE ZONE`;
    };

    const moveDrag = (x: number, y: number) => {
      if (!dragging) return;
      const wp = this._screenToWorld(x, y);
      const valid = this._isValidDeployPos(wp.worldX, wp.worldZ);
      if (ghost) {
        ghost.style.left = (x-28)+'px';
        ghost.style.top = (y-55)+'px';
        ghost.className = valid ? '' : 'invalid';
        ghost.style.display = 'block';
      }
      if (valid) {
        const cx = Math.min(Math.max(wp.worldX, BLUE_WALL_X + 4), 0);
        const cz = Math.min(Math.max(wp.worldZ, -18), 18);
        if (this._deployPreviewEntity) {
          updateTransform(this._deployPreviewEntity.transformPtr, {
            position: { x: cx, y: 0.12, z: cz },
            rotation: quatFromYawPitch(this.time * 0.5, 0),
            scale: { x: 1.2, y: 0.3, z: 1.2 },
          });
        }
        if (this._deployInvalidEntity) {
          updateTransform(this._deployInvalidEntity.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        }
      } else {
        if (this._deployInvalidEntity) {
          updateTransform(this._deployInvalidEntity.transformPtr, {
            position: { x: wp.worldX, y: 0.2, z: wp.worldZ },
            rotation: quatFromYawPitch(0.785, 0),
            scale: { x: 1, y: 1, z: 1 },
          });
        }
        if (this._deployPreviewEntity) {
          updateTransform(this._deployPreviewEntity.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        }
      }
    };

    const endDrag = (x: number, y: number) => {
      if (!dragging) return;
      dragging.el.classList.remove('dragging');
      if (ghost) ghost.style.display = 'none';
      if (deployLine) deployLine.classList.remove('active');
      hideAllPreviews();
      const wp = this._screenToWorld(x, y);
      if (this._isValidDeployPos(wp.worldX, wp.worldZ)) {
        const cx = Math.min(Math.max(wp.worldX, BLUE_WALL_X + 4), 0);
        const cz = Math.min(Math.max(wp.worldZ, -18), 18);
        if (deployBlue(this.state, cx, cz)) {
          this.state.statusText = `${getCard(dragging.cardId).name.toUpperCase()} DEPLOYED!`;
          this._spawnDeployFlash(cx, cz);
        }
      } else {
        this.state.statusText = "CAN'T DEPLOY THERE!";
      }
      dragging = null;
      this._updateHud();
    };

    const cancelDrag = () => {
      if (!dragging) return;
      dragging.el.classList.remove('dragging');
      if (ghost) ghost.style.display = 'none';
      if (deployLine) deployLine.classList.remove('active');
      hideAllPreviews();
      dragging = null;
    };

    document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup', e => { if (dragging) endDrag(e.clientX, e.clientY); });
    document.addEventListener('touchmove', e => { if (!dragging) return; e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.addEventListener('touchend', e => { if (!dragging) return; endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
    document.addEventListener('touchcancel', cancelDrag);
    this._startDrag = startDrag;
  }

  private _getOrCreateUnitEntity(unit: UnitState): { entityId: number; transformPtr: number; glb: boolean } | null {
    if (this.unitEntities.has(unit.id)) return this.unitEntities.get(unit.id)!;

    let meshHash: number, materialHash: number, isGlb = false;
    if (unit.cardId === 'duckling' && this.glbMeshes?.duckling) {
      meshHash = this.glbMeshes.duckling.meshHash;
      materialHash = this.teamMaterials?.[`duckling_${unit.team}`] ?? this.glbMeshes.duckling.materialHash;
      isGlb = true;
    } else {
      const mesh = (this.meshes.units as Record<string, any>)[`${unit.team}_${unit.cardId}`];
      if (!mesh) return null;
      meshHash = mesh.hash;
      materialHash = this.materials.unit.hash;
    }

    const e = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: `U${unit.id}`, meshHash, materialHash,
      position: { x: unit.x, y: 0, z: unit.z }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
    });

    const info = { entityId: e.entityId, transformPtr: e.transformPtr, glb: isGlb };
    this.unitEntities.set(unit.id, info);
    return info;
  }

  private _syncUnits() {
    const allUnits = [...this.state.blueUnits, ...this.state.redUnits];
    const liveIds = new Set(allUnits.map(u => u.id));

    for (const [id, info] of this.unitEntities) {
      if (!liveIds.has(id) && !this.state.deadUnits.find(d => d.id === id)) {
        updateTransform(info.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        this.unitEntities.delete(id);
      }
    }

    for (const u of allUnits) {
      const info = this._getOrCreateUnitEntity(u);
      if (!info) continue;

      let scaleX = 1, scaleY = 1, scaleZ = 1;
      let posY = 0;

      if (u.spawnTime > 0) {
        const t = 1 - (u.spawnTime / 0.4);
        const c = (2 * Math.PI) / 3;
        const elastic = t === 0 ? 0 : t >= 1 ? 1
          : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
        const s = Math.max(0.01, elastic);
        scaleX = s; scaleY = s; scaleZ = s;
        posY = 2 * (1 - t);
      } else {
        const striking = u.atkFlash > 0.1;
        const hurt = u.hitFlash > 0.1;

        // ═══ PER-ROLE IDLE ANIMATION ═══
        if (!striking && !hurt) {
          switch (u.role) {
            case 'breaker':
              // Heavy hop-stomp pattern — up-pause-down rhythm
              { const hop = Math.abs(Math.sin(this.time * 2.5 + u.bob));
                posY = hop * hop * 0.35; // squared = sharp hop, slow top
                // Squash at bottom of hop
                if (hop < 0.3) { scaleY *= 0.92; scaleX *= 1.04; scaleZ *= 1.04; }
              }
              break;
            case 'rush':
              // Jittery, fast bob + slight z-wobble feel
              posY = Math.sin(this.time * 10 + u.bob) * 0.12 + Math.abs(Math.sin(this.time * 14 + u.bob * 2)) * 0.06;
              break;
            case 'ranged':
              // Gentle sway
              posY = Math.sin(this.time * 5 + u.bob) * 0.14;
              break;
            default: // melee
              // Steady march bob
              posY = Math.sin(this.time * 6 + u.bob) * 0.18;
              break;
          }
        }

        // ═══ PER-ROLE ATTACK ANIMATION ═══
        if (striking) {
          const atk = u.atkFlash;
          switch (u.role) {
            case 'breaker':
              // Ground slam: squash down then expand wide
              scaleY = 1 - atk * 0.25;
              scaleX = 1 + atk * 0.20;
              scaleZ = 1 + atk * 0.20;
              posY = -0.1 * atk; // pushes down into ground
              break;
            case 'rush':
              // Quick lunge forward: stretch in X
              scaleX = 1 + atk * 0.25;
              scaleY = 1 - atk * 0.08;
              scaleZ = 1 - atk * 0.08;
              posY = 0.08 * atk;
              break;
            case 'ranged':
              // Recoil backward: compress then expand
              scaleX = 1 - atk * 0.15;
              scaleY = 1 + atk * 0.12;
              scaleZ = 1 - atk * 0.08;
              posY = 0.1 * atk;
              break;
            default: // melee
              // Classic overhead swing: stretch up
              scaleY = 1 + atk * 0.22;
              scaleX = 1 - atk * 0.10;
              scaleZ = 1 - atk * 0.10;
              posY = 0.18 * atk;
              break;
          }
        }

        // ═══ HURT REACTION (universal but role-scaled) ═══
        if (hurt) {
          const hitScale = u.role === 'breaker' ? 0.12 : u.role === 'rush' ? 0.35 : 0.25;
          const boost = 1 + u.hitFlash * hitScale;
          scaleX *= boost; scaleY *= boost; scaleZ *= boost;
        }
      }

      let yaw = u.team === 'blue' ? 0 : Math.PI;
      if (u.spawnTime <= 0) {
        const enemies = u.team === 'blue' ? this.state.redUnits : this.state.blueUnits;
        let minD = Infinity, cdx = 0, cdz = 0;
        for (const e of enemies) { const d = Math.hypot(e.x-u.x, e.z-u.z); if (d < minD) { minD = d; cdx = e.x-u.x; cdz = e.z-u.z; } }
        if (minD < 25) yaw = Math.atan2(-cdx, cdz);
      }

      updateTransform(info.transformPtr, {
        position: { x: u.x, y: posY, z: u.z },
        rotation: quatFromYawPitch(yaw, 0),
        scale: { x: scaleX, y: scaleY, z: scaleZ },
      });
    }

    for (const d of this.state.deadUnits) {
      const info = this.unitEntities.get(d.id);
      if (!info) continue;
      const progress = 1 - d.timer / 0.5;
      let dSx: number, dSy: number, dSz: number, dY: number, rotSpin: number;

      if (progress < 0.2) {
        const gaspT = progress / 0.2;
        dSy = 1.0 + gaspT * 0.3;
        dSx = 1.0 - gaspT * 0.1;
        dSz = dSx;
        dY = 0.2 * gaspT;
        rotSpin = 0;
      } else {
        const fallT = (progress - 0.2) / 0.8;
        const shrink = Math.max(0.01, 1.3 * (1 - fallT));
        dSx = shrink; dSy = shrink; dSz = shrink;
        dY = 0.2 - fallT * 1.2;
        rotSpin = this.time * 15;
      }

      updateTransform(info.transformPtr, {
        position: { x: d.x, y: dY, z: d.z },
        rotation: quatFromYawPitch(rotSpin, 0),
        scale: { x: dSx, y: dSy, z: dSz },
      });
      if (d.timer <= 0.05) {
        updateTransform(info.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        this.unitEntities.delete(d.id);
      }
    }
  }

  private _updateWalls() {
    if (this.breachPhase) return;
    const s = this.state;
    const updateWall = (entity: any, hp: number, leanDir: number) => {
      if (!entity) return;
      const ratio = Math.max(0, hp) / 100;
      const damage = 1 - ratio;
      const sinkY = -damage * 3;
      const lean = leanDir * damage * 0.15;
      const shake = hp < 30 && hp > 0 ? Math.sin(this.time * 15) * 0.02 * damage : 0;
      const scaleY = hp <= 0 ? 0.3 : 1 - damage * 0.4;
      updateTransform(entity.transformPtr, {
        position: { x: 0, y: sinkY, z: 0 },
        rotation: quatFromYawPitch(shake, lean),
        scale: { x: 1, y: scaleY, z: 1 },
      });
    };
    updateWall(this._blueWallEntity, s.blueHP, 1);
    updateWall(this._redWallEntity, s.redHP, -1);
  }

  private _updateHud() {
    const s = this.state;
    if (this.ui.timerEl) {
      this.ui.timerEl.textContent = this._fmtTime(s.time);
      if (s.phase === 'result' && s.time <= 0) {
        this.ui.timerEl.textContent = '0:00';
        this.ui.timerEl.style.color = '#888';
      } else if (s.isOvertime) {
        this.ui.timerEl.style.color = '#ff6060';
      }
    }
    if (this.ui.blueHpEl) this.ui.blueHpEl.textContent = String(Math.max(0, Math.round(s.blueHP)));
    if (this.ui.redHpEl) this.ui.redHpEl.textContent = String(Math.max(0, Math.round(s.redHP)));
    if (this.ui.blueHpBar) this.ui.blueHpBar.style.width = `${Math.max(0, s.blueHP)}%`;
    if (this.ui.redHpBar) this.ui.redHpBar.style.width = `${Math.max(0, s.redHP)}%`;
    if (this.ui.statusEl && this.started) {
      if (s.phase === 'result') {
        this.ui.statusEl.textContent = s.statusText;
      } else if (s.isOvertime) {
        this.ui.statusEl.textContent = '⚡ OVERTIME — 2x ELIXIR!';
      } else {
        this.ui.statusEl.textContent = s.statusText;
      }
    }
    if (this.ui.elixirValEl) this.ui.elixirValEl.textContent = String(Math.floor(s.elixir));
    this._updateElixirBar();
    if (this.ui.phaseEl) {
      if (s.phase === 'result') this.ui.phaseEl.textContent = s.isOvertime ? 'OVERTIME' : '';
      else if (s.isOvertime) this.ui.phaseEl.textContent = 'OVERTIME';
      else this.ui.phaseEl.textContent = '';
    }
    if (s.phase === 'result' && !this._resultShown && this.breachPhase && this.breachPhase.timer >= this.breachPhase.duration) {
      this._resultShown = true;
      this._showResult();
    }
    this._rebuildCards();
  }

  private _updateElixirBar() {
    const barEl = document.getElementById('elixir-bar-seg');
    if (!barEl) return;
    let fill = barEl.querySelector('.fill') as HTMLElement | null;
    if (!fill) {
      barEl.innerHTML = '';
      fill = document.createElement('div');
      fill.className = 'fill';
      barEl.appendChild(fill);
    }
    const e = Math.max(0, Math.min(10, this.state.elixir));
    fill.style.width = `${e * 10}%`;
  }

  private _showResult() {
    const cdEl = document.getElementById('countdown-text');
    if (cdEl) { cdEl.classList.remove('visible'); cdEl.style.color = ''; cdEl.style.fontSize = ''; }
    const overlay = document.getElementById('result-overlay');
    const title = document.getElementById('result-title');
    const stars = document.getElementById('result-stars');
    const chest = document.getElementById('result-chest');
    const sub = document.getElementById('result-sub');
    const btn = document.getElementById('rematch-btn');
    if (!overlay || !title || !stars || !chest || !sub || !btn) return;
    const s = this.state;
    const isBreach = s.endReason === 'breach';
    const blueWallPct = Math.round(Math.max(0, s.blueHP));
    const redWallPct = Math.round(Math.max(0, s.redHP));

    if (s.winner === 'blue') {
      if (isBreach) {
        title.textContent = '⚔️ BREACH!';
        stars.textContent = blueWallPct >= 80 ? '⭐⭐⭐' : blueWallPct >= 40 ? '⭐⭐' : '⭐';
        chest.textContent = '🎁';
        sub.textContent = `Enemy wall destroyed! Your wall: ${blueWallPct}%`;
      } else {
        title.textContent = '⏱️ VICTORY!';
        stars.textContent = '⭐⭐';
        chest.textContent = '🎁';
        sub.textContent = `Time up! Your wall: ${blueWallPct}% — Enemy wall: ${redWallPct}%`;
      }
    } else if (s.winner === 'red') {
      if (isBreach) {
        title.textContent = '💀 BREACHED!';
        stars.textContent = '';
        chest.textContent = '';
        sub.textContent = `Your wall was destroyed! Enemy wall: ${redWallPct}%`;
      } else {
        title.textContent = '💀 DEFEAT';
        stars.textContent = '⭐';
        chest.textContent = '';
        sub.textContent = `Time up! Your wall: ${blueWallPct}% — Enemy wall: ${redWallPct}%`;
      }
    } else {
      title.textContent = '🤝 DRAW';
      stars.textContent = '⭐';
      chest.textContent = '';
      sub.textContent = isBreach
        ? `Both walls breached! ${blueWallPct}% vs ${redWallPct}%`
        : `Time up! Both walls at ${blueWallPct}%`;
    }
    overlay.classList.add('show');
    document.body.classList.add('result-active');
    btn.onclick = () => {
      overlay.classList.remove('show');
      document.body.classList.remove('result-active');
      this._resetMatch();
    };
  }

  private _resetMatch() {
    const newState = createMatchState();
    Object.assign(this.state, newState);
    for (const [, info] of this.unitEntities) {
      updateTransform(info.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
    }
    this.unitEntities.clear();
    this._resultShown = false;
    this.breachPhase = null;
    this.cameraShake = 0;
    this.countdown = 3.0;
    this.started = false;
    this._clashVfxTimer = 0;
    this._dustSpawnTimer = 0;
    if (this.ui.timerEl) this.ui.timerEl.style.color = '';
    this._setCameraTransform(CAMERA_POSITION, quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH));
    for (const wall of [this._blueWallEntity, this._redWallEntity]) {
      if (wall) {
        updateTransform(wall.transformPtr, {
          position: { x: 0, y: 0, z: 0 },
          rotation: quatFromYawPitch(0, 0),
          scale: { x: 1, y: 1, z: 1 },
        });
      }
    }
    // Clear all VFX pools
    const hidden = { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } };
    for (const pool of [
      this.impactPool, this.deployFlashPool, this.firePool,
      this.blueSparkPool, this.redSparkPool,
    ] as VfxSlot[][]) {
      for (const slot of pool) {
        if (slot.active) { slot.active = false; updateTransform(slot.transformPtr, hidden); }
      }
    }
    for (const slot of this.projPool) {
      if (slot.active) { slot.active = false; updateTransform(slot.transformPtr, hidden); }
    }
    for (const slot of this.slashPool) {
      if (slot.active) { slot.active = false; updateTransform(slot.transformPtr, hidden); }
    }
    for (const slot of this.dustPool) {
      if (slot.active) { slot.active = false; updateTransform(slot.transformPtr, hidden); }
    }
    for (const slot of this.frontlineSlots) {
      updateTransform(slot.transformPtr, hidden);
    }
  }

  private _drawCardPortrait(cvs: HTMLCanvasElement, card: ReturnType<typeof getCard>) {
    const c = cvs.getContext('2d');
    if (!c) return;
    const W = 80, H = 72;
    cvs.width = W; cvs.height = H;
    c.clearRect(0, 0, W, H);

    const [br, bg, bb] = card.blueBody.map(v => Math.floor(v * 255));
    const [sr, sg, sb] = card.skin.map(v => Math.floor(v * 255));
    const body = `rgb(${br},${bg},${bb})`;
    const bodyDark = `rgb(${Math.floor(br*0.7)},${Math.floor(bg*0.7)},${Math.floor(bb*0.7)})`;
    const skin = `rgb(${sr},${sg},${sb})`;
    const cx = W / 2, cy = H * 0.52;

    // Radial highlight behind character
    const glow = c.createRadialGradient(cx, cy - 4, 4, cx, cy - 4, 34);
    glow.addColorStop(0, 'rgba(255,255,255,0.18)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    switch (card.id) {
      case 'monkey': this._drawMonkeyPortrait(c, cx, cy, body, bodyDark, skin); break;
      case 'hamster': this._drawHamsterPortrait(c, cx, cy, body, bodyDark, skin); break;
      case 'frog': this._drawFrogPortrait(c, cx, cy, body, bodyDark, skin); break;
      case 'duckling': this._drawDucklingPortrait(c, cx, cy, body, bodyDark, skin); break;
      default: this._drawMonkeyPortrait(c, cx, cy, body, bodyDark, skin);
    }
  }

  private _drawMonkeyPortrait(c: CanvasRenderingContext2D, cx: number, cy: number, body: string, bodyDark: string, skin: string) {
    // Body
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy + 8, 18, 20, 0, 0, Math.PI * 2); c.fill();
    // Head
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy - 8, 16, 15, 0, 0, Math.PI * 2); c.fill();
    // Face
    c.fillStyle = skin;
    c.beginPath(); c.ellipse(cx, cy - 4, 10, 8, 0, 0, Math.PI * 2); c.fill();
    // Ears
    c.fillStyle = skin;
    c.beginPath(); c.arc(cx - 16, cy - 8, 6, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 16, cy - 8, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = bodyDark;
    c.beginPath(); c.arc(cx - 16, cy - 8, 4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 16, cy - 8, 4, 0, Math.PI * 2); c.fill();
    // Eyes
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(cx - 5, cy - 10, 4, 5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 5, cy - 10, 4, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.arc(cx - 4, cy - 9, 2.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 6, cy - 9, 2.5, 0, Math.PI * 2); c.fill();
    // Eye highlights
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(cx - 3, cy - 11, 1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 7, cy - 11, 1, 0, Math.PI * 2); c.fill();
    // Mouth
    c.strokeStyle = '#6a4030'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx + 1, cy - 2, 4, 0.2, Math.PI - 0.2); c.stroke();
    // Sword
    c.fillStyle = '#c0c0c0'; c.fillRect(cx + 14, cy - 2, 3, 22);
    c.fillStyle = '#ffd040'; c.fillRect(cx + 11, cy + 18, 9, 4);
    c.fillStyle = '#8B4513'; c.fillRect(cx + 13, cy + 22, 5, 8);
    // Cheeks
    c.fillStyle = 'rgba(255,140,110,0.3)';
    c.beginPath(); c.arc(cx - 8, cy - 3, 3.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 10, cy - 3, 3.5, 0, Math.PI * 2); c.fill();
  }

  private _drawHamsterPortrait(c: CanvasRenderingContext2D, cx: number, cy: number, body: string, bodyDark: string, skin: string) {
    // Round body
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy + 6, 20, 22, 0, 0, Math.PI * 2); c.fill();
    // Belly
    c.fillStyle = skin;
    c.beginPath(); c.ellipse(cx, cy + 10, 12, 14, 0, 0, Math.PI * 2); c.fill();
    // Head (overlapping body)
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy - 8, 17, 14, 0, 0, Math.PI * 2); c.fill();
    // Cheek pouches
    c.fillStyle = skin;
    c.beginPath(); c.ellipse(cx - 12, cy - 4, 8, 7, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 12, cy - 4, 8, 7, 0, 0, Math.PI * 2); c.fill();
    // Ears
    c.fillStyle = bodyDark;
    c.beginPath(); c.ellipse(cx - 12, cy - 20, 5, 6, -0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 12, cy - 20, 5, 6, 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,180,180,0.6)';
    c.beginPath(); c.ellipse(cx - 12, cy - 20, 3, 4, -0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 12, cy - 20, 3, 4, 0.3, 0, Math.PI * 2); c.fill();
    // Eyes
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(cx - 6, cy - 10, 4.5, 5.5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 6, cy - 10, 4.5, 5.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.arc(cx - 5, cy - 9, 3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 7, cy - 9, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(cx - 4, cy - 11, 1.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 8, cy - 11, 1.2, 0, Math.PI * 2); c.fill();
    // Nose
    c.fillStyle = '#e08080';
    c.beginPath(); c.ellipse(cx, cy - 4, 2.5, 2, 0, 0, Math.PI * 2); c.fill();
    // Acorn bomb held
    c.fillStyle = '#8B5E3C';
    c.beginPath(); c.arc(cx + 16, cy + 8, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a3a1e';
    c.fillRect(cx + 14, cy + 1, 4, 4);
    c.fillStyle = '#ffa020';
    c.beginPath(); c.moveTo(cx + 16, cy - 2); c.lineTo(cx + 14, cy + 2); c.lineTo(cx + 18, cy + 2); c.closePath(); c.fill();
  }

  private _drawFrogPortrait(c: CanvasRenderingContext2D, cx: number, cy: number, body: string, bodyDark: string, _skin: string) {
    // Wide squat body
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy + 8, 22, 18, 0, 0, Math.PI * 2); c.fill();
    // Head (wide, flat)
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy - 6, 20, 12, 0, 0, Math.PI * 2); c.fill();
    // Belly
    c.fillStyle = bodyDark;
    c.beginPath(); c.ellipse(cx, cy + 12, 15, 12, 0, 0, Math.PI * 2); c.fill();
    // Bug eyes (protruding)
    c.fillStyle = '#ffffdd';
    c.beginPath(); c.arc(cx - 12, cy - 16, 8, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 12, cy - 16, 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = body;
    c.beginPath(); c.arc(cx - 12, cy - 16, 6.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 12, cy - 16, 6.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.ellipse(cx - 12, cy - 16, 3.5, 4.5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 12, cy - 16, 3.5, 4.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(cx - 11, cy - 18, 1.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 13, cy - 18, 1.5, 0, Math.PI * 2); c.fill();
    // Wide mouth
    c.strokeStyle = '#2a5020'; c.lineWidth = 2;
    c.beginPath(); c.arc(cx, cy - 1, 12, 0.15, Math.PI - 0.15); c.stroke();
    // Shield
    c.fillStyle = '#808080';
    c.beginPath();
    c.moveTo(cx - 22, cy - 4); c.lineTo(cx - 22, cy + 16); c.quadraticCurveTo(cx - 18, cy + 24, cx - 14, cy + 16);
    c.lineTo(cx - 14, cy - 4); c.closePath(); c.fill();
    c.fillStyle = '#ffd040';
    c.beginPath(); c.arc(cx - 18, cy + 6, 3, 0, Math.PI * 2); c.fill();
    // War paint stripes
    c.strokeStyle = bodyDark; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - 5, cy + 2); c.lineTo(cx + 5, cy + 2); c.stroke();
    c.beginPath(); c.moveTo(cx - 4, cy + 6); c.lineTo(cx + 4, cy + 6); c.stroke();
  }

  private _drawDucklingPortrait(c: CanvasRenderingContext2D, cx: number, cy: number, body: string, _bodyDark: string, _skin: string) {
    // Fluffy round body
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy + 6, 16, 18, 0, 0, Math.PI * 2); c.fill();
    // Wing nubs
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx - 16, cy + 2, 7, 10, 0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 16, cy + 2, 7, 10, -0.3, 0, Math.PI * 2); c.fill();
    // Head
    c.fillStyle = body;
    c.beginPath(); c.ellipse(cx, cy - 10, 13, 12, 0, 0, Math.PI * 2); c.fill();
    // Tuft/hair
    c.fillStyle = body;
    c.beginPath();
    c.moveTo(cx - 3, cy - 22); c.quadraticCurveTo(cx + 2, cy - 28, cx + 4, cy - 22);
    c.quadraticCurveTo(cx + 6, cy - 26, cx + 8, cy - 20);
    c.lineTo(cx - 3, cy - 18); c.closePath(); c.fill();
    // Eyes (big, cute)
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(cx - 5, cy - 12, 5, 6, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 5, cy - 12, 5, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.arc(cx - 4, cy - 11, 3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 6, cy - 11, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(cx - 3, cy - 13, 1.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 7, cy - 13, 1.2, 0, Math.PI * 2); c.fill();
    // Beak
    c.fillStyle = '#ff8c20';
    c.beginPath();
    c.moveTo(cx - 4, cy - 5); c.quadraticCurveTo(cx, cy + 2, cx + 4, cy - 5);
    c.closePath(); c.fill();
    // Feet
    c.fillStyle = '#ff8c20';
    c.beginPath(); c.ellipse(cx - 6, cy + 24, 6, 3, -0.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 6, cy + 24, 6, 3, 0.2, 0, Math.PI * 2); c.fill();
    // Group indicators (tiny duckling silhouettes behind)
    c.fillStyle = 'rgba(255,255,255,0.2)';
    c.beginPath(); c.arc(cx - 20, cy + 14, 5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 20, cy + 14, 5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx - 14, cy + 20, 4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 14, cy + 20, 4, 0, Math.PI * 2); c.fill();
  }

  private _rebuildCards() {
    const tray = this.ui.cardTrayEl;
    if (!tray) return;
    tray.innerHTML = '';
    const roleIcon: Record<string, string> = { melee: '⚔️', ranged: '🏹', breaker: '🛡️', rush: '💨' };
    const active = this.state.hand.slice(0, 4);
    active.forEach(cardId => {
      const card = getCard(cardId);
      const ok = card.cost <= this.state.elixir + 0.01 && this.started;
      const div = document.createElement('div');
      div.className = 'card' + (cardId === this.state.selectedCard ? ' selected' : '') + (!ok ? ' dim' : '');
      div.setAttribute('data-role', card.role);
      div.innerHTML = [
        `<div class="card-cost">${card.cost}</div>`,
        `<div class="card-portrait"><canvas></canvas></div>`,
        `<div class="card-nameplate">`,
        `  <span class="card-role-icon">${roleIcon[card.role] || '⚔️'}</span>`,
        `  <span class="card-name">${card.name}</span>`,
        `</div>`,
        `<div class="card-count">×${card.count}</div>`,
      ].join('');
      const cvs = div.querySelector('canvas') as HTMLCanvasElement | null;
      if (cvs) this._drawCardPortrait(cvs, card);
      div.addEventListener('mousedown', e => { e.preventDefault(); this.state.selectedCard = cardId; this._startDrag?.(cardId, div, e.clientX, e.clientY); });
      div.addEventListener('touchstart', e => { e.preventDefault(); this.state.selectedCard = cardId; this._startDrag?.(cardId, div, e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
      tray.appendChild(div);
    });
    const nextEl = document.getElementById('next-card');
    if (nextEl) {
      const nextCardId = this.state.hand[4] || active[0];
      const nextCard = getCard(nextCardId);
      nextEl.setAttribute('data-role', nextCard.role);
      const ncvs = nextEl.querySelector('canvas') as HTMLCanvasElement | null;
      if (ncvs) this._drawCardPortrait(ncvs, nextCard);
    }
  }

  private _fmtTime(s: number): string {
    const m = Math.floor(Math.max(0, s) / 60);
    return `${m}:${String(Math.ceil(Math.max(0, s) % 60)).padStart(2, '0')}`;
  }

  tick(dt: number) {
    this.time += dt;

    if (!this.started) {
      this.countdown -= dt;
      const cdEl = document.getElementById('countdown-text');
      if (this.countdown > 2) {
        if (cdEl) { cdEl.textContent = '3'; cdEl.classList.add('visible'); }
        if (this.ui.statusEl) this.ui.statusEl.textContent = 'Get ready...';
      } else if (this.countdown > 1) {
        if (cdEl) { cdEl.textContent = '2'; cdEl.classList.add('visible'); }
      } else if (this.countdown > 0) {
        if (cdEl) { cdEl.textContent = '1'; cdEl.classList.add('visible'); }
      } else {
        if (cdEl) { cdEl.textContent = 'FIGHT!'; cdEl.classList.add('visible'); }
        this.started = true;
        this.state.statusText = 'Drag cards onto the battlefield!';
        setTimeout(() => { const el = document.getElementById('countdown-text'); if (el) el.classList.remove('visible'); }, 600);
      }
      this._updateHud();
      return;
    }

    tickMatch(this.state, dt);
    this._syncUnits();
    this._updateVFX(dt);
    this._updateWalls();

    if (this.state.phase !== 'result' && this.state.blueUnits.length > 0 && this.state.redUnits.length > 0) {
      this._clashVfxTimer += dt;
      if (this._clashVfxTimer > 0.12) {
        this._clashVfxTimer = 0;
        // Blue units attacking: blue sparks + melee slash
        for (const bu of this.state.blueUnits) {
          if (bu.atkFlash > 0.5 && Math.random() < 0.5) {
            const ox = (Math.random() - 0.5) * 1.5;
            const oz = (Math.random() - 0.5) * 1.5;
            this._spawnTeamSpark(bu.x + ox, bu.z + oz, 'blue');
            if (bu.role !== 'ranged' && Math.random() < 0.4) {
              this._spawnSlashVFX(bu.x + 1, bu.z, Math.random() * Math.PI * 2);
            }
          }
        }
        // Red units attacking: red sparks + melee slash
        for (const ru of this.state.redUnits) {
          if (ru.atkFlash > 0.5 && Math.random() < 0.5) {
            const ox = (Math.random() - 0.5) * 1.5;
            const oz = (Math.random() - 0.5) * 1.5;
            this._spawnTeamSpark(ru.x + ox, ru.z + oz, 'red');
            if (ru.role !== 'ranged' && Math.random() < 0.4) {
              this._spawnSlashVFX(ru.x - 1, ru.z, Math.random() * Math.PI * 2);
            }
          }
        }
      }

      // Dust clouds at dense clash zones
      this._dustSpawnTimer += dt;
      if (this._dustSpawnTimer > 0.5) {
        this._dustSpawnTimer = 0;
        for (const lane of LANES) {
          const blueInLane = this.state.blueUnits.filter(u => u.laneId === lane.id && u.atkFlash > 0);
          const redInLane = this.state.redUnits.filter(u => u.laneId === lane.id && u.atkFlash > 0);
          const clashing = Math.min(blueInLane.length, redInLane.length);
          if (clashing >= 3) {
            // Dense fight — spawn dust at midpoint
            const bAvgX = blueInLane.reduce((s, u) => s + u.x, 0) / blueInLane.length;
            const rAvgX = redInLane.reduce((s, u) => s + u.x, 0) / redInLane.length;
            const midX = (bAvgX + rAvgX) * 0.5;
            this._spawnDustCloud(midX + (Math.random() - 0.5) * 4, lane.z + (Math.random() - 0.5) * 4);
          }
        }
      }

      // Update frontline indicators
      this._updateFrontlines();
    } else if (this.state.phase === 'result' || this.state.blueUnits.length === 0 || this.state.redUnits.length === 0) {
      // Hide frontline markers when no clash
      for (const slot of this.frontlineSlots) {
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
      }
    }

    for (const imp of this.state.impacts) {
      if (!imp._shakeApplied) {
        imp._shakeApplied = true;
        if (imp.big) this.cameraShake += 0.15;
      }
    }
    this.cameraShake *= 0.85;
    if (this.cameraShake > 0.01 && !this.breachPhase) {
      const shakeX = (Math.random() - 0.5) * 2 * this.cameraShake;
      const shakeY = (Math.random() - 0.5) * 2 * this.cameraShake;
      this._setCameraTransform(
        { x: CAMERA_POSITION.x + shakeX, y: CAMERA_POSITION.y + Math.abs(shakeY), z: CAMERA_POSITION.z },
        quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH),
      );
    } else if (this.cameraShake <= 0.01 && !this.breachPhase) {
      this.cameraShake = 0;
    }

    this._updateHud();

    if (this.state.phase === 'result' && !this.breachPhase) {
      const isBreach = this.state.endReason === 'breach';
      this.breachPhase = {
        timer: 0,
        winner: this.state.winner ?? 'draw',
        duration: isBreach ? 4.0 : 2.5,
      };
      const cdEl = document.getElementById('countdown-text');

      if (isBreach) {
        // Full breach cinematic with explosions
        const wallX = this.state.winner === 'blue' ? RED_WALL_X
          : this.state.winner === 'red' ? BLUE_WALL_X : 0;
        for (let i = 0; i < 15; i++) {
          this._spawnImpactVFX(wallX + (Math.random()-0.5)*8, (Math.random()-0.5)*24, true);
        }
        for (let i = 0; i < 10; i++) {
          this._spawnFireVFX(wallX + (Math.random()-0.5)*6, (Math.random()-0.5)*20);
        }
        this.cameraShake = 2.0;
        if (cdEl) {
          cdEl.textContent = 'BREACH!';
          cdEl.classList.add('visible');
          cdEl.style.color = '#ffd040';
          cdEl.style.fontSize = '100px';
        }
      } else {
        // Time-up: calmer presentation, no explosions
        this.cameraShake = 0.3;
        if (cdEl) {
          cdEl.textContent = 'TIME UP!';
          cdEl.classList.add('visible');
          cdEl.style.color = '#ffb060';
          cdEl.style.fontSize = '80px';
        }
      }
    }

    if (this.breachPhase) {
      this.breachPhase.timer += dt;
      const t = this.breachPhase.timer;
      const dur = this.breachPhase.duration;
      const isBreach = this.state.endReason === 'breach';
      const w = this.breachPhase.winner;

      if (isBreach) {
        // ═══ BREACH CINEMATIC ═══
        const wallX = w === 'blue' ? RED_WALL_X : (w === 'red' ? BLUE_WALL_X : 0);

        if (t < 2.0) {
          // Camera zooms to breached wall
          const progress = Math.min(1, t / 1.5);
          const ease = 1 - Math.pow(1 - progress, 3);
          const camX = CAMERA_POSITION.x + (wallX * 0.6) * ease;
          const camY = CAMERA_POSITION.y - 8 * ease;
          const camZ = CAMERA_POSITION.z - 6 * ease;
          this._setCameraTransform(
            { x: camX, y: camY, z: camZ },
            quatFromYawPitch(CAMERA_YAW - wallX * 0.008 * ease, CAMERA_PITCH + 0.1 * ease),
          );
          if (t > 0.3 && t < 1.5) {
            const shake = Math.sin(t * 40) * 0.3 * (1 - t/1.5);
            this._setCameraTransform(
              { x: camX + shake, y: camY + Math.abs(shake) * 0.5, z: camZ + shake * 0.5 },
              quatFromYawPitch(CAMERA_YAW - wallX * 0.008 * ease, CAMERA_PITCH + 0.1 * ease),
            );
          }
          if (Math.random() < 0.4) {
            this._spawnImpactVFX(wallX + (Math.random()-0.5)*10, (Math.random()-0.5)*20, true);
          }
          if (Math.random() < 0.35) {
            this._spawnFireVFX(wallX + (Math.random()-0.5)*8, (Math.random()-0.5)*18);
          }
        } else if (t < 2.5) {
          // Hold text visible
          const cdEl = document.getElementById('countdown-text');
          if (cdEl) cdEl.classList.add('visible');
        } else if (t < 3.5) {
          // Winner celebration + wall collapse
          const winners = w === 'blue' ? this.state.blueUnits : (w === 'red' ? this.state.redUnits : []);
          const losers = w === 'blue' ? this.state.redUnits : (w === 'red' ? this.state.blueUnits : []);
          for (const u of winners) {
            const info = this.unitEntities.get(u.id);
            if (!info) continue;
            const bounce = Math.abs(Math.sin(this.time * 10 + u.bob * 3)) * 2.0;
            updateTransform(info.transformPtr, {
              position: { x: u.x, y: bounce, z: u.z },
              rotation: quatFromYawPitch(this.time * 4 + u.bob, 0),
              scale: { x: 1.2, y: 1.2, z: 1.2 },
            });
          }
          for (const u of losers) {
            const info = this.unitEntities.get(u.id);
            if (!info) continue;
            const shrink = Math.max(0.3, 1 - (t - 2.0) * 1.5);
            updateTransform(info.transformPtr, {
              position: { x: u.x, y: 0, z: u.z },
              rotation: quatFromYawPitch(0, 0),
              scale: { x: shrink, y: shrink, z: shrink },
            });
          }
          const breachedWall = w === 'blue' ? this._redWallEntity : (w === 'red' ? this._blueWallEntity : null);
          if (breachedWall) {
            const collapse = Math.min(1, (t - 2.0) * 1.5);
            updateTransform(breachedWall.transformPtr, {
              position: { x: 0, y: -collapse * 6, z: 0 },
              rotation: quatFromYawPitch(0, (w === 'blue' ? -1 : 1) * collapse * 0.4),
              scale: { x: 1, y: Math.max(0.1, 1 - collapse * 0.8), z: 1 },
            });
          }
        } else if (t >= 3.5) {
          const cdEl = document.getElementById('countdown-text');
          if (cdEl) { cdEl.classList.remove('visible'); cdEl.style.color = ''; cdEl.style.fontSize = ''; }
        }
      } else {
        // ═══ TIME-UP CINEMATIC (calmer) ═══
        if (t < 1.2) {
          // Gentle pull-back to overview
          const progress = Math.min(1, t / 1.0);
          const ease = 1 - Math.pow(1 - progress, 2);
          const camY = CAMERA_POSITION.y + 3 * ease;
          this._setCameraTransform(
            { x: CAMERA_POSITION.x, y: camY, z: CAMERA_POSITION.z + 2 * ease },
            quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH - 0.05 * ease),
          );
        } else if (t < 1.8) {
          // Hold text
          const cdEl = document.getElementById('countdown-text');
          if (cdEl) cdEl.classList.add('visible');
        } else if (t >= 2.0) {
          const cdEl = document.getElementById('countdown-text');
          if (cdEl) { cdEl.classList.remove('visible'); cdEl.style.color = ''; cdEl.style.fontSize = ''; }
        }
        // No wall collapse for time-up. Winner's units get a modest bounce.
        if (t > 1.0 && t < 2.0 && w !== 'draw') {
          const winners = w === 'blue' ? this.state.blueUnits : this.state.redUnits;
          for (const u of winners) {
            const info = this.unitEntities.get(u.id);
            if (!info) continue;
            const bounce = Math.abs(Math.sin(this.time * 8 + u.bob * 2)) * 1.0;
            updateTransform(info.transformPtr, {
              position: { x: u.x, y: bounce, z: u.z },
              rotation: quatFromYawPitch(this.time * 2 + u.bob, 0),
              scale: { x: 1.1, y: 1.1, z: 1.1 },
            });
          }
        }
      }

      if (t >= dur && !this._resultShown) {
        this._setCameraTransform(CAMERA_POSITION, quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH));
      }
    }
  }
}
