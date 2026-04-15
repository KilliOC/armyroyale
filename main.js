import { startGame } from '@lfg/mini-engine';
import { createArmyRoyaleGame } from './starter_scene.js';

// Log cross-origin isolation status (informational only — don't block boot)
console.log('[AR] crossOriginIsolated:', window.crossOriginIsolated, 'gpu:', !!navigator.gpu);

// Loading progress UI
const barFill = document.getElementById('loading-bar-fill');
const loadText = document.getElementById('loading-text');
const overlay = document.getElementById('loading-overlay');

function setProgress(pct, label) {
  if (barFill) barFill.style.width = `${Math.min(100, pct)}%`;
  if (loadText) loadText.textContent = label || 'Loading...';
}

// Debug canvas size
const debugCanvas = document.getElementById('canvas');
const dbgRect = debugCanvas?.getBoundingClientRect();
console.log('[AR] Canvas rect:', dbgRect?.width, 'x', dbgRect?.height, 'DPR:', window.devicePixelRatio, 'crossOriginIsolated:', window.crossOriginIsolated, 'gpu:', !!navigator.gpu);

setProgress(10, 'Initializing engine...');

// Simulate progress steps while the engine loads
let fakeProgress = 10;
const progressInterval = setInterval(() => {
  fakeProgress = Math.min(fakeProgress + 3, 85);
  setProgress(fakeProgress, fakeProgress < 40 ? 'Loading engine...' : fakeProgress < 70 ? 'Building battlefield...' : 'Preparing troops...');
}, 200);

try {
  await startGame(createArmyRoyaleGame({
    timerEl: document.getElementById('match-timer'),
    blueHpEl: document.getElementById('blue-hp'),
    redHpEl: document.getElementById('red-hp'),
    blueHpBar: document.getElementById('blue-hp-bar'),
    redHpBar: document.getElementById('red-hp-bar'),
    phaseEl: document.getElementById('phase-label'),
    statusEl: document.getElementById('status-text'),
    elixirValEl: document.getElementById('elixir-value'),
    cardTrayEl: document.getElementById('card-tray'),
  }));

  // Game loaded successfully
  clearInterval(progressInterval);
  setProgress(100, 'Ready!');

  // Reveal game UI and hide loading screen
  setTimeout(() => {
    document.body.classList.add('game-ready');
    if (overlay) overlay.classList.add('hidden');
    setTimeout(() => { if (overlay) overlay.style.display = 'none'; }, 600);
  }, 300);
} catch (e) {
  clearInterval(progressInterval);
  const errMsg = e?.message || String(e);
  const hasGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
  const isolated = !!window.crossOriginIsolated;
  const detail = `Error: ${errMsg}\nWebGPU: ${hasGPU ? 'yes' : 'NO'}\nCross-Origin-Isolated: ${isolated ? 'yes' : 'NO'}`;
  setProgress(0, 'FAILED TO LOAD — TAP TO RETRY');
  if (loadText) loadText.style.color = '#ff6060';
  
  // Show technical details below
  const detailEl = document.createElement('div');
  detailEl.style.cssText = 'color:#888;font-size:11px;margin-top:12px;white-space:pre-wrap;max-width:80vw;text-align:center;';
  detailEl.textContent = detail;
  loadText?.parentNode?.appendChild(detailEl);
  
  console.error('[ArmyRoyale] Load failed:', e);
  if (overlay) overlay.addEventListener('click', () => location.reload());
}
