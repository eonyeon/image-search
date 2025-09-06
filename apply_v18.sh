#!/bin/bash
# Fashion Search v18.0 DeepLearning Edition 적용 스크립트

echo "🚀 Fashion Search v18.0 DeepLearning Edition 적용 시작"

# 1. 현재 버전 백업
timestamp=$(date +%Y%m%d_%H%M%S)
cp src/main.js "src/backups/main_v17_3_backup_$timestamp.js"
echo "✅ 이전 버전 백업 완료: main_v17_3_backup_$timestamp.js"

# 2. v18.0 적용
cp src/main_v18_deeplearning.js src/main.js
echo "✅ v18.0 DeepLearning Edition 적용 완료"

# 3. package.json 업데이트 (필요한 경우)
echo "📦 package.json 확인 중..."

# 4. 서버 재시작 안내
echo ""
echo "=========================================="
echo "✅ v18.0 적용 완료!"
echo ""
echo "다음 단계:"
echo "1. Ctrl+C로 현재 서버 중지"
echo "2. npm run tauri:dev 로 재시작"
echo "3. 브라우저에서 강제 새로고침 (Cmd+Shift+R)"
echo ""
echo "⚠️ 중요: DB 스키마가 변경되었습니다!"
echo "   첫 실행 시 '완전 초기화' 버튼을 눌러주세요"
echo "=========================================="
