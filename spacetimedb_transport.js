import {
  advanceCheckpoints,
  cloneDriverState,
  simulateTick,
} from "./driver_simulation.js";
import {
  createCityLayoutModel,
  createInitialDriverState,
} from "./shared_world.js";

/*
 * This adapter intentionally follows SpacetimeDB's documented TypeScript flow:
 * 1. create a module directory
 * 2. run `spacetime generate --lang typescript --out-dir src/module_bindings --module-path <module-dir>`
 * 3. import the generated module bindings here
 *
 * Treat this transport plus template/spacetimedb_module/ as a matched pair.
 * For starter-derived multiplayer games, copy and adapt these files first.
 * Do not invent a second online transport or a brand-new reducer/table contract
 * unless you are intentionally updating both sides together and regenerating bindings.
 *
 * Official docs:
 * https://spacetimedb.com/docs/modules/typescript/quickstart/
 * https://spacetimedb.com/docs/clients/typescript/
 */

function getSpacetimeUrl() {
  if (typeof window !== "undefined" && window.__SPACETIMEDB_URL__)
    return window.__SPACETIMEDB_URL__;
  return "ws://localhost:3000";
}

function getDatabaseName() {
  if (typeof window !== "undefined" && window.__SPACETIMEDB_DATABASE__)
    return window.__SPACETIMEDB_DATABASE__;
  return "mini-starter";
}

function getTokenStorageKey() {
  const w = window;
  if (!w.__starter_stdb_token_key__)
    w.__starter_stdb_token_key__ = `starter_stdb_auth_${Math.random().toString(36).slice(2, 8)}`;
  return w.__starter_stdb_token_key__;
}

function identityToString(identity) {
  if (!identity)
    return "";
  if (typeof identity === "string")
    return identity;
  if (typeof identity.toHexString === "function")
    return identity.toHexString();
  return String(identity);
}

function parseDriverState(raw) {
  if (!raw)
    return createInitialDriverState();
  try {
    return {
      ...createInitialDriverState(),
      ...JSON.parse(raw),
    };
  } catch {
    return createInitialDriverState();
  }
}

function parseWorldState(rawGameData, layout, roomCode, maxPlayers) {
  try {
    return {
      roomCode,
      maxPlayers,
      time: 0,
      layout,
      statusMessage: "Connected through SpacetimeDB transport.",
      ...JSON.parse(rawGameData || "{}"),
      layout,
    };
  } catch {
    return {
      roomCode,
      maxPlayers,
      time: 0,
      layout,
      statusMessage: "Connected through SpacetimeDB transport.",
    };
  }
}

async function waitFor(predicate, timeoutMs = 1000, intervalMs = 50) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = predicate();
    if (value)
      return value;
    if (Date.now() >= deadline)
      return null;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

async function loadModuleBindings() {
  try {
    return await import("./module_bindings/index.js");
  } catch (error) {
    throw new Error(
      "spacetimedb_transport.js expects generated module bindings at ./module_bindings/index.js. Start from the packaged template/spacetimedb_module scaffold, then run `spacetime generate --lang typescript --out-dir games/<game-name>/module_bindings --module-path <your-module-dir>` before switching to ?transport=spacetimedb.",
      { cause: error },
    );
  }
}

export async function createStarterSpacetimeTransport(options = {}) {
  const moduleBindings = await loadModuleBindings();
  const layout = createCityLayoutModel();
  const listeners = new Set();

  let conn = null;
  let myIdentity = null;
  let currentRoomCode = null;
  let localPlayerState = createInitialDriverState();
  let snapshot = {
    sessionId: null,
    roomCode: null,
    phase: "connecting",
    players: new Map(),
    world: null,
    mode: "remote",
    authoritative: false,
    connected: false,
    connectionState: "connecting",
  };

  function emit(event) {
    for (const listener of listeners)
      listener(event);
  }

  function resolveRoom() {
    if (!conn || !currentRoomCode || !conn.db?.rooms?.iter)
      return null;
    for (const room of conn.db.rooms.iter()) {
      if (room.code === currentRoomCode)
        return room;
    }
    return null;
  }

  function buildSnapshot() {
    const players = new Map();
    const room = resolveRoom();
    const db = conn?.db;
    let localRoomId = null;

    if (db?.players?.iter) {
      for (const row of db.players.iter()) {
        const playerId = identityToString(row.identity);
        if (!playerId)
          continue;
        if (playerId === myIdentity)
          localRoomId = Number(row.room_id ?? row.roomId ?? 0);
        players.set(playerId, {
          id: playerId,
          name: row.name || "",
          data: parseDriverState(row.data),
          x: row.x || 0,
          y: row.y || 0,
          z: row.z || 0,
          rotation: row.rotation || 0,
          ready: row.ready || false,
          isHost: row.is_host || row.isHost || false,
          roomId: Number(row.room_id ?? row.roomId ?? 0),
        });
      }
    }

    if (room) {
      currentRoomCode = room.code;
    } else if (localRoomId != null && db?.rooms?.iter) {
      for (const candidateRoom of db.rooms.iter()) {
        if (Number(candidateRoom.id) === localRoomId) {
          currentRoomCode = candidateRoom.code;
          break;
        }
      }
    }

    const resolvedRoom = resolveRoom();
    const world = parseWorldState(
      resolvedRoom?.game_data || "{}",
      layout,
      currentRoomCode || "",
      resolvedRoom?.max_players || options.maxPlayers || 4,
    );

    return {
      sessionId: myIdentity,
      roomCode: currentRoomCode,
      phase: resolvedRoom?.phase || "waiting",
      players,
      world,
      mode: "remote",
      authoritative: false,
      connected: !!conn,
      connectionState: conn ? "connected" : "disconnected",
    };
  }

  function publishSnapshot(type = "snapshot") {
    snapshot = buildSnapshot();
    emit({ type, snapshot });
    return snapshot;
  }

  async function connect() {
    if (conn)
      return snapshot;

    const tokenKey = getTokenStorageKey();
    const token = sessionStorage.getItem(tokenKey) || undefined;

    conn = await new Promise((resolve, reject) => {
      moduleBindings.DbConnection.builder()
        .withUri(options.spacetimeUrl || getSpacetimeUrl())
        .withDatabaseName(options.databaseName || options.moduleName || getDatabaseName())
        .withToken(token)
        .onConnect((connection, identity, authToken) => {
          myIdentity = identityToString(identity);
          if (authToken)
            sessionStorage.setItem(tokenKey, authToken);
          resolve(connection);
        })
        .onDisconnect(() => {
          conn = null;
          snapshot = {
            ...snapshot,
            connected: false,
            connectionState: "disconnected",
          };
          emit({ type: "disconnected", snapshot });
        })
        .onConnectError((_ctx, error) => {
          reject(new Error(`SpacetimeDB connection failed: ${error}`));
        })
        .build();
    });

    await new Promise((resolve) => {
      conn.subscriptionBuilder()
        .onApplied(() => resolve())
        .subscribe([
          "SELECT * FROM rooms",
          "SELECT * FROM players",
          "SELECT * FROM game_actions",
        ]);
      setTimeout(resolve, 1000);
    });

    const db = conn.db;
    const republish = () => publishSnapshot("snapshot");
    if (db?.players) {
      db.players.onInsert(republish);
      db.players.onUpdate(republish);
      db.players.onDelete(republish);
    }
    if (db?.rooms) {
      db.rooms.onInsert(republish);
      db.rooms.onUpdate(republish);
      db.rooms.onDelete(republish);
    }

    if (options.roomCode) {
      await conn.reducers.joinRoom({
        roomCode: options.roomCode,
        playerName: options.playerName || "Driver",
      });
      currentRoomCode = options.roomCode;
    } else {
      await conn.reducers.createRoom({
        maxPlayers: options.maxPlayers || 4,
        playerName: options.playerName || "Host",
      });
      currentRoomCode = await waitFor(() => {
        if (resolveRoom())
          return resolveRoom().code;
        if (db?.rooms?.iter) {
          for (const candidate of db.rooms.iter()) {
            if (identityToString(candidate.host_identity) === myIdentity)
              return candidate.code;
          }
        }
        return "";
      }, 1200, 50) || "";
    }

    snapshot = buildSnapshot();
    emit({ type: "connected", snapshot });
    return snapshot;
  }

  return {
    mode: "remote",
    async connect() {
      return connect();
    },
    async disconnect() {
      if (conn?.reducers?.leaveRoom)
        conn.reducers.leaveRoom();
      if (conn)
        conn.disconnect();
      conn = null;
      snapshot = {
        ...snapshot,
        connected: false,
        connectionState: "disconnected",
      };
      emit({ type: "disconnected", snapshot });
    },
    getSnapshot() {
      return snapshot;
    },
    sendCommand(command) {
      if (!conn || !myIdentity)
        throw new Error("SpacetimeDB transport is not connected.");

      if (command.type === "reset") {
        localPlayerState = createInitialDriverState();
      } else if (command.type === "tick") {
        localPlayerState = cloneDriverState(localPlayerState);
        simulateTick(localPlayerState, layout, command.input, command.dtSeconds);
      } else {
        return;
      }

      const room = resolveRoom();
      const worldState = parseWorldState(
        room?.game_data || "{}",
        layout,
        currentRoomCode || "",
        room?.max_players || options.maxPlayers || 4,
      );
      if (command.type === "tick")
        worldState.time += command.dtSeconds;
      worldState.statusMessage = command.type === "reset"
        ? "Driver reset through the SpacetimeDB transport."
        : advanceCheckpoints(localPlayerState, worldState);

      conn.reducers.movePlayer({
        x: localPlayerState.position.x,
        y: localPlayerState.position.y,
        z: localPlayerState.position.z,
        rotation: localPlayerState.yaw,
      });
      conn.reducers.updatePlayerData({
        data: JSON.stringify(localPlayerState),
        ready: true,
      });

      const localPlayer = snapshot.players.get(myIdentity);
      if (localPlayer?.isHost) {
        conn.reducers.setGameData({
          gameData: JSON.stringify({
            time: worldState.time,
            statusMessage: worldState.statusMessage,
          }),
        });
        if (conn.reducers.setPhase)
          conn.reducers.setPhase({ phase: "playing" });
      }

      snapshot = {
        ...snapshot,
        players: new Map(snapshot.players).set(myIdentity, {
          ...(snapshot.players.get(myIdentity) || {
            id: myIdentity,
            name: options.playerName || "Driver",
          }),
          data: cloneDriverState(localPlayerState),
          x: localPlayerState.position.x,
          y: localPlayerState.position.y,
          z: localPlayerState.position.z,
          rotation: localPlayerState.yaw,
        }),
        world: {
          ...worldState,
          layout,
        },
      };
      emit({ type: "snapshot", snapshot });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
