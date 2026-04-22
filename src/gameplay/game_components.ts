import {
  createGameplayComponentLibrary,
  type GameplayComponentDescriptor,
} from "@lfg/mini-engine";

export const gameplayComponents: GameplayComponentDescriptor[] = [];

export const gameplayComponentLibrary = createGameplayComponentLibrary(gameplayComponents);
export const GameComponents = gameplayComponentLibrary.Components;
export const GameComponentIds = gameplayComponentLibrary.ComponentIds;
export const GameComponentById = gameplayComponentLibrary.ComponentById;
