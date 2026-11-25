#!/usr/bin/env bash
# Builds the release APK and the update manifest the app checks (GET /api/mobile/latest).
# Before running: raise "version" and "android.versionCode" in app.json (versionCode must always go up).
# Usage: scripts/release-android.sh "What's new in this build"
set -euo pipefail
cd "$(dirname "$0")/.."
NOTES="${1:-}"
VERSION=$(node -p "require('./app.json').expo.version")
CODE=$(node -p "require('./app.json').expo.android.versionCode")
export NODE_ENV=production
(cd android && ./gradlew assembleRelease)
mkdir -p dist
cp android/app/build/outputs/apk/release/app-release.apk "dist/crewdesk-${VERSION}-${CODE}.apk"
node -e '
const [v, c, n] = process.argv.slice(1);
require("fs").writeFileSync("dist/latest.json", JSON.stringify({ versionCode: Number(c), version: v, url: "/api/mobile/download", notes: n || null, mandatory: false }, null, 2) + "\n");
' "$VERSION" "$CODE" "$NOTES"
echo "Built dist/crewdesk-${VERSION}-${CODE}.apk and dist/latest.json"
echo "Copy both to the backend's mobile release folder so /api/mobile/latest and /api/mobile/download serve them."
