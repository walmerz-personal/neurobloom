---
description: Build and submit the NeuroBloom iOS app to Apple TestFlight
---

# TestFlight Deployment Workflow

This workflow builds and submits the NeuroBloom iOS app to Apple TestFlight.

## Prerequisites

- All code changes committed to git
- Apple Developer account credentials available
- No pending Apple Terms of Service agreements

## Steps

### 1. Increment Build Number

Open `app.json` and increment the `buildNumber` in the iOS section:
```json
"ios": {
  "buildNumber": "3"  // Increment this (was 2, now 3)
}
```

### 2. Commit Changes

Commit all changes including the updated build number:
```bash
git add -A
git commit -m "Prepare for TestFlight build [BUILD_NUMBER]"
```

Note: Replace `[BUILD_NUMBER]` with the actual build number (e.g., "build 3")

// turbo
### 3. Build for iOS Production

Run the EAS build command:
```bash
eas build --platform ios --profile production
```

**What happens:**
- Prompts for Apple Developer account login
- Creates production build on EAS servers (~10-20 minutes)
- Returns build ID and IPA download URL

**If build fails:**
- Check logs at the provided URL
- See `DEPLOYMENT.md` troubleshooting section
- Common issues: splash image path, jest version, or custom config files

// turbo
### 4. Submit to TestFlight

Once the build completes successfully:
```bash
eas submit --platform ios --latest
```

**What happens:**
- Uploads build to App Store Connect
- Apple processes the build (5-10 minutes)
- You'll receive email when ready

### 5. Verify in App Store Connect

1. Go to https://appstoreconnect.apple.com/apps/6755899655/testflight/ios
2. Confirm new build appears with correct version/build number
3. Once status shows "Ready to Test", you can add testers

### 6. Distribute to Testers

- Select the new build in TestFlight
- Add internal or external testers
- Send invitations

## Quick Reference

```bash
# Check current build number
grep -A 3 '"ios":' app.json

# List recent builds
eas build:list --platform ios --limit 5

# Check submission status
eas submit:list --platform ios

# View build details
eas build:view [BUILD_ID]
```

## Troubleshooting

See `DEPLOYMENT.md` for detailed troubleshooting steps.

Common issues:
- Build fails at prebuild: Check splash image path in app.json
- Build fails at bundle: Ensure app.config.js and babel.config.js don't exist
- Jest version mismatch: Use jest ~29.7.0 in package.json

## Notes

- Build numbers must increment for each submission
- Builds are created from committed code (working directory changes ignored)
- Total time: ~15-30 minutes (build: 10-20 min, submit: 5-10 min)
