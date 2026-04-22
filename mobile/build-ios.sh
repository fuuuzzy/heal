#!/bin/bash

# --- 配置区 ---
PROJECT_NAME="HealSavings"
SCHEME="HealSavings"
CONFIGURATION="Release"
EXPORT_PATH="./build-ios"

# --- 参数解析 ---
TEAM_ID=""
usage() {
    echo "Usage: $0 -t <TEAM_ID>"
    echo "  -t: Apple Team ID (e.g., 12345ABCDE)"
    echo ""
    echo "或者不提供参数，生成项目后在 Xcode 中手动配置签名"
    exit 1
}

while getopts "t:" opt; do
    case ${opt} in
        t ) TEAM_ID=$OPTARG ;;
        * ) usage ;;
    esac
done

echo ">>> Starting Build for $PROJECT_NAME"

# 1. 清理
rm -rf "$EXPORT_PATH"
mkdir -p "$EXPORT_PATH"
rm -rf ios
npx expo prebuild --platform ios

# 如果没有提供 Team ID，提示用户在 Xcode 中配置
if [ -z "$TEAM_ID" ]; then
    echo ""
    echo "✅ iOS 原生项目已生成！"
    echo ""
    echo "后续步骤："
    echo "1. 打开 Xcode: open ios/$PROJECT_NAME.xcworkspace"
    echo "2. 选择 Signing & Capabilities"
    echo "3. 选择你的 Team"
    echo "4. 点击 Product > Archive"
    echo "5. 分发到 App Store 或 TestFlight"
    echo ""
    exit 0
fi

echo ">>> Team ID: $TEAM_ID"

# 2. 生成 ExportOptions.plist
cat <<EOF > "$EXPORT_PATH/ExportOptions.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

# 3. Archive
echo ">>> Archiving..."
xcodebuild archive \
    -workspace "ios/$PROJECT_NAME.xcworkspace" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$EXPORT_PATH/$PROJECT_NAME.xcarchive" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    -allowProvisioningUpdates

# 4. Export IPA
echo ">>> Exporting IPA..."
xcodebuild -exportArchive \
    -archivePath "$EXPORT_PATH/$PROJECT_NAME.xcarchive" \
    -exportOptionsPlist "$EXPORT_PATH/ExportOptions.plist" \
    -exportPath "$EXPORT_PATH" \
    -allowProvisioningUpdates

echo ">>> Build Finished! IPA location: $EXPORT_PATH"
