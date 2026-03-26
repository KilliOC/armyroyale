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

const GATE_ATTACK_MULTIPLIER = 1.5;
const WALL_X = 160;
const WALL_REACH_DISTANCE = 2.5;

export interface BreachEvent {
  type: "breach";
  segment: WallSegmentType;
  lane: Lane;
}

function laneToSegmentType(lane: Lane): WallSegmentType {
  if (lane === "center") return "gate";
  if (lane === "upper") return "upper";
  return "lower";
}

function unitDps(unit: Unit): number {
  return (unit.stats.attack * 1000) / unit.stats.attackIntervalMs;
}

export function applyWallDamage(
  armies: Record<PlayerSide, Army>,
  walls: WallState,
  _frontLine: FrontLineState,
  dt: number,
): WallState {
  const lanes: Lane[] = ["upper", "center", "lower"];
  let segments = { ...walls.segments };

  for (const lane of lanes) {
    const attackers = armies.attacker.units.filter(
      (u) => u.lane === lane && u.status !== "dead" && Math.abs(u.position.x - WALL_X) <= WALL_REACH_DISTANCE,
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

export function checkBreach(walls: WallState): BreachEvent[] {
  const events: BreachEvent[] = [];
  for (const seg of Object.values(walls.segments) as WallSegment[]) {
    if (seg.hp <= 0 && !seg.breached) {
      events.push({ type: "breach", segment: seg.type, lane: seg.lane });
    }
  }
  return events;
}

export function triggerBreach(segment: WallSegment): WallSegment {
  return { ...segment, hp: 0, breached: true };
}
