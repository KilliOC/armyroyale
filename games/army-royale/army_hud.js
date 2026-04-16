import { ARMY_CARDS } from "./army_cards.js";

export function installArmyHud(root, onDeploy) {
  const hand = root.querySelector("#army-hand");
  const laneButtons = [...root.querySelectorAll("[data-lane]")];
  let selectedCardId = ARMY_CARDS[0]?.id || null;

  if (hand) {
    hand.innerHTML = ARMY_CARDS.map((card) => `
      <button class="army-card${card.id === selectedCardId ? " is-selected" : ""}" data-card-id="${card.id}">
        <span>${card.name}</span>
        <strong>${card.cost}</strong>
      </button>
    `).join("");

    hand.addEventListener("click", (event) => {
      const button = event.target.closest("[data-card-id]");
      if (!button) return;
      selectedCardId = button.getAttribute("data-card-id");
      [...hand.querySelectorAll(".army-card")].forEach((node) => node.classList.toggle("is-selected", node === button));
    });
  }

  laneButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!selectedCardId) return;
      onDeploy?.(button.getAttribute("data-lane"), selectedCardId);
    });
  });

  return {
    update(snapshot) {
      const blueElixir = root.querySelector("#blue-elixir");
      const timer = root.querySelector("#match-timer");
      const result = root.querySelector("#result-text");
      if (blueElixir) blueElixir.textContent = snapshot ? snapshot.elixir.blue.toFixed(1) : "0.0";
      if (timer) timer.textContent = snapshot ? Math.ceil(snapshot.timeRemaining).toString() : "0";
      if (result) {
        if (!snapshot) result.textContent = "Fight";
        else if (snapshot.phase === "result") result.textContent = `Winner: ${snapshot.winner}`;
        else {
          const laneSummary = snapshot.lanes.map((lane) => `${lane.id}:${lane.frontline.toFixed(1)}`).join(" | ");
          result.textContent = laneSummary;
        }
      }
    },
  };
}
