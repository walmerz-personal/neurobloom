---
description: Build and submit the NeuroBloom iOS app to Apple TestFlight
---

# TestFlight Deployment Workflow

This workflow builds and submits the NeuroBloom iOS app to Apple TestFlight.
Two methods are available: **Remote Build (EAS)** or **Local Build (xcodebuild)**.

## Prerequisites

- All code changes committed to git
- Apple Developer account credentials available
- No pending Apple Terms of Service agreements

---

## Method 1: Remote Build (EAS Cloud) - Recommended

Use this method when you have EAS build credits available.

### 1. Increment Build Number

Open `app.config.js` and increment the `buildNumber`:

```javascript
ios: {
  buildNumber: "12"  // Increment this for each submission
}
```

### 2. Commit Changes

```bash
git add -A
git commit -m "Prepare for TestFlight build X"
```

// turbo

### 3. Build for iOS Production

```bash
eas build --platform ios --profile production
```

// turbo

### 4. Submit to TestFlight

```bash
eas submit --platform ios --latest
```

---

## Method 2: Local Build (xcodebuild) - When EAS Credits Exhausted

Use this method for local iOS builds when EAS cloud credits are unavailable.

### Prerequisites (One-Time Setup)

1. **Install Fastlane and CocoaPods:**

   ```bash
   brew install fastlane
   sudo gem install cocoapods
   ```

2. **Download and install certificates via EAS:**

   ```bash
   npx eas credentials --platform ios
   ```

   - Select "Download credentials"
   - Download both the distribution certificate (.p12) and provisioning profile

3. **Import certificate to Keychain:**
   - Double-click the downloaded `.p12` file
   - Enter the password from EAS credentials output
   - Ensure it appears in Keychain Access → login → My Certificates

4. **Grant codesign access to the certificate's private key:**
   - Open Keychain Access
   - Find the "iPhone Distribution: Zachary Walmer" certificate in My Certificates
   - Expand it (▶) to reveal the private key
   - Double-click the private key → Access Control tab
   - Add `codesign` and `security` to allowed applications (or "Allow all applications")
   - Save changes

5. **Install Apple WWDR certificates to System keychain:**

   ```bash
   curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
   curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
   curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG6.cer
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain AppleWWDRCAG3.cer
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain AppleWWDRCAG4.cer
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain AppleWWDRCAG6.cer
   ```

6. **Install provisioning profile:**

   ```bash
   cp /path/to/downloaded/profile.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/
   ```

### Build Steps

### 1. Increment Build Number

Open `app.config.js` and increment `buildNumber`.

### 2. Regenerate iOS Project

```bash
cd /Users/zack/Desktop/NeuroBloom
rm -rf ios
npx expo prebuild --platform ios --clean
```

### 3. Update Project Signing Settings

The project needs manual signing configured. After prebuild, run:

```bash
# Add ProvisioningStyle = Manual to target attributes
sed -i '' 's/13B07F861A680F5B00A75B9A = {/13B07F861A680F5B00A75B9A = {\n                                                DevelopmentTeam = Y885MQBBP4;\n                                                ProvisioningStyle = Manual;/g' ios/NeuroBloom.xcodeproj/project.pbxproj

# Add CODE_SIGN_IDENTITY and DEVELOPMENT_TEAM to Release configuration
sed -i '' 's/CODE_SIGN_ENTITLEMENTS = NeuroBloom\/NeuroBloom.entitlements;/CODE_SIGN_ENTITLEMENTS = NeuroBloom\/NeuroBloom.entitlements;\n                                CODE_SIGN_IDENTITY = "Apple Distribution";\n                                "CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";\n                                DEVELOPMENT_TEAM = Y885MQBBP4;/g' ios/NeuroBloom.xcodeproj/project.pbxproj
```

### 4. Find Your Provisioning Profile Name

```bash
for f in ~/Library/MobileDevice/Provisioning\ Profiles/*.mobileprovision; do
  security cms -D -i "$f" 2>/dev/null | grep -A1 "Name"
done
```

Copy the profile name (e.g., `*[expo] com.neurobloom.app AppStore 2025-12-06T03:25:25.563Z`)

### 5. Add Provisioning Profile to Project

Replace `YOUR_PROFILE_NAME` with your actual profile name:

```bash
PROFILE_NAME="*[expo] com.neurobloom.app AppStore 2025-12-06T03:25:25.563Z"
sed -i '' "s/DEVELOPMENT_TEAM = Y885MQBBP4;/DEVELOPMENT_TEAM = Y885MQBBP4;\n                                PROVISIONING_PROFILE_SPECIFIER = \"$PROFILE_NAME\";/g" ios/NeuroBloom.xcodeproj/project.pbxproj
```

### 6. Archive the App

```bash
cd ios
xcodebuild archive \
  -workspace NeuroBloom.xcworkspace \
  -scheme NeuroBloom \
  -archivePath ./build/NeuroBloom.xcarchive \
  -configuration Release
```

This takes ~20-30 minutes. Wait for `** ARCHIVE SUCCEEDED **`

### 7. Create Export Options

Create `ExportOptions.plist` in the project root (update profile name if needed):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>Y885MQBBP4</string>
    <key>uploadSymbols</key>
    <true/>
    <key>destination</key>
    <string>upload</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.neurobloom.app</key>
        <string>*[expo] com.neurobloom.app AppStore 2025-12-06T03:25:25.563Z</string>
    </dict>
</dict>
</plist>
```

### 8. Export and Upload to TestFlight

```bash
cd /Users/zack/Desktop/NeuroBloom
xcodebuild -exportArchive \
  -archivePath ios/build/NeuroBloom.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ios/build/export
```

Wait for `** EXPORT SUCCEEDED **` - this uploads directly to App Store Connect!

### 9. Verify in App Store Connect

Check <https://appstoreconnect.apple.com> - the build should appear in TestFlight within 10-30 minutes.

---

## Quick Reference

```bash
# Check current build number
grep buildNumber app.config.js

# List EAS builds
eas build:list --platform ios --limit 5

# Check local archive
ls -la ios/build/NeuroBloom.xcarchive

# Verify signing identity
security find-identity -p codesigning -v
```

## Troubleshooting

### Certificate chain error (`errSecInternalComponent`)

- Ensure Apple WWDR certs are in System keychain (see Prerequisites step 5)
- Grant codesign access to private key (see Prerequisites step 4)

### "Provisioning profile not found"

- Re-download via `npx eas credentials --platform ios`
- Copy to `~/Library/MobileDevice/Provisioning Profiles/`
- Update profile name in project.pbxproj and ExportOptions.plist

### "Conflicting provisioning settings"

- Run the sed commands in step 3 to set manual signing

## Notes

- Build numbers must increment for each submission
- Local builds bypass EAS credit limits
- Total local build time: ~25-40 minutes
