import * as THREE from "three";
import type { Army, PlayerSide, Unit } from "../simulation/types";

const MAX_UNITS_PER_GROUP = 256;

const LANE_Z_OFFSETS: Record<string, number> = {
  upper: -16,
  center: 0,
  lower: 16,
};

// ─── Per-category visual config ──────────────────────────────────────
// Each card category gets its own color (per side) and geometry size

interface UnitVisual {
  attackerColor: number;
  defenderColor: number;
  width: number;
  height: number;
  depth: number;
}

const CATEGORY_VISUALS: Record<string, UnitVisual> = {
  infantry: {
    attackerColor: 0x3366cc, // blue
    defenderColor: 0xcc3333, // red
    width: 2, height: 4, depth: 2,
  },
  ranged: {
    attackerColor: 0x7744cc, // purple-blue
    defenderColor: 0xcc8800, // orange
    width: 1.5, height: 3.5, depth: 1.5,
  },
  cavalry: {
    attackerColor: 0x22aaaa, // teal
    defenderColor: 0xee5500, // dark orange
    width: 3.5, height: 3, depth: 2.5,
  },
  siege: {
    attackerColor: 0x556688, // steel blue
    defenderColor: 0x885533, // brown
    width: 4, height: 3, depth: 4,
  },
  // Fallback for unknown categories
  support: {
    attackerColor: 0x44bb44, // green
    defenderColor: 0xbb4444, // dark red
    width: 2, height: 4, depth: 2,
  },
};

const DEFAULT_VISUAL: UnitVisual = CATEGORY_VISUALS.infantry;

// ─── Card ID → category mapping ─────────────────────────────────────

const CARD_CATEGORY: Record<string, string> = {
  swarm: "infantry",
  infantry: "infantry",
  infantry_regiment: "infantry",
  archer: "ranged",
  barrage: "ranged",
  cavalry: "cavalry",
  cavalry_charge: "cavalry",
  siege_ram: "siege",
};

function getCategory(cardId: string): string {
  return CARD_CATEGORY[cardId] ?? "infantry";
}

// ─── Mesh group management ───────────────────────────────────────────

interface MeshGroup {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BoxGeometry;
  material: THREE.MeshStandardMaterial;
}

const meshGroups: Map<string, MeshGroup> = new Map();

function getOrCreateGroup(
  scene: THREE.Scene,
  key: string,
  visual: UnitVisual,
  side: PlayerSide,
): MeshGroup {
  if (meshGroups.has(key)) return meshGroups.get(key)!;

  const color = side === "attacker" ? visual.attackerColor : visual.defenderColor;
  const geometry = new THREE.BoxGeometry(visual.width, visual.height, visual.depth);
  const material = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, MAX_UNITS_PER_GROUP);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.count = 0;
  scene.add(mesh);

  const group: MeshGroup = { mesh, geometry, material };
  meshGroups.set(key, group);
  return group;
}

// ─── Matrix helper ───────────────────────────────────────────────────

const _matrix = new THREE.Matrix4();

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Render all units for both armies. Groups units by side+category,
 * giving each group its own color and geometry.
 */
export function renderUnits(
  scene: THREE.Scene,
  armies: Record<PlayerSide, Army>,
): void {
  // Collect living units grouped by side+category
  const groups: Map<string, { units: Unit[]; side: PlayerSide; category: string }> = new Map();

  for (const side of ["attacker", "defender"] as PlayerSide[]) {
    const army = armies[side];
    for (const unit of army.units) {
      if (unit.status === "dead") continue;
      const cat = getCategory(unit.cardId as string);
      const key = `${side}_${cat}`;
      if (!groups.has(key)) {
        groups.set(key, { units: [], side, category: cat });
      }
      groups.get(key)!.units.push(unit);
    }
  }

  // Track which keys are active this frame
  const activeKeys = new Set<string>();

  for (const [key, { units, side, category }] of groups) {
    activeKeys.add(key);
    const visual = CATEGORY_VISUALS[category] ?? DEFAULT_VISUAL;
    const group = getOrCreateGroup(scene, key, visual, side);

    const count = Math.min(units.length, MAX_UNITS_PER_GROUP);

    // Grid spread
    const rowSize = Math.max(1, Math.ceil(Math.sqrt(count)));
    const numRows = Math.ceil(count / rowSize);

    for (let i = 0; i < count; i++) {
      const unit = units[i];
      const col = i % rowSize;
      const row = Math.floor(i / rowSize);
      const xSpread = (col - (rowSize - 1) / 2) * 3;
      const zSpread = numRows > 1 ? (row / (numRows - 1)) * 24 - 12 : 0;
      const jitterX = ((i * 17 + 5) % 11) / 11 - 0.5;
      const jitterZ = ((i * 23 + 11) % 11) / 11 - 0.5;
      const worldX = unit.position.x - 85 + xSpread + jitterX;
      const worldZ = (LANE_Z_OFFSETS[unit.lane] ?? 0) + zSpread + jitterZ;
      const worldY = visual.height / 2;

      _matrix.makeTranslation(worldX, worldY, worldZ);
      group.mesh.setMatrixAt(i, _matrix);
    }

    group.mesh.count = count;
    group.mesh.instanceMatrix.needsUpdate = true;
  }

  // Hide inactive groups (set count to 0)
  for (const [key, group] of meshGroups) {
    if (!activeKeys.has(key)) {
      group.mesh.count = 0;
      group.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/** Removes all meshes from scene and disposes resources */
export function disposeUnitRenderer(scene: THREE.Scene): void {
  for (const [, group] of meshGroups) {
    scene.remove(group.mesh);
    group.geometry.dispose();
    group.material.dispose();
  }
  meshGroups.clear();
}
