import type { Army, Unit, PlayerSide, EntityId } from "./types";

// ─── Combat event ─────────────────────────────────────────────────────

export interface CombatEvent {
  type: "kill" | "damage";
  /** Side that dealt the damage */
  attackerSide: PlayerSide;
  targetId: EntityId;
  damage: number;
}

export interface ClashResult {
  attacker: Army;
  defender: Army;
  events: CombatEvent[];
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Damage per second a single unit deals */
function unitDps(unit: Unit): number {
  return (unit.stats.attack * 1000) / unit.stats.attackIntervalMs;
}

/** Effective damage after defense reduction, minimum 1 */
function effectiveDamage(rawDamage: number, defense: number): number {
  return Math.max(1, rawDamage - defense);
}

/**
 * Distributes total DPS pool evenly across target units for dt seconds.
 * Returns updated units; appends kill/damage events.
 */
function applyPoolDamage(
  targets: Unit[],
  totalDps: number,
  attackerSide: PlayerSide,
  dt: number,
  events: CombatEvent[],
): Unit[] {
  if (targets.length === 0 || totalDps <= 0) return targets;

  const dpsPerTarget = totalDps / targets.length;

  return targets.map((target) => {
    const raw = dpsPerTarget * dt;
    const dmg = effectiveDamage(raw, target.stats.defense);
    const newHp = target.hp - dmg;
    const isDead = newHp <= 0;

    events.push({
      type: isDead ? "kill" : "damage",
      attackerSide,
      targetId: target.id,
      damage: dmg,
    });

    return { ...target, hp: newHp, status: isDead ? ("dead" as const) : target.status };
  });
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Resolves a combat clash between two opposing armies for dt seconds.
 *
 * Both sides exchange DPS simultaneously (simultaneous resolution), so a
 * unit can kill an enemy while being killed in the same tick. Dead units
 * (hp <= 0) are removed from the returned armies so survivors continue
 * pushing into the next tick.
 *
 * @param attackers - The attacking army
 * @param defenders - The defending army
 * @param dt        - Time delta in seconds
 */
export function resolveClash(
  attackers: Army,
  defenders: Army,
  dt: number,
): ClashResult {
  const events: CombatEvent[] = [];

  const livingAttackers = attackers.units.filter((u) => u.status !== "dead");
  const livingDefenders = defenders.units.filter((u) => u.status !== "dead");

  const totalAttackerDps = livingAttackers.reduce((sum, u) => sum + unitDps(u), 0);
  const totalDefenderDps = livingDefenders.reduce((sum, u) => sum + unitDps(u), 0);

  // Simultaneous resolution: both sides receive damage calculated from
  // pre-tick HP, so dying units still deal their full tick of damage.
  const updatedDefenders = applyPoolDamage(
    livingDefenders,
    totalAttackerDps,
    "attacker",
    dt,
    events,
  );
  const updatedAttackers = applyPoolDamage(
    livingAttackers,
    totalDefenderDps,
    "defender",
    dt,
    events,
  );

  return {
    attacker: {
      ...attackers,
      units: updatedAttackers.filter((u) => u.hp > 0),
    },
    defender: {
      ...defenders,
      units: updatedDefenders.filter((u) => u.hp > 0),
    },
    events,
  };
}
