# Testing on iPhone - Quick Reference Guide

This guide covers the complete workflow for testing NeuroBloom on your physical iPhone without using TestFlight.

## One-Time Setup (Do This Once)

### 1. Enable Developer Mode on iPhone
- Settings → Privacy & Security → Developer Mode → **ON**
- Restart iPhone when prompted
- Confirm the warning dialog after restart

### 2. Configure Code Signing in Xcode
```bash
open ios/NeuroBloom.xcworkspace
```
- Click **NeuroBloom** project (blue icon) in left sidebar
- Select **NeuroBloom** target
- Go to **Signing & Capabilities** tab
- Check **"Automatically manage signing"**
- Select your **Team** (should show your Apple ID)
- Wait for Xcode to create provisioning profile (checkmark appears)

### 3. Verify Setup
- Connect iPhone via USB
- Unlock iPhone
- Trust computer if prompted
- In Xcode: Window → Devices and Simulators
- Your iPhone should appear as "Ready" or "Connected"

## Regular Testing Workflow

### Quick Start (Every Time You Want to Test)

1. **Connect iPhone via USB** and unlock it

2. **Make sure Mac and iPhone are on the same Wi-Fi network**

3. **Run the build script:**
   ```bash
   npm run ios:device
   ```
   
   Or use the helper script:
   ```bash
   ./scripts/run-on-device.sh
   ```

4. **Wait for build to complete** - The app will:
   - Build the native code
   - Install on your iPhone
   - Start Metro bundler automatically

5. **If you see "No script URL" error:**
   - Shake your iPhone to open developer menu
   - Tap **"Reload JS"** or **"Configure Bundler"**
   - If configuring manually, enter your Mac's IP address
   - Tap **"Reload"**

6. **The app should now load and work!**

## Quick Commands Reference

```bash
# Build and install on device
npm run ios:device

# Start Metro bundler manually (if needed)
npx expo start

# Open Xcode project
open ios/NeuroBloom.xcworkspace

# Check connected devices
xcrun xctrace list devices
```

## Troubleshooting

### "Developer Mode disabled" Error
- Go to Settings → Privacy & Security → Developer Mode
- Make sure it's **ON**
- Restart iPhone if needed

### "No profiles found" / Code Signing Error
- Open Xcode: `open ios/NeuroBloom.xcworkspace`
- Go to Signing & Capabilities
- Ensure "Automatically manage signing" is checked
- Select your Team
- See `docs/DEVICE_SETUP.md` for detailed steps

### "No script URL provided" Error
- Make sure Mac and iPhone are on same Wi-Fi
- Shake device → Tap "Reload JS"
- Or start Metro manually: `npx expo start`
- Then reload the app

### Device Not Recognized
- Disconnect and reconnect USB cable
- Unlock iPhone
- Trust computer if prompted
- Restart both devices if needed

### Build Fails
- Check Xcode for signing errors
- Make sure you're signed in: Xcode → Settings → Accounts
- Verify Developer Mode is enabled on iPhone

## What This Enables

✅ Test HealthKit features (requires real device)  
✅ Test device-specific features  
✅ Faster iteration than TestFlight  
✅ No EAS build credits used  
✅ Direct installation on device  

## Notes

- **First build takes longer** (compiles native code)
- **Subsequent builds are faster** (incremental)
- **Keep iPhone unlocked** during build process
- **Same Wi-Fi network required** for Metro bundler connection
- **Developer Mode must stay enabled** (you'll see a warning on iPhone lock screen - this is normal)

## Full Documentation

For detailed setup instructions and troubleshooting, see:
- `docs/DEVICE_SETUP.md` - Complete setup guide
- `scripts/run-on-device.sh` - Helper script with checks

## When You Ask Me to Remind You

Just say: **"How do I test on my iPhone?"** or **"Remind me how to test locally"**

I'll walk you through:
1. Connect iPhone via USB
2. Run `npm run ios:device`
3. If Metro connection fails, shake device and reload
