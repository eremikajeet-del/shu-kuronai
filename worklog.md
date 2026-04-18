---
Task ID: 1
Agent: Main Agent
Task: Debug and fix "live review not showing" and app not opening issues

Work Log:
- Investigated the dev server - it was not running, causing the app to be inaccessible
- Restarted the dev server and confirmed the app loads correctly
- Identified a timezone bug in the revision-today page: `isToday()` and `isPast()` functions compared UTC date strings with local time, causing revisions to not show as "today"
- Fixed the revision-today page with timezone-safe date comparison functions (`getDateParts`, `isPastOrToday`, `isStrictlyPast`)
- Fixed dynamic Tailwind class issue in revision-today difficulty buttons: `bg-${colors}-500/15` doesn't work with Tailwind's JIT, replaced with static `DIFFICULTY_STYLES` object
- Fixed the revision-today page to properly fetch and sort overdue + today revisions
- Fixed dashboard API's `pendingToday` and `overdue` calculations to use UTC-midnight boundaries
- Fixed revision creation API to normalize dates to midnight UTC for consistent date comparisons
- Reduced Prisma log level from 'query' to 'error' to reduce overhead
- Verified lint passes with no errors
- Confirmed the app serves pages correctly with 200 status

Stage Summary:
- Root cause: Dev server was not running (primary issue) + timezone bug in revision-today (secondary)
- Fixed timezone-safe date comparison in both client-side and server-side code
- Fixed dynamic Tailwind class issue that caused difficulty buttons to have no styling
- All lint checks pass
- App is now accessible and returning 200 responses
