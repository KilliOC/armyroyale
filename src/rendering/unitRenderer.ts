import * as THREE from "three";
import type { Army, PlayerSide, Unit } from "../simulation/types";

const MAX_UNITS_PER_GROUP = 256;

interface UnitVisual {
  attackerColor: number;
  defenderColor: number;
  body: { w: number; h: number; d: number };
  head: { r: number };
  weapon: { w: number; h: number; d: number; offsetX: number; offsetY: number };
}

const CATEGORY_VISUALS: Record<string, UnitVisual> = {
  infantry: {
    attackerColor: 0x3366cc,
    defenderColor: 0xcc3333,
    body: { w: 1.6, h: 2.6, d: 1.2 },
    head: { r: 0.6 },
    weapon: { w: 0.35, h: 2.0, d: 0.35, offsetX: 0.9, offsetY: 0.3 },
  },
  ranged: {
    attackerColor: 0x7744cc,
    defenderColor: 0xcc8800,
    body: { w: 1.4, h: 2.4, d: 1.0 },
    head: { r: 0.55 },
    weapon: { w: 1.6, h: 0.18, d: 0.18, offsetX: 0.9, offsetY: 0.2 },
  },
  cavalry: {
    attackerColor: 0x22aaaa,
    defenderColor: 0xee5500,
    body: { w: 2.8, h: 2.0, d: 1.4 },
    head: { r: 0.5 },
    weapon: { w: 2.2, h: 0.22, d: 0.22, offsetX: 1.5, offsetY: 0.6 },
  },
  siege: {
    attackerColor: 0x556688,
    defenderColor: 0x885533,
    body: { w: 3.2, h: 1.8, d: 2.2 },
    head: { r: 0.0 },
    weapon: { w: 1.8, h: 0.5, d: 0.5, offsetX: 1.6, offsetY: 0.2 },
  },
};

const DEFAULT_VISUAL = CATEGORY_VISUALS.infantry;

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

interface PartMesh {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
}

interface MeshGroup {
  body: PartMesh;
  head: PartMesh | null;
  weapon: PartMesh;
}

let hpBarMesh: THREE.InstancedMesh | null = null;
let hpBarGeometry: THREE.BoxGeometry | null = null;
let hpBarMaterial: THREE.MeshStandardMaterial | null = null;

const meshGroups: Map<string, MeshGroup> = new Map();
const _matrix = new THREE.Matrix4();
const _tempQuat = new THREE.Quaternion();
const _tempEuler = new THREE.Euler();
const _tempPos = new THREE.Vector3();
const _tempScale = new THREE.Vector3(1, 1, 1);

function makePart(scene: THREE.Scene, geometry: THREE.BufferGeometry, color: number): PartMesh {
  const material = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, MAX_UNITS_PER_GROUP);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.count = 0;
  scene.add(mesh);
  return { mesh, geometry, material };
}

function getOrCreateGroup(scene: THREE.Scene, key: string, visual: UnitVisual, side: PlayerSide): MeshGroup {
  const existing = meshGroups.get(key);
  if (existing) return existing;

  const color = side === "attacker" ? visual.attackerColor : visual.defenderColor;
  const darker = new THREE.Color(color).multiplyScalar(0.75).getHex();
  const accent = new THREE.Color(color).multiplyScalar(1.15).getHex();

  const group: MeshGroup = {
    body: makePart(scene, new THREE.BoxGeometry(visual.body.w, visual.body.h, visual.body.d), color),
    head: visual.head.r > 0 ? makePart(scene, new THREE.SphereGeometry(visual.head.r, 8, 8), accent) : null,
    weapon: makePart(scene, new THREE.BoxGeometry(visual.weapon.w, visual.weapon.h, visual.weapon.d), darker),
  };
  meshGroups.set(key, group);
  return group;
}

function composeMatrix(x: number, y: number, z: number, rotY: number, sx = 1, sy = 1, sz = 1): THREE.Matrix4 {
  _tempPos.set(x, y, z);
  _tempEuler.set(0, rotY, 0);
  _tempQuat.setFromEuler(_tempEuler);
  _tempScale.set(sx, sy, sz);
  return _matrix.compose(_tempPos, _tempQuat, _tempScale);
}

function formationOffset(unit: Unit, index: number, total: number): { x: number; z: number } {
  const category = getCategory(String(unit.cardId));
  const cols = category === "swarm" ? 7 : category === "cavalry" ? 4 : category === "ranged" ? 6 : 5;
  const spacingX = category === "cavalry" ? 3.4 : category === "ranged" ? 2.6 : 2.2;
  const spacingZ = category === "swarm" ? 1.9 : category === "cavalry" ? 2.8 : 2.3;

  let col = index % cols;
  let row = Math.floor(index / cols);
  let x = (col - (cols - 1) / 2) * spacingX;
  let z = row * spacingZ;

  if (category === "cavalry") {
    // wedge
    const center = (cols - 1) / 2;
    z += Math.abs(col - center) * 0.9;
  } else if (category === "ranged") {
    // line/backline bias
    z += row * 0.6;
  } else if (category === "swarm") {
    x += ((index * 13) % 7 - 3) * 0.18;
    z += ((index * 17) % 9 - 4) * 0.16;
  }

  z -= ((Math.ceil(total / cols) - 1) * spacingZ) / 2;
  return { x, z };
}

export function renderUnits(scene: THREE.Scene, armies: Record<PlayerSide, Army>, nowMs: number = 0): void {
  const groups = new Map<string, { units: Unit[]; side: PlayerSide; category: string }>();

  for (const side of ["attacker", "defender"] as PlayerSide[]) {
    for (const unit of armies[side].units) {
      if (unit.status === "dead") continue;
      const category = getCategory(String(unit.cardId));
      const key = `${side}_${category}`;
      if (!groups.has(key)) groups.set(key, { units: [], side, category });
      groups.get(key)!.units.push(unit);
    }
  }

  const activeKeys = new Set<string>();

  for (const [key, { units, side, category }] of groups) {
    activeKeys.add(key);
    const visual = CATEGORY_VISUALS[category] ?? DEFAULT_VISUAL;
    const group = getOrCreateGroup(scene, key, visual, side);
    const count = Math.min(units.length, MAX_UNITS_PER_GROUP);

    for (let i = 0; i < count; i++) {
      const unit = units[i];
      const worldX = unit.position.x - 85;
      const worldZ = unit.position.y;
      const facing = unit.side === "attacker" ? 0 : Math.PI;
      const bob = unit.status === "moving" ? Math.abs(Math.sin((nowMs * 0.015) + i * 0.7)) * 0.28 : 0;
      const lungeT = unit.status === "attacking" ? Math.max(0, 1 - (nowMs - unit.lastAttackMs) / 220) : 0;
      const lunge = (unit.side === "attacker" ? 1 : -1) * lungeT * 0.9;
      const hitSquash = nowMs < unit.recentHitUntilMs ? 0.12 : 0;
      const baseY = visual.body.h * 0.5 + bob - hitSquash;
      const fo = formationOffset(unit, i, count);

      group.body.mesh.setMatrixAt(i, composeMatrix(worldX + fo.x + lunge, baseY, worldZ + fo.z, facing));
      if (group.head) {
        const headY = visual.body.h + visual.head.r + bob * 0.4;
        group.head.mesh.setMatrixAt(i, composeMatrix(worldX + fo.x + lunge * 0.6, headY, worldZ + fo.z, facing));
      }
      const attackTilt = unit.status === "attacking" ? -0.35 : 0;
      group.weapon.mesh.setMatrixAt(
        i,
        composeMatrix(
          worldX + fo.x + visual.weapon.offsetX * (unit.side === "attacker" ? 1 : -1) + lunge,
          visual.weapon.offsetY + baseY,
          worldZ + fo.z,
          facing + attackTilt,
        ),
      );
    }

    group.body.mesh.count = count;
    group.body.mesh.instanceMatrix.needsUpdate = true;
    if (group.head) {
      group.head.mesh.count = count;
      group.head.mesh.instanceMatrix.needsUpdate = true;
    }
    group.weapon.mesh.count = count;
    group.weapon.mesh.instanceMatrix.needsUpdate = true;
  }

  if (!hpBarGeometry) hpBarGeometry = new THREE.BoxGeometry(1, 0.25, 0.18);
  if (!hpBarMaterial) hpBarMaterial = new THREE.MeshStandardMaterial({ color: 0x66ff66, emissive: 0x113311 });
  if (!hpBarMesh) {
    hpBarMesh = new THREE.InstancedMesh(hpBarGeometry, hpBarMaterial, MAX_UNITS_PER_GROUP * 4);
    hpBarMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    hpBarMesh.frustumCulled = false;
    scene.add(hpBarMesh);
  }
  let hpBarCount = 0;
  for (const side of ["attacker", "defender"] as PlayerSide[]) {
    for (const unit of armies[side].units) {
      if (unit.status === "dead") continue;
      const showBar = unit.hp < unit.stats.maxHp || nowMs < unit.recentHitUntilMs;
      if (!showBar || hpBarCount >= MAX_UNITS_PER_GROUP * 4) continue;
      const ratio = Math.max(0.08, unit.hp / unit.stats.maxHp);
      const x = unit.position.x - 85;
      const z = unit.position.y;
      const y = 4.8;
      _matrix.makeScale(ratio * 2.2, 1, 1);
      _matrix.setPosition(x, y, z);
      hpBarMesh.setMatrixAt(hpBarCount++, _matrix);
    }
  }
  hpBarMesh.count = hpBarCount;
  hpBarMesh.instanceMatrix.needsUpdate = true;

  for (const [key, group] of meshGroups) {
    if (!activeKeys.has(key)) {
      group.body.mesh.count = 0;
      group.body.mesh.instanceMatrix.needsUpdate = true;
      if (group.head) {
        group.head.mesh.count = 0;
        group.head.mesh.instanceMatrix.needsUpdate = true;
      }
      group.weapon.mesh.count = 0;
      group.weapon.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

export function disposeUnitRenderer(scene: THREE.Scene): void {
  for (const [, group] of meshGroups) {
    scene.remove(group.body.mesh, group.weapon.mesh);
    group.body.geometry.dispose();
    group.body.material.dispose();
    group.weapon.geometry.dispose();
    group.weapon.material.dispose();
    if (group.head) {
      scene.remove(group.head.mesh);
      group.head.geometry.dispose();
      group.head.material.dispose();
    }
  }
  meshGroups.clear();
  if (hpBarMesh) {
    scene.remove(hpBarMesh);
    hpBarMesh = null;
  }
  if (hpBarGeometry) {
    hpBarGeometry.dispose();
    hpBarGeometry = null;
  }
  if (hpBarMaterial) {
    hpBarMaterial.dispose();
    hpBarMaterial = null;
  }
}
