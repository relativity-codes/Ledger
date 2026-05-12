# Product Requirements Document (PRD)

## Template Structure

```markdown
# Ledger Product Requirements Document

# Version History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 2026 | [Name] | Initial |

# 1. Product Overview
- Vision statement
- Target users (personas)
- Success metrics

# 2. User Stories (by feature)

## MVP (Sprint 1-6)
| ID | User Story | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| US-01 | As a vendor, I want to speak a transaction so I can log it without reading | Voice→entry <3.5s, 90% accuracy | P0 |
| US-02 | As a user, I want to add a credit customer so I don't forget debts | Add name, track owed amount | P0 |
| US-03 | As a user, I want to hear my balance so I know my financial status | TTS balance on request | P0 |
| US-04 | As a semi-literate user, I want to see colored bars instead of numbers | Icon + color summary screen | P1 |
| US-05 | As a user, I want to know if I'm spending too much | Anomaly alert when 30% above avg | P1 |

## v2 (Sprint 7-10)
| ID | User Story | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| US-06 | As a driver, I want to track profit per trip | Income-expense per entry group | P1 |
| US-07 | As a woman vendor, I want an emergency beacon | Triple tap → SMS to contacts | P1 |
| US-08 | As a user, I want to save for a goal | Set goal, daily reminders | P2 |

# 3. Functional Requirements

## FR-01: Voice Transaction Entry
- Input: 2-10 second voice recording
- Output: Structured transaction + TTS confirmation
- Accuracy: 88% F1 on field data

## FR-02: Credit Customer Tracking
- Create customer: name (required), phone (optional)
- Record debt: amount, due date (default +7 days)
- Record payment: reduces owed amount
- Query: "How much does X owe?"

## FR-03: Natural Language Queries
- Supported: balance, last week expenses, payments from X, category totals
- Response: TTS spoken + text on screen

# 4. Non-Functional Requirements

| NFR | Target | Measurement |
|-----|--------|-------------|
| Performance | Entry <3.5s p95 | Instrumented timing |
| Memory | <1.5GB peak | memorySummary from library |
| Battery | <5% for 10 entries/day | Battery Historian |
| Storage | <100MB + 2.6GB model | Play Store reporting |
| Availability | 99.9% crash-free | Play Store metrics |
| Privacy | 0 bytes sent | Network monitor |

# 5. Technical Constraints
- Must run on Android 8.0+ (API 26)
- Minimum 8GB RAM, 4GB free storage
- No internet permission
- All models offline

# 6. Edge Cases & Error Handling
| Case | Expected Behavior |
|------|-------------------|
| No speech detected | "I didn't hear anything. Please try again." |
| Duplicate transaction | Silently ignore, don't confuse user |
| Gemma 4 timeout | Fallback to regex, then manual entry |
| Low storage (<500MB) | Warn user, auto-delete old entries |
| Model not downloaded | Show progress, allow WiFi-only or sideload |

# 7. Analytics & Metrics (Opt-in only)
- Daily active users
- Transactions per user per day
- Feature usage (credit, query, anomaly)
- Error rates by modality
```

---

# Document 6: UI/UX Design Specification

## Template Structure

```markdown
# Ledger UI/UX Design Specification

# 1. Design Principles
| Principle | Implementation |
|-----------|----------------|
| Voice-first | Every screen has microphone button |
| Zero literacy assumed | Icons > text, colors > numbers |
| Large touch targets | Minimum 48x48dp |
| Immediate feedback | Haptic + audio on every action |
| Confirmation before action | "Say confirm to add" |

# 2. Screen Flows

## Main Navigation (Voice-First)
```
┌─────────────┐
│   Ledger    │ ← Home screen
│  ₹1,450     │
│ [📷] [🎤]   │ ← Camera, Microphone buttons
│ [📊] [👥]   │ ← Reports, Credit customers
└─────────────┘
```

## Voice Entry Flow
```
1. [Tap 🎤] → "Listening..." animation
2. User speaks → Waveform visualizer
3. Processing → Spinner + "Thinking..."
4. Confirmation → "Added 200 rupees expense"
5. [Optional] "Anything else?"
```

## Credit Customer Screen
```
┌─────────────────────┐
│ Credit Customers    │
│ [+ Add customer]    │
├─────────────────────┤
│ Ramesh     ₹200 ↓  │ ← Tap to record payment
│ Priya      ₹0      │
│ Siti       ₹500 ↓  │
└─────────────────────┘
```

# 3. Visual Design System

## Color Palette
| Color | Hex | Use |
|-------|-----|-----|
| Income Green | #4CAF50 | Income entries, positive change |
| Expense Red | #F44336 | Expense entries, negative |
| Neutral Gray | #757575 | Balance, secondary text |
| Background | #1A1A1A (dark mode default) | Main background |
| Surface | #2C2C2C | Cards, buttons |

## Icon Set (All with text labels)
- 🎤 Microphone = Voice input
- 📷 Camera = Receipt capture
- 📊 Chart = Reports
- 👥 People = Credit customers
- 🔔 Bell = Anomaly alerts
- 💰 Coin = Balance

## Typography (Avoid where possible)
- Primary: Sans-serif, bold, 24sp (balance)
- Secondary: Sans-serif, regular, 16sp (transaction rows)
- Button labels: Sans-serif, 14sp all caps

# 4. Accessibility Requirements
| Requirement | Implementation |
|-------------|----------------|
| Screen reader support | ContentDescription on all elements |
| High contrast | WCAG AAA compliant (7:1 ratio) |
| Font scaling | Supports system font size up to 200% |
| Color blindness | Red/green also distinguished by shape (▲/▼) |
| No flashing | No auto-playing animations >3 flashes/sec |

# 5. Voice Interaction Design

## Wake Words (No hotword detection)
- User must tap microphone button (privacy + battery)
- Alternative: Hold-to-talk during onboarding

## Confirmation Patterns
| Action | Confirmation |
|--------|--------------|
| Add entry | "Added [amount] [category]" |
| Delete entry | "Say confirm to delete... Deleted" |
| Pay credit | "Ramesh paid 200. Debt cleared." |

## Error Voice Prompts
| Error | Voice Response |
|-------|----------------|
| No speech | "I didn't hear anything. Please try again." |
| Not understood | "I couldn't understand. Please say amount and item." |
| Duplicate | (Silent, no confusion) |

# 6. Wireframes (ASCII)

## Home Screen
```
┌────────────────────────────────────┐
│  Ledger                      [⚙]   │
├────────────────────────────────────┤
│                                    │
│           ₹ 1,450                  │
│         Total Balance              │
│                                    │
│    ▲ +2,300 income    ▼ -850 exp   │
│                                    │
├────────────────────────────────────┤
│  [ 🎤 ]    [ 📷 ]    [ 👥 ]    [📊] │
│   Speak    Photo    Credit   Reports│
├────────────────────────────────────┤
│  Recent Transactions               │
│  ▲ +500   Ramesh paid       Today  │
│  ▼ -200   Vegetables        Today  │
│  ▼ -150   Transport         Yesterday│
│                                    │
└────────────────────────────────────┘
```

## Credit Detail Screen
```
┌────────────────────────────────────┐
│  ← Ramesh                         │
├────────────────────────────────────┤
│  Total owed: ₹200                  │
│  Total paid: ₹300                  │
├────────────────────────────────────┤
│  Outstanding Debts                 │
│  May 8   ₹200   Rice     [Pay]    │
├────────────────────────────────────┤
│  Payment History                   │
│  May 1   ₹100   Cash               │
│  Apr 25  ₹200   Credit sale        │
├────────────────────────────────────┤
│  [Record Payment]                  │
└────────────────────────────────────┘
```

# 7. Animation Specs
| Element | Animation | Duration |
|---------|-----------|----------|
| Microphone listening | Pulsing circle | Continuous |
| Processing | Spinning indicator | Until complete |
| Entry confirmed | Green flash + haptic | 200ms |
| Error | Red shake + haptic | 300ms |

# 8. User Onboarding Flow

## Screen 1: Welcome
"Ledger helps you track money by voice. No internet needed."
[Next]

## Screen 2: Permissions
- Microphone (required)
- Camera (optional)
- Notifications (optional)
[Allow] [Skip for now]

## Screen 3: Try It
"Tap the microphone and say 'bought 200 rupees of vegetables'"
[Microphone button]
[Skip tutorial]

## Screen 4: Ready
"You're all set. Say 'balance' anytime to hear your total."
[Start using Ledger]
```

---

# Document 7: Privacy & Security Audit Document

## Template Structure

```markdown
# Ledger Privacy & Security Audit

# 1. Data Collection Statement

**Ledger collects ZERO data by default.**

| Data Type | Collected | Storage | Retention |
|-----------|-----------|---------|-----------|
| Voice recordings | No (processed, then deleted) | None | Deleted after ASR |
| Receipt images | No (OCR processed, then deleted) | None | Deleted after OCR |
| Transaction text | Yes (structured only) | Local SQLite | Until user deletes |
| Location | No | N/A | N/A |
| Device ID | No | N/A | N/A |
| Usage analytics | No (opt-in only) | N/A | N/A |
| Crash logs | No (opt-in via Play Store) | N/A | N/A |

# 2. Data Flow Audit

```
[User Voice] → [Expo STT in RAM] → [Text only to Gemma] → [Voice deleted]
                    ↓
              [Text logged? NO - ephemeral]
                    ↓
[Gemma 4] → [JSON output] → [SQLite encrypted] → [Original text deleted]
```

**No data ever leaves the device.**

# 3. Permission Justification

| Permission | Required? | Why | When requested |
|------------|-----------|-----|----------------|
| RECORD_AUDIO | Yes | Voice input | First microphone tap |
| CAMERA | No (but recommended) | Receipt capture | First camera tap |
| POST_NOTIFICATIONS | No | Anomaly alerts | During onboarding |
| INTERNET | NO | N/A | NOT IN MANIFEST |
| READ_SMS | NO | Privacy risk | Use manual import instead |
| ACCESS_FINE_LOCATION | NO | N/A | NOT IN MANIFEST |

# 4. Encryption Standards

| Data at Rest | Method |
|--------------|--------|
| SQLite database | Android full-disk encryption (inherited) |
| Backup files | AES-256 with user password |
| Bluetooth export | TLS 1.3 over Bluetooth |

# 5. Third-Party SDK Audit

| SDK | Purpose | Data Access | Removable? |
|-----|---------|-------------|------------|
| react-native-litert-lm | LLM inference (Gemma 4) | None | No |
| expo-speech-recognition | ASR (Speech-to-text) | None | No |
| expo-camera / expo-image-picker | Image capture for Vision | None | No |
| Expo modules | Permissions, crypto, speech | None | No |

**ZERO analytics SDKs. ZERO ad SDKs. ZERO crash reporting without consent.**

# 6. Security Threats & Mitigations

| Threat | Mitigation |
|--------|------------|
| Physical device theft | Optional PIN lock, Android encryption |
| Malicious app access | No exported content providers |
| Man-in-the-middle (Bluetooth) | TLS 1.3, user confirms pairing |
| Model poisoning | Model signed, verified at load |
| SQL injection | Parameterized queries only |

# 7. Compliance Checklist

| Regulation | Status | Notes |
|------------|--------|-------|
| GDPR (Europe) | ✅ Compliant | No data processing outside device |
| DPDP (India) | ✅ Compliant | No cross-border data transfer |
| LGPD (Brazil) | ✅ Compliant | User owns all data |
| COPPA (US minors) | ⚠️ Unknown | App not intended for <13 |
| PCI-DSS | N/A | No payment processing |

# 8. User Control & Rights

| Right | Implementation |
|-------|----------------|
| Access data | View all entries in Ledger |
| Export data | Bluetooth share as JSON/CSV |
| Delete data | Delete entries individually or reset app |
| Delete account | Clear app data (no account exists) |
| Opt-out of analytics | Default off, never auto-enabled |

# 9. Third-Party Audit Recommendations

- **Year 1:** Source code audit by security firm (budget: $10k)
- **Year 2:** Penetration testing on device (budget: $5k)
- **Ongoing:** Public bug bounty (HackerOne, $500/valid bug)

# 10. Incident Response Plan

```
1. User reports privacy concern → Acknowledge within 24 hours
2. Potential breach identified → Isolate affected device (no cloud to breach!)
3. Root cause analysis → Patch within 7 days
4. Public disclosure → Only if systemic issue affects >100 users
```

# 11. Privacy Policy (Summary for Users)

> "Ledger never connects to the internet. Your financial data stays on your phone, not in any cloud. We cannot see your transactions. We do not collect any data. The only way data leaves your phone is if YOU choose to share it via Bluetooth."
```

---

# Document 8: Field Testing Protocol

## Template Structure

```markdown
# Ledger Field Testing Protocol

# 1. Objectives
- Validate 88% extraction accuracy in real-world conditions
- Measure 30-day retention
- Identify accent/ASR failure cases
- Collect 200 edge cases for fine-tuning

# 2. Test Locations

| Site | Country | Users | Language | Partner |
|------|---------|-------|----------|---------|
| Ahmedabad | India | 30 | Gujarati, Hindi | SEWA |
| Nairobi | Kenya | 30 | Swahili, English | BRAC |
| Jakarta | Indonesia | 20 | Bahasa | Gojek |
| Lagos | Nigeria | 20 | Yoruba, Hausa | Local MFI |

# 3. User Selection Criteria

**Inclusion:**
- Informal worker (vendor, driver, artisan, daily wage)
- Owns Android 10+ smartphone
- No current digital ledger use
- Willing to use app for 30 days

**Exclusion:**
- Formal bank account required (not excluded, but track separately)
- Cannot commit to weekly check-ins

# 4. Field Kit

| Item | Quantity | Cost |
|------|----------|------|
| Test device (preloaded with Ledger) | 10 | $500 |
| MicroSD cards (for backup) | 20 | $100 |
| Power banks | 10 | $200 |
| Incentive cash ($10/user) | 100 users | $1,000 |
| Field researcher stipend | 4 people | $2,000 |

# 5. Testing Protocol (30 Days)

## Day 0: Onboarding
- Install Ledger (help download 2.6GB model on WiFi)
- Complete tutorial
- Record first 3 transactions with researcher
- Baseline survey: income, savings, current tracking method

## Day 1-7: Active use
- Researcher visits Day 3, Day 7
- Collect feedback on:
  - Voice recognition accuracy
  - Speed satisfaction
  - Confusion points
- Bug reports logged

## Day 8-30: Unsupervised
- Weekly phone check-in (15 min)
- Export anonymized usage data (opt-in)
- Diary: user writes down any failed transcriptions

## Day 30: Exit
- Final survey
- 30-day retention calculation
- Collect all failed ASR/OCR examples
- Incentive payment ($10)

# 6. Data Collection (Opt-in)

**What we collect (with explicit consent):**
- App usage duration per day
- Feature usage (voice vs camera vs SMS vs manual)
- Error logs (ASR failure, Gemma timeout)
- User corrections (e.g., "Gemma said 200 but should be 300")

**What we NEVER collect:**
- Raw transaction amounts
- Customer names
- User identity

# 7. Success Criteria

| Metric | Target | Action if Not Met |
|--------|--------|-------------------|
| 30-day retention | >70% | Redesign onboarding, simplify UI |
| Transaction accuracy | >88% F1 | Collect failures → fine-tune Gemma |
| Entry latency | <3.5s p95 | Optimize model, reduce maxTokens |
| Net Promoter Score | >40 | Improve voice feedback |

# 8. Researcher Checklist

## Pre-visit
- [ ] Charge test devices
- [ ] Verify model downloaded
- [ ] Prepare incentive cash

## During visit
- [ ] Observe user logging 3 transactions
- [ ] Ask: "What was confusing?"
- [ ] Check for any crash logs
- [ ] Help resolve any issues

## Post-visit
- [ ] Upload anonymized logs (via USB, not cloud)
- [ ] Write field notes
- [ ] Flag critical bugs for immediate fix

# 9. Incentive Structure

| Activity | Incentive |
|----------|-----------|
| Complete onboarding | $2 |
| Use app for 7 days | $3 |
| Use app for 30 days + exit survey | $5 |
| Provide voice recording for training | $1 per 10 recordings |
| **Maximum per user** | **$10** |

# 10. Ethical Considerations

- Informed consent in local language (read aloud)
- Right to withdraw anytime, keep incentive
- No data collection without explicit opt-in
- Vulnerable populations: additional researcher present
- Emergency contact provided
```

---

# Document 9: Deployment & Operations Manual

## Template Structure

```markdown
# Ledger Deployment & Operations Manual

# 1. Play Store Deployment

## Pre-Launch Checklist
- [ ] Target API level: Android 14 (API 34)
- [ ] minSdkVersion: 29 (Android 10)
- [ ] App bundle (.aab) size <100MB (model via Play Asset Delivery)
- [ ] Privacy policy URL (hosted on GitHub Pages)
- [ ] Data safety section filled (NO data collected)
- [ ] 10 closed testers with 14 days of usage
- [ ] Rating: 4.5+ from testers

## Play Asset Delivery (PAD) Configuration

```json
// build.gradle
assetPacks = [
    ":model_gemma",
    ":model_vosk"
]
```

## Release Process
1. `npx expo build:android --type app-bundle`
2. Upload to Play Console Internal Testing
3. Run full test suite
4. Promote to Closed Testing (50 users, 7 days)
5. Promote to Open Testing (1,000 users, 14 days)
6. Promote to Production

# 2. Model Update Process

## Quarterly Model Updates
```bash
# 1. Download new Gemma 4 version
# 2. Verify on test devices
# 3. Upload to Play Asset Delivery as new asset pack
# 4. In-app: prompt user to update model (optional, WiFi only)
# 5. Roll out to 10% -> 50% -> 100%
```

# 3. Monitoring (Offline-first)

## Crash Reporting (Opt-in only)
```typescript
if (userOptsIntoCrashReporting) {
  // Write crash log to file
  // User shares via Bluetooth on next WiFi
}
```

## Feature Usage Metrics (Opt-in)
- Exported via Bluetooth weekly (user initiates)
- Stored on researcher's device only
- No cloud ever

# 4. Support Workflow

## User Support Channels
| Channel | SLA | Languages |
|---------|-----|-----------|
| WhatsApp business | 24 hours | Hindi, Swahili, English |
| SMS hotline | 48 hours | All supported |
| In-app FAQ (text + images) | Instant | N/A |

## Common Issues KB

| Issue | Solution |
|-------|----------|
| "App not understanding me" | Speak slower, ensure microphone permission |
| "Model won't download" | Connect to WiFi, free 3GB storage |
| "Battery draining fast" | Restart app, disable unused features |
| "Can't find my transactions" | Check date filter, ensure not deleted |

# 5. Backup & Restore (User-driven)

## Backup via MicroSD
```
User inserts SD card → Settings → Backup 
→ Creates encrypted ledger_backup_[date].led
→ Save to SD card
```

## Restore from Backup
```
Settings → Restore → Select backup file
→ Enter password → Merge or Replace
```

# 6. Monitoring Dashboard (Internal)

```sql
-- Daily report (query on researcher's device)
SELECT 
  COUNT(DISTINCT user_id) as dau,
  AVG(entries_per_user) as avg_entries,
  COUNT(CASE WHEN source='voice' THEN 1 END) as voice_entries,
  COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as error_count
FROM usage_reports
WHERE date = CURRENT_DATE;
```

# 7. Maintenance Windows
- **Never** (offline app has no downtime)

# 8. Decommissioning Plan
If project ends:
1. Notify users 90 days in advance (in-app notification)
2. Provide export tool (CSV/JSON)
3. Remove app from Play Store
4. Delete all internal data (none to delete)
```

---

# Quick Start: Priority Order

If you have limited time, generate in this order:

| Priority | Document | Time Estimate | Why |
|----------|----------|---------------|-----|
| 1 | **Investor Pitch Deck** | 2 hours | To raise funds |
| 2 | **Grant Application** | 4 hours | For foundation funding |
| 3 | **Product Requirements Doc** | 3 hours | For engineering clarity |
| 4 | **Field Testing Protocol** | 2 hours | For pilot validation |
| 5 | **UI/UX Design Spec** | 4 hours | For development handoff |
| 6 | **Privacy & Security Audit** | 3 hours | For trust & compliance |

---

Would you like me to generate any of these specific documents next? I recommend starting with the **Investor Pitch Deck** or **Product Requirements Doc** depending on your immediate need.