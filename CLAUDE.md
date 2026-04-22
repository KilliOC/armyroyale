# Army Royale — SDK v0.2.4

This project uses **Vite + TypeScript** with `@lfg/mini-engine` v0.2.4.

See [AGENTS.md](AGENTS.md) for full conventions, API reference, and workflow.

## Quick Reference

- **Start the dev server**: `npm run dev`
- **Open in browser**: `http://127.0.0.1:8000/`
- **Engine runtime** (do not edit): `runtime/`
- **Game source**: `src/gameplay/`
- **GLB assets**: `public/assets/` (served at `/assets/<name>.glb`)
- **Game entry point**: `src/main.ts` → `startGame({ begin, tick, end })`

## Build

```bash
npm install          # first time or after dependency changes
npm run dev          # Vite dev server
npm run build        # tsc + vite build → dist/
npx tsc --noEmit     # type check only
```

## Key Imports (v0.2.4)

```ts
// Math + asset helpers
import { quatFromYawPitch, loadAssetFromUrl } from '@lfg/mini-engine';

// Procedural mesh API (moved to subpath in v0.2.4)
import {
  createMeshBuilder, appendBox, finalizeMesh, packColor,
  ensureRuntimeMaterial, registerRuntimeMesh, spawnRenderable, updateTransform,
} from '@lfg/mini-engine/procedural';
```

## LFG CLI (Assets & Auth)

```bash
./lfg assets search "knight" --type MODEL_3D   # search 3D models (free)
./lfg assets download <id> -o ./public/assets/ # download to public/assets/
./lfg assets generate "dragon" --type MODEL_3D --wait
./lfg login
```
