# Starter SpacetimeDB Module

This scaffold is the one official online multiplayer backend companion for the
packaged Mini starter.

Use it when a starter-derived game should support real online multiplayer
through `spacetimedb_transport.js`.

## Intent

- keep the same game-facing `transport.js`, `session.js`, and `starter_scene.js`
- keep local mode available for first boot and offline iteration
- use SpacetimeDB, not a separate ad hoc backend transport, when the user asks
  for multiplayer unless they explicitly ask for local-only multiplayer

## Files

- `package.json`: minimal SpacetimeDB TypeScript module package metadata
- `tsconfig.json`: minimal TypeScript config required by the SpacetimeDB CLI
- `src/index.ts`: starter tables and reducers that match the packaged client
  transport contract

## Suggested Workflow

1. Copy this `spacetimedb_module/` directory into your game project.
2. Keep its reducer/table contract aligned with the packaged `spacetimedb_transport.js`.
3. Adapt gameplay-specific room/player payload contents before renaming reducers or tables.
4. Only change reducer/table names if you are intentionally updating the browser transport and regenerating bindings in the same change.
5. Publish the database with the SpacetimeDB CLI.
6. Generate client bindings into your game folder:

```bash
mkdir -p games/<game-name>/module_bindings
spacetime generate --lang typescript --out-dir games/<game-name>/module_bindings --module-path <path-to-your-module>
```

7. Run the game with `?transport=spacetimedb` or `?transport=online`.

The packaged `spacetimedb_transport.js` expects reducer/table names aligned with
this starter scaffold.
