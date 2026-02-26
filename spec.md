# Specification

## Summary
**Goal:** Add structured set rows to workout entries so users can define individual sets as a checklist and check them off as they complete each set.

**Planned changes:**
- Extend the `WorkoutSchedule` backend data model to support an optional array of set rows, each with an ID, description text, and completed boolean
- Update `createScheduleEntry`, `updateScheduleEntry`, and `getScheduleForUser` to accept and return set rows; add ability to toggle a single set row's completed state by ID
- Replace the plain-text workout details textarea in the Schedule edit form with a dynamic list of set-row text inputs, with an "+ Add Set" button and per-row delete icon
- Update Today's Workout page to render set rows as a vertical checkbox checklist; checking/unchecking a row persists the completed state to the backend; completed rows show strikethrough/muted styling
- Add a React Query mutation hook for toggling a set row's completed state, with schedule query cache invalidation on success
- Maintain backward compatibility so entries with plain-text `workoutDetails` and no set rows continue to work without regressions

**User-visible outcome:** When creating or editing a workout, users can add individual set rows (e.g., "3x10 Bench Press") instead of a single text block. On Today's Workout, each set row appears as a checkbox that can be checked off after completing it, with visual feedback for completed sets.
