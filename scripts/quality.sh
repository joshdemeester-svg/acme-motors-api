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

echo "[2/4] Running integration tests..."
npx vitest run --config vitest.config.ts
echo "✓ Integration tests passed"
echo ""

echo "[3/4] Running E2E tests..."
npx playwright test --reporter=list
echo "✓ E2E tests passed"
echo ""

echo "[4/4] Security audit..."
npm audit --omit=dev || echo "⚠ Audit completed with warnings"
echo ""

echo "========================================="
echo "✓ Quality Gate PASSED"
echo "========================================="
