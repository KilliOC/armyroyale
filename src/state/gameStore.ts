import { create } from "zustand";
import type { CardId } from "../simulation/types";

export type GamePhase = "lobby" | "deploying" | "battle" | "results";

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

  // Actions
  setPhase: (phase: GamePhase) => void;
  incrementTick: () => void;
  toggleHud: () => void;
  setHand: (hand: CardId[]) => void;
  setNextCard: (cardId: CardId | null) => void;
  setElixir: (elixir: number) => void;
  setActiveCard: (cardId: CardId | null) => void;
  removeCardFromHand: (cardId: CardId) => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: "lobby",
  tick: 0,
  hudVisible: true,
  hand: [],
  nextCard: null,
  elixir: 5,
  activeCardId: null,

  setPhase: (phase) => set({ phase }),
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
}));
