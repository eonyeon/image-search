#!/bin/bash
# 가방 특화 검색 시스템 v6.0 설치 스크립트

echo "👜 Bag Search v6.0 설치 시작..."
echo ""

# 1. 백업
echo "📦 기존 파일 백업 중..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp src/main.js $BACKUP_DIR/main.js.backup 2>/dev/null || true
echo "✅ 백업 완료: $BACKUP_DIR"

# 2. 새 버전 적용
echo ""
echo "📝 가방 특화 버전 적용 중..."
cp src/main-v6-bag-optimized.js src/main.js
echo "✅ main.js 업데이트 완료"

# 3. 완료 메시지
echo ""
echo "========================================="
echo "✅ Bag Search v6.0 설치 완료!"
echo "========================================="
echo ""
echo "🎯 주요 개선사항:"
echo "  • 가방 형태 분석 (토트백, 숄더백, 클러치 구분)"
echo "  • 색상 패턴 감지 (모노그램, 체크 등)"
echo "  • 금속 하드웨어 감지 (금/은색)"
echo "  • 형태 기반 35% 가중치 (가장 중요)"
echo "  • 파일명 브랜드 추출 제거"
echo ""
echo "📋 다음 단계:"
echo "  1. npm run tauri:dev 실행"
echo "  2. 데이터베이스 초기화 클릭"
echo "  3. 이미지 폴더 재인덱싱"
echo "  4. 검색 테스트"
echo ""
echo "💡 콘솔 명령어:"
echo "  bagSearchApp.getVersion() - 버전 정보"
echo "  bagSearchApp.getStats() - 통계 보기"
echo "  bagSearchApp.clearDB() - DB 초기화"
echo ""