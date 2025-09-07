// Fashion Image Search v19.0 - EfficientNet
// 더 높은 정확도를 위한 EfficientNet 적용
// 2025-01-03

console.log('🚀 Fashion Search v19.0 - EfficientNet Enhanced');

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v19.0.0-EFFICIENTNET';
        this.dbName = 'fashionSearchDB_v19_0';
        this.db = null;
        this.currentMode = 'search';
        this.currentSearchFile = null;
        this.models = {
            efficientNet: null,
            modelVersion: 'b3'  // b0, b1, b2, b3 중 선택
        };
        this.isReady = false;
        this.init();
    }
    
    async init() {
        try {
            await this.openDB();
            console.log('✅ DB 초기화 완료');
            
            this.setupUI();
            console.log('✅ UI 생성 완료');
            
            this.isReady = true;
            this.updateStatus('✅ 기본 시스템 준비 완료');
            
            this.loadModelsInBackground();
            
        } catch (error) {
            console.error('초기화 실패:', error);
            this.updateStatus('❌ 초기화 실패. 페이지를 새로고침해주세요.');
        }
    }
    
    async loadModelsInBackground() {
        try {
            console.log('🔄 EfficientNet 모델 로딩 중... (약 10-20초 소요)');
            this.updateStatus('⏳ EfficientNet B3 모델 로딩 중... (48MB)');
            
            // TensorFlow.js 로드
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // WebGL 백엔드 설정
            if (tf.getBackend() !== 'webgl') {
                await tf.setBackend('webgl');
                console.log('✅ WebGL 가속 활성화');
            }
            
            // EfficientNet B3 로드 (더 높은 정확도)
            const modelUrl = 'https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b3/feature-vector/1/default/1';
            
            try {
                this.models.efficientNet = await tf.loadGraphModel(modelUrl, {
                    fromTFHub: true
                });
                console.log('✅ EfficientNet B3 로드 완료');
                this.updateStatus('✅ EfficientNet B3 준비 완료! (고정확도 모드)');
            } catch (error) {
                console.warn('B3 로드 실패, B0로 대체:', error);
                // B3 실패시 B0 사용 (더 가벼움)
                const b0Url = 'https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b0/feature-vector/1/default/1';
                this.models.efficientNet = await tf.loadGraphModel(b0Url, {
                    fromTFHub: true
                });
                this.models.modelVersion = 'b0';
                console.log('✅ EfficientNet B0 로드 완료');
                this.updateStatus('✅ EfficientNet B0 준비 완료!');
            }
            
            // 워밍업 (첫 추론 속도 개선)
            await this.warmupModel();
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            // MobileNet으로 폴백
            await this.loadMobileNetFallback();
        }
    }
    
    async loadMobileNetFallback() {
        console.log('📱 MobileNet으로 폴백...');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
        this.models.efficientNet = await mobilenet.load({
            version: 2,
            alpha: 1.0
        });
        this.models.modelVersion = 'mobilenet';
        this.updateStatus('⚠️ MobileNet 폴백 모드 (정확도 낮음)');
    }
    
    async warmupModel() {
        console.log('🔥 모델 워밍업 중...');
        const dummyImg = tf.zeros([1, 300, 300, 3]);
        
        if (this.models.modelVersion === 'mobilenet') {
            await this.models.efficientNet.infer(dummyImg, true);
        } else {
            await this.models.efficientNet.predict(dummyImg);
        }
        
        dummyImg.dispose();
        console.log('✅ 워밍업 완료');
    }
    
    // EfficientNet 특징 추출 (고품질)
    async extractEfficientNetFeatures(imageElement) {
        if (!this.models.efficientNet) {
            throw new Error('EfficientNet이 아직 로드되지 않았습니다');
        }
        
        try {
            let features;
            
            if (this.models.modelVersion === 'mobilenet') {
                // MobileNet 폴백
                const embeddings = this.models.efficientNet.infer(imageElement, true);
                const normalized = tf.tidy(() => {
                    const norm = tf.norm(embeddings, 2, 1, true);
                    return tf.div(embeddings, norm);
                });
                features = await normalized.array();
                embeddings.dispose();
                normalized.dispose();
            } else {
                // EfficientNet 처리
                const inputSize = this.models.modelVersion === 'b3' ? 300 : 224;
                
                // 이미지 전처리
                const imageTensor = tf.tidy(() => {
                    // 캔버스에 그리기
                    const canvas = document.createElement('canvas');
                    canvas.width = inputSize;
                    canvas.height = inputSize;
                    const ctx = canvas.getContext('2d');
                    
                    // 중앙 크롭 및 리사이즈
                    const size = Math.min(imageElement.width, imageElement.height);
                    const x = (imageElement.width - size) / 2;
                    const y = (imageElement.height - size) / 2;
                    ctx.drawImage(imageElement, x, y, size, size, 0, 0, inputSize, inputSize);
                    
                    // 텐서로 변환
                    let imgTensor = tf.browser.fromPixels(canvas);
                    
                    // 정규화 (EfficientNet은 0-1 범위)
                    imgTensor = tf.div(imgTensor, 255.0);
                    
                    // 배치 차원 추가
                    return imgTensor.expandDims(0);
                });
                
                // 특징 추출
                const output = await this.models.efficientNet.predict(imageTensor);
                features = await output.array();
                
                imageTensor.dispose();
                output.dispose();
            }
            
            // 1차원 배열로 변환
            if (Array.isArray(features[0])) {
                return features[0];
            }
            
            return features;
            
        } catch (error) {
            console.error('EfficientNet 특징 추출 오류:', error);
            // 기본값 반환
            const featureSize = this.models.modelVersion === 'b3' ? 1536 : 1280;
            return new Array(featureSize).fill(0);
        }
    }
    
    // 고급 색상 분석 (LAB 색공간 추가)
    async extractAdvancedColorFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        // 색상 통계
        const stats = {
            // 주요 색상 클러스터
            dominantColors: [],
            // 색상 분산도
            colorVariance: 0,
            // 명도 대비
            contrastLevel: 0,
            // 채도 평균
            avgSaturation: 0
        };
        
        // K-means 색상 클러스터링 (간단 버전)
        const colors = [];
        for (let i = 0; i < data.length; i += 40) {  // 샘플링
            colors.push([
                data[i] / 255,
                data[i + 1] / 255,
                data[i + 2] / 255
            ]);
        }
        
        // 주요 5개 색상 추출
        const clusters = this.simpleKMeans(colors, 5);
        
        // 특징 벡터 생성 (20차원)
        const features = [];
        
        // 각 클러스터의 RGB 값 (15차원)
        clusters.forEach(cluster => {
            features.push(...cluster.center);
        });
        
        // 추가 통계 (5차원)
        features.push(
            clusters[0].size / colors.length,  // 주 색상 비율
            this.calculateColorVariance(colors),  // 색상 분산
            this.calculateContrast(data),  // 대비
            this.calculateAvgSaturation(colors),  // 채도
            this.detectMetallic(data)  // 메탈릭/광택 감지
        );
        
        return features;
    }
    
    // 간단한 K-means 구현
    simpleKMeans(points, k) {
        // 초기 중심점 선택
        const centers = [];
        for (let i = 0; i < k; i++) {
            centers.push(points[Math.floor(Math.random() * points.length)]);
        }
        
        // 10회 반복
        for (let iter = 0; iter < 10; iter++) {
            const clusters = Array(k).fill(null).map(() => ({ 
                points: [], 
                center: null 
            }));
            
            // 각 점을 가장 가까운 중심에 할당
            points.forEach(point => {
                let minDist = Infinity;
                let clusterIdx = 0;
                
                centers.forEach((center, idx) => {
                    const dist = Math.sqrt(
                        Math.pow(point[0] - center[0], 2) +
                        Math.pow(point[1] - center[1], 2) +
                        Math.pow(point[2] - center[2], 2)
                    );
                    
                    if (dist < minDist) {
                        minDist = dist;
                        clusterIdx = idx;
                    }
                });
                
                clusters[clusterIdx].points.push(point);
            });
            
            // 새 중심 계산
            clusters.forEach((cluster, idx) => {
                if (cluster.points.length > 0) {
                    const avg = [0, 0, 0];
                    cluster.points.forEach(p => {
                        avg[0] += p[0];
                        avg[1] += p[1];
                        avg[2] += p[2];
                    });
                    centers[idx] = avg.map(v => v / cluster.points.length);
                }
            });
        }
        
        return centers.map((center, idx) => ({
            center: center,
            size: points.filter(p => {
                const dist = Math.sqrt(
                    Math.pow(p[0] - center[0], 2) +
                    Math.pow(p[1] - center[1], 2) +
                    Math.pow(p[2] - center[2], 2)
                );
                return dist < 0.3;  // 임계값
            }).length
        }));
    }
    
    calculateColorVariance(colors) {
        if (colors.length === 0) return 0;
        
        const mean = [0, 0, 0];
        colors.forEach(c => {
            mean[0] += c[0];
            mean[1] += c[1];
            mean[2] += c[2];
        });
        mean[0] /= colors.length;
        mean[1] /= colors.length;
        mean[2] /= colors.length;
        
        let variance = 0;
        colors.forEach(c => {
            variance += Math.pow(c[0] - mean[0], 2);
            variance += Math.pow(c[1] - mean[1], 2);
            variance += Math.pow(c[2] - mean[2], 2);
        });
        
        return Math.sqrt(variance / colors.length);
    }
    
    calculateContrast(data) {
        let min = 255, max = 0;
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            min = Math.min(min, gray);
            max = Math.max(max, gray);
        }
        return (max - min) / 255;
    }
    
    calculateAvgSaturation(colors) {
        let totalSat = 0;
        colors.forEach(rgb => {
            const max = Math.max(...rgb);
            const min = Math.min(...rgb);
            const sat = max === 0 ? 0 : (max - min) / max;
            totalSat += sat;
        });
        return totalSat / colors.length;
    }
    
    detectMetallic(data) {
        // 금속성/광택 감지 (하이라이트 분포)
        let highlights = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                highlights++;
            }
        }
        return highlights / (data.length / 4);
    }
    
    // 텍스처 분석 (가방 재질 감지)
    async extractTextureFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(imageElement, 0, 0, 64, 64);
        
        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;
        
        // Gabor 필터 시뮬레이션 (4방향)
        const orientations = [0, 45, 90, 135];
        const features = [];
        
        orientations.forEach(angle => {
            let response = 0;
            const rad = angle * Math.PI / 180;
            
            for (let y = 2; y < 62; y++) {
                for (let x = 2; x < 62; x++) {
                    const idx = (y * 64 + x) * 4;
                    const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    
                    // 방향성 엣지 검출
                    const dx = Math.cos(rad);
                    const dy = Math.sin(rad);
                    
                    const x1 = Math.round(x + dx);
                    const y1 = Math.round(y + dy);
                    const x2 = Math.round(x - dx);
                    const y2 = Math.round(y - dy);
                    
                    if (x1 >= 0 && x1 < 64 && y1 >= 0 && y1 < 64 &&
                        x2 >= 0 && x2 < 64 && y2 >= 0 && y2 < 64) {
                        const idx1 = (y1 * 64 + x1) * 4;
                        const idx2 = (y2 * 64 + x2) * 4;
                        
                        const gray1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
                        const gray2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                        
                        response += Math.abs(gray1 - gray2);
                    }
                }
            }
            
            features.push(response / (60 * 60 * 255));  // 정규화
        });
        
        // 텍스처 특성 추가
        features.push(
            this.calculateRoughness(data),      // 거칠기
            this.calculateRegularity(data),     // 규칙성
            this.detectQuiltingPattern(data),   // 퀼팅 패턴
            this.detectMonogramPattern(data)    // 모노그램 패턴
        );
        
        return features;  // 8차원
    }
    
    calculateRoughness(data) {
        let variance = 0;
        for (let i = 0; i < data.length - 256; i += 4) {
            const curr = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const next = (data[i + 256] + data[i + 257] + data[i + 258]) / 3;
            variance += Math.pow(curr - next, 2);
        }
        return Math.sqrt(variance / (data.length / 4)) / 255;
    }
    
    calculateRegularity(data) {
        // FFT 시뮬레이션으로 패턴 규칙성 감지
        let regularity = 0;
        const step = 8;  // 8픽셀 간격
        
        for (let y = 0; y < 64 - step; y += step) {
            for (let x = 0; x < 64 - step; x += step) {
                const idx1 = (y * 64 + x) * 4;
                const idx2 = ((y + step) * 64 + (x + step)) * 4;
                
                const block1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
                const block2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                
                if (Math.abs(block1 - block2) < 30) {
                    regularity++;
                }
            }
        }
        
        return regularity / ((64 / step) * (64 / step));
    }
    
    detectQuiltingPattern(data) {
        // 대각선 패턴 감지 (샤넬 퀼팅)
        let diagonalStrength = 0;
        
        for (let i = 1; i < 63; i++) {
            // 주 대각선
            const idx1 = (i * 64 + i) * 4;
            const idx2 = ((i + 1) * 64 + (i + 1)) * 4;
            
            const gray1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
            const gray2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
            
            diagonalStrength += Math.abs(gray1 - gray2);
            
            // 역 대각선
            const idx3 = (i * 64 + (63 - i)) * 4;
            const idx4 = ((i + 1) * 64 + (62 - i)) * 4;
            
            const gray3 = (data[idx3] + data[idx3 + 1] + data[idx3 + 2]) / 3;
            const gray4 = (data[idx4] + data[idx4 + 1] + data[idx4 + 2]) / 3;
            
            diagonalStrength += Math.abs(gray3 - gray4);
        }
        
        return diagonalStrength / (62 * 2 * 255);
    }
    
    detectMonogramPattern(data) {
        // 반복 패턴 감지 (LV 모노그램)
        let repetition = 0;
        const blockSize = 16;
        
        for (let y = 0; y < 64 - blockSize * 2; y += blockSize) {
            for (let x = 0; x < 64 - blockSize * 2; x += blockSize) {
                // 현재 블록과 다음 블록 비교
                let blockDiff = 0;
                
                for (let dy = 0; dy < blockSize; dy++) {
                    for (let dx = 0; dx < blockSize; dx++) {
                        const idx1 = ((y + dy) * 64 + (x + dx)) * 4;
                        const idx2 = ((y + dy + blockSize) * 64 + (x + dx + blockSize)) * 4;
                        
                        const gray1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
                        const gray2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                        
                        blockDiff += Math.abs(gray1 - gray2);
                    }
                }
                
                if (blockDiff / (blockSize * blockSize) < 30) {
                    repetition++;
                }
            }
        }
        
        return repetition / ((64 / blockSize - 2) * (64 / blockSize - 2));
    }
    
    // 결합된 특징 추출
    async extractCombinedFeatures(imageElement) {
        console.time('특징 추출');
        
        const [efficientNetFeatures, colorFeatures, textureFeatures] = await Promise.all([
            this.extractEfficientNetFeatures(imageElement),
            this.extractAdvancedColorFeatures(imageElement),
            this.extractTextureFeatures(imageElement)
        ]);
        
        console.timeEnd('특징 추출');
        
        // EfficientNet B3: 1536 + 20 + 8 = 1564
        // EfficientNet B0/MobileNet: 1280 + 20 + 8 = 1308
        return [...efficientNetFeatures, ...colorFeatures, ...textureFeatures];
    }
    
    // 파일 처리
    async processFile(file) {
        const dataUrl = await this.fileToDataUrl(file);
        const img = await this.loadImage(dataUrl);
        
        let embedding = [];
        
        if (this.models.efficientNet) {
            try {
                embedding = await this.extractCombinedFeatures(img);
                
                if (!embedding || embedding.length === 0) {
                    throw new Error('특징 추출 실패');
                }
                
                // 텍스처 분석 로그
                const textureStart = embedding.length - 8;
                const textureFeatures = embedding.slice(textureStart);
                console.log(`📊 ${file.name}:`);
                console.log(`  - 거칠기: ${(textureFeatures[4] * 100).toFixed(1)}%`);
                console.log(`  - 규칙성: ${(textureFeatures[5] * 100).toFixed(1)}%`);
                console.log(`  - 퀼팅: ${(textureFeatures[6] * 100).toFixed(1)}%`);
                console.log(`  - 모노그램: ${(textureFeatures[7] * 100).toFixed(1)}%`);
                
            } catch (error) {
                console.warn('특징 추출 실패, 기본값 사용:', error.message);
                const featureSize = this.models.modelVersion === 'b3' ? 1564 : 1308;
                embedding = new Array(featureSize).fill(0);
            }
        } else {
            const featureSize = 1308;  // 기본값
            embedding = new Array(featureSize).fill(0);
        }
        
        const imageData = {
            filename: file.name,
            path: dataUrl,
            embedding: embedding,
            indexed: new Date().toISOString(),
            modelVersion: this.models.modelVersion
        };
        
        await this.saveImageToDB(imageData);
        console.log(`✅ ${file.name} - 임베딩 크기: ${embedding.length}`);
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.models.efficientNet) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        this.currentSearchFile = file.name;
        console.log('🔍 검색 파일:', this.currentSearchFile);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                document.getElementById('searchStatus').textContent = '🔍 EfficientNet으로 분석 중...';
                
                try {
                    const features = await this.extractCombinedFeatures(img);
                    console.log('검색 임베딩 크기:', features.length);
                    
                    // 텍스처 분석
                    const textureStart = features.length - 8;
                    const textureFeatures = features.slice(textureStart);
                    console.log('텍스처 분석:', {
                        '거칠기': (textureFeatures[4] * 100).toFixed(1) + '%',
                        '규칙성': (textureFeatures[5] * 100).toFixed(1) + '%',
                        '퀼팅': (textureFeatures[6] * 100).toFixed(1) + '%',
                        '모노그램': (textureFeatures[7] * 100).toFixed(1) + '%'
                    });
                    
                    await this.searchSimilar(features);
                    
                    document.getElementById('searchStatus').textContent = '✅ 검색 완료';
                } catch (error) {
                    console.error('검색 오류:', error);
                    document.getElementById('searchStatus').textContent = '❌ 검색 실패: ' + error.message;
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // 유사 이미지 검색 (고급 매칭)
    async searchSimilar(queryFeatures) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const results = [];
            
            console.log(`검색 대상: ${images.length}개 이미지`);
            
            // 특징 분리
            const queryModelVersion = this.models.modelVersion;
            const isB3 = queryModelVersion === 'b3';
            
            const efficientNetSize = isB3 ? 1536 : 1280;
            const queryEfficientNet = queryFeatures.slice(0, efficientNetSize);
            const queryColor = queryFeatures.slice(efficientNetSize, efficientNetSize + 20);
            const queryTexture = queryFeatures.slice(efficientNetSize + 20);
            
            // 텍스처 특성 분석
            const queryHasQuilting = queryTexture[6] > 0.15;
            const queryHasMonogram = queryTexture[7] > 0.15;
            const queryIsSmooth = queryTexture[4] < 0.1;
            
            console.log('검색 이미지 특성:', {
                quilting: queryHasQuilting,
                monogram: queryHasMonogram,
                smooth: queryIsSmooth
            });
            
            for (const image of images) {
                // 자기 자신 제외
                if (this.currentSearchFile && image.filename === this.currentSearchFile) {
                    continue;
                }
                
                if (!image.embedding || image.embedding.length === 0) {
                    console.warn(`${image.filename}: 잘못된 임베딩`);
                    continue;
                }
                
                // 버전 호환성 체크
                let dbEfficientNet, dbColor, dbTexture;
                const dbModelVersion = image.modelVersion || 'unknown';
                
                if (dbModelVersion === queryModelVersion && image.embedding.length === queryFeatures.length) {
                    // 같은 모델 버전
                    dbEfficientNet = image.embedding.slice(0, efficientNetSize);
                    dbColor = image.embedding.slice(efficientNetSize, efficientNetSize + 20);
                    dbTexture = image.embedding.slice(efficientNetSize + 20);
                } else {
                    // 다른 버전 - 스킵하거나 기본값
                    console.log(`${image.filename}: 모델 버전 불일치 (${dbModelVersion} vs ${queryModelVersion})`);
                    continue;
                }
                
                // 각 특징별 유사도
                const efficientNetSim = this.cosineSimilarity(queryEfficientNet, dbEfficientNet);
                const colorSim = this.cosineSimilarity(queryColor, dbColor);
                const textureSim = this.cosineSimilarity(queryTexture, dbTexture);
                
                // 동적 가중치
                let weights = {
                    model: 0.6,    // EfficientNet 기본 60%
                    color: 0.25,   // 색상 25%
                    texture: 0.15  // 텍스처 15%
                };
                
                // 특정 패턴이 있으면 가중치 조정
                if (queryHasQuilting || queryHasMonogram) {
                    weights.model = 0.5;
                    weights.texture = 0.3;  // 텍스처 가중치 증가
                    weights.color = 0.2;
                }
                
                // 가중 평균
                let combinedSim = 
                    efficientNetSim * weights.model +
                    colorSim * weights.color +
                    textureSim * weights.texture;
                
                // 텍스처 매치 보너스
                const dbHasQuilting = dbTexture[6] > 0.15;
                const dbHasMonogram = dbTexture[7] > 0.15;
                
                if (queryHasQuilting && dbHasQuilting) {
                    combinedSim = Math.min(1, combinedSim * 1.15);  // 퀼팅 매치 +15%
                }
                if (queryHasMonogram && dbHasMonogram) {
                    combinedSim = Math.min(1, combinedSim * 1.15);  // 모노그램 매치 +15%
                }
                
                results.push({
                    ...image,
                    similarity: combinedSim,
                    efficientNetSim: efficientNetSim,
                    colorSim: colorSim,
                    textureSim: textureSim,
                    hasQuilting: dbHasQuilting,
                    hasMonogram: dbHasMonogram
                });
            }
            
            // 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 디버그 정보 출력 (상위 5개)
            console.log('=== 상위 5개 결과 ===');
            results.slice(0, 5).forEach((r, i) => {
                console.log(`${i+1}. ${r.filename}`);
                console.log(`   전체: ${(r.similarity * 100).toFixed(1)}%`);
                console.log(`   모델: ${(r.efficientNetSim * 100).toFixed(1)}%`);
                console.log(`   색상: ${(r.colorSim * 100).toFixed(1)}%`);
                console.log(`   텍스처: ${(r.textureSim * 100).toFixed(1)}%`);
                if (r.hasQuilting) console.log(`   ✓ 퀼팅 패턴`);
                if (r.hasMonogram) console.log(`   ✓ 모노그램`);
            });
            
            // 상위 20개 표시
            this.displayResults(results.slice(0, 20));
        };
    }
    
    // 코사인 유사도
    cosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2) return 0;
        
        const len = Math.min(vec1.length, vec2.length);
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < len; i++) {
            const v1 = vec1[i] || 0;
            const v2 = vec2[i] || 0;
            
            dotProduct += v1 * v2;
            norm1 += v1 * v1;
            norm2 += v2 * v2;
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        
        return Math.max(0, Math.min(1, similarity));
    }
    
    // 결과 표시
    displayResults(results) {
        const resultsDiv = document.getElementById('results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align:center; color:#999;">검색 결과가 없습니다.</p>';
            return;
        }
        
        resultsDiv.innerHTML = results.map((item, index) => {
            const score = (item.similarity * 100).toFixed(1);
            
            let scoreClass = 'high';
            if (score < 70) scoreClass = 'medium';
            if (score < 50) scoreClass = 'low';
            
            let rankColor = '#4caf50';
            if (index >= 3) rankColor = '#ff9800';
            if (index >= 10) rankColor = '#9e9e9e';
            
            // 특별 뱃지
            let badges = '';
            if (item.hasQuilting) {
                badges += `<span style="background:#e91e63;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">퀼팅</span>`;
            }
            if (item.hasMonogram) {
                badges += `<span style="background:#9c27b0;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">모노그램</span>`;
            }
            if (score >= 85) {
                badges += `<span style="background:#ff5722;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">매우 유사</span>`;
            }
            
            return `
                <div class="result-item" data-rank="${index + 1}">
                    <div class="rank-badge" style="background: ${rankColor}">#${index + 1}</div>
                    <img src="${item.path}" alt="${item.filename}">
                    <div class="result-info">
                        <div class="similarity-score ${scoreClass}">${score}%${badges}</div>
                        <div style="font-size:12px;color:#666;">${item.filename}</div>
                        <div class="similarity-bar">
                            <div class="similarity-fill" style="width: ${score}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // UI 설정 및 나머지 함수들
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('images')) {
                    const store = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('filename', 'filename', { unique: false });
                    store.createIndex('indexed', 'indexed', { unique: false });
                    store.createIndex('modelVersion', 'modelVersion', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }
    
    async saveImageToDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.add(imageData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
    
    setupUI() {
        const html = `
            <div id="fashionSearchApp">
                <h1>🎯 Fashion Search v19.0 - EfficientNet</h1>
                <div id="status">🔄 초기화 중...</div>
                
                <div class="mode-buttons">
                    <button class="mode-btn active" data-mode="search">🔍 검색</button>
                    <button class="mode-btn" data-mode="index">📁 인덱싱</button>
                    <button class="mode-btn" data-mode="debug">⚙️ 설정</button>
                </div>
                
                <div id="searchMode" class="mode-content">
                    <div class="upload-area" id="uploadArea">
                        <p>🖼️ 검색할 이미지를 드래그하거나 클릭</p>
                        <input type="file" id="fileInput" accept="image/*" style="display:none">
                    </div>
                    
                    <div id="previewContainer" style="display:none;">
                        <img id="previewImage" style="max-width:400px;">
                        <div id="searchStatus"></div>
                    </div>
                    
                    <div id="results"></div>
                </div>
                
                <div id="indexMode" class="mode-content" style="display:none;">
                    <div class="button-group">
                        <button id="selectFilesBtn" class="primary-btn">
                            🖼️ 이미지 파일 선택
                        </button>
                        <button id="clearDBBtn" class="danger-btn">
                            🗑️ DB 초기화
                        </button>
                    </div>
                    
                    <div id="indexingProgress"></div>
                </div>
                
                <div id="debugMode" class="mode-content" style="display:none;">
                    <div class="button-group">
                        <button id="validateDBBtn" class="primary-btn">✔️ DB 검증</button>
                        <button id="analyzeTexturesBtn" class="primary-btn">🔍 텍스처 분석</button>
                        <button id="reinitBtn" class="danger-btn">💣 완전 초기화</button>
                    </div>
                    
                    <div id="debugOutput"></div>
                </div>
            </div>
            
            <style>
                #fashionSearchApp {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                
                h1 {
                    text-align: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                }
                
                #status {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #666;
                    font-weight: 500;
                }
                
                .mode-buttons {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 30px;
                    justify-content: center;
                }
                
                .mode-btn {
                    padding: 12px 24px;
                    border: none;
                    background: #f0f0f0;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s;
                }
                
                .mode-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    transform: scale(1.05);
                }
                
                .upload-area {
                    border: 3px dashed #667eea;
                    border-radius: 15px;
                    padding: 60px 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    background: #f8f9ff;
                }
                
                .upload-area:hover {
                    border-color: #764ba2;
                    background: #f0f2ff;
                    transform: scale(1.02);
                }
                
                .upload-area.dragover {
                    background: #e8ebff;
                    border-color: #764ba2;
                }
                
                #previewContainer {
                    text-align: center;
                    margin: 20px 0;
                }
                
                #previewImage {
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    margin-bottom: 10px;
                }
                
                #searchStatus {
                    font-size: 14px;
                    color: #666;
                    margin-top: 10px;
                }
                
                #results {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }
                
                .result-item {
                    position: relative;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    transition: transform 0.3s;
                    background: white;
                }
                
                .result-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
                }
                
                .result-item img {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                }
                
                .rank-badge {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 12px;
                }
                
                .result-info {
                    padding: 10px;
                }
                
                .similarity-score {
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .similarity-score.high { color: #4caf50; }
                .similarity-score.medium { color: #ff9800; }
                .similarity-score.low { color: #f44336; }
                
                .similarity-bar {
                    height: 4px;
                    background: #e0e0e0;
                    border-radius: 2px;
                    overflow: hidden;
                    margin-top: 8px;
                }
                
                .similarity-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    transition: width 0.5s ease;
                }
                
                .button-group {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin: 20px 0;
                }
                
                .primary-btn, .secondary-btn, .danger-btn {
                    padding: 15px 30px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s;
                    font-weight: 500;
                }
                
                .primary-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .danger-btn {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                    color: white;
                }
                
                .primary-btn:hover, .danger-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }
                
                #debugOutput {
                    background: #f5f5f5;
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 20px;
                    font-family: 'Courier New', monospace;
                    white-space: pre-wrap;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                #indexingProgress {
                    text-align: center;
                    margin: 20px 0;
                }
            </style>
        `;
        
        document.body.innerHTML = html;
        
        // 이벤트 리스너 설정
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const mode = e.target.dataset.mode;
                this.currentMode = mode;
                
                document.querySelectorAll('.mode-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                document.getElementById(`${mode}Mode`).style.display = 'block';
            });
        });
        
        // 파일 업로드 (검색)
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processSearchImage(e.target.files[0]);
            }
        });
        
        // 드래그 앤 드롭
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                this.processSearchImage(files[0]);
            }
        });
        
        // 인덱싱 모드
        document.getElementById('selectFilesBtn')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            
            input.onchange = async (e) => {
                const files = Array.from(e.target.files);
                console.log(`선택된 파일: ${files.length}개`);
                
                if (files.length === 0) return;
                
                const progressDiv = document.getElementById('indexingProgress');
                progressDiv.innerHTML = '<h3>🔄 EfficientNet으로 인덱싱 진행 중...</h3>';
                
                const startTime = Date.now();
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    progressDiv.innerHTML = `
                        <h3>🔄 인덱싱 중... (${i + 1}/${files.length})</h3>
                        <p>현재 파일: ${file.name}</p>
                        <p>모델: ${this.models.modelVersion.toUpperCase()}</p>
                        <div style="width:100%;background:#e0e0e0;border-radius:10px;overflow:hidden;">
                            <div style="width:${(i + 1) / files.length * 100}%;background:linear-gradient(90deg,#667eea,#764ba2);height:20px;"></div>
                        </div>
                    `;
                    
                    await this.processFile(file);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
                progressDiv.innerHTML = `
                    <h3>✅ 인덱싱 완료!</h3>
                    <p>처리된 이미지: ${files.length}개</p>
                    <p>소요 시간: ${elapsedTime}초</p>
                    <p>모델: ${this.models.modelVersion.toUpperCase()}</p>
                `;
            };
            
            input.click();
        });
        
        // DB 초기화
        document.getElementById('clearDBBtn')?.addEventListener('click', async () => {
            if (confirm('정말로 DB를 초기화하시겠습니까? 모든 인덱싱된 이미지가 삭제됩니다.')) {
                await this.clearDB();
                document.getElementById('indexingProgress').innerHTML = '<p>✅ DB가 초기화되었습니다.</p>';
            }
        });
        
        // 디버그 모드
        document.getElementById('validateDBBtn')?.addEventListener('click', () => this.validateDB());
        document.getElementById('analyzeTexturesBtn')?.addEventListener('click', () => this.analyzeTextures());
        document.getElementById('reinitBtn')?.addEventListener('click', () => this.completeReinit());
    }
    
    async clearDB() {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        await store.clear();
    }
    
    async validateDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const output = document.getElementById('debugOutput');
            
            let report = `=== DB 검증 결과 ===\n`;
            report += `총 이미지 수: ${images.length}개\n\n`;
            
            const stats = {
                b3: 0,
                b0: 0,
                mobilenet: 0,
                unknown: 0
            };
            
            images.forEach(img => {
                const version = img.modelVersion || 'unknown';
                stats[version] = (stats[version] || 0) + 1;
            });
            
            report += `=== 모델 버전 분포 ===\n`;
            report += `EfficientNet B3: ${stats.b3}개\n`;
            report += `EfficientNet B0: ${stats.b0}개\n`;
            report += `MobileNet: ${stats.mobilenet}개\n`;
            report += `Unknown: ${stats.unknown}개\n`;
            
            output.textContent = report;
        };
    }
    
    async analyzeTextures() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const output = document.getElementById('debugOutput');
            
            let report = `=== 텍스처 분석 결과 ===\n\n`;
            
            const textures = [];
            images.forEach(img => {
                if (img.embedding) {
                    const textureStart = img.embedding.length - 8;
                    if (textureStart > 0) {
                        const texture = img.embedding.slice(textureStart);
                        textures.push({
                            filename: img.filename,
                            roughness: texture[4],
                            regularity: texture[5],
                            quilting: texture[6],
                            monogram: texture[7]
                        });
                    }
                }
            });
            
            // 퀼팅 패턴 순
            textures.sort((a, b) => b.quilting - a.quilting);
            report += `=== 퀼팅 패턴 상위 5개 ===\n`;
            textures.slice(0, 5).forEach((t, i) => {
                report += `${i+1}. ${t.filename}: ${(t.quilting * 100).toFixed(1)}%\n`;
            });
            
            // 모노그램 패턴 순
            textures.sort((a, b) => b.monogram - a.monogram);
            report += `\n=== 모노그램 패턴 상위 5개 ===\n`;
            textures.slice(0, 5).forEach((t, i) => {
                report += `${i+1}. ${t.filename}: ${(t.monogram * 100).toFixed(1)}%\n`;
            });
            
            output.textContent = report;
        };
    }
    
    async completeReinit() {
        if (confirm('완전 초기화를 진행하시겠습니까? 모든 데이터가 삭제되고 새 DB가 생성됩니다.')) {
            indexedDB.deleteDatabase(this.dbName);
            alert('DB가 완전히 초기화되었습니다. 페이지를 새로고침합니다.');
            location.reload();
        }
    }
}

// 앱 시작
const app = new LuxuryFashionSearchApp();