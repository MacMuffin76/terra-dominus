# E2E Test Suite Documentation

## Overview
Comprehensive Playwright E2E test suite covering all major Terra Dominus features.

## Test Coverage (130+ scenarios)

### 1. Authentication Tests (`auth.spec.js`)
- ✅ User registration with validation
- ✅ Login success/failure flows
- ✅ Logout and session clearing
- ✅ Session persistence after reload
- ✅ Protected route redirect
- ✅ Password validation rules
- ✅ Email validation rules

**Coverage:** 8 test scenarios

---

### 2. Critical User Journeys (`critical-journeys.spec.js`)
Complete end-to-end flows simulating real user behavior:

#### New Player Journey
1. Register account
2. View dashboard
3. Build first structure
4. Train initial units
5. Launch first attack

#### Returning Player Routine
1. Login
2. Check resources
3. Collect production
4. Queue building upgrade
5. Send attack

#### Alliance Member Flow
1. View alliance details
2. Access treasury
3. Chat with members

#### Economy & Trading Journey
1. Browse market
2. Place buy/sell orders
3. Establish trade routes

#### Faction System Journey
1. View available factions
2. Join a faction
3. Check faction bonuses

**Coverage:** 5 complete user flows

---

### 3. Buildings & Resources (`buildings-resources.spec.js`)

#### Resource Management
- ✅ Display resource levels
- ✅ Auto-update resources
- ✅ Show storage capacity
- ✅ Resource production rates

#### Building Construction
- ✅ List available buildings
- ✅ Show construction requirements
- ✅ Start building construction
- ✅ Queue multiple buildings
- ✅ Cancel construction
- ✅ Speed up construction

#### Building Upgrades
- ✅ Display building levels
- ✅ Calculate upgrade time
- ✅ Prevent upgrade with insufficient resources
- ✅ Unlock new buildings

#### Facilities
- ✅ Research lab functionality
- ✅ Defense structure placement

#### Production Optimization
- ✅ Production rates per hour
- ✅ Total production display
- ✅ Faction bonus application

**Coverage:** 15+ test scenarios

---

### 4. Combat & Attacks (`combat-attacks.spec.js`)

#### Unit Training
- ✅ Display available unit types
- ✅ Show unit stats and costs
- ✅ Train units with valid quantity
- ✅ Reject invalid quantities
- ✅ Display training queue
- ✅ Cancel training

#### Attack Launch
- ✅ Navigate to combat page
- ✅ Select target from world map
- ✅ Configure attack with unit selection
- ✅ Calculate travel time
- ✅ Prevent attack with zero units
- ✅ Show outgoing attacks

#### Defense System
- ✅ Display incoming attacks
- ✅ Show defensive buildings status
- ✅ Display garrison units
- ✅ Allow unit retreat/evacuation

#### Battle Reports
- ✅ List battle reports
- ✅ Display battle details
- ✅ Show loot from victories
- ✅ Filter reports by type
- ✅ Delete old reports

#### Combat Mechanics
- ✅ Apply unit type advantages
- ✅ Show protection shield status
- ✅ Enforce attack cooldown

**Coverage:** 20+ test scenarios

---

### 5. Alliance System (`alliance.spec.js`)

#### Creation & Management
- ✅ Navigate to alliance creation
- ✅ Create new alliance
- ✅ Reject invalid data
- ✅ Display alliance details
- ✅ Show member list
- ✅ Change alliance settings

#### Membership
- ✅ Join alliance
- ✅ Accept member applications
- ✅ Reject applications
- ✅ Leave alliance
- ✅ Promote members
- ✅ Kick members

#### Treasury
- ✅ Display treasury balance
- ✅ Contribute resources
- ✅ Display contribution history
- ✅ Withdraw resources (officers)
- ✅ Show top contributors

#### Territory
- ✅ Display controlled zones
- ✅ Show zone control points
- ✅ Display territory bonuses
- ✅ Claim new territory

#### Wars
- ✅ Display active wars
- ✅ Declare war
- ✅ Show war statistics
- ✅ Display war objectives
- ✅ Propose peace treaty

#### Communication
- ✅ Display alliance chat
- ✅ Send messages
- ✅ Real-time socket messages
- ✅ @mention members
- ✅ Send alliance-wide mail

**Coverage:** 25+ test scenarios

---

### 6. Market & Trading (`market-trading.spec.js`)

#### Market Overview
- ✅ Navigate to market
- ✅ Display resource prices
- ✅ Show buy/sell orders
- ✅ Display market trends
- ✅ Filter orders by resource

#### Buy Orders
- ✅ Place buy order
- ✅ Reject order with insufficient gold
- ✅ Display active buy orders
- ✅ Cancel buy order
- ✅ Instant buy from sell order

#### Sell Orders
- ✅ Place sell order
- ✅ Reject order with insufficient resources
- ✅ Display active sell orders
- ✅ Cancel sell order
- ✅ Instant sell to buy order

#### Trade Routes
- ✅ Navigate to trade routes
- ✅ Create new route
- ✅ Display active routes
- ✅ Show route status/progress
- ✅ Cancel trade route
- ✅ Show incoming routes

#### Resource Convoys
- ✅ Send convoy to player
- ✅ Display outgoing convoys
- ✅ Show convoy travel time
- ✅ Recall convoy
- ✅ Display incoming convoys
- ✅ Auto-receive convoy resources

#### History & Statistics
- ✅ Display transaction history
- ✅ Show completed orders
- ✅ Display profit/loss
- ✅ Filter history by date
- ✅ Show market volume stats
- ✅ Display average prices

**Coverage:** 20+ test scenarios

---

### 7. Factions System (`factions.spec.js`)

#### Faction Overview
- ✅ Navigate to factions page
- ✅ Display all three factions (Terran, Nomad, Syndicate)
- ✅ Show faction descriptions/bonuses
- ✅ Display member counts
- ✅ Show control zone counts

#### Joining Factions
- ✅ Join Terran faction
- ✅ Join Nomad faction
- ✅ Join Syndicate faction
- ✅ Prevent joining multiple factions
- ✅ Display faction in profile

#### Contributions
- ✅ Display contribution interface
- ✅ Contribute resources
- ✅ Display personal contribution total
- ✅ Show faction-wide total
- ✅ Display contribution leaderboard
- ✅ Award contribution points

#### Control Zones & Territory
- ✅ Display zones on world map
- ✅ Show faction controlling each zone
- ✅ Display zone control percentages
- ✅ Show contested zones
- ✅ Display capture requirements
- ✅ Contribute to zone control

#### Faction Bonuses
- ✅ Display active bonuses
- ✅ Show Terran economic bonuses
- ✅ Show Nomad mobility bonuses
- ✅ Show Syndicate combat bonuses
- ✅ Apply bonuses to production
- ✅ Apply bonuses to training
- ✅ Show bonuses from controlled zones

#### Switching & Penalties
- ✅ Leave current faction
- ✅ Enforce rejoin cooldown
- ✅ Apply leaving penalties

#### Events & Challenges
- ✅ Display faction events
- ✅ Show faction competitions
- ✅ Display leaderboard rankings
- ✅ Show event rewards

**Coverage:** 20+ test scenarios

---

## Running Tests

### Local Development
```bash
# Run all tests
npm run test:e2e

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View last report
npm run test:e2e:report
```

### CI/CD
Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Browser Matrix:** Chromium, Firefox, WebKit

**Artifacts:**
- HTML test reports (14 days retention)
- Screenshots on failure (7 days retention)
- Videos on failure (7 days retention)

---

## Test Structure

### Helper Functions
Each test file includes authentication helpers:
```javascript
async function authenticatedPage(page, username = 'e2e_user') {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}
```

### Flexible Selectors
Tests use resilient selectors:
- Text content matching (i18n-friendly)
- ARIA roles and labels
- Data attributes
- CSS classes (last resort)

### Timeouts & Retries
- **Test timeout:** 30 seconds
- **Expect timeout:** 5 seconds
- **Retries on CI:** 2 attempts
- **Screenshots/videos:** On failure only

---

## Configuration

### `playwright.config.js`
```javascript
{
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: ['chromium', 'firefox', 'webkit']
}
```

---

## Best Practices

### ✅ Do
- Use `await expect()` for assertions
- Wait for elements with proper timeouts
- Use flexible text-based selectors
- Test critical user paths first
- Clean up test data after runs
- Use unique usernames (timestamps)

### ❌ Don't
- Use hard-coded waits (`page.waitForTimeout()`)
- Rely on CSS selectors that may change
- Test non-critical edge cases first
- Leave test data in database
- Use same test user across tests

---

## Debugging Tips

### Run Single Test
```bash
npx playwright test auth.spec.js
```

### Run Single Test in UI Mode
```bash
npx playwright test auth.spec.js --ui
```

### Debug Specific Test
```bash
npx playwright test --debug -g "should login successfully"
```

### View Trace
```bash
npx playwright show-trace trace.zip
```

### Check Selectors
Use Playwright Inspector:
```bash
npx playwright codegen http://127.0.0.1:3000
```

---

## Maintenance

### Adding New Tests
1. Create new `.spec.js` file in `frontend/e2e/`
2. Import Playwright test utilities
3. Add authentication helper if needed
4. Group related tests with `test.describe()`
5. Use flexible selectors
6. Run locally before pushing

### Updating Existing Tests
1. Check if selector changes needed
2. Verify timeout values
3. Update expected outcomes
4. Run full suite to catch regressions
5. Update documentation

---

## Performance Metrics

### Target Benchmarks
- **Total suite duration:** < 20 minutes (all browsers)
- **Single browser:** < 7 minutes
- **Test timeout:** 30 seconds max
- **Network idle:** 2 seconds max

### Current Coverage
- **Test Files:** 7
- **Test Scenarios:** 130+
- **Lines of Test Code:** ~2000
- **Browser Coverage:** 3 (Chromium, Firefox, WebKit)

---

## CI/CD Integration

### GitHub Actions Workflow
`.github/workflows/e2e-tests.yml`

**Trigger Events:**
- Push (main, develop)
- Pull request (main, develop)
- Manual dispatch

**Jobs:**
1. Setup (Node.js, dependencies, database)
2. Start backend server
3. Build & serve frontend
4. Run E2E tests (matrix: 3 browsers)
5. Upload artifacts (reports, screenshots, videos)
6. Generate summary

**Services:**
- PostgreSQL 16 (test database)

---

## Known Limitations

### Frontend-Only Tests
These tests assume backend APIs are working. For API testing, see backend Jest tests.

### Test Data Cleanup
Some tests create database records. Clean test database periodically:
```sql
DELETE FROM users WHERE username LIKE 'e2e_%';
```

### Race Conditions
WebKit may have timing issues with socket connections. Retries are configured.

### Mobile Testing
Mobile viewports commented out in config. Enable for mobile-specific testing.

---

## Future Improvements

### Phase 3 Enhancements
- [ ] Add visual regression testing
- [ ] Implement accessibility testing
- [ ] Add performance profiling
- [ ] Create test data fixtures
- [ ] Add API mocking for isolated tests

### Phase 4 Enhancements
- [ ] Mobile viewport testing
- [ ] Cross-browser screenshot comparison
- [ ] Load testing integration
- [ ] Security testing automation
- [ ] Test coverage metrics dashboard

---

## Support

### Documentation
- Playwright: https://playwright.dev/
- Terra Dominus Docs: `/docs/`

### Troubleshooting
1. Check test logs in CI artifacts
2. Review screenshots/videos on failures
3. Run locally with `--debug` flag
4. Verify backend is running on port 5000
5. Check database connection

---

**Last Updated:** Phase 3 - Tests E2E Playwright Complete
**Maintained By:** Development Team
**Version:** 1.0.0
