#!/bin/bash

# 🔧 tauri.conf.json 에러 수정

echo "🔧 tauri.conf.json 에러 수정"
echo "============================="
echo ""

# Git 커밋
echo "📦 변경사항 커밋..."
git add .
git commit -m "fix: remove invalid devtools property from tauri.conf.json

- Remove 'devtools' from windows config (not supported)
- Keep diagnostic console page for debugging
- Developer tools can still be accessed via Ctrl+Shift+I in dev builds"

# 푸시
echo "🚀 GitHub 푸시..."
git push origin main

echo ""
echo "✅ 수정 완료!"
echo ""
echo "📋 변경 내용:"
echo "  • devtools 속성 제거 (지원 안됨)"
echo "  • 진단 콘솔은 유지"
echo "  • 개발자 도구는 단축키로 접근"
echo ""
echo "⏰ 빌드 재시작..."
echo "🔗 https://github.com/eonyeon/image-search/actions"
echo ""
echo "💡 개발자 도구 여는 방법:"
echo "  1. 진단 콘솔 페이지 사용 (권장)"
echo "  2. Ctrl+Shift+I 시도"
echo "  3. 우클릭 → 검사"
