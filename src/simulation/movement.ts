import type {
  Army,
  Unit,
  FrontLineState,
  Lane,
  PlayerSide,
} from "./types";
import { pushSegment } from "./frontLine";

const LANES: Lane[] = ["upper", "center", "lower"];

/**
 * Moves living units toward the front line based on their side and stats.
 * Attacker units (status != dead, != attacking) move right; stop at frontX - 5
 * Defender units (status != dead, != attacking) move left; stop at frontX + 5
 * dt is seconds
 */
export function moveArmies(
  armies: Record<PlayerSide, Army>,
  frontLine: FrontLineState,
  dt: number,
): Record<PlayerSide, Army> {
  function moveUnit(unit: Unit): Unit {
    if (unit.status === "dead" || unit.status === "attacking") return unit;

    const seg = frontLine.segments[unit.lane];
    const frontX = seg.position * 170;

    let newX = unit.position.x;

    if (unit.side === "attacker") {
      const stopX = frontX - 5;
      if (newX < stopX) {
        newX = Math.min(stopX, newX + unit.stats.moveSpeed * dt);
      }
    } else {
      const stopX = frontX + 5;
      if (newX > stopX) {
        newX = Math.max(stopX, newX - unit.stats.moveSpeed * dt);
      }
    }

    const newStatus =
      newX !== unit.position.x ? "moving" : unit.status === "moving" ? "idle" : unit.status;

    return {
      ...unit,
      position: { ...unit.position, x: newX },
      status: newStatus,
    };
  }

  const updatedAttacker: Army = {
    ...armies.attacker,
    units: armies.attacker.units.map(moveUnit),
  };
  const updatedDefender: Army = {
    ...armies.defender,
    units: armies.defender.units.map(moveUnit),
  };

  return { attacker: updatedAttacker, defender: updatedDefender };
}

/** Returns per-lane participation: units within 20 tiles of front line */
export function updateSegmentParticipation(
  armies: Record<PlayerSide, Army>,
  frontLine: FrontLineState,
): Record<Lane, { attackers: Unit[]; defenders: Unit[] }> {
  const result = {} as Record<Lane, { attackers: Unit[]; defenders: Unit[] }>;

  for (const lane of LANES) {
    const frontX = frontLine.segments[lane].position * 170;

    const attackers = armies.attacker.units.filter(
      (u) => u.lane === lane && u.status !== "dead" && Math.abs(u.position.x - frontX) <= 20,
    );
    const defenders = armies.defender.units.filter(
      (u) => u.lane === lane && u.status !== "dead" && Math.abs(u.position.x - frontX) <= 20,
    );

    result[lane] = { attackers, defenders };
  }

  return result;
}

/**
 * Calculates net force per lane from unit HP ratios, updates FrontLineState velocity.
 * netForce = (attackerHpSum - defenderHpSum) * 0.001; each unit contributes (hp/maxHp)
 */
export function applyPushForce(
  armies: Record<PlayerSide, Army>,
  frontLine: FrontLineState,
): FrontLineState {
  const participation = updateSegmentParticipation(armies, frontLine);
  let newState = frontLine;

  for (const lane of LANES) {
    const { attackers, defenders } = participation[lane];

    const attackerHpSum = attackers.reduce(
      (sum, u) => sum + u.hp / u.stats.maxHp,
      0,
    );
    const defenderHpSum = defenders.reduce(
      (sum, u) => sum + u.hp / u.stats.maxHp,
      0,
    );

    const netForce = (attackerHpSum - defenderHpSum) * 0.001;
    if (netForce !== 0) {
      newState = pushSegment(newState, lane, netForce);
    }
  }

  return newState;
}
