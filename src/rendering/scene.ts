import * as THREE from "three";
import { createBattlefield } from "./battlefield";
import { CameraRig } from "./cameraRig";

/**
 * Creates the base scene with battlefield, camera rig, and lighting.
 * Camera rig starts in "overview" shot — elevated landscape framing
 * showing both fortresses with the open field between them.
 */
export function createScene() {
  const scene = new THREE.Scene();
  // Fog pushed far out so battlefield units are never obscured
  scene.fog = new THREE.Fog(0x87a96b, 250, 400);

  // ── Sky background ──
  scene.background = new THREE.Color(0x87ceeb);

  // ── Camera rig ──
  const cameraRig = new CameraRig(window.innerWidth / window.innerHeight);

  // ── Lighting ──
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x4a7c2e, 0.3);
  scene.add(hemi);

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

  return { scene, cameraRig };
}
