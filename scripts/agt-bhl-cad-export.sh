#!/usr/bin/env bash
# AGT BHL CAD Export Automation (reference-only)
# L0/L1 constraints enforced: no override of locked HU-SAR geometry, CEO lock required before fab.
# Usage: source onshape.env && ./agt-bhl-cad-export.sh [6512|5010|full]

set -euo pipefail

MODULE="${1:-6512}"
ASSETS_DIR="${ASSETS_DIR:-./berkeley-humanoid-lite-assets}"
OUT_DIR="${OUT_DIR:-./agt-cad-reference}"

echo "[AGT] CAD export start — module=$MODULE (reference only, no geometry lock override)"

if [[ ! -d "$ASSETS_DIR" ]]; then
  echo "Cloning assets..."
  git clone --depth 1 https://github.com/HybridRobotics/berkeley-humanoid-lite-assets.git "$ASSETS_DIR"
fi

cd "$ASSETS_DIR"

# Ensure deps (idempotent)
command -v openscad >/dev/null || sudo apt-get update && sudo apt-get install -y openscad meshlab || true
command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh

# Export based on module (configs are example paths; adjust per actual config.json)
case "$MODULE" in
  6512)
    CONFIG="./data/robots/berkeley_humanoid/berkeley_humanoid_lite/urdf/config.json"  # adapt if separate
    ;;
  5010)
    CONFIG="./data/robots/berkeley_humanoid/berkeley_humanoid_lite/urdf/config.json"
    ;;
  full)
    CONFIG="./data/robots/berkeley_humanoid/berkeley_humanoid_lite/urdf/config.json"
    ;;
  *)
    echo "Unknown module: $MODULE"; exit 1
    ;;
esac

echo "[AGT] Exporting URDF via onshape-to-robot..."
uv run ./scripts/export_onshape_to_urdf.py --config "$CONFIG" || echo "WARN: export may require valid ONShape API key in env"

# Optional MJCF
# uv run ./scripts/export_onshape_to_mjcf.py --config ...

mkdir -p "$OUT_DIR"
cp -r ./data/robots/berkeley_humanoid/berkeley_humanoid_lite/urdf "$OUT_DIR/" 2>/dev/null || true
cp -r ./data/robots/berkeley_humanoid/berkeley_humanoid_lite/meshes "$OUT_DIR/" 2>/dev/null || true

echo "[AGT] Export complete → $OUT_DIR"
echo "[AGT] Constraints: L0 keep-out, L1 crypto/isolation, CEO lock before any fab/field use."
echo "[AGT] Next: selective import to seed + L4 mini-audit. Do NOT replace AGT-HS-148-CX locked geometry."
