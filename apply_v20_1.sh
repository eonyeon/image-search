#!/bin/bash

# v20.1 Fixed UI 적용 스크립트
echo "🔧 v20.1 Fixed UI 적용 중..."

# 백업 생성
cp src/main.js src/main_v20_0_backup.js 2>/dev/null || true
echo "✅ 백업 생성 완료"

# v20.1 적용
cp src/main_v20_1_fixed.js src/main.js
echo "✅ v20.1 Fixed UI 적용 완료"

echo "
✨ v20.1 Fixed UI 수정 사항:
1. ✅ 모델 토글 버튼 이벤트 리스너 수정
2. ✅ 전역 app 변수 설정
3. ✅ 모든 버튼 이벤트 리스너 재연결
4. ✅ 폴더 선택 인덱싱 기능 수정
5. ✅ 드래그 앤 드롭 스타일 추가

🚀 서버 재시작:
npm run tauri:dev

📝 테스트 항목:
- 모드 전환 (검색/인덱싱/설정)
- 파일 선택 및 드래그 앤 드롭
- 폴더 선택 인덱싱
- 모델 토글 버튼
- DB 관리 기능들
"
