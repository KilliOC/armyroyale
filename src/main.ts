import { registerGameplayComponents, startGame } from "@lfg/mini-engine";
import { gameplayComponents } from "./gameplay/game_components";
import { begin, tick, end } from "./gameplay/gameplay";

// Loading progress UI
const barFill = document.getElementById("loading-bar-fill");
const loadText = document.getElementById("loading-text");
const overlay = document.getElementById("loading-overlay");

function setProgress(pct: number, label: string) {
  if (barFill) barFill.style.width = `${Math.min(100, pct)}%`;
  if (loadText) loadText.textContent = label;
}

setProgress(10, "Initializing engine...");

let fakeProgress = 10;
const progressInterval = setInterval(() => {
  fakeProgress = Math.min(fakeProgress + 3, 85);
  const label =
    fakeProgress < 40
      ? "Loading engine..."
      : fakeProgress < 70
        ? "Building battlefield..."
        : "Preparing troops...";
  setProgress(fakeProgress, label);
}, 200);

try {
  await registerGameplayComponents(gameplayComponents);

  await startGame({
    begin,
    tick,
    end,
  });

  clearInterval(progressInterval);
  setProgress(100, "Ready!");

  setTimeout(() => {
    document.body.classList.add("game-ready");
    if (overlay) overlay.classList.add("hidden");
    setTimeout(() => {
      if (overlay) overlay.style.display = "none";
    }, 600);
  }, 300);
} catch (e: unknown) {
  clearInterval(progressInterval);
  const errMsg = e instanceof Error ? e.message : String(e);
  const hasGPU = typeof navigator !== "undefined" && !!(navigator as any).gpu;
  const isolated = !!window.crossOriginIsolated;
  const detail = `Error: ${errMsg}\nWebGPU: ${hasGPU ? "yes" : "NO"}\nCross-Origin-Isolated: ${isolated ? "yes" : "NO"}`;
  setProgress(0, "FAILED TO LOAD — TAP TO RETRY");
  if (loadText) loadText.style.color = "#ff6060";

  const detailEl = document.createElement("div");
  detailEl.style.cssText =
    "color:#888;font-size:11px;margin-top:12px;white-space:pre-wrap;max-width:80vw;text-align:center;";
  detailEl.textContent = detail;
  loadText?.parentNode?.appendChild(detailEl);

  console.error("[ArmyRoyale] Load failed:", e);
  if (overlay) overlay.addEventListener("click", () => location.reload());
}
