# NeuroBloom TestFlight Deployment Guide

This guide documents the proven process for building and deploying NeuroBloom to Apple TestFlight using EAS (Expo Application Services). This process was validated on January 17, 2026.

## Important: Build Number Synchronization

**CRITICAL ISSUE:** NeuroBloom uses both `app.json` and native iOS files (`ios/` directory). The build number must be synchronized across **ALL** of these locations, otherwise EAS will show incorrect build numbers.

### Files That Must Have Matching Build Numbers

1. **`app.json`** - `ios.buildNumber` field
2. **`app.config.js`** - `expo.ios.buildNumber` field (if file exists)
3. **`ios/NeuroBloom.xcodeproj/project.pbxproj`** - `CURRENT_PROJECT_VERSION` field (appears twice)
4. **`ios/NeuroBloom/Info.plist`** - `CFBundleVersion` key

All of these must have the **exact same build number** (as a string). If they don't match, EAS may use the wrong value.

## Prerequisites

- Active Apple Developer account with TestFlight access
- EAS CLI installed (`npm install -g eas-cli`)
- Logged into Expo account (`eas login`)
- All Apple Developer Terms of Service accepted in App Store Connect
- Git repository with latest changes committed

## Step-by-Step Deployment Process

### Step 1: Increment Build Number Everywhere

**You MUST update the build number in ALL four locations:**

1. **Update `app.json`:**
   ```bash
   # Open app.json and increment the buildNumber in ios section
   # Example: "buildNumber": "27" → "buildNumber": "28"
   ```

2. **Update `app.config.js` (if it exists):**
   ```bash
   # Open app.config.js and increment buildNumber in expo.ios section
   # Example: buildNumber: "27" → buildNumber: "28"
   ```

3. **Update `ios/NeuroBloom.xcodeproj/project.pbxproj`:**
   ```bash
   # Find and replace ALL instances of CURRENT_PROJECT_VERSION
   # Example: CURRENT_PROJECT_VERSION = 27; → CURRENT_PROJECT_VERSION = 28;
   sed -i '' 's/CURRENT_PROJECT_VERSION = 27;/CURRENT_PROJECT_VERSION = 28;/g' ios/NeuroBloom.xcodeproj/project.pbxproj
   ```

4. **Update `ios/NeuroBloom/Info.plist`:**
   ```bash
   # Find CFBundleVersion and update the string value
   # Example: <string>27</string> → <string>28</string>
   # Or use a text editor to find: <key>CFBundleVersion</key> followed by <string>27</string>
   ```

**Verification:** After updating, verify all four locations have the same build number:
```bash
# Check app.json
grep buildNumber app.json

# Check app.config.js (if exists)
grep -A 2 "ios:" app.config.js | grep buildNumber

# Check project.pbxproj
grep CURRENT_PROJECT_VERSION ios/NeuroBloom.xcodeproj/project.pbxproj

# Check Info.plist
grep -A 1 "CFBundleVersion" ios/NeuroBloom/Info.plist
```

### Step 2: Commit and Push Changes

```bash
cd /Users/zack/Desktop/NeuroBloom

# Stage all modified files
git add app.json app.config.js ios/NeuroBloom.xcodeproj/project.pbxproj ios/NeuroBloom/Info.plist

# Commit with descriptive message
git commit -m "Increment build number to X for TestFlight deployment"

# Push to GitHub
git push origin main
```

**Important:** EAS builds from your git commits. All changes must be committed before building.

### Step 3: Start EAS Build

```bash
cd /Users/zack/Desktop/NeuroBloom

# Build for iOS production
eas build --platform ios --profile production --non-interactive
```

**What happens:**
- EAS will create a build from your latest commit
- Build takes approximately 10-20 minutes
- You'll receive a build URL when complete

**Monitor build status:**
```bash
# Check latest build status
eas build:list --platform ios --limit 1 --non-interactive

# View build logs (use build ID from above)
eas build:view <build-id>
```

**Verify build number:** Check that the build shows the correct build number:
```bash
eas build:list --platform ios --limit 1 --non-interactive | grep "Build number"
```

If it shows the wrong build number, cancel the build and verify all files in Step 1 were updated correctly.

### Step 4: Wait for Build to Complete

Builds typically take 10-20 minutes. Monitor progress:
- EAS Dashboard: https://expo.dev/accounts/walmerz/projects/NeuroBloom/builds
- Or use: `eas build:list --platform ios --limit 1 --non-interactive`

The build status will change from `new` → `in queue` → `in progress` → `finished`.

**Do not proceed to Step 5 until status is `finished`.**

### Step 5: Submit to TestFlight

Once the build status is `finished`, submit to TestFlight:

```bash
cd /Users/zack/Desktop/NeuroBloom

# Submit the latest build to TestFlight
eas submit --platform ios --latest --non-interactive
```

**What happens:**
- EAS uploads the build to App Store Connect
- Apple processes the build (5-10 minutes)
- You'll receive an email when processing completes

**Submission confirmation:** You should see:
```
✔ Submitted your app to Apple App Store Connect!
Your binary has been successfully uploaded to App Store Connect!
```

### Step 6: Verify in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **Apps → NeuroBloom → TestFlight**
3. Verify the new build appears with:
   - Correct version: `1.0.0`
   - Correct build number: `X` (the number you set)
   - Status: `Processing` (initially) → `Ready to Submit` (when done)

**View build details:**
- Direct link: https://appstoreconnect.apple.com/apps/6755899655/testflight/ios
- Submission details: Check the URL provided by `eas submit` command

### Step 7: Distribute to Testers (Optional)

Once the build is processed and shows as `Ready to Submit`:

1. In App Store Connect TestFlight, select the build
2. Add internal or external testers
3. Send invitations
4. Testers receive email with TestFlight link

## Troubleshooting

### Build Shows Wrong Build Number

**Symptom:** EAS dashboard shows build number 25 but you set it to 27 in `app.json`.

**Cause:** Build number not synchronized across all files.

**Solution:**
1. Verify all four files have matching build numbers (see Step 1)
2. Re-check with verification commands
3. Cancel any in-progress builds with wrong number
4. Commit and push corrections
5. Start a new build

### Build Failed or Stuck

**Cancel the build:**
```bash
# Get build ID from: eas build:list --platform ios --limit 1
eas build:cancel <build-id> --non-interactive
```

**Start fresh:**
- Verify all build number files are correct
- Ensure git commit is pushed
- Run build command again

### Submission Failed

**Common causes:**
- Build not finished yet (wait for `finished` status)
- Apple Developer Terms of Service not accepted
- Build already submitted (check App Store Connect)

**Retry:**
```bash
# Check submission status
eas submit --status

# Submit again (will use latest finished build)
eas submit --platform ios --latest --non-interactive
```

### "Invitation Code Required" Error

**Cause:** Apple Developer Terms of Service not accepted in App Store Connect.

**Solution:**
1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Accept any pending agreements
3. Retry submission

## Quick Reference Commands

```bash
# Check current build number in all locations
grep -r "buildNumber\|CURRENT_PROJECT_VERSION\|CFBundleVersion" app.json app.config.js ios/NeuroBloom.xcodeproj/project.pbxproj ios/NeuroBloom/Info.plist

# Check latest build status
eas build:list --platform ios --limit 1 --non-interactive

# View build logs
eas build:view <build-id>

# Cancel a build
eas build:cancel <build-id> --non-interactive

# Check submission status
eas submit --status

# Submit latest build
eas submit --platform ios --latest --non-interactive
```

## Project Configuration

- **EAS Project ID:** `14af3de7-c021-483c-a233-4ff53245bcc1`
- **Bundle Identifier:** `com.neurobloom.app`
- **App Store Connect App ID:** `6755899655`
- **Expo Owner:** `walmerz`
- **Current Version:** `1.0.0`
- **Build Number (as of Jan 17, 2026):** `27`

## Notes for AI Assistants

When helping users deploy to TestFlight:

1. **ALWAYS check all four build number locations** before incrementing
2. **ALWAYS verify synchronization** after updating
3. **NEVER assume** that updating `app.json` alone is sufficient
4. **ALWAYS commit and push** before starting a build
5. **ALWAYS verify** the build number in EAS dashboard matches expectations
6. **If build number is wrong**, cancel the build immediately and fix synchronization

The most common mistake is forgetting to update the native iOS files (`project.pbxproj` and `Info.plist`), which causes EAS to show incorrect build numbers.

## Success Criteria

A successful deployment should show:
- ✅ All four files have matching build numbers
- ✅ Build completed with status `finished`
- ✅ Build number in EAS matches the number you set
- ✅ Submission succeeded to App Store Connect
- ✅ Build appears in TestFlight with correct version and build number

## History

- **Build 27** (Jan 18, 2026): Successful deployment after fixing build number synchronization across all four files.
