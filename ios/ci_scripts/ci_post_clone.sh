#!/bin/sh

# Fail fast if any command fails
set -e

# Turn on verbose command logging
set -x

echo "🔍 CI Script started running..."

# 1. Install Node.js (required for npm install)
echo "🍺 Installing Node.js..."
brew install node

# 2. Navigate to the project root (where package.json is)
# Script is in: /Volumes/workspace/repository/ios/ci_scripts
# cd ..   -> /Volumes/workspace/repository/ios
# cd ../.. -> /Volumes/workspace/repository
cd ../..

echo "📂 Current directory: $(pwd)"

# 3. Install dependencies
echo "📦 Installing Node dependencies..."
npm install

# 4. Navigate back to iOS directory for Pods
cd ios

# 5. Install CocoaPods
echo "🍎 Installing CocoaPods..."
pod install

echo "✅ Ready to build!"
