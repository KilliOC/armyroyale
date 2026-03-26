# Audio Integration

## Current state

- All current SFX assets were generated with ElevenLabs Sound Effects API.
- Generated files live in `src/assets/audio/generated/elevenlabs/`.
- Runtime integration lives in `src/audio/index.ts`.
- Main event wiring lives in:
  - `src/App.tsx`
  - `src/game/orchestrator.ts`
  - `src/ui/ResultScreen.tsx`

## Generated assets

Current batch includes 30 assets:

- March loops
- Clash / impact / unit-specific combat hits
- Death / hit feedback
- Wall / breach sequence sounds
- Deploy / elixir / phase / result UI sounds
- Ambience loops

Source prompts are tracked in `scripts/elevenlabs_sfx_manifest.json`.

## Generation script

Use:

```powershell
$env:ELEVENLABS_API_KEY='...'
python scripts\generate_elevenlabs_sfx.py --force
```

Targeted regeneration:

```powershell
$env:ELEVENLABS_API_KEY='...'
python scripts\generate_elevenlabs_sfx.py --force --only clash_hit_small cavalry_charge_impact
```

The script now supports `output_format` in manifest entries if a later pass wants PCM or a different codec from ElevenLabs.

## Volume analysis

- Technical level report is stored in `scripts/audio_level_report.json`.
- Report is based on decoded MP3 analysis with `soundfile` + `numpy`.
- Runtime playback volumes were tuned from that report rather than destructively rewriting source files.

## Current wiring

- Lobby start button unlocks audio.
- Deployment plays deploy SFX and ranged release cue where relevant.
- Battle loops update based on phase and active unit counts.
- Combat events trigger category-aware hit SFX.
- Wall damage triggers stone/crack effects.
- Breach triggers gate break, boom, and rubble sequence.
- Results trigger victory/defeat sting plus chest sparkle.

## Notes for next pass

- The most sensitive files are `clash_hit_small`, `cavalry_charge_impact`, `infantry_heavy_melee_hit`, and `shield_blunt_impact_variant`; these were regenerated once already in a final-pass prompt tweak.
- If another refinement pass is needed, regenerate only problem assets instead of the full batch.
- If browser payload becomes a concern, consider a later pipeline for external streaming, lazy-loading, or codec conversion.
