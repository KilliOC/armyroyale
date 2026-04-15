// Army Royale — LFG Mini Engine 3D entry point
import { startGame } from '@lfg/mini-engine';
import { createArmyRoyaleGame } from './starter_scene.js';

await startGame(createArmyRoyaleGame({
  timerEl: document.getElementById('match-timer'),
  blueHpEl: document.getElementById('blue-hp'),
  redHpEl: document.getElementById('red-hp'),
  phaseEl: document.getElementById('phase-label'),
  statusEl: document.getElementById('status-text'),
  elixirValEl: document.getElementById('elixir-value'),
  elixirBarEl: document.getElementById('elixir-bar'),
  cardTrayEl: document.getElementById('card-tray'),
  statusElement: document.getElementById('status-text'),
}));
