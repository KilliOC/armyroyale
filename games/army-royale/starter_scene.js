// Army Royale — 3D scene v3: visual feedback, impact VFX, projectiles, tighter field


import {
  createMeshBuilder, appendBox, appendSphere, appendCone, appendCylinder,
  appendCapsule, appendTorus, appendDisc,
  finalizeMesh, packColor, ensureRuntimeMaterial, registerRuntimeMesh,
  spawnRenderable, updateTransform, quatFromYawPitch,
} from '@lfg/mini-engine';
import {
  ECS, Transform, Camera, MainCamera,
  DirectionalLight, DirectionalLightSettings, EnvironmentSettings, PostProcessSettings,
  bindMiniModule,
} from '../../runtime/components.js';
import {
  LANES, BLUE_WALL_X, RED_WALL_X, FIELD_LEFT, FIELD_RIGHT,
  CAMERA_POSITION, CAMERA_PITCH, CAMERA_YAW, CAMERA_FOV, LIGHTING, CARDS, getCard,
} from './shared_world.js';
import {
  createMatchState, spawnFormation, spawnFormationAt, deployBlue, tickMatch,
} from './army_simulation.js';

// ═══════════════════════════════════════
// MESH BUILDERS
// ═══════════════════════════════════════

function buildGroundMesh() {
  const b = createMeshBuilder();
  // ── Base ground layer ──
  appendBox(b, { center: { x: 0, y: -0.3, z: 0 }, size: { x: 90, y: 0.3, z: 65 }, color: packColor(48, 95, 30) });
  // Main field — lush grass
  appendBox(b, { center: { x: 0, y: -0.1, z: 0 }, size: { x: 62, y: 0.2, z: 44 }, color: packColor(88, 160, 50) });
  // Center combat zone — lighter, well-kept grass
  appendBox(b, { center: { x: 0, y: -0.04, z: 0 }, size: { x: 28, y: 0.02, z: 38 }, color: packColor(125, 185, 72) });
  // Subtle center highlight
  appendBox(b, { center: { x: 0, y: -0.02, z: 0 }, size: { x: 16, y: 0.01, z: 30 }, color: packColor(135, 195, 80) });

  // ── Lane strips with richer detail ──
  for (const lane of LANES) {
    appendBox(b, { center: { x: 0, y: -0.01, z: lane.z }, size: { x: 52, y: 0.02, z: 8 }, color: packColor(78, 145, 42) });
    // Lane edge lines — lighter grass borders
    appendBox(b, { center: { x: 0, y: 0.01, z: lane.z + 4.2 }, size: { x: 50, y: 0.02, z: 0.15 }, color: packColor(110, 185, 60) });
    appendBox(b, { center: { x: 0, y: 0.01, z: lane.z - 4.2 }, size: { x: 50, y: 0.02, z: 0.15 }, color: packColor(110, 185, 60) });
    // Lane center worn path
    appendBox(b, { center: { x: 0, y: 0.005, z: lane.z }, size: { x: 48, y: 0.01, z: 2.5 }, color: packColor(95, 155, 48) });
  }

  // ── Center divider — glowing line ──
  appendBox(b, { center: { x: 0, y: 0.03, z: 0 }, size: { x: 0.15, y: 0.06, z: 40 }, color: packColor(140, 200, 255) });
  appendBox(b, { center: { x: 0, y: 0.02, z: 0 }, size: { x: 0.4, y: 0.03, z: 40 }, color: packColor(100, 160, 220) });

  // ── Grass edge borders — darker edge strips ──
  appendBox(b, { center: { x: 0, y: -0.02, z: 21 }, size: { x: 64, y: 0.06, z: 2.5 }, color: packColor(60, 118, 32) });
  appendBox(b, { center: { x: 0, y: -0.02, z: -21 }, size: { x: 64, y: 0.06, z: 2.5 }, color: packColor(60, 118, 32) });

  // ── Dark grass patches scattered across the field ──
  for (const [px, pz] of [[-12,8],[-8,-10],[10,5],[6,-8],[-15,-5],[14,12],[-5,14],[8,-14]]) {
    appendBox(b, { center: { x: px, y: 0.005, z: pz }, size: { x: 3.5, y: 0.01, z: 2.5 }, color: packColor(70, 135, 38) });
  }

  // ── Gentle rolling hills on far edges — subtle, low, distant ──
  // Far back hills (z > 30) — mostly submerged, just gentle bumps above ground
  appendSphere(b, { center: { x: -20, y: -5, z: 38 }, radius: 8, widthSegments: 8, heightSegments: 5, color: packColor(55, 108, 34) });
  appendSphere(b, { center: { x: 10, y: -4.5, z: 40 }, radius: 7, widthSegments: 8, heightSegments: 5, color: packColor(50, 100, 30) });
  appendSphere(b, { center: { x: -5, y: -5.5, z: 42 }, radius: 9, widthSegments: 8, heightSegments: 5, color: packColor(52, 105, 32) });
  appendSphere(b, { center: { x: 25, y: -5, z: 36 }, radius: 6, widthSegments: 6, heightSegments: 4, color: packColor(48, 98, 28) });
  // Far front hills (z < -30) — gentle rolling bumps
  appendSphere(b, { center: { x: -12, y: -5, z: -36 }, radius: 7, widthSegments: 8, heightSegments: 5, color: packColor(53, 105, 33) });
  appendSphere(b, { center: { x: 18, y: -4.5, z: -38 }, radius: 6, widthSegments: 8, heightSegments: 5, color: packColor(50, 100, 30) });
  appendSphere(b, { center: { x: 0, y: -5.5, z: -40 }, radius: 8, widthSegments: 8, heightSegments: 5, color: packColor(48, 98, 28) });
  // Side hills — behind walls, subtle rise
  appendSphere(b, { center: { x: -42, y: -4, z: 5 }, radius: 6, widthSegments: 6, heightSegments: 4, color: packColor(52, 102, 32) });
  appendSphere(b, { center: { x: -44, y: -4.5, z: -10 }, radius: 7, widthSegments: 6, heightSegments: 4, color: packColor(48, 96, 28) });
  appendSphere(b, { center: { x: 42, y: -4, z: -5 }, radius: 6, widthSegments: 6, heightSegments: 4, color: packColor(50, 100, 30) });
  appendSphere(b, { center: { x: 44, y: -4.5, z: 8 }, radius: 7, widthSegments: 6, heightSegments: 4, color: packColor(46, 94, 26) });

  // ── Rocks scattered on field ──
  for (const [rx, rz] of [[-18, 15], [15, -13], [-6, -16], [20, 10], [-20, -3], [17, 3]]) {
    appendSphere(b, { center: { x: rx, y: 0.12, z: rz }, radius: 0.35, widthSegments: 6, heightSegments: 4, color: packColor(130, 125, 115) });
    // Shadow under rock
    appendBox(b, { center: { x: rx, y: 0.005, z: rz }, size: { x: 0.6, y: 0.01, z: 0.5 }, color: packColor(55, 100, 30) });
  }

  // ── Dirt patches near walls ──
  appendBox(b, { center: { x: BLUE_WALL_X + 4, y: 0.005, z: 0 }, size: { x: 4, y: 0.01, z: 30 }, color: packColor(120, 100, 60) });
  appendBox(b, { center: { x: RED_WALL_X - 4, y: 0.005, z: 0 }, size: { x: 4, y: 0.01, z: 30 }, color: packColor(120, 100, 60) });

  return finalizeMesh(b);
}

function buildTerrainDetailsMesh() {
  const b = createMeshBuilder();

  // ── Flower patches — tiny colored spheres ──
  const flowerColors = [
    packColor(255, 80, 80),   // red
    packColor(255, 220, 60),  // yellow
    packColor(200, 100, 255), // purple
    packColor(255, 160, 200), // pink
    packColor(255, 255, 255), // white
  ];
  const flowerPositions = [
    [-16, 17], [-14, 16.5], [-15, 18], [12, -16], [13, -15.5], [11, -17],
    [-22, 5], [-21, 6], [22, -4], [21, -3], [-8, 18], [-7, 17.5],
    [8, -18], [7, -17.5], [18, 16], [17, 15], [-19, -14], [-18, -15],
    [20, 8], [19, 9], [-4, 19], [-3, 18.5], [5, -19], [4, -18],
  ];
  for (let i = 0; i < flowerPositions.length; i++) {
    const [fx, fz] = flowerPositions[i];
    const fc = flowerColors[i % flowerColors.length];
    appendSphere(b, { center: { x: fx, y: 0.15, z: fz }, radius: 0.18, widthSegments: 4, heightSegments: 3, color: fc });
    // Stem
    appendBox(b, { center: { x: fx, y: 0.06, z: fz }, size: { x: 0.04, y: 0.12, z: 0.04 }, color: packColor(60, 130, 40) });
  }

  // ── Stone clusters on edges ──
  const stonePositions = [
    [-32, 15], [-33, 16], [-31, 14], [32, -14], [33, -15], [31, -13],
    [-30, -16], [30, 16], [-35, 0], [35, 0],
  ];
  for (const [sx, sz] of stonePositions) {
    const r = 0.3 + Math.abs(sx * sz % 5) * 0.08;
    appendSphere(b, { center: { x: sx, y: r * 0.5, z: sz }, radius: r, widthSegments: 5, heightSegments: 3, color: packColor(145, 138, 125) });
  }
  // Larger accent stones at corners
  appendSphere(b, { center: { x: -33, y: 0.4, z: 19 }, radius: 0.7, widthSegments: 6, heightSegments: 4, color: packColor(135, 130, 118) });
  appendSphere(b, { center: { x: 33, y: 0.4, z: -19 }, radius: 0.65, widthSegments: 6, heightSegments: 4, color: packColor(140, 132, 120) });
  appendSphere(b, { center: { x: -33, y: 0.35, z: -19 }, radius: 0.6, widthSegments: 6, heightSegments: 4, color: packColor(138, 128, 115) });
  appendSphere(b, { center: { x: 33, y: 0.38, z: 19 }, radius: 0.55, widthSegments: 6, heightSegments: 4, color: packColor(142, 135, 122) });

  // ── Dirt patches — flat brown boxes scattered near edges ──
  for (const [dx, dz] of [[-25, 12], [25, -10], [-20, -16], [22, 15], [-26, -8], [26, 6]]) {
    appendBox(b, { center: { x: dx, y: 0.005, z: dz }, size: { x: 2.5, y: 0.01, z: 1.8 }, color: packColor(110, 90, 55) });
  }

  // ── Small grass tufts on hills ──
  const tuftPositions = [
    [-15, 23], [12, 24], [-10, -24], [15, -23],
    [-35, 5], [-36, -5], [35, -3], [37, 7],
  ];
  for (const [tx, tz] of tuftPositions) {
    appendCone(b, { center: { x: tx, y: 0.4, z: tz }, radius: 0.3, height: 0.8, radialSegments: 4, color: packColor(65, 130, 38) });
    appendCone(b, { center: { x: tx + 0.3, y: 0.35, z: tz - 0.2 }, radius: 0.25, height: 0.7, radialSegments: 4, color: packColor(58, 120, 34) });
  }

  return finalizeMesh(b);
}

function buildWallMesh(side) {
  const b = createMeshBuilder();
  const isBlue = side === 'blue';
  const wx = isBlue ? BLUE_WALL_X : RED_WALL_X;
  const c1 = isBlue ? packColor(50, 80, 160) : packColor(160, 50, 45);
  const c2 = isBlue ? packColor(65, 105, 190) : packColor(190, 65, 50);
  const c3 = isBlue ? packColor(35, 60, 125) : packColor(125, 35, 30);
  // Main wall — taller and chunkier
  appendBox(b, { center: { x: wx, y: 5, z: 0 }, size: { x: 5, y: 10, z: 40 }, color: c1 });
  // Wall top battlement
  appendBox(b, { center: { x: wx, y: 10.5, z: 0 }, size: { x: 6, y: 0.8, z: 41 }, color: c2 });
  // Battlements
  for (let i = -4; i <= 4; i++) appendBox(b, { center: { x: wx, y: 11.5, z: i * 4 }, size: { x: 6, y: 1.6, z: 2 }, color: c2 });
  // Brick lines (horizontal)
  for (let y = 2; y < 10; y += 1.5) {
    appendBox(b, { center: { x: wx + (isBlue ? 2.6 : -2.6), y, z: 0 }, size: { x: 0.1, y: 0.06, z: 40 }, color: c3 });
  }
  // Corner towers — bigger
  for (const tz of [17, -17]) {
    appendCylinder(b, { center: { x: wx, y: 6, z: tz }, radius: 3.5, height: 12, segments: 14, color: c1 });
    appendCone(b, { center: { x: wx, y: 13.5, z: tz }, radius: 4, height: 5, segments: 14, color: c2 });
    appendSphere(b, { center: { x: wx, y: 16.5, z: tz }, radius: 0.8, widthSegments: 8, heightSegments: 6, color: packColor(255, 215, 50) });
  }
  // Gate arches — bigger, more imposing
  for (const lane of LANES) {
    appendBox(b, { center: { x: wx, y: 3.5, z: lane.z }, size: { x: 5.5, y: 7, z: 5.5 }, color: c3 });
    appendBox(b, { center: { x: wx, y: 7.5, z: lane.z }, size: { x: 6, y: 1, z: 6 }, color: c2 });
    // Gate arch top
    appendCylinder(b, { center: { x: wx, y: 7, z: lane.z }, radius: 2.5, height: 0.5, segments: 12, color: c2 });
  }
  return finalizeMesh(b);
}

// ═══ ANIMAL CHARACTER MESH BUILDERS ═══
// TEAM COLOR DOMINANT — body is blue/red, silhouette identifies animal type
// At camera height (y=32) the team color MUST be the dominant visual

function buildMonkeyMesh(teamR, teamG, teamB) {
  const b = createMeshBuilder();
  const tc = packColor(Math.floor(teamR*255), Math.floor(teamG*255), Math.floor(teamB*255));
  const tcDark = packColor(Math.floor(teamR*180), Math.floor(teamG*180), Math.floor(teamB*180));
  const face = packColor(240, 210, 170);
  // Body — TEAM COLOR
  appendSphere(b, { center: { x: 0, y: 0.7, z: 0 }, radius: 0.55, widthSegments: 6, heightSegments: 5, color: tc });
  // Head — TEAM COLOR
  appendSphere(b, { center: { x: 0, y: 1.35, z: 0 }, radius: 0.45, widthSegments: 6, heightSegments: 5, color: tc });
  // Face — small accent
  appendSphere(b, { center: { x: 0, y: 1.28, z: 0.35 }, radius: 0.2, widthSegments: 4, heightSegments: 3, color: face });
  // Ears — TEAM COLOR
  appendSphere(b, { center: { x: -0.42, y: 1.5, z: 0 }, radius: 0.18, widthSegments: 4, heightSegments: 3, color: tc });
  appendSphere(b, { center: { x: 0.42, y: 1.5, z: 0 }, radius: 0.18, widthSegments: 4, heightSegments: 3, color: tc });
  // Banana sword — bright accent
  appendCylinder(b, { center: { x: 0.65, y: 0.9, z: 0 }, radiusTop: 0.06, radiusBottom: 0.1, height: 0.8, radialSegments: 4, color: packColor(255, 220, 50) });
  // Legs — darker team
  appendBox(b, { center: { x: -0.2, y: 0.15, z: 0 }, size: { x: 0.2, y: 0.3, z: 0.22 }, color: tcDark });
  appendBox(b, { center: { x: 0.2, y: 0.15, z: 0 }, size: { x: 0.2, y: 0.3, z: 0.22 }, color: tcDark });
  return finalizeMesh(b);
}

function buildHamsterMesh(teamR, teamG, teamB) {
  const b = createMeshBuilder();
  const tc = packColor(Math.floor(teamR*255), Math.floor(teamG*255), Math.floor(teamB*255));
  const tcLight = packColor(Math.min(255,Math.floor(teamR*255)+40), Math.min(255,Math.floor(teamG*255)+40), Math.min(255,Math.floor(teamB*255)+40));
  // Body — TEAM COLOR, extra round chonky
  appendSphere(b, { center: { x: 0, y: 0.6, z: 0 }, radius: 0.6, widthSegments: 6, heightSegments: 5, color: tc });
  // Head — TEAM COLOR
  appendSphere(b, { center: { x: 0, y: 1.2, z: 0.05 }, radius: 0.42, widthSegments: 6, heightSegments: 5, color: tc });
  // Puffy cheeks — lighter team accent
  appendSphere(b, { center: { x: -0.35, y: 1.12, z: 0.15 }, radius: 0.22, widthSegments: 4, heightSegments: 3, color: tcLight });
  appendSphere(b, { center: { x: 0.35, y: 1.12, z: 0.15 }, radius: 0.22, widthSegments: 4, heightSegments: 3, color: tcLight });
  // Tiny ears
  appendSphere(b, { center: { x: -0.28, y: 1.55, z: 0 }, radius: 0.12, widthSegments: 4, heightSegments: 3, color: tcLight });
  appendSphere(b, { center: { x: 0.28, y: 1.55, z: 0 }, radius: 0.12, widthSegments: 4, heightSegments: 3, color: tcLight });
  // Acorn projectile — neutral accent
  appendSphere(b, { center: { x: 0.5, y: 0.85, z: 0.2 }, radius: 0.12, widthSegments: 4, heightSegments: 3, color: packColor(140, 90, 40) });
  return finalizeMesh(b);
}

function buildFrogMesh(teamR, teamG, teamB) {
  const b = createMeshBuilder();
  const tc = packColor(Math.floor(teamR*255), Math.floor(teamG*255), Math.floor(teamB*255));
  const tcDark = packColor(Math.floor(teamR*160), Math.floor(teamG*160), Math.floor(teamB*160));
  const eye = packColor(255, 255, 220);
  // Body — TEAM COLOR, wide and flat, toad-like
  appendCapsule(b, { center: { x: 0, y: 0.55, z: 0 }, radius: 0.55, height: 0.5, capSegments: 4, radialSegments: 6, color: tc });
  // Head — TEAM COLOR wide flat
  appendBox(b, { center: { x: 0, y: 1.05, z: 0.1 }, size: { x: 0.9, y: 0.5, z: 0.65 }, color: tc });
  // Big bulging eyes — white accent (signature)
  appendSphere(b, { center: { x: -0.32, y: 1.4, z: 0.15 }, radius: 0.2, widthSegments: 4, heightSegments: 3, color: eye });
  appendSphere(b, { center: { x: 0.32, y: 1.4, z: 0.15 }, radius: 0.2, widthSegments: 4, heightSegments: 3, color: eye });
  appendSphere(b, { center: { x: -0.32, y: 1.42, z: 0.28 }, radius: 0.08, widthSegments: 3, heightSegments: 2, color: packColor(20, 20, 20) });
  appendSphere(b, { center: { x: 0.32, y: 1.42, z: 0.28 }, radius: 0.08, widthSegments: 3, heightSegments: 2, color: packColor(20, 20, 20) });
  // Powerful legs — darker team
  appendBox(b, { center: { x: -0.45, y: 0.2, z: -0.1 }, size: { x: 0.25, y: 0.4, z: 0.35 }, color: tcDark });
  appendBox(b, { center: { x: 0.45, y: 0.2, z: -0.1 }, size: { x: 0.25, y: 0.4, z: 0.35 }, color: tcDark });
  return finalizeMesh(b);
}

function buildDucklingMesh(teamR, teamG, teamB) {
  const b = createMeshBuilder();
  const tc = packColor(Math.floor(teamR*255), Math.floor(teamG*255), Math.floor(teamB*255));
  const beak = packColor(255, 160, 30);
  // Body — TEAM COLOR, small round
  appendSphere(b, { center: { x: 0, y: 0.4, z: 0 }, radius: 0.38, widthSegments: 6, heightSegments: 5, color: tc });
  // Head — TEAM COLOR
  appendSphere(b, { center: { x: 0, y: 0.9, z: 0.05 }, radius: 0.32, widthSegments: 6, heightSegments: 5, color: tc });
  // Beak — orange accent (signature)
  appendCone(b, { center: { x: 0, y: 0.82, z: 0.38 }, radius: 0.12, height: 0.22, radialSegments: 4, color: beak });
  // Eyes
  appendSphere(b, { center: { x: -0.15, y: 0.98, z: 0.2 }, radius: 0.06, widthSegments: 3, heightSegments: 2, color: packColor(20, 20, 20) });
  appendSphere(b, { center: { x: 0.15, y: 0.98, z: 0.2 }, radius: 0.06, widthSegments: 3, heightSegments: 2, color: packColor(20, 20, 20) });
  // Stubby wings — team color
  appendBox(b, { center: { x: -0.35, y: 0.45, z: 0 }, size: { x: 0.12, y: 0.25, z: 0.3 }, color: tc });
  appendBox(b, { center: { x: 0.35, y: 0.45, z: 0 }, size: { x: 0.12, y: 0.25, z: 0.3 }, color: tc });
  // Tiny feet — beak color accent
  appendBox(b, { center: { x: -0.12, y: 0.04, z: 0.06 }, size: { x: 0.14, y: 0.08, z: 0.2 }, color: beak });
  appendBox(b, { center: { x: 0.12, y: 0.04, z: 0.06 }, size: { x: 0.14, y: 0.08, z: 0.2 }, color: beak });
  return finalizeMesh(b);
}

// Card ID → mesh builder mapping
function buildUnitMesh(cardId, bodyColor, hatColor, skinColor, scale) {
  const [br, bg, bb] = bodyColor;
  switch (cardId) {
    case 'monkey':   return buildMonkeyMesh(br, bg, bb);
    case 'hamster':  return buildHamsterMesh(br, bg, bb);
    case 'frog':     return buildFrogMesh(br, bg, bb);
    case 'duckling': return buildDucklingMesh(br, bg, bb);
    default:         return buildMonkeyMesh(br, bg, bb);
  }
}

function buildTreeMesh(s) {
  const b = createMeshBuilder();
  s = s || 1;
  appendCylinder(b, { center: { x: 0, y: 1.5*s, z: 0 }, radius: 0.4*s, height: 3*s, segments: 8, color: packColor(110,75,40) });
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

  // ── Smoke cloud underneath (dark grey) ──
  appendSphere(b, { center: { x: 0, y: 0.4, z: 0 }, radius: 2.5, widthSegments: 10, heightSegments: 8, color: packColor(60, 55, 50) });
  appendSphere(b, { center: { x: 1.5, y: 0.3, z: 1.0 }, radius: 1.8, widthSegments: 8, heightSegments: 6, color: packColor(70, 65, 55) });
  appendSphere(b, { center: { x: -1.3, y: 0.35, z: -0.8 }, radius: 1.6, widthSegments: 8, heightSegments: 6, color: packColor(55, 50, 45) });
  appendSphere(b, { center: { x: 0.8, y: 0.2, z: -1.4 }, radius: 1.4, widthSegments: 6, heightSegments: 4, color: packColor(65, 58, 48) });

  // ── Large central fireball ──
  appendSphere(b, { center: { x: 0, y: 1.2, z: 0 }, radius: 2.2, widthSegments: 10, heightSegments: 8, color: packColor(255, 180, 40) });
  appendSphere(b, { center: { x: 0, y: 1.8, z: 0 }, radius: 1.6, widthSegments: 8, heightSegments: 6, color: packColor(255, 140, 20) });

  // ── Ring of fire particles ──
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const rx = Math.cos(angle) * 2.2;
    const rz = Math.sin(angle) * 2.2;
    appendSphere(b, { center: { x: rx, y: 0.8 + Math.sin(i) * 0.4, z: rz }, radius: 0.65, widthSegments: 6, heightSegments: 4, color: packColor(255, 120, 15) });
  }

  // ── Bright white flash center ──
  appendSphere(b, { center: { x: 0, y: 1.5, z: 0 }, radius: 1.2, widthSegments: 8, heightSegments: 6, color: packColor(255, 255, 240) });
  appendSphere(b, { center: { x: 0, y: 2.0, z: 0 }, radius: 0.7, widthSegments: 6, heightSegments: 4, color: packColor(255, 255, 255) });

  // ── Upper fire plume ──
  appendSphere(b, { center: { x: 0, y: 2.8, z: 0 }, radius: 1.0, widthSegments: 8, heightSegments: 6, color: packColor(255, 200, 50) });
  appendSphere(b, { center: { x: 0.5, y: 3.2, z: 0.3 }, radius: 0.6, widthSegments: 6, heightSegments: 4, color: packColor(255, 160, 30) });

  // ── Debris / spark elements — small bright spheres scattered around ──
  const sparkPositions = [
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
  // ── Central flame column — overlapping cones pointing up ──
  // Orange base flames
  appendCone(b, { center: { x: 0, y: 1.0, z: 0 }, radius: 0.8, height: 2.0, radialSegments: 8, color: packColor(255, 100, 20) });
  appendCone(b, { center: { x: 0.3, y: 1.2, z: 0.2 }, radius: 0.6, height: 2.2, radialSegments: 7, color: packColor(255, 100, 20) });
  appendCone(b, { center: { x: -0.3, y: 1.1, z: -0.2 }, radius: 0.65, height: 2.0, radialSegments: 7, color: packColor(255, 100, 20) });
  // Yellow tips — taller
  appendCone(b, { center: { x: 0, y: 2.0, z: 0 }, radius: 0.5, height: 1.8, radialSegments: 6, color: packColor(255, 220, 80) });
  appendCone(b, { center: { x: 0.2, y: 2.2, z: 0.15 }, radius: 0.35, height: 1.5, radialSegments: 6, color: packColor(255, 220, 80) });
  appendCone(b, { center: { x: -0.2, y: 2.1, z: -0.1 }, radius: 0.4, height: 1.6, radialSegments: 6, color: packColor(255, 180, 40) });
  // Red edges — side flames
  appendCone(b, { center: { x: 0.6, y: 0.8, z: 0.4 }, radius: 0.4, height: 1.4, radialSegments: 5, color: packColor(255, 60, 10) });
  appendCone(b, { center: { x: -0.6, y: 0.7, z: -0.3 }, radius: 0.45, height: 1.5, radialSegments: 5, color: packColor(255, 60, 10) });
  appendCone(b, { center: { x: 0.1, y: 0.9, z: -0.5 }, radius: 0.35, height: 1.3, radialSegments: 5, color: packColor(255, 60, 10) });
  appendCone(b, { center: { x: -0.4, y: 0.85, z: 0.5 }, radius: 0.38, height: 1.4, radialSegments: 5, color: packColor(255, 60, 10) });
  // Fire glow spheres — hot core
  appendSphere(b, { center: { x: 0, y: 0.5, z: 0 }, radius: 0.7, widthSegments: 8, heightSegments: 6, color: packColor(255, 180, 40) });
  appendSphere(b, { center: { x: 0, y: 1.5, z: 0 }, radius: 0.5, widthSegments: 6, heightSegments: 4, color: packColor(255, 220, 80) });
  appendSphere(b, { center: { x: 0, y: 2.8, z: 0 }, radius: 0.3, widthSegments: 6, heightSegments: 4, color: packColor(255, 220, 80) });
  // Ember particles at top
  appendSphere(b, { center: { x: 0.3, y: 3.3, z: 0.1 }, radius: 0.12, widthSegments: 4, heightSegments: 3, color: packColor(255, 180, 40) });
  appendSphere(b, { center: { x: -0.2, y: 3.5, z: -0.15 }, radius: 0.1, widthSegments: 4, heightSegments: 3, color: packColor(255, 220, 80) });
  appendSphere(b, { center: { x: 0.1, y: 3.7, z: 0.2 }, radius: 0.08, widthSegments: 4, heightSegments: 3, color: packColor(255, 240, 160) });
  return finalizeMesh(b);
}

function buildDeployFlashMesh() {
  const b = createMeshBuilder();
  // Subtle ground ring glow
  appendCylinder(b, { center: { x: 0, y: 0.03, z: 0 }, radius: 0.6, height: 0.02, segments: 12, color: packColor(90, 160, 240) });
  // Tiny bright dot
  appendSphere(b, { center: { x: 0, y: 0.15, z: 0 }, radius: 0.12, widthSegments: 6, heightSegments: 4, color: packColor(170, 215, 255) });
  return finalizeMesh(b);
}

function buildDebugOutlinesMesh() {
  const b = createMeshBuilder();
  // Tall fence-style edges so they read from low camera angles
  const outline = (x1, z1, x2, z2, color, fenceHeight, thick) => {
    const w = Math.abs(x2 - x1), d = Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const y = fenceHeight / 2;
    appendBox(b, { center: { x: cx, y, z: z1 }, size: { x: w, y: fenceHeight, z: thick }, color });
    appendBox(b, { center: { x: cx, y, z: z2 }, size: { x: w, y: fenceHeight, z: thick }, color });
    appendBox(b, { center: { x: x1, y, z: cz }, size: { x: thick, y: fenceHeight, z: d }, color });
    appendBox(b, { center: { x: x2, y, z: cz }, size: { x: thick, y: fenceHeight, z: d }, color });
    // Corner posts (taller for visibility)
    for (const [px, pz] of [[x1,z1],[x2,z1],[x1,z2],[x2,z2]]) {
      appendBox(b, { center: { x: px, y: fenceHeight, z: pz }, size: { x: thick*2, y: fenceHeight*2, z: thick*2 }, color });
    }
  };
  // Ground mesh bounds — magenta (90x65)
  outline(-45, -32.5, 45, 32.5, packColor(255, 40, 220), 2.5, 0.5);
  // Play field — red (62x44)
  outline(-31, -22, 31, 22, packColor(255, 40, 40), 3.0, 0.5);
  // Blue deploy zone — cyan (x in [-26,0], z in [-20,20])
  outline(-26, -20, 0, 20, packColor(40, 220, 255), 2.0, 0.4);
  return finalizeMesh(b);
}

function buildProjectileMesh() {
  const b = createMeshBuilder();
  appendSphere(b, { center: { x: 0, y: 0, z: 0 }, radius: 0.35, widthSegments: 8, heightSegments: 6, color: packColor(255,240,120) });
  appendSphere(b, { center: { x: 0, y: 0, z: 0.2 }, radius: 0.2, widthSegments: 6, heightSegments: 4, color: packColor(255,200,80) });
  // Trail glow
  appendSphere(b, { center: { x: 0, y: 0, z: -0.3 }, radius: 0.15, widthSegments: 4, heightSegments: 3, color: packColor(255,180,60) });
  return finalizeMesh(b);
}

// ═══════════════════════════════════════
// GAME CONTROLLER
// ═══════════════════════════════════════

export function createArmyRoyaleGame(ui = {}) {
  let game = null;
  return {
    async begin(Module, Mini, sceneHandle) {
      bindMiniModule(Module);
      ECS.bindModule(Module);
      game = new ArmyRoyaleScene(Module, Mini, sceneHandle, ui);
      await game.init();
    },
    tick(Module, Mini, sceneHandle, dt) {
      if (game) game.tick(dt);
    },
    async end() { game = null; },
  };
}

class ArmyRoyaleScene {
  constructor(Module, Mini, sceneHandle, ui) {
    this.Module = Module;
    this.Mini = Mini;
    this.scene = sceneHandle;
    this.ui = ui;
    this.state = createMatchState();
    this.meshes = {};
    this.materials = {};
    this.unitEntities = new Map();
    this.impactPool = []; // reusable impact entities
    this.activeImpacts = [];
    this.projPool = [];
    this.activeProjs = [];
    this.deployFlashPool = [];
    this.firePool = [];
    this.time = 0;
    this.countdown = 3.0;
    this.started = false;
    this.breachPhase = null; // null | { timer, winner, cameraTarget }
    this.cameraEntity = null;
    this.cameraShake = 0;
    this._resultShown = false;
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
    this._debugOutlines = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
    if (this._debugOutlines) {
      this.meshes.debugOutlines = registerRuntimeMesh(this.Mini, this.scene, 'army_debug_outlines', buildDebugOutlinesMesh());
    }

    // Procedural animal meshes — 1 entity per unit, distinct silhouettes
    this.meshes.units = {};
    for (const card of CARDS) {
      this.meshes.units[`blue_${card.id}`] = registerRuntimeMesh(this.Mini, this.scene, `unit_blue_${card.id}`,
        buildUnitMesh(card.id, card.blueBody, card.blueHat, card.skin));
      this.meshes.units[`red_${card.id}`] = registerRuntimeMesh(this.Mini, this.scene, `unit_red_${card.id}`,
        buildUnitMesh(card.id, card.redBody, card.redHat, card.skin));
    }

    const all = [this.materials.world, this.materials.unit, this.materials.vfx,
      this.meshes.ground, this.meshes.terrainDetails, this.meshes.blueWall, this.meshes.redWall, this.meshes.tree,
      this.meshes.bush, this.meshes.impact, this.meshes.fire, this.meshes.projectile, this.meshes.deployFlash, ...Object.values(this.meshes.units)];
    if (all.some(r => r.rebuildRequired)) {
      this.Mini.scenes.rebuildRendererResources?.(this.scene);
    }
    this.Mini.scenes.resetRuntime?.(this.scene);

    this._createLighting();
    this._createCamera();
    this._spawnEnvironment();
    this._createVFXPools();
    this._createDeployPreview();
    this._installInput();
    this._updateHud();

    if (this.ui.statusEl) this.ui.statusEl.textContent = '3...';
  }

  _createLighting() {
    const sun = ECS.createEntity(this.scene);
    ECS.writeComponent(this.scene, sun, DirectionalLight, { direction: LIGHTING.sunDirection, illuminance: LIGHTING.illuminance });
    ECS.writeComponent(this.scene, sun, DirectionalLightSettings, { sun_color: LIGHTING.sunColor, ambient_intensity: LIGHTING.ambientIntensity });
    ECS.writeComponent(this.scene, sun, EnvironmentSettings, { sky_cubemap_name_hash: this.Mini.runtime.sid(LIGHTING.skyCubemapName) });
    const post = ECS.createEntity(this.scene);
    ECS.writeComponent(this.scene, post, PostProcessSettings, LIGHTING.postProcess);
  }

  _createCamera() {
    const eid = ECS.createEntity(this.scene);
    const tInfo = ECS.writeComponent(this.scene, eid, Transform, { position: CAMERA_POSITION, rotation: quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH), scale: { x: 1, y: 1, z: 1 } });
    ECS.writeComponent(this.scene, eid, Camera, { fov: CAMERA_FOV, near: 0.1, far: 500 });
    ECS.addComponent(this.scene, eid, MainCamera);
    this.cameraTransformPtr = tInfo.ptr >>> 0;
  }

  _spawnEnvironment() {
    const mh = this.materials.world.hash;
    const spawn = (name, mesh, pos, rot, sc) => {
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
    // Trees — behind walls and on far edges, NOT blocking the battlefield view
    for (const [x, z, s] of [[-36,22,0.8],[-38,-20,0.7],[36,22,0.75],[38,-20,0.8],[-36,0,0.6],[36,0,0.55],[-20,28,0.5],[20,-28,0.45],[-38,10,0.5],[38,-10,0.5]])
      spawn('Tree', this.meshes.tree, { x, y: 0, z }, quatFromYawPitch(x*0.3, 0), { x: s, y: s, z: s });
    // Bushes — field borders only
    for (const [x, z, s] of [[-32,15,0.5],[32,-15,0.45],[-32,-15,0.4],[32,15,0.45],[-20,24,0.4],[20,-24,0.4]])
      spawn('Bush', this.meshes.bush, { x, y: 0, z }, quatFromYawPitch(z*0.2, 0), { x: s, y: s, z: s });
  }

  _createDeployPreview() {
    // Deploy zone indicator — circle on ground
    const b = createMeshBuilder();
    // Outer ring
    appendCylinder(b, { center: { x: 0, y: 0, z: 0 }, radius: 3.5, height: 0.05, segments: 24, color: packColor(80, 170, 255) });
    // Inner lighter area
    appendCylinder(b, { center: { x: 0, y: 0.02, z: 0 }, radius: 3.0, height: 0.05, segments: 24, color: packColor(60, 140, 240) });
    // Center dot
    appendCylinder(b, { center: { x: 0, y: 0.04, z: 0 }, radius: 0.4, height: 0.06, segments: 8, color: packColor(200, 230, 255) });
    const mesh = registerRuntimeMesh(this.Mini, this.scene, 'army_deploy_preview', finalizeMesh(b));

    // Invalid deploy marker — red X on ground
    const bx = createMeshBuilder();
    appendBox(bx, { center: { x: 0, y: 0.05, z: 0 }, size: { x: 5, y: 0.1, z: 0.5 }, color: packColor(220, 50, 50) });
    appendBox(bx, { center: { x: 0, y: 0.05, z: 0 }, size: { x: 0.5, y: 0.1, z: 5 }, color: packColor(220, 50, 50) });
    const invalidMesh = registerRuntimeMesh(this.Mini, this.scene, 'army_deploy_invalid', finalizeMesh(bx));

    // Blue deploy zone overlay — entire left half from wall to center
    const zoneWidth = Math.abs(BLUE_WALL_X) + 2; // from wall+2 to center (x=0)
    const zoneCenterX = (BLUE_WALL_X + 2 + 0) / 2; // center of the zone
    const bz = createMeshBuilder();
    appendBox(bz, { center: { x: zoneCenterX, y: 0.03, z: 0 }, size: { x: zoneWidth, y: 0.02, z: 38 }, color: packColor(50, 110, 210) });
    const zoneMesh = registerRuntimeMesh(this.Mini, this.scene, 'army_deploy_zone', finalizeMesh(bz));

    this.Mini.scenes.rebuildRendererResources?.(this.scene);

    this._deployPreviewEntity = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'DeployPreview', meshHash: mesh.hash, materialHash: this.materials.vfx.hash,
      position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
    });
    this._deployInvalidEntity = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'DeployInvalid', meshHash: invalidMesh.hash, materialHash: this.materials.vfx.hash,
      position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0.785, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
    });
    this._deployZoneEntity = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'DeployZone', meshHash: zoneMesh.hash, materialHash: this.materials.vfx.hash,
      position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
    });
  }

  _createVFXPools() {
    // Pre-create a pool of impact entities (reusable)
    const vh = this.materials.vfx.hash;
    for (let i = 0; i < 80; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Impact_${i}`, meshHash: this.meshes.impact.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.impactPool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0 });
    }
    // Deploy flash pool — blue ring/sparkle for player deploys
    for (let i = 0; i < 16; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `DeployFlash_${i}`, meshHash: this.meshes.deployFlash.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.deployFlashPool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0 });
    }
    // Projectile pool
    for (let i = 0; i < 50; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Proj_${i}`, meshHash: this.meshes.projectile.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.projPool.push({ transformPtr: e.transformPtr, active: false, life: 0 });
    }
    // Fire pool — for breach flames
    for (let i = 0; i < 20; i++) {
      const e = spawnRenderable(this.Module, this.Mini, this.scene, {
        name: `Fire_${i}`, meshHash: this.meshes.fire.hash, materialHash: vh,
        position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
      });
      this.firePool.push({ transformPtr: e.transformPtr, active: false, life: 0, x: 0, z: 0 });
    }
  }

  _spawnDeployFlash(x, z) {
    const slot = this.deployFlashPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true;
    slot.life = 0.8;
    slot.x = x;
    slot.z = z;
  }

  _spawnImpactVFX(x, z, big) {
    const slot = this.impactPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true;
    slot.life = 0.5;
    slot.x = x;
    slot.z = z;
    slot.big = big;
  }

  _spawnFireVFX(x, z) {
    const slot = this.firePool.find(s => !s.active);
    if (!slot) return;
    slot.active = true;
    slot.life = 1.5;
    slot.x = x;
    slot.z = z;
  }

  _spawnProjectileVFX(sx, sz, tx, tz) {
    const slot = this.projPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true;
    slot.life = 0.5;
    slot.maxLife = 0.5;
    slot.sx = sx; slot.sz = sz;
    slot.tx = tx; slot.tz = tz;
  }

  _updateVFX(dt) {
    // Update impact VFX
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
    // Update projectile VFX
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
      const y = 1.5 + Math.sin(t * Math.PI) * 3; // arc
      updateTransform(slot.transformPtr, {
        position: { x, y, z },
        rotation: quatFromYawPitch(t * 6, 0),
        scale: { x: 1, y: 1, z: 1 },
      });
    }

    // Update deploy flash VFX
    for (const slot of this.deployFlashPool) {
      if (!slot.active) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }
      const t = slot.life / 0.8; // 1→0
      const expand = 0.8 + (1 - t) * 1.2; // gentle expand from 0.8 to 2.0
      const y = 0.02;
      const fadeScale = t > 0.15 ? 1.0 : t / 0.15; // quick fade at end
      updateTransform(slot.transformPtr, {
        position: { x: slot.x, y, z: slot.z },
        rotation: quatFromYawPitch(0, 0),
        scale: { x: expand * fadeScale, y: fadeScale * 0.5, z: expand * fadeScale },
      });
    }

    // Update fire VFX
    for (const slot of this.firePool) {
      if (!slot.active) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.active = false;
        updateTransform(slot.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
        continue;
      }
      const t = slot.life / 1.5; // 1→0
      const flicker = 0.85 + Math.sin(this.time * 12 + slot.x * 3) * 0.15;
      const s = (0.3 + (1 - t) * 0.2) * flicker;
      const y = 0.0 + (1 - t) * 0.5;
      updateTransform(slot.transformPtr, {
        position: { x: slot.x + Math.sin(this.time * 8) * 0.1, y, z: slot.z + Math.cos(this.time * 6) * 0.1 },
        rotation: quatFromYawPitch(this.time * 2 + slot.x, 0),
        scale: { x: s, y: s * (0.8 + t * 0.4), z: s },
      });
    }

    // Spawn VFX from simulation impacts
    for (const imp of this.state.impacts) {
      if (imp._vfxSpawned) continue;
      imp._vfxSpawned = true;
      this._spawnImpactVFX(imp.x, imp.z, imp.big);
    }
    for (const proj of this.state.projectiles) {
      if (proj._vfxSpawned) continue;
      proj._vfxSpawned = true;
      this._spawnProjectileVFX(proj.sx, proj.sz, proj.tx, proj.tz);
    }
  }

  // Screen-to-world: ray from camera through screen point to ground plane (y=0).
  // Camera parameters come from shared_world.js so this stays in sync with _createCamera.
  _screenToWorld(clientX, clientY) {
    const canvasEl = document.getElementById('canvas');
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

    // yaw = 0; only pitch matters for ray rotation
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const rayDirX = rayDirCamX;
    const rayDirY = rayDirCamY * cosPitch - rayDirCamZ * sinPitch;
    const rayDirZ = rayDirCamY * sinPitch + rayDirCamZ * cosPitch;

    if (Math.abs(rayDirY) < 0.0001) return { worldX: 0, worldZ: 0 };
    const t = -camY / rayDirY;
    if (t < 0) return { worldX: 0, worldZ: 0 };

    const worldX = 0 + t * rayDirX;
    const worldZ = camZ + t * rayDirZ;

    return { worldX, worldZ };
  }

  _isValidDeployPos(worldX, worldZ) {
    // Blue side = left half, from wall to center line
    return worldX <= 0 && worldX > BLUE_WALL_X + 2 && Math.abs(worldZ) < 20;
  }

  // ─── INPUT ───
  _installInput() {
    const ghost = document.getElementById('drag-ghost');
    const ghostLabel = ghost?.querySelector('.ghost-label');
    const deployLine = document.getElementById('deploy-line');
    let dragging = null;
    let lastWorldPos = null;

    const hideAllPreviews = () => {
      if (this._deployPreviewEntity) updateTransform(this._deployPreviewEntity.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
      if (this._deployInvalidEntity) updateTransform(this._deployInvalidEntity.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
      if (this._deployZoneEntity) updateTransform(this._deployZoneEntity.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
    };

    const startDrag = (cardId, el, x, y) => {
      if (!this.started || this.state.phase === 'result') return;
      const card = getCard(cardId);
      if (card.cost > this.state.elixir + 0.01) return;
      dragging = { cardId, el };
      el.classList.add('dragging');
      if (ghost) { ghost.style.display = 'block'; ghost.style.left = (x-28)+'px'; ghost.style.top = (y-55)+'px'; }
      if (ghostLabel) ghostLabel.textContent = card.name + ' ×' + card.count;
      if (deployLine) deployLine.classList.add('active');
      // No deploy zone overlay — just the cursor circle
      this.state.statusText = `DRAG ${card.name.toUpperCase()} ONTO BLUE ZONE`;
    };

    const moveDrag = (x, y) => {
      if (!dragging) return;
      const wp = this._screenToWorld(x, y);
      lastWorldPos = wp;
      const valid = this._isValidDeployPos(wp.worldX, wp.worldZ);
      if (ghost) {
        ghost.style.left = (x-28)+'px';
        ghost.style.top = (y-55)+'px';
        ghost.className = valid ? '' : 'invalid';
        ghost.style.display = 'block';
      }
      if (valid) {
        // Show blue circle at deploy position
        const cx = Math.min(Math.max(wp.worldX, BLUE_WALL_X + 4), 0);
        const cz = Math.min(Math.max(wp.worldZ, -18), 18);
        if (this._deployPreviewEntity) {
          updateTransform(this._deployPreviewEntity.transformPtr, {
            position: { x: cx, y: 0.12, z: cz },
            rotation: quatFromYawPitch(this.time * 0.5, 0),
            scale: { x: 1.2, y: 0.3, z: 1.2 },
          });
        }
        // Hide invalid marker
        if (this._deployInvalidEntity) {
          updateTransform(this._deployInvalidEntity.transformPtr, {
            position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
          });
        }
      } else {
        // Show red X at invalid position
        if (this._deployInvalidEntity) {
          updateTransform(this._deployInvalidEntity.transformPtr, {
            position: { x: wp.worldX, y: 0.2, z: wp.worldZ },
            rotation: quatFromYawPitch(0.785, 0),
            scale: { x: 1, y: 1, z: 1 },
          });
        }
        // Hide valid circle
        if (this._deployPreviewEntity) {
          updateTransform(this._deployPreviewEntity.transformPtr, {
            position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
          });
        }
      }
    };

    const endDrag = (x, y) => {
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
        this.state.statusText = 'CAN\'T DEPLOY THERE!';
      }
      dragging = null;
      lastWorldPos = null;
      this._updateHud();
    };

    const cancelDrag = () => {
      if (!dragging) return;
      dragging.el.classList.remove('dragging');
      if (ghost) ghost.style.display = 'none';
      if (deployLine) deployLine.classList.remove('active');
      hideAllPreviews();
      dragging = null;
      lastWorldPos = null;
    };

    document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup', e => { if (dragging) endDrag(e.clientX, e.clientY); });
    document.addEventListener('touchmove', e => { if (!dragging) return; e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.addEventListener('touchend', e => { if (!dragging) return; endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
    document.addEventListener('touchcancel', cancelDrag);
    this._startDrag = startDrag;
  }

  // ─── UNIT ENTITIES ───
  _getOrCreateUnitEntity(unit) {
    if (this.unitEntities.has(unit.id)) return this.unitEntities.get(unit.id);

    // Procedural animal meshes — 1 entity per unit, runs smooth at 200+
    const mesh = this.meshes.units[`${unit.team}_${unit.cardId}`];
    if (!mesh) return null;
    const e = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: `U${unit.id}`, meshHash: mesh.hash, materialHash: this.materials.unit.hash,
      position: { x: unit.x, y: 0, z: unit.z }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 },
    });
    const info = { entityId: e.entityId, transformPtr: e.transformPtr, glb: false };
    this.unitEntities.set(unit.id, info);
    return info;
  }

  _syncUnits() {
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
        // A2 SPAWN: elastic overshoot pop-in + drop from above
        const t = 1 - (u.spawnTime / 0.4); // 0 → 1
        const c = (2 * Math.PI) / 3;
        const elastic = t === 0 ? 0 : t >= 1 ? 1
          : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
        const s = Math.max(0.01, elastic);
        scaleX = s; scaleY = s; scaleZ = s;
        posY = 2 * (1 - t); // drops from +2 to 0
      } else {
        const striking = u.atkFlash > 0.1;
        const hurt = u.hitFlash > 0.1;

        if (!striking && !hurt) {
          // A1 WALKING bob — stronger (freq 6, amp 0.18)
          posY = Math.sin(this.time * 6 + u.bob) * 0.18;
        }

        if (striking) {
          // A3 ATTACK squash-stretch: stretch vertical, squash horizontal at peak
          const atk = u.atkFlash;
          scaleY = 1 + atk * 0.20;
          scaleX = 1 - atk * 0.10;
          scaleZ = 1 - atk * 0.10;
          posY = 0.15 * atk;
        }

        if (hurt) {
          // A5 HIT FLASH: smoother, stronger scale pump (1.25 peak, smooth decay)
          const boost = 1 + u.hitFlash * 0.25;
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

    // A4 DEATH: gasp phase (0-100ms) then fall + shrink + fast spin (100-500ms)
    for (const d of this.state.deadUnits) {
      const info = this.unitEntities.get(d.id);
      if (!info) continue;
      const progress = 1 - d.timer / 0.5; // 0 → 1
      let dSx, dSy, dSz, dY, rotSpin;

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
        dY = 0.2 - fallT * 1.2; // falls down into ground
        rotSpin = this.time * 15; // 3x previous spin speed
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

  _updateWalls() {
    if (this.breachPhase) return; // don't interfere with breach cinematic
    const s = this.state;
    const updateWall = (entity, hp, leanDir) => {
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

  // ─── HUD ───
  _updateHud() {
    const s = this.state;
    if (this.ui.timerEl) {
      this.ui.timerEl.textContent = this._fmtTime(s.time);
      if (s.isOvertime) this.ui.timerEl.style.color = '#ff6060';
    }
    if (this.ui.blueHpEl) this.ui.blueHpEl.textContent = Math.max(0, Math.round(s.blueHP));
    if (this.ui.redHpEl) this.ui.redHpEl.textContent = Math.max(0, Math.round(s.redHP));
    if (this.ui.blueHpBar) this.ui.blueHpBar.style.width = `${Math.max(0, s.blueHP)}%`;
    if (this.ui.redHpBar) this.ui.redHpBar.style.width = `${Math.max(0, s.redHP)}%`;
    if (this.ui.statusEl && this.started) {
      if (s.isOvertime && s.phase !== 'result') this.ui.statusEl.textContent = '⚡ OVERTIME — 2x ELIXIR!';
      else this.ui.statusEl.textContent = s.statusText;
    }
    if (this.ui.elixirValEl) this.ui.elixirValEl.textContent = Math.floor(s.elixir);
    // Segmented elixir bar
    this._updateElixirBar();
    if (this.ui.phaseEl) {
      if (s.phase === 'result') this.ui.phaseEl.textContent = s.isOvertime ? 'OVERTIME' : '';
      else if (s.isOvertime) this.ui.phaseEl.textContent = 'OVERTIME';
      else this.ui.phaseEl.textContent = '';
    }
    // Result screen — shown after breach cinematic (4s delay)
    if (s.phase === 'result' && !this._resultShown && this.breachPhase && this.breachPhase.timer >= this.breachPhase.duration) {
      this._resultShown = true;
      this._showResult();
    }
    this._rebuildCards();
  }

  _updateElixirBar() {
    const barEl = document.getElementById('elixir-bar-seg');
    if (!barEl) return;
    let fill = barEl.querySelector('.fill');
    if (!fill) {
      barEl.innerHTML = '';
      fill = document.createElement('div');
      fill.className = 'fill';
      barEl.appendChild(fill);
    }
    const e = Math.max(0, Math.min(10, this.state.elixir));
    fill.style.width = `${e * 10}%`;
  }

  _showResult() {
    const cdEl = document.getElementById('countdown-text');
    if (cdEl) { cdEl.classList.remove('visible'); cdEl.style.color = ''; cdEl.style.fontSize = ''; }
    const overlay = document.getElementById('result-overlay');
    const title = document.getElementById('result-title');
    const stars = document.getElementById('result-stars');
    const chest = document.getElementById('result-chest');
    const sub = document.getElementById('result-sub');
    const btn = document.getElementById('rematch-btn');
    if (!overlay) return;
    const s = this.state;
    if (s.winner === 'blue') {
      title.textContent = '⚔️ VICTORY!';
      stars.textContent = s.redHP <= 0 ? '⭐⭐⭐' : '⭐⭐';
      chest.textContent = '🎁';
      sub.textContent = `Wall Breached! HP: ${Math.round(s.blueHP)}% vs ${Math.round(s.redHP)}%`;
    } else if (s.winner === 'red') {
      title.textContent = '💀 DEFEAT';
      stars.textContent = '⭐';
      chest.textContent = '';
      sub.textContent = `Your wall fell! HP: ${Math.round(s.blueHP)}% vs ${Math.round(s.redHP)}%`;
    } else {
      title.textContent = '🤝 DRAW';
      stars.textContent = '⭐⭐';
      chest.textContent = '';
      sub.textContent = 'Time\'s up! No breach.';
    }
    overlay.classList.add('show');
    document.body.classList.add('result-active');
    btn.onclick = () => {
      overlay.classList.remove('show');
      document.body.classList.remove('result-active');
      this._resetMatch();
    };
  }

  _resetMatch() {
    const newState = createMatchState();
    Object.assign(this.state, newState);
    // Clear all unit entities
    for (const [id, info] of this.unitEntities) {
      updateTransform(info.transformPtr, { position: { x: 0, y: -100, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 0.01, y: 0.01, z: 0.01 } });
    }
    this.unitEntities.clear();
    this._resultShown = false;
    this.breachPhase = null;
    this.cameraShake = 0;
    this.countdown = 3.0;
    this.started = false;
    if (this.ui.timerEl) this.ui.timerEl.style.color = '';
    // Reset camera
    if (this.cameraTransformPtr) {
      updateTransform(this.cameraTransformPtr, {
        position: CAMERA_POSITION,
        rotation: quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH),
        scale: { x: 1, y: 1, z: 1 },
      });
    }
  }

  _drawGnomePortrait(cvs, card) {
    const c = cvs.getContext('2d');
    cvs.width = 62; cvs.height = 56;
    const cx = 31, cy = 32, r = 12;
    // Background clear
    c.clearRect(0, 0, 52, 48);
    // Body
    const [br, bg, bb] = card.blueBody.map(v => Math.floor(v * 255));
    c.fillStyle = `rgb(${br},${bg},${bb})`;
    c.beginPath(); c.ellipse(cx, cy + 3, r, r * 1.1, 0, 0, Math.PI * 2); c.fill();
    // Belt
    c.fillStyle = '#5a3518'; c.fillRect(cx - r, cy + r * 0.3, r * 2, 2.5);
    c.fillStyle = '#c8a040'; c.fillRect(cx - 2, cy + r * 0.2, 4, 3);
    // Head
    const [sr, sg, sb] = card.skin.map(v => Math.floor(v * 255));
    c.fillStyle = `rgb(${sr},${sg},${sb})`;
    c.beginPath(); c.arc(cx, cy - r * 0.4, r * 0.6, 0, Math.PI * 2); c.fill();
    // Eyes
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(cx - 3, cy - r * 0.48, 2.5, 3, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 3, cy - r * 0.48, 2.5, 3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(cx - 2.5, cy - r * 0.45, 1.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + 3.5, cy - r * 0.45, 1.5, 0, Math.PI * 2); c.fill();
    // Mouth
    c.strokeStyle = '#8a5040'; c.lineWidth = 1;
    c.beginPath(); c.arc(cx + 0.5, cy - r * 0.22, 2.5, 0.2, Math.PI - 0.2); c.stroke();
    // Hat
    const [hr, hg, hb] = card.blueHat.map(v => Math.floor(v * 255));
    c.fillStyle = `rgb(${hr},${hg},${hb})`;
    c.beginPath();
    c.moveTo(cx - r * 0.6, cy - r * 0.7);
    c.quadraticCurveTo(cx + 2, cy - r * 1.6, cx + 3, cy - r * 2.3);
    c.lineTo(cx + r * 0.6, cy - r * 0.7);
    c.closePath(); c.fill();
    // Hat brim
    c.beginPath(); c.ellipse(cx, cy - r * 0.72, r * 0.68, r * 0.15, 0, 0, Math.PI * 2); c.fill();
    // Cheeks
    c.fillStyle = 'rgba(255,140,110,0.3)';
    c.beginPath(); c.arc(cx - r * 0.4, cy - r * 0.25, 2.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + r * 0.4, cy - r * 0.25, 2.5, 0, Math.PI * 2); c.fill();
  }

  _rebuildCards() {
    const tray = this.ui.cardTrayEl;
    if (!tray) return;
    tray.innerHTML = '';
    const active = this.state.hand.slice(0, 4);
    active.forEach(cardId => {
      const card = getCard(cardId);
      const ok = card.cost <= this.state.elixir + 0.01 && this.started;
      const div = document.createElement('div');
      div.className = 'card' + (cardId === this.state.selectedCard ? ' selected' : '') + (!ok ? ' dim' : '');
      div.setAttribute('data-role', card.role);
      div.innerHTML = `<div class="card-cost">${card.cost}</div><div class="card-portrait"><canvas></canvas></div><div class="card-name">${card.name}</div><div class="card-count">×${card.count}</div>`;
      this._drawGnomePortrait(div.querySelector('canvas'), card);
      div.addEventListener('mousedown', e => { e.preventDefault(); this.state.selectedCard = cardId; this._startDrag?.(cardId, div, e.clientX, e.clientY); });
      div.addEventListener('touchstart', e => { e.preventDefault(); this.state.selectedCard = cardId; this._startDrag?.(cardId, div, e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
      tray.appendChild(div);
    });
    // Next card preview
    const nextEl = document.getElementById('next-card');
    if (nextEl) {
      const nextCardId = this.state.hand[4] || active[0];
      const nextCard = getCard(nextCardId);
      nextEl.setAttribute('data-role', nextCard.role);
      const ncvs = nextEl.querySelector('canvas');
      if (ncvs) this._drawGnomePortrait(ncvs, nextCard);
    }
  }

  _fmtTime(s) { const m = Math.floor(Math.max(0, s) / 60); return `${m}:${String(Math.ceil(Math.max(0, s) % 60)).padStart(2, '0')}`; }

  // ─── TICK ───
  tick(dt) {
    this.time += dt;

    // Countdown before match starts
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
        // Hide countdown after 0.5s
        setTimeout(() => { if (cdEl) cdEl.classList.remove('visible'); }, 600);
      }
      this._updateHud();
      return;
    }

    tickMatch(this.state, dt);
    this._syncUnits();
    this._updateVFX(dt);
    this._updateWalls();

    // ─── CLASH ZONE VFX — continuous dust/sparks where armies meet ───
    if (this.state.phase !== 'result' && this.state.blueUnits.length > 0 && this.state.redUnits.length > 0) {
      this._clashVfxTimer = (this._clashVfxTimer || 0) + dt;
      if (this._clashVfxTimer > 0.15) { // every 150ms
        this._clashVfxTimer = 0;
        // Find clash zones: areas where blue and red units are within range
        for (const bu of this.state.blueUnits) {
          if (bu.atkFlash > 0.5) { // unit is actively attacking
            // Spawn small impact at the fight
            if (Math.random() < 0.4) {
              this._spawnImpactVFX(bu.x + (Math.random()-0.5)*2, bu.z + (Math.random()-0.5)*2, false);
            }
          }
        }
        for (const ru of this.state.redUnits) {
          if (ru.atkFlash > 0.5) {
            if (Math.random() < 0.4) {
              this._spawnImpactVFX(ru.x + (Math.random()-0.5)*2, ru.z + (Math.random()-0.5)*2, false);
            }
          }
        }
      }
    }

    // ─── CAMERA SHAKE ───
    // Only shake on BIG impacts (wall hits), not normal combat
    for (const imp of this.state.impacts) {
      if (!imp._shakeApplied) {
        imp._shakeApplied = true;
        if (imp.big) this.cameraShake += 0.15;
      }
    }
    // Fast decay
    this.cameraShake *= 0.85;
    if (this.cameraShake > 0.01 && this.cameraTransformPtr && !this.breachPhase) {
      const shakeX = (Math.random() - 0.5) * 2 * this.cameraShake;
      const shakeY = (Math.random() - 0.5) * 2 * this.cameraShake;
      updateTransform(this.cameraTransformPtr, {
        position: { x: CAMERA_POSITION.x + shakeX, y: CAMERA_POSITION.y + Math.abs(shakeY), z: CAMERA_POSITION.z },
        rotation: quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH),
        scale: { x: 1, y: 1, z: 1 },
      });
    } else if (this.cameraShake <= 0.01 && !this.breachPhase && this.cameraTransformPtr) {
      this.cameraShake = 0;
    }

    this._updateHud();

    // ─── BREACH CINEMATIC ───
    if (this.state.phase === 'result' && !this.breachPhase) {
      this.breachPhase = {
        timer: 0,
        winner: this.state.winner,
        duration: 4.0, // total cinematic length
      };
      // Spawn massive impact VFX at breached wall
      const wallX = this.state.winner === 'blue' ? RED_WALL_X : BLUE_WALL_X;
      for (let i = 0; i < 15; i++) {
        this._spawnImpactVFX(wallX + (Math.random()-0.5)*8, (Math.random()-0.5)*24, true);
      }
      // Spawn fire VFX at breach point
      for (let i = 0; i < 10; i++) {
        this._spawnFireVFX(wallX + (Math.random()-0.5)*6, (Math.random()-0.5)*20);
      }
      // Massive camera shake
      this.cameraShake = 2.0;
      // Show BREACH! text
      const cdEl = document.getElementById('countdown-text');
      if (cdEl) {
        cdEl.textContent = this.state.winner === 'draw' ? 'TIME UP!' : 'BREACH!';
        cdEl.classList.add('visible');
        cdEl.style.color = '#ffd040';
        cdEl.style.fontSize = '100px';
      }
    }

    if (this.breachPhase) {
      this.breachPhase.timer += dt;
      const t = this.breachPhase.timer;
      const dur = this.breachPhase.duration;

      if (t < 2.0) {
        // Phase 1: Camera zooms to breached wall
        const wallX = this.breachPhase.winner === 'blue' ? RED_WALL_X : (this.breachPhase.winner === 'red' ? BLUE_WALL_X : 0);
        const progress = Math.min(1, t / 1.5);
        const ease = 1 - Math.pow(1 - progress, 3); // ease out cubic
        const camX = CAMERA_POSITION.x + (wallX * 0.6) * ease;
        const camY = CAMERA_POSITION.y - 8 * ease;
        const camZ = CAMERA_POSITION.z - 6 * ease;
        if (this.cameraTransformPtr) {
          updateTransform(this.cameraTransformPtr, {
            position: { x: camX, y: camY, z: camZ },
            rotation: quatFromYawPitch(CAMERA_YAW - wallX * 0.008 * ease, CAMERA_PITCH + 0.1 * ease),
            scale: { x: 1, y: 1, z: 1 },
          });
        }
        // Shake camera
        if (t > 0.3 && t < 1.5 && this.cameraTransformPtr) {
          const shake = Math.sin(t * 40) * 0.3 * (1 - t/1.5);
          updateTransform(this.cameraTransformPtr, {
            position: { x: camX + shake, y: camY + Math.abs(shake) * 0.5, z: camZ + shake * 0.5 },
            rotation: quatFromYawPitch(CAMERA_YAW - wallX * 0.008 * ease, CAMERA_PITCH + 0.1 * ease),
            scale: { x: 1, y: 1, z: 1 },
          });
        }
        // Keep spawning explosion and fire VFX aggressively
        if (Math.random() < 0.4) {
          this._spawnImpactVFX(wallX + (Math.random()-0.5)*10, (Math.random()-0.5)*20, true);
        }
        if (Math.random() < 0.35) {
          this._spawnFireVFX(wallX + (Math.random()-0.5)*8, (Math.random()-0.5)*18);
        }
      } else if (t < 2.5) {
        // Phase 2: Show BREACH! text
        const cdEl = document.getElementById('countdown-text');
        if (cdEl) cdEl.classList.add('visible');
      } else if (t < 3.5) {
        // Phase 3: WINNERS celebrate (bounce + spin), LOSERS shrink
        const w = this.breachPhase.winner;
        const winners = w === 'blue' ? this.state.blueUnits : (w === 'red' ? this.state.redUnits : []);
        const losers = w === 'blue' ? this.state.redUnits : (w === 'red' ? this.state.blueUnits : []);
        // Winners jump and celebrate
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
        // Losers flee/shrink
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
        // Collapse the breached wall
        const breachedWall = w === 'blue' ? this._redWallEntity : this._blueWallEntity;
        if (breachedWall) {
          const collapse = Math.min(1, (t - 2.0) * 1.5);
          updateTransform(breachedWall.transformPtr, {
            position: { x: 0, y: -collapse * 6, z: 0 },
            rotation: quatFromYawPitch(0, (w === 'blue' ? -1 : 1) * collapse * 0.4),
            scale: { x: 1, y: Math.max(0.1, 1 - collapse * 0.8), z: 1 },
          });
        }
      } else if (t >= 3.5) {
        // Hide breach text
        const cdEl = document.getElementById('countdown-text');
        if (cdEl) { cdEl.classList.remove('visible'); cdEl.style.color = ''; cdEl.style.fontSize = ''; }
      }

      // Phase 4: Show result after cinematic
      if (t >= dur && !this._resultShown) {
        // Reset camera
        if (this.cameraTransformPtr) {
          updateTransform(this.cameraTransformPtr, {
            position: CAMERA_POSITION,
            rotation: quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH),
            scale: { x: 1, y: 1, z: 1 },
          });
        }
      }
    }
  }
}
