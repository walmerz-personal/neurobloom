#!/bin/sh

# Fail fast if any command fails
set -e

# Turn on verbose command logging
set -x

echo "🔍 CI Script started running..."


# Navigate to the workspace root (one level up from ci_scripts)
cd ..

# Log current node version
node -v
npm -v

# Install dependencies
echo "📦 Installing Node dependencies..."
npm install

# Navigate to iOS directory
cd ios

# Install CocoaPods
echo "🍎 Installing CocoaPods..."
pod install

echo "✅ Ready to build!"
