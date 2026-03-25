# Art Production Plan — Army Royale Prototype

Task: AR-028

## Overview

This document defines the art production plan for the Army Royale first-playable prototype. It covers every visual category needed, recommends specific sourcing strategies, and sequences work so art unblocks gameplay milestones rather than blocking them.

The visual target is a **stylized 2.5D battlefield** optimized for **mobile landscape**. The mockup is the primary visual reference. Art direction principles: readable, chunky, toy-soldier feel with strong blue-vs-red faction clarity and breach as the hero spectacle moment.

---

## 1. Battlefield Terrain & Environment

### What's needed
- Flat ground plane with two-tone attacker/defender zones
- Visible front-line or no-man's-land strip
- Lane segmentation markers (if lanes are used)
- Deployment zone indicators per side
- Background horizon / sky treatment
- Decorative props for depth (trees, rocks, camps, tents)

### Concrete recommendations
- **Ground:** Single flat plane with a gradient shader — green (attacker) to brown/grey (defender). No mesh complexity needed for v1.
- **Front-line:** Glowing line or subtle particle strip marking the contested zone. Build in code as a shader or line geometry — this is a core visual and should be custom.
- **Deployment zones:** Colored overlay rectangles or subtle ground tint. CSS-simple, render as transparent quads.
- **Horizon:** Flat gradient skybox or a single painted backdrop plane. Don't build 3D skyline geometry.
- **Props (Phase 2):** Source from KayKit Medieval Hexagon pack (CC0) — trees, rocks, camps. Add after gameplay loop works.

### Sourcing
| Element | Strategy | Source |
|---|---|---|
| Ground plane | **Create** — procedural gradient | Code-generated |
| Front-line marker | **Create** — custom shader/geometry | Code-generated |
| Deployment zones | **Create** — colored overlays | Code-generated |
| Background/sky | **Create** — painted gradient or flat color | Simple texture |
| Decorative props | **Source** — add in Phase 2 | KayKit Medieval Hexagon (CC0) |

---

## 2. Walls, Gates & Fortifications

### What's needed
- Player-side wall/fortress
- Enemy-side wall/fortress
- Gate or weak point (breach target)
- 2–3 wall health/damage states (intact → damaged → breached)
- Rubble or destruction indicator for breach state
- Optional: tower accents at wall endpoints

### Concrete recommendations
- **V1 wall:** Procedural box mesh with a stone texture. One long rectangle per side. Height ~2–3 units, visible from high camera. Apply damage as texture swap or overlay darkening.
- **Breach state:** Swap the gate section mesh to a rubble mesh or collapse the geometry downward. Add particle burst (smoke + debris) on breach trigger — this is the hero moment.
- **Damage states:** 3 states minimum: (1) intact — clean stone texture, (2) damaged — cracks overlay or darker tint, (3) breached — rubble mesh + gap.
- **Dress-up (Phase 2):** Add Kenney Castle Kit tower models at wall endpoints and a gate arch in the center.

### Sourcing
| Element | Strategy | Source |
|---|---|---|
| Wall mesh | **Create** — procedural box | Code-generated |
| Stone texture | **Source or create** — simple tiling texture | Free texture site or hand-painted |
| Damage overlays | **Create** — crack decals or tint shader | Code-generated |
| Breach rubble | **Create** — simple collapsed geometry | Low-poly manual or procedural |
| Tower accents | **Source** — Phase 2 dress-up | Kenney Castle Kit (CC0) |

---

## 3. Unit Visuals

### What's needed
- Friendly infantry sprite/visual
- Enemy infantry sprite/visual
- At least one heavier/elite variant (cavalry or siege)
- Clear blue vs red faction color treatment
- Spawn animation or fade-in
- Death/despawn response (fade, fall, poof)
- Units render as instanced billboard sprites at camera distance

### Concrete recommendations
- **V1 units:** Use **Toen's Medieval Strategy Pack** (free w/ attribution, itch.io). It has 300+ 16×16 sprites purpose-built for strategy games: swordsmen, archers, cavalry, siege engines. The pixel scale works well for billboard rendering at our camera distance.
- **Faction color:** Tint shader on the billboard quad — multiply blue for player, red for enemy. Toen's sprites have neutral enough colors to accept tinting.
- **Heavy/elite:** Use the cavalry or siege sprites from the same pack for visual weight differentiation.
- **Spawn:** Fade-in over 0.3s + small dust puff particle.
- **Death:** Fade-out over 0.2s or quick scale-to-zero. Don't animate ragdolls — aggregate units, not individual soldiers.
- **Upgrade path (Phase 2+):** AI-generate custom sprite sheets (Midjourney/Stable Diffusion → Aseprite cleanup) at 32×32 or 64×64 for crisper mobile display.

### Sourcing
| Element | Strategy | Source |
|---|---|---|
| Infantry sprites | **Source** — grab now | Toen's Medieval Strategy Pack (free w/ attribution) |
| Cavalry/siege sprites | **Source** — grab now | Toen's Medieval Strategy Pack |
| Faction tinting | **Create** — billboard shader | Code-generated |
| Spawn/death effects | **Create** — simple particle + fade | Code-generated |
| Final custom sprites | **Create** — Phase 3 | AI-generated + Aseprite cleanup |

---

## 4. Cards & Deployment Visuals

### What's needed
- Card frame template (deployment hand)
- Unit/type icon per card
- Cost readout area
- Hover/selected/pressed interaction states
- Drag-to-deploy or tap-to-place feedback
- Optional: rarity or role color accent

### Concrete recommendations
- **Card frame:** Build in React/CSS. Rounded rectangle with a dark border, unit icon in center, cost badge in corner. Don't source art for this — it's faster to code and iterate.
- **Unit icons:** Crop from Toen's sprite pack or use simple silhouette icons. 32×32 is enough at mobile card sizes.
- **Interaction states:** CSS transitions — scale up on hover, border glow on select, opacity drop on drag. No art assets needed.
- **Deploy feedback:** Ghost/transparent version of the unit sprite placed at the target location while dragging. Snap to valid zones with a green/red tint.
- **Polish pass (Phase 2):** Design a proper card skin with illustration area, stats layout, and themed frame. Only after deployment UX is proven.

### Sourcing
| Element | Strategy | Source |
|---|---|---|
| Card frame | **Create** — React/CSS | Code-generated |
| Unit icons | **Kitbash** — crop from Toen's sprites | Toen's pack |
| Interaction states | **Create** — CSS transitions | Code-generated |
| Deploy feedback | **Create** — ghost sprite + tint | Code-generated |
| Final card skin | **Create** — Phase 2+ | Custom design |

---

## 5. HUD & UI Elements

### What's needed
- Top HUD bar (resources, timer, score/pressure)
- Deployment hand/tray (bottom of screen)
- Resource counter (gold/mana/whatever the economy uses)
- Match status indicator
- Pause/settings button
- Victory/defeat end-screen panel
- Readable typography at mobile sizes

### Concrete recommendations
- **Build entirely in React/CSS.** The HUD is a DOM overlay, not a canvas element. Use flexbox layout with semi-transparent dark panels.
- **Resource counter:** Number + icon. Use a simple coin/gem SVG or emoji placeholder. Don't source an icon pack yet.
- **Timer:** Plain text countdown, centered in top bar.
- **Deployment tray:** Horizontal scrollable card row at bottom. Cards are React components (see §4).
- **End screen:** Modal overlay with result text + "Play Again" button. Placeholder rectangle is fine for v1.
- **Typography:** Use a system font stack or a single free font (e.g., Inter, Rubik, or Press Start 2P for pixel aesthetic). Don't load multiple web fonts.
- **Icons (Phase 2):** Source from Kenney UI Pack (CC0) if needed for buttons/indicators. Not needed for v1 — text labels work.

### Sourcing
| Element | Strategy | Source |
|---|---|---|
| HUD layout | **Create** — React/CSS | Code-generated |
| Resource icons | **Create** — SVG or emoji placeholder | Code-generated |
| Typography | **Source** — single free font | Google Fonts (free) |
| Button icons | **Source** — Phase 2 if needed | Kenney UI Pack (CC0) |
| End screen | **Create** — modal overlay | Code-generated |

---

## 6. VFX & Combat Feedback

### What's needed
- Spawn puff / deploy dust
- Melee/ranged hit impact
- Arrow volley trail (if archers exist)
- Wall hit / siege impact (dust + flash)
- **Breach explosion** (hero VFX — smoke, debris, screen shake)
- Unit death/despawn poof
- Front-line clash feedback (dust, sparks, or glow)
- UI feedback (deploy confirm flash, resource gain pulse)

### Concrete recommendations
- **Particle system:** Use `three.quarks` (already in research) or Three.js Points with sprite textures. All VFX are billboard particles — no mesh-based effects for v1.
- **Textures:** Source from **Kenney Smoke Particles** (77 PNGs, CC0) + **Kenney Particle Pack** (80 sprites, CC0) + **Brackeys VFX Bundle** (flipbooks, CC0). These three packs cover every particle shape needed: smoke puffs, flashes, soft glows, dust clouds, explosion frames.
- **Spawn puff:** 3–5 smoke sprites, expand + fade over 0.4s. White/grey tinted to faction color.
- **Hit impact:** Single flash sprite + 2–3 debris particles. Scale to unit size.
- **Wall hit:** Larger dust cloud + stone-colored debris particles + camera micro-shake (2px, 0.1s).
- **Breach explosion:** The biggest VFX moment. Layer: (1) bright flash, (2) expanding smoke cloud, (3) debris shower, (4) dust lingering, (5) screen shake (8px, 0.5s). Spend time here — this sells the game.
- **Death poof:** Quick fade + 2 small smoke sprites. Keep fast, units die in volume.
- **Front-line clash:** Persistent low dust emitter along the front-line zone. Subtle sparks on each combat tick.

### Sourcing
| Element | Strategy | Source |
|---|---|---|
| Smoke/dust textures | **Source** — grab now | Kenney Smoke Particles (CC0) |
| Flash/glow textures | **Source** — grab now | Kenney Particle Pack (CC0) |
| Explosion flipbooks | **Source** — grab now | Brackeys VFX Bundle (CC0) |
| Particle system logic | **Create** — three.quarks or custom | Code-generated |
| Breach hero sequence | **Create** — custom layered effect | Code-generated using sourced textures |
| Screen shake | **Create** — camera offset code | Code-generated |

---

## 7. Asset Priority by Production Phase

### Phase 0 — Graybox Playable (unblocks core loop)

| Category | Assets | Strategy |
|---|---|---|
| Terrain | Flat gradient plane, front-line marker, deploy zones | Create in code |
| Walls | Procedural box mesh × 2, 1 damage state | Create in code |
| Units | Toen's sprites (infantry × 2 factions), tint shader | Source + create |
| HUD | Top bar shell, resource counter, deploy tray | Create in React/CSS |
| Cards | Basic card frame, unit icon, cost badge | Create in React/CSS |
| VFX | Spawn puff, hit flash, death fade | Create + source textures |

**Milestone output:** You can deploy units, watch them fight, see a wall take damage, and read the HUD.

### Phase 1 — First Playable (gameplay reads clearly)

| Category | Assets | Strategy |
|---|---|---|
| Walls | 3 damage states, breach rubble mesh, gate weak point | Create |
| Units | Heavy/elite variant sprite, better faction colors | Source (Toen's) + tint |
| VFX | Wall hit dust, **breach explosion sequence**, front-line dust | Create + source textures |
| HUD | Victory/defeat screen, timer, match status | Create in React/CSS |
| Cards | Hover/select/deploy states, drag feedback | Create in React/CSS |
| Terrain | Background horizon, basic sky color | Create |

**Milestone output:** A complete match loop that reads well and has a satisfying breach moment.

### Phase 2 — Visual Polish (matches mockup direction)

| Category | Assets | Strategy |
|---|---|---|
| Terrain | Decorative props (trees, rocks, tents) | Source (KayKit CC0) |
| Walls | Tower accents, gate arch, themed stone texture | Source (Kenney Castle Kit) + create |
| Units | Larger sprite variants (32×32), more unit types | AI-generate or kitbash |
| HUD | Proper HUD skin, button icons | Create + source (Kenney UI) |
| Cards | Illustrated card skin, rarity accents | Create |
| VFX | Richer breach sequence, arrow trails, ability effects | Create |
| Lighting | Stylized color grading, time-of-day tint | Create |

**Milestone output:** Prototype looks intentional and matches the mockup's composition and mood.

### Phase 3 — Demo Ready (optional, only if needed)

| Category | Assets | Strategy |
|---|---|---|
| Units | Fully custom branded sprites, animation frames | Commission or AI-gen + cleanup |
| Walls | Unique fortress architecture per faction | Create |
| VFX | Cinematic breach camera event, premium particles | Create |
| HUD | Polished UI with transitions, onboarding screens | Create |
| Audio-visual sync | Timed SFX hits with visual beats | Create |

---

## 8. What Must Exist Before Implementation vs What Can Wait

### Must exist before gameplay implementation starts
These are **blocking** — engineers need them to build and test the core loop:

1. **Battlefield ground plane** — even a flat colored rectangle
2. **Wall meshes** — even procedural boxes
3. **Unit sprites** — even Toen's 16×16 pack with tint
4. **Basic HUD shell** — even unstyled React divs
5. **Card template** — even a grey rectangle with text
6. **One hit effect** — even a white flash sprite

Without these six things, gameplay code has nothing to attach to.

### Can wait until gameplay loop is running
These are **non-blocking** — nice to have but won't stop development:

- Damage state textures for walls
- Decorative environment props
- Card illustrations
- Icon polish
- Advanced VFX layering
- End-screen design
- Typography refinement
- Multiple unit type visuals beyond infantry

### Can wait until polish phase
- Faction-specific architecture
- Premium particle effects
- Animated UI transitions
- Full icon sets
- Multiple terrain variants

---

## 9. Asset Download Checklist (Immediate)

These are free, pre-vetted, and should be downloaded now to unblock development:

| Pack | URL | License | Category |
|---|---|---|---|
| Toen's Medieval Strategy v1.0 | [itch.io](https://toen.itch.io/toens-medieval-strategy) | Free w/ attribution | Units |
| Kenney Smoke Particles | [kenney.nl](https://kenney.nl/assets/smoke-particles) | CC0 | VFX |
| Kenney Particle Pack | [kenney.nl](https://kenney.nl/assets/particle-pack) | CC0 | VFX |
| Brackeys VFX Bundle | [itch.io](https://brackeysgames.itch.io/brackeys-vfx-bundle) | CC0 | VFX |
| Kenney Castle Kit | [kenney.nl](https://kenney-assets.itch.io/castle-kit) | CC0 | Walls (Phase 2) |
| KayKit Medieval Hexagon | [itch.io](https://kaylousberg.itch.io/kaykit-medieval-hexagon) | CC0 | Props (Phase 2) |

**Licensing note:** All Kenney/KayKit/Brackeys assets are CC0 — no attribution needed, commercial use OK. Toen's pack requires attribution in credits.

---

## 10. Asset Pipeline for Prototype Phase

### Directory structure
```
src/assets/
  sprites/
    units/          ← Toen's sprites + custom unit sprites
    vfx/            ← Kenney particles + Brackeys flipbooks
  textures/
    terrain/        ← Ground gradients, stone textures
    walls/          ← Wall textures + crack overlays
    ui/             ← Icons, card backgrounds (if any)
  models/
    walls/          ← Kenney Castle Kit GLTFs (Phase 2)
    props/          ← KayKit props (Phase 2)
  audio/            ← SFX (separate concern, not this doc)
```

### Workflow
1. **Download** source packs → drop into `src/assets/` subfolders
2. **Rename** consistently: `unit-infantry-blue.png`, `vfx-smoke-01.png`, etc.
3. **Atlas** unit sprites if using instanced billboards (TextureAtlas or manual packing)
4. **Reference** in code via import paths — Vite handles bundling
5. **Replace** placeholders in-place as better art becomes available (same filenames, swap the files)

### Key principle
**Same filename, better art.** When upgrading from placeholder to final, keep the same asset path so no code changes are needed. Design the asset directory structure for drop-in replacement.

---

## Summary

The Army Royale prototype needs **surprisingly little custom art** to reach first playable. The core strategy:

- **Code-generate** terrain, walls, HUD, cards, and interaction feedback
- **Source** unit sprites (Toen's) and VFX textures (Kenney + Brackeys) immediately
- **Create custom** only the front-line visual, faction tint shader, and breach hero VFX
- **Defer** environment dressing, icon polish, card illustrations, and premium effects to Phase 2+
- **Replace in-place** as art quality improves — never restructure asset paths

The breach moment is the only VFX that deserves early custom investment. Everything else starts placeholder and graduates when gameplay proves out.
