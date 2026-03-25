# Technical Plan

## Target stack
- Three.js
- TypeScript
- Vite
- React for HUD/overlay only
- Zustand for shared UI/game bridge state

## Core architecture
Separate the project into:
1. Simulation layer
2. Rendering layer
3. UI layer

## Important constraints
- One wave = one gameplay entity
- Rendering may show many visible units, but gameplay stays aggregate
- Avoid per-unit RTS simulation complexity in the prototype
- Build toward a first playable before polishing

## First playable target
- Battlefield visible and framed correctly
- Front line moves
- Wall segments can take damage
- Breach can happen
- Basic HUD exists
- Basic deploy and AI loop exist
