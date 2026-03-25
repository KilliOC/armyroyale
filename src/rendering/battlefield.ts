import * as THREE from "three";
import type { WallState } from "../simulation/types";

// ─── Colors ──────────────────────────────────────────────────────────

const COL = {
  // Terrain
  grass: 0x4a7c2e,
  grassDark: 0x3d6b25,
  dirt: 0x8b7355,
  river: 0x2e6b8a,
  riverBed: 0x1e4a5f,
  hill: 0x5a8a3a,

  // Fortresses
  blueWall: 0x3a5c8a,
  blueWallDark: 0x2a4060,
  blueTower: 0x4a6c9a,
  blueRoof: 0x2a4a7a,
  blueBanner: 0x1a3a6a,

  redWall: 0x8a3a3a,
  redWallDark: 0x602a2a,
  redTower: 0x9a4a4a,
  redRoof: 0x7a2a2a,
  redBanner: 0x6a1a1a,

  // Accents
  gate: 0x4a3a2a,
  battlements: 0x666666,
  stone: 0x999999,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────

function mat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, flatShading: true });
}

function box(
  w: number, h: number, d: number,
  color: number,
  x: number, y: number, z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(
  rTop: number, rBot: number, h: number,
  color: number,
  x: number, y: number, z: number,
  segments = 8,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, segments),
    mat(color),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ─── Wall mesh registry (defender / right fortress only) ─────────────

const wallMeshRefs = new Map<string, THREE.Mesh>();

// ─── Ground ──────────────────────────────────────────────────────────

function createGround(): THREE.Group {
  const group = new THREE.Group();

  // Main grass field
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 100),
    mat(COL.grass),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  group.add(grass);

  // Darker grass borders (top & bottom)
  for (const z of [-42, 42]) {
    const border = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 16),
      mat(COL.grassDark),
    );
    border.rotation.x = -Math.PI / 2;
    border.position.set(0, 0.01, z);
    border.receiveShadow = true;
    group.add(border);
  }

  // Dirt paths (deployment zones near fortresses)
  for (const x of [-70, 70]) {
    const dirt = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 80),
      mat(COL.dirt),
    );
    dirt.rotation.x = -Math.PI / 2;
    dirt.position.set(x, 0.02, 0);
    dirt.receiveShadow = true;
    group.add(dirt);
  }

  return group;
}

// ─── River (center obstacle) ─────────────────────────────────────────

function createRiver(): THREE.Group {
  const group = new THREE.Group();

  // River bed (slightly recessed)
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 70),
    mat(COL.riverBed),
  );
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(0, -0.1, 0);
  group.add(bed);

  // Water surface
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 68),
    new THREE.MeshStandardMaterial({
      color: COL.river,
      transparent: true,
      opacity: 0.75,
      flatShading: true,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.05, 0);
  group.add(water);

  // Bridge (center crossing)
  group.add(box(10, 0.4, 8, COL.dirt, 0, 0.2, 0));
  // Bridge railings
  group.add(box(10, 1, 0.3, COL.stone, 0, 0.7, -3.8));
  group.add(box(10, 1, 0.3, COL.stone, 0, 0.7, 3.8));

  return group;
}

// ─── Hills (terrain features) ────────────────────────────────────────

function createHills(): THREE.Group {
  const group = new THREE.Group();

  const hillPositions: [number, number, number, number][] = [
    // [x, z, radius, height]
    [-30, -25, 6, 2.5],
    [-25, 28, 5, 2],
    [30, -28, 5.5, 2.2],
    [28, 25, 4.5, 1.8],
  ];

  for (const [x, z, r, h] of hillPositions) {
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(COL.hill),
    );
    hill.position.set(x, 0, z);
    hill.scale.y = h / r;
    hill.receiveShadow = true;
    hill.castShadow = true;
    group.add(hill);
  }

  return group;
}

// ─── Fortress builder ────────────────────────────────────────────────

interface FortressColors {
  wall: number;
  wallDark: number;
  tower: number;
  roof: number;
  banner: number;
}

function createFortress(
  side: "left" | "right",
  colors: FortressColors,
): THREE.Group {
  const group = new THREE.Group();
  const sign = side === "left" ? -1 : 1;
  const baseX = sign * 85;

  // ── Main wall — split into 3 named segments (upper / gate / lower) ──
  const wallUpper = box(10, 10, 20, colors.wall, baseX, 5, -20);
  wallUpper.name = `wall-upper-${side}`;
  wallUpper.userData.originalColor = colors.wall;
  group.add(wallUpper);

  const wallGate = box(10, 10, 20, colors.wallDark, baseX, 5, 0);
  wallGate.name = `wall-gate-${side}`;
  wallGate.userData.originalColor = colors.wallDark;
  group.add(wallGate);

  const wallLower = box(10, 10, 20, colors.wall, baseX, 5, 20);
  wallLower.name = `wall-lower-${side}`;
  wallLower.userData.originalColor = colors.wall;
  group.add(wallLower);

  // Register only defender (right) wall meshes for damage visuals
  if (side === "right") {
    wallMeshRefs.set(wallUpper.name, wallUpper);
    wallMeshRefs.set(wallGate.name, wallGate);
    wallMeshRefs.set(wallLower.name, wallLower);
  }

  // Wall top battlements
  for (let z = -27; z <= 27; z += 6) {
    group.add(box(10.5, 2, 3, colors.wallDark, baseX, 10.5, z));
  }

  // ── Corner towers (cylindrical, chunky) ──
  for (const tz of [-30, 30]) {
    // Tower body
    group.add(cylinder(5, 5.5, 16, colors.tower, baseX, 8, tz));
    // Tower top (wider cap)
    group.add(cylinder(6, 5, 2, colors.wallDark, baseX, 16.5, tz));
    // Conical roof
    group.add(cylinder(0.5, 6, 5, colors.roof, baseX, 19.5, tz));
  }

  // ── Center keep (tall, dominant) ──
  group.add(box(12, 14, 16, colors.wallDark, baseX + sign * 6, 7, 0));
  // Keep tower
  group.add(box(8, 8, 10, colors.tower, baseX + sign * 6, 17, 0));
  // Keep roof
  const roofGeo = new THREE.ConeGeometry(8, 6, 4);
  const roofMesh = new THREE.Mesh(roofGeo, mat(colors.roof));
  roofMesh.position.set(baseX + sign * 6, 24, 0);
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.castShadow = true;
  group.add(roofMesh);

  // ── Gate ──
  group.add(box(3, 6, 8, COL.gate, baseX - sign * 5, 3, 0));
  // Gate arch (half cylinder)
  const archGeo = new THREE.CylinderGeometry(4, 4, 3, 8, 1, false, 0, Math.PI);
  const arch = new THREE.Mesh(archGeo, mat(colors.wallDark));
  arch.position.set(baseX - sign * 5, 6, 0);
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = side === "left" ? 0 : Math.PI;
  group.add(arch);

  // ── Banner poles on towers ──
  for (const tz of [-30, 30]) {
    // Pole
    group.add(cylinder(0.15, 0.15, 6, COL.battlements, baseX, 25, tz, 4));
    // Banner (flat box)
    group.add(box(0.1, 3, 2, colors.banner, baseX + sign * 0.8, 26, tz));
  }

  return group;
}

// ─── Lane markers (subtle) ──────────────────────────────────────────

function createLaneMarkers(): THREE.Group {
  const group = new THREE.Group();

  // Dotted lane dividers at z = ±16 (between upper/center and center/lower)
  for (const z of [-16, 16]) {
    for (let x = -55; x <= 55; x += 8) {
      const dot = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 0.3),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.12,
        }),
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(x, 0.03, z);
      group.add(dot);
    }
  }

  return group;
}

// ─── Wall damage visuals ─────────────────────────────────────────────

function addCracks(mesh: THREE.Mesh, count: number): void {
  for (let i = 0; i < count; i++) {
    const crack = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 3 + Math.random() * 5, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x111111, flatShading: true }),
    );
    crack.position.set(
      5.2, // slightly proud of wall face
      1 + Math.random() * 7,
      (Math.random() - 0.5) * 16,
    );
    crack.rotation.z = (Math.random() - 0.5) * 0.6;
    crack.userData.isCrack = true;
    mesh.add(crack);
  }
}

/**
 * Updates defender wall segment visuals based on current HP ratios.
 * Call each frame (or on wall state change) with the sim's wall state.
 */
export function updateWallVisuals(wallState: WallState): void {
  type SegKey = "upper" | "gate" | "lower";
  const segments: { key: SegKey; meshName: string }[] = [
    { key: "upper", meshName: "wall-upper-right" },
    { key: "gate", meshName: "wall-gate-right" },
    { key: "lower", meshName: "wall-lower-right" },
  ];

  for (const { key, meshName } of segments) {
    const mesh = wallMeshRefs.get(meshName);
    if (!mesh) continue;
    const seg = wallState.segments[key];
    const ratio = seg.breached ? 0 : seg.hp / seg.maxHp;
    const mat = mesh.material as THREE.MeshStandardMaterial;

    if (seg.breached) {
      mat.color.setHex(0x0d0d0d);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      if (!mesh.userData.rubbleAdded) {
        mesh.userData.rubbleAdded = true;
        for (let i = 0; i < 6; i++) {
          const rubble = new THREE.Mesh(
            new THREE.BoxGeometry(1.5 + Math.random(), 0.8, 1.5 + Math.random()),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, flatShading: true }),
          );
          rubble.position.set(
            (Math.random() - 0.5) * 8,
            -4.5,
            (Math.random() - 0.5) * 16,
          );
          rubble.rotation.y = Math.random() * Math.PI;
          mesh.add(rubble);
        }
      }
    } else if (ratio > 0.75) {
      mat.color.setHex(mesh.userData.originalColor as number);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    } else if (ratio > 0.5) {
      mat.color.setHex(0x4a3a3a);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      if (!mesh.userData.cracksLight) {
        mesh.userData.cracksLight = true;
        addCracks(mesh, 2);
      }
    } else if (ratio > 0.25) {
      mat.color.setHex(0x302020);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      if (!mesh.userData.cracksMedium) {
        mesh.userData.cracksMedium = true;
        addCracks(mesh, 4);
      }
    } else {
      mat.color.setHex(0x1a1010);
      mat.emissive.setHex(0x550000);
      mat.emissiveIntensity = 0.4 + 0.2 * Math.sin(Date.now() * 0.003);
      if (!mesh.userData.cracksHeavy) {
        mesh.userData.cracksHeavy = true;
        addCracks(mesh, 7);
      }
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Creates the full battlefield scene graph.
 * Returns a group that should be added to the main scene.
 */
export function createBattlefield(): THREE.Group {
  const battlefield = new THREE.Group();

  battlefield.add(createGround());
  battlefield.add(createRiver());
  battlefield.add(createHills());
  battlefield.add(createLaneMarkers());

  // Blue fortress (left / attacker)
  battlefield.add(
    createFortress("left", {
      wall: COL.blueWall,
      wallDark: COL.blueWallDark,
      tower: COL.blueTower,
      roof: COL.blueRoof,
      banner: COL.blueBanner,
    }),
  );

  // Red fortress (right / defender)
  battlefield.add(
    createFortress("right", {
      wall: COL.redWall,
      wallDark: COL.redWallDark,
      tower: COL.redTower,
      roof: COL.redRoof,
      banner: COL.redBanner,
    }),
  );

  return battlefield;
}
