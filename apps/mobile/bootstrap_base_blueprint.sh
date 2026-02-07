#!/usr/bin/env bash
set -euo pipefail

# KusinaKonek Mobile - Base Blueprint + Testing Infrastructure bootstrap
# Run from: apps/mobile

echo "==> Creating test + mock directories"
mkdir -p src/__tests__/unit
mkdir -p src/__tests__/components
mkdir -p src/__tests__/integration
mkdir -p src/__mocks__

echo "==> Creating blueprint directories"
mkdir -p src/constants
mkdir -p src/app
mkdir -p src/types

echo "==> (Optional) Install testing dependencies"
# NOTE: Versions may need alignment with Expo SDK / RN version.
# npm install -D jest babel-jest @testing-library/react-native react-test-renderer

echo "==> Done"
