let O = null, ae = null, Ie = 4294967295, Ce = 4294967295, be = null;
function D(e) {
  const n = e == null ? void 0 : e.wasmMemory, t = n == null ? void 0 : n.buffer;
  if (!(t instanceof SharedArrayBuffer || t instanceof ArrayBuffer)) return;
  const o = [
    ["HEAP8", new Int8Array(t)],
    ["HEAPU8", new Uint8Array(t)],
    ["HEAP16", new Int16Array(t)],
    ["HEAPU16", new Uint16Array(t)],
    ["HEAP32", new Int32Array(t)],
    ["HEAPU32", new Uint32Array(t)],
    ["HEAPF32", new Float32Array(t)],
    ["HEAPF64", new Float64Array(t)],
    ["HEAP64", new BigInt64Array(t)],
    ["HEAPU64", new BigUint64Array(t)]
  ];
  for (const [r, s] of o) {
    const a = Object.getOwnPropertyDescriptor(e, r);
    if (!(a != null && a.get && !a.set))
      try {
        e[r] = s;
      } catch (c) {
        console.error(`[Mini Engine] Failed to refresh WASM heap view ${r}.`, c);
      }
  }
}
function sn(e) {
  const n = e == null ? void 0 : e.Mini, t = n == null ? void 0 : n.scenes;
  if (!t || t.__lfgHeapPatched) return;
  const o = (a) => {
    const c = e._malloc(4);
    if (!c) return null;
    D(e);
    try {
      const i = a(c);
      if (!i) return null;
      D(e);
      try {
        const u = e.HEAPU32[c >>> 2] >>> 0;
        return e.HEAPU8.slice(i, i + u);
      } finally {
        e._free(i);
      }
    } finally {
      e._free(c);
    }
  }, r = (a, c) => {
    if (a == null) return !0;
    const i = a instanceof Uint8Array ? a : new Uint8Array(a);
    if (i.byteLength === 0) return !0;
    const u = e._malloc(i.byteLength);
    if (!u) return !1;
    D(e);
    try {
      return e.HEAPU8.set(i, u), c(u, i.byteLength >>> 0);
    } finally {
      e._free(u);
    }
  };
  typeof e._mini_web_scene_save_json == "function" && (t.saveJson = (a) => o((c) => e._mini_web_scene_save_json(a >>> 0, c))), typeof e._mini_web_scene_save_resources == "function" && (t.saveResources = (a) => o((c) => e._mini_web_scene_save_resources(a >>> 0, c))), typeof e._mini_web_scene_load_json_bytes == "function" && (t.loadJsonBytes = (a, c) => r(
    c,
    (i, u) => e._mini_web_scene_load_json_bytes(a >>> 0, i, u) !== 0
  )), typeof e._mini_web_scene_load_resources_bytes == "function" && (t.loadResourcesBytes = (a, c) => r(
    c,
    (i, u) => e._mini_web_scene_load_resources_bytes(a >>> 0, i, u) !== 0
  )), typeof t.addRuntimeMesh == "function" && (t.addRuntimeMesh = function(c, i, u, y, d = "") {
    const f = u instanceof Uint8Array ? u : new Uint8Array(u), l = y instanceof Uint16Array ? y : new Uint16Array(y);
    if (f.byteLength === 0 || l.length === 0) return { ok: !1, error: "vertex and index data are required" };
    if (f.byteLength % 28 !== 0) return { ok: !1, error: "vertex buffer byte length must be a multiple of 28" };
    const m = e._malloc(f.byteLength), p = e._malloc(l.byteLength);
    if (!m || !p)
      return m && e._free(m), p && e._free(p), { ok: !1, error: "malloc failed" };
    D(e);
    const h = e.stringToNewUTF8(String(d));
    try {
      e.HEAPU8.set(f, m), e.HEAPU8.set(new Uint8Array(l.buffer, l.byteOffset, l.byteLength), p);
      const w = e._mini_web_scene_add_runtime_mesh(
        c >>> 0,
        i >>> 0,
        h,
        m,
        f.byteLength / 28 >>> 0,
        p,
        l.length >>> 0
      );
      if (D(e), !w) return { ok: !1, error: "null result" };
      const x = e.UTF8ToString(w);
      try {
        return JSON.parse(x);
      } catch {
        return { ok: !0 };
      }
    } finally {
      e._free(h), e._free(p), e._free(m);
    }
  }), typeof e._mini_web_scene_load_glb_from_buffer == "function" && (t.loadGlbFromBuffer, t.loadGlbFromBuffer = function(c, i, u = "") {
    return r(
      i instanceof Uint8Array ? i : new Uint8Array(i),
      (y, d) => {
        const f = e.stringToNewUTF8(String(u));
        try {
          return e._mini_web_scene_load_glb_from_buffer(c >>> 0, y, d, f) !== 0;
        } finally {
          e._free(f);
        }
      }
    );
  }), t.__lfgHeapPatched = !0;
}
function an(e, n) {
  const t = e.replace(/\/+$/, "");
  return t.endsWith("/runtime") ? t : `${t}/${n}`;
}
function pt(e = "v1") {
  const n = typeof window < "u" && window.__LFG_ENGINE_BASE__ || "/assets/engine";
  return an(n, e);
}
function ve(e, n) {
  D(e), sn(e), O = e, ae = n, console.log(
    `bound WASM module with ${Object.keys(n.Components).length} components`
  );
}
function ht() {
  return O !== null && ae !== null;
}
function ke() {
  return O;
}
function C() {
  return (O == null ? void 0 : O.Mini) ?? null;
}
function Te() {
  return ae;
}
function G() {
  return Ie;
}
function Ue(e) {
  Ie = e;
}
function mt() {
  return Ce;
}
function xt(e) {
  Ce = e;
}
function cn() {
  return be;
}
function wt(e) {
  be = e;
}
const un = {
  bool: { size: 1, alignment: 1 },
  u8: { size: 1, alignment: 1 },
  i8: { size: 1, alignment: 1 },
  u16: { size: 2, alignment: 2 },
  i16: { size: 2, alignment: 2 },
  u32: { size: 4, alignment: 4 },
  text_id: { size: 4, alignment: 4 },
  i32: { size: 4, alignment: 4 },
  f32: { size: 4, alignment: 4 },
  f64: { size: 8, alignment: 8 },
  u8x2: { size: 2, alignment: 1 },
  u8x3: { size: 3, alignment: 1 },
  u8x4: { size: 4, alignment: 1 },
  i8x2: { size: 2, alignment: 1 },
  i8x3: { size: 3, alignment: 1 },
  i8x4: { size: 4, alignment: 1 },
  u16x2: { size: 4, alignment: 2 },
  u16x3: { size: 6, alignment: 2 },
  u16x4: { size: 8, alignment: 2 },
  i16x2: { size: 4, alignment: 2 },
  i16x3: { size: 6, alignment: 2 },
  i16x4: { size: 8, alignment: 2 },
  u32x2: { size: 8, alignment: 4 },
  u32x3: { size: 12, alignment: 4 },
  u32x4: { size: 16, alignment: 4 },
  i32x2: { size: 8, alignment: 4 },
  i32x3: { size: 12, alignment: 4 },
  i32x4: { size: 16, alignment: 4 },
  f32x2: { size: 8, alignment: 4 },
  f32x3: { size: 12, alignment: 4 },
  f32x4: { size: 16, alignment: 4 },
  f64x2: { size: 16, alignment: 8 },
  f64x3: { size: 24, alignment: 8 },
  f64x4: { size: 32, alignment: 8 }
};
let L = [];
const Le = "__lfg_gameplay_registered_signature";
function ln() {
  return typeof window < "u" && window[Le] || "";
}
function ie(e) {
  typeof window < "u" && (window[Le] = e);
}
function xe(e, n) {
  if (n <= 1) return e;
  const t = e % n;
  return t === 0 ? e : e + (n - t);
}
function Be(e) {
  return JSON.stringify(
    e.map((n) => ({
      name: n.name,
      id: n.id,
      byteSize: n.byteSize,
      alignment: n.alignment,
      fields: Object.values(n.fields).map((t) => ({
        name: t.name,
        type: t.type,
        offset: t.offset
      }))
    }))
  );
}
function ce(e) {
  const n = e.fields ?? {}, t = {};
  let o = 0, r = 1;
  for (const [c, i] of Object.entries(n)) {
    const u = un[i.type];
    if (!u)
      throw new Error(`Unsupported gameplay component field type: ${i.type}`);
    o = xe(o, u.alignment), t[c] = {
      ...i,
      name: c,
      offset: o
    }, o += u.size, r = Math.max(r, u.alignment);
  }
  const s = xe(o, r);
  return {
    name: e.name,
    id: e.id >>> 0,
    typeId: e.id >>> 0,
    size: s,
    byteSize: s,
    alignment: r,
    description: e.description,
    fields: t,
    read(c, i) {
      const u = {};
      for (const y of Object.values(t))
        u[y.name] = dn(c, i + y.offset, y.type);
      return u;
    },
    write(c, i, u) {
      if (u != null)
        for (const y of Object.values(t))
          y.name in u && yn(c, i + y.offset, y.type, u[y.name]);
    }
  };
}
function _t(e) {
  return ce(e);
}
function gt(e) {
  const n = e.map((t) => ce(t));
  return {
    components: n,
    Components: n.reduce((t, o) => (t[o.name] = o, t), {}),
    ComponentIds: n.reduce((t, o) => (t[o.name] = o.id, t), {}),
    ComponentById: n.reduce((t, o) => (t[o.id] = o, t), {})
  };
}
function fn() {
  return L.map((e) => ({
    ...e,
    fields: { ...e.fields }
  }));
}
function zt(e) {
  return L.find((n) => n.name === e) ?? null;
}
function Mt(e) {
  return L.find((n) => n.id === e >>> 0) ?? null;
}
async function Fe(e = C()) {
  var o;
  if (!((o = e == null ? void 0 : e.game) != null && o.registerComponents))
    return { ok: !1, error: "Mini.game.registerComponents is not available" };
  const n = Be(L), t = await e.game.registerComponents(L);
  return (t == null ? void 0 : t.ok) !== !1 && ie(n), t;
}
async function At(e) {
  var t;
  L = e.map((o) => ce(o)), typeof window < "u" && (window.__lfg_gameplay_components = fn());
  const n = C();
  return (t = n == null ? void 0 : n.game) != null && t.registerComponents ? Ne() ? await Fe(n) : { ok: !0, component_count: L.length } : (ie(""), { ok: !0, deferred: !0, component_count: L.length });
}
function Et() {
  L = [], ie(""), typeof window < "u" && (window.__lfg_gameplay_components = []);
}
function Ne() {
  return Be(L) !== ln();
}
function ue(e) {
  const n = e.match(/x(\d+)$/);
  return n ? Number.parseInt(n[1], 10) : 0;
}
function Se(e) {
  return ue(e) > 0 ? e.slice(0, e.lastIndexOf("x")) : e;
}
function Ge(e) {
  switch (e) {
    case "bool":
    case "u8":
    case "i8":
      return 1;
    case "u16":
    case "i16":
      return 2;
    case "f64":
      return 8;
    default:
      return 4;
  }
}
function we(e, n, t) {
  switch (t) {
    case "bool":
      return e.getUint8(n) !== 0;
    case "u8":
      return e.getUint8(n);
    case "i8":
      return e.getInt8(n);
    case "u16":
      return e.getUint16(n, !0);
    case "i16":
      return e.getInt16(n, !0);
    case "u32":
    case "text_id":
      return e.getUint32(n, !0);
    case "i32":
      return e.getInt32(n, !0);
    case "f32":
      return e.getFloat32(n, !0);
    case "f64":
      return e.getFloat64(n, !0);
    default:
      return;
  }
}
function _e(e, n, t, o) {
  switch (t) {
    case "bool":
      e.setUint8(n, o ? 1 : 0);
      return;
    case "u8":
      e.setUint8(n, Number(o) >>> 0);
      return;
    case "i8":
      e.setInt8(n, Number(o) | 0);
      return;
    case "u16":
      e.setUint16(n, Number(o) >>> 0, !0);
      return;
    case "i16":
      e.setInt16(n, Number(o) | 0, !0);
      return;
    case "u32":
    case "text_id":
      e.setUint32(n, Number(o) >>> 0, !0);
      return;
    case "i32":
      e.setInt32(n, Number(o) | 0, !0);
      return;
    case "f32":
      e.setFloat32(n, Number(o) || 0, !0);
      return;
    case "f64":
      e.setFloat64(n, Number(o) || 0, !0);
      return;
    default:
      return;
  }
}
function dn(e, n, t) {
  const o = ue(t);
  if (o <= 0)
    return we(e, n, t);
  const r = Se(t), s = Ge(r);
  return ["x", "y", "z", "w"].slice(0, o).reduce((c, i, u) => (c[i] = we(e, n + u * s, r), c), {});
}
function yn(e, n, t, o) {
  const r = ue(t);
  if (r <= 0) {
    _e(e, n, t, o);
    return;
  }
  const s = Se(t), a = Ge(s), c = ["x", "y", "z", "w"].slice(0, r);
  !o || typeof o != "object" || c.forEach((i, u) => {
    _e(
      e,
      n + u * a,
      s,
      o[i]
    );
  });
}
let B = null;
async function le() {
  if (B) return B;
  if (window.__LFG_ASSETS__)
    return B = window.__LFG_ASSETS__, B;
  const e = window.__LFG_PROJECT_ID__;
  if (!e)
    return B = [], B;
  const n = window.__LFG_API_BASE__ || "/api", t = {};
  window.__LFG_TOKEN__ && (t.Authorization = `Bearer ${window.__LFG_TOKEN__}`);
  const o = window.__LFG_TOKEN__ ? `${n}/projects/${e}/assets` : `${n}/dev-server/${e}/assets`, r = await fetch(o, { headers: t });
  if (!r.ok)
    throw new Error(`LFG: failed to fetch assets (${r.status})`);
  return B = (await r.json()).map((s) => {
    var a;
    return {
      id: s.asset.id,
      name: s.asset.name,
      alias: s.alias,
      type: s.asset.type,
      fileUrl: s.asset.fileUrl,
      url: s.asset.fileUrl,
      thumbnailUrl: s.asset.thumbnailUrl,
      status: s.asset.status === "COMPLETED" ? "Ready" : ((a = s.asset.status) == null ? void 0 : a.toLowerCase()) || "Ready"
    };
  }), B;
}
function pn() {
  B = null;
}
const hn = 6, mn = 1, xn = "Player", oe = "local";
function wn(e) {
  return `${e}_${Math.random().toString(36).slice(2, 10)}`;
}
function _n() {
  return Math.random().toString(36).slice(2, 2 + hn).toUpperCase();
}
function W(e) {
  return {
    ...e,
    players: new Map(e.players)
  };
}
function gn(e) {
  return {
    id: e.sessionId,
    name: e.playerName,
    data: null
  };
}
function ne(e) {
  return {
    sessionId: (e == null ? void 0 : e.sessionId) ?? null,
    roomCode: (e == null ? void 0 : e.roomCode) ?? null,
    phase: (e == null ? void 0 : e.phase) ?? oe,
    players: (e == null ? void 0 : e.players) ?? /* @__PURE__ */ new Map(),
    world: (e == null ? void 0 : e.world) ?? null,
    mode: "local",
    authoritative: !0,
    connected: (e == null ? void 0 : e.connected) ?? !1,
    connectionState: (e == null ? void 0 : e.connectionState) ?? "idle"
  };
}
function zn(e = {}) {
  const n = /* @__PURE__ */ new Set(), t = e.createPlayerState ?? ((a) => gn(a));
  let o = ne({
    phase: e.initialPhase ?? oe
  });
  function r(a) {
    for (const c of n)
      c(a);
  }
  function s(a) {
    return o = W(a), W(o);
  }
  return {
    mode: "local",
    async connect(a = {}) {
      const c = wn("local"), i = a.roomCode || _n(), u = a.playerName || xn, y = a.maxPlayers ?? mn, d = /* @__PURE__ */ new Map(), f = t({
        sessionId: c,
        playerName: u,
        roomCode: i
      });
      d.set(c, f);
      const l = s(
        ne({
          sessionId: c,
          roomCode: i,
          phase: e.initialPhase ?? oe,
          players: d,
          world: e.createWorldState ? e.createWorldState({ roomCode: i, maxPlayers: y }) : null,
          connected: !0,
          connectionState: "connected"
        })
      );
      return r({ type: "connected", snapshot: l }), r({ type: "snapshot", snapshot: l }), l;
    },
    async disconnect() {
      const a = s(
        ne({
          phase: o.phase,
          world: o.world,
          connectionState: "disconnected"
        })
      );
      r({ type: "disconnected", snapshot: a });
    },
    getSnapshot() {
      return W(o);
    },
    sendCommand(a) {
      if (!o.connected || !o.sessionId || !o.roomCode)
        throw new Error(
          "Multiplayer transport is not connected; call connect() before sendCommand()."
        );
      const c = e.applyCommand ? e.applyCommand(W(o), a, {
        sessionId: o.sessionId,
        roomCode: o.roomCode
      }) : W(o), i = s({
        ...c,
        mode: "local",
        authoritative: !0,
        connected: !0,
        connectionState: "connected"
      });
      r({
        type: "command",
        command: a,
        senderId: o.sessionId,
        snapshot: i
      }), r({ type: "snapshot", snapshot: i });
    },
    subscribe(a) {
      return n.add(a), () => {
        n.delete(a);
      };
    }
  };
}
function Mn() {
  if (typeof window < "u") {
    const e = window.__LFG_TRANSPORT_MODE__;
    if (e === "spacetimedb" || e === "remote") return "remote";
    if (e === "local") return "local";
    try {
      const n = new URLSearchParams(window.location.search).get("transport") || "";
      if (n === "spacetimedb" || n === "online" || n === "multiplayer" || n === "remote") return "remote";
      if (n === "local" || n === "offline") return "local";
    } catch {
    }
  }
  return "local";
}
const Pt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createLocalTransport: zn,
  getTransportMode: Mn
}, Symbol.toStringTag, { value: "Module" })), j = /* @__PURE__ */ new Map();
function An() {
  const e = {};
  for (const [n, t] of j)
    e[n] = t;
  return e;
}
function En() {
  var o;
  const e = C();
  if ((o = e == null ? void 0 : e.assets) != null && o.getLoadedAssets)
    return e.assets.getLoadedAssets(G());
  const n = [];
  let t = 0;
  for (const [r, s] of j)
    n.push({
      asset_index: t++,
      name: r,
      filename: r + ".glb",
      description: "",
      bounds_local: null,
      pivot_local: null,
      placement_point_local: null
    });
  return { count: n.length, assets: n };
}
function He(e, n) {
  var s;
  const t = C();
  if (!t) return { ok: !1, error: "engine not ready" };
  if ((s = t.assets) != null && s.instantiate)
    return t.assets.instantiate(G(), e, n);
  let o;
  if (typeof e == "string")
    o = j.get(e);
  else {
    let a = 0;
    for (const [, c] of j) {
      if (a === e) {
        o = c;
        break;
      }
      a++;
    }
  }
  if (o === void 0)
    return { ok: !1, error: `Asset not found: ${e}` };
  const r = t.scenes.instantiate(G(), o, {
    position: (n == null ? void 0 : n.position) || [0, 0, 0],
    rotation: (n == null ? void 0 : n.rotation) || [0, 0, 0, 1],
    scale: (n == null ? void 0 : n.scale) || [1, 1, 1]
  });
  return r != null && r.ok && t.scenes.rebuildRendererResources(G()), r;
}
async function Z(e, n, t) {
  var a;
  const o = C();
  if (!(o != null && o.scenes)) return { ok: !1, error: "engine not ready" };
  const r = n || ((a = e.split("/").pop()) == null ? void 0 : a.replace(".glb", "")) || "asset", s = o.scenes.create();
  if (s === o.NULL_SCENE_HANDLE)
    return { ok: !1, error: "failed to create stub scene" };
  try {
    let c = !1, i = "";
    if (o.scenes.loadGlbFromBuffer) {
      const u = await fetch(e);
      if (!u.ok)
        return o.scenes.destroy(s), { ok: !1, error: `fetch failed: ${u.status}` };
      const y = new Uint8Array(await u.arrayBuffer()), d = o.scenes.loadGlbFromBuffer(s, y, r);
      c = typeof d == "object" ? !!d.ok : !!d, c || (i = (typeof d == "object" ? d.error : "") || "loadGlbFromBuffer failed");
    } else {
      const u = await o.scenes.loadGlbFromUrl(s, e);
      c = !!u && (typeof u == "object" ? !!u.ok : !!u), c || (i = (typeof u == "object" ? u == null ? void 0 : u.error : "") || "loadGlbFromUrl failed");
    }
    return c ? (j.set(r, s), { ok: !0, name: r, stubScene: s }) : (o.scenes.destroy(s), { ok: !1, error: i || "failed to load GLB" });
  } catch (c) {
    return o.scenes.destroy(s), { ok: !1, error: c instanceof Error ? c.message : String(c) };
  }
}
function Pn(e, n, t, o) {
  const r = C();
  if (!(r != null && r.scenes)) return { ok: !1, error: "engine not ready" };
  const s = t || n.replace(".glb", "") || "asset", a = r.scenes.create();
  return a === r.NULL_SCENE_HANDLE ? { ok: !1, error: "failed to create stub scene" } : r.scenes.loadGlbFromBuffer(a, e, n) ? (j.set(s, a), { ok: !0, name: s, stubScene: a }) : (r.scenes.destroy(a), { ok: !1, error: "failed to load GLB from buffer" });
}
async function je(e = {}) {
  const n = C();
  if (!(n != null && n.scenes))
    return console.warn("engine not ready; cannot load project assets"), [];
  const {
    yieldBetweenAssets: t = !0,
    yieldAfterFetch: o = !0
  } = e, r = await le(), s = r.filter(
    (i) => i.type === "MODEL_3D" && i.status === "Ready"
  ), a = r.filter(
    (i) => i.type === "ANIMATION" && i.status === "Ready"
  );
  console.info("project assets fetched", {
    total: r.length,
    model3dReady: s.length,
    animReady: a.length
  }), o && await te();
  const c = [];
  for (const i of s) {
    t && await te();
    const u = i.alias || i.name;
    if (j.has(u)) {
      c.push({ asset: i, result: { ok: !0, name: u, error: "already loaded" } });
      continue;
    }
    const y = i.url || i.fileUrl;
    if (!y) {
      c.push({ asset: i, result: { ok: !1, error: "no url" } });
      continue;
    }
    const d = performance.now();
    let f;
    try {
      f = await Z(y, u, i.name);
    } catch (m) {
      f = { ok: !1, error: m instanceof Error ? m.message : String(m) };
    }
    const l = Math.round(performance.now() - d);
    console.info("load finished", { assetName: u, loadDurationMs: l, ok: f.ok }), c.push({ asset: i, result: f });
  }
  for (const i of a) {
    t && await te();
    const u = i.alias || i.name, y = i.url || i.fileUrl;
    if (y)
      try {
        const d = await Z(y, u, i.name);
        c.push({ asset: i, result: d });
      } catch (d) {
        c.push({ asset: i, result: { ok: !1, error: d instanceof Error ? d.message : String(d) } });
      }
  }
  return console.info("all assets loaded", {
    total: c.length,
    ok: c.filter((i) => i.result.ok).length,
    stubScenes: j.size
  }), c;
}
const X = [];
function Rn() {
  var a;
  if (X.length === 0) return;
  const e = C(), n = Te(), t = ke();
  if (!e || !n || !t) return;
  const o = (a = n.ComponentIds) == null ? void 0 : a.Transform, r = n.TransformOps;
  if (o === void 0 || !r) return;
  const s = G();
  for (const { id: c, scale: i } of X) {
    const u = e.ecs.tableGet(s, c, o);
    u && (r.setScaleX(t, u, i[0]), r.setScaleY(t, u, i[1]), r.setScaleZ(t, u, i[2]));
  }
  X.length = 0;
}
function $e(e) {
  X.length = 0;
}
async function te() {
  if (typeof window < "u" && typeof window.requestAnimationFrame == "function") {
    await new Promise((e) => window.requestAnimationFrame(() => e()));
    return;
  }
  await new Promise((e) => setTimeout(e, 0));
}
const In = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getAssetScenes: An,
  getEngineAssets: En,
  hideSourceAssetEntities: $e,
  instantiateAsset: He,
  loadAssetFromBuffer: Pn,
  loadAssetFromUrl: Z,
  loadProjectAssetsIntoEngine: je,
  restoreSourceAssetEntities: Rn
}, Symbol.toStringTag, { value: "Module" }));
function Cn(e, n) {
  const t = C();
  if (!(t != null && t.runtime)) return !1;
  const o = typeof e == "number" ? e : G(), r = typeof e == "number" ? n : e;
  if (!r) return !1;
  try {
    return t.runtime.loadScene(o, r);
  } catch (s) {
    return console.error("failed to load scene:", s), !1;
  }
}
function bn(e = G()) {
  const n = C();
  if (!(n != null && n.runtime)) return null;
  try {
    const t = n.runtime.saveScene(e);
    return t ? t.buffer ?? t : null;
  } catch (t) {
    return console.error("failed to save scene:", t), null;
  }
}
function vn(e = G()) {
  const n = C();
  if (!(n != null && n.scenes)) return null;
  try {
    const t = n.scenes.saveJson(e);
    if (!t) return null;
    const o = n.scenes.saveResources(e) ?? null;
    return { scene: t, resources: o };
  } catch (t) {
    return console.error("failed to save scene (full):", t), null;
  }
}
function Rt(e, n) {
  var o, r;
  const t = C();
  if (!(t != null && t.scenes)) return !1;
  try {
    return n.resources && !t.scenes.loadResourcesBytes(e, n.resources) && console.warn("failed to load scene resources, continuing without them"), t.scenes.loadJsonBytes(e, n.scene) ? ((r = (o = t.scenes).rebuildRendererResources) == null || r.call(o, e), t.scenes.resetRuntime(e), !0) : !1;
  } catch (s) {
    return console.error("failed to load scene (full):", s), !1;
  }
}
function It() {
  var n;
  const e = C();
  if (!((n = e == null ? void 0 : e.scenes) != null && n.create)) return null;
  try {
    const t = e.scenes.create();
    return t === e.NULL_SCENE_HANDLE ? null : t;
  } catch (t) {
    return console.error("failed to create scene:", t), null;
  }
}
function Ct(e) {
  var t;
  const n = C();
  if (!((t = n == null ? void 0 : n.scenes) != null && t.destroy)) return !1;
  try {
    return n.scenes.destroy(e);
  } catch (o) {
    return console.error("failed to destroy scene:", o), !1;
  }
}
function bt(e) {
  var t;
  const n = C();
  if (!((t = n == null ? void 0 : n.scenes) != null && t.setMain)) return !1;
  try {
    return n.scenes.setMain(e);
  } catch (o) {
    return console.error("failed to set main scene:", o), !1;
  }
}
async function vt(e) {
  try {
    const n = await fetch(e);
    if (!n.ok || (n.headers.get("content-type") || "").includes("text/html")) return !1;
    let o = await n.arrayBuffer();
    if (o.byteLength < 8) return !1;
    const r = new Uint8Array(o)[0];
    if (r >= 65 && r <= 122)
      try {
        const s = atob(new TextDecoder().decode(o)), a = new Uint8Array(s.length);
        for (let c = 0; c < s.length; c++) a[c] = s.charCodeAt(c);
        o = a.buffer;
      } catch {
      }
    return o.byteLength < 8 ? !1 : Cn(o);
  } catch (n) {
    return console.error("failed to fetch scene:", n), !1;
  }
}
async function kn(e) {
  var n;
  switch (e.type) {
    case "scene_reset":
      return { ok: !0, handled: !1, reloadRecommended: !0, reason: "scene_reset_requires_reload" };
    case "engine_restart": {
      if (typeof window < "u") {
        const t = window.__gc_restart_mini_playback;
        if (typeof t == "function" && await t())
          return { ok: !0, handled: !0, reloadRecommended: !1 };
      }
      return { ok: !0, handled: !1, reloadRecommended: !0, reason: "engine_restart_requires_reload" };
    }
    case "save_scene": {
      const t = e.includeResources !== !1, o = cn(), r = o ? o(e.sceneKey, t) : t ? vn() : (() => {
        const c = bn();
        return c ? { scene: new Uint8Array(c), resources: null } : null;
      })();
      if (!r) return { ok: !1, handled: !1, reason: "save_scene_failed" };
      let s = "";
      for (const c of r.scene) s += String.fromCharCode(c);
      let a = "";
      for (const c of r.resources ?? []) a += String.fromCharCode(c);
      return {
        ok: !0,
        handled: !0,
        details: {
          sceneBase64: btoa(s),
          sceneByteLength: r.scene.byteLength,
          resourcesBase64: r.resources ? btoa(a) : null,
          resourcesByteLength: ((n = r.resources) == null ? void 0 : n.byteLength) ?? 0
        }
      };
    }
    case "asset_added":
    case "asset_updated":
    case "asset_status_updated":
      return Tn(e);
    default:
      return { ok: !1, handled: !1, reloadRecommended: !0, reason: "unsupported_preview_event", details: e };
  }
}
async function Tn(e) {
  var a;
  const n = (a = e.status) == null ? void 0 : a.toLowerCase();
  if (n && n !== "ready" && n !== "completed")
    return { ok: !0, handled: !1, reloadRecommended: !1, reason: "asset_not_ready", details: { status: e.status } };
  const t = e.url || null;
  if (!t) return { ok: !0, handled: !1, reloadRecommended: !0, reason: "missing_asset_url", details: e };
  const o = e.alias || e.name || "asset", r = await Z(t, o, e.description || e.name || o);
  if (!r.ok || typeof r.asset_index != "number")
    return { ok: !1, handled: !1, reloadRecommended: !0, reason: "asset_load_failed", details: r };
  const s = He(r.asset_index, { position: [0, 0.6, 0], scale: [1, 1, 1] });
  return s.ok ? { ok: !0, handled: !0, reloadRecommended: !1, details: { loadResult: r, instantiateResult: s } } : { ok: !1, handled: !1, reloadRecommended: !0, reason: "asset_instantiate_failed", details: s };
}
let ge = !1;
typeof window < "u" && !ge && (ge = !0, window.addEventListener("message", (e) => {
  const n = e.data;
  !n || n.type !== "gc-preview-event" || !n.event || kn(n.event).then((t) => {
    var r;
    const o = {
      type: "gc-preview-event-result",
      requestId: n.requestId,
      ok: t.ok,
      handled: t.handled,
      reloadRecommended: t.reloadRecommended,
      reason: t.reason,
      details: t.details
    };
    (r = e.source) == null || r.postMessage(o, { targetOrigin: "*" });
  }).catch((t) => {
    var o;
    (o = e.source) == null || o.postMessage({
      type: "gc-preview-event-result",
      requestId: n.requestId,
      ok: !1,
      handled: !1,
      reloadRecommended: !0,
      reason: "preview_event_threw",
      details: t instanceof Error ? { message: t.message } : { error: String(t) }
    }, { targetOrigin: "*" });
  });
}));
const Un = "v1", Q = typeof window < "u" ? window : null;
let Y = null, ze = !1;
function qe(e) {
  var n, t, o, r;
  return typeof ((t = (n = e == null ? void 0 : e.Mini) == null ? void 0 : n.scenes) == null ? void 0 : t.ensureDefaultMaterial) == "function" && typeof ((r = (o = e == null ? void 0 : e.Mini) == null ? void 0 : o.scenes) == null ? void 0 : r.addRuntimeMesh) == "function";
}
function De() {
  const n = (typeof window < "u" && window.__LFG_ENGINE_BASE__ || "/assets/engine").replace(/\/+$/, "");
  return n.endsWith("/runtime") ? n : `${n}/${Un}`;
}
function Ln() {
  const e = (Q == null ? void 0 : Q.__gc_mini_runtime_context) ?? null;
  return e ? qe(e.module) ? e : (console.warn("discarding stale mini runtime context without required scene helpers"), null) : null;
}
function Bn(e) {
  Q && (Q.__gc_mini_runtime_context = e);
}
async function Fn() {
  return await import(
    /* @vite-ignore */
    `${De()}/components.js`
  );
}
async function Nn(e) {
  const n = De(), t = window.Module;
  if (t != null && t.calledRun && qe(t))
    return t.canvas = e, t;
  t != null && t.calledRun && console.warn("existing mini module is missing required scene helpers; reloading engine scripts");
  const o = 256, r = 32768, s = new WebAssembly.Memory({
    initial: o,
    maximum: r,
    shared: !0
  });
  return window.__LFG_WASM_MEMORY__ = s, window.Module = {
    ...window.Module,
    canvas: e,
    wasmMemory: s,
    locateFile(a) {
      return `${n}/${a}`;
    }
  }, window.Module.disableMiniDevStub = !0, await Sn(`${n}/mini.js`), await new Promise((a, c) => {
    const i = window.setTimeout(() => {
      c(new Error("Mini engine runtime initialization timed out"));
    }, 15e3), u = window.Module;
    function y(l) {
      return !l.Mini && typeof l.bindMiniModule == "function" && l.bindMiniModule(l), l.canvas = e, l;
    }
    if (u != null && u.calledRun) {
      clearTimeout(i), a(y(u));
      return;
    }
    const d = u == null ? void 0 : u.onRuntimeInitialized;
    if (u) {
      u.onRuntimeInitialized = () => {
        clearTimeout(i), d == null || d(), a(y(window.Module));
      };
      return;
    }
    const f = setInterval(() => {
      var l;
      (l = window.Module) != null && l.calledRun && (clearInterval(f), clearTimeout(i), a(y(window.Module)));
    }, 100);
  });
}
function Sn(e) {
  return new Promise((n, t) => {
    const o = document.createElement("script");
    o.src = e, o.async = !0, o.onload = () => n(), o.onerror = () => t(new Error(`Failed to load ${e}`)), document.head.appendChild(o);
  });
}
function Me(e) {
  const n = document.getElementById("status");
  n && (n.textContent = e);
}
async function Gn(e) {
  return new Promise((n) => setTimeout(n, e));
}
async function Hn(e, n) {
  for (let t = 1; t <= 3; t++) {
    pn();
    const o = await le();
    console.info("hydrate attempt", t, "— project assets:", o.length);
    const r = await je(), s = r.filter(({ result: a }) => a.ok).length;
    if (console.info("loaded", s, "of", r.length, "assets"), o.length > 0 || t === 3)
      return s;
    await Gn(1e3);
  }
  return 0;
}
function jn(e) {
  const n = (e == null ? void 0 : e.canvas) ?? document.getElementById("canvas");
  if (!(n instanceof HTMLCanvasElement))
    throw new Error("Missing #canvas element");
  return n;
}
function Ve(e) {
  const n = e.getBoundingClientRect(), t = window.devicePixelRatio || 1;
  return {
    width: Math.max(1, Math.round(n.width * t)),
    height: Math.max(1, Math.round(n.height * t)),
    devicePixelRatio: t
  };
}
function $n(e) {
  ze || e != null && e.editor || (ze = !0, console.warn(
    "[LFG Boot] Standalone mini-engine runtime does not install Mini.editor. Editor helpers are only available when the LFG platform or another host injects the @lfg/editor bridge."
  ));
}
async function qn(e) {
  const n = jn(e), t = Ln();
  if (t)
    return t.canvas = n, t.module.canvas = n, ve(t.module, t.bindings), Ue(t.sceneHandle), t;
  if (Y) {
    const o = await Y;
    return o.canvas = n, o.module.canvas = n, o;
  }
  Y = Dn(n);
  try {
    return await Y;
  } finally {
    Y = null;
  }
}
async function Dn(e) {
  Me("Loading mini engine runtime...");
  const [n, t] = await Promise.all([
    Fn(),
    Nn(e)
  ]);
  ve(t, n), typeof window < "u" && (window.__gc_engine_bindings = n, window.__miniComponentIds = n.ComponentIds, window.__miniTransformOps = n.TransformOps);
  const o = C();
  if (!o)
    throw new Error("Module.Mini not available — mini.js may have failed to initialize");
  if (Ne()) {
    const i = await Fe(o);
    (i == null ? void 0 : i.ok) === !1 && console.warn("gameplay component sync returned error (may already be registered):", i.error);
  }
  const r = Ve(e);
  await o.renderer.initAsync(r.width, r.height, r.devicePixelRatio);
  const s = o.scenes.create();
  if (s === o.NULL_SCENE_HANDLE)
    throw new Error("Failed to create scene");
  Ue(s), o.scenes.loadResourceCache(s, "/assets/resources");
  const a = {
    canvas: e,
    bindings: n,
    module: t,
    mini: o,
    sceneHandle: s
  };
  Bn(a);
  const c = await Hn();
  return $e(), o.scenes.setMain(s), Me(
    c > 0 ? `Preview ready. Loaded ${c} project asset(s).` : "Preview ready."
  ), a;
}
function Vn(e) {
  const n = Ve(e.canvas);
  return e.module.canvas = e.canvas, e.mini.renderer.resize(n.width, n.height, n.devicePixelRatio), n;
}
function On(e, n) {
  e.module.canvas = e.canvas, e.mini.renderer.frame(n);
}
let Ae = !1;
function Wn() {
  if (Ae) return;
  Ae = !0;
  const e = window;
  e.__gc_keysDown || (e.__gc_keysDown = /* @__PURE__ */ new Set()), e.__gc_keysPressed || (e.__gc_keysPressed = /* @__PURE__ */ new Set()), window.addEventListener("keydown", (n) => {
    n.repeat || (e.__gc_keysDown.add(n.code), e.__gc_keysPressed.add(n.code));
  }), window.addEventListener("keyup", (n) => {
    e.__gc_keysDown.delete(n.code);
  });
}
async function kt(e, n) {
  const t = typeof window < "u" && window.__lfg_editor;
  if (t != null && t.registerGameplay && (t != null && t.initMiniEditorBridge)) {
    t.registerGameplay({
      begin: e.begin,
      tick: e.tick,
      end: e.end ?? (() => {
      })
    }), await t.initMiniEditorBridge();
    return;
  }
  Wn();
  const o = await qn(n), { module: r, mini: s, sceneHandle: a } = o;
  $n(s);
  const { getAssetScenes: c } = await Promise.resolve().then(() => In), i = c();
  D(r), await e.begin(r, s, a, i);
  const u = () => Vn(o);
  window.addEventListener("resize", u), u();
  let y = performance.now();
  function d(f) {
    const l = Math.min((f - y) / 1e3, 0.03333333333333333);
    y = f, e.tick(r, s, a, l), On(o, l), requestAnimationFrame(d);
  }
  requestAnimationFrame(d);
}
let M = null, v = null;
const S = /* @__PURE__ */ new Map(), k = /* @__PURE__ */ new Map();
let Oe = 1, fe = !1;
function Tt() {
  fe = !0;
}
function Ut() {
  fe = !1;
}
function We() {
  return M ? (M.state === "suspended" && M.resume(), M) : (M = new AudioContext(), v = M.createGain(), v.connect(M.destination), M);
}
function Lt() {
  (M == null ? void 0 : M.state) === "suspended" && M.resume();
}
function Bt() {
  return M;
}
async function Yn(e, n) {
  if (M || We(), !M) return null;
  try {
    const t = await fetch(e);
    if (!t.ok)
      return console.warn(`failed to fetch ${e}: ${t.status}`), null;
    const o = await t.arrayBuffer();
    return Kn(o, n);
  } catch (t) {
    return console.error(`error loading audio from ${e}:`, t), null;
  }
}
async function Kn(e, n) {
  if (M || We(), !M) return null;
  try {
    const t = await M.decodeAudioData(e);
    return S.set(n, t), {
      name: n,
      duration: t.duration,
      sampleRate: t.sampleRate,
      channels: t.numberOfChannels
    };
  } catch (t) {
    return console.error(`error decoding audio "${n}":`, t), null;
  }
}
async function Ft() {
  const e = await le(), n = e.filter(
    (o) => o.type === "AUDIO" && o.status === "Ready"
  );
  console.info("loading project audio assets", {
    total: e.length,
    audioReady: n.length
  });
  const t = [];
  for (const o of n) {
    const r = o.url || o.fileUrl;
    if (!r) continue;
    const s = o.alias || o.name;
    if (S.has(s)) {
      const c = S.get(s);
      t.push({
        name: s,
        duration: c.duration,
        sampleRate: c.sampleRate,
        channels: c.numberOfChannels
      });
      continue;
    }
    const a = await Yn(r, s);
    a && t.push(a);
  }
  return t;
}
function Qn(e, n = {}) {
  if (!fe) return -1;
  if (!M || !v)
    return console.warn("audio not initialized - call initAudio() first"), -1;
  const t = S.get(e);
  if (!t)
    return console.warn(`sound "${e}" not loaded`), -1;
  M.state === "suspended" && M.resume();
  const o = M.createBufferSource();
  o.buffer = t, o.loop = n.loop ?? !1, o.playbackRate.value = n.rate ?? 1;
  const r = M.createGain();
  r.gain.value = n.volume ?? 1, o.connect(r), r.connect(v);
  const s = Oe++, a = n.offset ?? 0, c = {
    id: s,
    name: e,
    source: o,
    gain: r,
    loop: o.loop,
    startedAt: M.currentTime,
    pausedAt: 0,
    offset: a,
    rate: o.playbackRate.value,
    paused: !1
  };
  return k.set(s, c), o.onended = () => {
    var i;
    k.delete(s), (i = n.onEnd) == null || i.call(n);
  }, o.start(0, a), s;
}
let U = -1;
function Nt(e, n = 1) {
  return U !== -1 && de(U), U = Qn(e, { loop: !0, volume: n }), U;
}
function St() {
  U !== -1 && (de(U), U = -1);
}
function de(e) {
  const n = k.get(e);
  if (n) {
    try {
      n.source.onended = null, n.source.stop();
    } catch {
    }
    k.delete(e), e === U && (U = -1);
  }
}
function Jn() {
  for (const [e] of k)
    de(e);
  U = -1;
}
function Gt(e) {
  const n = k.get(e);
  if (!n || n.paused || !M) return;
  const t = (M.currentTime - n.startedAt) * n.rate;
  n.pausedAt = n.offset + t, n.paused = !0;
  try {
    n.source.onended = null, n.source.stop();
  } catch {
  }
}
function Ht(e) {
  const n = k.get(e);
  if (!n || !n.paused || !M || !v) return;
  const t = S.get(n.name);
  if (!t) return;
  const o = M.createBufferSource();
  o.buffer = t, o.loop = n.loop, o.playbackRate.value = n.rate, o.connect(n.gain), o.onended = () => {
    k.delete(e);
  }, o.start(0, n.pausedAt % t.duration), n.source = o, n.startedAt = M.currentTime, n.offset = n.pausedAt, n.paused = !1;
}
function jt(e) {
  v && (v.gain.value = Math.max(0, Math.min(1, e)));
}
function $t() {
  return (v == null ? void 0 : v.gain.value) ?? 1;
}
function qt(e, n) {
  const t = k.get(e);
  t && (t.gain.gain.value = Math.max(0, Math.min(1, n)));
}
function Dt(e) {
  return S.has(e);
}
function Vt(e) {
  const n = S.get(e);
  return n ? {
    name: e,
    duration: n.duration,
    sampleRate: n.sampleRate,
    channels: n.numberOfChannels
  } : null;
}
function Ot() {
  return Array.from(S.keys());
}
function Wt(e) {
  const n = k.get(e);
  return n != null && !n.paused;
}
function Yt() {
  return k.size;
}
function Kt() {
  Jn(), S.clear(), M && (M.close(), M = null), v = null, Oe = 1;
}
const Ye = 1e-6;
function ye(e, n, t) {
  return Math.max(n, Math.min(t, e));
}
function F(e, n, t) {
  return e + (n - e) * t;
}
function Ke(e) {
  return e * (Math.PI / 180);
}
function Qe(e) {
  return e * (180 / Math.PI);
}
function Qt(e, n) {
  return Math.hypot(e, n);
}
function Xn(e = 0, n = 0, t = 0) {
  return { x: e, y: n, z: t };
}
function Je(e) {
  return { x: e.x, y: e.y, z: e.z };
}
function re(e, n) {
  return { x: e.x + n.x, y: e.y + n.y, z: e.z + n.z };
}
function H(e, n) {
  return { x: e.x - n.x, y: e.y - n.y, z: e.z - n.z };
}
function se(e, n) {
  return { x: e.x * n, y: e.y * n, z: e.z * n };
}
function Zn(e, n) {
  return e.x * n.x + e.y * n.y + e.z * n.z;
}
function V(e, n) {
  return {
    x: e.y * n.z - e.z * n.y,
    y: e.z * n.x - e.x * n.z,
    z: e.x * n.y - e.y * n.x
  };
}
function pe(e) {
  return Math.hypot(e.x, e.y, e.z);
}
function b(e, n = { x: 0, y: 1, z: 0 }) {
  const t = pe(e);
  return t <= Ye ? Je(n) : { x: e.x / t, y: e.y / t, z: e.z / t };
}
function et(e, n, t) {
  return { x: F(e.x, n.x, t), y: F(e.y, n.y, t), z: F(e.z, n.z, t) };
}
function nt(e, n) {
  return pe(H(e, n));
}
function Xe(e = 0, n = 0, t = 0, o = 1) {
  return { x: e, y: n, z: t, w: o };
}
function Ze() {
  return Xe(0, 0, 0, 1);
}
function tt(e) {
  return { x: e.x, y: e.y, z: e.z, w: e.w };
}
function N(e) {
  const n = Math.hypot(e.x, e.y, e.z, e.w);
  return n <= Ye ? Ze() : {
    x: e.x / n,
    y: e.y / n,
    z: e.z / n,
    w: e.w / n
  };
}
function ot(e, n) {
  return {
    x: e.w * n.x + e.x * n.w + e.y * n.z - e.z * n.y,
    y: e.w * n.y - e.x * n.z + e.y * n.w + e.z * n.x,
    z: e.w * n.z + e.x * n.y - e.y * n.x + e.z * n.w,
    w: e.w * n.w - e.x * n.x - e.y * n.y - e.z * n.z
  };
}
function rt(e, n) {
  const t = b(e, { x: 0, y: 1, z: 0 }), o = n * 0.5, r = Math.sin(o);
  return N({
    x: t.x * r,
    y: t.y * r,
    z: t.z * r,
    w: Math.cos(o)
  });
}
function st(e, n) {
  const t = e * 0.5, o = n * 0.5, r = Math.sin(t), s = Math.cos(t), a = Math.sin(o), c = Math.cos(o);
  return N({
    x: a * s,
    y: c * r,
    z: -a * r,
    w: c * s
  });
}
function en(e, n) {
  const t = { x: e.x, y: e.y, z: e.z }, o = V(t, n), r = V(t, o);
  return re(n, re(se(o, 2 * e.w), se(r, 2)));
}
function at(e, n, t) {
  let o = n.x, r = n.y, s = n.z, a = n.w, c = e.x * o + e.y * r + e.z * s + e.w * a;
  if (c < 0 && (o = -o, r = -r, s = -s, a = -a, c = -c), c > 0.9995)
    return N({
      x: F(e.x, o, t),
      y: F(e.y, r, t),
      z: F(e.z, s, t),
      w: F(e.w, a, t)
    });
  const i = Math.acos(ye(c, -1, 1)), u = i * t, y = Math.sin(u), d = Math.sin(i), f = Math.cos(u) - c * y / d, l = y / d;
  return {
    x: e.x * f + o * l,
    y: e.y * f + r * l,
    z: e.z * f + s * l,
    w: e.w * f + a * l
  };
}
function nn(e, n = { x: 0, y: 1, z: 0 }) {
  const t = b(
    { x: -e.x, y: -e.y, z: -e.z },
    { x: 0, y: 0, z: 1 }
  ), o = b(V(n, t), { x: 1, y: 0, z: 0 }), r = V(t, o), s = o.x, a = r.x, c = t.x, i = o.y, u = r.y, y = t.y, d = o.z, f = r.z, l = t.z, m = s + u + l;
  if (m > 0) {
    const h = 0.5 / Math.sqrt(m + 1);
    return N({
      x: (f - y) * h,
      y: (c - d) * h,
      z: (i - a) * h,
      w: 0.25 / h
    });
  }
  if (s > u && s > l) {
    const h = 2 * Math.sqrt(1 + s - u - l);
    return N({
      x: 0.25 * h,
      y: (a + i) / h,
      z: (c + d) / h,
      w: (f - y) / h
    });
  }
  if (u > l) {
    const h = 2 * Math.sqrt(1 + u - s - l);
    return N({
      x: (a + i) / h,
      y: 0.25 * h,
      z: (y + f) / h,
      w: (c - d) / h
    });
  }
  const p = 2 * Math.sqrt(1 + l - s - u);
  return N({
    x: (c + d) / p,
    y: (y + f) / p,
    z: 0.25 * p,
    w: (i - a) / p
  });
}
function Jt(e) {
  return { x: -Math.sin(e), y: 0, z: -Math.cos(e) };
}
function Xt(e) {
  return { x: Math.cos(e), y: 0, z: -Math.sin(e) };
}
function it(e, n) {
  return en(n, e);
}
const Zt = {
  create: Xn,
  clone: Je,
  add: re,
  sub: H,
  scale: se,
  dot: Zn,
  cross: V,
  length: pe,
  normalize: b,
  lerp: et,
  distance: nt,
  applyQuaternion: it
}, eo = {
  create: Xe,
  identity: Ze,
  clone: tt,
  normalize: N,
  multiply: ot,
  fromAxisAngle: rt,
  fromYawPitch: st,
  rotateVector: en,
  slerp: at,
  lookRotation: nn
}, no = {
  clamp: ye,
  lerp: F,
  degToRad: Ke,
  radToDeg: Qe
}, to = {
  clamp: ye,
  lerp: F,
  degToRad: Ke,
  radToDeg: Qe
}, oo = {
  lookRotation: nn
}, ro = N, tn = 28, K = {
  baseColor: [1, 1, 1, 1],
  roughness: 0.82,
  metallic: 0,
  normalScale: 1,
  alphaCutoff: 0
};
function on() {
  const e = Te();
  if (!e)
    throw new Error(
      "Engine not initialised — call bootMiniEngineRuntime() or startGame() before using ECS helpers"
    );
  return e;
}
function ct() {
  const e = ke();
  if (!e)
    throw new Error("WASM module not loaded");
  return e;
}
function I(e, n, t, o, r = 4294967295) {
  return { position: e, uv: n, normal: t, tangent: o, color: r >>> 0, tangentSign: 1 };
}
function Ee(e, n = 3) {
  function t(o) {
    const s = Math.max(-1, Math.min(1, o)) * 0.5 + 0.5;
    return Math.max(0, Math.min(1023, Math.round(s * 1023)));
  }
  return (t(e[0]) | t(e[1]) << 10 | t(e[2]) << 20 | (n & 3) << 30) >>> 0;
}
function so(e, n, t, o = 255) {
  return (e & 255 | (n & 255) << 8 | (t & 255) << 16 | (o & 255) << 24) >>> 0;
}
function Pe(e) {
  let n = e;
  return (n < -8 || n > 8) && (n = (n % 16 + 16) % 16), Math.max(0, Math.min(65535, Math.round((n + 8) / 16 * 65535)));
}
function ut(e, n, t, o, r, s, a = 4294967295, c = 1) {
  const i = n * tn;
  e.setFloat32(i + 0, t.x, !0), e.setFloat32(i + 4, t.y, !0), e.setFloat32(i + 8, t.z, !0), e.setUint16(i + 12, Pe(s.x), !0), e.setUint16(i + 14, Pe(s.y), !0), e.setUint32(i + 16, Ee([o.x, o.y, o.z], 3), !0), e.setUint32(
    i + 20,
    Ee([r.x, r.y, r.z], c < 0 ? 0 : 3),
    !0
  ), e.setUint32(i + 24, a >>> 0, !0);
}
function ao() {
  return { vertices: [], indices: [] };
}
function io(e) {
  const n = new Uint8Array(e.vertices.length * tn), t = new DataView(n.buffer);
  for (let o = 0; o < e.vertices.length; ++o) {
    const r = e.vertices[o];
    ut(t, o, r.position, r.normal, r.tangent, r.uv, r.color, r.tangentSign);
  }
  return {
    vertexBytes: n,
    indices: new Uint16Array(e.indices),
    vertexCount: e.vertices.length
  };
}
function lt(e) {
  return e !== null && typeof e == "object" && Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.z);
}
function E(e, n) {
  if (!lt(e))
    throw new Error(`${n} must be a vec3-like object with finite x/y/z numbers`);
}
function he(e = "xz") {
  switch (e) {
    case "xz":
      return {
        normal: { x: 0, y: 1, z: 0 },
        tangent: { x: 1, y: 0, z: 0 },
        bitangent: { x: 0, y: 0, z: -1 }
      };
    case "xy":
      return {
        normal: { x: 0, y: 0, z: 1 },
        tangent: { x: 1, y: 0, z: 0 },
        bitangent: { x: 0, y: 1, z: 0 }
      };
    case "yz":
      return {
        normal: { x: 1, y: 0, z: 0 },
        tangent: { x: 0, y: 0, z: 1 },
        bitangent: { x: 0, y: -1, z: 0 }
      };
    default:
      throw new Error(`unsupported planar orientation '${e}', expected 'xz', 'xy', or 'yz'`);
  }
}
function me(e, n, t, o, r) {
  return {
    x: e.x + n.x * o + t.x * r,
    y: e.y + n.y * o + t.y * r,
    z: e.z + n.z * o + t.z * r
  };
}
function ft(e) {
  return E(e.center, "appendBox() options.center"), E(e.size, "appendBox() options.size"), {
    center: e.center,
    resolvedHalfExtents: {
      x: e.size.x * 0.5,
      y: e.size.y * 0.5,
      z: e.size.z * 0.5
    },
    resolvedColor: e.color
  };
}
function q(e, { p0: n, p1: t, p2: o, p3: r, color: s, uvScale: a = 1 }) {
  E(n, "appendQuad() options.p0"), E(t, "appendQuad() options.p1"), E(o, "appendQuad() options.p2"), E(r, "appendQuad() options.p3");
  const c = b(V(H(t, n), H(o, n))), i = b(H(t, n)), u = e.vertices.length;
  e.vertices.push(I(n, { x: 0, y: 0 }, c, i, s)), e.vertices.push(I(t, { x: a, y: 0 }, c, i, s)), e.vertices.push(I(o, { x: a, y: a }, c, i, s)), e.vertices.push(I(r, { x: 0, y: a }, c, i, s)), e.indices.push(u, u + 1, u + 2, u, u + 2, u + 3);
}
function J(e, { p0: n, p1: t, p2: o, color: r }) {
  E(n, "appendTriangle() options.p0"), E(t, "appendTriangle() options.p1"), E(o, "appendTriangle() options.p2");
  const s = b(V(H(t, n), H(o, n))), a = b(H(t, n)), c = e.vertices.length;
  e.vertices.push(I(n, { x: 0, y: 0 }, s, a, r)), e.vertices.push(I(t, { x: 1, y: 0 }, s, a, r)), e.vertices.push(I(o, { x: 0.5, y: 1 }, s, a, r)), e.indices.push(c, c + 1, c + 2);
}
function co(e, n) {
  const { center: t, resolvedHalfExtents: o, resolvedColor: r } = ft(n), s = {
    nxnynz: { x: t.x - o.x, y: t.y - o.y, z: t.z - o.z },
    pxnynz: { x: t.x + o.x, y: t.y - o.y, z: t.z - o.z },
    pxpynz: { x: t.x + o.x, y: t.y + o.y, z: t.z - o.z },
    nxpynz: { x: t.x - o.x, y: t.y + o.y, z: t.z - o.z },
    nxnypz: { x: t.x - o.x, y: t.y - o.y, z: t.z + o.z },
    pxnypz: { x: t.x + o.x, y: t.y - o.y, z: t.z + o.z },
    pxpypz: { x: t.x + o.x, y: t.y + o.y, z: t.z + o.z },
    nxpypz: { x: t.x - o.x, y: t.y + o.y, z: t.z + o.z }
  };
  q(e, { p0: s.nxnypz, p1: s.pxnypz, p2: s.pxpypz, p3: s.nxpypz, color: r }), q(e, { p0: s.pxnynz, p1: s.nxnynz, p2: s.nxpynz, p3: s.pxpynz, color: r }), q(e, { p0: s.nxnynz, p1: s.nxnypz, p2: s.nxpypz, p3: s.nxpynz, color: r }), q(e, { p0: s.pxnypz, p1: s.pxnynz, p2: s.pxpynz, p3: s.pxpypz, color: r }), q(e, { p0: s.nxpynz, p1: s.nxpypz, p2: s.pxpypz, p3: s.pxpynz, color: r }), q(e, { p0: s.nxnynz, p1: s.pxnynz, p2: s.pxnypz, p3: s.nxnypz, color: r });
}
function uo(e, { baseCenter: n, size: t, color: o }) {
  E(n, "appendPyramid() options.baseCenter"), E(t, "appendPyramid() options.size");
  const r = t.x * 0.5, s = t.z * 0.5, a = n.y, c = n.y + t.y, i = { x: n.x - r, y: a, z: n.z - s }, u = { x: n.x + r, y: a, z: n.z - s }, y = { x: n.x + r, y: a, z: n.z + s }, d = { x: n.x - r, y: a, z: n.z + s }, f = { x: n.x, y: c, z: n.z };
  J(e, { p0: i, p1: u, p2: f, color: o }), J(e, { p0: u, p1: y, p2: f, color: o }), J(e, { p0: y, p1: d, p2: f, color: o }), J(e, { p0: d, p1: i, p2: f, color: o }), q(e, { p0: i, p1: d, p2: y, p3: u, color: o });
}
function lo(e, {
  center: n,
  width: t = 1,
  height: o = 1,
  widthSegments: r = 1,
  heightSegments: s = 1,
  orientation: a = "xz",
  color: c
}) {
  E(n, "appendPlane() options.center"), r = Math.max(1, Math.floor(r)), s = Math.max(1, Math.floor(s));
  const i = t * 0.5, u = o * 0.5, y = r + 1, d = s + 1, f = t / r, l = o / s, { normal: m, tangent: p, bitangent: h } = he(a), w = [];
  for (let x = 0; x < d; ++x) {
    const z = [], _ = x * l - u;
    for (let g = 0; g < y; ++g) {
      const A = g * f - i, P = me(n, p, h, A, -_);
      z.push(e.vertices.length), e.vertices.push(
        I(P, { x: g / r, y: 1 - x / s }, m, p, c)
      );
    }
    w.push(z);
  }
  for (let x = 0; x < s; ++x)
    for (let z = 0; z < r; ++z) {
      const _ = w[x][z], g = w[x + 1][z], A = w[x + 1][z + 1], P = w[x][z + 1];
      e.indices.push(_, g, P, g, A, P);
    }
}
function dt(e, {
  center: n,
  radius: t = 1,
  segments: o = 32,
  thetaStart: r = 0,
  thetaLength: s = Math.PI * 2,
  orientation: a = "xz",
  color: c
}) {
  E(n, "appendDisc() options.center"), o = Math.max(3, Math.floor(o));
  const { normal: i, tangent: u, bitangent: y } = he(a), d = e.vertices.length;
  e.vertices.push(I({ x: n.x, y: n.y, z: n.z }, { x: 0.5, y: 0.5 }, i, u, c));
  for (let f = 0; f <= o; ++f) {
    const l = r + f / o * s, m = Math.cos(l), p = Math.sin(l);
    e.vertices.push(
      I(
        me(n, u, y, t * m, t * p),
        { x: (m + 1) * 0.5, y: (p + 1) * 0.5 },
        i,
        u,
        c
      )
    );
  }
  for (let f = 1; f <= o; ++f)
    e.indices.push(f + d, f + d + 1, d);
}
function fo(e, n) {
  dt(e, n);
}
function yo(e, {
  center: n,
  innerRadius: t = 0.5,
  outerRadius: o = 1,
  thetaSegments: r = 32,
  phiSegments: s = 1,
  thetaStart: a = 0,
  thetaLength: c = Math.PI * 2,
  orientation: i = "xz",
  color: u
}) {
  E(n, "appendRing() options.center"), r = Math.max(3, Math.floor(r)), s = Math.max(1, Math.floor(s));
  const { normal: y, tangent: d, bitangent: f } = he(i), l = (o - t) / s, m = [];
  for (let p = 0; p <= s; ++p) {
    const h = t + l * p, w = [];
    for (let x = 0; x <= r; ++x) {
      const z = a + x / r * c, _ = h * Math.cos(z), g = h * Math.sin(z);
      w.push(e.vertices.length), e.vertices.push(
        I(
          me(n, d, f, _, g),
          { x: (_ / o + 1) * 0.5, y: (g / o + 1) * 0.5 },
          y,
          d,
          u
        )
      );
    }
    m.push(w);
  }
  for (let p = 0; p < s; ++p)
    for (let h = 0; h < r; ++h) {
      const w = m[p][h], x = m[p + 1][h], z = m[p + 1][h + 1], _ = m[p][h + 1];
      e.indices.push(w, x, _, x, z, _);
    }
}
function po(e, {
  center: n,
  radius: t = 1,
  tube: o = 0.4,
  radialSegments: r = 12,
  tubularSegments: s = 48,
  arc: a = Math.PI * 2,
  thetaStart: c = 0,
  thetaLength: i = Math.PI * 2,
  color: u
}) {
  E(n, "appendTorus() options.center"), r = Math.max(3, Math.floor(r)), s = Math.max(3, Math.floor(s));
  const y = [];
  for (let d = 0; d <= r; ++d) {
    const f = c + d / r * i, l = Math.cos(f), m = Math.sin(f), p = [];
    for (let h = 0; h <= s; ++h) {
      const w = h / s * a, x = Math.cos(w), z = Math.sin(w), _ = t + o * l, g = {
        x: n.x + _ * x,
        y: n.y + _ * z,
        z: n.z + o * m
      }, A = {
        x: n.x + t * x,
        y: n.y + t * z,
        z: n.z
      }, P = b({
        x: g.x - A.x,
        y: g.y - A.y,
        z: g.z - A.z
      }), R = b({ x: -_ * z, y: _ * x, z: 0 });
      p.push(e.vertices.length), e.vertices.push(I(g, { x: h / s, y: d / r }, P, R, u));
    }
    y.push(p);
  }
  for (let d = 1; d <= r; ++d)
    for (let f = 1; f <= s; ++f) {
      const l = y[d][f - 1], m = y[d - 1][f - 1], p = y[d - 1][f], h = y[d][f];
      e.indices.push(l, m, h, m, p, h);
    }
}
function ho(e, {
  center: n,
  radius: t = 1,
  widthSegments: o = 32,
  heightSegments: r = 16,
  phiStart: s = 0,
  phiLength: a = Math.PI * 2,
  thetaStart: c = 0,
  thetaLength: i = Math.PI,
  color: u
}) {
  E(n, "appendSphere() options.center"), o = Math.max(3, Math.floor(o)), r = Math.max(2, Math.floor(r));
  const y = Math.min(c + i, Math.PI), d = [];
  for (let f = 0; f <= r; ++f) {
    const l = [], m = f / r, p = c + m * i, h = Math.sin(p), w = Math.cos(p);
    let x = 0;
    f === 0 && c === 0 ? x = 0.5 / o : f === r && y === Math.PI && (x = -0.5 / o);
    for (let z = 0; z <= o; ++z) {
      const _ = z / o, g = s + _ * a, A = Math.sin(g), P = Math.cos(g), R = { x: -P * h, y: w, z: A * h }, T = Math.abs(h) <= 1e-6 ? { x: 1, y: 0, z: 0 } : b({ x: A, y: 0, z: P }), $ = {
        x: n.x + R.x * t,
        y: n.y + R.y * t,
        z: n.z + R.z * t
      };
      l.push(e.vertices.length), e.vertices.push(I($, { x: _ + x, y: 1 - m }, R, T, u));
    }
    d.push(l);
  }
  for (let f = 0; f < r; ++f)
    for (let l = 0; l < o; ++l) {
      const m = d[f][l + 1], p = d[f][l], h = d[f + 1][l], w = d[f + 1][l + 1];
      (f !== 0 || c > 0) && e.indices.push(m, p, w), (f !== r - 1 || y < Math.PI) && e.indices.push(p, h, w);
    }
}
function Re(e, n, t, o, r, s, a, c, i) {
  const u = { x: 0, y: r, z: 0 }, y = { x: 1, y: 0, z: 0 }, d = [];
  for (let l = 1; l <= s; ++l)
    d.push(e.vertices.length), e.vertices.push(
      I({ x: n.x, y: n.y + o, z: n.z }, { x: 0.5, y: 0.5 }, u, y, i)
    );
  const f = e.vertices.length;
  for (let l = 0; l <= s; ++l) {
    const p = l / s * c + a, h = Math.cos(p), w = Math.sin(p);
    e.vertices.push(
      I(
        { x: n.x + t * w, y: n.y + o, z: n.z + t * h },
        { x: h * 0.5 + 0.5, y: w * 0.5 * r + 0.5 },
        u,
        y,
        i
      )
    );
  }
  for (let l = 0; l < s; ++l) {
    const m = d[l], p = f + l;
    r > 0 ? e.indices.push(p, p + 1, m) : e.indices.push(p + 1, p, m);
  }
}
function yt(e, {
  center: n,
  radiusTop: t = 1,
  radiusBottom: o = 1,
  height: r = 1,
  radialSegments: s = 32,
  heightSegments: a = 1,
  openEnded: c = !1,
  thetaStart: i = 0,
  thetaLength: u = Math.PI * 2,
  color: y
}) {
  E(n, "appendCylinder() options.center");
  const d = Number(t), f = Number(o), l = Number(r);
  s = Math.max(3, Math.floor(s)), a = Math.max(1, Math.floor(a));
  const m = l * 0.5, p = Math.abs(l) <= 1e-6 ? 0 : (f - d) / l, h = [];
  for (let w = 0; w <= a; ++w) {
    const x = [], z = w / a, _ = z * (f - d) + d;
    for (let g = 0; g <= s; ++g) {
      const A = g / s, P = A * u + i, R = Math.sin(P), T = Math.cos(P), $ = {
        x: n.x + _ * R,
        y: n.y + (-z * l + m),
        z: n.z + _ * T
      }, ee = b({ x: R, y: p, z: T }), rn = b({ x: T, y: 0, z: -R });
      x.push(e.vertices.length), e.vertices.push(I($, { x: A, y: 1 - z }, ee, rn, y));
    }
    h.push(x);
  }
  for (let w = 0; w < s; ++w)
    for (let x = 0; x < a; ++x) {
      const z = h[x][w], _ = h[x + 1][w], g = h[x + 1][w + 1], A = h[x][w + 1];
      (d > 0 || x !== 0) && e.indices.push(z, _, A), (f > 0 || x !== a - 1) && e.indices.push(_, g, A);
    }
  !c && d > 0 && Re(e, n, d, m, 1, s, i, u, y), !c && f > 0 && Re(e, n, f, -m, -1, s, i, u, y);
}
function mo(e, {
  center: n,
  radius: t = 1,
  height: o = 1,
  radialSegments: r = 32,
  heightSegments: s = 1,
  openEnded: a = !1,
  thetaStart: c = 0,
  thetaLength: i = Math.PI * 2,
  color: u
}) {
  E(n, "appendCone() options.center"), yt(e, {
    center: n,
    radiusTop: 0,
    radiusBottom: t,
    height: o,
    radialSegments: r,
    heightSegments: s,
    openEnded: a,
    thetaStart: c,
    thetaLength: i,
    color: u
  });
}
function xo(e, {
  center: n,
  radius: t = 1,
  height: o = 1,
  capSegments: r = 4,
  radialSegments: s = 8,
  heightSegments: a = 1,
  color: c
}) {
  E(n, "appendCapsule() options.center");
  const i = Math.max(0, Number(o)), u = i * 0.5;
  r = Math.max(1, Math.floor(r)), s = Math.max(3, Math.floor(s)), a = Math.max(1, Math.floor(a));
  const y = Math.PI * t + i, d = r * 2 + a, f = s + 1;
  for (let l = 0; l <= d; ++l) {
    let m = 0, p = 0, h = 0, w = 0;
    if (l <= r) {
      const _ = l / r, g = _ * Math.PI / 2;
      m = -u - t * Math.cos(g), p = t * Math.sin(g), h = -t * Math.cos(g), w = _ * (Math.PI * 0.5) * t;
    } else if (l <= r + a) {
      const _ = (l - r) / a;
      m = -u + _ * i, p = t, h = 0, w = Math.PI * 0.5 * t + _ * i;
    } else {
      const _ = (l - r - a) / r, g = _ * Math.PI / 2;
      m = u + t * Math.sin(g), p = t * Math.cos(g), h = t * Math.sin(g), w = Math.PI * 0.5 * t + i + _ * (Math.PI * 0.5) * t;
    }
    const x = y <= 1e-6 ? 0 : Math.max(0, Math.min(1, w / y));
    let z = 0;
    l === 0 ? z = 0.5 / s : l === d && (z = -0.5 / s);
    for (let _ = 0; _ <= s; ++_) {
      const g = _ / s, A = g * Math.PI * 2, P = Math.sin(A), R = Math.cos(A), T = {
        x: n.x - p * R,
        y: n.y + m,
        z: n.z + p * P
      }, $ = b({
        x: -p * R,
        y: h,
        z: p * P
      }), ee = b({ x: p * P, y: 0, z: p * R });
      e.vertices.push(I(T, { x: g + z, y: x }, $, ee, c));
    }
    if (l > 0) {
      const _ = e.vertices.length - f * 2, g = e.vertices.length - f;
      for (let A = 0; A < s; ++A) {
        const P = _ + A, R = _ + A + 1, T = g + A, $ = g + A + 1;
        e.indices.push(P, R, T), e.indices.push(R, $, T);
      }
    }
  }
}
function wo(e, n, t, o = {}) {
  const r = e.runtime.sid(t), s = e.scenes.upsertRuntimeMaterial(n, r, {
    debugName: t,
    baseColor: o.baseColor || K.baseColor,
    roughness: o.roughness !== void 0 ? o.roughness : K.roughness,
    metallic: o.metallic !== void 0 ? o.metallic : K.metallic,
    normalScale: o.normalScale !== void 0 ? o.normalScale : K.normalScale,
    alphaCutoff: o.alphaCutoff !== void 0 ? o.alphaCutoff : K.alphaCutoff,
    albedoTextureHash: o.albedoTextureHash || 0,
    normalTextureHash: o.normalTextureHash || 0,
    propertiesTextureHash: o.propertiesTextureHash || 0
  });
  if (!s || s.ok === !1)
    throw new Error((s == null ? void 0 : s.error) ?? `failed to upsert runtime material '${t}'`);
  return {
    hash: s.material_hash >>> 0,
    index: s.material_index >>> 0,
    rebuildRequired: s.renderer_rebuild_required === !0,
    created: s.created === !0,
    updated: s.updated === !0
  };
}
function _o(e, n, t, o) {
  const r = e.runtime.sid(t), s = e.scenes.addRuntimeMesh(n, r, o.vertexBytes, o.indices, t);
  if (!s || s.ok === !1)
    throw new Error((s == null ? void 0 : s.error) ?? `failed to register runtime mesh '${t}'`);
  return {
    hash: s.mesh_hash >>> 0,
    index: s.mesh_index >>> 0,
    rebuildRequired: s.renderer_rebuild_required === !0,
    created: s.created === !0
  };
}
function go(e, n, t, o) {
  const { ECS: r, Components: s } = on(), { Transform: a, MeshRenderer: c, Name: i } = s;
  typeof r.bindModule == "function" && r.bindModule(e);
  const u = r.createEntity(t);
  o.name && (i == null ? void 0 : i.typeId) !== void 0 && r.writeComponent(t, u, i, {
    name_hash: n.runtime.sid(o.name)
  });
  const y = r.writeComponent(t, u, a, {
    position: o.position || { x: 0, y: 0, z: 0 },
    rotation: o.rotation || { x: 0, y: 0, z: 0, w: 1 },
    scale: o.scale || { x: 1, y: 1, z: 1 }
  }), d = r.writeComponent(t, u, c, {
    mesh: o.meshHash >>> 0,
    material: o.materialHash >>> 0,
    color: o.color || { x: 255, y: 255, z: 255, w: 255 }
  });
  return {
    entityId: u >>> 0,
    transformPtr: y.ptr >>> 0,
    meshRendererPtr: d.ptr >>> 0
  };
}
function zo(e, n) {
  if (!e) return;
  const t = ct(), { Components: o } = on();
  o.Transform.write(new DataView(t.HEAPU8.buffer), e >>> 0, n);
}
export {
  tn as RUNTIME_VERTEX_STRIDE_BYTES,
  co as appendBox,
  xo as appendCapsule,
  fo as appendCircle,
  mo as appendCone,
  yt as appendCylinder,
  dt as appendDisc,
  lo as appendPlane,
  uo as appendPyramid,
  q as appendQuad,
  yo as appendRing,
  ho as appendSphere,
  po as appendTorus,
  J as appendTriangle,
  kn as applyPreviewEvent,
  ve as bindEngine,
  qn as bootMiniEngineRuntime,
  ye as clamp,
  Et as clearGameplayComponents,
  gt as createGameplayComponentLibrary,
  ao as createMeshBuilder,
  It as createScene,
  _t as defineGameplayComponent,
  Ke as degToRad,
  Ct as destroyScene,
  Ut as disableGameAudio,
  Kt as disposeAudio,
  Tt as enableGameAudio,
  wo as ensureRuntimeMaterial,
  io as finalizeMesh,
  Jt as forwardFromYaw,
  On as frameMiniEngine,
  Ne as gameplayComponentsNeedRuntimeSync,
  An as getAssetScenes,
  Bt as getAudioContext,
  mt as getCameraEntityId,
  Te as getEcsBindings,
  En as getEngineAssets,
  pt as getEngineBaseUrl,
  Mt as getGameplayComponentSchemaById,
  zt as getGameplayComponentSchemaByName,
  fn as getGameplayComponentSchemas,
  Ot as getLoadedSounds,
  $t as getMasterVolume,
  C as getMini,
  Yt as getPlayingCount,
  G as getSceneHandle,
  cn as getSceneSaveHook,
  Vt as getSoundInfo,
  ke as getWasmModule,
  $e as hideSourceAssetEntities,
  We as initAudio,
  He as instantiateAsset,
  ht as isEngineReady,
  Wt as isPlaying,
  Dt as isSoundLoaded,
  Qt as length2D,
  F as lerp,
  Pn as loadAssetFromBuffer,
  Z as loadAssetFromUrl,
  Kn as loadAudioFromBuffer,
  Yn as loadAudioFromUrl,
  je as loadProjectAssetsIntoEngine,
  Ft as loadProjectAudioAssets,
  Cn as loadScene,
  vt as loadSceneFromUrl,
  Rt as loadSceneFull,
  no as math,
  Pt as multiplayer,
  ro as normalizeQuat,
  so as packColor,
  Ee as packSignedRgb10a2Unorm,
  Pe as packUvUnorm16,
  Gt as pauseSound,
  Nt as playMusic,
  Qn as playSound,
  eo as quat,
  tt as quatClone,
  Xe as quatCreate,
  rt as quatFromAxisAngle,
  st as quatFromYawPitch,
  Ze as quatIdentity,
  nn as quatLookRotation,
  ot as quatMultiply,
  N as quatNormalize,
  en as quatRotateVector,
  at as quatSlerp,
  Qe as radToDeg,
  At as registerGameplayComponents,
  _o as registerRuntimeMesh,
  Vn as resizeMiniEngineRenderer,
  Rn as restoreSourceAssetEntities,
  Lt as resumeAudio,
  Ht as resumeSound,
  Xt as rightFromYaw,
  bn as saveScene,
  vn as saveSceneFull,
  to as scalar,
  xt as setCameraEntityId,
  bt as setMainScene,
  jt as setMasterVolume,
  Ue as setSceneHandle,
  wt as setSceneSaveHook,
  qt as setSoundVolume,
  go as spawnRenderable,
  kt as startGame,
  Jn as stopAll,
  St as stopMusic,
  de as stopSound,
  Fe as syncGameplayComponentsWithRuntime,
  D as syncModuleHeapViews,
  oo as transform,
  zo as updateTransform,
  Zt as vec3,
  re as vec3Add,
  Je as vec3Clone,
  Xn as vec3Create,
  V as vec3Cross,
  nt as vec3Distance,
  Zn as vec3Dot,
  pe as vec3Length,
  et as vec3Lerp,
  b as vec3Normalize,
  se as vec3Scale,
  H as vec3Subtract,
  it as vec3TransformByQuaternion,
  ut as writeVertex
};
