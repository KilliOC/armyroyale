import * as THREE from "three";
import { createScene } from "./scene";
import type { CameraRig } from "./cameraRig";

let renderer: THREE.WebGLRenderer | null = null;
let rig: CameraRig | null = null;
let scene: THREE.Scene | null = null;
let frameId = 0;
let resizeHandler: (() => void) | null = null;
let lastTime = 0;
let frameCallback: ((dtMs: number) => void) | null = null;

export function initRenderer(canvas: HTMLCanvasElement) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const created = createScene();
  scene = created.scene;
  rig = created.cameraRig;

  resizeHandler = () => {
    if (!renderer || !rig) return;
    // Use visualViewport when available (mobile-safe)
    const w = window.visualViewport?.width ?? window.innerWidth;
    const h = window.visualViewport?.height ?? window.innerHeight;
    renderer.setSize(w, h);
    rig.resize(w, h);
  };
  window.addEventListener("resize", resizeHandler);
  window.addEventListener("orientationchange", () => {
    // Delay to let the browser settle after rotation
    setTimeout(resizeHandler!, 200);
  });
  // Also listen to visualViewport resize (mobile browser chrome show/hide)
  window.visualViewport?.addEventListener("resize", resizeHandler);

  lastTime = performance.now();

  const animate = (now: number) => {
    frameId = requestAnimationFrame(animate);
    const deltaMs = now - lastTime;
    lastTime = now;

    // Game logic callback (simulation, unit rendering, VFX)
    frameCallback?.(deltaMs);

    // Update camera transitions
    rig!.update(deltaMs);

    renderer!.render(scene!, rig!.camera);
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
  scene = null;
  frameCallback = null;
}

/** Get the active Three.js scene (e.g. for unit rendering and VFX). */
export function getScene(): THREE.Scene | null {
  return scene;
}

/** Register a callback invoked each animation frame with delta time in ms. */
export function setFrameCallback(cb: ((dtMs: number) => void) | null): void {
  frameCallback = cb;
}

/**
 * Access the active camera rig (e.g. from game state transitions).
 * Returns null if renderer hasn't been initialized.
 */
export function getCameraRig(): CameraRig | null {
  return rig;
}
