import type { EntityId, Vec2, Lane, PlayerSide, GameTimeMs } from "./common";
import type { CardId } from "./card";

// ─── Unit stats ──────────────────────────────────────────────────────

export interface UnitStats {
  maxHp: number;
  attack: number;
  defense: number;
  /** Tiles per second */
  moveSpeed: number;
  /** Attack cooldown in ms */
  attackIntervalMs: GameTimeMs;
  /** Tile range for ranged units; 1 = melee */
  range: number;
}

// ─── Unit state (individual soldier on the field) ────────────────────

export type UnitStatus = "idle" | "moving" | "attacking" | "retreating" | "dead";

export interface Unit {
  id: EntityId;
  /** Card template this unit was spawned from */
  cardId: CardId;
  side: PlayerSide;
  lane: Lane;
  position: Vec2;

  hp: number;
  stats: UnitStats;
  status: UnitStatus;

  /** EntityId of current target, if any */
  targetId: EntityId | null;
  /** Last game time when this unit attacked */
  lastAttackMs: GameTimeMs;
  /** Until when the unit should be considered recently hit (for VFX/UI) */
  recentHitUntilMs: GameTimeMs;

  /** Game time when this unit was deployed */
  deployedAtMs: GameTimeMs;
}

// ─── Army (per-side container) ───────────────────────────────────────

export interface Army {
  side: PlayerSide;

  /** Available supply for deploying more units */
  supply: number;

  /** Cards in hand (available to play) */
  hand: CardId[];

  /** Cards in the draw pile */
  deck: CardId[];

  /** All living + dead units belonging to this army */
  units: Unit[];
}
