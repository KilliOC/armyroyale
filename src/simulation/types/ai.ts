import type { PlayerSide, Lane, GameTimeMs } from "./common";
import type { CardId } from "./card";
import type { FrontLineSegment } from "./frontLine";
import type { WallSegment } from "./wall";
import type { DeployCommand } from "./deployment";

// ─── AI decision inputs ──────────────────────────────────────────────

/**
 * Snapshot of game-relevant information fed to the AI decision layer
 * each tick. Kept lean and rendering-free so AI logic can run headless.
 */
export interface AISnapshot {
  side: PlayerSide;
  tick: number;
  elapsedMs: GameTimeMs;

  /** Available supply */
  supply: number;

  /** Cards currently in hand */
  hand: CardId[];

  /** Per-lane summaries (cheaper than passing full unit arrays) */
  laneSummaries: Record<Lane, LaneSummary>;

  /** Current front line state per lane */
  frontLine: Record<Lane, FrontLineSegment>;

  /** Wall segment state (relevant for both sides) */
  wall: Record<Lane, WallSegment>;
}

/** Condensed per-lane info for AI evaluation */
export interface LaneSummary {
  lane: Lane;
  /** Friendly unit count in this lane */
  friendlyCount: number;
  /** Enemy unit count in this lane */
  enemyCount: number;
  /** Average HP ratio of friendly units (0..1) */
  friendlyHpRatio: number;
  /** Average HP ratio of enemy units (0..1) */
  enemyHpRatio: number;
  /** Whether the wall segment in this lane is breached */
  wallBreached: boolean;
}

// ─── AI decision output ──────────────────────────────────────────────

/**
 * What the AI wants to do this tick. May contain zero or more deploy
 * commands and an optional priority hint per lane.
 */
export interface AIDecision {
  /** Deploy commands to execute (validated by simulation before applying) */
  deploys: DeployCommand[];
  /** Optional lane the AI considers highest priority (for logging / debug) */
  focusLane?: Lane;
}
