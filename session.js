// Keep session/snapshot flow separate from rendering so the same starter can
// boot locally first and switch to real SpacetimeDB online play later without
// rewriting presentation code.
import { createStarterTransport, resolveStarterTransportMode } from "./transport.js";

function readLocalPlayer(snapshot) {
  if (!snapshot?.sessionId)
    return null;
  return snapshot.players.get(snapshot.sessionId) || null;
}

export async function createStarterSession(options = {}) {
  const transportMode = options.transportMode || resolveStarterTransportMode();
  const transport = await createStarterTransport({ ...options, transportMode });
  const listeners = new Set();
  let snapshot = transport.getSnapshot();

  function emit() {
    for (const listener of listeners)
      listener(snapshot);
  }

  const unsubscribe = transport.subscribe((event) => {
    snapshot = event.snapshot || transport.getSnapshot();
    emit();
  });

  snapshot = await transport.connect({
    playerName: options.playerName || "Driver 1",
    roomCode: options.roomCode,
    maxPlayers: options.maxPlayers || 4,
  });
  emit();

  return {
    transportMode,
    getSnapshot() {
      return snapshot;
    },
    getLocalPlayer() {
      return readLocalPlayer(snapshot);
    },
    step(input, dtSeconds) {
      transport.sendCommand({ type: "tick", input, dtSeconds });
      snapshot = transport.getSnapshot();
      emit();
      return snapshot;
    },
    reset() {
      transport.sendCommand({ type: "reset" });
      snapshot = transport.getSnapshot();
      emit();
      return snapshot;
    },
    onSnapshot(listener) {
      listeners.add(listener);
      listener(snapshot);
      return () => {
        listeners.delete(listener);
      };
    },
    async disconnect() {
      unsubscribe();
      await transport.disconnect();
      snapshot = transport.getSnapshot();
    },
  };
}

export { resolveStarterTransportMode };
