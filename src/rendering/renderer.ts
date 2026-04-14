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

function animate(now: number) {
  frameId = requestAnimationFrame(animate);
  if (renderer?.getContext().isContextLost()) return;

  const deltaMs = now - lastTime;
  lastTime = now;

  // Game logic callback (simulation, unit rendering, VFX)
  frameCallback?.(deltaMs);

  // Update camera transitions
  rig?.update(deltaMs);

  if (renderer && scene && rig) {
    renderer.render(scene, rig.camera);
  }
}

/** Detect iOS for targeted workarounds */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function initRenderer(canvas: HTMLCanvasElement) {
  const ios = isIOS();

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !ios,
      powerPreference: "default",
      failIfMajorPerformanceCaveat: false,
    });
  } catch (e) {
    console.error("[ArmyRoyale] WebGL init failed:", e);
    // Show fallback message instead of black screen
    canvas.style.display = "none";
    const msg = document.createElement("div");
    msg.style.cssText = "position:fixed;inset:0;display:grid;place-items:center;color:#fff;font:bold 20px sans-serif;background:#111;";
    msg.textContent = "WebGL not available on this device.";
    document.body.appendChild(msg);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, ios ? 2 : 2));
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  renderer.setSize(vw, vh);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // Handle WebGL context loss (iOS kills contexts aggressively)
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(frameId);
    console.warn("[ArmyRoyale] WebGL context lost");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    console.warn("[ArmyRoyale] WebGL context restored — restarting render loop");
    lastTime = performance.now();
    frameId = requestAnimationFrame(animate);
  });

  const created = createScene(ios);
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
