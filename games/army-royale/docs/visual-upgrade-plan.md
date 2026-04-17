# Army Royale Visual Upgrade Plan

## Tavoite
Nostaa Army Royalen visuaalinen taso lähemmäs Clash Royalea ilman
että rikotaan nykyistä toimivaa tilaa (kamera, UI, pelilogiikka).

## Lukitut alueet (EI MUUTU)
- Kamera: position (0, 22, 32), pitch -0.62, FOV 0.88
- UI-layout: elixir-palkki vasemmalla, kortit keskellä, bottom-bar
- Pelilogiikka: elixir, deploy, balance, AI, unit stats
- Kenttä: walls ±28, lanes ±12, deploy zones

## Vaiheet

### ✅ Tehty: kamera + UI refactor (edellinen iteraatio)
- Canvas viewport-split (148px alaosa UI:lle)
- Pitkä vaakapalkki-elixir vasemmalla (340×50)
- Puinen bottom-bar tausta (gradient #4a3020→#2a1810, kultareuna)
- Disabled-kortit himmeiksi (opacity 0.7 + grayscale 0.5 + brightness 0.85)

### ✅ VAIHE A — Yksiköiden animaatiot
Status: **✅ VALMIS (hyväksytty 2026-04-17)**
Hyväksyntä-peruste: screenshot + agent-raportti + FPS-mittaukset + live-video ("näytti elävältä")
Tavoite: nykyiset animaatiot näkyväksi ja punchiksi

Hook-pisteet (starter_scene.js _syncUnits):
- `u.spawnTime` (0.4→0, scale grow)
- `u.hitFlash` (1→0 at dt*3 decay)
- `u.atkFlash` (1→0 at dt*4 decay)
- `u.bob` (random phase offset from sim)
- `state.deadUnits[]` (timer 0.5→0, fall+spin)

Tehdään:
- A1 Walking bob vahvemmaksi (taajuus + amplitudi + sway)
- A2 Spawn pop-in elastic (overshoot curve, y-drop)
- A3 Attack squash-stretch (x/y ristikkäin)
- A4 Death dramaattisempi (haukkovaihe + kovempi spin)
- A5 Hit flash vahvemmaksi (scale 1.25 + kesto 120ms)

Havainnot:
- A1-A5 kaikki toteutettavissa per-frame-laskennalla `_syncUnits`-kerroksessa
- Squash-stretch käyttää `u.atkFlash`-arvoa suoraan intensiteettinä (ei tarvita erillistä animaatiotilaa)
- Elastic easing standardilla `easeOutElastic`-kaavalla (c = 2π/3) — peak ~1.25 kohdassa t=0.1, settles ~1.0
- Material-tint valkoiseksi hitillä jätettiin pois (vaatisi materiaali-swap-systeemin rakentamista; skope väärin tähän vaiheeseen)
- Death-animaatio kääntyi: aiemmin yksikkö NOUSI 2.5 yks. ylös (outo), nyt laskeutuu alas -1.0 yks. fall-vaiheessa
- FPS-mittaus noise-herkkä: 2 eri ajoa samalla koodilla antoi erilaisia lukuja (jopa 20%-poikkeamia). Browser-tila vaikuttaa

Mittaukset:
- FPS ennen: idle 130, battle 131, heavy 118 (1280×720 headful Chromium)
- FPS jälkeen: idle 117, battle 108, heavy 126 (keskiarvo 2 ajosta)
- Keskimäärin -10 / -18 / +7 % — vaihtelu suurta mutta absoluuttiset luvut 100+ fps, huomattavasti yli target 55fps
- Min spike: 16-40 fps single-frame (spawn-bursts)

### ✅ VAIHE BENCHMARK — GLB-performance test
Status: **valmis (hyväksytty 2026-04-17, päätös: C_GLB + material override)**

#### Tutkimus (T1-T4) — 2026-04-17

- **T1** Duckling procedural: `starter_scene.js:247-267` buildDucklingMesh, `:479-482` registerRuntimeMesh per team, `:909-921` _getOrCreateUnitEntity spawnRenderable, 1 entity per unit
- **T2** SDK:n GLB-pipeline: `loadAssetFromUrl(url, name)` → stubScene; `Mini.scenes.instantiate(mainScene, stubScene, transform)` → rootEntity + child subtree; `Mini.scenes.listResources(scene)` → mesh/material/skeleton/anim_clip arrays
- **T3** duckling_swarm.glb: **0 anim_clips**, 1 skeleton (ei käyttöä ilman clippejä), 1 mesh (`tripo_node_*`), 1 material (`duckling_probe#tripo_material_*`). Full `Mini.scenes.instantiate` luo 42 entityä per duckling
- **T4** Team-väri: `MeshRenderer.color` (u8x4 RGBA) — per-instance tint shader-tasolla. Sama API proseduraalille ja GLB-meshille. **HUOM: multiplier mode** — jos GLB:ssä kirkas texture, tint heikkenee

#### Mittaukset (Path B, 1280×720 headful Chromium, Win11 + WebGPU)

|  | Procedural | GLB-Duckling | Δ |
|---|---|---|---|
| S1 Tyhjä (fps) | 91 | 91 | ~0% |
| S2 ~80-115 units (fps) | 86 | 90 | +4% |
| S3 ~180-260 units (fps) | 91 | 90 | -1% |
| Frame max @ S3 (ms) | 24 | 36 | +12 ms |
| Spikes >33ms @ S3 | 0 | 2 | +2 |
| Memory @ S3 (MB) | 14.9 | 13.4 | -1.5 MB |

**Bound**: molemmat CPU-bound per-frame transform updates `_syncUnits`-loopissa. GPU ei pullonkaulana.

**Visuaaliset havainnot**:
- Proc: selkeä team color (vertex-vari meshissä dominoi)
- GLB: team color **heikko** koska `MeshRenderer.color` multiplier × Tripo-textuurin kirkas keltainen = muddy olive. Ei critical bug, mutta erottuvuus heikko
- Muut A1-A5 animaatiot toimivat GLB-Ducklingille ilman muutoksia (transform-pohjaisia)

#### Päätös

**Suositus: C_GLB (mahdollinen kaikille 4 yksikölle)**

Perustelut:
1. S3 90 fps > 90 target ✓
2. Δ proc vs GLB < 5% ✓ (selkeästi alle 20% rajan)
3. Ei crashes, ei layout-bugeja
4. Team color -heikkous on tunable, ei fundamental

Edellytys C-vaiheelle: **tutki team-color-ratkaisut ennen kaikkien 4 swappia** — vaihtoehdot:
a) Darker/saturoidummat tint-arvot
b) Material-override (katso onko `upsertRuntimeMaterial` käytettävissä per-instance)
c) Hyväksy heikompi team-color + tukeudu position/silhouette cues

### ⏸️ VAIHE B — Post-process + lighting + VFX (odottaa benchmark)
Tavoite: värien ja valaistuksen punch-up, VFX-polish

- B1 Post-process saturation, bloom, exposure, contrast, tint
- B2 Rim light (toinen directional)
- B3 Attack star burst
- B4 Projectile trail

### 🔄 VAIHE C — Full GLB migration (C_GLB valittu)
Status: **työn alla**

Sub-steps:
- C_STEP1: team-material-systeemin tutkimus (R1-R4)
- C_STEP2: material override Ducklingille, validoi
- C_STEP3: hamster → monkey → frog migraatio, yksi kerrallaan
- C_STEP4: full validaatio + FPS + memory + visuaali

#### R1-R4 Tutkimustulokset (2026-04-17)

- **R1** `Mini.scenes.upsertRuntimeMaterial(sceneHandle, matHash, opts)` — luo/päivittää materialin. Opts: `baseColor[]`, `roughness`, `metallic`, `normalScale`, `alphaCutoff`, `albedoTextureHash`, `normalTextureHash`, `propertiesTextureHash`. Helper: `ensureRuntimeMaterial(Mini, scene, name, opts)` → `{hash, index, rebuildRequired, created, updated}`. Peli käyttää jo tätä (`starter_scene.js:443`).
- **R2** GLB materialin read-API:ta ei löydy — `listResources` palauttaa vain `{name}` material-objekteille. Texture-hashit ei luettavissa JS-puolelta.
- **R3** Kyllä — `MeshRenderer.material` on `u32` hash (`runtime/components.js:779`). Jokainen entity voi viitata eri materialhash:iin. Sama mesh + eri materialit = per-team värit ilman mesh-duplikaatiota.
- **R4** Ei eksplisiittistä team-tint-esimerkkiä SDK:ssa, mutta `ensureRuntimeMaterial`-pattern on standardi. Pelin init() luo jo 3 materialia samalla API:lla.

**Päätös**: Vaihtoehto A — material duplication per team (2 materialia per yksikkötyyppi). Albedo texture pois (`albedoTextureHash: 0`) → solid baseColor render, Clash Royale -tyylinen cel-shaded look. Menetetään Tripo-texture detail mutta saadaan vahva team-color.

## Päätökset-loki
- 2026-04-17: UI-layout lukittu — elixir vaakapalkki vasen, 160→148px bar
- 2026-04-17: Kamera lukittu (22, 32, -0.62, 0.88) — tradeoff play-field near edge clip visuaalisen jatkuvuuden eduksi
- 2026-04-17: Path B valittu Path A:n sijaan — GLB on static mesh, entity-määrä per unit pidetään 1, MeshRenderer.color tint team-värille. Path A kirjataan mahdolliseksi tulevaisuuden poluksi jos käytetään animoituja GLB:itä.
- 2026-04-17: C_GLB valittu — benchmark osoitti perf-neutraaliksi (-1% @ 240 units, +4% @ 80-115). Memory jopa parempi. Team-color vaihtoehto 2 (material override per team) valittu saturoidun lopputuloksen varmistamiseksi.
- 2026-04-17: Vaihtoehto A (material duplication + albedoTextureHash=0) valittu C_STEP2:lle. CR-tyylinen cel-shaded solid color sopii peliin. Team-readibility kriittinen gameplay-asia (blue vs red 100ms-tunnistus). Multiplier-tint benchmarkissä muddy. SDK-natiivi toteutus ~4 rivin lisäys. Silhuetti tuo GLB-arvon, ei textuurin pintadetalit.

## Löydökset-loki
- 2026-04-17: LFG CLI shell-wrapperi rikki (polkubugi); `npx @lfg/cli` toimii mutta vaatii loginin
- 2026-04-17: GLB-assetit löytyvät paikallisesti `games/army-royale/assets/` (8 kpl), ei tarvetta CLI-haulle
- 2026-04-17: Runtime-komponenteista puuttuu Tween, ParticleEmitter, CameraShake-komponentti, Outline — tehdään käsin per-frame / meshpooleilla (kuten jo tehdään)
- 2026-04-17: cameraShake-logiikka jo starter_scene.js:ssä (rivit 452, 1237, 1273) — aktiivinen isoista impakteista
- 2026-04-17 (vaihe A): Animaatiot olivat jo olemassa mutta liian subtile — amplitude + easing -fiksit toivat ne näkyviksi. Bonus: korjattu death y-suunta bug (rose upward → falls down)

## Commit-historia per vaihe
- Vaihe A: `696a6b2` — vaihe A: yksiköiden animaatiot vahvemmiksi
- Benchmark: `bf690dc` — benchmark: GLB-test Ducklingille Path B + mittaukset
- Vaihe B: (täytetään)
- Vaihe C: (täytetään)
