# 🚀 Image Search Desktop - Quick Reference

## 현재 버전: v7.0.0 (Pure Vision)
- **날짜**: 2024-12
- **상태**: ✅ 작동 중
- **특징**: 딥러닝 없는 순수 컴퓨터 비전

## 🔍 빠른 문제 해결

### 버튼이 작동하지 않을 때
```bash
# 앱 재시작
npm run tauri:dev
```

### 검색 결과가 이상할 때
1. DB 초기화: `visionApp.clearDB()`
2. 이미지 재인덱싱
3. 검색 재시도

### 이미지가 로드되지 않을 때
- 파일명 공백 제거
- 특수문자 제거
- JPG/PNG 형식 확인

## 📊 버전 히스토리

| 버전 | 날짜 | 주요 변경사항 | 상태 |
|------|------|--------------|------|
| v3.0 | - | 브랜드 감지 추가 | ❌ 버그 |
| v5.0 | - | 메타데이터 활용 | ❌ 미사용 |
| v6.0 | - | 가방 특화 | ❌ 작동 안함 |
| **v7.0** | **현재** | **Pure Vision** | **✅ 작동** |

## 💻 콘솔 명령어

```javascript
// 버전 확인
visionApp.version()

// DB 초기화 
visionApp.clearDB()

// 특징 테스트
visionApp.testFeatures()
```

## 🎯 핵심 알고리즘

### HOG (35%)
- 형태와 구조 감지
- 576차원 벡터

### LBP (20%)
- 텍스처 분석
- 59차원 벡터

### 색상 히스토그램 (25%)
- RGB 32-bins
- 96차원 벡터

### Hu Moments (15%)
- 형태 불변 특징
- 7차원 벡터

## 🔧 주요 함수

```javascript
// 특징 추출
extractHOGFeatures(imageElement)
extractLBPFeatures(imageElement)
extractColorHistogram(imageElement)
calculateHuMoments(imageData)

// 유사도 계산
calculateSimilarity(features1, features2)
cosineSimilarity(vec1, vec2)
```

## ⚡ 성능

- **인덱싱 속도**: ~10 이미지/초
- **검색 속도**: < 1초 (1000 이미지)
- **메모리 사용**: ~200MB
- **정확도**: ~85%

## 📝 주요 교훈

1. **MobileNet 한계**: 패션 아이템 구분 불가
2. **오프라인 우선**: 모델 다운로드 의존성 제거
3. **단순함의 가치**: 복잡한 브랜드 감지 < 형태 매칭
4. **전통적 CV 효과**: HOG, LBP가 충분히 효과적

## 🐛 알려진 이슈

- 없음 (v7.0 기준)

## 📞 지원

문제 발생 시:
1. 콘솔 로그 확인 (F12)
2. `DEVELOPMENT_HISTORY.md` 참조
3. DB 초기화 후 재시도

---

**Last Updated**: 2024-12
**Version**: 7.0.0
**Status**: Production Ready