import * as THREE from "three";

// ─── Constants ────────────────────────────────────────────────────────

const MAX_DUST_PARTICLES = 512;
const MAX_CLASH_PARTICLES = 256;
const MAX_SMOKE_PARTICLES = 256;

// ─── Particle helpers ─────────────────────────────────────────────────

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;     // remaining life in seconds
  maxLife: number;  // total life in seconds
  active: boolean;
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    life: 0,
    maxLife: 1,
    active: false,
  }));
}

function activateParticle(
  p: Particle,
  origin: THREE.Vector3,
  vel: THREE.Vector3,
  life: number,
): void {
  p.position.copy(origin);
  p.velocity.copy(vel);
  p.life = life;
  p.maxLife = life;
  p.active = true;
}

// Build a reusable Points object backed by a Float32Array
function buildPoints(
  count: number,
  color: THREE.Color,
  size: number,
): { points: THREE.Points; positions: Float32Array } {
  const positions = new Float32Array(count * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, positions };
}

// ─── VFX System ───────────────────────────────────────────────────────

/**
 * Lightweight particle VFX system for Army Royale.
 *
 * Three pools:
 *  - dust  : marching dust from advancing units (tan/brown)
 *  - clash : spark flashes on unit collision (yellow/white)
 *  - smoke : smoke/poof on unit death (grey)
 */
export class VFXSystem {
  private dustParticles: Particle[];
  private clashParticles: Particle[];
  private smokeParticles: Particle[];

  private dustPoints: THREE.Points;
  private dustPositions: Float32Array;

  private clashPoints: THREE.Points;
  private clashPositions: Float32Array;

  private smokePoints: THREE.Points;
  private smokePositions: Float32Array;

  private dustHead = 0;
  private clashHead = 0;
  private smokeHead = 0;

  constructor(scene: THREE.Scene) {
    this.dustParticles = makeParticles(MAX_DUST_PARTICLES);
    this.clashParticles = makeParticles(MAX_CLASH_PARTICLES);
    this.smokeParticles = makeParticles(MAX_SMOKE_PARTICLES);

    const dustBuild = buildPoints(
      MAX_DUST_PARTICLES,
      new THREE.Color(0xc2a26e),
      0.6,
    );
    this.dustPoints = dustBuild.points;
    this.dustPositions = dustBuild.positions;

    const clashBuild = buildPoints(
      MAX_CLASH_PARTICLES,
      new THREE.Color(0xffee88),
      0.8,
    );
    this.clashPoints = clashBuild.points;
    this.clashPositions = clashBuild.positions;

    const smokeBuild = buildPoints(
      MAX_SMOKE_PARTICLES,
      new THREE.Color(0x888888),
      1.2,
    );
    this.smokePoints = smokeBuild.points;
    this.smokePositions = smokeBuild.positions;

    scene.add(this.dustPoints, this.clashPoints, this.smokePoints);
  }

  // ── Emitters ──

  /**
   * Emit marching dust at a unit's position.
   * Call each frame for moving units (rate-limited by caller).
   */
  emitDust(origin: THREE.Vector3): void {
    const idx = this.dustHead % MAX_DUST_PARTICLES;
    const p = this.dustParticles[idx];
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 1.2 + 0.3,
      (Math.random() - 0.5) * 0.5,
    );
    activateParticle(p, origin, vel, 0.6 + Math.random() * 0.4);
    this.dustHead++;
  }

  /**
   * Burst of spark particles at a clash point.
   * Call once per clash event.
   */
  emitClash(origin: THREE.Vector3): void {
    const count = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const idx = this.clashHead % MAX_CLASH_PARTICLES;
      const p = this.clashParticles[idx];
      const speed = 2 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      const elev = Math.random() * Math.PI * 0.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elev) * speed,
        Math.sin(elev) * speed,
        Math.sin(angle) * Math.cos(elev) * speed,
      );
      activateParticle(p, origin, vel, 0.2 + Math.random() * 0.3);
      this.clashHead++;
    }
  }

  /**
   * Death smoke burst at a unit's last position.
   * Call once when unit hp drops to 0.
   */
  emitDeathSmoke(origin: THREE.Vector3): void {
    const count = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const idx = this.smokeHead % MAX_SMOKE_PARTICLES;
      const p = this.smokeParticles[idx];
      const speed = 0.5 + Math.random() * 1.5;
      const angle = Math.random() * Math.PI * 2;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed * 0.5,
        0.5 + Math.random() * 2,
        Math.sin(angle) * speed * 0.5,
      );
      activateParticle(p, origin, vel, 0.8 + Math.random() * 0.6);
      this.smokeHead++;
    }
  }

  // ── Update ──

  /**
   * Advance all particles and upload positions to GPU.
   * @param dt Delta time in seconds.
   */
  update(dt: number): void {
    this.tickPool(
      this.dustParticles,
      this.dustPositions,
      MAX_DUST_PARTICLES,
      dt,
    );
    this.tickPool(
      this.clashParticles,
      this.clashPositions,
      MAX_CLASH_PARTICLES,
      dt,
    );
    this.tickPool(
      this.smokeParticles,
      this.smokePositions,
      MAX_SMOKE_PARTICLES,
      dt,
    );

    // Upload updated positions
    (
      this.dustPoints.geometry.attributes.position as THREE.BufferAttribute
    ).needsUpdate = true;
    (
      this.clashPoints.geometry.attributes.position as THREE.BufferAttribute
    ).needsUpdate = true;
    (
      this.smokePoints.geometry.attributes.position as THREE.BufferAttribute
    ).needsUpdate = true;

    // Fade opacity based on overall pool activity (simple approximation)
    this.updateOpacity(this.dustPoints, this.dustParticles);
    this.updateOpacity(this.clashPoints, this.clashParticles);
    this.updateOpacity(this.smokePoints, this.smokeParticles);
  }

  private tickPool(
    particles: Particle[],
    positions: Float32Array,
    max: number,
    dt: number,
  ): void {
    for (let i = 0; i < max; i++) {
      const p = particles[i];
      if (!p.active) {
        // Park off-screen
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
        continue;
      }

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        positions[i * 3 + 1] = -1000;
        continue;
      }

      // Integrate velocity with gravity for smoke/dust
      p.velocity.y -= 0.5 * dt; // gentle gravity
      p.position.addScaledVector(p.velocity, dt);

      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
    }
  }

  private updateOpacity(points: THREE.Points, particles: Particle[]): void {
    const mat = points.material as THREE.PointsMaterial;
    const active = particles.filter((p) => p.active);
    if (active.length === 0) {
      mat.opacity = 0;
      return;
    }
    // Average life ratio gives a smooth fade
    const avgRatio =
      active.reduce((s, p) => s + p.life / p.maxLife, 0) / active.length;
    mat.opacity = Math.min(1, avgRatio * 1.5);
  }

  // ── Disposal ──

  dispose(scene: THREE.Scene): void {
    scene.remove(this.dustPoints, this.clashPoints, this.smokePoints);
    this.dustPoints.geometry.dispose();
    (this.dustPoints.material as THREE.PointsMaterial).dispose();
    this.clashPoints.geometry.dispose();
    (this.clashPoints.material as THREE.PointsMaterial).dispose();
    this.smokePoints.geometry.dispose();
    (this.smokePoints.material as THREE.PointsMaterial).dispose();
  }
}
