#!/bin/bash

echo "🚀 이미지 검색 데스크톱 앱 초기 설정"
echo "=================================="

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 2. 아이콘 생성 확인
if [ ! -f "src-tauri/icons/icon.png" ]; then
    echo "🎨 아이콘 생성 중..."
    ./create-icons.sh
else
    echo "✅ 아이콘이 이미 존재합니다."
fi

# 3. 개발 서버 실행
echo ""
echo "✨ 설정 완료!"
echo "개발 서버를 시작하려면 다음 명령어를 실행하세요:"
echo ""
echo "  npm run tauri:dev"
echo ""
echo "프로덕션 빌드를 만들려면:"
echo ""
echo "  npm run build:safe"
echo ""
