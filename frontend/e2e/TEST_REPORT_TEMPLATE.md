# E2E Test Report
**Generated:** {{timestamp}}
**Total Tests:** {{totalTests}}
**Passed:** {{passed}}
**Failed:** {{failed}}
**Skipped:** {{skipped}}

## Summary by Browser
| Browser | Tests | Passed | Failed | Duration |
|---------|-------|--------|--------|----------|
| Chromium | {{chromiumTotal}} | {{chromiumPassed}} | {{chromiumFailed}} | {{chromiumDuration}} |
| Firefox | {{firefoxTotal}} | {{firefoxPassed}} | {{firefoxFailed}} | {{firefoxDuration}} |
| WebKit | {{webkitTotal}} | {{webkitPassed}} | {{webkitFailed}} | {{webkitDuration}} |

## Test Suites
### ✅ Authentication Tests
- Registration flow
- Login success/failure
- Logout flow
- Session persistence
- Protected route redirect
- Password validation
- Email validation

### ✅ Critical User Journeys
- New player complete flow
- Returning player routine
- Alliance member workflow
- Economy & trading journey
- Faction joining journey

### ✅ Buildings & Resources
- Resource display and updates
- Building construction
- Building upgrades
- Queue management
- Facilities testing

### ✅ Combat & Attacks
- Unit training
- Attack launch
- Defense system
- Battle reports
- Combat mechanics

### ✅ Alliance System
- Creation & management
- Membership operations
- Treasury contributions
- Territory control
- Alliance wars
- Chat & communication

### ✅ Market & Trading
- Market overview
- Buy/sell orders
- Trade routes
- Resource convoys
- Transaction history

### ✅ Factions System
- Faction overview
- Joining factions
- Contributions
- Control zones
- Faction bonuses
- Events & challenges

## Failed Tests
{{#each failedTests}}
### {{name}}
**File:** {{file}}
**Browser:** {{browser}}
**Error:** {{error}}
{{/each}}

## Coverage Highlights
- **Authentication:** 8 scenarios
- **User Journeys:** 5 complete flows
- **Buildings:** 15+ test cases
- **Combat:** 20+ test cases
- **Alliances:** 25+ test cases
- **Market:** 20+ test cases
- **Factions:** 20+ test cases

**Total Coverage:** 130+ E2E test scenarios

## CI/CD Integration
Tests run automatically on:
- Push to `main` or `develop`
- Pull requests
- Manual workflow dispatch

**Matrix:** Chromium, Firefox, WebKit
**Artifacts:** HTML reports, screenshots, videos (on failure)

---
*This is an automated test report. View detailed HTML reports in CI artifacts.*
