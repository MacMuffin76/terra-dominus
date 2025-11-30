# Quest System Integration - Test Plan
**Date:** November 30, 2025  
**Status:** Testing Phase  
**Phase:** 3 (68% Complete)

## Overview
The Portal Quest system has been integrated into the Portals page UI. This document provides a comprehensive test plan to validate the integration.

## Integration Summary

### Components Created
1. **PortalQuestPanel.jsx** (340 lines)
   - Location: `frontend/src/components/portals/PortalQuestPanel.jsx`
   - Features: 4 sub-tabs (Active, Available, Daily, Campaign), quest cards, progress tracking
   
2. **PortalQuestPanel.css** (589 lines)
   - Location: `frontend/src/components/portals/PortalQuestPanel.css`
   - Theme: Dark cyber matching Portals.css

3. **Portals.jsx** (Modified)
   - Added 6th tab: "📜 Quêtes"
   - Conditional rendering of PortalQuestPanel

## Backend Verification

### API Endpoints (13 total)
```
GET  /api/v1/portal-quests/available     - Get available quests
GET  /api/v1/portal-quests/daily         - Get daily quests
GET  /api/v1/portal-quests/story         - Get story progress
POST /api/v1/portal-quests/:id/accept    - Accept a quest
POST /api/v1/portal-quests/:id/abandon   - Abandon a quest
POST /api/v1/portal-quests/:id/claim     - Claim rewards
GET  /api/v1/portal-quests/user/active   - Get active quests
GET  /api/v1/portal-quests/user/stats    - Get quest statistics
GET  /api/v1/portal-quests/unlocks       - Get quest unlocks
GET  /api/v1/portal-quests/unlocks/check - Check unlock eligibility
GET  /api/v1/portal-quests/streak        - Get streak info
POST /api/v1/portal-quests/admin/rotate-daily - Admin: rotate daily quests
POST /api/v1/portal-quests/progress      - Update quest progress
```

### Database Tables (5 total)
- `portal_quests` - Master quest definitions
- `user_quests` - Player progress tracking
- `user_quest_unlocks` - Content unlocks
- `daily_quest_rotation` - Daily quest management
- `quest_streaks` - Streak tracking

## Frontend Test Scenarios

### Test 1: Navigation & Display
**Objective:** Verify quest tab appears and panel loads

**Steps:**
1. Launch application (http://localhost:3000)
2. Login with test account
3. Navigate to Portals page (`/portals`)
4. Click "📜 Quêtes" tab

**Expected Results:**
- ✅ Quest tab button visible after "👥 Alliance Raids"
- ✅ Tab changes to active state (cyan highlight)
- ✅ PortalQuestPanel component renders
- ✅ Default sub-tab shows (Active quests)
- ✅ Loading spinner appears briefly
- ✅ No console errors

**Screenshot:** Capture initial quest panel view

---

### Test 2: Sub-Tab Navigation
**Objective:** Verify all 4 sub-tabs work correctly

**Steps:**
1. From quest panel, click each sub-tab:
   - "En cours" (Active)
   - "Disponibles" (Available)
   - "Quotidiennes" (Daily)
   - "Campagne" (Campaign)

**Expected Results:**
- ✅ Each tab highlights when selected
- ✅ Content changes per tab
- ✅ Different API calls per tab (check Network tab)
- ✅ No errors in console

**API Calls Expected:**
- Active → `/api/v1/portal-quests/user/active`
- Available → `/api/v1/portal-quests/available`
- Daily → `/api/v1/portal-quests/daily`
- Campaign → `/api/v1/portal-quests/story`

---

### Test 3: Quest Card Display
**Objective:** Verify quest cards render with correct information

**Steps:**
1. Navigate to "Disponibles" tab
2. Inspect quest card elements

**Expected Results:**
- ✅ Quest type badge displays (Tutorial/Daily/Weekly/Campaign/Achievement)
- ✅ Badge color matches type:
  - Tutorial: #00D9FF (cyan)
  - Daily: #FFD700 (gold)
  - Weekly: #9933FF (purple)
  - Campaign: #FF6B35 (orange)
  - Achievement: #00FF00 (green)
- ✅ Difficulty stars show (⭐)
- ✅ Quest title in cyan
- ✅ Description in gray
- ✅ Objectives listed with progress bars
- ✅ Rewards displayed (gold, XP, items)
- ✅ "Accepter" button visible

**Screenshot:** Capture quest card details

---

### Test 4: Accept Quest Flow
**Objective:** Verify quest acceptance works

**Steps:**
1. Navigate to "Disponibles" tab
2. Select a quest (e.g., "First Portal Challenge")
3. Click "Accepter" button
4. Wait for response

**Expected Results:**
- ✅ API POST to `/api/v1/portal-quests/:id/accept`
- ✅ Success alert shows
- ✅ Quest disappears from Available tab
- ✅ Quest appears in "En cours" (Active) tab
- ✅ Progress shows as 0% initially

**Browser Console Check:**
```javascript
// Should see:
Accepting quest: {questId}
Quest accepted successfully
```

---

### Test 5: Quest Progress Display
**Objective:** Verify progress tracking displays correctly

**Steps:**
1. Navigate to "En cours" tab
2. View an active quest with objectives

**Expected Results:**
- ✅ Overall progress percentage shown
- ✅ Progress bar fills correctly (e.g., 33% for 1/3 objectives)
- ✅ Each objective shows individual progress bar
- ✅ Objective text shows current/target (e.g., "1/3")
- ✅ Progress bars have gradient fill (#00D9FF)
- ✅ Completed objectives show 100%

**Example Quest:**
```
Quest: "Portal Master"
Objectives:
- Complete 3 portals [■■□] 66% (2/3)
- Defeat 1 boss [□□□] 0% (0/1)
Overall: 33%
```

---

### Test 6: Complete Quest & Claim Rewards
**Objective:** Verify reward claiming works

**Steps:**
1. Complete quest objectives (e.g., finish 3 portal battles)
2. Navigate to "En cours" tab
3. Locate completed quest (100% progress)
4. Click "Réclamer" button

**Expected Results:**
- ✅ API POST to `/api/v1/portal-quests/:id/claim`
- ✅ Success message shows rewards gained
- ✅ Quest marked as completed
- ✅ Quest moves to completed badge state
- ✅ Resources/XP added to account

**Alert Example:**
```
Récompenses réclamées !
+500 XP, +1000 Gold
```

---

### Test 7: Daily Quests Tab
**Objective:** Verify daily quest rotation system

**Steps:**
1. Navigate to "Quotidiennes" tab

**Expected Results:**
- ✅ Header shows "Quêtes Quotidiennes"
- ✅ Subtext: "3 nouvelles quêtes chaque jour"
- ✅ Exactly 3 daily quests displayed
- ✅ All quests have "Daily" badge (gold)
- ✅ Quests can be accepted
- ✅ API call: `/api/v1/portal-quests/daily`

---

### Test 8: Campaign Tab & Chapter Progress
**Objective:** Verify story campaign display

**Steps:**
1. Navigate to "Campagne" tab

**Expected Results:**
- ✅ Campaign header shows current chapter
- ✅ Chapter progress bar displays (e.g., "3/5 quests")
- ✅ "Next Quest" section highlights upcoming quest
- ✅ "All Story Quests" lists all campaign quests
- ✅ Completed quests show green checkmark
- ✅ Locked quests show lock icon
- ✅ Campaign quests have orange badges

**Chapter Structure Example:**
```
Chapter 1: The First Portal
Progress: ████░░░░ 50% (3/6)

Next Quest:
🔥 Defeat the Portal Guardian

All Story Quests:
✅ Enter Your First Portal
✅ Basic Combat Training
✅ Resource Gathering 101
🔒 Defeat the Portal Guardian (Locked)
🔒 Master Tier Progression (Locked)
```

---

### Test 9: Quest Detail Modal
**Objective:** Verify modal opens with full quest details

**Steps:**
1. Click on any quest card
2. Inspect modal content

**Expected Results:**
- ✅ Modal overlay appears with backdrop blur
- ✅ Quest title in large font (28px, cyan)
- ✅ Full description visible
- ✅ All objectives listed
- ✅ All rewards listed
- ✅ Close button (×) in top-right
- ✅ Click outside modal closes it
- ✅ Click × closes modal

---

### Test 10: Responsive Design (Mobile)
**Objective:** Verify mobile-friendly layout

**Steps:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12 Pro)
4. Navigate through quest tabs

**Expected Results:**
- ✅ Tabs scroll horizontally on small screens
- ✅ Quest cards stack vertically (1 column)
- ✅ Buttons stack vertically in quest actions
- ✅ Text remains readable
- ✅ No horizontal overflow
- ✅ Touch-friendly tap targets

---

### Test 11: Quest Progress Integration with Portal Battles
**Objective:** Verify quest progress updates after portal battles

**Steps:**
1. Accept quest: "Complete 3 portals"
2. Navigate to "Portails" tab
3. Complete a portal battle (victory)
4. Return to "Quêtes" > "En cours" tab
5. Check quest progress

**Expected Results:**
- ✅ Quest progress increments (0/3 → 1/3)
- ✅ Progress bar updates visually
- ✅ Overall percentage increases (0% → 33%)
- ✅ After 3 completions, quest shows "Réclamer" button

**Backend Hook Check:**
```javascript
// In portalController.js or combatController.js
// After portal victory:
await portalQuestService.updateQuestProgress(userId, 'complete_portals', 1);
```

---

### Test 12: Error Handling
**Objective:** Verify graceful error handling

**Test Cases:**
1. **Network Error**
   - Disconnect internet
   - Try loading quests
   - Expected: Error message "Failed to load quests"
   
2. **Invalid Quest ID**
   - Manually trigger accept with bad ID
   - Expected: Error alert

3. **Already Accepted Quest**
   - Try accepting same quest twice
   - Expected: "Quest already accepted" message

4. **Insufficient Requirements**
   - Try accepting locked campaign quest
   - Expected: "Requirements not met" error

---

## Performance Tests

### Test 13: Load Time
**Objective:** Verify acceptable load performance

**Steps:**
1. Open Chrome DevTools > Network tab
2. Navigate to quest tab
3. Measure API response time

**Expected Results:**
- ✅ API response < 500ms
- ✅ Component renders < 1s
- ✅ No memory leaks (check Performance tab)

---

### Test 14: Animation Performance
**Objective:** Verify smooth animations

**Steps:**
1. Navigate between tabs rapidly
2. Hover over quest cards
3. Open/close modal

**Expected Results:**
- ✅ Tab transitions smooth (60fps)
- ✅ Hover effects instant
- ✅ Progress bar animations smooth
- ✅ Modal fade-in/out smooth

---

## Browser Compatibility

### Test 15: Cross-Browser Testing
**Browsers to Test:**
- ✅ Chrome/Edge (Chromium) - Latest
- ✅ Firefox - Latest
- ✅ Safari - Latest (macOS)

**Check:**
- Layout consistency
- CSS gradients render correctly
- Backdrop-filter (blur) works
- All interactions functional

---

## Security Tests

### Test 16: Authorization
**Objective:** Verify protected endpoints

**Steps:**
1. Logout from application
2. Try accessing `/api/v1/portal-quests/available` directly

**Expected Results:**
- ✅ 401 Unauthorized response
- ✅ Frontend shows login prompt
- ✅ No quest data leaked

---

## Database Verification

### Test 17: Data Persistence
**Objective:** Verify data saves correctly

**Steps:**
1. Accept a quest
2. Make progress on objectives
3. Refresh page
4. Check quest still shows progress

**Expected Results:**
- ✅ Accepted quest persists in `user_quests` table
- ✅ Progress saved correctly
- ✅ No duplicate entries created

**SQL Check:**
```sql
SELECT * FROM user_quests WHERE user_id = {testUserId};
SELECT * FROM quest_streaks WHERE user_id = {testUserId};
```

---

## Regression Tests

### Test 18: Portal Tab Functionality
**Objective:** Verify adding quest tab didn't break existing portal tabs

**Steps:**
1. Test all original tabs still work:
   - Portails (list view)
   - Maîtrise (mastery)
   - Historique (history)
   - 🐉 Boss Battles
   - 👥 Alliance Raids

**Expected Results:**
- ✅ All tabs still functional
- ✅ No visual regressions
- ✅ Filters work in Portails tab
- ✅ Portal battles still launchable

---

## Known Issues & Limitations

### Current Limitations:
1. **Quest Progress Updates:** May require manual refresh after portal battle
   - **Fix Planned:** WebSocket integration for real-time updates
   
2. **Quest Notifications:** No toast notifications yet
   - **Fix Planned:** Integrate QuestNotification.jsx component

3. **Quest Tracker Overlay:** Not visible during battles
   - **Fix Planned:** Integrate QuestTracker.jsx in battle UI

---

## Next Steps (After Testing)

### Priority 1: Quest Progress Automation
- [ ] Hook portal battle completion to quest progress
- [ ] Add real-time WebSocket updates
- [ ] Auto-refresh quest list after objectives completed

### Priority 2: UX Enhancements
- [ ] Add sound effects (quest accept, complete, reward claim)
- [ ] Animate reward display (coins falling, XP burst)
- [ ] Add quest notification toasts
- [ ] Integrate quest tracker overlay

### Priority 3: PvP Balancing (40h - Phase 3 completion)
- [ ] Implement raid cooldown system (1h between same target)
- [ ] Add beginner protection shield (72h)
- [ ] Implement attack cost scaling
- [ ] Add matchmaking suggestions (±30% power)

---

## Test Results Tracking

### Tester: _______________
### Date: _______________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Navigation & Display | ⬜ | |
| 2 | Sub-Tab Navigation | ⬜ | |
| 3 | Quest Card Display | ⬜ | |
| 4 | Accept Quest Flow | ⬜ | |
| 5 | Quest Progress Display | ⬜ | |
| 6 | Complete & Claim Rewards | ⬜ | |
| 7 | Daily Quests Tab | ⬜ | |
| 8 | Campaign Tab & Chapter | ⬜ | |
| 9 | Quest Detail Modal | ⬜ | |
| 10 | Responsive Design | ⬜ | |
| 11 | Portal Battle Integration | ⬜ | |
| 12 | Error Handling | ⬜ | |
| 13 | Load Time | ⬜ | |
| 14 | Animation Performance | ⬜ | |
| 15 | Cross-Browser | ⬜ | |
| 16 | Authorization | ⬜ | |
| 17 | Data Persistence | ⬜ | |
| 18 | Regression Tests | ⬜ | |

**Legend:**
- ⬜ Not Tested
- ✅ Pass
- ⚠️ Pass with Issues
- ❌ Fail

---

## Support Resources

### Documentation:
- **Backend API:** `docs/PORTAL_QUEST_IMPLEMENTATION.md` (805 lines)
- **Database Schema:** See migration `20251130_add_portal_quests.sql`
- **Frontend Components:** `frontend/src/components/portals/`

### API Testing (Postman/Thunder Client):
```bash
# Get available quests
GET http://localhost:5000/api/v1/portal-quests/available
Authorization: Bearer {token}

# Accept quest
POST http://localhost:5000/api/v1/portal-quests/123/accept
Authorization: Bearer {token}

# Get active quests
GET http://localhost:5000/api/v1/portal-quests/user/active
Authorization: Bearer {token}
```

### Database Queries:
```sql
-- Check quest data
SELECT * FROM portal_quests LIMIT 10;

-- Check user progress
SELECT uq.*, pq.title 
FROM user_quests uq
JOIN portal_quests pq ON uq.quest_id = pq.id
WHERE uq.user_id = 1;

-- Check daily rotation
SELECT * FROM daily_quest_rotation ORDER BY date DESC LIMIT 1;
```

---

## Contact
For issues or questions during testing, refer to:
- **Project Lead:** Technical documentation in `docs/`
- **Repository:** GitHub issues
- **Roadmap:** `STRATEGIC_ROADMAP.md` (Phase 3, 68% complete)
