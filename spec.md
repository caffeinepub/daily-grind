# Specification

## Summary
**Goal:** Fix the "Not Found" grey screen on the Today's Workout page after navigating away and returning, and ensure the page always reflects the latest schedule data.

**Planned changes:**
- Fix the root route (`/`) configuration in `App.tsx` so navigating away and back to the Today tab never falls through to a "Not Found" state.
- Set `staleTime` to `0` on the schedule query in `TodaysWorkout.tsx` so it refetches from the backend on every mount.
- Update all schedule mutation hooks in `useQueries.ts` (create, update, delete, mark complete) to call `queryClient.invalidateQueries` using the exact same query key as the one used in `TodaysWorkout.tsx`.

**User-visible outcome:** Users can freely navigate between Today, Schedule, Progress, and Settings tabs without seeing a grey "Not Found" screen, and the Today's Workout page always shows up-to-date schedule data after changes are made on the Schedule page.
