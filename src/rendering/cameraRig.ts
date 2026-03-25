import * as THREE from "three";

// ─── Shot presets ────────────────────────────────────────────────────

/**
 * Named camera shots for event-driven transitions.
 * Each defines position, lookAt target, and FOV.
 */
export interface CameraShot {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

/** Preset library — add shots here as gameplay events are built */
export const SHOTS = {
  /** Default strategic overview — both fortresses visible */
  overview: {
    position: new THREE.Vector3(0, 75, 80),
    target: new THREE.Vector3(0, 0, 0),
    fov: 50,
  },

  /** Tighter battle view — closer to the center action */
  battleClose: {
    position: new THREE.Vector3(0, 35, 45),
    target: new THREE.Vector3(0, 0, 0),
    fov: 60,
  },

  /** Wall approach — camera pushes toward defender fortress */
  wallApproach: {
    position: new THREE.Vector3(40, 35, 50),
    target: new THREE.Vector3(75, 5, 0),
    fov: 45,
  },

  /** Breach moment — dramatic low angle at the gate */
  breach: {
    position: new THREE.Vector3(60, 15, 25),
    target: new THREE.Vector3(85, 8, 0),
    fov: 60,
  },

  /** Blue fortress deploy — attacker side focus */
  blueDeployment: {
    position: new THREE.Vector3(-50, 50, 60),
    target: new THREE.Vector3(-70, 0, 0),
    fov: 50,
  },

  /** Red fortress deploy — defender side focus */
  redDeployment: {
    position: new THREE.Vector3(50, 50, 60),
    target: new THREE.Vector3(70, 0, 0),
    fov: 50,
  },
} as const satisfies Record<string, CameraShot>;

export type ShotName = keyof typeof SHOTS;

// ─── Easing ──────────────────────────────────────────────────────────

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Camera Rig ──────────────────────────────────────────────────────

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;

  /** Current interpolation state */
  private fromPos = new THREE.Vector3();
  private fromTarget = new THREE.Vector3();
  private fromFov = 50;

  private toPos = new THREE.Vector3();
  private toTarget = new THREE.Vector3();
  private toFov = 50;

  /** Transition progress: 1 = arrived */
  private progress = 1;
  private durationMs = 0;
  private elapsedMs = 0;

  /** Internal lookAt target (not exposed on camera directly) */
  private currentTarget = new THREE.Vector3();

  /** Callback when a transition completes */
  private onComplete: (() => void) | null = null;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 500);
    this.applyShot(SHOTS.overview, 0);
  }

  // ── Public API ──

  /**
   * Instantly snap to a shot (no transition).
   */
  snapTo(name: ShotName): void {
    this.applyShot(SHOTS[name], 0);
  }

  /**
   * Smoothly transition to a named shot.
   * @param name    Shot preset name
   * @param durationMs  Transition time in ms (0 = instant)
   * @param onComplete  Optional callback when transition finishes
   */
  transitionTo(
    name: ShotName,
    durationMs = 1500,
    onComplete?: () => void,
  ): void {
    this.applyShot(SHOTS[name], durationMs, onComplete);
  }

  /**
   * Smoothly transition to an arbitrary shot (not in presets).
   */
  transitionToCustom(
    shot: CameraShot,
    durationMs = 1500,
    onComplete?: () => void,
  ): void {
    this.applyShot(shot, durationMs, onComplete);
  }

  /**
   * Call every frame with deltaTime in ms.
   * Returns true if the camera moved this frame.
   */
  update(deltaMs: number): boolean {
    if (this.progress >= 1) return false;

    this.elapsedMs = Math.min(this.elapsedMs + deltaMs, this.durationMs);
    this.progress = this.durationMs > 0
      ? easeInOutCubic(this.elapsedMs / this.durationMs)
      : 1;

    // Interpolate position
    this.camera.position.lerpVectors(this.fromPos, this.toPos, this.progress);

    // Interpolate target
    this.currentTarget.lerpVectors(this.fromTarget, this.toTarget, this.progress);
    this.camera.lookAt(this.currentTarget);

    // Interpolate FOV
    this.camera.fov = THREE.MathUtils.lerp(this.fromFov, this.toFov, this.progress);
    this.camera.updateProjectionMatrix();

    if (this.progress >= 1 && this.onComplete) {
      const cb = this.onComplete;
      this.onComplete = null;
      cb();
    }

    return true;
  }

  /**
   * Whether a transition is currently active.
   */
  get isTransitioning(): boolean {
    return this.progress < 1;
  }

  /**
   * Handle viewport resize.
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  // ── Internal ──

  private applyShot(
    shot: CameraShot,
    durationMs: number,
    onComplete?: () => void,
  ): void {
    // Capture current state as "from"
    this.fromPos.copy(this.camera.position);
    this.fromTarget.copy(this.currentTarget);
    this.fromFov = this.camera.fov;

    // Set destination
    this.toPos.copy(shot.position);
    this.toTarget.copy(shot.target);
    this.toFov = shot.fov;

    this.durationMs = durationMs;
    this.elapsedMs = 0;
    this.progress = durationMs > 0 ? 0 : 1;
    this.onComplete = onComplete ?? null;

    // If instant, apply immediately
    if (durationMs <= 0) {
      this.camera.position.copy(shot.position);
      this.currentTarget.copy(shot.target);
      this.camera.lookAt(shot.target);
      this.camera.fov = shot.fov;
      this.camera.updateProjectionMatrix();
    }
  }
}
