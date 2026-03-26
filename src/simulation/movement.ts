import type { Army, Unit, FrontLineState, Lane, PlayerSide, EntityId } from "./types";

const LANES: Lane[] = ["upper", "center", "lower"];
const LANE_Y: Record<Lane, number> = { upper: -12, center: 0, lower: 12 };
const ATTACKER_WALL_X = 10;
const DEFENDER_WALL_X = 160;

const CAVALRY_CARD_IDS = new Set<string>(["cavalry", "cavalry_charge"]);
const CAVALRY_FLANK_DELAY_MS = 1000;
const SEPARATION_STRENGTH = 1.8;
const LANE_LOCK_STRENGTH = 0.9;
const BRIDGE_ATTRACTION = 1.4;
const RIVER_PUSH = 1.2;

function distance(a: Unit, b: Unit): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function cavalryFlankLane(unit: Unit, nowMs: number, dt: number): Lane | null {
  if (!CAVALRY_CARD_IDS.has(unit.cardId as string)) return null;
  const elapsed = nowMs - unit.deployedAtMs;
  const dtMs = dt * 1000;
  if (elapsed < CAVALRY_FLANK_DELAY_MS || elapsed >= CAVALRY_FLANK_DELAY_MS + dtMs) {
    return null;
  }
  const dirBit = unit.id.charCodeAt(unit.id.length - 1) % 2;
  if (unit.lane === "center") return dirBit === 0 ? "upper" : "lower";
  return "center";
}

function findTarget(unit: Unit, armies: Record<PlayerSide, Army>, byId: Map<EntityId, Unit>): Unit | null {
  const enemyArmy = unit.side === "attacker" ? armies.defender : armies.attacker;
  let target = unit.targetId ? byId.get(unit.targetId) ?? null : null;
  if (target && target.status !== "dead") return target;

  const sameLane = enemyArmy.units.filter((u) => u.status !== "dead" && u.lane === unit.lane);
  const pool = sameLane.length > 0 ? sameLane : enemyArmy.units.filter((u) => u.status !== "dead");
  let best: Unit | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const enemy of pool) {
    const d = distance(unit, enemy);
    if (d < bestDist) {
      best = enemy;
      bestDist = d;
    }
  }
  return best;
}

function applySeparation(unit: Unit, laneUnits: Unit[], dt: number): { dx: number; dy: number } {
  let sepX = 0;
  let sepY = 0;
  for (const other of laneUnits) {
    if (other.id === unit.id || other.status === "dead") continue;
    const dx = unit.position.x - other.position.x;
    const dy = unit.position.y - other.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    const minDist = unit.radius + other.radius;
    if (dist < minDist) {
      const push = ((minDist - dist) / minDist) * SEPARATION_STRENGTH * dt;
      sepX += (dx / dist) * push;
      sepY += (dy / dist) * push;
    }
  }
  return { dx: sepX, dy: sepY };
}

export function moveArmies(
  armies: Record<PlayerSide, Army>,
  frontLine: FrontLineState,
  dt: number,
  nowMs: number = 0,
): Record<PlayerSide, Army> {
  const allUnits = [...armies.attacker.units, ...armies.defender.units];
  const byId = new Map(allUnits.map((u) => [u.id, u]));
  const laneUnits = {
    upper: allUnits.filter((u) => u.status !== "dead" && u.lane === "upper"),
    center: allUnits.filter((u) => u.status !== "dead" && u.lane === "center"),
    lower: allUnits.filter((u) => u.status !== "dead" && u.lane === "lower"),
  } as Record<Lane, Unit[]>;

  function moveUnit(unit: Unit): Unit {
    if (unit.status === "dead") return unit;

    const flankLane = cavalryFlankLane(unit, nowMs, dt);
    const nextLane = flankLane ?? unit.lane;
    const laneCenterY = LANE_Y[nextLane];
    let nextX = unit.position.x;
    let nextY = unit.position.y;

    const target = findTarget({ ...unit, lane: nextLane }, armies, byId);
    let status: Unit["status"] = "moving";
    let targetId = target?.id ?? null;

    if (target && target.status !== "dead") {
      const dx = target.position.x - nextX;
      const dy = target.position.y - nextY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const desiredRange = unit.stats.range + unit.radius + target.radius * 0.5;
      if (dist > desiredRange) {
        const step = Math.min(unit.stats.moveSpeed * dt, Math.max(0, dist - desiredRange));
        nextX += (dx / dist) * step;
        nextY += (dy / dist) * Math.min(step * 0.4, Math.abs(dy));
        status = "moving";
      } else {
        status = "attacking";
      }
    } else {
      const wallX = unit.side === "attacker" ? DEFENDER_WALL_X : ATTACKER_WALL_X;
      const dx = wallX - nextX;
      if (Math.abs(dx) > 1) {
        nextX += Math.sign(dx) * Math.min(Math.abs(dx), unit.stats.moveSpeed * dt);
        status = "moving";
      } else {
        status = "idle";
      }
    }

    const sep = applySeparation({ ...unit, lane: nextLane, position: { x: nextX, y: nextY } }, laneUnits[nextLane], dt);
    nextX += sep.dx;
    nextY += sep.dy;

    // River / bridge steering: center lane is attracted to bridge center, flanks are repelled from river core
    if (Math.abs(nextX - 85) < 14) {
      if (nextLane === "center") {
        nextY += (0 - nextY) * Math.min(1, BRIDGE_ATTRACTION * dt);
      } else {
        nextY += Math.sign(laneCenterY || 1) * RIVER_PUSH * dt;
      }
    }

    // Lane lock to keep formations readable
    nextY += (laneCenterY - nextY) * Math.min(1, LANE_LOCK_STRENGTH * dt);
    nextY = Math.max(laneCenterY - 11, Math.min(laneCenterY + 11, nextY));

    return {
      ...unit,
      lane: nextLane,
      position: { x: nextX, y: nextY },
      status,
      targetId,
    };
  }

  return {
    attacker: { ...armies.attacker, units: armies.attacker.units.map(moveUnit) },
    defender: { ...armies.defender, units: armies.defender.units.map(moveUnit) },
  };
}

export function applyPushForce(
  armies: Record<PlayerSide, Army>,
  frontLine: FrontLineState,
): FrontLineState {
  const segments = { ...frontLine.segments };
  for (const lane of LANES) {
    const attackers = armies.attacker.units.filter((u) => u.status !== "dead" && u.lane === lane);
    const defenders = armies.defender.units.filter((u) => u.status !== "dead" && u.lane === lane);

    let position = segments[lane].position;
    if (attackers.length && defenders.length) {
      const atkFront = Math.max(...attackers.map((u) => u.position.x));
      const defFront = Math.min(...defenders.map((u) => u.position.x));
      position = Math.max(0, Math.min(1, ((atkFront + defFront) * 0.5) / 170));
    } else if (attackers.length) {
      const atkFront = Math.max(...attackers.map((u) => u.position.x));
      position = Math.max(0, Math.min(1, atkFront / 170));
    } else if (defenders.length) {
      const defFront = Math.min(...defenders.map((u) => u.position.x));
      position = Math.max(0, Math.min(1, defFront / 170));
    }
    segments[lane] = { ...segments[lane], position, velocity: 0 };
  }
  return { segments };
}
