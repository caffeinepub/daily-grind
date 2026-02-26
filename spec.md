# Specification

## Summary
**Goal:** Fix the bug preventing users from saving workout entries on the Schedule page.

**Planned changes:**
- Diagnose and fix the save/submit handler in `Schedule.tsx` so it correctly invokes the mutation hook with a valid payload including all required fields (`day`, `workoutName`, `workoutDetails`, `timeReminder`, `setRows`).
- Audit and fix the `createScheduleEntry` and `updateScheduleEntry` mutation hooks in `useQueries.ts` to ensure argument types and serialization match the backend Candid interface, including the `setRows` field.
- Surface backend errors to the user instead of silently swallowing them.
- Ensure a successful save triggers schedule query invalidation/refetch and resets the Save button state.

**User-visible outcome:** Users can successfully save new and edited workout entries (with or without set rows) on the Schedule page, see the updated entry reflected in the schedule list, and receive an error message if something goes wrong.
