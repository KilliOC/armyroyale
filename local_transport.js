import { multiplayer } from "@lfg/mini-engine";
import {
  createCityLayoutModel,
  createInitialDriverState,
} from "./shared_world.js";
import {
  advanceCheckpoints,
  clonePlayerState,
  simulateTick,
} from "./driver_simulation.js";

export function createStarterLocalTransport() {
  const layout = createCityLayoutModel();
  return multiplayer.createLocalTransport({
    initialPhase: "local",
    createPlayerState({ sessionId, playerName }) {
      return {
        id: sessionId,
        name: playerName,
        data: createInitialDriverState(),
      };
    },
    createWorldState({ roomCode, maxPlayers }) {
      return {
        roomCode,
        maxPlayers,
        time: 0,
        layout,
        statusMessage: "Local transport active. This same starter switches to real online mode with ?transport=spacetimedb.",
      };
    },
    applyCommand(snapshot, command, context) {
      const players = new Map(snapshot.players);
      const currentPlayer = players.get(context.sessionId);
      if (!currentPlayer)
        return snapshot;

      const nextPlayer = clonePlayerState(currentPlayer);
      const worldState = {
        ...snapshot.world,
        time: (snapshot.world?.time || 0) + (command.type === "tick" ? command.dtSeconds : 0),
      };

      if (command.type === "reset") {
        nextPlayer.data = createInitialDriverState();
        worldState.statusMessage = "Driver reset to the start line. Local mode preserves the same session/transport structure used for SpacetimeDB play.";
      } else if (command.type === "tick") {
        simulateTick(nextPlayer.data, layout, command.input, command.dtSeconds);
        worldState.statusMessage = advanceCheckpoints(nextPlayer.data, worldState);
      }

      players.set(context.sessionId, nextPlayer);
      return {
        ...snapshot,
        phase: "running",
        players,
        world: worldState,
      };
    },
  });
}
