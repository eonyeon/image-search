#!/bin/bash

echo "🔄 v18.3으로 롤백 중..."

# 현재 v18.4 백업
cp src/main.js src/backups/main_v18_4_failed.js

# v18.3 복원
if [ -f "src/backups/main_v18_3_backup.js" ]; then
    cp src/backups/main_v18_3_backup.js src/main.js
    echo "✅ v18.3 복원 완료"
else
    echo "⚠️ v18.3 백업 파일이 없습니다"
    echo "main_v18_3_embedding_fix.js를 찾고 있습니다..."
    
    # v18.3 파일 검색
    if [ -f "src/main_v18_3_embedding_fix.js" ]; then
        cp src/main_v18_3_embedding_fix.js src/main.js
        echo "✅ v18.3 복원 완료 (원본 파일 사용)"
    else
        echo "❌ v18.3 파일을 찾을 수 없습니다"
        exit 1
    fi
fi

echo ""
echo "📋 다음 단계:"
echo "1. 서버 재시작: npm run tauri:dev"
echo "2. 완전 초기화 (DB 버전 변경)"
echo "3. 재인덱싱"
echo ""
echo "v18.3은 브랜드 구분 없이 순수한 이미지 유사도만 사용합니다."
