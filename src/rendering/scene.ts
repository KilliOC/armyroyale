import * as THREE from "three";
import { createBattlefield } from "./battlefield";

/**
 * Creates the base scene with battlefield, camera, and lighting.
 * Camera is positioned for a mobile-landscape top-down-ish view
 * that shows both fortresses with the open field between them.
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87a96b, 150, 250);

  // ── Sky background ──
  scene.background = new THREE.Color(0x87ceeb);

  // ── Camera ──
  // Elevated perspective looking slightly down at the field center.
  // Tuned for ~16:9 landscape mobile framing.
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    500,
  );
  // High and back, angled down to frame both fortresses
  camera.position.set(0, 75, 80);
  camera.lookAt(0, 0, 0);

  // ── Lighting ──
  // Ambient fill
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  // Hemisphere for sky/ground color bleed
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x4a7c2e, 0.3);
  scene.add(hemi);

  // Main directional (sun) with shadows
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.0);
  sun.position.set(40, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // ── Battlefield ──
  scene.add(createBattlefield());

  return { scene, camera };
}
