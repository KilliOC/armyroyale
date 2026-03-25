// ─── Common primitives ───────────────────────────────────────────────

/** Unique identifier (opaque string at runtime, branded for type safety) */
export type EntityId = string & { readonly __brand: unique symbol };

/** 2D position on the battlefield grid */
export interface Vec2 {
  x: number;
  y: number;
}

/** Millisecond timestamp (game-clock, not wall-clock) */
export type GameTimeMs = number;

/** Player seat in a 1v1 match */
export type PlayerSide = "attacker" | "defender";

/** The three horizontal lanes that divide the battlefield */
export type Lane = "upper" | "center" | "lower";
