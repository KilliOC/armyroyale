import * as THREE from "three";
import type { FrontLineState } from "../simulation/types/frontLine";
import type { Lane } from "../simulation/types";

// Lane Z positions matching orchestrator worldPos
const LANE_Z: Record<Lane, number> = { upper: -16, center: 0, lower: 16 };
const LANE_ORDER: Lane[] = ["upper", "center", "lower"];

let lineMeshes: THREE.Mesh[] | null = null;
let pulseTime = 0;

/** Creates a glowing front-line marker in each lane and adds it to the scene. */
export function createFrontLineVisual(scene: THREE.Scene): void {
  if (lineMeshes) return;
  lineMeshes = [];

  for (const lane of LANE_ORDER) {
    const geo = new THREE.BoxGeometry(0.35, 14, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffee88,
      emissive: 0xffee88,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.55,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 7, LANE_Z[lane]);
    mesh.frustumCulled = false;
    scene.add(mesh);
    lineMeshes.push(mesh);
  }
}

/** Updates front-line mesh positions and pulsing glow each frame. */
export function updateFrontLineVisual(frontLineState: FrontLineState): void {
  if (!lineMeshes) return;
  pulseTime += 0.016; // ~60fps cadence
  const pulse = 0.45 + 0.35 * Math.sin(pulseTime * 3.5);

  const positions = [
    frontLineState.segments.upper.position,
    frontLineState.segments.center.position,
    frontLineState.segments.lower.position,
  ];

  lineMeshes.forEach((mesh, i) => {
    // frontLine.position is 0..1 → sim tile X 0..170 → world X = tileX - 85
    const worldX = positions[i] * 170 - 85;
    mesh.position.x = worldX;
    (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    (mesh.material as THREE.MeshStandardMaterial).opacity = 0.35 + 0.25 * pulse;
  });
}

/** Removes front-line meshes from the scene and disposes resources. */
export function disposeFrontLineVisual(scene: THREE.Scene): void {
  if (!lineMeshes) return;
  for (const mesh of lineMeshes) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.MeshStandardMaterial).dispose();
  }
  lineMeshes = null;
  pulseTime = 0;
}
