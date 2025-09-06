#!/bin/bash
# v18.0 적용

echo "✅ 백업 생성 중..."
cp src/main.js src/backups/main_v17_3_backup_$(date +%Y%m%d_%H%M%S).js

echo "✅ v18.0 적용 중..."
cp src/main_v18_deeplearning.js src/main.js

echo "✅ 완료! 서버 재시작해주세요 (npm run tauri:dev)"
