// Army Royale — local transport stub
// The main game currently runs its own simulation loop in starter_scene.js.
// This file exists as a placeholder for future multiplayer-compatible local
// transport, following the SDK convention (transport.js imports this).

import { multiplayer } from "@lfg/mini-engine";

export function createStarterLocalTransport() {
  return multiplayer.createLocalTransport({
    initialPhase: "local",
    createPlayerState({ sessionId, playerName }) {
      return { id: sessionId, name: playerName, data: {} };
    },
    createWorldState({ roomCode, maxPlayers }) {
      return { roomCode, maxPlayers, time: 0 };
    },
    applyCommand(snapshot, command, context) {
      return snapshot;
    },
  });
}
