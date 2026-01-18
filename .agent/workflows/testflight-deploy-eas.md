---
description: Build and submit NeuroBloom to TestFlight using EAS - Proven Process
---

# TestFlight Deployment via EAS - AI Assistant Guide

This workflow documents the **proven, working process** for deploying NeuroBloom to TestFlight using EAS (Expo Application Services). This process was successfully validated on January 17, 2026 with build #27.

## ⚠️ CRITICAL: Build Number Synchronization

**THE MOST COMMON MISTAKE:** NeuroBloom uses both `app.json` and native iOS files. The build number **MUST** be identical in **ALL FOUR** locations:

1. **`app.json`** → `ios.buildNumber` (e.g., `"buildNumber": "27"`)
2. **`app.config.js`** → `expo.ios.buildNumber` (e.g., `buildNumber: "27"`) - if file exists
3. **`ios/NeuroBloom.xcodeproj/project.pbxproj`** → `CURRENT_PROJECT_VERSION` (e.g., `CURRENT_PROJECT_VERSION = 27;`) - appears twice
4. **`ios/NeuroBloom/Info.plist`** → `CFBundleVersion` (e.g., `<string>27</string>`)

**If any of these don't match, EAS will show the wrong build number in the dashboard.**

## Step-by-Step Process

### Step 1: Verify Current Build Number

Before incrementing, check all four locations:

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

**All four should show the same number.**

### Step 2: Increment Build Number in ALL Four Locations

**You MUST update all four files:**

```bash
# 1. Update app.json
# Edit manually or use sed:
# OLD_NUMBER=27 NEW_NUMBER=28
sed -i '' 's/"buildNumber": "27"/"buildNumber": "28"/g' app.json

# 2. Update app.config.js (if it exists)
sed -i '' 's/buildNumber: "27"/buildNumber: "28"/g' app.config.js

# 3. Update project.pbxproj (appears twice, replace all)
sed -i '' 's/CURRENT_PROJECT_VERSION = 27;/CURRENT_PROJECT_VERSION = 28;/g' ios/NeuroBloom.xcodeproj/project.pbxproj

# 4. Update Info.plist
sed -i '' 's/<string>27<\/string>/<string>28<\/string>/g' ios/NeuroBloom/Info.plist
```

**After updating, verify all four again with the commands from Step 1.**

### Step 3: Commit and Push Changes

```bash
cd /Users/zack/Desktop/NeuroBloom

# Stage all modified build number files
git add app.json app.config.js ios/NeuroBloom.xcodeproj/project.pbxproj ios/NeuroBloom/Info.plist

# Commit with clear message
git commit -m "Increment build number to X for TestFlight deployment"

# Push to GitHub
git push origin main
```

**Important:** EAS builds from git commits. All changes must be committed before building.

### Step 4: Start EAS Build

```bash
cd /Users/zack/Desktop/NeuroBloom

# Build for iOS production
eas build --platform ios --profile production --non-interactive
```

**What happens:**
- Build takes 10-20 minutes
- Monitor at: https://expo.dev/accounts/walmerz/projects/NeuroBloom/builds

**Check build number is correct:**
```bash
sleep 10 && eas build:list --platform ios --limit 1 --non-interactive | grep "Build number"
```

**If build number is wrong:**
- Cancel the build: `eas build:cancel <build-id> --non-interactive`
- Re-check all four files from Step 1
- Fix any mismatches and repeat Steps 2-4

### Step 5: Wait for Build to Finish

Monitor build status:
```bash
eas build:list --platform ios --limit 1 --non-interactive | grep Status
```

Wait until status is `finished`. **Do not proceed until build status is `finished`.**

### Step 6: Submit to TestFlight

```bash
cd /Users/zack/Desktop/NeuroBloom

# Submit the latest finished build
eas submit --platform ios --latest --non-interactive
```

**Success output:**
```
✔ Submitted your app to Apple App Store Connect!
Your binary has been successfully uploaded to App Store Connect!
```

### Step 7: Verify in App Store Connect

1. Go to: https://appstoreconnect.apple.com/apps/6755899655/testflight/ios
2. Verify build appears with correct version (`1.0.0`) and build number (`X`)

## Quick Reference Commands

```bash
# Check all build numbers at once
grep -r "buildNumber\|CURRENT_PROJECT_VERSION\|CFBundleVersion" app.json app.config.js ios/NeuroBloom.xcodeproj/project.pbxproj ios/NeuroBloom/Info.plist 2>/dev/null

# Check latest build status
eas build:list --platform ios --limit 1 --non-interactive

# Cancel a build
eas build:cancel <build-id> --non-interactive

# Submit to TestFlight
eas submit --platform ios --latest --non-interactive
```

## Common Mistakes

1. **Updating only `app.json`** → Build number mismatch, EAS shows wrong number
2. **Forgetting `app.config.js`** → Build number mismatch
3. **Not updating `project.pbxproj`** → Native iOS project has old build number
4. **Not updating `Info.plist`** → Info.plist has old CFBundleVersion
5. **Not verifying after updating** → Missed one location

## Troubleshooting

### EAS Dashboard Shows Wrong Build Number

**Symptom:** You set build number 28, but EAS shows 25.

**Cause:** Build number not synchronized across all four files.

**Solution:**
1. Cancel the incorrect build: `eas build:cancel <build-id> --non-interactive`
2. Verify all four files have matching numbers (Step 1)
3. Update all four files (Step 2)
4. Verify again (Step 1)
5. Commit and push (Step 3)
6. Start new build (Step 4)

### Build Failed

**Check build logs:**
```bash
# Get build ID from: eas build:list --platform ios --limit 1
eas build:view <build-id>
```

**Common causes:**
- Missing dependencies
- Build configuration errors
- Certificate issues (rare with EAS)

**Solution:** Fix the issue in code, commit, and rebuild.

### Submission Failed

**Check submission status:**
```bash
eas submit --status
```

**Common causes:**
- Build not finished yet (wait for `finished` status)
- Apple Developer Terms not accepted (log into App Store Connect)
- Build already submitted (check TestFlight)

## Project Details

- **EAS Project ID:** `14af3de7-c021-483c-a233-4ff53245bcc1`
- **Bundle Identifier:** `com.neurobloom.app`
- **App Store Connect App ID:** `6755899655`
- **Expo Owner:** `walmerz`
- **Current Version:** `1.0.0`
- **Latest Successful Build:** `27` (Jan 18, 2026)

## Success Criteria

A successful deployment shows:
- ✅ All four files have identical build numbers
- ✅ Build completed with status `finished`
- ✅ EAS dashboard shows correct build number
- ✅ Submission succeeded to App Store Connect
- ✅ Build appears in TestFlight with correct version and build number

## Notes for AI Assistants

When helping deploy NeuroBloom:

1. **ALWAYS check all four build number locations first**
2. **NEVER assume** updating `app.json` alone is sufficient
3. **ALWAYS verify** synchronization after updating
4. **ALWAYS commit and push** before building
5. **ALWAYS verify** build number in EAS dashboard matches expectations
6. **If wrong build number appears, cancel immediately** and fix synchronization

**Remember:** The build number must be identical in all four locations. This is non-negotiable.
