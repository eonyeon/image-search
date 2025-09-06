// Fashion Image Search v18.6 - Color Enhanced
// 색상 특징 강화 버전
// 2025-01-03

console.log('🚀 Fashion Search v18.6 - Color Enhanced');

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v18.6.0-COLOR-ENHANCED';
        this.dbName = 'fashionSearchDB_v18_6';
        this.db = null;
        this.currentMode = 'search';
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
            
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.2/dist/knn-classifier.min.js');
            this.models.knnClassifier = knnClassifier.create();
            console.log('✅ KNN Classifier 로드 완료');
            
            if (tf.getBackend() !== 'webgl') {
                await tf.setBackend('webgl');
                console.log('✅ WebGL 가속 활성화');
            }
            
            this.updateStatus('✅ 모든 시스템 준비 완료!');
            
            await this.checkAndMigrateDB();
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능은 사용 가능합니다.');
        }
    }
    
    // 색상 특징 추출 (강화된 버전)
    async extractColorFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 더 큰 샘플링 영역 사용
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        // RGB 히스토그램
        const colorBins = {
            red: new Array(16).fill(0),
            green: new Array(16).fill(0),
            blue: new Array(16).fill(0)
        };
        
        // HSV 색상 분포
        let hueHistogram = new Array(12).fill(0);  // 30도씩 12개 구간
        let saturationSum = 0;
        let brightnessSum = 0;
        
        // 주요 색상 카운트
        let blackPixels = 0;
        let whitePixels = 0;
        let brownPixels = 0;
        let beigePixels = 0;
        let navyPixels = 0;
        
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // RGB 히스토그램 업데이트
            colorBins.red[Math.floor(r / 16)]++;
            colorBins.green[Math.floor(g / 16)]++;
            colorBins.blue[Math.floor(b / 16)]++;
            
            // HSV 변환
            const hsv = this.rgbToHsv(r, g, b);
            const hueIndex = Math.floor(hsv.h / 30);
            hueHistogram[hueIndex]++;
            saturationSum += hsv.s;
            brightnessSum += hsv.v;
            
            // 색상 분류 (더 정밀하게)
            const avg = (r + g + b) / 3;
            const maxChannel = Math.max(r, g, b);
            const minChannel = Math.min(r, g, b);
            const range = maxChannel - minChannel;
            
            // 블랙 (순수 검정 + 어두운 회색)
            if (avg < 50) {
                blackPixels++;
            }
            // 화이트 (순수 흰색 + 밝은 회색)
            else if (avg > 220 && range < 30) {
                whitePixels++;
            }
            // 브라운 (갈색 계열)
            else if (r > g && g > b && r - b > 30 && avg > 50 && avg < 150) {
                brownPixels++;
            }
            // 베이지 (밝은 갈색/크림색)
            else if (r > g && g > b && avg > 150 && avg < 220 && range < 50) {
                beigePixels++;
            }
            // 네이비 (어두운 파란색)
            else if (b > r && b > g && avg < 100) {
                navyPixels++;
            }
        }
        
        // 정규화
        const features = {
            // RGB 히스토그램 (48 features)
            rgbHistogram: [
                ...colorBins.red.map(v => v / pixelCount),
                ...colorBins.green.map(v => v / pixelCount),
                ...colorBins.blue.map(v => v / pixelCount)
            ],
            
            // HSV 특징 (14 features)
            hueHistogram: hueHistogram.map(v => v / pixelCount),
            avgSaturation: saturationSum / pixelCount,
            avgBrightness: brightnessSum / pixelCount,
            
            // 주요 색상 비율 (5 features)
            blackRatio: blackPixels / pixelCount,
            whiteRatio: whitePixels / pixelCount,
            brownRatio: brownPixels / pixelCount,
            beigeRatio: beigePixels / pixelCount,
            navyRatio: navyPixels / pixelCount,
            
            // 색상 다양성 (1 feature)
            colorDiversity: this.calculateColorDiversity(colorBins)
        };
        
        // 벡터로 변환 (총 68 features)
        return [
            ...features.rgbHistogram,
            ...features.hueHistogram,
            features.avgSaturation,
            features.avgBrightness,
            features.blackRatio,
            features.whiteRatio,
            features.brownRatio,
            features.beigeRatio,
            features.navyRatio,
            features.colorDiversity
        ];
    }
    
    // RGB to HSV 변환
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        let s = max === 0 ? 0 : diff / max;
        let v = max;
        
        if (diff !== 0) {
            if (max === r) {
                h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
            } else if (max === g) {
                h = ((b - r) / diff + 2) / 6;
            } else {
                h = ((r - g) / diff + 4) / 6;
            }
        }
        
        return {
            h: h * 360,  // 0-360
            s: s,        // 0-1
            v: v         // 0-1
        };
    }
    
    // 색상 다양성 계산
    calculateColorDiversity(colorBins) {
        const allBins = [
            ...colorBins.red,
            ...colorBins.green,
            ...colorBins.blue
        ];
        
        // Shannon entropy 계산
        let entropy = 0;
        const total = allBins.reduce((a, b) => a + b, 0);
        
        for (const count of allBins) {
            if (count > 0) {
                const p = count / total;
                entropy -= p * Math.log2(p);
            }
        }
        
        return entropy / Math.log2(48); // 정규화 (0-1)
    }
    
    // 향상된 특징 추출 (MobileNet + 색상)
    async extractCombinedFeatures(imageElement) {
        // MobileNet 특징 (1280)
        const mobileNetFeatures = await this.extractMobileNetFeatures(imageElement);
        
        // 색상 특징 (68)
        const colorFeatures = await this.extractColorFeatures(imageElement);
        
        // 결합 (총 1348 features)
        return [...mobileNetFeatures, ...colorFeatures];
    }
    
    // MobileNet 특징 추출
    async extractMobileNetFeatures(imageElement) {
        if (!this.models.mobileNet) {
            throw new Error('MobileNet이 아직 로드되지 않았습니다');
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
            
            if (Array.isArray(arrayData[0])) {
                return arrayData[0];
            }
            
            return arrayData;
            
        } catch (error) {
            console.error('MobileNet 특징 추출 오류:', error);
            return new Array(1280).fill(0);
        }
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
                
            } catch (error) {
                console.warn('특징 추출 실패, 기본값 사용:', error.message);
                embedding = new Array(1348).fill(0);  // 1280 + 68
            }
        } else {
            embedding = new Array(1348).fill(0);
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
    
    // 유사 이미지 검색 (색상 가중치 적용)
    async searchSimilar(queryFeatures) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const results = [];
            
            console.log(`검색 대상: ${images.length}개 이미지`);
            
            let maxSim = 0;
            let minSim = 1;
            
            for (const image of images) {
                if (!image.embedding || image.embedding.length === 0) {
                    console.warn(`${image.filename}: 잘못된 임베딩`);
                    continue;
                }
                
                // 특징 분리
                const queryMobileNet = queryFeatures.slice(0, 1280);
                const queryColor = queryFeatures.slice(1280);
                
                let dbMobileNet, dbColor;
                
                if (image.embedding.length === 1348) {
                    // v18.6 형식
                    dbMobileNet = image.embedding.slice(0, 1280);
                    dbColor = image.embedding.slice(1280);
                } else if (image.embedding.length === 1280) {
                    // v18.5 이전 형식 (색상 없음)
                    dbMobileNet = image.embedding;
                    dbColor = new Array(68).fill(0);
                } else {
                    console.warn(`${image.filename}: 알 수 없는 임베딩 크기`);
                    continue;
                }
                
                // MobileNet 유사도 (70% 가중치)
                const mobileNetSim = this.cosineSimilarity(queryMobileNet, dbMobileNet);
                
                // 색상 유사도 (30% 가중치)
                const colorSim = this.cosineSimilarity(queryColor, dbColor);
                
                // 가중 평균 (형태 70%, 색상 30%)
                const combinedSim = mobileNetSim * 0.7 + colorSim * 0.3;
                
                maxSim = Math.max(maxSim, combinedSim);
                minSim = Math.min(minSim, combinedSim);
                
                results.push({
                    ...image,
                    similarity: combinedSim,
                    mobileNetSim: mobileNetSim,
                    colorSim: colorSim
                });
            }
            
            console.log(`유사도 범위: ${(minSim * 100).toFixed(1)}% ~ ${(maxSim * 100).toFixed(1)}%`);
            
            // 정규화
            const range = maxSim - minSim;
            if (range > 0) {
                results.forEach(r => {
                    const normalized = (r.similarity - minSim) / range;
                    r.displayScore = 50 + normalized * 50;
                    r.originalSimilarity = r.similarity;
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
            const score = item.displayScore ? item.displayScore.toFixed(1) : (item.similarity * 100).toFixed(1);
            
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
    
    // UI 설정 및 나머지 함수들은 v18.5와 동일
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupUI() {
        const html = `
            <div id="fashionSearchApp">
                <h1>🎯 Fashion Search v18.6 - Color Enhanced</h1>
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
                            🖼️ 이미지 파일 선택 (권장)
                        </button>
                        <button id="selectFolderBtn" class="secondary-btn">
                            📂 폴더 선택 (실험적)
                        </button>
                        <button id="clearDBBtn" class="danger-btn">
                            🗑️ DB 초기화
                        </button>
                    </div>
                    
                    <div id="dropZone">
                        <h3>📥 드래그 & 드롭</h3>
                        <p>여러 이미지를 여기에 놓으세요</p>
                    </div>
                    
                    <div id="indexProgress"></div>
                    <div id="indexStatus"></div>
                </div>
                
                <div id="debugMode" class="mode-content" style="display:none;">
                    <button id="testBtn">🧪 시스템 테스트</button>
                    <button id="validateBtn">✔️ DB 검증</button>
                    <button id="clearAllBtn">💣 완전 초기화</button>
                    <button id="analyzeBtn">📊 색상 분석</button>
                    <pre id="debugConsole"></pre>
                </div>
            </div>
        `;
        
        document.body.innerHTML = html;
        
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
        
        this.applyStyles();
    }
    
    setupEventListeners() {
        // 검색 모드
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.background = '#e8f5e9';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.background = '#f5f5f5';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.background = '#f5f5f5';
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.processSearchImage(file);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.processSearchImage(file);
            });
        }
        
        // 인덱싱 모드
        document.getElementById('selectFilesBtn')?.addEventListener('click', () => {
            this.selectMultipleFiles();
        });
        
        document.getElementById('selectFolderBtn')?.addEventListener('click', () => {
            this.selectFolder();
        });
        
        document.getElementById('clearDBBtn')?.addEventListener('click', () => {
            if (confirm('모든 인덱싱된 이미지를 삭제하시겠습니까?')) {
                this.clearDB();
            }
        });
        
        // 드롭존
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#4caf50';
                dropZone.style.background = '#e8f5e9';
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.style.borderColor = '#ddd';
                dropZone.style.background = '#fafafa';
            });
            
            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#ddd';
                dropZone.style.background = '#fafafa';
                
                const files = Array.from(e.dataTransfer.files).filter(f => 
                    f.type.startsWith('image/') || 
                    f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                );
                
                if (files.length > 0) {
                    await this.indexImages(files);
                }
            });
        }
        
        // 디버그 모드
        document.getElementById('testBtn')?.addEventListener('click', () => this.runTest());
        document.getElementById('validateBtn')?.addEventListener('click', () => this.validateDB());
        document.getElementById('clearAllBtn')?.addEventListener('click', () => this.clearAndReload());
        document.getElementById('analyzeBtn')?.addEventListener('click', () => this.analyzeColors());
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                if (mode) this.switchMode(mode);
            });
        });
    }
    
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
                padding: 20px;
                min-height: 100vh;
            }
            
            #fashionSearchApp {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 32px;
                text-align: center;
                background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            #status {
                background: #f0f4f8;
                color: #2c3e50;
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 25px;
                font-weight: 600;
                text-align: center;
                border-left: 4px solid #4ecdc4;
            }
            
            .mode-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 30px;
            }
            
            .mode-btn {
                flex: 1;
                padding: 14px 20px;
                background: white;
                border: 2px solid #e0e0e0;
                color: #666;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .mode-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .mode-btn.active {
                background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
                color: white;
                border-color: transparent;
            }
            
            .upload-area {
                border: 3px dashed #4ecdc4;
                border-radius: 16px;
                padding: 60px 20px;
                text-align: center;
                cursor: pointer;
                background: #f5f5f5;
                transition: all 0.3s;
            }
            
            .upload-area:hover {
                background: #e8f5e9;
                transform: scale(1.01);
                border-color: #ff6b6b;
            }
            
            .upload-area p {
                color: #4ecdc4;
                font-size: 20px;
                font-weight: 600;
            }
            
            .button-group {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                margin-bottom: 25px;
            }
            
            .primary-btn, .secondary-btn, .danger-btn {
                padding: 16px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .primary-btn {
                background: linear-gradient(135deg, #4ecdc4 0%, #44a8a4 100%);
                color: white;
            }
            
            .primary-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
            }
            
            .secondary-btn {
                background: #607d8b;
                color: white;
            }
            
            .secondary-btn:hover {
                background: #546e7a;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(96, 125, 139, 0.3);
            }
            
            .danger-btn {
                background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
                color: white;
            }
            
            .danger-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
            }
            
            #dropZone {
                border: 3px dashed #bdbdbd;
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                background: #fafafa;
                transition: all 0.3s;
                margin-bottom: 25px;
            }
            
            #dropZone:hover {
                background: #f5f5f5;
                border-color: #4ecdc4;
            }
            
            #dropZone h3 {
                color: #666;
                margin-bottom: 10px;
                font-size: 22px;
            }
            
            #dropZone p {
                color: #999;
                font-size: 15px;
            }
            
            #previewContainer {
                text-align: center;
                margin: 30px 0;
            }
            
            #previewImage {
                max-width: 100%;
                border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.12);
            }
            
            #searchStatus {
                margin-top: 20px;
                padding: 12px;
                background: #f0f4f8;
                border-radius: 10px;
                font-weight: 600;
                color: #2c3e50;
            }
            
            #results {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            
            .result-item {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                transition: all 0.3s;
                cursor: pointer;
                position: relative;
            }
            
            .result-item:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
            
            .result-item img {
                width: 100%;
                height: 200px;
                object-fit: cover;
            }
            
            .result-info {
                padding: 12px;
                background: #fafafa;
            }
            
            .similarity-score {
                font-size: 22px;
                font-weight: bold;
                margin-bottom: 4px;
            }
            
            .similarity-score.high { 
                background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .similarity-score.medium { 
                background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .similarity-score.low { 
                background: linear-gradient(135deg, #f44336 0%, #e57373 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .similarity-bar {
                height: 4px;
                background: #e0e0e0;
                border-radius: 2px;
                overflow: hidden;
                margin-top: 8px;
            }
            
            .similarity-fill {
                height: 100%;
                background: linear-gradient(90deg, #4ecdc4, #44a8a4);
                transition: width 0.3s;
            }
            
            .rank-badge {
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .progress-bar {
                background: #f0f0f0;
                border-radius: 10px;
                overflow: hidden;
                margin: 20px 0;
                height: 30px;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .progress-fill {
                background: linear-gradient(90deg, #4ecdc4, #44a8a4);
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                transition: width 0.3s;
            }
            
            #debugConsole {
                background: #1e1e1e;
                color: #4ecdc4;
                padding: 20px;
                border-radius: 10px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                max-height: 400px;
                overflow-y: auto;
                white-space: pre-wrap;
                margin-top: 20px;
                line-height: 1.5;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 색상 분석 도구
    async analyzeColors() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const images = request.result;
            const console = document.getElementById('debugConsole');
            
            if (images.length === 0) {
                console.textContent = '분석할 이미지가 없습니다.';
                return;
            }
            
            console.textContent = '=== 색상 분석 ===\n\n';
            console.textContent += `총 ${images.length}개 이미지 분석 중...\n\n`;
            
            // 샘플 이미지 색상 분석
            const samples = images.slice(0, Math.min(10, images.length));
            
            for (const image of samples) {
                if (image.embedding && image.embedding.length >= 1348) {
                    const colorFeatures = image.embedding.slice(1280);
                    
                    // 주요 색상 비율 추출 (인덱스 62-66)
                    const blackRatio = colorFeatures[62];
                    const whiteRatio = colorFeatures[63];
                    const brownRatio = colorFeatures[64];
                    const beigeRatio = colorFeatures[65];
                    const navyRatio = colorFeatures[66];
                    
                    console.textContent += `📁 ${image.filename}\n`;
                    console.textContent += `   검정: ${(blackRatio * 100).toFixed(1)}%\n`;
                    console.textContent += `   흰색: ${(whiteRatio * 100).toFixed(1)}%\n`;
                    console.textContent += `   갈색: ${(brownRatio * 100).toFixed(1)}%\n`;
                    console.textContent += `   베이지: ${(beigeRatio * 100).toFixed(1)}%\n`;
                    console.textContent += `   네이비: ${(navyRatio * 100).toFixed(1)}%\n`;
                    console.textContent += '\n';
                }
            }
        };
    }
    
    // 나머지 함수들 (v18.5와 동일)
    async selectMultipleFiles() {
        if (!this.checkReady()) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            console.log(`${files.length}개 파일 선택됨`);
            
            if (files.length > 0) {
                await this.indexImages(files);
            }
        };
        
        input.click();
    }
    
    async selectFolder() {
        if (!this.checkReady()) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.multiple = true;
        
        input.onchange = async (e) => {
            const allFiles = Array.from(e.target.files || []);
            const imageFiles = allFiles.filter(f => 
                f.type.startsWith('image/') || 
                f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            
            console.log(`${imageFiles.length}개 이미지 발견`);
            
            if (imageFiles.length > 0) {
                await this.indexImages(imageFiles);
            } else {
                alert('선택한 폴더에 이미지 파일이 없습니다.');
            }
        };
        
        document.body.appendChild(input);
        input.style.display = 'none';
        input.click();
        
        setTimeout(() => {
            if (input.parentNode) {
                document.body.removeChild(input);
            }
        }, 60000);
    }
    
    checkReady() {
        if (!this.isReady || !this.db) {
            alert('시스템이 아직 준비 중입니다. 잠시만 기다려주세요.');
            return false;
        }
        
        if (!this.models.mobileNet) {
            if (confirm('AI 모델이 아직 로드 중입니다. 계속하시겠습니까?')) {
                return true;
            }
            return false;
        }
        
        return true;
    }
    
    async indexImages(files) {
        if (!this.checkReady()) return;
        
        const progressDiv = document.getElementById('indexProgress');
        const statusDiv = document.getElementById('indexStatus');
        
        progressDiv.innerHTML = '<div class="progress-bar"><div class="progress-fill" id="progressFill">0%</div></div>';
        statusDiv.textContent = `🔄 ${files.length}개 이미지 처리 중...`;
        
        await this.clearDB();
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length * 100).toFixed(1);
            
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
                progressFill.textContent = `${progress}%`;
            }
            
            try {
                await this.processFile(file);
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`❌ ${file.name}:`, error.message);
            }
        }
        
        statusDiv.textContent = `✅ 완료: ${successCount}개 성공, ${errorCount}개 실패`;
        this.updateStatus(`✅ ${successCount}개 이미지 인덱싱 완료! (색상 특징 포함)`);
        
        await this.validateDB();
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
            const request = indexedDB.open(this.dbName, 2);
            
            request.onerror = () => {
                console.error('DB 열기 실패:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ DB 연결 성공');
                this.checkDBStatus();
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('images')) {
                    const store = db.createObjectStore('images', { keyPath: 'filename' });
                    store.createIndex('date', 'indexed', { unique: false });
                }
            };
        });
    }
    
    async checkDBStatus() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
            const count = countRequest.result;
            if (count > 0) {
                this.updateStatus(`✅ ${count}개 이미지 준비 완료`);
            } else {
                this.updateStatus('💡 인덱싱 모드에서 이미지를 추가하세요');
            }
        };
    }
    
    async clearDB() {
        if (!this.db) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('✅ DB 초기화 완료');
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveImageToDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.put(imageData);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async checkAndMigrateDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const images = request.result;
            let needMigration = false;
            
            for (const image of images) {
                if (image.embedding && image.embedding.length !== 1348) {
                    needMigration = true;
                    break;
                }
            }
            
            if (needMigration) {
                console.log('🔄 기존 DB 마이그레이션 필요');
                if (confirm('색상 특징을 추가하기 위해 재인덱싱이 필요합니다. 진행하시겠습니까?')) {
                    await this.clearDB();
                    this.updateStatus('⚠️ DB 초기화 완료. 이미지를 다시 인덱싱해주세요.');
                }
            }
        };
    }
    
    async runTest() {
        const console = document.getElementById('debugConsole');
        console.textContent = '=== 시스템 테스트 ===\n\n';
        
        console.textContent += `버전: ${this.version}\n`;
        console.textContent += `준비 상태: ${this.isReady ? '✅' : '❌'}\n`;
        console.textContent += `DB: ${this.db ? '✅' : '❌'}\n`;
        console.textContent += `TensorFlow: ${typeof tf !== 'undefined' ? '✅' : '❌'}\n`;
        console.textContent += `MobileNet: ${this.models.mobileNet ? '✅' : '❌'}\n`;
        console.textContent += `KNN: ${this.models.knnClassifier ? '✅' : '❌'}\n`;
        
        if (typeof tf !== 'undefined') {
            console.textContent += `\nTF Version: ${tf.version.tfjs}\n`;
            console.textContent += `Backend: ${tf.getBackend()}\n`;
            console.textContent += `WebGL: ${tf.getBackend() === 'webgl' ? '✅' : '❌'}\n`;
        }
        
        console.textContent += `\n특징 구성:\n`;
        console.textContent += `- MobileNet: 1280 features\n`;
        console.textContent += `- 색상: 68 features\n`;
        console.textContent += `- 총합: 1348 features\n`;
    }
    
    async validateDB() {
        if (!this.db) {
            alert('DB가 아직 준비되지 않았습니다.');
            return;
        }
        
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const console = document.getElementById('debugConsole');
            
            let validCount = 0;
            let invalidCount = 0;
            let v18_5Count = 0;
            let v18_6Count = 0;
            
            console.textContent = `=== DB 검증 ===\n\n`;
            console.textContent += `총 이미지: ${images.length}개\n\n`;
            
            for (const img of images) {
                if (img.embedding && img.embedding.length === 1348) {
                    validCount++;
                    v18_6Count++;
                } else if (img.embedding && img.embedding.length === 1280) {
                    validCount++;
                    v18_5Count++;
                } else {
                    invalidCount++;
                    console.textContent += `❌ ${img.filename}: 잘못된 임베딩 (크기: ${img.embedding?.length || 0})\n`;
                }
            }
            
            console.textContent += `\n✅ 유효: ${validCount}개\n`;
            console.textContent += `  - v18.6 (색상 포함): ${v18_6Count}개\n`;
            console.textContent += `  - v18.5 (색상 없음): ${v18_5Count}개\n`;
            console.textContent += `❌ 무효: ${invalidCount}개\n`;
            
            if (v18_5Count > 0) {
                console.textContent += `\n⚠️ ${v18_5Count}개 이미지가 색상 정보 없음\n`;
                console.textContent += `색상 기반 검색 정확도 향상을 위해 재인덱싱을 권장합니다.\n`;
            }
        };
    }
    
    async clearAndReload() {
        if (confirm('모든 데이터를 삭제하고 새로 시작하시겠습니까?')) {
            if (this.db) {
                this.db.close();
            }
            const deleteReq = indexedDB.deleteDatabase(this.dbName);
            deleteReq.onsuccess = () => location.reload();
        }
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        document.querySelectorAll('.mode-content').forEach(el => {
            el.style.display = 'none';
        });
        
        const modeElement = document.getElementById(`${mode}Mode`);
        if (modeElement) {
            modeElement.style.display = 'block';
        }
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
        console.log(message);
    }
}

// 앱 초기화
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new LuxuryFashionSearchApp();
    window.app = app;
});

console.log('Fashion Search v18.6 - Color Enhanced Ready');
