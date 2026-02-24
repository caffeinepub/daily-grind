# Specification

## Summary
**Goal:** Build "Daily Grind," a full-stack workout tracker app with Internet Identity authentication, a weekly workout schedule, progress tracking, and motivational messages — all wrapped in a dark, high-energy fitness aesthetic.

**Planned changes:**

**Backend:**
- Workout schedule data model and CRUD API (fields: day of week, workout name, workout details, time reminder, completed status, owner principal), scoped per authenticated user
- Motivational messages data model seeded with 5 default messages; API to fetch a random message
- User profile data model (display name, push notifications toggle) with get and upsert API, keyed by caller's principal

**Frontend:**
- Internet Identity authentication; unauthenticated users see a login screen; logout clears session
- **Today's Workout** screen: auto-matches current day to the user's schedule entry, displays workout name, details, and time reminder, includes "Mark as Completed ✅" button that persists the update, shows a placeholder if no workout is scheduled today
- Random motivational message banner/card displayed on the Today's Workout screen, fetched from the backend
- **Schedule** screen: lists all 7 days with their workouts; each day's workout name, details, and time reminder can be edited and saved to the backend
- **Progress** screen: shows total workouts completed this week, a consecutive-day streak counter, and a visual progress bar reflecting weekly completion
- Dark charcoal/near-black theme with bold orange or electric green accents, card-based layout, applied consistently across all screens; flame logo used as app icon

**User-visible outcome:** Users can log in, view and complete today's workout, manage their full weekly schedule, track their progress and streak, and stay motivated — all within a polished dark fitness-themed interface.
