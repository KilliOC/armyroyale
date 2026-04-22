// Army Royale — gameplay entry points for @lfg/mini-engine v0.2.4
import { ArmyRoyaleScene, type ArmyRoyaleUI } from './army_scene.js';

let game: ArmyRoyaleScene | null = null;

export async function begin(Module: any, Mini: any, sceneHandle: number, _assetScenes: any): Promise<void> {
  const ui: ArmyRoyaleUI = {
    timerEl:     document.getElementById('timer-text'),
    blueHpEl:    document.getElementById('blue-hp-text'),
    redHpEl:     document.getElementById('red-hp-text'),
    blueHpBar:   document.getElementById('blue-hp-bar'),
    redHpBar:    document.getElementById('red-hp-bar'),
    phaseEl:     document.getElementById('phase-text'),
    statusEl:    document.getElementById('status-text'),
    elixirValEl: document.getElementById('elixir-value'),
    cardTrayEl:  document.getElementById('card-tray'),
  };

  game = new ArmyRoyaleScene(Module, Mini, sceneHandle, ui);
  await game.init();
}

export function tick(Module: any, Mini: any, sceneHandle: any, dt: number): void {
  void Module; void Mini; void sceneHandle;
  if (game) game.tick(dt);
}

export function end(): void {
  game = null;
}
