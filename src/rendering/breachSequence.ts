import * as THREE from "three";
import type { WallState, WallSegmentType, Lane } from "../simulation/types";
import type { CameraRig } from "./cameraRig";
import { VFXSystem } from "./vfx";

// ─── Constants ────────────────────────────────────────────────────────

/** X position of the defender wall in world space */
const WALL_X = 75;

/** Lane Z positions (upper, center, lower) */
const LANE_Z: Record<Lane, number> = {
  upper: -16,
  center: 0,
  lower: 16,
};

/** Wall height */
const WALL_HEIGHT = 10;

/** Number of crack meshes per segment (layered planes) */
const CRACKS_PER_SEGMENT = 3;

// ─── Crack overlay ────────────────────────────────────────────────────

/**
 * Visual crack overlays drawn on wall segments as HP decreases.
 * Uses semi-transparent dark planes to simulate cracks.
 */
interface SegmentVisuals {
  cracks: THREE.Mesh[];
  debris: THREE.Mesh[];
}

function buildCrackMeshes(
  scene: THREE.Scene,
  segType: WallSegmentType,
): THREE.Mesh[] {
  const lane: Lane = segType === "gate" ? "center" : (segType as Lane);
  const z = LANE_Z[lane];
  const meshes: THREE.Mesh[] = [];

  for (let i = 0; i < CRACKS_PER_SEGMENT; i++) {
    const geo = new THREE.PlaneGeometry(
      2 + Math.random() * 4,
      3 + Math.random() * 3,
    );
    const mat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    // Scatter cracks across the wall face
    mesh.position.set(
      WALL_X + 0.1,
      WALL_HEIGHT * 0.3 + (i / CRACKS_PER_SEGMENT) * WALL_HEIGHT * 0.5,
      z + (Math.random() - 0.5) * 10,
    );
    // Random tilt to look like fracture lines
    mesh.rotation.z = (Math.random() - 0.5) * 0.6;
    mesh.rotation.y = Math.PI / 2;
    scene.add(mesh);
    meshes.push(mesh);
  }
  return meshes;
}

function buildDebrisMeshes(
  scene: THREE.Scene,
  segType: WallSegmentType,
): THREE.Mesh[] {
  const lane: Lane = segType === "gate" ? "center" : (segType as Lane);
  const z = LANE_Z[lane];
  const meshes: THREE.Mesh[] = [];

  for (let i = 0; i < 8; i++) {
    const size = 0.5 + Math.random() * 1.5;
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      WALL_X + (Math.random() - 0.5) * 6,
      WALL_HEIGHT * 0.1,
      z + (Math.random() - 0.5) * 12,
    );
    mesh.visible = false;
    scene.add(mesh);
    meshes.push(mesh);
  }
  return meshes;
}

// ─── Breach Sequence ──────────────────────────────────────────────────

/**
 * Manages breach visuals: crack progression, explosion, debris, and camera.
 *
 * Usage:
 *  1. Call `updateCracks(wallState)` every frame during battle
 *  2. Call `triggerBreach(lane, onComplete)` when a segment reaches 0 HP
 */
export class BreachSequence {
  private scene: THREE.Scene;
  private rig: CameraRig;
  private vfx: VFXSystem;

  private segmentVisuals: Record<WallSegmentType, SegmentVisuals> = {
    upper: { cracks: [], debris: [] },
    gate: { cracks: [], debris: [] },
    lower: { cracks: [], debris: [] },
  };

  private activeAnimations: Array<() => boolean> = [];
  private breachTriggered = new Set<WallSegmentType>();

  constructor(scene: THREE.Scene, rig: CameraRig) {
    this.scene = scene;
    this.rig = rig;
    this.vfx = new VFXSystem(scene);

    // Build crack and debris meshes for all three segments
    for (const segType of ["upper", "gate", "lower"] as WallSegmentType[]) {
      this.segmentVisuals[segType] = {
        cracks: buildCrackMeshes(scene, segType),
        debris: buildDebrisMeshes(scene, segType),
      };
    }
  }

  // ── Public API ──

  /**
   * Call every frame with current wall state.
   * Updates crack opacity based on HP ratio.
   */
  updateCracks(wallState: WallState): void {
    for (const segType of ["upper", "gate", "lower"] as WallSegmentType[]) {
      const seg = wallState.segments[segType];
      const hpRatio = seg.hp / seg.maxHp;
      const damage = 1 - hpRatio; // 0 = intact, 1 = destroyed

      const visuals = this.segmentVisuals[segType];
      for (let i = 0; i < visuals.cracks.length; i++) {
        const mat = visuals.cracks[i].material as THREE.MeshBasicMaterial;
        // Cracks become visible progressively as HP falls below 75%
        const threshold = 0.75 - i * 0.2;
        if (damage > threshold) {
          const t = Math.min(1, (damage - threshold) / 0.25);
          mat.opacity = t * (0.4 + i * 0.15);
        } else {
          mat.opacity = 0;
        }
      }
    }
  }

  /**
   * Trigger the full breach sequence for a wall segment.
   * Plays debris, smoke, camera emphasis, and calls `onComplete` when done.
   */
  triggerBreach(lane: Lane, onComplete?: () => void): void {
    const segType: WallSegmentType =
      lane === "center" ? "gate" : (lane as WallSegmentType);

    if (this.breachTriggered.has(segType)) return;
    this.breachTriggered.add(segType);

    const z = LANE_Z[lane];
    const origin = new THREE.Vector3(WALL_X, WALL_HEIGHT * 0.5, z);

    // 1. Show debris
    const visuals = this.segmentVisuals[segType];
    for (const debris of visuals.debris) {
      debris.visible = true;
      // Give each piece a random throw velocity
      const dx = (Math.random() - 0.5) * 8;
      const dy = 3 + Math.random() * 5;
      const dz = (Math.random() - 0.5) * 8;
      const vel = new THREE.Vector3(dx, dy, dz);
      let debrisLife = 0;
      const maxDebrisLife = 2.0;

      // Animate debris falling
      this.activeAnimations.push(() => {
        debrisLife += 0.016;
        vel.y -= 9.8 * 0.016;
        debris.position.addScaledVector(vel, 0.016);
        debris.rotation.x += vel.x * 0.1;
        debris.rotation.z += vel.z * 0.1;
        if (debrisLife >= maxDebrisLife) {
          debris.visible = false;
          return true; // done
        }
        return false;
      });
    }

    // 2. Smoke bursts
    for (let i = 0; i < 5; i++) {
      const burstPos = origin
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 8,
          ),
        );
      this.vfx.emitDeathSmoke(burstPos);
    }

    // 3. Clash sparks
    this.vfx.emitClash(origin);

    // 4. Camera zoom toward breach with dramatic timing
    this.rig.transitionTo("breach", 800, () => {
      // Hold on breach for 2 seconds, then transition to overview
      setTimeout(() => {
        this.rig.transitionTo("overview", 2000, onComplete);
      }, 2000);
    });
  }

  /**
   * Update animations. Call every frame with delta time in seconds.
   */
  update(dt: number): void {
    this.vfx.update(dt);

    // Tick debris animations, remove completed ones
    this.activeAnimations = this.activeAnimations.filter((anim) => !anim());
  }

  /** Clean up scene objects */
  dispose(): void {
    for (const segType of ["upper", "gate", "lower"] as WallSegmentType[]) {
      const visuals = this.segmentVisuals[segType];
      for (const mesh of [...visuals.cracks, ...visuals.debris]) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    }
    this.vfx.dispose(this.scene);
  }
}
