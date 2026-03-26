/**
 * game/orchestrator.ts
 *
 * Central game orchestrator. Wires simulation, rendering, AI, elixir,
 * and phase transitions together. Hooks into renderer's animation loop
 * via setFrameCallback.
 */

import * as THREE from "three";
import { setFrameCallback, getScene } from "../rendering/renderer";
import { getCameraRig } from "../rendering/renderer";
import { renderUnits } from "../rendering/unitRenderer";
import { VFXSystem } from "../rendering/vfx";
import {
  createFrontLineVisual,
  updateFrontLineVisual,
  disposeFrontLineVisual,
} from "../rendering/frontLine";
import { updateWallVisuals } from "../rendering/battlefield";
import { simulationTick } from "../simulation/index";
import type { SimState } from "../simulation/index";
import { createArmy, spawnWave, getCardDefinition } from "../simulation/army";
import { createDefaultFrontLineState } from "../simulation/types/frontLine";
import { createDefaultWallState } from "../simulation/types/wall";
import { AIOpponent } from "../simulation/aiOpponent";
import { TUNING } from "../simulation/tuning";
import { useGameStore } from "../state/gameStore";
import type {
  Army,
  PlayerSide,
  Lane,
  CardId,
  LaneSummary,
  WallSegment,
} from "../simulation/types";
import type { DeployEvent } from "../ui/DeploymentInput";

// ─── Constants ───────────────────────────────────────────────────────

const SIM_TICK_RATE = 20; // ticks per second
const SIM_DT = 1 / SIM_TICK_RATE;
const SIM_DT_MS = 1000 / SIM_TICK_RATE;

const DEPLOY_DURATION_MS = 10_000;         // 10 s deploy phase
const BATTLE_DURATION_MS = 120_000;        // 120 s normal battle
const SURGE_DURATION_MS = 60_000;          // 60 s surge (x2 regen)
const SUDDEN_DEATH_DURATION_MS = 30_000;   // 30 s sudden death (x3 regen)
const TOTAL_MATCH_MS = BATTLE_DURATION_MS + SURGE_DURATION_MS + SUDDEN_DEATH_DURATION_MS;

const ATTACKER_SPAWN_X = 30;   // tile units — well clear of blue fortress (world x = -55)
const DEFENDER_SPAWN_X = 140;  // tile units — well clear of red fortress (world x = +55)

const LANES: Lane[] = ["upper", "center", "lower"];

// ─── Module state (singleton) ────────────────────────────────────────

let sim: SimState | null = null;
let elapsedMs = 0;
let simAccumulator = 0;
let vfx: VFXSystem | null = null;
let ai: AIOpponent | null = null;
let playerElixir = 5;
let aiElixir = 5;

// Stats tracking
let playerUnitsDeployed = 0;
let playerUnitsLost = 0;
let playerDamageDealt = 0;
let aiUnitsDeployed = 0;
let aiUnitsLost = 0;
let aiDamageDealt = 0;
let playerWallSegmentsDestroyed = 0;

let initialized = false;

// ─── Helpers ─────────────────────────────────────────────────────────

function laneToWallSegmentKey(lane: Lane): "upper" | "gate" | "lower" {
  if (lane === "center") return "gate";
  return lane;
}

function worldPos(
  simX: number,
  lane: Lane,
  simY?: number,
): THREE.Vector3 {
  const LANE_Z: Record<Lane, number> = { upper: -16, center: 0, lower: 16 };
  return new THREE.Vector3(simX - 85, 1, simY ?? LANE_Z[lane]);
}

function buildAISnapshot(elapsedGameMs: number) {
  if (!sim) return null;
  const { armies, frontLine, walls } = sim;

  const laneSummaries = {} as Record<Lane, LaneSummary>;
  for (const lane of LANES) {
    const friendly = armies.defender.units.filter(
      (u) => u.lane === lane && u.status !== "dead",
    );
    const enemy = armies.attacker.units.filter(
      (u) => u.lane === lane && u.status !== "dead",
    );
    const friendlyHpRatio =
      friendly.length > 0
        ? friendly.reduce((s, u) => s + u.hp / u.stats.maxHp, 0) /
          friendly.length
        : 0;
    const enemyHpRatio =
      enemy.length > 0
        ? enemy.reduce((s, u) => s + u.hp / u.stats.maxHp, 0) / enemy.length
        : 0;

    laneSummaries[lane] = {
      lane,
      friendlyCount: friendly.length,
      enemyCount: enemy.length,
      friendlyHpRatio,
      enemyHpRatio,
      wallBreached: walls.segments[laneToWallSegmentKey(lane)].breached,
    };
  }

  const wallByLane = {
    upper: walls.segments.upper,
    center: walls.segments.gate,
    lower: walls.segments.lower,
  } as Record<Lane, WallSegment>;

  return {
    side: "defender" as PlayerSide,
    tick: useGameStore.getState().tick,
    elapsedMs: elapsedGameMs,
    supply: aiElixir,
    hand: armies.defender.hand,
    laneSummaries,
    frontLine: frontLine.segments,
    wall: wallByLane,
  };
}

function deployUnits(
  side: PlayerSide,
  cardId: CardId,
  lane: Lane,
  overrideSpawnX?: number,
): boolean {
  if (!sim) return false;
  const def = getCardDefinition(cardId);
  if (!def) return false;

  const spawnX = overrideSpawnX ?? (side === "attacker" ? ATTACKER_SPAWN_X : DEFENDER_SPAWN_X);
  const units = spawnWave(cardId, side, lane, { x: spawnX, y: 0 });
  if (units.length === 0) return false;

  // Stamp deployedAtMs
  const stampedUnits = units.map((u) => ({ ...u, deployedAtMs: elapsedMs }));

  if (side === "attacker") {
    sim = {
      ...sim,
      armies: {
        ...sim.armies,
        attacker: {
          ...sim.armies.attacker,
          units: [...sim.armies.attacker.units, ...stampedUnits],
        },
      },
    };
    playerUnitsDeployed += units.length;
  } else {
    sim = {
      ...sim,
      armies: {
        ...sim.armies,
        defender: {
          ...sim.armies.defender,
          units: [...sim.armies.defender.units, ...stampedUnits],
        },
      },
    };
    aiUnitsDeployed += units.length;
  }
  return true;
}

function deductElixir(cost: number): void {
  playerElixir = Math.max(0, playerElixir - cost);
  useGameStore.getState().setElixir(playerElixir);
}

function syncToStore(): void {
  if (!sim) return;
  const store = useGameStore.getState();
  store.setWallState(sim.walls);

  const phase = store.phase;
  if (phase === "deploying") {
    store.setDeployTimeMs(Math.max(0, DEPLOY_DURATION_MS - elapsedMs));
  } else if (phase === "battle") {
    const matchPhase = store.matchPhase;
    if (matchPhase === "battle") {
      store.setMatchTimeMs(Math.max(0, BATTLE_DURATION_MS - elapsedMs));
    } else if (matchPhase === "surge") {
      store.setMatchTimeMs(Math.max(0, BATTLE_DURATION_MS + SURGE_DURATION_MS - elapsedMs));
    } else if (matchPhase === "suddendeath") {
      store.setMatchTimeMs(Math.max(0, TOTAL_MATCH_MS - elapsedMs));
    }
  }
}

function handleVFX(
  clashEvents: ReturnType<typeof simulationTick>["clashEvents"],
): void {
  if (!vfx || !sim) return;

  const allUnits = [
    ...sim.armies.attacker.units,
    ...sim.armies.defender.units,
  ];

  for (const evt of clashEvents) {
    const target = allUnits.find((u) => u.id === evt.targetId);
    const attacker = evt.attackerId ? allUnits.find((u) => u.id === evt.attackerId) : null;
    if (!target && !attacker) continue;

    let pos: THREE.Vector3;
    if (target && attacker) {
      const ax = attacker.position.x;
      const ay = attacker.position.y;
      const tx = target.position.x;
      const ty = target.position.y;
      pos = new THREE.Vector3(((ax + tx) * 0.5) - 85, 1.2, (ay + ty) * 0.5);
    } else {
      const unit = target ?? attacker!;
      pos = worldPos(unit.position.x, unit.lane, unit.position.y);
    }

    vfx.emitClash(pos);
    if (evt.type === "kill") {
      vfx.emitDeathSmoke(pos);
    }
  }
}

function emitMovementDust(armies: ReturnType<typeof simulationTick>["state"]["armies"]): void {
  if (!vfx) return;
  // Sample a subset of moving units to emit dust (rate-limited)
  const living = [
    ...armies.attacker.units,
    ...armies.defender.units,
  ].filter((u) => u.status === "moving");

  // Emit dust for ~40% of moving units per tick
  for (const u of living) {
    if (Math.random() > 0.4) continue;
    vfx.emitDust(worldPos(u.position.x, u.lane, u.position.y));
  }
}

function endMatch(reason: "breach" | "timeout"): void {
  const store = useGameStore.getState();
  if (store.phase === "results") return; // already ended

  let winner: PlayerSide | null = null;
  if (reason === "breach") {
    winner = "attacker"; // attacker breached the defender's wall
  } else {
    // Compare wall damage for timeout
    if (!sim) {
      winner = null;
    } else {
      const totalWallMaxHp =
        sim.walls.segments.upper.maxHp +
        sim.walls.segments.gate.maxHp +
        sim.walls.segments.lower.maxHp;
      const wallHpRemaining =
        sim.walls.segments.upper.hp +
        sim.walls.segments.gate.hp +
        sim.walls.segments.lower.hp;
      const wallDamage = totalWallMaxHp - wallHpRemaining;
      // attacker wins if they dealt any wall damage; else defender wins
      winner = wallDamage > 0 ? "attacker" : "defender";
    }
  }

  store.setOutcome({
    winner,
    reason,
    stats: {
      attacker: {
        unitsDeployed: playerUnitsDeployed,
        unitsLost: playerUnitsLost,
        damageDealt: playerDamageDealt,
        wallSegmentsDestroyed: playerWallSegmentsDestroyed,
      },
      defender: {
        unitsDeployed: aiUnitsDeployed,
        unitsLost: aiUnitsLost,
        damageDealt: aiDamageDealt,
        wallSegmentsDestroyed: 0,
      },
    },
  });

  // Camera: dramatic shot on breach, overview on timeout
  const rig = getCameraRig();
  if (rig) {
    rig.transitionTo(reason === "breach" ? "breach" : "overview", 2000);
  }

  store.setPhase("results");
}

// ─── Phase transitions ───────────────────────────────────────────────

export function startMatch(): void {
  const store = useGameStore.getState();

  // Reset stats
  playerUnitsDeployed = 0;
  playerUnitsLost = 0;
  playerDamageDealt = 0;
  aiUnitsDeployed = 0;
  aiUnitsLost = 0;
  aiDamageDealt = 0;
  playerWallSegmentsDestroyed = 0;
  elapsedMs = 0;
  simAccumulator = 0;

  // Build initial armies
  const attackerArmy = createArmy("attacker");
  const defenderArmy = createArmy("defender");

  // Set player's hand from attacker army
  store.setHand(attackerArmy.hand);
  store.setNextCard(attackerArmy.deck[0] ?? null);

  // Reset elixir — start full so both sides can deploy immediately
  playerElixir = 10;
  aiElixir = 10;
  store.setElixir(playerElixir);

  // Build initial sim state
  sim = {
    armies: { attacker: attackerArmy, defender: defenderArmy },
    frontLine: createDefaultFrontLineState(),
    walls: createDefaultWallState(),
  };

  // AI
  if (!ai) ai = new AIOpponent();
  else ai.reset();

  // Camera: overview (player needs full-field visibility for drag-to-deploy)
  const rig = getCameraRig();
  if (rig) rig.transitionTo("overview", 1500);

  // Phase announcement
  store.setAnnouncement("PREPARE YOUR ARMY!");
  setTimeout(() => useGameStore.getState().setAnnouncement(null), 1500);

  store.setDeployTimeMs(DEPLOY_DURATION_MS);
  store.setPhase("deploying");
}

function startBattle(): void {
  const store = useGameStore.getState();
  elapsedMs = 0;
  simAccumulator = 0;

  // Camera: locked to overview during battle — no mid-battle transitions
  const rig = getCameraRig();
  if (rig) rig.transitionTo("overview", 2000);

  // Phase announcement
  store.setAnnouncement("BATTLE!");
  setTimeout(() => useGameStore.getState().setAnnouncement(null), 1500);

  store.setMatchTimeMs(BATTLE_DURATION_MS);
  store.setMatchPhase("battle");
  store.setPhase("battle");
}

// ─── Per-frame callback ──────────────────────────────────────────────

function onFrame(dtMs: number): void {
  const store = useGameStore.getState();
  const phase = store.phase;
  const scene = getScene();

  if (phase === "deploying") {
    elapsedMs += dtMs;

    // Elixir regen
    playerElixir = Math.min(
      TUNING.elixirMax,
      playerElixir + TUNING.elixirRegenPerSecond * (dtMs / 1000),
    );
    aiElixir = Math.min(
      TUNING.elixirMax,
      aiElixir + TUNING.elixirRegenPerSecond * 0.6 * (dtMs / 1000),
    );
    store.setElixir(playerElixir);

    // AI also deploys during deployment phase
    if (sim && ai) {
      const snap = buildAISnapshot(elapsedMs);
      if (snap) {
        const decision = ai.tick(snap);
        for (const cmd of decision.deploys) {
          const def = getCardDefinition(cmd.cardId);
          if (def && aiElixir >= def.cost) {
            if (deployUnits("defender", cmd.cardId, cmd.lane)) {
              aiElixir -= def.cost;
            }
          }
        }
      }
    }

    // Sync wall state for HUD
    syncToStore();

    // Render units (preview during deploy)
    if (scene && sim) {
      renderUnits(scene, sim.armies, elapsedMs);
      vfx?.update(dtMs / 1000);
    }

    if (elapsedMs >= DEPLOY_DURATION_MS) {
      startBattle();
    }
    return;
  }

  if (phase === "battle") {
    elapsedMs += dtMs;
    simAccumulator += dtMs;

    // Sub-phase transitions
    let desiredMatchPhase: "battle" | "surge" | "suddendeath";
    if (elapsedMs < BATTLE_DURATION_MS) {
      desiredMatchPhase = "battle";
    } else if (elapsedMs < BATTLE_DURATION_MS + SURGE_DURATION_MS) {
      desiredMatchPhase = "surge";
    } else {
      desiredMatchPhase = "suddendeath";
    }
    if (store.matchPhase !== desiredMatchPhase) {
      store.setMatchPhase(desiredMatchPhase);
      if (desiredMatchPhase === "surge") {
        store.setAnnouncement("⚡ SURGE! x2 ELIXIR ⚡");
        setTimeout(() => useGameStore.getState().setAnnouncement(null), 1500);
      } else if (desiredMatchPhase === "suddendeath") {
        store.setAnnouncement("💀 SUDDEN DEATH! 💀");
        setTimeout(() => useGameStore.getState().setAnnouncement(null), 1500);
      }
    }

    // Elixir regen — multiplied by sub-phase
    const regenMult =
      desiredMatchPhase === "suddendeath" ? 3 :
      desiredMatchPhase === "surge" ? 2 : 1;
    playerElixir = Math.min(
      TUNING.elixirMax,
      playerElixir + TUNING.elixirRegenPerSecond * regenMult * (dtMs / 1000),
    );
    aiElixir = Math.min(
      TUNING.elixirMax,
      aiElixir + TUNING.elixirRegenPerSecond * regenMult * 0.6 * (dtMs / 1000),
    );
    store.setElixir(playerElixir);

    // Fixed-timestep simulation
    while (simAccumulator >= SIM_DT_MS && sim) {
      simAccumulator -= SIM_DT_MS;

      // Count units before tick for stats
      const prevAttackerLiving = sim.armies.attacker.units.filter(
        (u) => u.status !== "dead",
      ).length;
      const prevDefenderLiving = sim.armies.defender.units.filter(
        (u) => u.status !== "dead",
      ).length;

      // AI tick
      if (ai) {
        const snap = buildAISnapshot(elapsedMs);
        if (snap) {
          const decision = ai.tick(snap);
          for (const cmd of decision.deploys) {
            const def = getCardDefinition(cmd.cardId);
            if (def && aiElixir >= def.cost) {
              if (deployUnits("defender", cmd.cardId, cmd.lane)) {
                aiElixir -= def.cost;
              }
            }
          }
        }
      }

      // Advance simulation
      const result = simulationTick(sim, SIM_DT, elapsedMs);
      sim = result.state;

      // Track stats from clash events
      for (const evt of result.clashEvents) {
        if (evt.type === "kill") {
          if (evt.attackerSide === "attacker") {
            aiUnitsLost++;
            playerDamageDealt += evt.damage;
          } else {
            playerUnitsLost++;
            aiDamageDealt += evt.damage;
          }
        }
      }

      // VFX for combat events
      handleVFX(result.clashEvents);

      // Emit movement dust
      emitMovementDust(sim.armies);

      // Increment store tick
      store.incrementTick();

      // Check breach
      if (result.breachEvents.length > 0) {
        playerWallSegmentsDestroyed += result.breachEvents.length;
        endMatch("breach");
        break;
      }
    }

    syncToStore();

    // Render
    if (scene && sim) {
      renderUnits(scene, sim.armies);
      vfx?.update(dtMs / 1000);
      updateFrontLineVisual(sim.frontLine);
      updateWallVisuals(sim.walls);
    }

    // Timeout check
    if (elapsedMs >= TOTAL_MATCH_MS && store.phase === "battle") {
      endMatch("timeout");
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────

/** Called once from App.tsx after the renderer is initialised. */
export function initOrchestrator(): void {
  if (initialized) return;
  initialized = true;

  // Create VFX system and front line visual after scene is available
  const scene = getScene();
  if (scene) {
    vfx = new VFXSystem(scene);
    createFrontLineVisual(scene);
  }

  setFrameCallback(onFrame);
}

/** Tear down — call on component unmount. */
export function disposeOrchestrator(): void {
  setFrameCallback(null);
  const scene = getScene();
  if (scene) {
    if (vfx) {
      vfx.dispose(scene);
      vfx = null;
    }
    disposeFrontLineVisual(scene);
  }
  sim = null;
  ai = null;
  initialized = false;
}

/**
 * Handle a player deploy event from DeploymentInput.
 * Validates elixir, spawns units, updates store hand.
 */
export function handlePlayerDeploy(event: DeployEvent): void {
  if (!sim) return;
  const store = useGameStore.getState();
  if (store.phase !== "deploying" && store.phase !== "battle") return;

  const def = getCardDefinition(event.cardId);
  if (!def) return;
  if (playerElixir < def.cost) return;

  // Check lane restrictions
  if (
    def.allowedLanes.length > 0 &&
    !def.allowedLanes.includes(event.lane)
  ) {
    return;
  }

  // Close deployment (left half): spawn near front line for faster engagement
  // Reserve deployment (right half): spawn at base for safer staging
  let spawnX: number;
  if (event.position.x < 85) {
    const frontPos = sim.frontLine.segments[event.lane].position;
    spawnX = Math.max(5, Math.round(frontPos * 170 - 15));
  } else {
    spawnX = ATTACKER_SPAWN_X;
  }

  if (deployUnits("attacker", event.cardId, event.lane, spawnX)) {
    deductElixir(def.cost);

    // Remove card from hand and draw next
    store.removeCardFromHand(event.cardId);

    // Cycle deck: move next card to hand
    const army = sim.armies.attacker;
    if (army.deck.length > 0) {
      const [nextCardId, ...remainingDeck] = army.deck;
      const newHand = [...store.hand.filter((id) => id !== event.cardId), nextCardId];
      store.setHand(newHand);
      store.setNextCard(remainingDeck[0] ?? null);

      // Update army deck in sim
      sim = {
        ...sim,
        armies: {
          ...sim.armies,
          attacker: {
            ...sim.armies.attacker,
            deck: remainingDeck,
          },
        },
      };
    }
  }
}

/** Returns a debug snapshot for the DebugPanel. */
export function getDebugSnapshot() {
  if (!sim) return null;
  return {
    fps: 0, // filled by caller measuring render fps
    tick: useGameStore.getState().tick,
    frontLine: {
      upper: sim.frontLine.segments.upper.position,
      center: sim.frontLine.segments.center.position,
      lower: sim.frontLine.segments.lower.position,
    },
    unitCounts: {
      attacker: sim.armies.attacker.units.filter((u) => u.status !== "dead").length,
      defender: sim.armies.defender.units.filter((u) => u.status !== "dead").length,
    },
  };
}
