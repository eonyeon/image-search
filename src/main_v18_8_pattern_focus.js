// Fashion Image Search v18.8 - Pattern Focus
// 배경 제거 및 패턴 중심 매칭
// 2025-01-03

console.log('🚀 Fashion Search v18.8 - Pattern Focus');

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v18.8.0-PATTERN-FOCUS';
        this.dbName = 'fashionSearchDB_v18_8';
        this.db = null;
        this.currentMode = 'search';
        this.currentSearchFile = null;
        this.models = {
            mobileNet: null,
            knnClassifier: null
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
            console.log('🔄 백그라운드에서 AI 모델 로딩 중...');
            
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet v2 로드 완료');
            
            if (tf.getBackend() !== 'webgl') {
                await tf.setBackend('webgl');
                console.log('✅ WebGL 가속 활성화');
            }
            
            this.updateStatus('✅ 모든 시스템 준비 완료!');
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능은 사용 가능합니다.');
        }
    }
    
    // 이미지 중앙 크롭 (배경 영향 최소화)
    async cropCenter(imageElement, cropSize = 224) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = cropSize;
        canvas.height = cropSize;
        
        const imgWidth = imageElement.width;
        const imgHeight = imageElement.height;
        
        // 중앙 부분만 크롭
        const size = Math.min(imgWidth, imgHeight);
        const x = (imgWidth - size) / 2;
        const y = (imgHeight - size) / 2;
        
        ctx.drawImage(imageElement, x, y, size, size, 0, 0, cropSize, cropSize);
        
        return canvas;
    }
    
    // 패턴 특징 추출 (텍스처 분석)
    async extractPatternFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(imageElement, 0, 0, 64, 64);
        
        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;
        
        // 패턴 복잡도 계산 (엣지 검출)
        let edgeStrength = 0;
        let patternDensity = 0;
        let horizontalLines = 0;
        let verticalLines = 0;
        let diagonalLines = 0;
        
        for (let y = 1; y < 63; y++) {
            for (let x = 1; x < 63; x++) {
                const idx = (y * 64 + x) * 4;
                
                // 주변 픽셀과의 차이 계산
                const center = data[idx] + data[idx + 1] + data[idx + 2];
                const left = data[idx - 4] + data[idx - 3] + data[idx - 2];
                const right = data[idx + 4] + data[idx + 5] + data[idx + 6];
                const top = data[idx - 256] + data[idx - 255] + data[idx - 254];
                const bottom = data[idx + 256] + data[idx + 257] + data[idx + 258];
                
                const hDiff = Math.abs(right - left);
                const vDiff = Math.abs(bottom - top);
                
                // 패턴 방향성 분석
                if (hDiff > 100) horizontalLines++;
                if (vDiff > 100) verticalLines++;
                if (Math.abs(hDiff - vDiff) < 30 && hDiff > 50) diagonalLines++;
                
                edgeStrength += (hDiff + vDiff) / 2;
                
                // 패턴 밀도
                if (hDiff > 50 || vDiff > 50) patternDensity++;
            }
        }
        
        // 정규화
        const totalPixels = 62 * 62;
        
        return [
            edgeStrength / totalPixels / 255,           // 엣지 강도
            patternDensity / totalPixels,               // 패턴 밀도
            horizontalLines / totalPixels,              // 수평선 비율
            verticalLines / totalPixels,                // 수직선 비율
            diagonalLines / totalPixels,                // 대각선 비율
            (horizontalLines + verticalLines + diagonalLines) / totalPixels  // 전체 패턴
        ];
    }
    
    // 색상 히스토그램 (더 정밀한 색상 분석)
    async extractColorHistogram(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        // HSV 변환 및 히스토그램
        const hueHist = new Array(12).fill(0);  // 30도 간격
        const satHist = new Array(4).fill(0);   // 채도 레벨
        const valHist = new Array(4).fill(0);   // 명도 레벨
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // RGB to HSV
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const diff = max - min;
            
            let h = 0;
            if (diff !== 0) {
                if (max === r) h = ((g - b) / diff + 6) % 6;
                else if (max === g) h = (b - r) / diff + 2;
                else h = (r - g) / diff + 4;
            }
            
            const s = max === 0 ? 0 : diff / max;
            const v = max;
            
            // 히스토그램 업데이트
            const hueIdx = Math.floor(h * 2) % 12;
            const satIdx = Math.floor(s * 4);
            const valIdx = Math.floor(v * 4);
            
            hueHist[hueIdx]++;
            satHist[Math.min(3, satIdx)]++;
            valHist[Math.min(3, valIdx)]++;
        }
        
        // 정규화
        const pixelCount = 10000;
        const features = [
            ...hueHist.map(h => h / pixelCount),
            ...satHist.map(s => s / pixelCount),
            ...valHist.map(v => v / pixelCount)
        ];
        
        return features; // 20 features
    }
    
    // MobileNet 특징 추출 (중앙 크롭 적용)
    async extractMobileNetFeatures(imageElement) {
        if (!this.models.mobileNet) {
            throw new Error('MobileNet이 아직 로드되지 않았습니다');
        }
        
        try {
            // 중앙 크롭 적용
            const croppedCanvas = await this.cropCenter(imageElement);
            
            const embeddings = this.models.mobileNet.infer(croppedCanvas, true);
            
            const normalized = tf.tidy(() => {
                const norm = tf.norm(embeddings, 2, 1, true);
                return tf.div(embeddings, norm);
            });
            
            const arrayData = await normalized.array();
            
            embeddings.dispose();
            normalized.dispose();
            
            if (Array.isArray(arrayData[0])) {
                return arrayData[0];
            }
            
            return arrayData;
            
        } catch (error) {
            console.error('MobileNet 특징 추출 오류:', error);
            return new Array(1280).fill(0);
        }
    }
    
    // 결합된 특징 추출
    async extractCombinedFeatures(imageElement) {
        const [mobileNetFeatures, patternFeatures, colorHistogram] = await Promise.all([
            this.extractMobileNetFeatures(imageElement),
            this.extractPatternFeatures(imageElement),
            this.extractColorHistogram(imageElement)
        ]);
        
        // 1280 + 6 + 20 = 1306 features
        return [...mobileNetFeatures, ...patternFeatures, ...colorHistogram];
    }
    
    // 파일 처리
    async processFile(file) {
        const dataUrl = await this.fileToDataUrl(file);
        const img = await this.loadImage(dataUrl);
        
        let embedding = [];
        
        if (this.models.mobileNet) {
            try {
                embedding = await this.extractCombinedFeatures(img);
                
                if (!embedding || embedding.length === 0) {
                    throw new Error('특징 추출 실패');
                }
                
                // 패턴 분석 로그
                const patternFeatures = embedding.slice(1280, 1286);
                console.log(`📊 ${file.name} - 패턴 밀도: ${(patternFeatures[1] * 100).toFixed(1)}%`);
                
            } catch (error) {
                console.warn('특징 추출 실패, 기본값 사용:', error.message);
                embedding = new Array(1306).fill(0);
            }
        } else {
            embedding = new Array(1306).fill(0);
        }
        
        const imageData = {
            filename: file.name,
            path: dataUrl,
            embedding: embedding,
            indexed: new Date().toISOString()
        };
        
        await this.saveImageToDB(imageData);
        console.log(`✅ ${file.name} - 임베딩 크기: ${embedding.length}`);
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.models.mobileNet) {
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
                document.getElementById('searchStatus').textContent = '🔍 검색 중...';
                
                try {
                    const features = await this.extractCombinedFeatures(img);
                    console.log('검색 임베딩 크기:', features.length);
                    
                    // 패턴 분석
                    const patternFeatures = features.slice(1280, 1286);
                    console.log('패턴 분석:', {
                        '엣지 강도': (patternFeatures[0] * 100).toFixed(1) + '%',
                        '패턴 밀도': (patternFeatures[1] * 100).toFixed(1) + '%',
                        '수평선': (patternFeatures[2] * 100).toFixed(1) + '%',
                        '수직선': (patternFeatures[3] * 100).toFixed(1) + '%',
                        '대각선': (patternFeatures[4] * 100).toFixed(1) + '%'
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
    
    // 유사 이미지 검색 (패턴 중심 매칭)
    async searchSimilar(queryFeatures) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const results = [];
            
            console.log(`검색 대상: ${images.length}개 이미지`);
            
            // 특징 분리
            const queryMobileNet = queryFeatures.slice(0, 1280);
            const queryPattern = queryFeatures.slice(1280, 1286);
            const queryColor = queryFeatures.slice(1286);
            
            // 패턴 특성 분석
            const queryPatternDensity = queryPattern[1];
            const queryHasPattern = queryPatternDensity > 0.1;  // 10% 이상이면 패턴 있음
            
            console.log('검색 이미지 패턴 특성:', {
                hasPattern: queryHasPattern,
                density: (queryPatternDensity * 100).toFixed(1) + '%'
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
                
                // 특징 분리 (버전 호환성)
                let dbMobileNet, dbPattern, dbColor;
                
                if (image.embedding.length === 1306) {
                    // v18.8 형식
                    dbMobileNet = image.embedding.slice(0, 1280);
                    dbPattern = image.embedding.slice(1280, 1286);
                    dbColor = image.embedding.slice(1286);
                } else if (image.embedding.length >= 1280) {
                    // 이전 버전
                    dbMobileNet = image.embedding.slice(0, 1280);
                    dbPattern = new Array(6).fill(0);
                    dbColor = new Array(20).fill(0);
                } else {
                    continue;
                }
                
                // 각 특징별 유사도
                const mobileNetSim = this.cosineSimilarity(queryMobileNet, dbMobileNet);
                const patternSim = this.cosineSimilarity(queryPattern, dbPattern);
                const colorSim = this.cosineSimilarity(queryColor, dbColor);
                
                // 동적 가중치 (패턴 있는 제품은 패턴 중시)
                let weights = {
                    shape: 0.5,
                    pattern: 0.2,
                    color: 0.3
                };
                
                // 패턴이 있는 제품은 패턴 가중치 증가
                if (queryHasPattern) {
                    weights.shape = 0.4;
                    weights.pattern = 0.35;
                    weights.color = 0.25;
                }
                
                // 가중 평균
                let combinedSim = 
                    mobileNetSim * weights.shape +
                    patternSim * weights.pattern +
                    colorSim * weights.color;
                
                // 패턴 유사도가 매우 높으면 보너스
                if (patternSim > 0.8 && queryHasPattern) {
                    combinedSim = Math.min(1, combinedSim * 1.1);
                }
                
                results.push({
                    ...image,
                    similarity: combinedSim,
                    mobileNetSim: mobileNetSim,
                    patternSim: patternSim,
                    colorSim: colorSim
                });
            }
            
            // 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 디버그 정보 출력 (상위 5개)
            console.log('=== 상위 5개 결과 ===');
            results.slice(0, 5).forEach((r, i) => {
                console.log(`${i+1}. ${r.filename}`);
                console.log(`   전체: ${(r.similarity * 100).toFixed(1)}%`);
                console.log(`   형태: ${(r.mobileNetSim * 100).toFixed(1)}%`);
                console.log(`   패턴: ${(r.patternSim * 100).toFixed(1)}%`);
                console.log(`   색상: ${(r.colorSim * 100).toFixed(1)}%`);
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
            
            // 패턴 유사도가 높으면 표시
            const patternBadge = item.patternSim > 0.7 ? 
                `<span style="background:#9c27b0;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">패턴 매치</span>` : '';
            
            return `
                <div class="result-item" data-rank="${index + 1}">
                    <div class="rank-badge" style="background: ${rankColor}">#${index + 1}</div>
                    <img src="${item.path}" alt="${item.filename}">
                    <div class="result-info">
                        <div class="similarity-score ${scoreClass}">${score}%${patternBadge}</div>
                        <div style="font-size:12px;color:#666;">${item.filename}</div>
                        <div class="similarity-bar">
                            <div class="similarity-fill" style="width: ${score}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // UI 설정 및 나머지 함수들은 동일...
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
                <h1>🎯 Fashion Search v18.8 - Pattern Focus</h1>
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
                        <button id="analyzePatternsBtn" class="primary-btn">🔍 패턴 분석</button>
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
                progressDiv.innerHTML = '<h3>🔄 인덱싱 진행 중...</h3>';
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    progressDiv.innerHTML = `
                        <h3>🔄 인덱싱 중... (${i + 1}/${files.length})</h3>
                        <p>현재 파일: ${file.name}</p>
                        <div style="width:100%;background:#e0e0e0;border-radius:10px;overflow:hidden;">
                            <div style="width:${(i + 1) / files.length * 100}%;background:linear-gradient(90deg,#667eea,#764ba2);height:20px;"></div>
                        </div>
                    `;
                    
                    await this.processFile(file);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                progressDiv.innerHTML = `<h3>✅ 인덱싱 완료! (${files.length}개 이미지)</h3>`;
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
        document.getElementById('analyzePatternsBtn')?.addEventListener('click', () => this.analyzePatterns());
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
                v18_8: 0,
                other: 0,
                withPattern: 0,
                noPattern: 0
            };
            
            images.forEach(img => {
                if (img.embedding) {
                    if (img.embedding.length === 1306) {
                        stats.v18_8++;
                        const pattern = img.embedding.slice(1280, 1286);
                        if (pattern[1] > 0.1) stats.withPattern++;
                        else stats.noPattern++;
                    } else {
                        stats.other++;
                    }
                }
            });
            
            report += `v18.8 형식: ${stats.v18_8}개\n`;
            report += `이전 버전: ${stats.other}개\n`;
            report += `패턴 있음: ${stats.withPattern}개\n`;
            report += `패턴 없음: ${stats.noPattern}개\n`;
            
            output.textContent = report;
        };
    }
    
    async analyzePatterns() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const output = document.getElementById('debugOutput');
            
            let report = `=== 패턴 분석 결과 ===\n\n`;
            
            const patterns = [];
            images.forEach(img => {
                if (img.embedding && img.embedding.length === 1306) {
                    const pattern = img.embedding.slice(1280, 1286);
                    patterns.push({
                        filename: img.filename,
                        density: pattern[1],
                        horizontal: pattern[2],
                        vertical: pattern[3],
                        diagonal: pattern[4]
                    });
                }
            });
            
            // 패턴 밀도 순으로 정렬
            patterns.sort((a, b) => b.density - a.density);
            
            report += `상위 10개 패턴 밀도:\n`;
            patterns.slice(0, 10).forEach((p, i) => {
                report += `${i+1}. ${p.filename}\n`;
                report += `   밀도: ${(p.density * 100).toFixed(1)}%\n`;
                report += `   수평: ${(p.horizontal * 100).toFixed(1)}% | `;
                report += `수직: ${(p.vertical * 100).toFixed(1)}% | `;
                report += `대각: ${(p.diagonal * 100).toFixed(1)}%\n\n`;
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