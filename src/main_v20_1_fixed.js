// Fashion Image Search v20.1 - Fixed UI and Event Handlers
// 이벤트 리스너 및 UI 버그 수정 버전
// 2025-01-03

console.log('🚀 Fashion Search v20.1 - Fixed UI');

// 전역 변수로 app 인스턴스 선언
let app;

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v20.1.0-FIXED-UI';
        this.dbName = 'fashionSearchDB_v20_1';
        this.db = null;
        this.currentMode = 'search';
        this.currentSearchFile = null;
        this.models = {
            mobileNet: null,
            cocoSsd: null,  // 객체 감지 모델 (더 정확한 가방 인식)
            activeModel: 'standard',
            highAccuracyAvailable: false
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
            
            // 백그라운드에서 모델 로드
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
            if (tf && tf.getBackend() !== 'webgl') {
                await tf.setBackend('webgl');
                console.log('✅ WebGL 가속 활성화');
            }
            
            // 표준 모델: MobileNet V2
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet V2 (표준) 로드 완료');
            this.updateStatus('✅ 표준 모델 준비 완료!');
            
            // 고정확도 모델: COCO-SSD (객체 감지)
            await this.loadCocoSsd();
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능은 사용 가능합니다.');
        }
    }
    
    async loadCocoSsd() {
        try {
            console.log('🔄 COCO-SSD 고정확도 모델 로드 중...');
            this.updateStatus('⏳ 고정확도 모델 로딩 중...');
            
            // COCO-SSD 모델 로드
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js');
            this.models.cocoSsd = await cocoSsd.load();
            
            this.models.highAccuracyAvailable = true;
            console.log('✅ COCO-SSD 고정확도 모델 로드 성공!');
            this.updateStatus('✅ 고정확도 모델 사용 가능!');
            this.updateModelToggle();
            
        } catch (error) {
            console.log('ℹ️ COCO-SSD 로드 실패, 대체 모델 시도:', error.message);
            await this.loadAlternativeModel();
        }
    }
    
    async loadAlternativeModel() {
        try {
            // 대안: 더 큰 MobileNet 사용
            this.models.cocoSsd = await mobilenet.load({
                version: 2,
                alpha: 1.4  // 최대 크기
            });
            
            this.models.highAccuracyAvailable = true;
            console.log('✅ 대체 고정확도 모델 로드 성공!');
            this.updateStatus('✅ 고정확도 모델 사용 가능!');
            this.updateModelToggle();
            
        } catch (error) {
            console.log('❌ 모든 고정확도 모델 로드 실패:', error);
            this.models.highAccuracyAvailable = false;
            this.updateStatus('✅ 표준 모델만 사용 가능');
            this.updateModelToggle();
        }
    }
    
    updateModelToggle() {
        const toggleBtn = document.getElementById('modelToggleBtn');
        if (toggleBtn) {
            if (this.models.highAccuracyAvailable) {
                toggleBtn.disabled = false;
                toggleBtn.textContent = this.models.activeModel === 'high' 
                    ? '🚀 고정확도 모드 ON (COCO-SSD)' 
                    : '⚡ 표준 모드 ON (MobileNet)';
                toggleBtn.style.opacity = '1';
                toggleBtn.style.cursor = 'pointer';
            } else {
                toggleBtn.disabled = true;
                toggleBtn.textContent = '⚡ 표준 모드만 사용 가능';
                toggleBtn.style.opacity = '0.5';
                toggleBtn.style.cursor = 'not-allowed';
            }
        }
    }
    
    toggleModel() {
        if (!this.models.highAccuracyAvailable) {
            alert('고정확도 모델이 로드되지 않았습니다.');
            return;
        }
        
        this.models.activeModel = this.models.activeModel === 'standard' ? 'high' : 'standard';
        this.updateModelToggle();
        
        const modelName = this.models.activeModel === 'high' ? '고정확도 모드 (COCO-SSD)' : '표준 모드 (MobileNet)';
        this.updateStatus(`✅ ${modelName} 활성화됨`);
        console.log(`모델 전환: ${this.models.activeModel}`);
    }
    
    // COCO-SSD로 객체 감지 + 특징 추출
    async extractHighAccuracyFeatures(imageElement) {
        if (!this.models.cocoSsd) {
            return this.extractStandardFeatures(imageElement);
        }
        
        try {
            // COCO-SSD가 실제 객체 감지 모델인 경우만 detect 사용
            if (typeof this.models.cocoSsd.detect === 'function') {
                // COCO-SSD로 객체 감지
                const predictions = await this.models.cocoSsd.detect(imageElement);
                
                console.log('객체 감지 결과:', predictions);
                
                // 가방 관련 객체 찾기
                const bagRelated = predictions.filter(p => 
                    ['handbag', 'backpack', 'suitcase', 'umbrella'].includes(p.class) ||
                    p.score > 0.3
                );
                
                // 객체 영역 특징
                const objectFeatures = new Array(10).fill(0);
                if (bagRelated.length > 0) {
                    const best = bagRelated[0];
                    objectFeatures[0] = best.score;  // 신뢰도
                    objectFeatures[1] = best.bbox[0] / imageElement.width;  // x 위치
                    objectFeatures[2] = best.bbox[1] / imageElement.height; // y 위치
                    objectFeatures[3] = best.bbox[2] / imageElement.width;  // 너비
                    objectFeatures[4] = best.bbox[3] / imageElement.height; // 높이
                    objectFeatures[5] = (best.bbox[2] * best.bbox[3]) / (imageElement.width * imageElement.height); // 면적 비율
                    objectFeatures[6] = best.class === 'handbag' ? 1 : 0;
                    objectFeatures[7] = best.class === 'backpack' ? 1 : 0;
                    objectFeatures[8] = bagRelated.length / 10;  // 객체 수
                    objectFeatures[9] = 1;  // 객체 감지됨
                }
                
                // MobileNet 특징도 함께 추출
                const mobileNetFeatures = await this.extractStandardFeatures(imageElement);
                
                // 결합: MobileNet(1280) + 객체(10) = 1290
                return [...mobileNetFeatures, ...objectFeatures];
            } else {
                // 대체 모델 (더 큰 MobileNet)인 경우
                const embeddings = this.models.cocoSsd.infer(imageElement, true);
                const normalized = tf.tidy(() => {
                    const norm = tf.norm(embeddings, 2, 1, true);
                    return tf.div(embeddings, norm);
                });
                const arrayData = await normalized.array();
                embeddings.dispose();
                normalized.dispose();
                return Array.isArray(arrayData[0]) ? arrayData[0] : arrayData;
            }
            
        } catch (error) {
            console.error('고정확도 특징 추출 실패:', error);
            return this.extractStandardFeatures(imageElement);
        }
    }
    
    // 표준 MobileNet 특징 추출
    async extractStandardFeatures(imageElement) {
        if (!this.models.mobileNet) {
            return new Array(1280).fill(0);
        }
        
        try {
            const embeddings = this.models.mobileNet.infer(imageElement, true);
            
            const normalized = tf.tidy(() => {
                const norm = tf.norm(embeddings, 2, 1, true);
                return tf.div(embeddings, norm);
            });
            
            const arrayData = await normalized.array();
            
            embeddings.dispose();
            normalized.dispose();
            
            return Array.isArray(arrayData[0]) ? arrayData[0] : arrayData;
            
        } catch (error) {
            console.error('표준 특징 추출 오류:', error);
            return new Array(1280).fill(0);
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
        
        // LAB 색공간으로 변환 (더 정확한 색상 구분)
        let totalL = 0, totalA = 0, totalB = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const rgb = [data[i]/255, data[i+1]/255, data[i+2]/255];
            const lab = this.rgbToLab(rgb);
            totalL += lab[0];
            totalA += lab[1];
            totalB += lab[2];
        }
        
        const pixelCount = data.length / 4;
        
        return [
            totalL / pixelCount / 100,  // L (밝기)
            (totalA / pixelCount + 128) / 255,  // a (녹색-적색)
            (totalB / pixelCount + 128) / 255   // b (청색-황색)
        ];
    }
    
    // RGB to LAB 변환
    rgbToLab(rgb) {
        // RGB to XYZ
        let [r, g, b] = rgb.map(val => {
            if (val > 0.04045) {
                return Math.pow((val + 0.055) / 1.055, 2.4);
            }
            return val / 12.92;
        });
        
        r *= 100;
        g *= 100;
        b *= 100;
        
        const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
        const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
        
        // XYZ to LAB
        const xn = 95.047;
        const yn = 100.000;
        const zn = 108.883;
        
        const fx = this.labF(x / xn);
        const fy = this.labF(y / yn);
        const fz = this.labF(z / zn);
        
        const L = 116 * fy - 16;
        const a = 500 * (fx - fy);
        const b = 200 * (fy - fz);
        
        return [L, a, b];
    }
    
    labF(t) {
        if (t > 0.008856) {
            return Math.pow(t, 1/3);
        }
        return 7.787 * t + 16/116;
    }
    
    // 결합된 특징 추출
    async extractCombinedFeatures(imageElement) {
        console.time('특징 추출');
        
        let modelFeatures;
        if (this.models.activeModel === 'high' && this.models.cocoSsd) {
            modelFeatures = await this.extractHighAccuracyFeatures(imageElement);
        } else {
            modelFeatures = await this.extractStandardFeatures(imageElement);
        }
        
        const colorFeatures = await this.extractColorFeatures(imageElement);
        
        console.timeEnd('특징 추출');
        
        // 표준: 1280 + 3 = 1283
        // 고정확도: 1290 + 3 = 1293
        return [...modelFeatures, ...colorFeatures];
    }
    
    // 파일 처리
    async processFile(file) {
        const dataUrl = await this.fileToDataUrl(file);
        const img = await this.loadImage(dataUrl);
        
        let embedding = [];
        
        if (this.models.mobileNet || this.models.cocoSsd) {
            try {
                embedding = await this.extractCombinedFeatures(img);
                
                if (!embedding || embedding.length === 0) {
                    throw new Error('특징 추출 실패');
                }
                
            } catch (error) {
                console.warn('특징 추출 실패, 기본값 사용:', error.message);
                embedding = new Array(1283).fill(0);
            }
        } else {
            embedding = new Array(1283).fill(0);
        }
        
        const imageData = {
            filename: file.name,
            path: dataUrl,
            embedding: embedding,
            indexed: new Date().toISOString(),
            modelType: this.models.activeModel,
            featureSize: embedding.length
        };
        
        await this.saveImageToDB(imageData);
        console.log(`✅ ${file.name} - 임베딩 크기: ${embedding.length} (${this.models.activeModel})`);
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.models.mobileNet && !this.models.cocoSsd) {
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
                document.getElementById('searchStatus').textContent = `🔍 ${this.models.activeModel === 'high' ? 'COCO-SSD 고정확도' : 'MobileNet 표준'} 모드로 검색 중...`;
                
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
            
            for (const image of images) {
                if (this.currentSearchFile && image.filename === this.currentSearchFile) {
                    continue;
                }
                
                if (!image.embedding || image.embedding.length === 0) {
                    continue;
                }
                
                // 특징 벡터 길이 맞추기
                const minLen = Math.min(queryFeatures.length, image.embedding.length);
                const querySlice = queryFeatures.slice(0, minLen);
                const dbSlice = image.embedding.slice(0, minLen);
                
                const similarity = this.cosineSimilarity(querySlice, dbSlice);
                
                results.push({
                    ...image,
                    similarity: similarity
                });
            }
            
            results.sort((a, b) => b.similarity - a.similarity);
            
            console.log('=== 상위 5개 결과 ===');
            results.slice(0, 5).forEach((r, i) => {
                console.log(`${i+1}. ${r.filename}: ${(r.similarity * 100).toFixed(1)}%`);
            });
            
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
                    store.createIndex('featureSize', 'featureSize', { unique: false });
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
                <h1>🎯 Fashion Image Search v20.1</h1>
                <div id="status">🔄 초기화 중...</div>
                
                <div style="text-align:center; margin: 10px 0;">
                    <button id="modelToggleBtn" class="model-toggle">
                        ⏳ 모델 로딩 중...
                    </button>
                </div>
                
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
                        <button id="modelInfoBtn" class="primary-btn">🤖 모델 정보</button>
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
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
                    margin-bottom: 15px;
                    color: #666;
                    font-size: 14px;
                }
                
                .model-toggle {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 14px;
                }
                
                .model-toggle:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }
                
                .model-toggle:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
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
                    border-color: #764ba2;
                    background: #e8ebff;
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
                    border-color: #764ba2;
                    background: #e8ebff;
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
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // 모델 토글 버튼
        const modelToggleBtn = document.getElementById('modelToggleBtn');
        if (modelToggleBtn) {
            modelToggleBtn.addEventListener('click', () => this.toggleModel());
        }
        
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
        
        if (uploadArea && fileInput) {
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
        }
        
        // 인덱싱 모드 버튼들
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        if (selectFilesBtn) {
            selectFilesBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                
                input.onchange = async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                        await this.indexFiles(files);
                    }
                };
                
                input.click();
            });
        }
        
        const selectFolderBtn = document.getElementById('selectFolderBtn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.webkitdirectory = true;
                input.directory = true;
                input.multiple = true;
                
                input.onchange = async (e) => {
                    const allFiles = Array.from(e.target.files);
                    const imageFiles = allFiles.filter(f => {
                        return f.type.startsWith('image/') || 
                               /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f.name);
                    });
                    
                    if (imageFiles.length > 0) {
                        if (confirm(`${imageFiles.length}개의 이미지를 발견했습니다. 인덱싱을 시작하시겠습니까?`)) {
                            await this.indexFiles(imageFiles);
                        }
                    } else {
                        alert('선택한 폴더에 이미지 파일이 없습니다.');
                    }
                };
                
                input.click();
            });
        }
        
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
        
        // DB 관리 버튼들
        const clearDBBtn = document.getElementById('clearDBBtn');
        if (clearDBBtn) {
            clearDBBtn.addEventListener('click', async () => {
                if (confirm('정말로 DB를 초기화하시겠습니까?')) {
                    await this.clearDB();
                    document.getElementById('indexingProgress').innerHTML = '<p>✅ DB가 초기화되었습니다.</p>';
                }
            });
        }
        
        // 디버그 모드 버튼들
        const validateDBBtn = document.getElementById('validateDBBtn');
        if (validateDBBtn) {
            validateDBBtn.addEventListener('click', () => this.validateDB());
        }
        
        const modelInfoBtn = document.getElementById('modelInfoBtn');
        if (modelInfoBtn) {
            modelInfoBtn.addEventListener('click', () => this.showModelInfo());
        }
        
        const exportDBBtn = document.getElementById('exportDBBtn');
        if (exportDBBtn) {
            exportDBBtn.addEventListener('click', () => this.exportDB());
        }
        
        const reinitBtn = document.getElementById('reinitBtn');
        if (reinitBtn) {
            reinitBtn.addEventListener('click', () => this.completeReinit());
        }
    }
    
    // 파일 인덱싱
    async indexFiles(files) {
        if (files.length === 0) return;
        
        const progressDiv = document.getElementById('indexingProgress');
        const startTime = Date.now();
        
        progressDiv.innerHTML = `
            <h3>🔄 인덱싱 준비 중...</h3>
            <p>총 ${files.length}개 파일</p>
            <p>모델: ${this.models.activeModel === 'high' ? 'COCO-SSD 고정확도' : 'MobileNet 표준'}</p>
        `;
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length * 100).toFixed(1);
            
            progressDiv.innerHTML = `
                <h3>🔄 인덱싱 진행 중... (${i + 1}/${files.length})</h3>
                <p>현재 파일: ${file.name}</p>
                <p>모델: ${this.models.activeModel === 'high' ? 'COCO-SSD 고정확도' : 'MobileNet 표준'}</p>
                <div style="width:100%;background:#e0e0e0;border-radius:10px;overflow:hidden;margin-top:10px;">
                    <div style="width:${progress}%;background:linear-gradient(90deg,#667eea,#764ba2);height:20px;"></div>
                </div>
                <p style="margin-top:10px;font-size:12px;">성공: ${successCount} | 실패: ${failCount}</p>
            `;
            
            try {
                await this.processFile(file);
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error(`파일 처리 실패 (${file.name}):`, error);
                failCount++;
            }
        }
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        progressDiv.innerHTML = `
            <h3>✅ 인덱싱 완료!</h3>
            <p>성공: ${successCount}개 | 실패: ${failCount}개</p>
            <p>소요 시간: ${elapsedTime}초</p>
            <p>모델: ${this.models.activeModel === 'high' ? 'COCO-SSD 고정확도' : 'MobileNet 표준'}</p>
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
            report += `현재 모델: ${this.models.activeModel === 'high' ? 'COCO-SSD 고정확도' : 'MobileNet 표준'}\n`;
            report += `고정확도 사용 가능: ${this.models.highAccuracyAvailable ? '예' : '아니오'}\n\n`;
            
            if (images.length > 0) {
                const modelTypes = {};
                const featureSizes = {};
                
                images.forEach(img => {
                    const type = img.modelType || 'unknown';
                    const size = img.featureSize || img.embedding?.length || 0;
                    
                    modelTypes[type] = (modelTypes[type] || 0) + 1;
                    featureSizes[size] = (featureSizes[size] || 0) + 1;
                });
                
                report += `=== 모델별 분포 ===\n`;
                Object.entries(modelTypes).forEach(([type, count]) => {
                    report += `${type}: ${count}개\n`;
                });
                
                report += `\n=== 특징 벡터 크기 분포 ===\n`;
                Object.entries(featureSizes).forEach(([size, count]) => {
                    report += `${size}차원: ${count}개\n`;
                });
                
                report += `\n=== 최근 5개 이미지 ===\n`;
                images.slice(-5).forEach((img, i) => {
                    report += `${i+1}. ${img.filename} (${img.featureSize || img.embedding?.length}차원)\n`;
                });
            }
            
            output.textContent = report;
        };
    }
    
    showModelInfo() {
        const output = document.getElementById('debugOutput');
        
        let info = `=== 모델 정보 ===\n\n`;
        info += `[표준 모델 - MobileNet V2]\n`;
        info += `상태: ${this.models.mobileNet ? '✅ 로드됨' : '❌ 미로드'}\n`;
        info += `용도: 일반 이미지 특징 추출\n`;
        info += `특징: 빠른 속도, 적당한 정확도\n`;
        info += `차원: 1280\n\n`;
        
        info += `[고정확도 모델 - COCO-SSD]\n`;
        info += `상태: ${this.models.cocoSsd ? '✅ 로드됨' : '❌ 미로드'}\n`;
        info += `용도: 객체 감지 및 분류\n`;
        info += `특징: 가방, 백팩 등 객체 인식\n`;
        info += `추가 차원: 10 (객체 정보)\n\n`;
        
        info += `[현재 활성 모델]\n`;
        info += `${this.models.activeModel === 'high' ? 'COCO-SSD 고정확도' : 'MobileNet 표준'} 모드\n\n`;
        
        info += `[특징 추출 구성]\n`;
        if (this.models.activeModel === 'high') {
            info += `MobileNet: 1280차원\n`;
            info += `객체 감지: 10차원\n`;
            info += `LAB 색상: 3차원\n`;
            info += `총: 1293차원\n`;
        } else {
            info += `MobileNet: 1280차원\n`;
            info += `LAB 색상: 3차원\n`;
            info += `총: 1283차원\n`;
        }
        
        output.textContent = info;
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
                imageCount: images.length,
                models: {
                    standard: 'MobileNet V2',
                    highAccuracy: 'COCO-SSD Object Detection'
                }
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fashion_search_export_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            document.getElementById('debugOutput').textContent = `✅ DB 메타데이터를 내보냈습니다. (${images.length}개 이미지)`;
        };
    }
    
    async completeReinit() {
        if (confirm('완전 초기화를 진행하시겠습니까?')) {
            indexedDB.deleteDatabase(this.dbName);
            alert('DB가 초기화되었습니다. 페이지를 새로고침합니다.');
            location.reload();
        }
    }
}

// 앱 시작 - 전역 변수로 설정
window.addEventListener('DOMContentLoaded', () => {
    app = new LuxuryFashionSearchApp();
});
