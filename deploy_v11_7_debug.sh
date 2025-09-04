#!/bin/bash

# 🔍 v11.7 - 화면 디버그 모드 버전

echo "🔍 v11.7 - 화면 디버그 모드"
echo "============================"
echo ""

# 1. 백업
echo "1️⃣ 백업 생성..."
cp src/main.js src/main_backup_v11_6.js

# 2. v11.7 적용
echo "2️⃣ v11.7 디버그 버전 적용..."
cp src/main_v11_7_debug.js src/main.js

# 3. Git 커밋
echo "3️⃣ Git 커밋..."
git add .
git commit -m "v11.7: Visual Debug Mode - diagnose without console

NEW FEATURES:
- On-screen debug console (bottom right, green text)
- Debug control panel (top right, blue)
- Real-time logging visible on screen
- Test buttons for vectors, DB, similarity

Debug Features:
1. Automatic debug log panel shows all operations
2. Vector Test button - check if vectors are same
3. DB Info button - show database status
4. Similarity Test button - test multiple pairs
5. Clear Log button - clear debug messages

Visual indicators:
- Green text: normal operations
- Yellow text: warnings
- Red text: errors
- Cyan text: success

How to use:
1. Just run the app - debug panels appear automatically
2. Watch bottom-right for real-time logs
3. Use top-right buttons for tests
4. No console needed!

CRITICAL: Still requires DB re-indexing after update"

# 4. 푸시
echo "4️⃣ GitHub 푸시..."
git push origin main

echo ""
echo "========================================="
echo "✅ v11.7 디버그 모드 배포 완료!"
echo "========================================="
echo ""
echo "🎯 화면에서 직접 확인 가능:"
echo "  • 하단 우측: 실시간 디버그 로그 (녹색)"
echo "  • 상단 우측: 디버그 컨트롤 (파란색)"
echo "  • 콘솔 없이 문제 진단 가능!"
echo ""
echo "📋 디버그 버튼들:"
echo "  • 벡터 테스트: 벡터가 동일한지 확인"
echo "  • DB 정보: 데이터베이스 상태"
echo "  • 유사도 테스트: 여러 쌍 비교"
echo "  • 로그 지우기: 디버그 로그 초기화"
echo ""
echo "🔍 확인할 내용:"
echo "  1. 인덱싱 시 각 이미지의 벡터값"
echo "  2. 벡터가 모두 동일한지 다른지"
echo "  3. 유사도 범위 (0.1% = 문제, 40% = 정상)"
echo ""
echo "⚠️ 필수: DB 초기화 후 재인덱싱!"
echo ""
echo "⏰ 빌드: 10-15분"
echo "🔗 https://github.com/eonyeon/image-search/actions"
