# Specification

## Summary
**Goal:** Add periodic browser push notifications every 6 hours reminding logged-in users to complete their daily workout, along with a motivational quote, and provide a toggle in Settings to opt in or out.

**Planned changes:**
- Register a Service Worker in the frontend capable of displaying local notifications.
- On first login or via a visible prompt, request browser notification permission from the user.
- When permission is granted, schedule a repeating notification every 6 hours with a title like "Time to grind! 💪" and a body containing a motivational quote fetched from the existing backend endpoint.
- Notifications work while the app is backgrounded or the tab is inactive; clicking a notification opens/focuses the app.
- Add a "Workout Reminders" toggle in the Settings screen to enable or disable notifications.
- Toggling on requests permission if not yet granted; if denied, revert the toggle and show an explanatory message.
- Toggling off cancels any pending scheduled notifications.
- Persist the notification preference using the existing `notificationsEnabled` field in the UserProfile backend.
- On app load, automatically resume the notification schedule if the stored preference is enabled and permission is already granted.

**User-visible outcome:** Users can opt into 6-hour workout reminder notifications with motivational quotes that appear even when they are not actively using the app, and can manage this preference via a toggle in the Settings screen.
