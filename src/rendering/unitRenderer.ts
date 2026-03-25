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
let sharedGeometry: THREE.BoxGeometry | null = null;

function getOrCreateMesh(
  scene: THREE.Scene,
  color: number,
  existing: THREE.InstancedMesh | null,
): THREE.InstancedMesh {
  if (existing) return existing;

  if (!sharedGeometry) {
    // Units must be large enough to see from the overview camera (75+ units away)
    // Battlefield is 200 wide, so each unit should be ~2-3% of field width
    sharedGeometry = new THREE.BoxGeometry(3, 5, 3);
  }

  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.InstancedMesh(sharedGeometry, material, MAX_UNITS_PER_SIDE);
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
): THREE.InstancedMesh {
  const m = getOrCreateMesh(scene, color, mesh);

  const livingUnits = army.units.filter((u) => u.status !== "dead");
  const count = Math.min(livingUnits.length, MAX_UNITS_PER_SIDE);

  for (let i = 0; i < count; i++) {
    const unit = livingUnits[i];
    // Small deterministic spread so units form a group rather than stacking
    const xSpread = ((i * 7 + 3) % 5) - 2; // ±2 tiles along X
    const zSpread = ((i * 13 + 7) % 13) - 6; // ±6 tiles within lane band
    const worldX = unit.position.x - 85 + xSpread;
    const worldZ = (LANE_Z_OFFSETS[unit.lane] ?? 0) + zSpread;
    const worldY = 2.5; // sit on ground (half of height=5)

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
  attackerMesh = updateMesh(scene, armies.attacker, attackerMesh, ATTACKER_COLOR);
  defenderMesh = updateMesh(scene, armies.defender, defenderMesh, DEFENDER_COLOR);
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
  if (sharedGeometry) {
    sharedGeometry.dispose();
    sharedGeometry = null;
  }
}
