# QA Fix Request — ZAP-036

**Story:** ZAP-036 — GroupMonitorService worker tests
**Gate Decision:** CONCERNS
**Assigned to:** @dev (Dex)
**Date:** 2026-02-26
**Priority:** HIGH (blocks story completion)

---

## Summary

ZAP-036 requires comprehensive test coverage including integration tests, load tests, and code coverage verification (>=80%). Current implementation has solid unit tests (14 tests, all passing) but is missing integration and load tests, plus cannot verify coverage due to missing dependency.

---

## Issues Found

### Issue #1: Missing Integration Tests (MUST-FIX)

**AC Affected:** AC-036.5 (Integration test: full message flow)

**What's needed:**

Create `apps/api/src/integration/monitored-groups.integration.test.ts` with:

```typescript
// Structure template:
describe('MonitoredGroups Integration', () => {
  beforeAll(async () => {
    // Setup test database + queue
    // Seed test data (tenant, connection, group)
  })

  test('AC-036.5: Full message capture flow', async () => {
    // 1. Create monitored group in database
    // 2. Send Evolution webhook message
    // 3. Verify GroupMonitorService processes it
    // 4. Verify job added to offerParserQueue
    // 5. Verify job payload is correct
    // 6. Verify group.message_count incremented
    // 7. Verify group.last_message_at updated
  })

  test('webhook routing to GroupMonitorService', async () => {
    // 1. Send webhook for monitored group
    // 2. Verify routed to GroupMonitorService (not BroadcastWorker)
    // 3. Verify message enqueued
  })

  afterAll(async () => {
    // Cleanup test data
  })
})
```

**Acceptance:** Test file exists, all integration tests PASS

---

### Issue #2: Missing Tenant Isolation Tests (SHOULD-FIX)

**AC Affected:** AC-036.4 (Tenant isolation tests)

**Current state:** RLS policies handle tenant isolation, but tests don't explicitly verify it.

**Add to `group-monitor.service.test.ts`:**

```typescript
describe('AC-036.4: Tenant Isolation', () => {
  test('Tenant A groups isolated from Tenant B', async () => {
    // Setup: Create same group_jid for different tenants
    // Send message for Tenant A's group
    // Verify Tenant A's group incremented
    // Verify Tenant B's group NOT affected
  })

  test('Cross-tenant leakage prevented', async () => {
    // Setup: Tenant A's webhook arrives
    // Tenant A's monitored_groups query returns only Tenant A groups
    // Verify no Tenant B groups visible
  })
})
```

**Acceptance:** 2 new tests added, both PASS

---

### Issue #3: Missing Load Test (NICE-TO-HAVE)

**AC Affected:** AC-036.6 (Load test: 100 messages/second)

**What's needed:**

Create `apps/api/src/load-tests/group-monitor.load.ts`:

```typescript
// Load test template:
// - Setup 10 monitored groups
// - Send 100 messages/sec for 10 seconds (1000 total)
// - Verify all captured (0 dropped)
// - Verify latency <100ms per message
// - Verify queue clears within 5s
```

**How to run:** `npm run test:load -- group-monitor`

**Acceptance:** Load test script exists, reports all metrics

---

### Issue #4: Missing Dependency & Coverage Verification (MUST-FIX)

**AC Affected:** AC-036.8 (Code coverage >=80%)

**Problem:** `@vitest/coverage-v8` not installed

**Solution:**

```bash
# 1. Install coverage package
npm install -D @vitest/coverage-v8

# 2. Verify coverage
npm test -- -- --coverage

# 3. Expected output:
# Lines: 80%+
# Functions: 80%+
# Branches: 75%+
# Statements: 80%+
```

**Acceptance:** Coverage report shows all metrics >=80%

---

### Issue #5: Missing Edge Case Tests (SHOULD-FIX)

**AC Affected:** AC-036.7 (Edge case tests)

**Current tests cover:** image/video/audio messages ✅

**Missing tests to add:**

```typescript
describe('AC-036.7: Edge Cases', () => {
  test('Handles null/undefined message text', async () => {
    // Message with null text field
    // Verify skipped gracefully
  })

  test('Handles empty string message', async () => {
    // Message with empty string ("")
    // Verify treated as non-text, skipped
  })

  test('Handles very long message (>1000 chars)', async () => {
    // Message with 5000 character text
    // Verify captured and enqueued without truncation
  })

  test('Handles special characters', async () => {
    // Message with @#$%^&* symbols
    // Verify captured correctly
  })

  test('Handles unicode/emoji', async () => {
    // Message: "🎉 Shopee: iPhone 👍"
    // Verify stored with proper encoding
  })

  test('Handles multiple rapid messages from same sender', async () => {
    // Send 5 messages rapidly from same sender
    // Verify all captured with different IDs
  })
})
```

**Acceptance:** 6 new tests added, all PASS

---

## Summary of Changes Required

| Issue | Type | File(s) | Effort | Blocker |
|-------|------|---------|--------|---------|
| #1: Integration tests | NEW | `apps/api/src/integration/monitored-groups.integration.test.ts` | 2h | ✅ YES |
| #2: Tenant isolation tests | UPDATE | `apps/api/src/services/group-monitor.service.test.ts` | 30m | ⚠️ SHOULD |
| #3: Load tests | NEW | `apps/api/src/load-tests/group-monitor.load.ts` | 1h | ❌ NO |
| #4: Coverage setup + verification | INSTALL + RUN | `package.json`, coverage report | 15m | ✅ YES |
| #5: Edge case tests | UPDATE | `apps/api/src/services/group-monitor.service.test.ts` | 1h | ⚠️ SHOULD |

---

## Acceptance Criteria for Fix

- [ ] Integration test file created with full message flow test
- [ ] All integration tests PASS (`npm test`)
- [ ] Tenant isolation tests added and PASS
- [ ] Coverage tool installed and working
- [ ] Coverage report shows >=80% for group-monitor.service.ts
- [ ] Edge case tests added and PASS
- [ ] Load test script created (optional but recommended)
- [ ] All 36 tests PASS (existing 14 + new integration + new isolation + new edge cases)
- [ ] TypeScript compiles cleanly
- [ ] No console errors/warnings

---

## How to Proceed

1. **@dev** implements fixes in priority order:
   - Priority 1: #1 + #4 (blockers for story completion)
   - Priority 2: #2 + #5 (improves coverage quality)
   - Priority 3: #3 (nice-to-have load test)

2. **@dev** runs: `npm test` to verify all tests pass

3. **@dev** submits for re-review when complete

4. **@qa** verifies fixes and provides final gate decision (PASS/FAIL)

---

## Questions?

Contact @qa (Quinn) for clarification on any requirement.

---

**Generated by:** @qa (Quinn)
**Gate Status:** CONCERNS (awaiting fixes)
**Next Review:** After @dev submits fixes
