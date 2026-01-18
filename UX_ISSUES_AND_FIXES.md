# NeuroBloom UI/UX Issues & Recommended Fixes

This document lists all small UX annoyances found throughout the app that could frustrate users. Issues are prioritized by severity and frequency of user interaction.

## 🔴 Critical Issues (High Priority)

### 1. **Keyboard Obscuring Action Buttons**

**Issue:** On several forms, when the keyboard appears, it covers the submit/action buttons at the bottom, forcing users to dismiss the keyboard to tap buttons.

**Affected Screens:**
- `app/auth/login.js` - Login button may be covered
- `app/auth/signup.js` - Create Account button may be covered  
- `app/auth/forgot-password.js` - Send Instructions button may be covered
- `app/auth/reset-password.js` - Update Password button may be covered
- `app/onboarding/role.js` - Role selection cards may be pushed off screen when typing name
- `app/profile.js` - Save button may be covered when editing text fields
- `app/check-in.js` - Save Check-In button may be covered when typing notes

**Fix:** Wrap forms in `ScrollView` within `KeyboardAvoidingView`, or ensure proper `keyboardVerticalOffset` values. Add extra bottom padding to `ScrollView`'s `contentContainerStyle` to ensure buttons are accessible.

---

### 2. **CustomExerciseModal - Keyboard Covers Save Button**

**Issue:** The modal has multiple TextInput fields (instructions textarea especially), but no `KeyboardAvoidingView`. When keyboard appears, the "Create Exercise" button at the bottom can be completely hidden.

**Location:** `components/CustomExerciseModal.js`

**Fix:** Add `KeyboardAvoidingView` around the ScrollView content, or use a library like `react-native-keyboard-aware-scroll-view` for better handling in modals.

---

### 3. **Onboarding Details Screen - Missing KeyboardAvoidingView**

**Issue:** Screen has ScrollView but no KeyboardAvoidingView wrapper. When the "Other" role text input appears for medical staff, keyboard may cover the Next button.

**Location:** `app/onboarding/details.js`

**Fix:** Wrap ScrollView in KeyboardAvoidingView similar to how `goals.js` does it.

---

## 🟡 Medium Priority Issues

### 4. **Lilly Chat - Hardcoded keyboardVerticalOffset**

**Issue:** Uses `keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}` which is a magic number. On devices with different tab bar heights or safe area insets, this may not work correctly.

**Location:** `app/(tabs)/lilly.js` line 216

**Fix:** Calculate offset dynamically based on tab bar height using `useSafeAreaInsets()` or remove the hardcoded offset and let KeyboardAvoidingView handle it naturally.

---

### 5. **TextInput Fields - Missing Return Key Navigation**

**Issue:** Many forms don't use `returnKeyType="next"` on intermediate fields, forcing users to manually tap the next field.

**Affected Screens:**
- `app/auth/login.js` - Email field should have `returnKeyType="next"` to move to password
- `app/auth/signup.js` - Password fields should navigate between each other
- `app/auth/reset-password.js` - Password fields should navigate
- `app/profile.js` - Form fields should chain navigation

**Fix:** Add `returnKeyType="next"` and `onSubmitEditing` handlers to move focus to next field. Add `returnKeyType="done"` to final fields.

---

### 6. **Profile Screen - Large Text Areas May Cause Issues**

**Issue:** The profile screen has multiline TextInputs (impairments, goals) that may grow, and the Save button is in the header (always visible) but the inputs are in a ScrollView. When keyboard appears and user scrolls to bottom fields, the layout may feel awkward.

**Location:** `app/profile.js`

**Fix:** Ensure ScrollView has adequate `contentInset` or padding bottom to account for keyboard. Consider moving Save button into the scrollable area or adding keyboard dismiss on scroll.

---

### 7. **Check-In Screen - Notes Input at Bottom**

**Issue:** The notes TextInput is near the bottom, and when focused, the keyboard may push it up but the "Save Check-In" button below it may still be partially obscured.

**Location:** `app/check-in.js`

**Fix:** Wrap the ScrollView in KeyboardAvoidingView and add extra bottom padding to scrollContent.

---

### 8. **Goals Screen - TextArea May Be Cut Off**

**Issue:** The goals textarea is positioned above buttons, but when the keyboard appears for this field, it might push the "Complete Setup" button off screen on smaller devices.

**Location:** `app/onboarding/goals.js`

**Fix:** Although it has KeyboardAvoidingView, verify the `contentContainerStyle` has adequate `paddingBottom` (e.g., 100-150) to ensure buttons remain accessible.

---

### 9. **Role Selection - Name Input Layout**

**Issue:** The name TextInput is placed above the role cards. When keyboard appears, users may not see all role options without scrolling, and there's no ScrollView to enable this.

**Location:** `app/onboarding/role.js`

**Fix:** Wrap content in ScrollView or add KeyboardAvoidingView to allow scrolling when keyboard is visible.

---

## 🟢 Minor Issues (Polish)

### 10. **Login/Signup - No ScrollView**

**Issue:** Forms use KeyboardAvoidingView with `justifyContent: 'center'` which works on large screens, but on smaller devices or when keyboard appears, content might be cramped.

**Location:** `app/auth/login.js`, `app/auth/signup.js`

**Fix:** Consider using ScrollView inside KeyboardAvoidingView for better small-screen support.

---

### 11. **Password Fields - No "Show/Hide Password" Toggle**

**Issue:** All password fields use `secureTextEntry` but don't offer a way to temporarily reveal the password. Users typing long passwords may want to verify they typed correctly.

**Affected Screens:**
- `app/auth/login.js`
- `app/auth/signup.js`
- `app/auth/reset-password.js`

**Fix:** Add an eye icon toggle next to password fields to show/hide password text.

---

### 12. **TextInput Placeholder Text Truncation**

**Issue:** Some placeholder text may be too long and get truncated (e.g., "Password (at least 8 characters)"), making it unclear what's required.

**Location:** `app/auth/signup.js` line 114

**Fix:** Shorten placeholder or move requirement to helper text below the field.

---

### 13. **iOS Date/Time Picker - No KeyboardAvoidingView Wrapper**

**Issue:** When date/time pickers are shown in modals or forms, they may overlap with other content. The iOS spinner picker especially needs proper spacing.

**Affected:**
- `app/profile.js` - Date picker for stroke date and reminder time
- `app/onboarding/details.js` - Date picker for stroke date

**Fix:** Ensure pickers are in scrollable areas with proper spacing, or dismiss keyboard before showing picker.

---

### 14. **Lilly Chat - Input TextArea Growth**

**Issue:** The TextInput in Lilly chat has `maxHeight: 100` but no visible indication when it becomes scrollable. Users may not realize they can scroll within the input.

**Location:** `app/(tabs)/lilly.js`

**Fix:** Add visual indicator or styling to show when input is multi-line/scrollable.

---

### 15. **Missing Keyboard Dismiss on Scroll**

**Issue:** Many ScrollViews don't dismiss the keyboard when user scrolls, which can be annoying when trying to see content behind the keyboard.

**Fix:** Add `keyboardShouldPersistTaps="handled"` to ScrollViews and `keyboardDismissMode="on-drag"` on iOS (handled automatically on Android in some cases).

---

### 16. **Loading States - Button Text Changes May Cause Layout Shift**

**Issue:** Buttons that change text from "Log In" to "Logging in..." may cause slight layout shifts if text lengths differ.

**Affected:** Multiple screens

**Fix:** Use fixed width for button text or keep text length consistent, or show loading spinner without changing text.

---

### 17. **Form Validation - No Inline Error Messages**

**Issue:** Form validation shows alerts, but doesn't show inline errors below fields. Users have to remember what was wrong after dismissing the alert.

**Affected:** All form screens

**Fix:** Add error state and display errors below relevant fields in addition to (or instead of) alerts.

---

### 18. **Autofill Support - Missing textContentType**

**Issue:** Form fields don't specify `textContentType` props which help iOS autofill and password managers.

**Fix:** Add props like:
- `textContentType="emailAddress"` for email fields
- `textContentType="password"` for password fields  
- `textContentType="name"` for name fields

---

### 19. **Accessibility - Missing Labels**

**Issue:** Some TextInputs rely only on placeholder text for labels. Screen reader users may have difficulty understanding what each field is for.

**Fix:** Add `accessibilityLabel` props or use proper label components with `accessibilityRole="text"`.

---

### 20. **Keyboard Type - Some Fields Could Be More Specific**

**Issue:** Some numeric/time fields use default keyboard instead of numeric.

**Examples:**
- `app/check-in.js` - Pain/energy sliders have numeric display but inputs are sliders (OK)
- `app/profile.js` - Date inputs use date picker (OK)

**Note:** Most are already appropriate, but worth reviewing.

---

## Summary

**Total Issues Found:** 20
- **Critical:** 3
- **Medium:** 6  
- **Minor:** 11

**Most Common Pattern:** Missing or improperly configured `KeyboardAvoidingView` + `ScrollView` combinations for forms.

**Quick Wins (Easy to Fix):**
1. Add ScrollView to login/signup screens
2. Add KeyboardAvoidingView to CustomExerciseModal
3. Add returnKeyType navigation to form fields
4. Add keyboard dismiss on scroll
5. Add textContentType for autofill

**Largest Impact Fixes:**
1. Fix keyboard covering buttons on all auth screens
2. Fix CustomExerciseModal keyboard issue
3. Add ScrollView to onboarding role selection
