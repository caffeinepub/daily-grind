# Specification

## Summary
**Goal:** Change the repeating notification reminder interval in the service worker from every 6 hours to every 4 hours.

**Planned changes:**
- Update the `setInterval` call in `frontend/public/sw.js` to use a 4-hour interval (14,400,000 ms) instead of 6 hours
- Update any related comments or constants in `sw.js` that reference the 6-hour schedule

**User-visible outcome:** Users will receive motivational quote reminder notifications every 4 hours instead of every 6 hours.
