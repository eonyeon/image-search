#!/bin/bash

echo "🚀 Image Search v9.0 설치 스크립트"
echo "=================================="

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 오류: image-search-desktop 폴더에서 실행해주세요"
    exit 1
fi

# 백업 생성
echo "📦 기존 버전 백업 중..."
cp src/main.js src/main.js.backup_v8_$(date +%Y%m%d_%H%M%S)
echo "✅ 백업 완료"

# v9.0 설치
echo "🔧 v9.0 설치 중..."
if [ -f "src/main-v9-improved.js" ]; then
    cp src/main-v9-improved.js src/main.js
    echo "✅ v9.0 설치 완료"
else
    echo "❌ 오류: src/main-v9-improved.js 파일을 찾을 수 없습니다"
    exit 1
fi

echo ""
echo "✨ v9.0 설치 완료!"
echo ""
echo "앱을 재시작하려면 수동으로 실행하세요:"
echo "  npm run tauri:dev"
echo ""
echo "다음 단계:"
echo "1. 앱 실행 후 콘솔(F12)에서: brandApp.clearDB()"
echo "2. 이미지 폴더 재인덱싱"
echo "3. LV 가방으로 테스트"
echo ""
echo "새로운 기능:"
echo "- LV 모노그램 전용 감지 (HSV 색공간)"
echo "- Chanel 퀼팅 전용 감지 (다이아몬드 패턴)"
echo "- 그리드 기반 반복 패턴 분석"
echo "- 브랜드 간 강력한 페널티 적용"
