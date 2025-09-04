#!/bin/bash
# 실행 권한: chmod +x create-icons.sh

echo "🎨 이미지 검색 데스크톱 아이콘 생성 스크립트"

# 아이콘 디렉토리 생성
mkdir -p src-tauri/icons

# macOS인 경우 시스템 아이콘 사용
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 macOS: 시스템 아이콘에서 생성 중..."
    sips -s format png --resampleWidth 512 --resampleHeight 512 \
      /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns \
      --out src-tauri/icons/icon.png
else
    echo "🌐 Linux/Windows: 기본 아이콘 다운로드 중..."
    curl -o src-tauri/icons/icon.png "https://via.placeholder.com/512x512/4A90E2/FFFFFF?text=Search"
fi

# Tauri 아이콘 생성
echo "⚙️ 모든 플랫폼 아이콘 생성 중..."
npx tauri icon src-tauri/icons/icon.png

echo "✅ 아이콘 생성 완료!"
ls -la src-tauri/icons/
