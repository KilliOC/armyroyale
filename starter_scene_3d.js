// Army Royale — 3D scene using LFG Mini Engine
import {
  createMeshBuilder, appendBox, appendSphere, appendCone, appendCylinder,
  finalizeMesh, packColor, ensureRuntimeMaterial, registerRuntimeMesh,
  spawnRenderable, updateTransform, quatFromYawPitch,
} from '@lfg/mini-engine';
import {
  ECS, Transform, Camera, MainCamera,
  DirectionalLight, DirectionalLightSettings, EnvironmentSettings, PostProcessSettings,
  bindMiniModule,
} from './runtime/components.js';
import {
  LANES, FIELD_WIDTH, FIELD_DEPTH, BLUE_WALL_X, RED_WALL_X, FIELD_LEFT, FIELD_RIGHT,
  CAMERA_POSITION, CAMERA_PITCH, CAMERA_YAW, CAMERA_FOV, LIGHTING, CARDS, getCard,
} from './shared_world.js';
import {
  createMatchState, spawnFormation, deployBlue, tickMatch,
} from './army_simulation.js';

// ─── Mesh builders ───

function buildGroundMesh() {
  const b = createMeshBuilder();
  // Main grass field
  appendBox(b, { center: { x: 0, y: -0.15, z: 0 }, size: { x: 90, y: 0.3, z: 60 },
    color: packColor(95, 170, 55) });
  // Darker lane strips
  for (const lane of LANES) {
    appendBox(b, { center: { x: 0, y: -0.04, z: lane.z }, size: { x: 72, y: 0.08, z: 9 },
      color: packColor(85, 155, 48) });
  }
  // Grass edge strips
  appendBox(b, { center: { x: 0, y: -0.02, z: 28 }, size: { x: 90, y: 0.04, z: 6 },
    color: packColor(75, 145, 42) });
  appendBox(b, { center: { x: 0, y: -0.02, z: -28 }, size: { x: 90, y: 0.04, z: 6 },
    color: packColor(75, 145, 42) });
  // Center divider line
  appendBox(b, { center: { x: 0, y: 0.01, z: 0 }, size: { x: 0.3, y: 0.02, z: 55 },
    color: packColor(180, 210, 255) });
  return finalizeMesh(b);
}

function buildWallMesh(side) {
  const b = createMeshBuilder();
  const isBlue = side === 'blue';
  const wx = isBlue ? BLUE_WALL_X : RED_WALL_X;
  const c1 = isBlue ? packColor(55, 85, 165) : packColor(165, 55, 50);
  const c2 = isBlue ? packColor(70, 110, 195) : packColor(195, 70, 55);
  const c3 = isBlue ? packColor(40, 65, 130) : packColor(130, 40, 35);

  // Main wall
  appendBox(b, { center: { x: wx, y: 4, z: 0 }, size: { x: 3.5, y: 8, z: 50 }, color: c1 });
  // Wall top
  appendBox(b, { center: { x: wx, y: 8.2, z: 0 }, size: { x: 4.2, y: 0.5, z: 51 }, color: c2 });
  // Battlements
  for (let i = -5; i <= 5; i++) {
    appendBox(b, { center: { x: wx, y: 9, z: i * 4.5 }, size: { x: 4.5, y: 1.2, z: 2 }, color: c2 });
  }

  // Towers at top and bottom
  for (const tz of [22, -22]) {
    appendCylinder(b, { center: { x: wx, y: 5, z: tz }, radius: 3, height: 10, segments: 12, color: c1 });
    appendCone(b, { center: { x: wx, y: 11.5, z: tz }, radius: 3.5, height: 4, segments: 12, color: c2 });
    // Tower top
    appendSphere(b, { center: { x: wx, y: 14, z: tz }, radius: 0.6, widthSegments: 8, heightSegments: 6, color: packColor(255, 215, 50) });
  }

  // Gate arches for each lane
  for (const lane of LANES) {
    appendBox(b, { center: { x: wx, y: 2.5, z: lane.z }, size: { x: 4, y: 5, z: 4.5 }, color: c3 });
    // Gate top arch
    appendBox(b, { center: { x: wx, y: 5.2, z: lane.z }, size: { x: 4.5, y: 0.6, z: 5 }, color: c2 });
  }

  return finalizeMesh(b);
}

function buildGnomeMesh(bodyR, bodyG, bodyB, hatR, hatG, hatB, skinR, skinG, skinB, scale) {
  const b = createMeshBuilder();
  const s = scale || 1;
  const bodyC = packColor(Math.floor(bodyR*255), Math.floor(bodyG*255), Math.floor(bodyB*255));
  const hatC = packColor(Math.floor(hatR*255), Math.floor(hatG*255), Math.floor(hatB*255));
  const skinC = packColor(Math.floor(skinR*255), Math.floor(skinG*255), Math.floor(skinB*255));
  const beltC = packColor(90, 55, 25);

  // Body (ellipsoid approximated as box+sphere)
  appendSphere(b, { center: { x: 0, y: 0.5*s, z: 0 }, radius: 0.5*s, widthSegments: 8, heightSegments: 6, color: bodyC });
  // Belt
  appendBox(b, { center: { x: 0, y: 0.5*s, z: 0 }, size: { x: 0.9*s, y: 0.12*s, z: 0.9*s }, color: beltC });
  // Head
  appendSphere(b, { center: { x: 0, y: 1.1*s, z: 0 }, radius: 0.35*s, widthSegments: 8, heightSegments: 6, color: skinC });
  // Pointy hat (cone)
  appendCone(b, { center: { x: 0, y: 1.7*s, z: 0 }, radius: 0.35*s, height: 0.9*s, segments: 8, color: hatC });
  // Hat brim
  appendCylinder(b, { center: { x: 0, y: 1.28*s, z: 0 }, radius: 0.42*s, height: 0.08*s, segments: 8, color: hatC });

  return finalizeMesh(b);
}

function buildTreeMesh(scale) {
  const b = createMeshBuilder();
  const s = scale || 1;
  // Trunk
  appendCylinder(b, { center: { x: 0, y: 1.5*s, z: 0 }, radius: 0.4*s, height: 3*s, segments: 8,
    color: packColor(110, 75, 40) });
  // Canopy layers
  appendSphere(b, { center: { x: 0, y: 3.5*s, z: 0 }, radius: 2*s, widthSegments: 10, heightSegments: 8,
    color: packColor(60, 130, 50) });
  appendSphere(b, { center: { x: 0.5*s, y: 4*s, z: 0.3*s }, radius: 1.5*s, widthSegments: 8, heightSegments: 6,
    color: packColor(75, 155, 55) });
  appendSphere(b, { center: { x: -0.4*s, y: 3.8*s, z: -0.3*s }, radius: 1.3*s, widthSegments: 8, heightSegments: 6,
    color: packColor(65, 140, 45) });
  return finalizeMesh(b);
}

function buildImpactMesh() {
  const b = createMeshBuilder();
  // Explosion sphere
  appendSphere(b, { center: { x: 0, y: 0.5, z: 0 }, radius: 1, widthSegments: 8, heightSegments: 6,
    color: packColor(255, 200, 60) });
  // Smoke puffs
  appendSphere(b, { center: { x: 0.8, y: 0.3, z: 0.5 }, radius: 0.6, widthSegments: 6, heightSegments: 4,
    color: packColor(200, 185, 150) });
  appendSphere(b, { center: { x: -0.6, y: 0.4, z: -0.4 }, radius: 0.5, widthSegments: 6, heightSegments: 4,
    color: packColor(190, 175, 140) });
  return finalizeMesh(b);
}

// ─── Game controller ───

export function createArmyRoyaleGame(ui = {}) {
  let game = null;
  return {
    async begin(Module, Mini, sceneHandle) {
      bindMiniModule(Module);
      ECS.bindModule(Module);
      game = new ArmyRoyaleScene(Module, Mini, sceneHandle, ui);
      await game.init();
    },
    tick(Module, Mini, sceneHandle, dt) {
      if (game) game.tick(dt);
    },
    async end() { game = null; },
  };
}

class ArmyRoyaleScene {
  constructor(Module, Mini, sceneHandle, ui) {
    this.Module = Module;
    this.Mini = Mini;
    this.scene = sceneHandle;
    this.ui = ui;
    this.state = createMatchState();
    this.meshes = {};
    this.materials = {};
    this.unitEntities = new Map(); // unitId -> { entityId, transformPtr }
    this.impactEntities = [];
    this.treeEntities = [];
    this.time = 0;
  }

  async init() {
    // Materials
    this.materials.world = ensureRuntimeMaterial(this.Mini, this.scene, 'army_world', {
      roughness: 0.85, metallic: 0.02 });
    this.materials.unit = ensureRuntimeMaterial(this.Mini, this.scene, 'army_unit', {
      roughness: 0.65, metallic: 0.05 });
    this.materials.vfx = ensureRuntimeMaterial(this.Mini, this.scene, 'army_vfx', {
      roughness: 0.9, metallic: 0.0 });

    // Meshes
    this.meshes.ground = registerRuntimeMesh(this.Mini, this.scene, 'army_ground', buildGroundMesh());
    this.meshes.blueWall = registerRuntimeMesh(this.Mini, this.scene, 'army_blue_wall', buildWallMesh('blue'));
    this.meshes.redWall = registerRuntimeMesh(this.Mini, this.scene, 'army_red_wall', buildWallMesh('red'));
    this.meshes.tree = registerRuntimeMesh(this.Mini, this.scene, 'army_tree', buildTreeMesh(1));
    this.meshes.impact = registerRuntimeMesh(this.Mini, this.scene, 'army_impact', buildImpactMesh());

    // Gnome meshes per card type per team
    this.meshes.gnomes = {};
    for (const card of CARDS) {
      const sc = card.role === 'breaker' ? 1.3 : card.role === 'rush' ? 0.8 : 1.0;
      this.meshes.gnomes[`blue_${card.id}`] = registerRuntimeMesh(
        this.Mini, this.scene, `gnome_blue_${card.id}`,
        buildGnomeMesh(...card.blueBody, ...card.blueHat, ...card.skin, sc));
      this.meshes.gnomes[`red_${card.id}`] = registerRuntimeMesh(
        this.Mini, this.scene, `gnome_red_${card.id}`,
        buildGnomeMesh(...card.redBody, ...card.redHat, ...card.skin, sc));
    }

    // Rebuild if needed
    const anyRebuild = [this.materials.world, this.materials.unit, this.materials.vfx,
      this.meshes.ground, this.meshes.blueWall, this.meshes.redWall, this.meshes.tree,
      this.meshes.impact, ...Object.values(this.meshes.gnomes)]
      .some(r => r.rebuildRequired);
    if (anyRebuild) {
      if (!this.Mini.scenes.rebuildRendererResources(this.scene))
        throw new Error('Failed to rebuild renderer resources');
    }
    if (!this.Mini.scenes.resetRuntime(this.scene))
      throw new Error('Failed to reset scene runtime');

    this._createLighting();
    this._createCamera();
    this._spawnEnvironment();

    // Initial spawns
    spawnFormation(this.state, 'blue', 'top', 'swords');
    spawnFormation(this.state, 'blue', 'mid', 'swords');
    spawnFormation(this.state, 'blue', 'bot', 'brutes');
    spawnFormation(this.state, 'blue', 'mid', 'archers');
    spawnFormation(this.state, 'blue', 'bot', 'gnomes');
    spawnFormation(this.state, 'red', 'top', 'swords');
    spawnFormation(this.state, 'red', 'mid', 'swords');
    spawnFormation(this.state, 'red', 'bot', 'brutes');
    spawnFormation(this.state, 'red', 'mid', 'archers');
    spawnFormation(this.state, 'red', 'top', 'gnomes');

    // Wire UI
    this._installInput();
    this._updateHud();

    if (this.ui.statusElement) this.ui.statusElement.textContent = 'Army Royale 3D loaded';
  }

  _createLighting() {
    const sun = ECS.createEntity(this.scene);
    ECS.writeComponent(this.scene, sun, DirectionalLight, {
      direction: LIGHTING.sunDirection, illuminance: LIGHTING.illuminance });
    ECS.writeComponent(this.scene, sun, DirectionalLightSettings, {
      sun_color: LIGHTING.sunColor, ambient_intensity: LIGHTING.ambientIntensity });
    ECS.writeComponent(this.scene, sun, EnvironmentSettings, {
      sky_cubemap_name_hash: this.Mini.runtime.sid(LIGHTING.skyCubemapName) });
    const post = ECS.createEntity(this.scene);
    ECS.writeComponent(this.scene, post, PostProcessSettings, LIGHTING.postProcess);
  }

  _createCamera() {
    const eid = ECS.createEntity(this.scene);
    ECS.writeComponent(this.scene, eid, Transform, {
      position: CAMERA_POSITION,
      rotation: quatFromYawPitch(CAMERA_YAW, CAMERA_PITCH),
      scale: { x: 1, y: 1, z: 1 },
    });
    ECS.writeComponent(this.scene, eid, Camera, { fov: CAMERA_FOV, near: 0.1, far: 500 });
    ECS.addComponent(this.scene, eid, MainCamera);
  }

  _spawnEnvironment() {
    const mh = this.materials.world.hash;
    // Ground
    spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'Ground', meshHash: this.meshes.ground.hash, materialHash: mh,
      position: { x: 0, y: 0, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 1, y: 1, z: 1 } });
    // Walls
    spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'BlueWall', meshHash: this.meshes.blueWall.hash, materialHash: mh,
      position: { x: 0, y: 0, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 1, y: 1, z: 1 } });
    spawnRenderable(this.Module, this.Mini, this.scene, {
      name: 'RedWall', meshHash: this.meshes.redWall.hash, materialHash: mh,
      position: { x: 0, y: 0, z: 0 }, rotation: quatFromYawPitch(0, 0), scale: { x: 1, y: 1, z: 1 } });
    // Trees
    const treePositions = [
      { x: -42, z: 24, s: 1.1 }, { x: -42, z: -24, s: 0.9 },
      { x: 42, z: 24, s: 1.0 }, { x: 42, z: -24, s: 0.95 },
      { x: -42, z: 0, s: 0.8 }, { x: 42, z: 0, s: 0.85 },
      { x: 0, z: 28, s: 0.7 }, { x: 0, z: -28, s: 0.75 },
    ];
    for (const tp of treePositions) {
      spawnRenderable(this.Module, this.Mini, this.scene, {
        name: 'Tree', meshHash: this.meshes.tree.hash, materialHash: mh,
        position: { x: tp.x, y: 0, z: tp.z },
        rotation: quatFromYawPitch(Math.random() * 6.28, 0),
        scale: { x: tp.s, y: tp.s, z: tp.s } });
    }
  }

  _installInput() {
    const btns = document.querySelectorAll('.deploy-btn');
    btns.forEach(btn => {
      const handler = () => {
        if (deployBlue(this.state, btn.dataset.lane)) {
          this._updateHud();
        }
      };
      btn.addEventListener('click', handler);
      btn.addEventListener('touchstart', e => { e.preventDefault(); handler(); });
    });
  }

  _getOrCreateUnitEntity(unit) {
    if (this.unitEntities.has(unit.id)) return this.unitEntities.get(unit.id);
    const meshKey = `${unit.team}_${unit.cardId}`;
    const mesh = this.meshes.gnomes[meshKey];
    if (!mesh) return null;
    const entity = spawnRenderable(this.Module, this.Mini, this.scene, {
      name: `Unit_${unit.id}`,
      meshHash: mesh.hash,
      materialHash: this.materials.unit.hash,
      position: { x: unit.x, y: 0, z: unit.z },
      rotation: quatFromYawPitch(unit.team === 'blue' ? 0 : Math.PI, 0),
      scale: { x: 1, y: 1, z: 1 },
    });
    const info = { entityId: entity.entityId, transformPtr: entity.transformPtr };
    this.unitEntities.set(unit.id, info);
    return info;
  }

  _syncUnits() {
    const allUnits = [...this.state.blueUnits, ...this.state.redUnits];
    const liveIds = new Set(allUnits.map(u => u.id));

    // Remove dead unit entities
    for (const [id, info] of this.unitEntities) {
      if (!liveIds.has(id)) {
        // Can't destroy easily, just move far away
        updateTransform(info.transformPtr, {
          position: { x: 0, y: -100, z: 0 },
          rotation: quatFromYawPitch(0, 0),
          scale: { x: 0.01, y: 0.01, z: 0.01 },
        });
        this.unitEntities.delete(id);
      }
    }

    // Update live units
    for (const u of allUnits) {
      const info = this._getOrCreateUnitEntity(u);
      if (!info) continue;
      const bob = Math.sin(this.time * 4 + u.bob) * 0.15;
      const yaw = u.team === 'blue' ? 0 : Math.PI;
      const scale = u.hitFlash > 0.3 ? 1.15 : 1.0;
      updateTransform(info.transformPtr, {
        position: { x: u.x, y: bob, z: u.z },
        rotation: quatFromYawPitch(yaw, 0),
        scale: { x: scale, y: scale, z: scale },
      });
    }
  }

  _updateHud() {
    const s = this.state;
    if (this.ui.timerEl) this.ui.timerEl.textContent = this._formatTime(s.time);
    if (this.ui.blueHpEl) this.ui.blueHpEl.textContent = Math.max(0, Math.round(s.blueHP));
    if (this.ui.redHpEl) this.ui.redHpEl.textContent = Math.max(0, Math.round(s.redHP));
    if (this.ui.statusEl) this.ui.statusEl.textContent = s.statusText;
    if (this.ui.elixirValEl) this.ui.elixirValEl.textContent = Math.floor(s.elixir);
    if (this.ui.elixirBarEl) this.ui.elixirBarEl.style.width = `${(s.elixir / s.maxElixir) * 100}%`;
    if (this.ui.phaseEl) this.ui.phaseEl.textContent = s.phase === 'result' ? 'RESULT' : '';
    this._rebuildCardTray();
  }

  _rebuildCardTray() {
    const tray = this.ui.cardTrayEl;
    if (!tray) return;
    tray.innerHTML = '';
    const active = this.state.hand.slice(0, 4);
    active.forEach(cardId => {
      const card = getCard(cardId);
      const div = document.createElement('div');
      div.className = 'card' + (cardId === this.state.selectedCard ? ' selected' : '') +
        (card.cost > this.state.elixir + 0.01 ? ' dim' : '');
      div.innerHTML = `
        <div class="card-cost">${card.cost}</div>
        <div class="card-icon">${card.role === 'melee' ? '⚔️' : card.role === 'ranged' ? '🏹' : card.role === 'breaker' ? '🔨' : '🪓'}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-count">×${card.count}</div>
      `;
      div.addEventListener('click', () => {
        if (this.state.phase === 'result') return;
        this.state.selectedCard = cardId;
        this.state.statusText = `${card.name.toUpperCase()} selected — tap a lane`;
        this._updateHud();
      });
      tray.appendChild(div);
    });
  }

  _formatTime(s) {
    const m = Math.floor(Math.max(0, s) / 60);
    const sec = String(Math.ceil(Math.max(0, s) % 60)).padStart(2, '0');
    return `${m}:${sec}`;
  }

  tick(dt) {
    this.time += dt;
    tickMatch(this.state, dt);
    this._syncUnits();
    this._updateHud();
  }
}
