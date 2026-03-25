import type {
  Army,
  Unit,
  WallState,
  WallSegment,
  WallSegmentType,
  FrontLineState,
  Lane,
  PlayerSide,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────

/** Front line position (0–1) at which attackers are considered at the wall */
const WALL_ENGAGE_THRESHOLD = 0.9;

/**
 * The gate (center segment) is structurally weaker than stone walls,
 * so attackers naturally focus more damage there.
 */
const GATE_ATTACK_MULTIPLIER = 1.5;

// ─── Breach event ─────────────────────────────────────────────────────

export interface BreachEvent {
  type: "breach";
  segment: WallSegmentType;
  lane: Lane;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function laneToSegmentType(lane: Lane): WallSegmentType {
  if (lane === "center") return "gate";
  if (lane === "upper") return "upper";
  return "lower";
}

function unitDps(unit: Unit): number {
  return (unit.stats.attack * 1000) / unit.stats.attackIntervalMs;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Applies attacker DPS to wall segments for dt seconds.
 *
 * Only applies damage when the front line in that lane has reached
 * WALL_ENGAGE_THRESHOLD (units have pushed far enough to reach the wall).
 * The gate segment receives GATE_ATTACK_MULTIPLIER bonus damage because
 * it is a weaker structural point that attackers naturally target.
 *
 * @param armies    - Both armies (only attacker units deal wall damage)
 * @param walls     - Current wall state
 * @param frontLine - Front line positions per lane
 * @param dt        - Time delta in seconds
 */
export function applyWallDamage(
  armies: Record<PlayerSide, Army>,
  walls: WallState,
  frontLine: FrontLineState,
  dt: number,
): WallState {
  const lanes: Lane[] = ["upper", "center", "lower"];
  let segments = { ...walls.segments };

  for (const lane of lanes) {
    const seg = frontLine.segments[lane];
    if (seg.position < WALL_ENGAGE_THRESHOLD) continue;

    const attackers = armies.attacker.units.filter(
      (u) => u.lane === lane && u.status !== "dead",
    );
    if (attackers.length === 0) continue;

    const totalDps = attackers.reduce((sum, u) => sum + unitDps(u), 0);
    const segType = laneToSegmentType(lane);
    const multiplier = segType === "gate" ? GATE_ATTACK_MULTIPLIER : 1.0;
    const dmg = totalDps * multiplier * dt;

    const current = segments[segType];
    if (!current.breached) {
      segments = {
        ...segments,
        [segType]: { ...current, hp: Math.max(0, current.hp - dmg) },
      };
    }
  }

  return { segments };
}

/**
 * Scans wall segments and returns breach events for any segment whose HP
 * has dropped to zero and is not yet marked breached.
 */
export function checkBreach(walls: WallState): BreachEvent[] {
  const events: BreachEvent[] = [];

  for (const seg of Object.values(walls.segments) as WallSegment[]) {
    if (seg.hp <= 0 && !seg.breached) {
      events.push({ type: "breach", segment: seg.type, lane: seg.lane });
    }
  }

  return events;
}

/**
 * Marks a wall segment as breached and triggers the win condition.
 * Returns the updated segment; caller is responsible for merging it back
 * into WallState.
 */
export function triggerBreach(segment: WallSegment): WallSegment {
  return { ...segment, hp: 0, breached: true };
}
