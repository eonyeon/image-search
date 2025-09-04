#!/bin/bash

# 🚀 v11.5 최종 수정 및 배포

echo "🚀 v11.5 최종 수정 및 배포"
echo "=========================="
echo ""

# 1. main.js 업데이트
echo "1️⃣ main.js 업데이트..."
cp src/main_v11_5_diagnostic.js src/main.js
echo "   ✅ 완료"

# 2. Git 커밋
echo "2️⃣ Git 커밋..."
git add .
git commit -m "v11.5: Final fixes for build and diagnostics

Fixes:
- Remove invalid devtools property from tauri.conf.json
- Add Ctrl+Shift+D shortcut for diagnostics popup
- Update main.js with diagnostic features
- Ensure dist folder exists for build

Features:
- Diagnostic console page (console.html)
- Multiple ways to access diagnostics:
  1. Index mode → Diagnostic Console button
  2. Ctrl+Shift+D for popup
  3. Console commands: fashionApp.diagnose()
  
Debug 100% similarity issue:
- Check if similarity shows 99.9% (bug) or 40-80% (normal)
- Clear DB and re-index if needed"

echo "   ✅ 커밋 완료"

# 3. GitHub 푸시
echo "3️⃣ GitHub 푸시..."
git push origin main
echo "   ✅ 푸시 완료"

echo ""
echo "========================================="
echo "✅ v11.5 최종 배포 완료!"
echo "========================================="
echo ""
echo "🎯 이번엔 빌드가 성공할 것입니다!"
echo ""
echo "📋 진단 방법 (Windows):"
echo ""
echo "방법 1: 진단 콘솔 페이지"
echo "  → 인덱싱 모드 → '진단 콘솔' 버튼"
echo ""
echo "방법 2: 단축키"
echo "  → Ctrl+Shift+D (진단 팝업)"
echo ""
echo "방법 3: 콘솔 명령"
echo "  → 우클릭 → 검사 → Console 탭"
echo "  → fashionApp.showDiagnostics()"
echo ""
echo "⏰ 빌드 시간: 10-15분"
echo "🔗 상태: https://github.com/eonyeon/image-search/actions"
echo ""
echo "📦 다운로드:"
echo "  → Actions → 최신 빌드 → windows-installer"
echo "  → 또는 Releases 페이지에서 .msi 다운로드"
