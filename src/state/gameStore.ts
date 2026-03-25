import { create } from "zustand";
import type { CardId, PlayerSide } from "../simulation/types";
import type { WallState } from "../simulation/types";

export type GamePhase = "lobby" | "deploying" | "battle" | "results";
export type MatchPhase = "battle" | "surge" | "suddendeath";

export interface MatchSideStats {
  unitsDeployed: number;
  unitsLost: number;
  damageDealt: number;
  wallSegmentsDestroyed: number;
}

export interface MatchOutcome {
  winner: PlayerSide | null;
  reason: "breach" | "timeout" | "surrender";
  stats: Record<PlayerSide, MatchSideStats>;
}

export interface GameState {
  /** Current phase of the game */
  phase: GamePhase;
  /** Simulation tick count */
  tick: number;
  /** Whether the HUD is visible */
  hudVisible: boolean;

  /** Cards currently in the player's hand */
  hand: CardId[];
  /** Next card to draw */
  nextCard: CardId | null;
  /** Current elixir amount */
  elixir: number;
  /** Card currently selected for deployment */
  activeCardId: CardId | null;
  /** Match outcome, set when phase transitions to "results" */
  outcome: MatchOutcome | null;
  /** Current wall state (synced from simulation each tick) */
  wallState: WallState | null;
  /** Remaining match time in ms (battle phase only) */
  matchTimeMs: number;
  /** Remaining deploy phase time in ms */
  deployTimeMs: number;
  /** Current battle sub-phase (null outside battle) */
  matchPhase: MatchPhase | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setMatchPhase: (matchPhase: MatchPhase | null) => void;
  incrementTick: () => void;
  toggleHud: () => void;
  setHand: (hand: CardId[]) => void;
  setNextCard: (cardId: CardId | null) => void;
  setElixir: (elixir: number) => void;
  setActiveCard: (cardId: CardId | null) => void;
  removeCardFromHand: (cardId: CardId) => void;
  setOutcome: (outcome: MatchOutcome | null) => void;
  setWallState: (wallState: WallState | null) => void;
  setMatchTimeMs: (t: number) => void;
  setDeployTimeMs: (t: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: "lobby",
  tick: 0,
  hudVisible: true,
  hand: [],
  nextCard: null,
  elixir: 5,
  activeCardId: null,
  outcome: null,
  wallState: null,
  matchTimeMs: 90_000,
  deployTimeMs: 30_000,
  matchPhase: null,

  setPhase: (phase) => set({ phase }),
  setMatchPhase: (matchPhase) => set({ matchPhase }),
  incrementTick: () => set((s) => ({ tick: s.tick + 1 })),
  toggleHud: () => set((s) => ({ hudVisible: !s.hudVisible })),
  setHand: (hand) => set({ hand }),
  setNextCard: (cardId) => set({ nextCard: cardId }),
  setElixir: (elixir) => set({ elixir }),
  setActiveCard: (cardId) => set({ activeCardId: cardId }),
  removeCardFromHand: (cardId) =>
    set((s) => {
      const idx = s.hand.indexOf(cardId);
      if (idx === -1) return {};
      const hand = [...s.hand];
      hand.splice(idx, 1);
      return { hand };
    }),
  setOutcome: (outcome) => set({ outcome }),
  setWallState: (wallState) => set({ wallState }),
  setMatchTimeMs: (matchTimeMs) => set({ matchTimeMs }),
  setDeployTimeMs: (deployTimeMs) => set({ deployTimeMs }),
}));
