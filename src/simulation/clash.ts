import type { Army, Unit, PlayerSide, EntityId } from "./types";

export interface CombatEvent {
  type: "kill" | "damage";
  attackerSide: PlayerSide;
  attackerId?: EntityId;
  targetId: EntityId;
  damage: number;
}

export interface ClashResult {
  attacker: Army;
  defender: Army;
  events: CombatEvent[];
}

function effectiveDamage(rawDamage: number, defense: number): number {
  return Math.max(1, rawDamage - defense);
}

function distance(a: Unit, b: Unit): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function findNearestEnemy(unit: Unit, enemies: Unit[]): Unit | null {
  let best: Unit | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const enemy of enemies) {
    if (enemy.status === "dead") continue;
    const d = distance(unit, enemy);
    if (d < bestDist) {
      bestDist = d;
      best = enemy;
    }
  }
  return best;
}

export function resolveClash(
  attackers: Army,
  defenders: Army,
  nowMs: number,
): ClashResult {
  const events: CombatEvent[] = [];
  const attackerUnits = attackers.units.map((u) => ({ ...u }));
  const defenderUnits = defenders.units.map((u) => ({ ...u }));

  const attackerById = new Map(attackerUnits.map((u) => [u.id, u]));
  const defenderById = new Map(defenderUnits.map((u) => [u.id, u]));

  function processSide(
    actingUnits: Unit[],
    enemyUnits: Unit[],
    enemyById: Map<EntityId, Unit>,
    attackerSide: PlayerSide,
  ) {
    for (const unit of actingUnits) {
      if (unit.status === "dead") continue;

      let target = unit.targetId ? enemyById.get(unit.targetId) ?? null : null;
      if (!target || target.status === "dead") {
        target = findNearestEnemy(unit, enemyUnits);
        unit.targetId = target?.id ?? null;
      }
      if (!target) {
        unit.status = "moving";
        continue;
      }

      const d = distance(unit, target);
      if (d > unit.stats.range + 1.5) {
        unit.status = "moving";
        continue;
      }

      if (nowMs - unit.lastAttackMs < unit.stats.attackIntervalMs) {
        unit.status = "attacking";
        continue;
      }

      const dmg = effectiveDamage(unit.stats.attack, target.stats.defense);
      target.hp -= dmg;
      target.recentHitUntilMs = nowMs + 500;
      unit.lastAttackMs = nowMs;
      unit.status = "attacking";

      const killed = target.hp <= 0;
      if (killed) {
        target.hp = 0;
        target.status = "dead";
      }

      events.push({
        type: killed ? "kill" : "damage",
        attackerSide,
        attackerId: unit.id,
        targetId: target.id,
        damage: dmg,
      });
    }
  }

  processSide(attackerUnits, defenderUnits, defenderById, "attacker");
  processSide(defenderUnits, attackerUnits, attackerById, "defender");

  return {
    attacker: { ...attackers, units: attackerUnits },
    defender: { ...defenders, units: defenderUnits },
    events,
  };
}
