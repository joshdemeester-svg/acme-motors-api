# npm Audit Notes

This document tracks known vulnerabilities in dependencies. The quality gate uses `npm audit --audit-level=moderate --omit=dev` in report-only mode.

## Current Vulnerabilities (as of Phase 3)

| Package | Vulnerability | Severity | Advisory |
|---------|--------------|----------|----------|
| `on-headers` | HTTP response header manipulation | Low | [GHSA-76c9-3jph-rj3q](https://github.com/advisories/GHSA-76c9-3jph-rj3q) |
| `express-session` | Depends on vulnerable `on-headers` | Low | (transitive) |
| `preact` | JSON VNode Injection | High | [GHSA-36hm-qxxp-pg3m](https://github.com/advisories/GHSA-36hm-qxxp-pg3m) |
| `qs` | arrayLimit bypass DoS via memory exhaustion | High | [GHSA-6rw7-vpxm-498p](https://github.com/advisories/GHSA-6rw7-vpxm-498p) |
| `body-parser` | Depends on vulnerable `qs` | High | (transitive) |
| `express` | Depends on vulnerable `body-parser` and `qs` | High | (transitive) |

## Recommended Actions

1. **Run `npm audit fix`** to apply available patches
2. **Monitor advisories** for major version updates to `express` that resolve `qs` vulnerability
3. **Review `preact`** usage - may require update when fix is released

## Notes

- Total: 6 vulnerabilities (2 low, 4 high)
- All have fixes available via `npm audit fix`
- No known exploits in production for this application's usage patterns
