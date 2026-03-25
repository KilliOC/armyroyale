import type { EntityId, GameTimeMs, PlayerSide } from "./common";
import type { Army } from "./army";
import type { WallState } from "./wall";
import type { FrontLineState } from "./frontLine";

// ─── Match phases ────────────────────────────────────────────────────

/**
 * Ordered phases of a match:
 *
 *  setup      – players configure armies & pick cards before the horn
 *  deployment – real-time placement of units onto the field
 *  battle     – simulation runs, units fight, front line shifts
 *  resolution – outcome calculated, XP/rewards distributed
 */
export type MatchPhase = "setup" | "deployment" | "battle" | "resolution";

// ─── Match outcome ───────────────────────────────────────────────────

export interface MatchOutcome {
  /** Winning side, or null for a draw */
  winner: PlayerSide | null;
  /** Per-side summary stats */
  stats: Record<PlayerSide, MatchSideStats>;
}

export interface MatchSideStats {
  unitsDeployed: number;
  unitsLost: number;
  damageDealt: number;
  wallSegmentsDestroyed: number;
}

// ─── Match config (immutable per match) ──────────────────────────────

export interface MatchConfig {
  /** Maximum deployment time in ms */
  deploymentTimeMs: GameTimeMs;
  /** Maximum battle duration in ms before forced resolution */
  battleTimeLimitMs: GameTimeMs;
  /** Starting resources per side */
  startingSupply: number;
  /** Tick rate (simulation steps per second) */
  tickRate: number;
}

/** Sensible prototype defaults */
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  deploymentTimeMs: 30_000,
  battleTimeLimitMs: 180_000,
  startingSupply: 100,
  tickRate: 20,
};

// ─── Match state (mutable, authoritative) ────────────────────────────

/**
 * Top-level simulation state for a single match.
 * Contains no rendering-specific fields.
 */
export interface MatchState {
  id: EntityId;
  config: MatchConfig;
  phase: MatchPhase;

  /** Current simulation tick (0-indexed) */
  tick: number;
  /** Elapsed game time in ms */
  elapsedMs: GameTimeMs;

  /** Per-side army state */
  armies: Record<PlayerSide, Army>;

  /** Defensive wall state (belongs to the defender) */
  wall: WallState;

  /** Front line state across lanes */
  frontLine: FrontLineState;

  /** Populated after resolution phase */
  outcome: MatchOutcome | null;
}
