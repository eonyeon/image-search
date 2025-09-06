# 📊 Fashion Image Search v18.7 - Fixed Normalization
**최종 업데이트: 2025-01-03**

## 🎯 v18.7 핵심 개요
**100% 유사도 버그 수정 및 색상 구분 강화 버전**

### 해결한 문제
1. **100% 유사도 버그**: 서로 다른 제품이 100%로 표시되던 문제 해결
2. **색상 구분 실패**: 브라운/오렌지 가방 검색 시 검정 가방이 상위에 오던 문제 개선

## 🔧 기술 스택
- **Frontend**: Vanilla JavaScript + Tauri Desktop App
- **AI 모델**: TensorFlow.js + MobileNet v2
- **특징 추출**: 1286차원 벡터 (MobileNet 1280 + 색상 6)
- **유사도 계산**: 코사인 유사도 + 색상 보너스/페널티

## 📐 알고리즘 상세

### 1. 특징 추출 (1286 features)
```javascript
// MobileNet v2 특징 (1280차원)
const mobileNetFeatures = await mobilenet.infer(image, true);

// 색상 특징 (6차원)
const colorFeatures = [
    avgR,        // 평균 R 값 (0-1)
    avgG,        // 평균 G 값 (0-1)
    avgB,        // 평균 B 값 (0-1)
    isDark,      // 검정 계열 (0 or 1)
    isBrown,     // 브라운 계열 (0 or 1)
    isWhite      // 흰색 계열 (0 or 1)
];
```

### 2. 유사도 계산
```javascript
// 기본 코사인 유사도
const mobileNetSim = cosineSimilarity(queryMobileNet, dbMobileNet);
const colorSim = cosineSimilarity(queryColor, dbColor);

// 가중 평균 (형태 60%, 색상 40%)
let combinedSim = mobileNetSim * 0.6 + colorSim * 0.4;

// 색상 보너스/페널티
if (sameColorCategory) {
    combinedSim = Math.min(1, combinedSim * 1.15);  // +15% 보너스
} else if (differentColorCategory) {
    combinedSim = combinedSim * 0.85;  // -15% 페널티
}
```

### 3. 버그 수정 내역

#### v18.6 → v18.7 변경사항
| 항목 | v18.6 (문제) | v18.7 (해결) |
|------|-------------|-------------|
| 정규화 | 50-100% 범위로 정규화 | 정규화 제거, 실제값 표시 |
| 100% 문제 | 최고점이 항상 100% | 실제 유사도 (보통 50-85%) |
| 색상 특징 | 68개 (과도하게 복잡) | 6개 (단순화) |
| 색상 가중치 | 30% 고정 | 40% + 보너스/페널티 |

## 📊 성능 지표
- **인덱싱 속도**: 76개 이미지 약 35초
- **검색 속도**: < 1초
- **메모리 사용**: ~500MB (모델 로드 시)
- **정확도**: MobileNet v2 기반 + 색상 구분 강화

## 🗂️ 파일 구조
```
image-search-desktop/
├── src/
│   ├── main.js                    # 현재 실행 파일 (v18.7)
│   ├── main_v18_7_fixed_norm.js   # v18.7 원본
│   └── backups/                   # 이전 버전 백업
├── dist/                           # 빌드 결과물
├── src-tauri/
│   ├── tauri.conf.json           # Tauri 설정
│   └── icons/                    # 앱 아이콘
└── deploy_v18_7.sh                # GitHub 배포 스크립트
```

## 🐛 알려진 문제 및 해결책

### 문제 1: DB 버전 호환성
- **증상**: 이전 버전 DB와 호환 안 됨
- **해결**: 완전 초기화 필수 (설정 → 💣 완전 초기화)

### 문제 2: 브랜드별 정확도 차이
- **증상**: 일부 브랜드 구분 정확도 낮음
- **원인**: MobileNet은 일반 이미지용 모델
- **향후 개선**: 패션 전용 모델 고려

## 🚀 빌드 및 배포

### 로컬 개발
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run tauri:dev

# 프로덕션 빌드
npm run tauri:build
```

### GitHub Actions 배포
```bash
# 배포 스크립트 실행
chmod +x deploy_v18_7.sh
./deploy_v18_7.sh
```

## 📝 디버깅 방법

### 콘솔에서 테스트
```javascript
// DB 상태 확인
app.validateDB()

// 색상 분석
app.analyzeColors()

// 유사도 분석
app.analyzeSimilarity()
```

### 로그 확인
- 브라우저: F12 → Console
- 색상 분석: "색상 분석:" 로그
- 유사도 계산: "=== 상위 5개 결과 ===" 로그

## 💡 향후 개선 방향

### 단기 (v18.8)
- [ ] 텍스처 분석 추가 (퀼팅, 모노그램 등)
- [ ] 브랜드별 가중치 자동 학습
- [ ] 검색 속도 최적화

### 중기 (v19.0)
- [ ] 패션 전용 AI 모델 적용
- [ ] 다중 각도 이미지 지원
- [ ] 사용자 피드백 학습

### 장기 (v20.0)
- [ ] 클라우드 동기화
- [ ] 모바일 앱 연동
- [ ] API 서버 구축

## ⚠️ 중요 사항
1. **DB 재인덱싱 필수**: v18.7은 1286 features 사용
2. **캐시 삭제 권장**: 브라우저 캐시 Cmd+Shift+R
3. **WebGL 필요**: TensorFlow.js GPU 가속
4. **파일명 규칙**: 801XX.jpg 형식 권장

## 📧 문제 발생 시
- GitHub Issues: https://github.com/eonyeon/image-search/issues
- 로그 첨부: Console 전체 로그 + 스크린샷

---
**작성자**: Fashion Search Development Team  
**버전**: v18.7.0-FIXED-NORMALIZATION  
**라이선스**: MIT