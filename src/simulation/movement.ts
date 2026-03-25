import type {
  Army,
  Unit,
  FrontLineState,
  Lane,
  PlayerSide,
} from "./types";
import { pushSegment } from "./frontLine";
import { TUNING } from "./tuning";

const LANES: Lane[] = ["upper", "center", "lower"];

/**
 * Card IDs that receive cavalry flank-bias treatment.
 * Cavalry units shift to an adjacent lane once, ~1 second after deployment,
 * so they can engage where pressure is needed instead of stacking in their
 * spawn lane.
 */
const CAVALRY_CARD_IDS = new Set<string>(["cavalry", "cavalry_charge"]);

/** How long after deployment (ms) before cavalry executes its flank shift */
const CAVALRY_FLANK_DELAY_MS = 1000;

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Returns the adjacent lane a cavalry unit should flank to, or null if the
 * flank window has not arrived yet.
 *
 * The shift window is exactly one tick wide (nowMs to nowMs+dtMs), making
 * the transition deterministic and stateless — no extra flag needed on Unit.
 * The direction is derived from the unit ID so each unit picks independently.
 */
function cavalryFlankLane(unit: Unit, nowMs: number, dt: number): Lane | null {
  if (!CAVALRY_CARD_IDS.has(unit.cardId as string)) return null;

  const elapsed = nowMs - unit.deployedAtMs;
  const dtMs = dt * 1000;

  // Apply exactly once: when elapsed crosses the delay threshold this tick
  if (elapsed < CAVALRY_FLANK_DELAY_MS || elapsed >= CAVALRY_FLANK_DELAY_MS + dtMs) {
    return null;
  }

  // Deterministic direction from last char of unit ID
  const dirBit = unit.id.charCodeAt(unit.id.length - 1) % 2;

  if (unit.lane === "center") {
    return dirBit === 0 ? "upper" : "lower";
  }
  // From upper/lower, always shift toward center
  return "center";
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Moves living units toward the front line based on their side and stats.
 *
 * Deploy distance and timing:
 *   - Units spawned far from the front line (large |position.x − frontX|)
 *     simply take longer to travel there — deploy distance naturally
 *     determines time-to-frontline with no extra bookkeeping.
 *   - Units deployed early in the match start closer to the action because
 *     they have already been moving for more ticks (position already advanced).
 *     Late-deployed units start from spawn and act as reserves.
 *
 * Cavalry flank-bias:
 *   - Cavalry (cardId "cavalry" / "cavalry_charge") shifts to an adjacent
 *     lane once, ~1 s after deployment (see CAVALRY_FLANK_DELAY_MS).
 *   - Center cavalry fans out to upper/lower; flank cavalry collapses to center.
 *   - This lets cavalry apply pressure on whichever lane needs it without the
 *     player having to micro-manage lane selection.
 *
 * Attacker units (status != dead, != attacking) move right; stop at frontX − 5.
 * Defender units (status != dead, != attacking) move left; stop at frontX + 5.
 *
 * @param armies    - Both armies
 * @param frontLine - Current front line state (positions per lane)
 * @param dt        - Time delta in seconds
 * @param nowMs     - Current game time in ms (required for cavalry flank logic)
 */
export function moveArmies(
  armies: Record<PlayerSide, Army>,
  frontLine: FrontLineState,
  dt: number,
  nowMs: number = 0,
): Record<PlayerSide, Army> {
  function moveUnit(unit: Unit): Unit {
    if (unit.status === "dead" || unit.status === "attacking") return unit;

    // Cavalry flank: shift lane once during the flank window
    const flankLane = cavalryFlankLane(unit, nowMs, dt);
    if (flankLane !== null) {
      return { ...unit, lane: flankLane };
    }

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

    const netForce = (attackerHpSum - defenderHpSum) * TUNING.pushForceScale;
    if (netForce !== 0) {
      newState = pushSegment(newState, lane, netForce);
    }
  }

  return newState;
}
