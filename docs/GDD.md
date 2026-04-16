# Army Royale — Game Design Document

## Core concept

Army Royale is a real-time 1v1 battle game where two players command animal armies on a 3-lane battlefield. The goal is to breach the opposing fortress wall. Built on the LFG Mini Engine SDK.

## Game loop

1. **Deploy**: Drag cards from your hand onto the battlefield (left half = your deploy zone)
2. **Fight**: Units march forward, engage enemies, and attack the enemy wall
3. **Win**: Destroy the enemy wall HP or have more HP when time runs out

## Cards and factions

Four animal factions, each with a distinct combat role:

- **Monkey** (cost 3, melee) — 20 banana-sword brawlers, fast march speed, moderate damage
- **Hamster** (cost 3, ranged) — 14 chonky acorn-bombers, attack from 14-unit range
- **Frog** (cost 4, breaker) — 8 tank toads, high HP (24), devastating wall damage (2x multiplier)
- **Duckling** (cost 2, rush) — 24 tiny ducklings, cheap swarm with fast attack cooldown

## Battlefield layout

- 3 lanes: Top (z=12), Mid (z=0), Bot (z=-12)
- Blue wall at x=-28, Red wall at x=28
- Deploy zone: left half (wall to center line)
- Decorative: trees, bushes, rocks for visual framing

## Economy

- Starting elixir: 5 (max 10)
- Regen: 0.4/sec normal, 0.8/sec overtime (last 60s)
- Match duration: 150 seconds

## AI opponent

- Has own elixir pool (same regen rates)
- Reacts to player pressure (50% chance to reinforce the most-pressured lane)
- Deploys every 3.5-6.5 seconds
- Spawns 65% of normal unit count per card

## Visual design

- Procedural runtime meshes for all characters (no imported character models for units)
- Each animal has a unique silhouette: Monkey (round + ears + banana sword), Hamster (chonky + cheeks), Frog (wide flat + bulging eyes), Duckling (small round + beak)
- Team colors via band rings on each unit
- Walls with battlements, corner towers, gate arches
- VFX: impact dust clouds, projectile arcs, deploy flash rings, death animations
- 3/4 isometric camera (Clash Royale style)

## Win conditions

- Wall breach: reduce enemy wall HP to 0
- Timeout: player with more wall HP remaining wins
- Draw: equal wall HP at time-out

## Future directions

- SpacetimeDB multiplayer (transport layer scaffolded)
- GLB asset models for units (assets/ folder has 8 animal GLBs ready)
- Sound effects
- More card types and faction variety
