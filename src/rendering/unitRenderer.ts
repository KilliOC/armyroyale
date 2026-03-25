import * as THREE from "three";
import type { Army, PlayerSide } from "../simulation/types";

const MAX_UNITS_PER_SIDE = 512;

const LANE_Z_OFFSETS: Record<string, number> = {
  upper: -16,
  center: 0,
  lower: 16,
};

const ATTACKER_COLOR = 0x4488ff;
const DEFENDER_COLOR = 0xff4444;

let attackerMesh: THREE.InstancedMesh | null = null;
let defenderMesh: THREE.InstancedMesh | null = null;
let attackerGeometry: THREE.BoxGeometry | null = null;
let defenderGeometry: THREE.BoxGeometry | null = null;

function getOrCreateMesh(
  scene: THREE.Scene,
  color: number,
  existing: THREE.InstancedMesh | null,
  geometry: THREE.BoxGeometry,
): THREE.InstancedMesh {
  if (existing) return existing;

  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.InstancedMesh(geometry, material, MAX_UNITS_PER_SIDE);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false; // Always render — bounding box not reliable with dynamic instances
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

const _matrix = new THREE.Matrix4();

function updateMesh(
  scene: THREE.Scene,
  army: Army,
  mesh: THREE.InstancedMesh | null,
  color: number,
  geometry: THREE.BoxGeometry,
): THREE.InstancedMesh {
  const m = getOrCreateMesh(scene, color, mesh, geometry);

  const livingUnits = army.units.filter((u) => u.status !== "dead");
  const count = Math.min(livingUnits.length, MAX_UNITS_PER_SIDE);

  // Grid spread: rows of ceil(sqrt(N)) with 3-tile X spacing, ±12 Z spread
  const rowSize = Math.max(1, Math.ceil(Math.sqrt(count)));
  const numRows = Math.ceil(count / rowSize);

  for (let i = 0; i < count; i++) {
    const unit = livingUnits[i];
    const col = i % rowSize;
    const row = Math.floor(i / rowSize);
    const xSpread = (col - (rowSize - 1) / 2) * 3;
    const zSpread = numRows > 1 ? (row / (numRows - 1)) * 24 - 12 : 0;
    // Deterministic jitter so units don't look grid-perfect
    const jitterX = ((i * 17 + 5) % 11) / 11 - 0.5;
    const jitterZ = ((i * 23 + 11) % 11) / 11 - 0.5;
    const worldX = unit.position.x - 85 + xSpread + jitterX;
    const worldZ = (LANE_Z_OFFSETS[unit.lane] ?? 0) + zSpread + jitterZ;
    const worldY = 2; // sit on ground

    _matrix.makeTranslation(worldX, worldY, worldZ);
    m.setMatrixAt(i, _matrix);
  }

  m.count = count;
  m.instanceMatrix.needsUpdate = true;
  return m;
}

/** Creates InstancedMesh on first call, updates matrices each call */
export function renderUnits(
  scene: THREE.Scene,
  armies: Record<PlayerSide, Army>,
): void {
  if (!attackerGeometry) attackerGeometry = new THREE.BoxGeometry(2.5, 4, 2.5);
  if (!defenderGeometry) defenderGeometry = new THREE.BoxGeometry(2, 5, 2);
  attackerMesh = updateMesh(scene, armies.attacker, attackerMesh, ATTACKER_COLOR, attackerGeometry);
  defenderMesh = updateMesh(scene, armies.defender, defenderMesh, DEFENDER_COLOR, defenderGeometry);
}

/** Removes meshes from scene, disposes geometry and material */
export function disposeUnitRenderer(scene: THREE.Scene): void {
  if (attackerMesh) {
    scene.remove(attackerMesh);
    (attackerMesh.material as THREE.Material).dispose();
    attackerMesh = null;
  }
  if (defenderMesh) {
    scene.remove(defenderMesh);
    (defenderMesh.material as THREE.Material).dispose();
    defenderMesh = null;
  }
  if (attackerGeometry) {
    attackerGeometry.dispose();
    attackerGeometry = null;
  }
  if (defenderGeometry) {
    defenderGeometry.dispose();
    defenderGeometry = null;
  }
}
