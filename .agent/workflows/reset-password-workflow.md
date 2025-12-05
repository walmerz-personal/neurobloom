---
description: How to reset a user's password
---

# Password Reset Workflow

This workflow describes the process for a user to reset their password.

## 1. User Requests Reset

- User navigates to the Login screen.
- User taps "Forgot Password?".
- User enters their email and taps "Send Instructions".

## 2. System Sends Email

- The app calls `SupabaseService.resetPasswordForEmail(email)`.
- Supabase sends an email to the user with a password reset link.
- The link is configured to redirect to `neurobloom://auth/reset-password`.

## 3. User Resets Password

- User clicks the link in the email.
- The device opens the NeuroBloom app via the deep link.
- The app should handle the deep link and present the "New Password" screen (implementation dependent on routing setup).
