// Fashion Image Search v19.1 - Fixed UI & Hybrid Model
// UI 복원 및 MobileNet/EfficientNet 하이브리드
// 2025-01-03

console.log('🚀 Fashion Search v19.1 - Fixed UI & Hybrid Model');

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v19.1.0-FIXED-UI';
        this.dbName = 'fashionSearchDB_v19_1';
        this.db = null;
        this.currentMode = 'search';
        this.currentSearchFile = null;
        this.models = {
            mobileNet: null,
            efficientNet: null,
            knnClassifier: null,
            activeModel: 'mobilenet'  // 현재 사용 중인 모델
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
            
            // MobileNet 먼저 로드 (빠르고 안정적)
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet v2 로드 완료');
            this.updateStatus('✅ MobileNet 준비 완료!');
            
            // KNN Classifier
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.2/dist/knn-classifier.min.js');
            this.models.knnClassifier = knnClassifier.create();
            console.log('✅ KNN Classifier 로드 완료');
            
            // EfficientNet 시도 (실패해도 계속 진행)
            this.tryLoadEfficientNet();
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능은 사용 가능합니다.');
        }
    }
    
    async tryLoadEfficientNet() {
        try {
            console.log('🔄 EfficientNet 로드 시도 중... (선택적)');
            
            // 간단한 테스트로 TFHub 접근 가능 여부 확인
            const testUrl = 'https://tfhub.dev/tensorflow/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/3/default/1';
            
            const response = await fetch(testUrl, { method: 'HEAD' }).catch(() => null);
            
            if (response && response.ok) {
                // TFHub 접근 가능하면 EfficientNet 시도
                const efficientNetUrl = 'https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b0/feature-vector/1/default/1';
                
                this.models.efficientNet = await tf.loadGraphModel(efficientNetUrl, {
                    fromTFHub: true
                });
                
                this.models.activeModel = 'efficientnet';
                console.log('✅ EfficientNet B0 로드 성공!');
                this.updateStatus('✅ EfficientNet 고정확도 모드 활성화!');
            } else {
                console.log('ℹ️ EfficientNet 로드 스킵 (네트워크 문제). MobileNet 사용.');
            }
        } catch (error) {
            console.log('ℹ️ EfficientNet 로드 실패. MobileNet으로 계속 진행:', error.message);
            // 실패해도 문제없음 - MobileNet 사용
        }
    }
    
    // 색상 특징 추출
    async extractColorFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        // 평균 RGB 값
        let totalR = 0, totalG = 0, totalB = 0;
        let blackCount = 0, brownCount = 0, whiteCount = 0;
        
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            totalR += r;
            totalG += g;
            totalB += b;
            
            const avg = (r + g + b) / 3;
            
            // 색상 분류
            if (avg < 50) blackCount++;
            else if (avg > 200) whiteCount++;
            else if (r > g && g > b && r - b > 30) brownCount++;
        }
        
        return [
            totalR / pixelCount / 255,  // 평균 R
            totalG / pixelCount / 255,  // 평균 G
            totalB / pixelCount / 255,  // 평균 B
            blackCount / pixelCount,    // 검정 비율
            brownCount / pixelCount,    // 브라운 비율
            whiteCount / pixelCount     // 흰색 비율
        ];
    }
    
    // 패턴 특징 추출
    async extractPatternFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(imageElement, 0, 0, 64, 64);
        
        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;
        
        let edgeStrength = 0;
        let patternDensity = 0;
        
        for (let y = 1; y < 63; y++) {
            for (let x = 1; x < 63; x++) {
                const idx = (y * 64 + x) * 4;
                
                const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
                const bottom = (data[idx + 256] + data[idx + 257] + data[idx + 258]) / 3;
                
                const diff = Math.abs(center - right) + Math.abs(center - bottom);
                edgeStrength += diff;
                
                if (diff > 30) patternDensity++;
            }
        }
        
        const totalPixels = 62 * 62;
        
        return [
            edgeStrength / totalPixels / 255,
            patternDensity / totalPixels
        ];
    }
    
    // 모델 특징 추출 (MobileNet 또는 EfficientNet)
    async extractModelFeatures(imageElement) {
        if (this.models.activeModel === 'efficientnet' && this.models.efficientNet) {
            // EfficientNet 사용
            try {
                const inputSize = 224;
                const canvas = document.createElement('canvas');
                canvas.width = inputSize;
                canvas.height = inputSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imageElement, 0, 0, inputSize, inputSize);
                
                const imageTensor = tf.tidy(() => {
                    let imgTensor = tf.browser.fromPixels(canvas);
                    imgTensor = tf.div(imgTensor, 255.0);
                    return imgTensor.expandDims(0);
                });
                
                const output = await this.models.efficientNet.predict(imageTensor);
                const features = await output.array();
                
                imageTensor.dispose();
                output.dispose();
                
                return Array.isArray(features[0]) ? features[0] : features;
                
            } catch (error) {
                console.warn('EfficientNet 특징 추출 실패, MobileNet 사용:', error);
                this.models.activeModel = 'mobilenet';
            }
        }
        
        // MobileNet 사용 (기본값)
        if (this.models.mobileNet) {
            const embeddings = this.models.mobileNet.infer(imageElement, true);
            
            const normalized = tf.tidy(() => {
                const norm = tf.norm(embeddings, 2, 1, true);
                return tf.div(embeddings, norm);
            });
            
            const arrayData = await normalized.array();
            
            embeddings.dispose();
            normalized.dispose();
            
            return Array.isArray(arrayData[0]) ? arrayData[0] : arrayData;
        }
        
        // 모델이 없으면 기본값
        return new Array(1280).fill(0);
    }
    
    // 결합된 특징 추출
    async extractCombinedFeatures(imageElement) {
        const [modelFeatures, colorFeatures, patternFeatures] = await Promise.all([
            this.extractModelFeatures(imageElement),
            this.extractColorFeatures(imageElement),
            this.extractPatternFeatures(imageElement)
        ]);
        
        // 모델(1280) + 색상(6) + 패턴(2) = 1288
        return [...modelFeatures, ...colorFeatures, ...patternFeatures];
    }
    
    // 파일 처리
    async processFile(file) {
        const dataUrl = await this.fileToDataUrl(file);
        const img = await this.loadImage(dataUrl);
        
        let embedding = [];
        
        if (this.models.mobileNet || this.models.efficientNet) {
            try {
                embedding = await this.extractCombinedFeatures(img);
                
                if (!embedding || embedding.length === 0) {
                    throw new Error('특징 추출 실패');
                }
                
            } catch (error) {
                console.warn('특징 추출 실패, 기본값 사용:', error.message);
                embedding = new Array(1288).fill(0);
            }
        } else {
            embedding = new Array(1288).fill(0);
        }
        
        const imageData = {
            filename: file.name,
            path: dataUrl,
            embedding: embedding,
            indexed: new Date().toISOString(),
            modelType: this.models.activeModel
        };
        
        await this.saveImageToDB(imageData);
        console.log(`✅ ${file.name} - 임베딩 크기: ${embedding.length} (${this.models.activeModel})`);
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.models.mobileNet && !this.models.efficientNet) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        this.currentSearchFile = file.name;
        console.log('🔍 검색 파일:', this.currentSearchFile);
        console.log('🤖 사용 모델:', this.models.activeModel);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                document.getElementById('searchStatus').textContent = `🔍 ${this.models.activeModel.toUpperCase()}로 검색 중...`;
                
                try {
                    const features = await this.extractCombinedFeatures(img);
                    console.log('검색 임베딩 크기:', features.length);
                    
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
    
    // 유사 이미지 검색
    async searchSimilar(queryFeatures) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const results = [];
            
            console.log(`검색 대상: ${images.length}개 이미지`);
            
            // 특징 분리
            const queryModel = queryFeatures.slice(0, 1280);
            const queryColor = queryFeatures.slice(1280, 1286);
            const queryPattern = queryFeatures.slice(1286);
            
            for (const image of images) {
                // 자기 자신 제외
                if (this.currentSearchFile && image.filename === this.currentSearchFile) {
                    continue;
                }
                
                if (!image.embedding || image.embedding.length === 0) {
                    continue;
                }
                
                // 특징 분리
                const dbModel = image.embedding.slice(0, 1280);
                const dbColor = image.embedding.slice(1280, 1286) || new Array(6).fill(0);
                const dbPattern = image.embedding.slice(1286) || new Array(2).fill(0);
                
                // 각 특징별 유사도
                const modelSim = this.cosineSimilarity(queryModel, dbModel);
                const colorSim = this.cosineSimilarity(queryColor, dbColor);
                const patternSim = this.cosineSimilarity(queryPattern, dbPattern);
                
                // 가중 평균
                const combinedSim = modelSim * 0.6 + colorSim * 0.25 + patternSim * 0.15;
                
                results.push({
                    ...image,
                    similarity: combinedSim,
                    modelSim: modelSim,
                    colorSim: colorSim,
                    patternSim: patternSim
                });
            }
            
            // 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 디버그 정보
            console.log('=== 상위 5개 결과 ===');
            results.slice(0, 5).forEach((r, i) => {
                console.log(`${i+1}. ${r.filename}: ${(r.similarity * 100).toFixed(1)}%`);
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
            
            return `
                <div class="result-item" data-rank="${index + 1}">
                    <div class="rank-badge" style="background: ${rankColor}">#${index + 1}</div>
                    <img src="${item.path}" alt="${item.filename}">
                    <div class="result-info">
                        <div class="similarity-score ${scoreClass}">${score}%</div>
                        <div style="font-size:12px;color:#666;">${item.filename}</div>
                        <div class="similarity-bar">
                            <div class="similarity-fill" style="width: ${score}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 유틸리티 함수들
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
                    store.createIndex('modelType', 'modelType', { unique: false });
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
                <h1>🎯 Fashion Image Search v19.1</h1>
                <div id="status">🔄 초기화 중...</div>
                
                <div class="mode-buttons">
                    <button class="mode-btn active" data-mode="search">🔍 검색 모드</button>
                    <button class="mode-btn" data-mode="index">📁 인덱싱 모드</button>
                    <button class="mode-btn" data-mode="debug">⚙️ 설정</button>
                </div>
                
                <div id="searchMode" class="mode-content">
                    <div class="upload-area" id="uploadArea">
                        <p>🖼️ 검색할 이미지를 드래그하거나 클릭해서 선택하세요</p>
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
                            🖼️ 이미지 파일 선택 (권장)
                        </button>
                        <button id="selectFolderBtn" class="secondary-btn">
                            📂 폴더 선택 (실험적)
                        </button>
                        <button id="clearDBBtn" class="danger-btn">
                            🗑️ DB 초기화
                        </button>
                    </div>
                    
                    <div id="dropZone" class="drop-zone">
                        <h3>📥 파일 드래그 & 드롭</h3>
                        <p>여러 이미지를 여기에 드래그하세요</p>
                    </div>
                    
                    <div id="indexingProgress"></div>
                </div>
                
                <div id="debugMode" class="mode-content" style="display:none;">
                    <div class="button-group">
                        <button id="validateDBBtn" class="primary-btn">✔️ DB 검증</button>
                        <button id="reindexBtn" class="primary-btn">🔄 재인덱싱</button>
                        <button id="exportDBBtn" class="secondary-btn">💾 DB 내보내기</button>
                        <button id="reinitBtn" class="danger-btn">💣 완전 초기화</button>
                    </div>
                    
                    <div id="debugOutput"></div>
                </div>
            </div>
            
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                }
                
                #fashionSearchApp {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                
                h1 {
                    text-align: center;
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 2.5em;
                }
                
                #status {
                    text-align: center;
                    margin-bottom: 25px;
                    color: #666;
                    font-size: 14px;
                }
                
                .mode-buttons {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 30px;
                    justify-content: center;
                }
                
                .mode-btn {
                    padding: 12px 24px;
                    border: 2px solid #667eea;
                    background: white;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s;
                    color: #667eea;
                    font-weight: 500;
                }
                
                .mode-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }
                
                .mode-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: transparent;
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
                }
                
                .upload-area.dragover {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
                    border-color: #764ba2;
                    transform: scale(1.02);
                }
                
                .drop-zone {
                    border: 3px dashed #667eea;
                    border-radius: 15px;
                    padding: 40px 20px;
                    text-align: center;
                    margin: 20px 0;
                    background: #f8f9ff;
                    transition: all 0.3s;
                }
                
                .drop-zone.dragover {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
                    border-color: #764ba2;
                    transform: scale(1.02);
                }
                
                #previewContainer {
                    text-align: center;
                    margin: 20px 0;
                }
                
                #previewImage {
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    margin-bottom: 15px;
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
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                    background: white;
                    border: 1px solid #eee;
                }
                
                .result-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                
                .result-item img {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    display: block;
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
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                
                .result-info {
                    padding: 12px;
                    background: white;
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
                    flex-wrap: wrap;
                }
                
                .primary-btn, .secondary-btn, .danger-btn {
                    padding: 15px 30px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s;
                    font-weight: 500;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                
                .primary-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .secondary-btn {
                    background: white;
                    color: #667eea;
                    border: 2px solid #667eea;
                }
                
                .danger-btn {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                    color: white;
                }
                
                .primary-btn:hover, .secondary-btn:hover, .danger-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                }
                
                #indexingProgress {
                    text-align: center;
                    margin: 20px 0;
                    padding: 20px;
                    background: #f8f9ff;
                    border-radius: 10px;
                    min-height: 100px;
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
                    font-size: 13px;
                    line-height: 1.5;
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
        
        // 드래그 앤 드롭 (검색)
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
        
        // 인덱싱 모드 - 파일 선택
        document.getElementById('selectFilesBtn')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            
            input.onchange = async (e) => {
                const files = Array.from(e.target.files);
                await this.indexFiles(files);
            };
            
            input.click();
        });
        
        // 인덱싱 모드 - 폴더 선택
        document.getElementById('selectFolderBtn')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.webkitdirectory = true;
            input.multiple = true;
            
            input.onchange = async (e) => {
                const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
                if (files.length > 0) {
                    await this.indexFiles(files);
                } else {
                    alert('선택한 폴더에 이미지 파일이 없습니다.');
                }
            };
            
            input.click();
        });
        
        // 드래그 앤 드롭 (인덱싱)
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            
            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length > 0) {
                    await this.indexFiles(files);
                }
            });
        }
        
        // DB 관리
        document.getElementById('clearDBBtn')?.addEventListener('click', async () => {
            if (confirm('정말로 DB를 초기화하시겠습니까? 모든 인덱싱된 이미지가 삭제됩니다.')) {
                await this.clearDB();
                document.getElementById('indexingProgress').innerHTML = '<p>✅ DB가 초기화되었습니다.</p>';
            }
        });
        
        // 디버그 모드
        document.getElementById('validateDBBtn')?.addEventListener('click', () => this.validateDB());
        document.getElementById('reindexBtn')?.addEventListener('click', () => this.reindexAll());
        document.getElementById('exportDBBtn')?.addEventListener('click', () => this.exportDB());
        document.getElementById('reinitBtn')?.addEventListener('click', () => this.completeReinit());
    }
    
    // 파일 인덱싱
    async indexFiles(files) {
        console.log(`선택된 파일: ${files.length}개`);
        
        if (files.length === 0) return;
        
        const progressDiv = document.getElementById('indexingProgress');
        const startTime = Date.now();
        
        progressDiv.innerHTML = `
            <h3>🔄 인덱싱 준비 중...</h3>
            <p>모델: ${this.models.activeModel.toUpperCase()}</p>
        `;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length * 100).toFixed(1);
            
            progressDiv.innerHTML = `
                <h3>🔄 인덱싱 진행 중... (${i + 1}/${files.length})</h3>
                <p>현재 파일: ${file.name}</p>
                <p>모델: ${this.models.activeModel.toUpperCase()}</p>
                <div style="width:100%;background:#e0e0e0;border-radius:10px;overflow:hidden;margin-top:10px;">
                    <div style="width:${progress}%;background:linear-gradient(90deg,#667eea,#764ba2);height:20px;transition:width 0.3s;"></div>
                </div>
                <p style="margin-top:10px;font-size:12px;color:#666;">진행률: ${progress}%</p>
            `;
            
            try {
                await this.processFile(file);
                await new Promise(resolve => setTimeout(resolve, 50)); // UI 업데이트를 위한 지연
            } catch (error) {
                console.error(`파일 처리 실패 (${file.name}):`, error);
            }
        }
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        progressDiv.innerHTML = `
            <h3>✅ 인덱싱 완료!</h3>
            <p>처리된 이미지: ${files.length}개</p>
            <p>소요 시간: ${elapsedTime}초</p>
            <p>모델: ${this.models.activeModel.toUpperCase()}</p>
            <p style="margin-top:15px;color:#667eea;">이제 검색 모드에서 이미지를 검색할 수 있습니다!</p>
        `;
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
            report += `총 이미지 수: ${images.length}개\n`;
            report += `현재 활성 모델: ${this.models.activeModel.toUpperCase()}\n\n`;
            
            const stats = {
                mobilenet: 0,
                efficientnet: 0,
                unknown: 0
            };
            
            images.forEach(img => {
                const modelType = img.modelType || 'unknown';
                stats[modelType] = (stats[modelType] || 0) + 1;
            });
            
            report += `=== 모델별 인덱싱 분포 ===\n`;
            report += `MobileNet: ${stats.mobilenet}개\n`;
            report += `EfficientNet: ${stats.efficientnet}개\n`;
            report += `Unknown: ${stats.unknown}개\n\n`;
            
            if (images.length > 0) {
                report += `=== 샘플 데이터 (최근 5개) ===\n`;
                images.slice(-5).forEach((img, i) => {
                    report += `${i+1}. ${img.filename}\n`;
                    report += `   - 모델: ${img.modelType || 'unknown'}\n`;
                    report += `   - 임베딩 크기: ${img.embedding ? img.embedding.length : 0}\n`;
                    report += `   - 인덱싱 시간: ${img.indexed || 'unknown'}\n\n`;
                });
            }
            
            output.textContent = report;
        };
    }
    
    async reindexAll() {
        if (!confirm('모든 이미지를 재인덱싱하시겠습니까? 시간이 오래 걸릴 수 있습니다.')) {
            return;
        }
        
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const images = request.result;
            if (images.length === 0) {
                alert('재인덱싱할 이미지가 없습니다.');
                return;
            }
            
            // 기존 DB 클리어
            await this.clearDB();
            
            // 재인덱싱
            const progressDiv = document.getElementById('debugOutput');
            
            for (let i = 0; i < images.length; i++) {
                progressDiv.textContent = `재인덱싱 중... (${i + 1}/${images.length})`;
                
                // dataUrl에서 이미지 다시 로드
                const img = await this.loadImage(images[i].path);
                const embedding = await this.extractCombinedFeatures(img);
                
                const imageData = {
                    filename: images[i].filename,
                    path: images[i].path,
                    embedding: embedding,
                    indexed: new Date().toISOString(),
                    modelType: this.models.activeModel
                };
                
                await this.saveImageToDB(imageData);
            }
            
            progressDiv.textContent = `✅ 재인덱싱 완료! (${images.length}개 이미지)`;
        };
    }
    
    async exportDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const exportData = {
                version: this.version,
                exportDate: new Date().toISOString(),
                modelType: this.models.activeModel,
                imageCount: images.length,
                images: images.map(img => ({
                    filename: img.filename,
                    embeddingSize: img.embedding ? img.embedding.length : 0,
                    indexed: img.indexed,
                    modelType: img.modelType
                }))
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fashion_search_db_export_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            document.getElementById('debugOutput').textContent = `✅ DB 메타데이터를 내보냈습니다. (${images.length}개 이미지)`;
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