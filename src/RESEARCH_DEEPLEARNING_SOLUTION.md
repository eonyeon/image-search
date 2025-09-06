# Deep Learning Fashion Similarity Search 연구 결과

## 핵심 문제 분석
현재 시스템의 문제점:
- 루이비통 검색 시 고야드 93% 매칭 (치명적 오류)
- 샤넬 가방 검색 시 샤넬 지갑 87% 매칭 (카테고리 혼동)
- 단순 패턴 매칭으로는 브랜드 구분 불가능

## 해결책: MobileNet + FashionCLIP 하이브리드 접근법

### 1. 아키텍처
- **MobileNetV3**: 기본 특징 추출 (16MB, WebGL 가속)
- **FashionCLIP**: 패션 특화 의미 이해 (45MB)
- **HNSWlib.js**: 벡터 유사도 검색 (<100ms 쿼리)

### 2. 핵심 기술
- **Gram Matrices**: 브랜드별 텍스처 시그니처 캡처
- **Multi-scale Processing**: 224x224, 299x299 동시 처리
- **Region-based Weighting**: 
  - 모노그램 패턴: 40%
  - 로고 위치: 20%
  - 색상 구성: 15%
  - 텍스처 디테일: 15%
  - 형태 구조: 10%

### 3. 브랜드별 최적화
```javascript
brandSignatures = {
  louis_vuitton: {
    gramLayers: ['conv3', 'conv4'], // 모노그램 반복 캡처
    attentionRegions: ['center', 'corners'], // 로고 위치
    colorThreshold: 0.15 // 브라운/탄 허용치
  },
  chanel: {
    gramLayers: ['conv2', 'conv3'], // 다이아몬드 퀼팅
    attentionRegions: ['uniform'], // 일관된 퀼팅
    colorThreshold: 0.10 // 블랙/베이지 정밀도
  },
  goyard: {
    gramLayers: ['conv4', 'conv5'], // Y-셰브론 직조
    attentionRegions: ['diagonal'], // 셰브론 방향성
    colorThreshold: 0.20 // 다양한 컬러웨이
  }
}
```

### 4. 성능 목표
- 모델 로드: <3초
- 쿼리당 시간: <100ms
- 메모리 사용: <200MB
- 정확도: 92% (브랜드 구분)
- Precision@10: >85%
- Recall@10: >80%

### 5. 학습 데이터 요구사항
- 브랜드당 최소 500개 샘플
- 패턴별 최소 125-175개
- 증강 배수: 4x
- 검증 분할: 20%

### 6. 구현 단계
1. MobileNetV3 모델 로드
2. 기존 이미지 재인덱싱 (딥러닝 임베딩)
3. 하이브리드 모드 운영 (70% ML, 30% 레거시)
4. 신뢰도 75% 이하 시 패턴 기반 폴백
5. 2주간 A/B 테스트 후 완전 전환

## 예상 결과
- LV/고야드 혼동: 93% → 8% (11배 개선)
- 샤넬 카테고리 혼동: 87% → 12% (7배 개선)
- 전체 브랜드 인식: 92% 정확도
