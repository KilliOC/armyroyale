import * as THREE from "three";
import { createScene } from "./scene";
import type { CameraRig } from "./cameraRig";

let renderer: THREE.WebGLRenderer | null = null;
let rig: CameraRig | null = null;
let frameId = 0;
let resizeHandler: (() => void) | null = null;
let lastTime = 0;

export function initRenderer(canvas: HTMLCanvasElement) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const { scene, cameraRig } = createScene();
  rig = cameraRig;

  resizeHandler = () => {
    if (!renderer || !rig) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    rig.resize(w, h);
  };
  window.addEventListener("resize", resizeHandler);

  lastTime = performance.now();

  const animate = (now: number) => {
    frameId = requestAnimationFrame(animate);
    const deltaMs = now - lastTime;
    lastTime = now;

    // Update camera transitions
    rig!.update(deltaMs);

    renderer!.render(scene, rig!.camera);
  };
  frameId = requestAnimationFrame(animate);
}

export function disposeRenderer() {
  cancelAnimationFrame(frameId);
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  renderer?.dispose();
  renderer = null;
  rig = null;
}

/**
 * Access the active camera rig (e.g. from game state transitions).
 * Returns null if renderer hasn't been initialized.
 */
export function getCameraRig(): CameraRig | null {
  return rig;
}
