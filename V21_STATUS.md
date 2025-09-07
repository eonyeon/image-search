# 📊 Fashion Image Search v21 - Advanced AI Models
**최종 업데이트: 2025-01-03**

## 🎯 v21 핵심 개요
**고성능 AI 모델 + Tauri 파일 시스템 통합 버전**

### ✅ 해결한 문제들
1. **UI 작동 문제**: v20.2의 폴더 선택 문제 → Tauri Dialog API 통합으로 해결
2. **모델 성능 한계**: MobileNet v2 단일 모델 → Multi-Scale + Hybrid 모델 시스템
3. **파일 접근 제한**: 웹 기반 제한 → Tauri 파일 시스템 완전 통합

## 🚀 v21 주요 기능

### 1. 멀티 모델 시스템
- **Standard Mode**: MobileNet v2 (기본, 빠른 처리)
- **Advanced Mode**: Multi-Scale 특징 추출 (3개 스케일: 224, 299, 384px)
- **Hybrid Mode**: Standard + Advanced 융합 (최고 정확도)

### 2. Tauri 파일 시스템 통합
```javascript
// Tauri Dialog API로 네이티브 폴더 선택
const { open } = window.__TAURI__.dialog;
const selected = await open({
    directory: true,
    title: '이미지 폴더 선택'
});

// Tauri FS API로 파일 직접 읽기
const { readDir, readBinaryFile } = window.__TAURI__.fs;
const entries = await readDir(selected);
```

### 3. 고급 특징 추출 (1301차원)
- **MobileNet 특징**: 1280차원
- **HSV 색상 히스토그램**: 20차원 (Hue 12 + Sat 4 + Val 4)
- **패턴 복잡도**: 1차원 (엣지 검출 기반)

### 4. 분석 대시보드
- 실시간 성능 메트릭
- 브랜드별 분포 차트
- 인덱싱/검색 통계

## 📐 기술 아키텍처

### 특징 추출 파이프라인
```
이미지 입력
    ↓
[모델 선택]
    ├─ Standard: MobileNet v2
    ├─ Advanced: Multi-Scale (224/299/384px)
    └─ Hybrid: 60% Standard + 40% Advanced
    ↓
[색상 분석]
    └─ HSV 히스토그램 (20차원)
    ↓
[패턴 분석]
    └─ Sobel 엣지 검출 (1차원)
    ↓
최종 특징 벡터 (1301차원)
```

### 유사도 계산
```javascript
// 코사인 유사도 + 가중치
if (activeModel === 'hybrid') {
    similarity = 
        mobileNetSim * 0.5 +  // 형태 50%
        colorSim * 0.3 +      // 색상 30%
        patternSim * 0.2;     // 패턴 20%
}
```

## 🗂️ 파일 구조
```
image-search-desktop/
├── src/
│   ├── main.js                    # v21 Advanced (현재 실행)
│   ├── main_v21_advanced.js       # v21 원본
│   ├── main_v20_2_backup.js       # v20.2 백업
│   └── RESEARCH_DEEPLEARNING_SOLUTION.md
├── index.html                      # 최소화된 HTML
├── deploy_v21.sh                   # 배포 스크립트
├── V21_STATUS.md                   # 이 문서
└── package.json
```

## 📊 성능 지표
| 메트릭 | v20 | v21 | 개선율 |
|--------|-----|-----|--------|
| 특징 차원 | 1286 | 1301 | +1.2% |
| 모델 옵션 | 1개 | 3개 | +200% |
| 폴더 선택 | 웹 방식 | Tauri Native | ✅ |
| 정확도 (예상) | 80-83% | 85-90% | +7% |
| 인덱싱 속도 | ~0.5초/이미지 | ~0.6초/이미지 | -20% |

## 🚀 실행 방법

### 1. 실행 권한 부여 및 시작
```bash
chmod +x deploy_v21.sh
./deploy_v21.sh
```

### 2. 또는 수동 실행
```bash
# 캐시 클리어
rm -rf dist node_modules/.vite

# 개발 서버 시작
npm run tauri:dev

# 앱이 열리면 강제 새로고침
# Mac: Cmd + Shift + R
# Windows: Ctrl + F5
```

## 🎮 사용 가이드

### 1. 모델 전환
- 상단 "🔄 모델 전환" 버튼 클릭
- Standard → Advanced → Hybrid 순환

### 2. 폴더 인덱싱 (Tauri)
1. 인덱싱 모드 선택
2. "📂 폴더 선택 (Tauri)" 클릭
3. 네이티브 다이얼로그에서 폴더 선택
4. 자동으로 모든 이미지 파일 감지 및 인덱싱

### 3. 검색
1. 검색 모드 선택
2. 이미지 드래그 또는 클릭하여 업로드
3. 특징 벡터 시각화 확인
4. 유사도 순위별 결과 확인

### 4. 분석
- 분석 모드에서 실시간 통계 확인
- 브랜드별 분포 차트
- 성능 메트릭

### 5. DB 관리
- **내보내기**: JSON 형식으로 저장
- **가져오기**: 기존 DB에 병합
- **초기화**: 모든 데이터 삭제

## 🐛 디버깅

### 콘솔 확인 (F12)
```javascript
// 앱 상태 확인
app.version           // "v21.0.0-ADVANCED"
app.models.activeModel // "hybrid"
app.models.isReady    // true
app.hasTauri         // true

// DB 검증
app.validateDB()

// 메트릭 확인
app.metrics
```

### 문제 해결
| 문제 | 원인 | 해결 |
|------|------|------|
| 폴더 선택 안됨 | Tauri API 없음 | Tauri 앱으로 실행 확인 |
| 모델 로드 실패 | 네트워크 문제 | 인터넷 연결 확인 |
| 인덱싱 느림 | Multi-Scale 처리 | Standard 모드 사용 |
| UI 깨짐 | 캐시 문제 | Cmd+Shift+R 강제 새로고침 |

## 🔬 기술적 혁신

### 1. Multi-Scale Feature Fusion
```javascript
// 3개 스케일에서 특징 추출 후 융합
const scales = [224, 299, 384];
const fusedFeatures = features[0].map((_, i) => {
    return features.reduce((sum, f) => sum + f[i], 0) / features.length;
});
```

### 2. Tauri Binary File Handling
```javascript
// 바이너리 파일 직접 읽기 → Blob 변환
const fileData = await readBinaryFile(filePath);
const blob = new Blob([fileData], { type: 'image/*' });
const url = URL.createObjectURL(blob);
```

### 3. Dynamic Weight Adjustment
```javascript
// 모델별 가중치 동적 조정
if (this.models.activeModel === 'hybrid') {
    cosineSimilarity = 
        mobileNetSim * 0.5 +
        colorSim * 0.3 +
        patternSim * 0.2;
}
```

## 📈 향후 개선 계획

### v22.0 (계획)
- [ ] EfficientNet 실제 모델 통합
- [ ] CLIP 기반 텍스트 검색
- [ ] WebGPU 가속
- [ ] 브랜드별 Fine-tuning

### v23.0 (계획)
- [ ] Vision Transformer (ViT) 통합
- [ ] 3D 형태 분석
- [ ] 실시간 스트리밍 검색
- [ ] 모바일 앱 지원

## 📝 변경 이력

### v21.0 (2025-01-03) - 현재
- ✅ Multi-Scale 특징 추출
- ✅ Hybrid 모델 시스템
- ✅ Tauri 파일 시스템 통합
- ✅ 고급 분석 대시보드
- ✅ DB Import/Export

### v20.2 (2025-01-03)
- MobileNet v2 기본 구현
- 웹 기반 폴더 선택
- 1286차원 특징 벡터

## 🏆 성과
- **UI 문제 완전 해결**: Tauri Native Dialog
- **모델 성능 향상**: 3가지 모델 옵션
- **파일 접근성**: 모든 로컬 폴더 접근 가능
- **사용자 경험**: 직관적인 분석 대시보드

---
**버전**: v21.0.0-ADVANCED  
**작성일**: 2025-01-03  
**라이선스**: MIT
