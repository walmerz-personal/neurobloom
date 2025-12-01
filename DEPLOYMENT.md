# NeuroBloom - TestFlight Deployment Guide

This document provides step-by-step instructions for building and deploying the NeuroBloom iOS app to Apple TestFlight using EAS (Expo Application Services).

## Prerequisites

- Active Apple Developer account with TestFlight access
- EAS CLI installed (`npm install -g eas-cli`)
- Logged into your Expo account (`eas login`)
- All Apple Developer Terms of Service accepted in App Store Connect

## Configuration Requirements

### Critical Configuration Files

The app must **NOT** have the following files (they cause build failures):
- ❌ `app.config.js` - **Must be deleted** (Expo doesn't handle env vars correctly during Metro bundling)
- ❌ `babel.config.js` - **Must be deleted** (Use Expo's default Babel configuration)

### Required Configuration Files

1. **`app.json`** - Main Expo configuration
   - Must include correct `splash.image` path: `"./assets/splash-icon.png"`
   - Must include `buildNumber` in iOS section (increment for each submission)
   - Must include correct `projectId` in `extra.eas` section

2. **`eas.json`** - EAS build configuration
   ```json
   {
     "cli": {
       "version": ">= 12.5.1"
     },
     "build": {
       "production": {}
     },
     "submit": {
       "production": {}
     }
   }
   ```

3. **`package.json`** - Ensure jest version matches Expo SDK requirements:
   ```json
   {
     "devDependencies": {
       "jest": "~29.7.0"
     }
   }
   ```

## Deployment Steps

### 1. Increment Build Number

Update the `buildNumber` in `app.json`:
```json
{
  "expo": {
    "ios": {
      "buildNumber": "2"  // Increment this for each new submission
    }
  }
}
```

### 2. Commit All Changes

```bash
git add -A
git commit -m "Prepare for TestFlight build X"
```

**Important:** EAS builds from your git commits, so all changes must be committed.

### 3. Build for Production

```bash
eas build --platform ios --profile production
```

**What happens:**
- EAS will prompt you to log into your Apple Developer account
- It will create/reuse distribution certificates
- Build takes approximately 10-20 minutes
- You'll receive a build URL when complete

**Common Issues:**
- If build fails at "Prebuild" phase: Check `splash.image` path in app.json
- If build fails at "Bundle JavaScript" phase: Ensure app.config.js and babel.config.js are deleted

### 4. Submit to TestFlight

```bash
eas submit --platform ios --latest
```

**What happens:**
- Submits the most recent successful build to App Store Connect
- Apple processes the build (5-10 minutes typically)
- You'll receive an email when processing completes

### 5. Verify in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → TestFlight tab
3. Confirm the new build appears with correct version and build number
4. **Important:** Check that any Apple Terms of Service updates are accepted

### 6. Distribute to Testers

In App Store Connect TestFlight:
1. Select the new build
2. Add internal/external testers
3. Send invitations
4. Testers receive email with TestFlight link

## Troubleshooting

### Build Failures

**Prebuild Phase Errors:**
- **Error:** `ENOENT: no such file or directory, open './assets/splash.png'`
  - **Solution:** Update `splash.image` path in app.json to `"./assets/splash-icon.png"`

- **Error:** Jest version mismatch
  - **Solution:** Downgrade jest to `~29.7.0` in package.json

**Bundle JavaScript Phase Errors:**
- **Error:** `process.env.EXPO_ROUTER_APP_ROOT` undefined or Metro bundler errors
  - **Solution:** Delete `app.config.js` and `babel.config.js` files
  - Expo Router works correctly with default configuration

### Submission Failures

**Invitation Code Required:**
- **Cause:** Apple Developer Terms of Service not accepted
- **Solution:** Log into App Store Connect and accept any pending agreements

## Build History Reference

### Successful Builds
- **Build 1** (Nov 28, 2025):
  - Commit: `62acea3`
  - No app.config.js or babel.config.js
  - Version 1.0.0, Build 1

- **Build 2** (Dec 1, 2025):
  - Commit: `18d20fd`
  - Build ID: `5907ffba`
  - Version 1.0.0, Build 2
  - Fixed: Removed app.config.js and babel.config.js

## Quick Reference Commands

```bash
# Check EAS authentication
eas whoami

# List recent builds
eas build:list --platform ios --limit 5

# View build details
eas build:view [build-id]

# Cancel a build
eas build:cancel

# Get submission status
eas submit --status
```

## Project Configuration

- **EAS Project ID:** 14af3de7-c021-483c-a233-4ff53245bcc1
- **Bundle Identifier:** com.neurobloom.app
- **Expo Owner:** walmerz
- **App Store Connect URL:** https://appstoreconnect.apple.com/apps/6755899655/testflight/ios

## Notes

- Environment variables in `.env.local` are NOT automatically included in EAS builds
- For sensitive environment variables, use EAS Secrets or eas.json env configuration
- Build numbers must be unique and incrementing for each submission to Apple
- Version numbers can stay the same across builds (1.0.0 with build 1, 2, 3, etc.)
