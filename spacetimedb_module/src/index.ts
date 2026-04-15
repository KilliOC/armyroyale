import { SenderError, schema, table, t, type InferSchema, type ReducerCtx } from "spacetimedb/server";

const spacetimedb = schema({
	rooms: table(
		{ public: true },
		{
			id: t.u32().primaryKey().autoInc(),
			code: t.string().unique(),
			host_identity: t.identity(),
			phase: t.string(),
			max_players: t.u32(),
			game_data: t.string(),
		},
	),
	players: table(
		{ public: true },
		{
			identity: t.identity().primaryKey(),
			room_id: t.u32(),
			name: t.string(),
			x: t.f32(),
			y: t.f32(),
			z: t.f32(),
			rotation: t.f32(),
			ready: t.bool(),
			is_host: t.bool(),
			data: t.string(),
		},
	),
	game_actions: table(
		{ public: true },
		{
			id: t.u32().primaryKey().autoInc(),
			room_id: t.u32(),
			actor_identity: t.identity(),
			kind: t.string(),
			payload: t.string(),
			created_at: t.string(),
		},
	),
});

export default spacetimedb;

type SpacetimeCtx = ReducerCtx<InferSchema<typeof spacetimedb>>;

function normalizeName(name: string, fallback: string) {
	const trimmed = String(name || "").trim();
	if (!trimmed)
		return fallback;
	return trimmed.slice(0, 24);
}

function identityKey(value: unknown) {
	if (value && typeof value === "object" && typeof (value as { toHexString?: unknown }).toHexString === "function")
		return (value as { toHexString(): string }).toHexString();
	return String(value || "");
}

function roomCodeFrom(sender: unknown, roomId: number) {
	const text = identityKey(sender).replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
	return `ROOM${roomId}${text}`;
}

function requirePlayer(ctx: SpacetimeCtx) {
	const player = ctx.db.players.identity.find(ctx.sender);
	if (!player)
		throw new SenderError("Player is not connected to a room.");
	return player;
}

function requireRoomByCode(ctx: SpacetimeCtx, code: string) {
	const room = ctx.db.rooms.code.find(String(code || "").trim());
	if (!room)
		throw new SenderError(`Room '${code}' was not found.`);
	return room;
}

function listPlayersInRoom(ctx: SpacetimeCtx, roomId: number) {
	const roomPlayers = [];
	for (const candidate of ctx.db.players.iter()) {
		if (Number(candidate.room_id) === roomId)
			roomPlayers.push(candidate);
	}
	return roomPlayers;
}

function ensureCapacity(ctx: SpacetimeCtx, roomId: number, maxPlayers: number) {
	if (listPlayersInRoom(ctx, roomId).length >= maxPlayers)
		throw new SenderError("Room is full.");
}

function detachPlayerFromRoom(ctx: SpacetimeCtx, identity: unknown) {
	const player = ctx.db.players.identity.find(identity as never);
	if (!player)
		return;

	ctx.db.players.delete(player);
	const roomPlayers = listPlayersInRoom(ctx, Number(player.room_id));
	if (roomPlayers.length === 0) {
		const room = ctx.db.rooms.id.find(player.room_id);
		if (room)
			ctx.db.rooms.delete(room);
		return;
	}

	const room = ctx.db.rooms.id.find(player.room_id);
	if (!room)
		return;

	const currentHostStillPresent = roomPlayers.some((candidate) => identityKey(candidate.identity) === identityKey(room.host_identity));
	if (currentHostStillPresent)
		return;

	const nextHost = roomPlayers[0];
	ctx.db.rooms.id.update({
		...room,
		host_identity: nextHost.identity,
	});
	ctx.db.players.identity.update({
		...nextHost,
		is_host: true,
	});
}

function upsertPlayer(ctx: SpacetimeCtx, roomId: number, playerName: string, isHost: boolean) {
	const existing = ctx.db.players.identity.find(ctx.sender);
	const next = {
		identity: ctx.sender,
		room_id: roomId,
		name: normalizeName(playerName, "Pilot"),
		x: existing?.x ?? 0,
		y: existing?.y ?? 0,
		z: existing?.z ?? 0,
		rotation: existing?.rotation ?? 0,
		ready: existing?.ready ?? true,
		is_host: isHost,
		data: existing?.data ?? "{}",
	};
	if (existing) {
		ctx.db.players.identity.update(next);
	} else {
		ctx.db.players.insert(next);
	}
}

export const init = spacetimedb.init(() => {});

export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
	detachPlayerFromRoom(ctx, ctx.sender);
});

export const createRoom = spacetimedb.reducer(
	{
		max_players: t.u32(),
		player_name: t.string(),
	},
	(ctx, { max_players, player_name }) => {
		detachPlayerFromRoom(ctx, ctx.sender);

		const room = ctx.db.rooms.insert({
			id: 0,
			code: "pending",
			host_identity: ctx.sender,
			phase: "waiting",
			max_players: Math.max(1, Number(max_players) || 4),
			game_data: "{}",
		});
		ctx.db.rooms.id.update({
			...room,
			code: roomCodeFrom(ctx.sender, Number(room.id)),
		});
		upsertPlayer(ctx, Number(room.id), player_name, true);
	},
);

export const joinRoom = spacetimedb.reducer(
	{
		room_code: t.string(),
		player_name: t.string(),
	},
	(ctx, { room_code, player_name }) => {
		detachPlayerFromRoom(ctx, ctx.sender);
		const room = requireRoomByCode(ctx, room_code);
		ensureCapacity(ctx, Number(room.id), Number(room.max_players));
		upsertPlayer(ctx, Number(room.id), player_name, false);
	},
);

export const leaveRoom = spacetimedb.reducer((ctx) => {
	detachPlayerFromRoom(ctx, ctx.sender);
});

export const movePlayer = spacetimedb.reducer(
	{
		x: t.f32(),
		y: t.f32(),
		z: t.f32(),
		rotation: t.f32(),
	},
	(ctx, { x, y, z, rotation }) => {
		const player = requirePlayer(ctx);
		ctx.db.players.identity.update({
			...player,
			x: Number(x) || 0,
			y: Number(y) || 0,
			z: Number(z) || 0,
			rotation: Number(rotation) || 0,
		});
	},
);

export const updatePlayerData = spacetimedb.reducer(
	{
		data: t.string(),
		ready: t.bool(),
	},
	(ctx, { data, ready }) => {
		const player = requirePlayer(ctx);
		ctx.db.players.identity.update({
			...player,
			data: typeof data === "string" ? data : "{}",
			ready: Boolean(ready),
		});
	},
);

export const setPhase = spacetimedb.reducer(
	{
		phase: t.string(),
	},
	(ctx, { phase }) => {
		const player = requirePlayer(ctx);
		if (!player.is_host)
			throw new SenderError("Only the host may change the room phase.");
		const room = ctx.db.rooms.id.find(player.room_id);
		if (!room)
			throw new SenderError("Room was not found.");
		ctx.db.rooms.id.update({
			...room,
			phase: String(phase || "running"),
		});
	},
);

export const setGameData = spacetimedb.reducer(
	{
		game_data: t.string(),
	},
	(ctx, { game_data }) => {
		const player = requirePlayer(ctx);
		if (!player.is_host)
			throw new SenderError("Only the host may publish game state.");
		const room = ctx.db.rooms.id.find(player.room_id);
		if (!room)
			throw new SenderError("Room was not found.");
		ctx.db.rooms.id.update({
			...room,
			game_data: typeof game_data === "string" ? game_data : "{}",
		});
	},
);

export const publishGameAction = spacetimedb.reducer(
	{
		kind: t.string(),
		payload: t.string(),
	},
	(ctx, { kind, payload }) => {
		const player = requirePlayer(ctx);
		ctx.db.game_actions.insert({
			id: 0,
			room_id: player.room_id,
			actor_identity: ctx.sender,
			kind: String(kind || "command"),
			payload: typeof payload === "string" ? payload : "{}",
			created_at: new Date().toISOString(),
		});
	},
);
