import type { EntityId, Lane, PlayerSide, Vec2 } from "./common";
import type { CardId } from "./card";

// ─── Deployment payloads ─────────────────────────────────────────────

/**
 * A deployment command issued by a player (human or AI) during the
 * deployment or battle phase.
 */
export interface DeployCommand {
  /** Who is deploying */
  side: PlayerSide;
  /** Card being played from hand */
  cardId: CardId;
  /** Target lane */
  lane: Lane;
  /** Optional precise position within the lane (defaults to spawn zone) */
  position?: Vec2;
}

/**
 * Result of validating + executing a DeployCommand.
 */
export interface DeployResult {
  success: boolean;
  /** IDs of units spawned (empty on failure) */
  spawnedUnitIds: EntityId[];
  /** Supply remaining after deployment */
  remainingSupply: number;
  /** Human-readable reason if success is false */
  error?: string;
}
