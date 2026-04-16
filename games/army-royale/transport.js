import { createStarterLocalTransport } from "./local_transport.js";

// This file defines the one official switch between offline iteration and real
// online multiplayer. Keep the SpacetimeDB path as the default "multiplayer"
// interpretation unless the user explicitly asks for local-only play.

export function resolveStarterTransportMode(search = window.location.search) {
  const params = new URLSearchParams(search);
  const transport = (params.get("transport") || "").trim().toLowerCase();
  if (transport === "local" || transport === "offline")
    return "local";
  if (transport === "spacetimedb" || transport === "online" || transport === "multiplayer" || transport === "remote")
    return "spacetimedb";
  return "local";
}

export async function createStarterTransport(options = {}) {
  const mode = options.transportMode || resolveStarterTransportMode();
  if (mode === "spacetimedb") {
    const { createStarterSpacetimeTransport } = await import("./spacetimedb_transport.js");
    return createStarterSpacetimeTransport(options);
  }
  return createStarterLocalTransport(options);
}
