#!/bin/bash
# Script to run NeuroBloom on a connected iPhone device
# This allows testing HealthKit features without deploying to TestFlight

echo "🔍 Checking for connected iOS devices..."
echo ""

# List available devices and check for Developer Mode issues
DEVICE_OUTPUT=$(xcrun xctrace list devices 2>/dev/null | grep -i "iphone" | grep -v "Simulator")

if [ -z "$DEVICE_OUTPUT" ]; then
    echo "❌ No physical iPhone devices found."
    echo ""
    echo "Please:"
    echo "1. Connect your iPhone via USB"
    echo "2. Unlock your iPhone"
    echo "3. Trust this computer if prompted"
    echo "4. Run this script again"
    exit 1
fi

echo ""
echo "✅ Found connected device(s)"
echo ""

# Check for Developer Mode issues by attempting to list destinations
# This will show if Developer Mode is disabled
DEV_MODE_CHECK=$(xcodebuild -showdestinations -workspace ios/NeuroBloom.xcworkspace -scheme NeuroBloom 2>&1 | grep -i "Developer Mode" || true)

if [ -n "$DEV_MODE_CHECK" ] && echo "$DEV_MODE_CHECK" | grep -qi "disabled"; then
    echo "⚠️  Developer Mode is disabled on your iPhone"
    echo ""
    echo "To enable Developer Mode:"
    echo "1. On your iPhone, go to: Settings → Privacy & Security → Developer Mode"
    echo "2. Toggle Developer Mode ON"
    echo "3. Restart your iPhone when prompted"
    echo "4. After restart, confirm the warning dialog"
    echo "5. Run this script again"
    echo ""
    echo "📖 For detailed instructions, see: docs/DEVICE_SETUP.md"
    echo ""
    echo "Note: Developer Mode is required for iOS 16+ devices to install development builds."
    exit 1
fi

# Additional check: try to get device list with xcodebuild to catch other issues
XCODEBUILD_DEVICES=$(xcodebuild -showdestinations -workspace ios/NeuroBloom.xcworkspace -scheme NeuroBloom 2>&1 | grep -i "iphone" | grep -v "Simulator" || true)

if [ -z "$XCODEBUILD_DEVICES" ]; then
    echo "⚠️  Could not verify device availability with Xcode"
    echo "   This might indicate Developer Mode or other setup issues"
    echo ""
    echo "Please ensure:"
    echo "1. Developer Mode is enabled (Settings → Privacy & Security → Developer Mode)"
    echo "2. Your iPhone is unlocked"
    echo "3. You've trusted this computer"
    echo ""
    echo "📖 For detailed instructions, see: docs/DEVICE_SETUP.md"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🚀 Starting Expo build for device..."
echo "   This will build and install the app directly on your iPhone"
echo "   (No TestFlight required!)"
echo ""

cd "$(dirname "$0")/.."

# Check if Xcode workspace exists
if [ ! -f "ios/NeuroBloom.xcworkspace/contents.xcworkspacedata" ]; then
    echo "⚠️  Xcode workspace not found. Running pod install..."
    cd ios && pod install && cd ..
fi

# Run expo with device flag
# Note: If you get code signing errors, see docs/DEVICE_SETUP.md
# The --device flag will build and install, then start Metro bundler
# Make sure your Mac and iPhone are on the same Wi-Fi network
echo ""
echo "📱 Building and installing app..."
echo "   After installation, Metro bundler will start automatically"
echo "   Make sure your Mac and iPhone are on the same Wi-Fi network"
echo ""

npx expo run:ios --device
