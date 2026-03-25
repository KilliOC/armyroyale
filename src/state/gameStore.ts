import { create } from "zustand";

export type GamePhase = "lobby" | "deploying" | "battle" | "results";

export interface GameState {
  /** Current phase of the game */
  phase: GamePhase;
  /** Simulation tick count */
  tick: number;
  /** Whether the HUD is visible */
  hudVisible: boolean;

  // Actions
  setPhase: (phase: GamePhase) => void;
  incrementTick: () => void;
  toggleHud: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: "lobby",
  tick: 0,
  hudVisible: true,

  setPhase: (phase) => set({ phase }),
  incrementTick: () => set((s) => ({ tick: s.tick + 1 })),
  toggleHud: () => set((s) => ({ hudVisible: !s.hudVisible })),
}));
