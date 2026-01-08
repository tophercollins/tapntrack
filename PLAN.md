# Tap N Track - App Plan

## Vision

A frictionless habit and activity tracking app where users can log activities with minimal taps. The core interaction is: **open app → tap emoji → done** (or minimal additional input).

---

## Core Principles

1. **Zero-friction tracking** - Logging should take 1-3 taps maximum
2. **Visual-first interface** - Emojis as the primary interaction elements
3. **Customizable activities** - Users define their own tracking categories
4. **Activity-specific flows** - Different activities have different data capture needs

---

## Tech Stack Recommendation

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | **React + TypeScript** | Type safety, component reusability |
| Build Tool | **Vite** | Fast development, modern defaults |
| Styling | **Tailwind CSS** | Rapid UI development, mobile-first |
| State | **Zustand** | Lightweight, simple persistence |
| Storage | **IndexedDB (via Dexie.js)** | Offline-first, handles complex queries |
| PWA | **Vite PWA Plugin** | Installable, works offline |
| Charts | **Recharts** | Simple, React-native charting |

### Why PWA?
- Installable on home screen (feels like native app)
- Works offline (essential for quick tracking)
- No app store approval needed
- Single codebase for all platforms

---

## Data Models

### Activity
```typescript
interface Activity {
  id: string;
  name: string;
  emoji: string;
  color: string;                    // For visual grouping
  trackingType: TrackingType;
  subItems?: SubItem[];             // For activities with sub-options
  unit?: string;                    // "reps", "minutes", "km", etc.
  createdAt: Date;
  sortOrder: number;
}

type TrackingType =
  | 'tap'           // Single tap = logged (e.g., "took vitamins")
  | 'sub-select'    // Tap → select sub-item (e.g., bouldering grades)
  | 'number'        // Tap → enter number (e.g., glasses of water)
  | 'sub-number'    // Tap → select sub-item → enter number (e.g., weight lifting)
  | 'duration'      // Tap to start/stop timer (e.g., meditation)
```

### SubItem
```typescript
interface SubItem {
  id: string;
  activityId: string;
  name: string;
  emoji: string;
  sortOrder: number;
}
```

### Entry (A logged activity)
```typescript
interface Entry {
  id: string;
  activityId: string;
  subItemId?: string;
  value?: number;                   // For number-based tracking
  duration?: number;                // For timed activities (seconds)
  timestamp: Date;
  note?: string;                    // Optional note
}
```

---

## User Flows

### Flow 1: Simple Tap (e.g., "Took Vitamins")
```
[Home Screen] → Tap 💊 → ✓ Logged!
```

### Flow 2: Sub-Select (e.g., "Bouldering")
```
[Home Screen] → Tap 🧗 → [Grade Sheet]
                          🟢 V0-V1
                          🟡 V2-V3  → Tap → ✓ Logged!
                          🟠 V4-V5
                          🔴 V6+
```

### Flow 3: Number Input (e.g., "Glasses of Water")
```
[Home Screen] → Tap 💧 → [Number Pad]
                          [  3  ] → Confirm → ✓ Logged!
```

### Flow 4: Sub + Number (e.g., "Weight Lifting")
```
[Home Screen] → Tap 🏋️ → [Exercise List]
                          💪 Bicep Curl
                          🦵 Squat      → Tap → [Reps: 12] → ✓ Logged!
                          🫁 Bench Press
```

### Flow 5: Duration (e.g., "Meditation")
```
[Home Screen] → Tap 🧘 → [Timer Running: 05:23] → Tap to Stop → ✓ Logged!
```

---

## Screen Architecture

### 1. Home Screen (Main Dashboard)
- Grid of activity emoji buttons (large, tappable)
- Today's activity summary at top
- Quick access to recent entries
- Bottom nav: Home | Stats | Settings

### 2. Activity Detail / Logger
- Appears as bottom sheet or modal
- Shows sub-items if applicable
- Number input if applicable
- Timer controls if applicable
- Confirm/cancel actions

### 3. Stats Screen
- Calendar heatmap view
- Charts by activity
- Streak counters
- Weekly/monthly summaries

### 4. Settings Screen
- Manage activities (add/edit/delete/reorder)
- Export data
- Theme preferences
- Notification reminders

### 5. Activity Editor
- Emoji picker
- Name input
- Tracking type selector
- Sub-item management (for applicable types)

---

## Component Structure

```
src/
├── components/
│   ├── ui/                     # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── EmojiButton.tsx
│   │   ├── NumberPad.tsx
│   │   ├── BottomSheet.tsx
│   │   └── Timer.tsx
│   │
│   ├── activities/             # Activity-related components
│   │   ├── ActivityGrid.tsx
│   │   ├── ActivityCard.tsx
│   │   ├── SubItemPicker.tsx
│   │   └── ActivityEditor.tsx
│   │
│   ├── tracking/               # Tracking flow components
│   │   ├── TapLogger.tsx
│   │   ├── NumberLogger.tsx
│   │   ├── SubSelectLogger.tsx
│   │   ├── DurationLogger.tsx
│   │   └── LogConfirmation.tsx
│   │
│   ├── stats/                  # Statistics components
│   │   ├── CalendarHeatmap.tsx
│   │   ├── ActivityChart.tsx
│   │   ├── StreakCounter.tsx
│   │   └── WeeklySummary.tsx
│   │
│   └── layout/                 # Layout components
│       ├── BottomNav.tsx
│       ├── Header.tsx
│       └── PageContainer.tsx
│
├── pages/
│   ├── HomePage.tsx
│   ├── StatsPage.tsx
│   ├── SettingsPage.tsx
│   └── EditActivityPage.tsx
│
├── stores/
│   ├── activityStore.ts        # Activity definitions
│   └── entryStore.ts           # Logged entries
│
├── db/
│   └── database.ts             # Dexie.js setup
│
├── hooks/
│   ├── useActivity.ts
│   ├── useEntries.ts
│   └── useTimer.ts
│
├── utils/
│   ├── dates.ts
│   └── stats.ts
│
├── App.tsx
└── main.tsx
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Initialize Vite + React + TypeScript project
- [ ] Set up Tailwind CSS
- [ ] Configure Dexie.js database
- [ ] Create basic layout with bottom navigation
- [ ] Implement activity store with Zustand

### Phase 2: Core Tracking (MVP)
- [ ] Build ActivityGrid component
- [ ] Implement EmojiButton component
- [ ] Create "tap" tracking type (simplest flow)
- [ ] Add LogConfirmation feedback (toast/animation)
- [ ] Build basic entry logging to database

### Phase 3: Advanced Tracking Types
- [ ] Implement SubItemPicker for "sub-select" type
- [ ] Build NumberPad component for "number" type
- [ ] Create combined flow for "sub-number" type
- [ ] Add Timer component for "duration" type

### Phase 4: Activity Management
- [ ] Build ActivityEditor screen
- [ ] Implement emoji picker
- [ ] Add drag-to-reorder functionality
- [ ] Create sub-item management UI

### Phase 5: Statistics
- [ ] Build CalendarHeatmap component
- [ ] Create activity-specific charts
- [ ] Implement streak calculation
- [ ] Add weekly/monthly summary views

### Phase 6: Polish & PWA
- [ ] Configure PWA manifest and service worker
- [ ] Add install prompt
- [ ] Implement haptic feedback (where supported)
- [ ] Add success animations
- [ ] Optimize for offline use
- [ ] Data export functionality

---

## Example Activities (Seed Data)

| Activity | Emoji | Type | Sub-items |
|----------|-------|------|-----------|
| Vitamins | 💊 | tap | - |
| Water | 💧 | number | - |
| Bouldering | 🧗 | sub-select | 🟢 V0-V1, 🟡 V2-V3, 🟠 V4-V5, 🔴 V6+ |
| Weight Lifting | 🏋️ | sub-number | 💪 Curls, 🦵 Squats, 🫁 Bench |
| Meditation | 🧘 | duration | - |
| Running | 🏃 | number | - (km/miles) |
| Reading | 📚 | number | - (pages) |
| Coffee | ☕ | tap | - |
| Sleep | 😴 | number | - (hours) |

---

## UI/UX Considerations

### Mobile-First Design
- Large touch targets (minimum 48x48px, recommend 64x64px for emojis)
- Bottom-heavy navigation (thumb-friendly)
- Swipe gestures for quick actions

### Feedback & Delight
- Haptic feedback on successful log
- Satisfying animation on completion
- Sound effects (optional, off by default)
- Streak celebrations

### Accessibility
- High contrast emoji backgrounds
- Screen reader support
- Reduced motion option

### Color Scheme
- Dark mode by default (easier on eyes, looks modern)
- Activity colors for visual grouping
- Success = green, active = blue accent

---

## Future Enhancements (Post-MVP)

- **Widgets** - iOS/Android widgets for even faster tracking
- **Watch app** - Apple Watch / WearOS companion
- **Social** - Share streaks with friends
- **Goals** - Set daily/weekly targets
- **Reminders** - Smart notifications
- **Integrations** - Apple Health, Google Fit
- **Cloud sync** - Optional backup/sync across devices
- **Templates** - Pre-built activity packs (fitness, wellness, productivity)

---

## Success Metrics

1. **Time to log** - Target: under 2 seconds for simple taps
2. **Daily retention** - Users opening app daily
3. **Streak length** - Average streak duration
4. **Activities created** - User customization engagement
