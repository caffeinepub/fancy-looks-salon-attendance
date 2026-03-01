# Fancy Looks Salon Attendance

## Current State
Full attendance management system with:
- Admin dashboard (password: fancy0308) with Staff Management and Daily Attendance tabs
- Staff Entry page for check-in/out
- Premium Staff page
- Reports page (individual + monthly summary)
- Backend stores all data (staff, attendance) in canister
- Staff management (addStaff, removeStaff, updateStaffTimes) requires `#admin` permission in backend
- Frontend uses `useAdminActor` which calls `_initializeAccessControlWithSecret(caffeineAdminToken)` -- but this token is never present in URL, so adminActor never has admin privileges
- Result: Staff add/remove/edit silently fails because adminActor has no backend admin rights

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Backend: Remove `#admin` permission checks from `addStaff`, `removeStaff`, `updateStaffTimes` -- make them callable by any caller (security is handled by frontend password)
- Frontend: Update `useLocalStaff` hook to use regular `actor` instead of `adminActor` for staff mutations

### Remove
- Backend admin permission guards on staff management functions

## Implementation Plan
1. Regenerate backend Motoko code with staff management functions open to all callers (no permission check)
2. Update `useLocalStaff.ts` to use `actor` from `useActor` instead of `adminActor` from `useAdminActor` for addStaff/removeStaff/updateStaffTimes mutations
3. Also update `markAttendance` in backend to be callable without admin check (same issue exists for attendance marking)
