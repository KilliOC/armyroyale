import * as THREE from "three";
import { createScene } from "./scene";

let renderer: THREE.WebGLRenderer | null = null;
let frameId = 0;
let resizeHandler: (() => void) | null = null;

export function initRenderer(canvas: HTMLCanvasElement) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const { scene, camera } = createScene();

  resizeHandler = () => {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resizeHandler);

  const animate = () => {
    frameId = requestAnimationFrame(animate);
    renderer!.render(scene, camera);
  };
  animate();
}

export function disposeRenderer() {
  cancelAnimationFrame(frameId);
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  renderer?.dispose();
  renderer = null;
}
