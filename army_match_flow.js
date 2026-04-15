import { createInitialArmyRoyaleState, deployCard, tickArmyRoyaleState } from "./army_simulation.js";

const RED_AI_SEQUENCE = [
  ["mid", "monkey"],
  ["top", "hamster"],
  ["bot", "frog"],
  ["mid", "frog"],
  ["bot", "duckling"],
  ["top", "monkey"],
  ["mid", "duckling"],
  ["bot", "hamster"],
];

export function createArmyRoyaleMatch() {
  const state = createInitialArmyRoyaleState();
  let aiTimer = 1.5;
  let aiIndex = 0;

  return {
    state,
    tick(dt) {
      tickArmyRoyaleState(state, dt);
      if (state.phase === "live") {
        aiTimer -= dt;
        if (aiTimer <= 0) {
          const [laneId, cardId] = RED_AI_SEQUENCE[aiIndex % RED_AI_SEQUENCE.length];
          deployCard(state, "red", laneId, cardId);
          aiIndex += 1;
          aiTimer = 2.2;
        }
      }
      return state;
    },
    deploy(side, laneId, cardId) {
      return deployCard(state, side, laneId, cardId);
    },
  };
}
