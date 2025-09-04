# 🔍 Image Search Desktop - 개발 히스토리 및 학습 내용

## 📅 프로젝트 타임라인
- **시작**: 2024년 이미지 검색 시스템 개발
- **v3.0**: 브랜드 감지 시스템 도입
- **문제 발견**: 브랜드 오인식, 신뢰도 버그
- **v5.0 ~ v7.0**: 단계적 개선
- **최종**: Pure Vision v7.0 (딥러닝 없는 순수 비전)

---

## 🔴 초기 문제점 (v3.0)

### 1. 브랜드 오인식 문제
```
입력: Louis Vuitton 가방
결과: Chanel 가방들이 검색됨
```
- **원인**: MobileNet은 일반 객체 인식용으로 패션 브랜드 특징을 학습하지 않음
- **증상**: 전혀 다른 브랜드와 형태의 가방들이 높은 유사도로 표시

### 2. 신뢰도 계산 버그
```javascript
// 문제 코드
brands.louis_vuitton += 0.7;
brands.louis_vuitton += 0.5;
brands.louis_vuitton += 0.3;
// 결과: 1.5 (150%) - 불가능한 값
```

### 3. 이미지 로드 실패
- 파일명 공백 처리 오류
- 특수문자 파일명 미지원
- `convertFileSrc` 실패 시 대체 방법 없음

### 4. 콘솔 로그
```
[Log] 🏷️ 브랜드 감지: louis_vuitton (신뢰도: 150.0%)
[Error] Failed to load resource: unsupported URL
[Warning] 이미지 로드 실패 (convertFileSrc): /Users/eon/Documents/미러급 코드/80186.jpg
```

---

## 🔧 시도한 해결 방법들

### v5.0 - 브랜드 감지 제거 + 메타데이터
```javascript
// 파일명에서 브랜드 추출
extractBrandFromFilename(filename) {
    const brands = ['louis_vuitton', 'lv', 'chanel', 'prada', ...];
    // 파일명 기반 브랜드 정보
}
```
**결과**: 사용자가 파일명 브랜드 기능 불필요하다고 피드백

### v6.0 - 가방 특화 시스템
```javascript
// 가방 형태 분석
extractBagShape(imageElement) {
    return {
        aspectRatio,      // 가로/세로 비율
        rectangularity,   // 직사각형성
        circularity,      // 원형성
        topHeaviness,     // 위쪽 무게감
        symmetry          // 대칭성
    };
}
```
**문제**: 버튼 클릭 안 됨, 파일 복사 오류

### v7.0 - 최종 해결책 (Pure Vision)
```javascript
// 딥러닝 완전 제거, 순수 컴퓨터 비전
class PureVisionBagSearch {
    // HOG, LBP, Hu Moments 사용
    // 모델 로드 없음 = 즉시 실행
}
```

---

## 🎯 최종 솔루션: Pure Vision v7.0

### 핵심 기술
1. **HOG (Histogram of Oriented Gradients)**
   - 형태와 구조 감지
   - 35% 가중치
   - 576차원 특징 벡터

2. **LBP (Local Binary Patterns)**
   - 텍스처 분석
   - 20% 가중치
   - 59차원 (Uniform patterns)

3. **Hu Moments**
   - 회전/크기 불변 형태 특징
   - 7개 불변 모멘트

4. **색상 히스토그램**
   - RGB 각 32 bins
   - 96차원 특징

### 가중치 시스템
```javascript
const weights = {
    color: 0.25,    // 25% - 색상
    hog: 0.35,      // 35% - 형태/구조 (가장 중요)
    lbp: 0.20,      // 20% - 텍스처
    shape: 0.15,    // 15% - 전체 형태
    aspect: 0.05    // 5% - 종횡비
};
```

---

## 📊 버전별 비교

| 버전 | 모델 | 특징 | 문제점 | 장점 |
|------|------|------|--------|------|
| v3.0 | MobileNet v2 | 브랜드 감지 | 오인식, 150% 버그 | - |
| v5.0 | MobileNet v2 | 메타데이터 | 파일명 의존 | 피드백 시스템 |
| v6.0 | EfficientNet 시도 | 가방 특화 | 버튼 작동 안함 | 형태 분석 |
| v7.0 | 없음 (Pure Vision) | HOG+LBP | - | 100% 오프라인 |

---

## 💡 학습된 교훈

### 1. MobileNet의 한계
- **일반 객체 인식용**이라 세부 특징 구분 불가
- 패션 아이템 구분에는 부적합
- Fashion-MNIST나 DeepFashion 데이터셋 학습 모델 필요

### 2. 브랜드 감지의 어려움
```
색상 + 패턴만으로는 브랜드 구분 불가능
- Louis Vuitton 모노그램 ≠ 갈색 + 패턴
- Chanel 퀼팅 ≠ 검은색 + 대각선
```

### 3. 오프라인 우선 설계
- 사용자 환경: 인터넷 연결 제한적
- 모델 다운로드 의존성 제거 필요
- 순수 알고리즘 > 딥러닝 (특정 상황)

### 4. 이미지 경로 처리
```javascript
// Windows 경로 정규화 필수
let normalizedPath = filePath.replace(/\\/g, '/');

// 공백 처리
if (fileName.includes(' ')) {
    // 특별 처리 필요
}

// 실패 시 대체 방법
imgElement.onerror = async () => {
    const imageData = await readBinaryFile(filePath);
    // Blob URL 생성
};
```

---

## 🚀 성과

### Before (v3.0)
- ❌ Louis Vuitton 검색 → Chanel 결과
- ❌ 150% 신뢰도 표시
- ❌ 이미지 로드 실패
- ❌ 모델 로드 시간 필요

### After (v7.0)
- ✅ 형태 기반 정확한 매칭
- ✅ 정상적인 유사도 계산
- ✅ 모든 이미지 로드 성공
- ✅ 즉시 실행 (모델 없음)

---

## 🛠️ 기술 스택 변화

### 제거된 것들
```javascript
// Before
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// 브랜드 감지 로직
inferBrand(features) { ... }
detectBrandFeatures(imageElement) { ... }
```

### 추가된 것들
```javascript
// After
extractHOGFeatures(imageElement) { ... }
extractLBPFeatures(imageElement) { ... }
calculateHuMoments(imageData) { ... }
```

---

## 📝 코드 최적화 포인트

### 1. 메모리 관리
```javascript
// 배치 크기 축소
const batchSize = 5; // 10 → 5

// URL 정리
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

### 2. 특징 추출 최적화
```javascript
// 병렬 처리 대신 순차 처리
const colorHist = this.extractColorHistogram(imageElement);
const hogFeatures = this.extractHOGFeatures(imageElement);
// 메모리 사용량 감소
```

### 3. 에러 처리 강화
```javascript
if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
// 모든 함수에 null 체크 추가
```

---

## 🎓 결론

### 핵심 깨달음
1. **문제에 맞는 도구 선택**: 딥러닝이 항상 답은 아님
2. **사용자 환경 고려**: 오프라인 우선 설계
3. **단순함의 가치**: 복잡한 브랜드 감지 < 단순한 형태 매칭
4. **검증된 알고리즘**: HOG, LBP 등 전통적 CV 기법의 효과

### 최종 선택: Pure Vision
- **이유**: 안정성, 속도, 오프라인 작동
- **트레이드오프**: 딥러닝 대비 약간 낮은 정확도
- **결과**: 사용자 요구사항 충족

---

## 📚 참고 자료

### 사용된 알고리즘
- [HOG (Histogram of Oriented Gradients)](https://en.wikipedia.org/wiki/Histogram_of_oriented_gradients)
- [LBP (Local Binary Patterns)](https://en.wikipedia.org/wiki/Local_binary_patterns)
- [Hu Moments](https://en.wikipedia.org/wiki/Image_moment#Rotation_invariant_moments)

### 관련 프로젝트
- TensorFlow.js
- Tauri Framework
- LocalForage

---

## 🔮 향후 개선 방향

### 단기 계획
1. SIFT/SURF 특징 추가 검토
2. 색상 공간 다양화 (HSV, LAB)
3. 캐싱 메커니즘 개선

### 장기 계획
1. WebAssembly로 성능 개선
2. 커스텀 패션 모델 학습
3. 클라우드 옵션 추가 (선택적)

---

## 👨‍💻 개발 팀 노트

> "완벽한 솔루션보다 작동하는 솔루션이 낫다"

이 프로젝트를 통해 배운 가장 중요한 교훈은 사용자의 실제 환경과 요구사항을 정확히 이해하는 것의 중요성입니다. 최신 딥러닝 모델이 항상 최선은 아니며, 때로는 전통적인 컴퓨터 비전 기법이 더 적합할 수 있습니다.

---

**문서 작성일**: 2024-12-XX  
**최종 버전**: v7.0.0 (Pure Vision)  
**상태**: 배포 완료

---

## 📎 첨부: 빠른 참조

### 콘솔 명령어
```javascript
visionApp.version()      // 버전 확인
visionApp.clearDB()      // DB 초기화
visionApp.testFeatures() // 특징 추출 테스트
```

### 파일 구조
```
image-search-desktop/
├── src/
│   ├── main.js (v7.0 - Pure Vision)
│   ├── main.js.backup_v6
│   └── style.css
├── index.html
├── package.json
└── DEVELOPMENT_HISTORY.md (이 파일)
```

---

_이 문서는 image-search-desktop 프로젝트의 개발 과정과 학습 내용을 기록한 것입니다._