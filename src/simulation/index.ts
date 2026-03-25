/**
 * simulation/index.ts
 *
 * Public API for one simulation step (tick).
 * Caller (orchestrator) drives the fixed-timestep loop.
 */

import type { Army, PlayerSide, Lane, EntityId } from "./types";
import type { FrontLineState } from "./types";
import type { WallState } from "./types";
import { moveArmies, applyPushForce } from "./movement";
import { resolveClash } from "./clash";
import type { CombatEvent } from "./clash";
import { applyWallDamage, checkBreach, triggerBreach } from "./wallAttack";
import type { BreachEvent } from "./wallAttack";
import { tickFrontLine } from "./frontLine";

// ─── State ───────────────────────────────────────────────────────────

export interface SimState {
  armies: Record<PlayerSide, Army>;
  frontLine: FrontLineState;
  walls: WallState;
}

export interface TickResult {
  state: SimState;
  clashEvents: CombatEvent[];
  breachEvents: BreachEvent[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

const LANES: Lane[] = ["upper", "center", "lower"];

/**
 * Run per-lane clash resolution and merge survivors back into full armies.
 * Returns updated armies and all combat events that fired this tick.
 */
function runPerLaneClash(
  armies: Record<PlayerSide, Army>,
  dt: number,
): { armies: Record<PlayerSide, Army>; events: CombatEvent[] } {
  let attackerUnits = [...armies.attacker.units];
  let defenderUnits = [...armies.defender.units];
  const allEvents: CombatEvent[] = [];

  for (const lane of LANES) {
    const laneAtk = attackerUnits.filter(
      (u) => u.lane === lane && u.status !== "dead",
    );
    const laneDef = defenderUnits.filter(
      (u) => u.lane === lane && u.status !== "dead",
    );

    // No clash if one side is empty in this lane
    if (laneAtk.length === 0 || laneDef.length === 0) continue;

    const result = resolveClash(
      { ...armies.attacker, units: laneAtk },
      { ...armies.defender, units: laneDef },
      dt,
    );
    allEvents.push(...result.events);

    // Build survivor id sets
    const aliveAtkIds = new Set<EntityId>(result.attacker.units.map((u) => u.id));
    const aliveDefIds = new Set<EntityId>(result.defender.units.map((u) => u.id));
    const atkById = new Map(result.attacker.units.map((u) => [u.id, u]));
    const defById = new Map(result.defender.units.map((u) => [u.id, u]));

    // Merge survivors back (update HP / status for this lane)
    attackerUnits = attackerUnits.map((u) => {
      if (u.lane !== lane) return u;
      if (aliveAtkIds.has(u.id)) return atkById.get(u.id)!;
      return { ...u, status: "dead" as const, hp: 0 };
    });
    defenderUnits = defenderUnits.map((u) => {
      if (u.lane !== lane) return u;
      if (aliveDefIds.has(u.id)) return defById.get(u.id)!;
      return { ...u, status: "dead" as const, hp: 0 };
    });
  }

  return {
    armies: {
      attacker: { ...armies.attacker, units: attackerUnits },
      defender: { ...armies.defender, units: defenderUnits },
    },
    events: allEvents,
  };
}

// ─── Public tick ─────────────────────────────────────────────────────

/**
 * Advance the simulation by one fixed step.
 *
 * Order: moveArmies → applyPushForce → resolveClash (per lane)
 *        → applyWallDamage → checkBreach → tickFrontLine
 *
 * @param state  Current simulation state (immutable — returns new state)
 * @param dt     Time delta in seconds (typically 1/20 for 20 ticks/s)
 * @param nowMs  Elapsed game time in ms (for cavalry flank logic)
 */
export function simulationTick(
  state: SimState,
  dt: number,
  nowMs: number,
): TickResult {
  // 1. Move armies toward the front line
  const movedArmies = moveArmies(state.armies, state.frontLine, dt, nowMs);

  // 2. Calculate push force from unit HP ratios
  const pushedFrontLine = applyPushForce(movedArmies, state.frontLine);

  // 3. Per-lane clash
  const { armies: clashedArmies, events: clashEvents } = runPerLaneClash(
    movedArmies,
    dt,
  );

  // 4. Apply wall damage from units near the wall
  const newWalls = applyWallDamage(clashedArmies, state.walls, pushedFrontLine, dt);

  // 5. Check for breaches
  const breachEvents = checkBreach(newWalls);
  let finalWalls = newWalls;
  for (const ev of breachEvents) {
    finalWalls = {
      segments: {
        ...finalWalls.segments,
        [ev.segment]: triggerBreach(finalWalls.segments[ev.segment]),
      },
    };
  }

  // 6. Tick front line physics (velocity → position, friction)
  const finalFrontLine = tickFrontLine(pushedFrontLine, dt);

  // 7. Remove dead units so they don't accumulate in memory
  const cleanedArmies: Record<PlayerSide, Army> = {
    attacker: {
      ...clashedArmies.attacker,
      units: clashedArmies.attacker.units.filter((u) => u.status !== "dead"),
    },
    defender: {
      ...clashedArmies.defender,
      units: clashedArmies.defender.units.filter((u) => u.status !== "dead"),
    },
  };

  return {
    state: {
      armies: cleanedArmies,
      frontLine: finalFrontLine,
      walls: finalWalls,
    },
    clashEvents,
    breachEvents,
  };
}
