#!/bin/bash
# 실행 권한: chmod +x install.sh

echo "🔧 이미지 검색 데스크톱 앱 재설치"
echo "================================"

# 1. 기존 node_modules 삭제
echo "🗑️  기존 설치 파일 삭제 중..."
rm -rf node_modules package-lock.json

# 2. npm 캐시 정리
echo "🧹 npm 캐시 정리 중..."
npm cache clean --force

# 3. 의존성 재설치
echo "📦 의존성 설치 중..."
npm install

# 4. 성공 여부 확인
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 설치 성공!"
    echo ""
    echo "다음 명령어로 개발 서버를 시작하세요:"
    echo "  npm run tauri:dev"
else
    echo ""
    echo "❌ 설치 실패!"
    echo "문제가 지속되면 다음을 시도하세요:"
    echo "  npm install --legacy-peer-deps"
fi
