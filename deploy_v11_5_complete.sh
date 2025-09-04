#!/bin/bash

# 🚀 v11.5 진단 버전 완전 배포

echo "🚀 v11.5 진단 버전 완전 배포"
echo "============================"
echo ""

# 1. main.js 업데이트
echo "1️⃣ main.js 업데이트..."
cp src/main_v11_5_diagnostic.js src/main.js
echo "   ✅ 완료"

# 2. 권한 설정
echo "2️⃣ 스크립트 권한 설정..."
chmod +x *.sh
echo "   ✅ 완료"

# 3. Git 커밋
echo "3️⃣ Git 커밋..."
git add .
git commit -m "v11.5: Complete diagnostic version with console page and devtools enabled

Features:
- Enable devtools in tauri.conf.json
- Add diagnostic console page (console.html)
- Add in-app diagnostics button
- Add showDiagnostics() for popup diagnostics
- Detailed logging for 100% similarity bug
- Memory leak prevention
- Array copy fixes

How to diagnose:
1. Use diagnostic console button in index mode
2. Or right-click and run: fashionApp.showDiagnostics()
3. Check if similarity is 99.9% (bug) or 40-80% (normal)"

echo "   ✅ 커밋 완료"

# 4. GitHub 푸시
echo "4️⃣ GitHub 푸시..."
git push origin main
echo "   ✅ 푸시 완료"

echo ""
echo "========================================="
echo "✅ v11.5 배포 완료!"
echo "========================================="
echo ""
echo "📋 다음 단계:"
echo ""
echo "1. 빌드 대기 (10-15분)"
echo "   🔗 https://github.com/eonyeon/image-search/actions"
echo ""
echo "2. Windows에서 새 .msi 다운로드 및 설치"
echo ""
echo "3. 진단 방법 (3가지 중 선택):"
echo "   a) 인덱싱 모드 → '진단 콘솔' 버튼"
echo "   b) Ctrl+Shift+I 또는 우클릭 → 검사"
echo "   c) 콘솔에서: fashionApp.showDiagnostics()"
echo ""
echo "4. 유사도 확인:"
echo "   - 99.9% = 🔴 버그"
echo "   - 40-80% = 🟢 정상"
echo ""
echo "5. 버그 있으면:"
echo "   - DB 초기화"
echo "   - 재인덱싱"
echo "   - 결과 공유"
echo ""
echo "📚 문서:"
echo "   - PROJECT_OVERVIEW.md"
echo "   - DIAGNOSTICS_WITHOUT_F12.md"
echo "   - TROUBLESHOOTING_GUIDE.md"
echo ""
echo "🎯 목표: 100% 버그 원인 파악!"
