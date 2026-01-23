# iOS Device Setup Guide

This guide will help you set up your iPhone for development builds, allowing you to test HealthKit and other device-specific features without deploying to TestFlight.

**Quick Reference:** For the regular testing workflow, see [`TESTING_ON_DEVICE.md`](./TESTING_ON_DEVICE.md)

## Prerequisites

- iPhone running iOS 16 or later
- Mac with Xcode installed
- USB cable to connect iPhone to Mac
- Apple Developer account (free account works for development)

## Step 1: Connect Your iPhone

1. Connect your iPhone to your Mac using a USB cable
2. Unlock your iPhone
3. If prompted, tap "Trust This Computer" on your iPhone
4. Enter your iPhone passcode if requested

## Step 2: Enable Developer Mode

Developer Mode is a security feature introduced in iOS 16 that's required for installing development builds.

### Enable Developer Mode:

1. On your iPhone, open **Settings**
2. Navigate to **Privacy & Security**
3. Scroll down to find **Developer Mode** (it may be near the bottom)
4. Toggle **Developer Mode** to **ON**
5. Your iPhone will prompt you to restart
6. Tap **Restart** to reboot your iPhone
7. After restart, you'll see a warning dialog about Developer Mode
8. Tap **Turn On** to confirm

### If Developer Mode Doesn't Appear:

The Developer Mode option only appears after your device has been connected to Xcode at least once. If you don't see it:

1. Make sure your iPhone is connected and unlocked
2. Open Xcode on your Mac
3. Go to **Window → Devices and Simulators** (or press `Cmd + Shift + 2`)
4. Select your iPhone from the left sidebar
5. Wait for Xcode to recognize your device (may take a minute)
6. Go back to Settings → Privacy & Security on your iPhone
7. Developer Mode should now appear

## Step 3: Configure Code Signing

**Important:** Before building, you must configure code signing in Xcode.

1. Open the project in Xcode:
   ```bash
   open ios/NeuroBloom.xcworkspace
   ```

2. In Xcode:
   - Click on the **NeuroBloom** project (blue icon) in the left sidebar
   - Select the **NeuroBloom** target
   - Click the **Signing & Capabilities** tab
   - Check **"Automatically manage signing"**
   - Select your **Team** from the dropdown
   - If you don't see your team, make sure you're signed in:
     - Go to **Xcode → Settings → Accounts**
     - Add your Apple ID if needed

3. Xcode will automatically create a provisioning profile. Wait for it to complete.

## Step 4: Verify Setup

### Check Device in Xcode:

1. Open Xcode
2. Go to **Window → Devices and Simulators**
3. Your iPhone should appear in the left sidebar
4. It should show as "Ready" or "Connected" without any error messages

### Test with a Build:

1. **Important:** Make sure your Mac and iPhone are on the same Wi-Fi network
2. In your terminal, navigate to the NeuroBloom project directory
3. Run: `npm run ios:device`
4. The build should proceed without Developer Mode or code signing errors
5. After installation, Metro bundler will start automatically
6. The app should connect to Metro and load

**If you see "No script URL provided" error:**
- Make sure Metro bundler is running (it should start automatically)
- Ensure both devices are on the same Wi-Fi network
- Try shaking your device and selecting "Configure Bundler" to manually enter your Mac's IP address
- Or start Metro manually: `npx expo start` in a separate terminal, then reload the app

## Troubleshooting

### Developer Mode Still Not Working

**Issue:** Developer Mode is enabled but you still get errors

**Solutions:**
- Disconnect and reconnect your iPhone
- Restart both your iPhone and Mac
- In Xcode, go to Devices and Simulators and remove your device, then reconnect
- Make sure your iPhone is unlocked during the build process

### "Developer Mode disabled" Error Persists

**Issue:** You've enabled Developer Mode but still see the error

**Solutions:**
1. Double-check that Developer Mode is actually ON in Settings
2. Make sure you completed the restart and confirmed the warning dialog
3. Try toggling Developer Mode OFF and then ON again
4. Check that your iPhone is unlocked and not in sleep mode

### Device Not Recognized

**Issue:** Xcode doesn't see your iPhone

**Solutions:**
- Try a different USB cable
- Try a different USB port
- Make sure "Trust This Computer" was confirmed on your iPhone
- Check that your iPhone isn't locked
- Restart both devices

### Build Fails with Code Signing Errors

**Issue:** Build fails with error: "No profiles for 'com.neurobloom.app' were found"

**This is the most common issue after enabling Developer Mode.**

**Solutions:**

1. **Sign in to Xcode with your Apple ID:**
   - Open Xcode
   - Go to **Xcode → Settings** (or **Preferences** on older versions)
   - Click the **Accounts** tab
   - Click the **+** button and add your Apple ID
   - Make sure your account appears in the list

2. **Configure Automatic Signing in Xcode:**
   - Open the project in Xcode: `open ios/NeuroBloom.xcworkspace`
   - In the left sidebar, click on the **NeuroBloom** project (blue icon)
   - Select the **NeuroBloom** target
   - Click the **Signing & Capabilities** tab
   - Check **"Automatically manage signing"**
   - Select your **Team** from the dropdown (should show your Apple ID/team name)
   - Xcode will automatically create a provisioning profile

3. **If you see errors in Xcode:**
   - Click **"Try Again"** if Xcode shows a signing error
   - Make sure your Apple ID has the correct permissions
   - You may need to accept the Apple Developer Agreement at [developer.apple.com](https://developer.apple.com)

4. **Verify the fix:**
   - After configuring signing, try building again: `npm run ios:device`
   - The build should now proceed past the code signing step

**Note:** Free Apple IDs can create development provisioning profiles, but you may need to accept the developer agreement online first.

## Alternative: Using Expo Development Build

If you continue to have issues with direct device builds, you can use Expo's development build:

1. Build a development client: `eas build --profile development --platform ios`
2. Install it on your device via TestFlight or direct install
3. Run `npx expo start --dev-client` to connect to the development server

Note: This still requires Developer Mode to be enabled.

## Additional Resources

- [Apple's Developer Mode Documentation](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device)
- [Expo Development Builds](https://docs.expo.dev/development/introduction/)
- [Xcode Device Setup](https://developer.apple.com/documentation/xcode/installing-additional-simulator-runtimes)

## Quick Reference

**Enable Developer Mode:**
```
Settings → Privacy & Security → Developer Mode → ON → Restart → Confirm
```

**Run on Device:**
```bash
npm run ios:device
```

**Check Device Status:**
```bash
xcrun xctrace list devices
```
