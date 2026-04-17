#!/bin/bash
# Assemble deploy-ready dist/ with games + vendored mini-engine + runtime
set -e
rm -rf dist
mkdir -p dist/runtime dist/engine
cp -r games dist/
cp -r runtime/. dist/runtime/
cp node_modules/@lfg/mini-engine/dist/lfg-mini-engine.js dist/engine/
echo "dist ready:"
du -sh dist
ls dist
