#!/bin/bash

# 🔧 진단 콘솔 버튼 수정

echo "🔧 진단 콘솔 버튼 수정"
echo "====================="
echo ""

# 1. main.js 업데이트
echo "1️⃣ main.js 업데이트..."
cp src/main_v11_5_1_improved.js src/main.js
echo "   ✅ 완료"

# 2. Git 커밋
echo "2️⃣ Git 커밋..."
git add .
git commit -m "fix: diagnostic console button - prevent app restart

- Button now calls showDiagnostics() directly instead of navigating
- Added showDiagnosticsInPage() for in-page display option  
- Improved diagnostic popup formatting
- No more app restart when clicking diagnostic button

How to diagnose:
1. Click 'Diagnostic Console' button → popup appears
2. Console: fashionApp.showDiagnostics()
3. In-page panel: fashionApp.showDiagnosticsInPage()"

# 3. 푸시
echo "3️⃣ GitHub 푸시..."
git push origin main

echo ""
echo "✅ 수정 완료!"
echo ""
echo "📋 변경 내용:"
echo "  • 진단 콘솔 버튼이 앱을 재시작하지 않음"
echo "  • 팝업으로 진단 결과 표시"
echo "  • 페이지 내 진단 패널 옵션 추가"
echo ""
echo "🎯 진단 방법 (3가지):"
echo ""
echo "1. 버튼 클릭:"
echo "   인덱싱 모드 → '진단 콘솔' 버튼 → 팝업"
echo ""
echo "2. 콘솔 명령 (팝업):"
echo "   fashionApp.showDiagnostics()"
echo ""
echo "3. 콘솔 명령 (페이지 내):"
echo "   fashionApp.showDiagnosticsInPage()"
echo ""
echo "⏰ 빌드: 10-15분"
echo "🔗 https://github.com/eonyeon/image-search/actions"
