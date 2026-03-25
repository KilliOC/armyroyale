import * as THREE from "three";

/** Creates the base scene with camera, lights, and a ground plane. */
export function createScene() {
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000,
  );
  camera.position.set(0, 30, 50);
  camera.lookAt(0, 0, 0);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(50, 100, 50);
  scene.add(sun);

  // Ground plane placeholder
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x3a5f0b }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Grid helper for visual reference
  const grid = new THREE.GridHelper(200, 40, 0x555555, 0x333333);
  grid.position.y = 0.01;
  scene.add(grid);

  return { scene, camera };
}
