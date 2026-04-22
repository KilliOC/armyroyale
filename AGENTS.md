# AGENTS.md — Army Royale (SDK v0.2.4)

## Project Structure

This is a standalone browser game built on `@lfg/mini-engine` v0.2.4, using **Vite + TypeScript**.

```
/
├── runtime/              ← immutable engine bundle (do NOT edit)
│   ├── mini.js
│   ├── mini.wasm
│   ├── mini.data
│   ├── components.js
│   └── mini_ecs.js
├── public/
│   └── assets/           ← GLB model files served at /assets/...
├── src/
│   ├── main.ts           ← Vite entry: loading screen + startGame()
│   └── gameplay/
│       ├── gameplay.ts         ← begin / tick / end hooks
│       ├── army_scene.ts       ← ArmyRoyaleScene class (3D rendering + input)
│       ├── army_simulation.ts  ← deterministic match simulation (no engine deps)
│       ├── shared_world.ts     ← shared constants, card definitions, camera params
│       └── game_components.ts  ← custom ECS component descriptors (empty for AR)
├── index.html            ← full UI (loading overlay, HUD, card tray, result overlay)
├── package.json          ← deps: @lfg/mini-engine@0.2.4, vite, typescript
├── vite.config.ts        ← Vite config with COOP/COEP headers + runtime plugin
├── tsconfig.json
├── vercel.json           ← Vercel deployment config (COOP/COEP headers, WASM types)
├── CLAUDE.md             ← quick reference
└── AGENTS.md             ← this file
```

## Dev Workflow

```bash
npm install          # install deps (first time or after package.json changes)
npm run dev          # Vite dev server at http://127.0.0.1:8000/
npm run build        # TypeScript check + Vite build → dist/
npx tsc --noEmit     # type-check only
```

Do NOT use `python3 dev_server.py` — this project uses Vite.

## SDK v0.2.4 API Reference

### Imports

```ts
// Math + asset helpers:
import { quatFromYawPitch, loadAssetFromUrl } from '@lfg/mini-engine';

// Procedural mesh builders (moved to subpath in v0.2.4):
import {
  createMeshBuilder, appendBox, appendSphere, appendCone, appendCylinder,
  appendCapsule, finalizeMesh, packColor,
  ensureRuntimeMaterial, registerRuntimeMesh, spawnRenderable, updateTransform,
} from '@lfg/mini-engine/procedural';

// Entry point / component registry:
import { startGame, registerGameplayComponents } from '@lfg/mini-engine';
import { createGameplayComponentLibrary } from '@lfg/mini-engine';
```

### ECS API (v0.2.4)

All ECS calls go through `Mini.ecs.*` and components are accessed via `Mini.Components.*`:

```ts
const eid = Mini.ecs.createEntity(sceneHandle);
Mini.ecs.addComponent(sceneHandle, eid, Mini.Components.MainCamera, {});
Mini.ecs.writeComponent(sceneHandle, eid, Mini.Components.Transform, {
  position: { x, y, z },
  rotation: { x, y, z, w },
  scale: { x: 1, y: 1, z: 1 },
});
const data = Mini.ecs.readComponent(sceneHandle, eid, Mini.Components.MeshRenderer);
```

**Removed in v0.2.4:** `ECS.createEntity`, `ECS.writeComponent`, `ECS.addComponent`, `ECS.readComponent`, `ECS.bindModule`, `bindMiniModule`.

### Camera Management

In v0.2.4, `writeComponent` returns `void` (no transform pointer). Store the entity id and re-call `writeComponent` each frame to move the camera:

```ts
const cameraEntityId = Mini.ecs.createEntity(sceneHandle);
Mini.ecs.addComponent(sceneHandle, cameraEntityId, Mini.Components.MainCamera, {});
// To move:
Mini.ecs.writeComponent(sceneHandle, cameraEntityId, Mini.Components.Transform, { position, rotation, scale });
```

### VFX Pool Entities

`spawnRenderable` still returns `{ entityId, transformPtr }`. Use `updateTransform(transformPtr, opts)` for fast per-frame updates of pooled VFX entities.

### GLB Loading

Assets live in `public/assets/` and are referenced as `/assets/<name>.glb`:

```ts
const result = await loadAssetFromUrl(Module, Mini, sceneHandle, '/assets/duckling_swarm.glb');
```

### Game Lifecycle

```ts
// src/main.ts
await registerGameplayComponents(gameplayComponents);
await startGame({ begin, tick, end });

// src/gameplay/gameplay.ts
export async function begin(Module, Mini, sceneHandle, assetScenes) { ... }
export function tick(Module, Mini, sceneHandle, dt) { ... }
export function end() { ... }
```

## Hosting Constraints

Cross-origin isolation headers are required (SharedArrayBuffer / WebGPU).

Required for Vercel / all deployments:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless` (or `require-corp`)
- `Cross-Origin-Resource-Policy: cross-origin`

These are set in both `vite.config.ts` (dev) and `vercel.json` (production).

## Files Agents Should NOT Edit

- `runtime/mini.js`, `runtime/mini.wasm`, `runtime/mini.data`
- `runtime/components.js`, `runtime/mini_ecs.js`, `runtime/mini_gameplay.js`

## LFG CLI

```bash
./lfg assets search "knight" --type MODEL_3D
./lfg assets download <id> -o ./public/assets/
./lfg login
```

Place downloaded GLBs in `public/assets/` so Vite serves them at `/assets/<name>.glb`.

## Runtime Mesh Size Limit

`registerRuntimeMesh` uses `Uint16Array` for indices — stay within 65 535 vertices per mesh. Split large environments into multiple smaller meshes.
