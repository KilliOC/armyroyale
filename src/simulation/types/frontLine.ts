import type { Lane, GameTimeMs } from "./common";

// ─── Front line segments ─────────────────────────────────────────────

/**
 * The front line represents the contested boundary between attacker and
 * defender across each lane. It shifts toward the defender when the
 * attacker pushes, and toward the attacker when the defender counter-
 * attacks.
 *
 * Position is expressed as a normalised float:
 *   0.0 = attacker's spawn edge
 *   1.0 = defender's wall
 *
 * The front line drives:
 *   - Where reinforcements can be deployed
 *   - Morale / momentum effects
 *   - Victory conditions (reaching the wall = breach opportunity)
 */

export interface FrontLineSegment {
  lane: Lane;
  /** Normalised position [0..1] from attacker edge to defender wall */
  position: number;
  /** Rate of change per tick (positive = pushing toward defender) */
  velocity: number;
  /** Timestamp of last significant shift (for momentum tracking) */
  lastShiftMs: GameTimeMs;
}

// ─── Aggregate front line state ──────────────────────────────────────

export interface FrontLineState {
  segments: Record<Lane, FrontLineSegment>;
}

// ─── Factory ─────────────────────────────────────────────────────────

/** Initial front line: centred in each lane */
export function createDefaultFrontLineState(): FrontLineState {
  const make = (lane: Lane): FrontLineSegment => ({
    lane,
    position: 0.5,
    velocity: 0,
    lastShiftMs: 0,
  });

  return {
    segments: {
      upper: make("upper"),
      center: make("center"),
      lower: make("lower"),
    },
  };
}
