/**
 * simulation/index.ts
 *
 * Per-unit simulation tick.
 */

import type { Army, PlayerSide, Lane } from "./types";
import type { FrontLineState } from "./types";
import type { WallState } from "./types";
import { moveArmies, applyPushForce } from "./movement";
import { resolveClash } from "./clash";
import type { CombatEvent } from "./clash";
import { applyWallDamage, checkBreach, triggerBreach } from "./wallAttack";
import type { BreachEvent } from "./wallAttack";

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

export function simulationTick(
  state: SimState,
  dt: number,
  nowMs: number,
): TickResult {
  const movedArmies = moveArmies(state.armies, state.frontLine, dt, nowMs);

  const clashResult = resolveClash(movedArmies.attacker, movedArmies.defender, nowMs);
  const clashedArmies: Record<PlayerSide, Army> = {
    attacker: clashResult.attacker,
    defender: clashResult.defender,
  };

  const derivedFrontLine = applyPushForce(clashedArmies, state.frontLine);
  const newWalls = applyWallDamage(clashedArmies, state.walls, derivedFrontLine, dt);

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
      frontLine: derivedFrontLine,
      walls: finalWalls,
    },
    clashEvents: clashResult.events,
    breachEvents,
  };
}
