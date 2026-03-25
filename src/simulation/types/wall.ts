import type { Lane } from "./common";

// ─── Wall segments ───────────────────────────────────────────────────

/**
 * The defender's wall is split into three segments aligned with lanes.
 * The "center" segment contains the gate — a weaker but openable section.
 *
 * Layout (defender's perspective, facing attacker):
 *
 *   ┌──────────────┐
 *   │  upper wall   │  ← Lane.upper
 *   ├──────────────┤
 *   │    gate       │  ← Lane.center (gate segment)
 *   ├──────────────┤
 *   │  lower wall   │  ← Lane.lower
 *   └──────────────┘
 */

export type WallSegmentType = "upper" | "gate" | "lower";

export interface WallSegment {
  type: WallSegmentType;
  /** Corresponding battlefield lane */
  lane: Lane;
  /** Current hit points */
  hp: number;
  /** Maximum hit points */
  maxHp: number;
  /** Whether this segment has been fully breached */
  breached: boolean;
}

// ─── Wall state (full wall) ──────────────────────────────────────────

/**
 * Aggregate state of the defender's wall.
 * Indexed by segment type for O(1) lookups.
 */
export interface WallState {
  segments: Record<WallSegmentType, WallSegment>;
}

// ─── Factory ─────────────────────────────────────────────────────────

/** Default HP values for prototype balance */
const DEFAULT_WALL_HP: Record<WallSegmentType, number> = {
  upper: 500,
  gate: 300, // gate is weaker
  lower: 500,
};

const SEGMENT_LANE_MAP: Record<WallSegmentType, Lane> = {
  upper: "upper",
  gate: "center",
  lower: "lower",
};

export function createDefaultWallState(): WallState {
  const makeSegment = (type: WallSegmentType): WallSegment => ({
    type,
    lane: SEGMENT_LANE_MAP[type],
    hp: DEFAULT_WALL_HP[type],
    maxHp: DEFAULT_WALL_HP[type],
    breached: false,
  });

  return {
    segments: {
      upper: makeSegment("upper"),
      gate: makeSegment("gate"),
      lower: makeSegment("lower"),
    },
  };
}
