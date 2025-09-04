#!/bin/bash

# 🔧 빌드 수정 및 재시도

echo "🔧 GitHub Actions 빌드 수정"
echo "==========================="
echo ""

# 1. dist 폴더 생성
echo "1️⃣ dist 폴더 확인/생성..."
if [ ! -d "dist" ]; then
    mkdir -p dist
    echo "   ✅ dist 폴더 생성됨"
else
    echo "   ✅ dist 폴더 존재"
fi

# dist/.gitkeep 파일 생성 (빈 폴더 커밋용)
touch dist/.gitkeep

# 2. 필요한 파일 복사
echo "2️⃣ 필요 파일 dist로 복사..."
cp index.html dist/ 2>/dev/null || echo "   ⚠️ index.html 없음"
cp console.html dist/ 2>/dev/null || echo "   ⚠️ console.html 없음"
echo "   ✅ 완료"

# 3. Git 커밋
echo "3️⃣ Git 커밋..."
git add .
git commit -m "fix: GitHub Actions build - fix tauri build command and ensure dist folder

- Remove unnecessary -- from build command  
- Ensure dist folder exists before build
- Copy HTML files to dist
- Add fallback build methods
- Improve build output debugging
- Update to v11.5.0"

# 4. 푸시
echo "4️⃣ GitHub 푸시..."
git push origin main

echo ""
echo "========================================="
echo "✅ 빌드 수정 완료!"
echo "========================================="
echo ""
echo "📋 수정 내용:"
echo "  • npm run tauri:build -- --verbose → npm run tauri build"
echo "  • dist 폴더 생성 보장"
echo "  • HTML 파일 복사 추가"
echo "  • 빌드 출력 디버깅 강화"
echo "  • v11.5.0으로 버전 업데이트"
echo ""
echo "⏰ 예상 시간: 10-15분"
echo ""
echo "🔗 빌드 상태 확인:"
echo "   https://github.com/eonyeon/image-search/actions"
echo ""
echo "💡 이번엔 .msi 파일이 생성될 것입니다!"
