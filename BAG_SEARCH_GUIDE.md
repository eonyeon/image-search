# 👜 Bag Search v6.0 - 가방 특화 검색 시스템

## ⚠️ 문제 해결

기존 시스템의 문제점:
- MobileNet이 일반 객체 인식용이라 가방 세부 특징 구분 못함
- Louis Vuitton 검색 시 Chanel이 나오는 문제
- 전혀 다른 형태의 가방이 높은 유사도로 나오는 문제

## 🎯 v6.0 해결책

### 1. 가방 형태 분석 (35% 가중치)
```javascript
- aspectRatio: 가로/세로 비율
- rectangularity: 직사각형성 (토트백 vs 둥근 가방)
- circularity: 원형성
- topHeaviness: 위쪽 무게감 (버킷백 vs 토트백)
- symmetry: 대칭성
- contourComplexity: 윤곽선 복잡도
```

### 2. 색상 패턴 감지 (20% 가중치)
```javascript
- dominantColors: 주요 5개 색상
- hasPattern: 패턴 유무 (모노그램, 체크 등)
- isMono: 단색 여부
- hasBrown: 갈색 계열 (LV 특징)
- hasBlack: 검은색 계열 (Chanel 특징)
```

### 3. 하드웨어 감지 (10% 가중치)
```javascript
- hasMetal: 금속 부분 유무
- isGold: 금색/은색 구분
- metalRatio: 금속 비율
```

### 4. 딥러닝 특징 (30% 가중치)
- EfficientNet B0 우선 사용
- 실패 시 MobileNet v3
- 최후 수단 MobileNet v2

## 📦 설치 방법

### 자동 설치 (권장)
```bash
cd /Users/eon/Desktop/image-search-desktop
chmod +x install_v6.sh
./install_v6.sh
```

### 수동 설치
```bash
# 1. 백업
cp src/main.js src/main.js.backup

# 2. 새 파일 적용
cp src/main-v6-bag-optimized.js src/main.js

# 3. 앱 재시작
npm run tauri:dev
```

## 🚀 사용 방법

1. **데이터베이스 초기화**
   - 설정 > 데이터베이스 초기화 클릭
   - 또는 콘솔에서 `bagSearchApp.clearDB()`

2. **이미지 재인덱싱**
   - 인덱싱 모드로 전환
   - 폴더 선택
   - 인덱싱 완료 대기

3. **검색 테스트**
   - 검색 모드로 전환
   - 가방 이미지 업로드
   - 결과 확인

## 📊 예상 개선 효과

### Before (v3.0)
- Louis Vuitton 검색 → Chanel 결과
- 형태가 다른 가방들이 섞임
- 브랜드 오인식

### After (v6.0)
- 형태가 비슷한 가방 우선 표시
- 색상 패턴이 유사한 가방 그룹화
- 하드웨어 스타일 고려

## 🔍 유사도 계산 방식

```
최종 유사도 = 
  딥러닝 특징 × 30% +
  형태 유사도 × 35% +  // 가장 중요!
  색상 유사도 × 20% +
  하드웨어 × 10% +
  크기 × 5%
```

## 💡 콘솔 명령어

```javascript
// 버전 확인
bagSearchApp.getVersion()

// 통계 보기
bagSearchApp.getStats()
// 출력 예:
// 총 이미지: 76개
// 패턴 있음: 24개 (31.6%)
// 금속 하드웨어: 65개 (85.5%)
// 단색: 42개
// 갈색 계열: 18개
// 검은색 계열: 31개

// DB 초기화
bagSearchApp.clearDB()
```

## ⚠️ 주의사항

1. **반드시 재인덱싱 필요**
   - v6은 완전히 새로운 특징 추출 방식
   - 이전 DB와 호환 안됨

2. **첫 실행 시 모델 다운로드**
   - EfficientNet B0 시도 (권장)
   - 실패 시 MobileNet v3 자동 대체

3. **메모리 사용량**
   - 형태 분석으로 인해 약간 증가
   - 배치 크기 5로 제한하여 안정성 확보

## 🎯 최적화 팁

1. **이미지 품질**
   - 가방이 중앙에 위치한 이미지
   - 배경이 단순한 이미지
   - 정면 촬영 이미지

2. **폴더 구성**
   - 가방 종류별 폴더 분리 (선택사항)
   - 파일명에 숫자만 사용 (브랜드명 제외)

## 🐛 문제 해결

### 이미지 로드 실패
- 파일명 공백 제거
- 특수문자 제거
- JPG/PNG 형식 확인

### 검색 결과 부정확
- DB 초기화 후 재인덱싱
- 콘솔에서 `bagSearchApp.getStats()` 로 통계 확인

### 속도 문제
- 이미지 수 줄이기
- 배치 크기 조정 (main.js의 batchSize 변수)

---

## 📝 변경 이력

### v6.0 (2024-01-XX)
- 가방 형태 분석 추가
- 하드웨어 감지 추가
- 패턴 감지 개선
- 파일명 브랜드 추출 제거

### v5.0
- 사용자 피드백 시스템
- 파일명 메타데이터

### v3.0
- 브랜드 감지 (제거됨)

---

개발: Assistant
버전: 6.0.0
라이선스: MIT