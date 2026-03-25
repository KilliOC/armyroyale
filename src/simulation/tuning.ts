// ─── Centralized tuning values ────────────────────────────────────────
//
// All balance-sensitive constants live here so they can be tweaked at
// runtime via DebugPanel without touching simulation logic files.
//
// Add new tunables here and expose them in DebugPanel.tsx.

export interface TuningValues {
  // Wall
  wallHpUpper: number;
  wallHpGate: number;
  wallHpLower: number;
  gateAttackMultiplier: number;

  // Front line physics
  frontLineFriction: number;
  pushForceScale: number;
  breachThreshold: number;
  wallEngageThreshold: number;

  // Unit speeds (tile/s)
  infantryMoveSpeed: number;
  archerMoveSpeed: number;
  cavalryMoveSpeed: number;
  siegeMoveSpeed: number;

  // DPS multipliers (applied on top of card base stats)
  dpsMultiplierAttacker: number;
  dpsMultiplierDefender: number;

  // Elixir / supply
  elixirRegenPerSecond: number;
  elixirMax: number;

  // AI
  aiDeployIntervalMs: number;
  aiDeployJitterMs: number;
}

/** Live tuning singleton — mutate at runtime from DebugPanel */
export const TUNING: TuningValues = {
  // Wall
  wallHpUpper: 500,
  wallHpGate: 300,
  wallHpLower: 500,
  gateAttackMultiplier: 1.5,

  // Front line physics
  frontLineFriction: 0.85,
  pushForceScale: 0.005,
  breachThreshold: 0.95,
  wallEngageThreshold: 0.9,

  // Speeds
  infantryMoveSpeed: 3,
  archerMoveSpeed: 2.5,
  cavalryMoveSpeed: 6,
  siegeMoveSpeed: 1,

  // DPS multipliers
  dpsMultiplierAttacker: 1.0,
  dpsMultiplierDefender: 1.0,

  // Elixir
  elixirRegenPerSecond: 2.5,
  elixirMax: 10,

  // AI
  aiDeployIntervalMs: 3000,
  aiDeployJitterMs: 1000,
};

/** Reset all values to their original defaults */
export function resetTuning(): void {
  const defaults: TuningValues = {
    wallHpUpper: 500,
    wallHpGate: 300,
    wallHpLower: 500,
    gateAttackMultiplier: 1.5,
    frontLineFriction: 0.85,
    pushForceScale: 0.005,
    breachThreshold: 0.95,
    wallEngageThreshold: 0.9,
    infantryMoveSpeed: 3,
    archerMoveSpeed: 2.5,
    cavalryMoveSpeed: 6,
    siegeMoveSpeed: 1,
    dpsMultiplierAttacker: 1.0,
    dpsMultiplierDefender: 1.0,
    elixirRegenPerSecond: 2.5,
    elixirMax: 10,
    aiDeployIntervalMs: 3000,
    aiDeployJitterMs: 1000,
  };
  Object.assign(TUNING, defaults);
}

/** Type-safe key list for iterating tunables */
export const TUNING_KEYS = Object.keys(TUNING) as (keyof TuningValues)[];
