# Army Royale — Screenshot Capture Workflow

## Requirements

Army Royale uses the LFG mini-engine WASM renderer which **requires WebGPU**.
Screenshots can only be captured on devices with:
- Chrome 113+ / Edge 113+ / Chrome Canary with WebGPU enabled
- Real GPU hardware (dedicated or integrated)
- NOT available in headless Chrome on CPU-only servers

## Automated Capture (GPU-enabled host)

```bash
cd /home/openclaw/.openclaw/workspace-armyroyale-dev
npm run dev &
node capture-screenshots.mjs
```

The script captures 8 checkpoints:
1. `01_game_loaded` — Loading/countdown screen
2. `02_battle_start` — Match started, cards visible
3. `03_first_deploy` — First unit deployment
4. `04_active_combat` — Multiple waves clashing
5. `05_midgame_clash` — Dense fight with VFX
6. `06_late_game` — Wall damage visible
7. `07_result_screen` — End-state overlay
8. `08_rematch_countdown` — Fresh match after rematch

Screenshots save to: `~/.openclaw/agents/armyroyale-lead/workspace/screenshots/`

## Manual Capture (any device)

1. Start dev server: `npm run dev`
2. Open `http://localhost:8000/` in Chrome on a GPU-enabled device
3. Play through a match, taking screenshots at each checkpoint
4. Key moments to capture:
   - **Deploy**: drag a card onto the blue zone
   - **Combat**: units clashing mid-field (look for team-colored sparks, slash VFX)
   - **Frontline**: golden lane markers showing clash positions
   - **Breach**: wall collapse cinematic with explosions
   - **Time-up**: calmer end sequence with no wall collapse
   - **Result**: end-state overlay with star rating

## Debug mode

Add `?debug` to URL to show zone outlines:
```
http://localhost:8000/?debug
```

## What to verify per checkpoint

| Checkpoint | What to look for |
|---|---|
| Deploy | Blue preview circle, card tray, elixir bar |
| Combat start | Units spawning with elastic bounce animation |
| Active clash | Blue/red sparks, slash arcs for melee, projectile arcs for ranged |
| Frontline | Golden ground markers at lane clash points |
| Dense fight | Dust clouds at 3+ unit clash zones |
| Wall damage | Wall sinking/leaning, HP bars declining |
| Breach | Wall collapse, fire VFX, camera zoom, "BREACH!" text |
| Time-up | No wall collapse, "TIME UP!" text, calm camera pull-back |
| Result | Title (BREACH/VICTORY/DEFEAT), star rating, wall HP comparison |
| Rematch | Clean slate, countdown 3-2-1-FIGHT |

## Engine base path

The `__LFG_ENGINE_BASE__` is set to `/runtime` in `index.html`.
This tells the LFG engine to load WASM/JS files from `/runtime/` instead of the
default `/assets/engine/v1/` path. The Vite config serves the `runtime/`
directory at this path both in dev and production builds.
