# AGENTS.md

## Package

This folder is the standalone WASM SDK for the `mini` engine, designed to work with Claude Code, Codex, or any AI coding agent. The same `@lfg/mini-engine` SDK package powers both this standalone environment and the LFG editor platform.

## Primary Goal

Build browser-based games around the packaged runtime in `runtime/` without modifying the engine bundle itself unless the user explicitly asks for engine work.

For new standalone games, keep the packaged multiplayer-compatible structure by
default even when the first playable mode is offline/local-only. Do not collapse
transport/session/shared-world responsibilities into one large gameplay file
unless the user explicitly asks for a throwaway single-file prototype.

This SDK is package-first, not monorepo-source-first. Build `@lfg/mini-engine` and use the built npm package as the reference point for standalone authoring. Do not rely on monorepo-relative `../packages/lfg-mini-engine/...` paths in instructions or generated games.

`packages/lfg-mini-engine/` is the single source of truth for the standalone
template and helper API surface. Do not treat `ai-mini-engine` as a second copy
of those files.

Standalone benchmark/sync/replay tooling belongs under
`packages/mini-tools/`. Do not create duplicate consumer test/open/sync scripts
under `sdk/`, under `packages/lfg-mini-engine/`, or in the old engine repo
flow.

## SDK Layout

```
sdk/
├── runtime/              ← immutable engine bundle (do NOT edit)
│   ├── mini.js
│   ├── mini.wasm
│   ├── mini.data
│   ├── components.js
│   └── ecs_c_api_gen.js
├── assets/engine/        ← symlink to engine dir (for @lfg/mini-engine boot)
├── node_modules/
│   └── @lfg/mini-engine/ ← installed SDK package (dist/ + template/)
├── package.json          ← local package boundary for standalone SDK work
├── dev_server.py         ← local server with required headers
├── CLAUDE.md             ← quick reference
├── AGENTS.md             ← this file
└── games/
    └── <game-name>/      ← each game in its own folder
        ├── index.html
        ├── main.js
        ├── transport.js
        ├── session.js
        ├── starter_scene.js
        └── shared_world.js
```

## Standalone Starter Template

Before creating or editing any SDK game, first inspect the installed package artifacts that define the supported standalone workflow:

- Read `node_modules/@lfg/mini-engine/template/index.html`
- Read `node_modules/@lfg/mini-engine/template/main.js`
- Read `node_modules/@lfg/mini-engine/template/transport.js`
- Read `node_modules/@lfg/mini-engine/template/session.js`
- Read `node_modules/@lfg/mini-engine/template/starter_scene.js`
- Read `node_modules/@lfg/mini-engine/template/shared_world.js`
- Read at least one relevant file from `node_modules/@lfg/mini-engine/docs/` or `node_modules/@lfg/mini-engine/examples/`
- For animated characters, read `node_modules/@lfg/mini-engine/docs/animation.md`
- For external `idle.glb` / `walk.glb` style animation assets, do not stop at loading stub scenes: instantiate the animation assets into the active scene, resolve clip hashes via `Mini.runtime.listAnimationClips(sceneHandle)`, and apply `SkeletonAnimation` to the correct animated entity or character subtree.
- When traversing imported GLB hierarchies, remember that Mini ECS uses `0xffffffff` as the invalid entity sentinel and entity id `0` is valid.

Do this before writing game code, so new work starts from the packaged starter and documented API contract rather than ad hoc scaffolding.

Use the `template/` directory shipped with the built `@lfg/mini-engine` npm package as the canonical standalone starter. In a local dev install this will typically be available as:

```text
node_modules/@lfg/mini-engine/template/
├── index.html
├── main.js
├── transport.js
├── local_transport.js
├── spacetimedb_transport.js
├── session.js
├── starter_scene.js
├── shared_world.js
└── spacetimedb_module/
```

- `index.html` defines the host page and import map shape.
- `main.js` is the supported `startGame({ begin, tick, end })` entry.
- `transport.js` chooses the transport implementation.
- `session.js` owns snapshot/session flow.
- `starter_scene.js` holds rendering and presentation.
- `shared_world.js` holds deterministic shared constants/layout.
- `spacetimedb_transport.js` is the one official online multiplayer transport.
- `spacetimedb_module/` is the starter backend scaffold that matches it.
- Generated SpacetimeDB client reducers take one object payload matching the generated binding schema. Do not call them with positional arguments, and use the generated camelCase field names.
- When authoring a new SDK game, start by copying the full template file set into `sdk/games/<game-name>/` and then customize it.
- Treat the packaged template as the source of truth for standalone scaffolding.
- In this SDK, the expected source path is `sdk/node_modules/@lfg/mini-engine/template/`.
- Keep the file boundaries explicit. Adapt them, but do not merge them away.
- If a user asks for "multiplayer", interpret that as online SpacetimeDB unless they explicitly ask for local-only multiplayer.
- For local online testing, prefer `npx @lfg/mini-tools lfg-mini-spacetimedb-local --game-dir games/<game-name> --copy-scaffold-if-missing --sync-packaged-scaffold` instead of hand-running the whole generate/publish flow.
- For online multiplayer work, copy `node_modules/@lfg/mini-engine/template/spacetimedb_transport.js` and `node_modules/@lfg/mini-engine/template/spacetimedb_module/` first and preserve that contract by default.
- Do not invent a new backend schema, reducer set, or ad hoc transport when the packaged SpacetimeDB path already fits the request.
- Prefer changing gameplay state and simulation files before changing reducer names, table names, or generated binding expectations.
- Do not consider an online multiplayer task complete until `?transport=spacetimedb` boots in the browser without runtime errors.

## Game Folder Convention

**Each game MUST live in its own subfolder under `games/`.** Do not place game files (`index.html`, `main.js`, etc.) directly in the SDK root.

```
sdk/games/my-car-game/
├── index.html
├── main.js
├── transport.js
├── local_transport.js
├── spacetimedb_transport.js
├── session.js
├── starter_scene.js
└── shared_world.js
```

- The dev server serves the entire SDK root, so games reference the installed package bundle via relative paths.
- The import map in `index.html` should resolve `@lfg/mini-engine` to the installed package bundle:
  ```html
  <script type="importmap">
  { "imports": { "@lfg/mini-engine": "../../node_modules/@lfg/mini-engine/dist/lfg-mini-engine.js" } }
  </script>
  ```
- Copy the full initial file set from the built package template rather than creating ad hoc starter files.
- This keeps the SDK root clean and allows multiple games to coexist without conflicts.
- When starting the dev server, open `http://127.0.0.1:8000/games/<game-name>/` in the browser.
- Do not point SDK game imports at `../packages/lfg-mini-engine/...` or assume the monorepo workspace link is the standalone runtime source.
- For serious games, preserve `transport.js`, `session.js`, and `shared_world.js` as separate files so later multiplayer/backend work is additive instead of a rewrite.

## Documentation & Examples

Use the built `@lfg/mini-engine` npm package artifacts as your reference material:

- `node_modules/@lfg/mini-engine/dist/lfg-mini-engine.js` — bundled runtime entry used by import maps
- `node_modules/@lfg/mini-engine/dist/index.d.ts` — exported API surface and types
- `node_modules/@lfg/mini-engine/template/index.html` — canonical standalone host page
- `node_modules/@lfg/mini-engine/template/main.js` — canonical standalone game entry
- `node_modules/@lfg/mini-engine/template/starter_scene.js` — canonical standalone scene helper module

**Live game** (`games/city-car/`):
- Full 3D city driving game — procedural city, car physics, chase camera, collision

Read the packaged template and exported typings before building a new game. They define the supported standalone structure and API contract.

## Runtime Contract

- The supported public runtime entry point is `Module.Mini`.
- For standalone SDK games, the supported high-level entry point is `startGame({ begin, tick, end })` from `@lfg/mini-engine`.
- `Module.Mini.editor` is not available in standalone SDK / CLI mode. It only exists when the LFG platform (or another host) injects the `@lfg/editor` bridge before gameplay starts.
- Do not call raw `_mini_web_*` exports directly when an equivalent `Mini.*` API exists.
- Do not edit files inside `runtime/`.
- Keep `mini.js`, `mini.wasm`, and `mini.data` in the same served directory unless you intentionally override `Module.locateFile`.

## Creating Game Files

`@lfg/mini-engine` is available as an npm package. Game files import from it directly — resolution is handled by the project's bundler (Vite) or the LFG platform.

For standalone SDK games under `sdk/games/`, the host page should provide an import map that resolves `@lfg/mini-engine` to `sdk/node_modules/@lfg/mini-engine/dist/lfg-mini-engine.js`.

## Imports

All game code imports from `@lfg/mini-engine`:

```js
import {
  startGame,
  vec3, quat, quatFromYawPitch, forwardFromYaw, rightFromYaw,
  createMeshBuilder, appendBox, appendSphere, finalizeMesh, packColor,
  ensureRuntimeMaterial, registerRuntimeMesh, spawnRenderable, updateTransform,
} from "@lfg/mini-engine";
```

This is the same import path used on the LFG platform. Game code written here works in both environments without changes.

## Game Lifecycle Hooks

```js
import { startGame } from "@lfg/mini-engine";

await startGame({
  begin(Module, Mini, sceneHandle, assetScenes) {
    // Called once after engine boots.
    // Create your camera, lights, meshes, and scene entities here.
  },
  tick(Module, Mini, sceneHandle, dt) {
    // Called every frame — game logic, movement, collisions, etc.
  },
  end() {
    // Called on cleanup (optional)
  },
});
```

`startGame(...)` owns the standalone boot flow and frame loop. Your game code should not manually call `Mini.renderer.initAsync(...)`, create the main scene, or drive `Mini.renderer.frame(...)` unless you are intentionally bypassing the supported SDK path.

## ECS Helpers

- `runtime/components.js` exposes generated read/write helpers for built-in engine components.
- `ECS.createEntity(sceneHandle)` returns entity id `0` as valid — `Mini.NULL_ENTITY` (`0xffffffff`) is the invalid sentinel.
- `ECS.addComponent(...)` and `ECS.writeComponent(...)` are the official tag-safe helpers.
- Prefer these helpers over manual heap writes or raw `Mini.ecs.tableAdd(...)` unless you specifically need the low-level path.

## Runtime Mesh Workflow

```js
import {
  createMeshBuilder, appendBox, finalizeMesh, packColor,
  ensureRuntimeMaterial, registerRuntimeMesh, spawnRenderable,
} from "@lfg/mini-engine";

const builder = createMeshBuilder();
appendBox(builder, { x: 0, y: 0.5, z: 0 }, { x: 1, y: 0.5, z: 1 }, packColor(200, 180, 160));
const meshData = finalizeMesh(builder);

const mat = ensureRuntimeMaterial(Mini, sceneHandle, "my_mat");
const mesh = registerRuntimeMesh(Mini, sceneHandle, "my_box", meshData);

if (mat.rebuildRequired || mesh.rebuildRequired)
  Mini.scenes.rebuildRendererResources(sceneHandle);

spawnRenderable(Module, Mini, sceneHandle, {
  name: "MyBox",
  meshHash: mesh.hash,
  materialHash: mat.hash,
  position: { x: 0, y: 0, z: -5 },
});
```

## Grounding Rules For LLM-Generated Games

For starter-style procedural games, assume a simple support plane unless you
explicitly implement something more advanced.

- Keep drivable/walkable ground on a flat world plane at `y = 0` by default.
- Keep player spawn, AI spawn, checkpoints, and physics assumptions aligned to
  that same support plane.
- Do not add raised terrain, berms, hills, or stepped ground unless you also
  implement matching support-height sampling and keep actors/props attached to
  that support height.
- If you place a box or slab on the ground, remember Mini primitives are
  center-based. A slab with height `h` sitting on the ground should usually use
  `center.y = h * 0.5`.
- If you place props on top of a slab or planter, place them relative to the
  slab top surface, not relative to `y = 0`.
- If a scene is vehicle-focused, prefer flat roads and flat parks over ad hoc
  height variation unless the gameplay specifically requires elevation.

Common failure modes to avoid:

- player car visually buried while simulation still runs
- trees or props half sunk into the ground
- roads at one height and actors simulated at another
- camera following valid gameplay state but looking at terrain or walls because
  the support geometry is inconsistent

### Runtime Mesh Size Limit

- `registerRuntimeMesh(...)` currently uploads indices as `Uint16Array`, so a single runtime mesh must stay within the 16-bit index/vertex limit.
- Do not build an entire large city, terrain, or world into one giant procedural mesh.
- For large environments, split geometry into multiple smaller meshes: for example roads, terrain patches, city blocks, park chunks, buildings by district, or one mesh per tile/chunk.
- If a large procedural mesh exceeds this limit, the failure mode may look like flickering or long stretched triangles across the scene, but the real issue is corrupted geometry from index overflow.
- When generating bigger scenes, prefer chunked mesh registration from the start rather than trying to debug the artifact later.

## Hosting Constraints

This runtime requires cross-origin isolation headers because the build uses pthreads.

Required headers:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: cross-origin`

Use `python3 dev_server.py` for local testing.

For standalone SDK games, set:

```html
<script>
  window.__LFG_ENGINE_BASE__ = "/runtime";
</script>
```

Use the absolute `/runtime` path. Do not use a relative path such as `../../runtime` for `window.__LFG_ENGINE_BASE__`, because the packaged `@lfg/mini-engine` bundle dynamically imports `components.js` relative to its own bundle location under `node_modules/@lfg/mini-engine/dist/`, which can otherwise resolve to the wrong URL and 404.

## Manual Boot

Manual `Module` / `Mini.renderer` / `Mini.scenes.setMain(...)` boot is low-level reference behavior, not the default authoring workflow for this SDK. Prefer `startGame(...)` unless you are debugging boot internals or building a custom host outside the provided standalone flow.

## Files Agents Should NOT Edit

- `runtime/mini.js`
- `runtime/mini.wasm`
- `runtime/mini.data`
- `runtime/components.js`
- `runtime/ecs_c_api_gen.js`

## Available Geometry Primitives

From `@lfg/mini-engine`: `appendBox`, `appendSphere`, `appendCylinder`, `appendCone`, `appendCapsule`, `appendPyramid`, `appendQuad`, `appendTriangle`, `appendPlane`, `appendDisc`, `appendCircle`, `appendRing`, `appendTorus`.

## Available Math

From `@lfg/mini-engine`: `vec3` (create, add, sub, scale, dot, cross, normalize, lerp, distance), `quat` (create, identity, normalize, multiply, fromAxisAngle, fromYawPitch, rotateVector, slerp, lookRotation), `math` (clamp, lerp, degToRad, radToDeg), `forwardFromYaw`, `rightFromYaw`.

## Camera Convention

- Yaw `0` faces -Z
- Negative yaw turns right
- Positive yaw turns left
- `forwardFromYaw(yaw)` and `rightFromYaw(yaw)` are consistent with `quatFromYawPitch(yaw, pitch)`

## LFG CLI Tool

This project includes `@lfg/cli` — a command-line tool for interacting with the LFG platform. Use it to search and generate 3D assets, audio, and textures from the terminal.

### Auth

```bash
./lfg login                           # sign in with email/password
./lfg login --token <access-token>    # sign in with token (from platform settings, works with Google)
./lfg whoami                          # show account info and credits
./lfg token                           # print access token for CI
./lfg logout                          # sign out
```

### Searching Assets

Search the global asset library (no login required):

```bash
./lfg assets search "knight"
./lfg assets search "car" --type MODEL_3D
./lfg assets search "footstep" --type AUDIO
./lfg assets search "walk cycle" --type ANIMATION
./lfg assets search "castle" --style low-poly --limit 5
```

Asset types for search: `MODEL_3D`, `TEXTURE`, `AUDIO`, `ANIMATION`
Generation types: `MODEL_3D` (default, use `--gen object|character`), `IMAGE` (textures/concepts), `AUDIO` (sound effects)

### Character Animation

For animated characters, see `node_modules/@lfg/mini-engine/docs/animation.md`.

Key concepts:
- Use `Mini.runtime.listAnimationClips(...)` to verify that playable clips actually exist after loading or instantiating an asset
- For standalone single-animation assets loaded as separate files, use the returned `clip.hash` or the `walk#clip0` / `idle#clip0` resource id, not `walk` / `idle`
- Do not rely on `Mini.editor` helpers in standalone SDK games; that bridge is usually unavailable here
- Search for walk animations with `./lfg assets search "Walking" --type ANIMATION`
- Search for idle animations with `./lfg assets search "Standing Idle" --type ANIMATION`

### Generating Assets

Generate new assets using AI (requires login + credits):

```bash
./lfg assets generate "medieval castle" --wait                              # 3D object (default)
./lfg assets generate "low-poly knight" --gen character --wait              # 3D character (rigged)
./lfg assets generate "fantasy landscape" --type IMAGE --wait               # image / texture
./lfg assets generate "wood planks" --type IMAGE --background opaque --wait # opaque texture
./lfg assets generate "sword clash" --type AUDIO --wait                     # sound effect
./lfg assets generate "dragon" --gen character --style cartoony --wait      # styled character
```

The `--wait` flag polls until generation completes and shows the download URL.

### Downloading Assets

```bash
./lfg assets download <asset-id> --output ./assets/castle.glb
```

If no `--output` is specified, files are saved to `./assets/<name>.<ext>`.

### Checking Status

```bash
./lfg assets status <asset-id>        # PROCESSING / COMPLETED / FAILED
./lfg assets list                     # list your generated assets
```

### Using Downloaded Assets in Games

After downloading a GLB model, load it in your game code:

```js
// In begin():
const assetUrl = "/games/my-game/assets/castle.glb";
const loadResult = await Mini.scenes.loadGlb(sceneHandle, assetUrl);
// Position and use the loaded asset entities
```

### When to Use the CLI

- **Building with colored boxes?** Search the asset library for real 3D models to upgrade your game.
- **Need sound effects?** Generate audio clips instead of silent gameplay.
- **Want a specific character?** Generate a custom 3D model with a text prompt.
- **Prototyping fast?** Use `--wait` to generate and download in one step.

The CLI connects to the same LFG platform that powers the web editor. Assets generated here can also be used in the LFG editor, and vice versa.

## Recommended Mental Model

- The web app owns prompts, agent behavior, tool orchestration, and game logic.
- The WASM runtime owns ECS storage, renderer/runtime state, scene mutation, and explicit engine APIs surfaced through `Mini`.
- Use the runtime as an engine, not as a place to store app-specific UI logic.
