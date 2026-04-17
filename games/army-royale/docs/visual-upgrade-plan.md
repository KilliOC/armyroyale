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
Status: **valmis**
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

### ⏸️ VAIHE BENCHMARK — GLB-performance test (odottaa A:n)
Tavoite: selvittää voidaanko 4 yksikköä vaihtaa GLB:hen ilman
performance-romahdusta.

Testi:
- Duckling GLB (duckling_swarm.glb), muut proseduraalisina
- 3 skenaariota: tyhjä / 40 unit / 120 unit
- Mittaa FPS, frame time, memory, GPU/CPU bound

Päätöshaaru benchmark-tuloksen mukaan:
- FPS > 50 ja pudotus < 15% → C_GLB
- FPS 40-50 → C_HYBRID (LOD tarvitaan)
- FPS < 40 → C_PROC (pysytään procedural)

### ⏸️ VAIHE B — Post-process + lighting + VFX (odottaa benchmark)
Tavoite: värien ja valaistuksen punch-up, VFX-polish

- B1 Post-process saturation, bloom, exposure, contrast, tint
- B2 Rim light (toinen directional)
- B3 Attack star burst
- B4 Projectile trail

### ⏸️ VAIHE C — Riippuu benchmark-päätöksestä
C_GLB: kaikki 4 yksikköä GLB:hen
C_HYBRID: front row GLB, back procedural, LOD
C_PROC: parannetaan proseduraalisia meshejä

## Päätökset-loki
- 2026-04-17: UI-layout lukittu — elixir vaakapalkki vasen, 160→148px bar
- 2026-04-17: Kamera lukittu (22, 32, -0.62, 0.88) — tradeoff play-field near edge clip visuaalisen jatkuvuuden eduksi

## Löydökset-loki
- 2026-04-17: LFG CLI shell-wrapperi rikki (polkubugi); `npx @lfg/cli` toimii mutta vaatii loginin
- 2026-04-17: GLB-assetit löytyvät paikallisesti `games/army-royale/assets/` (8 kpl), ei tarvetta CLI-haulle
- 2026-04-17: Runtime-komponenteista puuttuu Tween, ParticleEmitter, CameraShake-komponentti, Outline — tehdään käsin per-frame / meshpooleilla (kuten jo tehdään)
- 2026-04-17: cameraShake-logiikka jo starter_scene.js:ssä (rivit 452, 1237, 1273) — aktiivinen isoista impakteista

## Commit-historia per vaihe
- Vaihe A: (täytetään)
- Benchmark: (täytetään)
- Vaihe B: (täytetään)
- Vaihe C: (täytetään)
