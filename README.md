# Army Royale

Real-time 1v1 battle game built with the **LFG Mini Engine SDK**. Two players command animal armies across a 3-lane battlefield, fighting to breach the opposing fortress wall.

## Factions

| Card | Role | Cost | Squad | Description |
|------|------|------|-------|-------------|
| Monkey | Melee | 3 | 20 | Banana-sword brawlers, fast and aggressive |
| Hamster | Ranged | 3 | 14 | Chonky acorn-bombers, attack from distance |
| Frog | Breaker | 4 | 8 | Tank toads, slow but devastating wall damage |
| Duckling | Rush | 2 | 24 | Tiny swarm, cheap and fast zerg rush |

## How to play

- Drag cards from the hand onto the left half of the battlefield to deploy troops
- Troops march toward the enemy wall and fight enemy units along the way
- Destroy the enemy wall HP to win, or have more wall HP when time runs out
- Manage elixir (regenerates over time) to decide when and what to deploy
- AI controls the red side

## Setup

```bash
# 1. Download SDK packages (first time only)
mkdir -p .packages
curl -sSfL https://lfg.hypehype.com/sdk/npm/lfg-core-0.1.0.tgz -o .packages/lfg-core-0.1.0.tgz
curl -sSfL https://lfg.hypehype.com/sdk/npm/lfg-mini-engine-0.1.0.tgz -o .packages/lfg-mini-engine-0.1.0.tgz
curl -sSfL https://lfg.hypehype.com/sdk/npm/lfg-cli-0.1.0.tgz -o .packages/lfg-cli-0.1.0.tgz

# 2. Install
npm install

# 3. Download engine runtime (first time only)
mkdir -p runtime
curl -sSfL https://lfg.hypehype.com/sdk/runtime/v1/mini.js -o runtime/mini.js
curl -sSfL https://lfg.hypehype.com/sdk/runtime/v1/mini.wasm -o runtime/mini.wasm
curl -sSfL https://lfg.hypehype.com/sdk/runtime/v1/mini.data -o runtime/mini.data
curl -sSfL https://lfg.hypehype.com/sdk/runtime/v1/components.js -o runtime/components.js
curl -sSfL https://lfg.hypehype.com/sdk/runtime/v1/ecs_c_api_gen.js -o runtime/ecs_c_api_gen.js

# 4. Run dev server
python3 dev_server.py
```

Open **http://127.0.0.1:8000/games/army-royale/** in a WebGPU-capable browser.

## Tech stack

- **Engine**: LFG Mini Engine (WASM + WebGPU)
- **Rendering**: Procedural runtime meshes (animal characters, walls, VFX)
- **Simulation**: Deterministic per-unit combat with lane-based AI
- **Multiplayer**: SpacetimeDB transport scaffolded for future online play

## Project structure

```
armyroyale/
├── games/army-royale/     ← game code
│   ├── index.html         ← host page with HUD CSS
│   ├── main.js            ← entry point (startGame)
│   ├── starter_scene.js   ← 3D scene, rendering, input, camera
│   ├── army_simulation.js ← combat simulation, AI, spawning
│   ├── shared_world.js    ← constants, cards, camera, lighting
│   └── assets/            ← GLB animal models
├── runtime/               ← engine binaries (gitignored)
├── node_modules/          ← SDK packages (gitignored)
├── CLAUDE.md              ← SDK quick reference
├── AGENTS.md              ← SDK conventions
└── dev_server.py          ← local server with COOP/COEP headers
```
