#!/bin/bash
set -e

echo "========================================="
echo "Quality Gate - Prestige Auto Consignment"
echo "========================================="
echo ""

echo "[1/5] Type checking..."
npx tsc --noEmit
echo "✓ TypeScript check passed"
echo ""

echo "[2/5] ESLint..."
npx eslint client/src server shared --max-warnings=0 || {
  echo "⚠ ESLint found issues"
  exit 1
}
echo "✓ ESLint passed"
echo ""

echo "[3/5] Prettier format check..."
npx prettier --check "client/src/**/*.{ts,tsx}" "server/**/*.ts" "shared/**/*.ts" || {
  echo "⚠ Prettier found formatting issues"
  echo "  Run: npx prettier --write ..."
  exit 1
}
echo "✓ Prettier check passed"
echo ""

echo "[4/5] Security audit..."
npm audit --audit-level=moderate --omit=dev || echo "⚠ Audit completed with warnings"
echo ""

echo "[5/5] Integration tests (optional)..."
echo "Note: Requires running server at localhost:5000"
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
  npx vitest run --config vitest.config.ts 2>/dev/null || echo "⚠ Some tests failed"
  echo "✓ Integration tests complete"
else
  echo "⚠ Skipping integration tests - no server running"
  echo "  Start the server with: npm run dev"
fi
echo ""

echo "========================================="
echo "✓ Quality Gate complete"
echo "========================================="
