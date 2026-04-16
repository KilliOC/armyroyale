# Mini WASM SDK

This is the working directory for building browser-based games with the mini engine.

See [AGENTS.md](AGENTS.md) for all project conventions, constraints, and the recommended workflow.

## Quick Reference

- **Start the dev server**: `python3 dev_server.py`
- **Open in browser**: `http://127.0.0.1:8000/games/<game-name>/`
- **Engine runtime** (do not edit): `runtime/`
- **SDK package**: `@lfg/mini-engine` (build it first, then use the built package artifacts)
- **Game folders**: Each game goes in `games/<game-name>/` (not the SDK root)
- **Game entry point**: `startGame({ begin, tick, end })`

## Package References

- **Bundled runtime**: `node_modules/@lfg/mini-engine/dist/lfg-mini-engine.js`
- **Exported types**: `node_modules/@lfg/mini-engine/dist/index.d.ts`
- **Starter template**: `node_modules/@lfg/mini-engine/template/`
- **Live game example**: `games/city-car/` (procedural city, car physics, chase camera)

## Imports

All game code imports from `@lfg/mini-engine`:

```js
import {
  startGame,
  vec3, quat, forwardFromYaw, rightFromYaw,
  createMeshBuilder, appendBox, finalizeMesh, packColor,
  ensureRuntimeMaterial, registerRuntimeMesh, spawnRenderable,
} from "@lfg/mini-engine";
```

In standalone SDK mode, `startGame(...)` is the default path. Create cameras, lights, and entities inside `begin(...)` rather than manually booting `Mini.renderer`.

## LFG CLI (Assets & Auth)

```bash
./lfg assets search "knight" --type MODEL_3D   # search 3D models (free)
./lfg assets search "walk" --type ANIMATION    # search animations
./lfg assets generate "dragon" --type MODEL_3D  # generate with AI (needs login)
./lfg assets download <id> -o ./assets/         # download asset file
./lfg login                                     # sign in to LFG platform
```

See [AGENTS.md](AGENTS.md) for full CLI documentation.
