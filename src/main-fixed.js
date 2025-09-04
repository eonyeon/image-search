// inferBrand 함수 수정 부분만 추출
// main.js의 약 460번째 줄의 inferBrand 함수를 다음으로 교체:

inferBrand(features) {
    const brands = {
        'prada': 0,
        'chanel': 0,
        'louis_vuitton': 0,
        'gucci': 0,
        'hermes': 0,
        'dior': 0,
        'unknown': 0
    };
    
    // 각 브랜드별 점수 계산 (최대값 제한)
    
    // Prada 특징
    let pradaScore = 0;
    if (features.textures.saffiano > 0.6) pradaScore += 0.4;
    if (features.patterns.smooth > 0.7 && features.colors.isMonochrome) pradaScore += 0.3;
    if (features.colors.saturation < 0.3 && features.patterns.geometric < 0.2) pradaScore += 0.3;
    brands.prada = Math.min(pradaScore, 1.0);
    
    // Chanel 특징
    let chanelScore = 0;
    if (features.patterns.quilted > 0.5) chanelScore += 0.5;
    if (features.patterns.diagonal > 0.3) chanelScore += 0.3;
    if (features.colors.isMonochrome && features.textures.leather > 0.5) chanelScore += 0.2;
    brands.chanel = Math.min(chanelScore, 1.0);
    
    // Louis Vuitton 특징
    let lvScore = 0;
    if (features.colors.hasBrown && features.patterns.monogram > 0.4) lvScore += 0.5;
    if (features.patterns.checkered > 0.4 && (features.colors.hasBrown || features.colors.hasNavy)) lvScore += 0.3;
    if (features.textures.canvas > 0.5 && features.patterns.monogram > 0.3) lvScore += 0.2;
    brands.louis_vuitton = Math.min(lvScore, 1.0);
    
    // Gucci 특징 추가
    let gucciScore = 0;
    if (features.colors.hasGreen && features.colors.hasRed) gucciScore += 0.4;
    if (features.patterns.geometric > 0.3) gucciScore += 0.3;
    brands.gucci = Math.min(gucciScore, 0.9);
    
    // 가장 높은 점수의 브랜드 선택
    let maxScore = 0;
    let detectedBrand = 'unknown';
    
    for (const [brand, score] of Object.entries(brands)) {
        if (score > maxScore && score > 0.3) {
            maxScore = score;
            detectedBrand = brand;
        }
    }
    
    // 신뢰도를 0~1 범위로 엄격하게 제한
    maxScore = Math.max(0, Math.min(maxScore, 1.0));
    
    if (maxScore > 0.5) {
        console.log(`🏷️ 브랜드 감지: ${detectedBrand} (신뢰도: ${(maxScore * 100).toFixed(1)}%)`);
    }
    
    return {
        brand: detectedBrand,
        confidence: maxScore
    };
}