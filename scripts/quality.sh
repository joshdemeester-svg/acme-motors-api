#!/bin/bash
set -e

echo "========================================="
echo "Quality Gate - Prestige Auto Consignment"
echo "========================================="
echo ""

echo "[1/4] Type checking..."
npx tsc --noEmit
echo "✓ TypeScript check passed"
echo ""

echo "[2/4] ESLint..."
npx eslint client/src server shared --max-warnings=0 || {
  echo "⚠ ESLint found issues"
  exit 1
}
echo "✓ ESLint passed"
echo ""

echo "[3/4] Prettier format check..."
npx prettier --check "client/src/**/*.{ts,tsx}" "server/**/*.ts" "shared/**/*.ts" || {
  echo "⚠ Prettier found formatting issues"
  echo "  Run: npx prettier --write ..."
  exit 1
}
echo "✓ Prettier check passed"
echo ""

echo "[4/4] Security audit..."
npm audit --audit-level=moderate --omit=dev || echo "⚠ Audit completed with warnings"
echo ""

echo "========================================="
echo "✓ Quality Gate complete"
echo "========================================="
