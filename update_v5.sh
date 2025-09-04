#!/bin/bash

# Image Search App v5.0 설치 스크립트
# 이 스크립트는 개선된 버전으로 앱을 업데이트합니다.

echo "🚀 Image Search App v5.0 업데이트 시작..."

# 1. 기존 파일 백업
echo "📦 기존 파일 백업 중..."
cp src/main.js src/main.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp src/style.css src/style.css.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# 2. 새 파일 적용
echo "📝 새 버전 적용 중..."

# 메인 설정 생성
cat > src/update_message.md << 'EOF'
# ✅ Image Search App v5.0 업데이트 완료!

## 주요 개선사항

### 1. 브랜드 감지 로직 제거
- 부정확한 브랜드 감지 알고리즘 완전 제거
- 순수한 이미지 유사도 기반 검색으로 전환

### 2. 파일명 기반 메타데이터 활용
- 파일명에서 브랜드 정보 자동 추출
- 지원 브랜드: Louis Vuitton, Chanel, Prada, Gucci, Hermes, Dior 등

### 3. 사용자 피드백 시스템
- 검색 결과에 👍/👎 버튼 추가
- 피드백이 향후 검색 정확도에 반영

### 4. 향상된 특징 추출
- HSV 색상 히스토그램
- Sobel 엣지 검출
- LBP 텍스처 분석

### 5. 이미지 로드 오류 수정
- 공백이 포함된 파일명 처리 개선
- 특수문자 파일명 지원
- 로드 실패 시 자동 대체 방법 적용

## 사용 방법

1. **데이터베이스 초기화**: 설정 > 데이터베이스 초기화
2. **이미지 재인덱싱**: 인덱싱 모드에서 폴더 선택
3. **검색 시작**: 검색 모드에서 이미지 업로드

## 콘솔 명령어

```javascript
// 버전 정보 확인
imageSearchApp.getVersion()

// 브랜드 통계 보기
imageSearchApp.getBrandStats()

// 피드백 초기화
imageSearchApp.clearFeedback()

// 데이터베이스 내보내기
imageSearchApp.exportDatabase()
```

## 주의사항

⚠️ 이전 버전 데이터베이스와 호환되지 않습니다.
⚠️ 반드시 재인덱싱이 필요합니다.

EOF

echo "✅ 업데이트 설정 완료!"
echo ""
echo "다음 단계:"
echo "1. src/main.js 파일을 improved-main-js artifact 내용으로 교체"
echo "2. src/style.css 파일에 improved-style-css artifact 내용 추가"
echo "3. npm run tauri:dev 로 앱 실행"
echo "4. 데이터베이스 초기화 후 재인덱싱"
echo ""
echo "📄 자세한 내용은 src/update_message.md 파일을 참고하세요."
