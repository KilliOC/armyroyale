import * as THREE from "three";
import { createScene } from "./scene";

let renderer: THREE.WebGLRenderer | null = null;
let frameId = 0;

export function initRenderer(canvas: HTMLCanvasElement) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x1a1a2e);

  const { scene, camera } = createScene();

  const onResize = () => {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", onResize);

  const animate = () => {
    frameId = requestAnimationFrame(animate);
    renderer!.render(scene, camera);
  };
  animate();
}

export function disposeRenderer() {
  cancelAnimationFrame(frameId);
  renderer?.dispose();
  renderer = null;
}
