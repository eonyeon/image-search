# Fashion Search Image v18.5 - 프로젝트 최종 상태
## 2025년 1월 3일 기준

---

## 📋 프로젝트 개요

**목적**: 럭셔리 패션 제품(가방) 이미지 유사도 검색 시스템
**기술 스택**: 
- Frontend: Vanilla JavaScript
- AI Model: TensorFlow.js + MobileNet v2
- Storage: IndexedDB
- Platform: Tauri (Desktop App)

---

## 🔍 현재 알고리즘 (v18.5)

### 핵심 원리: 순수 시각적 유사도
```
입력 이미지 → MobileNet v2 → 1280차원 특징 벡터 → 코사인 유사도 → 순위화
```

### 상세 프로세스

#### 1. 특징 추출 (Feature Extraction)
```javascript
// MobileNet v2 사용
const embeddings = mobileNet.infer(imageElement, true);  // true = 중간 레이어
// 결과: [1, 1280] 형태의 2차원 배열

// L2 정규화
const norm = tf.norm(embeddings, 2, 1, true);
const normalized = tf.div(embeddings, norm);

// 1차원 배열로 변환
const arrayData = await normalized.array();
return arrayData[0];  // [1280] 크기 벡터
```

#### 2. 유사도 계산
```javascript
// 코사인 유사도
similarity = (vec1 · vec2) / (||vec1|| × ||vec2||)

// 점수 정규화 (50-100% 범위)
normalizedScore = 50 + ((similarity - minSim) / range) × 50
```

#### 3. 데이터 구조
```javascript
{
  filename: "80159.png",
  path: "data:image/png;base64,...",
  embedding: [0.123, 0.456, ...],  // 1280개 float
  indexed: "2025-01-03T12:00:00Z"
}
```

---

## 🚀 빌드 및 배포

### 로컬 개발
```bash
# 개발 서버 실행
npm run tauri:dev

# 빌드
npm run tauri:build
```

### GitHub 배포
```bash
# 자동 배포 스크립트
chmod +x deploy_to_github.sh
./deploy_to_github.sh

# 수동 배포
git add .
git commit -m "커밋 메시지"
git push origin main
```

### GitHub Actions
- `.github/workflows/build.yml` 파일로 자동 빌드
- push 시 자동으로 Windows/Mac 빌드 생성
- Releases 페이지에서 다운로드 가능

---

## 📁 주요 파일 구조

```
image-search-desktop/
├── src/
│   ├── main.js                    # 현재 실행 파일 (v18.5)
│   ├── main_v18_5_pure_similarity.js  # v18.5 원본
│   ├── main_v18_3_embedding_fix.js    # v18.3 (임베딩 수정)
│   └── backups/                   # 이전 버전 백업
├── src-tauri/
│   ├── tauri.conf.json           # Tauri 설정
│   └── icons/                    # 앱 아이콘
├── index.html                     # 메인 HTML
├── package.json                   # 의존성 관리
└── .github/
    └── workflows/
        └── build.yml              # GitHub Actions 빌드 설정
```

---

## 🐛 알려진 문제와 해결책

### 1. NaN% 문제
**원인**: 임베딩이 2차원 배열([1, 1280])로 저장되어 1차원과 비교 시 오류
**해결**: `arrayData[0]`로 1차원 배열 추출

### 2. 브랜드 구분 부정확
**원인**: 파일명 기반 브랜드 감지가 부정확
**해결**: v18.5에서 브랜드 로직 완전 제거, 순수 유사도만 사용

### 3. 폴더 선택 안 됨
**원인**: Tauri WebView에서 webkitdirectory 제한
**해결**: "이미지 파일 선택" 버튼 사용 권장

### 4. 유사도 범위 좁음
**원인**: 모든 이미지가 60-70% 유사도
**해결**: 정규화로 50-100% 범위로 확장

---

## 🔧 문제 발생 시 디버깅

### 1. 콘솔 확인 (F12)
```javascript
// 시스템 상태
app.runTest()

// DB 검증
app.validateDB()

// 유사도 분석
app.analyzeSimilarity()

// 수동 검색 테스트
app.processSearchImage(file)
```

### 2. DB 초기화
```javascript
// 완전 초기화
app.clearAndReload()

// 또는 설정 → 완전 초기화 버튼
```

### 3. 이전 버전 복원
```bash
# v18.3으로 롤백
cp src/main_v18_3_embedding_fix.js src/main.js
npm run tauri:dev
```

---

## 📊 성능 지표

- **인덱싱 속도**: 76개 이미지 약 30초
- **검색 속도**: < 1초
- **메모리 사용**: 약 200-300MB
- **정확도**: MobileNet v2 기반 시각적 유사도
- **DB 크기**: 이미지당 약 100KB (base64 + 임베딩)

---

## 🎯 향후 개선 방향

### 단기 (v19)
1. **하이브리드 접근**: 패턴 매칭 + 딥러닝 결합
2. **캐싱 최적화**: 임베딩 캐시로 속도 향상
3. **UI 개선**: 필터링, 정렬 기능 추가

### 장기 (v20+)
1. **Fine-tuning**: 럭셔리 브랜드 특화 모델 학습
2. **멀티모달**: 텍스트 설명 + 이미지 검색
3. **클라우드 동기화**: 서버 기반 검색
4. **모바일 앱**: React Native 버전

---

## 📞 문의 및 지원

- GitHub: https://github.com/eonyeon/image-search
- 주요 개발자: eonyeon
- 최종 업데이트: 2025년 1월 3일

---

## 🔄 버전 히스토리

### v18.5 (2025-01-03) - 현재
- 브랜드 로직 제거
- 순수 유사도 기반
- 점수 정규화

### v18.4 (2025-01-03) - 실패
- 브랜드 패턴 강화 시도
- 잘못된 분류로 롤백

### v18.3 (2025-01-03) - 안정
- NaN% 문제 해결
- 임베딩 저장 수정

### v18.0-v18.2
- DeepLearning 버전 시도
- DB 타이밍 문제 수정

### v17.x 이전
- 패턴 매칭 기반
- 색상/텍스처 분석

---

## ⚠️ 중요 참고사항

1. **항상 백업**: 새 버전 적용 전 main.js 백업 필수
2. **DB 버전**: 각 버전마다 다른 DB 사용 (v18_5 등)
3. **완전 초기화**: 메이저 버전 변경 시 DB 초기화 필수
4. **테스트 데이터**: 미러급 코드 76개 이미지 사용

---

이 문서는 프로젝트를 인수받는 개발자가 빠르게 이해하고 
문제를 해결할 수 있도록 작성되었습니다.
