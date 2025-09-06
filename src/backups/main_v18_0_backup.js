// Fashion Image Search v18.0 - DeepLearning Edition
// MobileNet + Brand-Specific Feature Extraction
// 2025-01-03

console.log('🚀 Fashion Search v18.0 - DeepLearning Edition');

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v18.0.0-DL';
        this.dbName = 'fashionSearchDB_v18';
        this.db = null;
        this.currentMode = 'search';
        this.models = {
            mobileNet: null,
            mobileNetUrl: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js',
            knnClassifier: null,
            knnUrl: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.2/dist/knn-classifier.min.js'
        };
        this.embeddings = new Map();
        this.brandClassifier = null;
        
        // 브랜드별 특징 설정
        this.brandSignatures = {
            louis_vuitton: {
                patterns: ['monogram', 'damier'],
                colorRange: { h: [20, 40], s: [30, 60], v: [30, 70] },
                threshold: 0.82
            },
            chanel: {
                patterns: ['quilted', 'cc_logo'],
                colorRange: { h: [0, 360], s: [0, 20], v: [0, 100] },
                threshold: 0.78
            },
            goyard: {
                patterns: ['chevron', 'y_pattern'],
                colorRange: { h: [0, 360], s: [20, 80], v: [20, 80] },
                threshold: 0.85
            }
        };
        
        this.cache = new Map();
        this.maxCacheSize = 100;
        
        this.init();
    }
    
    async init() {
        this.setupUI();
        await this.loadModels();
        await this.openDB();
        this.updateStatus('✅ DeepLearning 모델 준비 완료!');
    }
    
    async loadModels() {
        try {
            console.log('🔄 딥러닝 모델 로딩 중...');
            
            // TensorFlow.js 확인
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
            }
            
            // MobileNet 로드
            await this.loadScript(this.models.mobileNetUrl);
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet v2 로드 완료');
            
            // KNN Classifier 로드
            await this.loadScript(this.models.knnUrl);
            this.models.knnClassifier = knnClassifier.create();
            console.log('✅ KNN Classifier 로드 완료');
            
            // WebGL 백엔드 설정
            await tf.setBackend('webgl');
            tf.ENV.set('WEBGL_FORCE_F16_TEXTURES', true);
            console.log('✅ WebGL 가속 활성화');
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ 딥러닝 모델 로딩 실패. 새로고침해주세요.');
        }
    }
    
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
                <h1>🎯 Fashion Search v18.0 - AI Powered</h1>
                <div id="status">🔄 초기화 중...</div>
                
                <div class="mode-buttons">
                    <button id="searchModeBtn" class="mode-btn active" data-mode="search">🔍 검색 모드</button>
                    <button id="indexModeBtn" class="mode-btn" data-mode="index">📁 인덱싱 모드</button>
                    <button id="debugModeBtn" class="mode-btn" data-mode="debug">🧪 디버그 모드</button>
                </div>
                
                <div id="searchMode" class="mode-content">
                    <div class="upload-area" id="uploadArea">
                        <p>🖼️ 이미지를 드래그하거나 클릭하여 업로드</p>
                        <input type="file" id="fileInput" accept="image/*" style="display:none">
                    </div>
                    
                    <div id="previewContainer" style="display:none;">
                        <img id="previewImage" style="max-width:300px;">
                        <div id="analysisResult"></div>
                    </div>
                    
                    <div id="results"></div>
                </div>
                
                <div id="indexMode" class="mode-content" style="display:none;">
                    <button id="selectFolderBtn">📂 폴더 선택</button>
                    <button id="selectFilesBtn">🌆 이미지 파일 선택 (다중)</button>
                    <button id="reindexBtn">🤖 ML 재인덱싱</button>
                    <div id="dropZone" style="
                        border: 3px dashed #667eea;
                        border-radius: 15px;
                        padding: 40px;
                        margin: 20px 0;
                        text-align: center;
                        background: #f8f9ff;
                        transition: all 0.3s;
                    ">
                        <h3>🎯 이미지 드래그 & 드롭</h3>
                        <p>여러 이미지를 한 번에 드래그해서 놓으세요</p>
                    </div>
                    <div id="indexProgress"></div>
                </div>
                
                <div id="debugMode" class="mode-content" style="display:none;">
                    <div class="debug-buttons">
                        <button id="testBrandBtn">🧪 브랜드 추출 테스트</button>
                        <button id="compareModelsBtn">📊 모델 비교</button>
                        <button id="validateDBBtn">✔️ DB 검증</button>
                        <button id="clearCacheBtn">🗑️ 캐시 초기화</button>
                        <button id="exportBtn">💾 임베딩 내보내기</button>
                        <button id="clearAllBtn">💣 완전 초기화</button>
                    </div>
                    <pre id="debugConsole" class="debug-console"></pre>
                </div>
            </div>
        `;
        
        document.body.innerHTML = html;
        this.setupEventListeners();
        this.applyStyles();
    }
    
    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
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
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.processImage(file);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.processImage(file);
        });
        
        // 인덱싱 버튼 이벤트
        const selectFolderBtn = document.getElementById('selectFolderBtn');
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        const reindexBtn = document.getElementById('reindexBtn');
        const dropZone = document.getElementById('dropZone');
        
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                console.log('🔍 폴더 선택 버튼 클릭됨');
                this.selectFolder();
            });
        }
        
        if (selectFilesBtn) {
            selectFilesBtn.addEventListener('click', () => {
                console.log('🌆 파일 선택 버튼 클릭됨');
                this.selectMultipleFiles();
            });
        }
        
        if (reindexBtn) {
            reindexBtn.addEventListener('click', () => {
                console.log('🤖 ML 재인덱싱 버튼 클릭됨');
                this.reindexWithML();
            });
        }
        
        // 드래그 & 드롭 이벤트
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.background = '#e0e6ff';
                dropZone.style.transform = 'scale(1.02)';
            });
            
            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.style.background = '#f8f9ff';
                dropZone.style.transform = 'scale(1)';
            });
            
            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.style.background = '#f8f9ff';
                dropZone.style.transform = 'scale(1)';
                
                const files = Array.from(e.dataTransfer.files).filter(f => 
                    f.type.startsWith('image/') || 
                    f.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)
                );
                
                console.log(`🎯 ${files.length}개 이미지 드롭됨`);
                
                if (files.length > 0) {
                    await this.indexImages(files);
                }
            });
        }
        
        // 디버그 버튼 이벤트
        const debugButtons = {
            'testBrandBtn': () => this.testBrandExtraction(),
            'compareModelsBtn': () => this.compareModels(),
            'validateDBBtn': () => this.validateDB(),
            'clearCacheBtn': () => this.clearCache(),
            'exportBtn': () => this.exportEmbeddings(),
            'clearAllBtn': () => this.clearAndReload()
        };
        
        for (const [id, handler] of Object.entries(debugButtons)) {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        }
        
        // 모드 버튼 이벤트
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                if (mode) {
                    this.switchMode(mode);
                }
            });
        });
    }
    
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
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
                background: linear-gradient(90deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-align: center;
                margin-bottom: 20px;
            }
            #status {
                text-align: center;
                padding: 15px;
                background: #f0f0f0;
                border-radius: 10px;
                margin-bottom: 20px;
                font-weight: 600;
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
                color: #667eea;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s;
            }
            .mode-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
            }
            .mode-btn.active {
                background: linear-gradient(90deg, #667eea, #764ba2);
                color: white;
            }
            .upload-area {
                border: 3px dashed #667eea;
                border-radius: 15px;
                padding: 60px;
                text-align: center;
                cursor: pointer;
                background: #f8f9ff;
                transition: all 0.3s;
            }
            .upload-area:hover {
                background: #eef1ff;
                border-color: #764ba2;
            }
            .upload-area.dragover {
                background: #e0e6ff;
                border-color: #764ba2;
                transform: scale(1.02);
            }
            .result-item {
                display: inline-block;
                margin: 10px;
                padding: 15px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                transition: all 0.3s;
                vertical-align: top;
            }
            .result-item:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .result-item img {
                width: 200px;
                height: 200px;
                object-fit: cover;
                border-radius: 10px;
                margin-bottom: 10px;
            }
            .similarity-score {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 10px 0;
            }
            .brand-tag {
                display: inline-block;
                padding: 5px 15px;
                background: linear-gradient(90deg, #667eea, #764ba2);
                color: white;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin: 5px;
            }
            .debug-console {
                background: #1e1e1e;
                color: #00ff00;
                padding: 20px;
                border-radius: 10px;
                font-family: 'Courier New', monospace;
                max-height: 400px;
                overflow-y: auto;
                margin-top: 20px;
            }
            .debug-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }
            .debug-buttons button {
                padding: 15px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            }
            .debug-buttons button:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
            }
            .progress-bar {
                width: 100%;
                height: 30px;
                background: #f0f0f0;
                border-radius: 15px;
                overflow: hidden;
                margin: 20px 0;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                transition: width 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
    
    // MobileNet 기반 특징 추출
    async extractDeepFeatures(imageElement) {
        return tf.tidy(() => {
            // MobileNet에서 임베딩 추출
            const embedding = this.models.mobileNet.infer(imageElement, true);
            
            // 1280차원 벡터를 정규화
            const normalized = tf.nn.l2Normalize(embedding);
            
            return normalized;
        });
    }
    
    // 브랜드별 패턴 특징 추출
    async extractBrandFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 224;
        canvas.height = 224;
        ctx.drawImage(imageElement, 0, 0, 224, 224);
        
        const features = {
            texture: await this.extractTextureFeatures(canvas, ctx),
            pattern: await this.extractPatternSignature(canvas, ctx),
            color: this.extractColorProfile(ctx)
        };
        
        return features;
    }
    
    // Gram Matrix를 통한 텍스처 특징
    async extractTextureFeatures(canvas, ctx) {
        return tf.tidy(() => {
            const image = tf.browser.fromPixels(canvas);
            const normalized = image.div(255.0);
            
            // Conv layer simulation for texture
            const kernelSize = 5;
            const kernel = tf.ones([kernelSize, kernelSize, 3, 1]).div(kernelSize * kernelSize * 3);
            const conv = tf.conv2d(normalized.expandDims(0), kernel, 1, 'same');
            
            // Gram matrix calculation
            const [batch, height, width, channels] = conv.shape;
            const reshaped = conv.reshape([height * width, channels]);
            const gram = tf.matMul(reshaped, reshaped, true, false);
            const gramNorm = gram.div(height * width);
            
            return gramNorm.flatten().arraySync();
        });
    }
    
    // 패턴 시그니처 추출 (FFT 기반)
    async extractPatternSignature(canvas, ctx) {
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const gray = new Float32Array(224 * 224);
        
        // Grayscale 변환
        for (let i = 0; i < imageData.data.length; i += 4) {
            const idx = i / 4;
            gray[idx] = (imageData.data[i] * 0.299 + 
                        imageData.data[i+1] * 0.587 + 
                        imageData.data[i+2] * 0.114) / 255;
        }
        
        // 간단한 패턴 빈도 분석
        const patternFreq = new Float32Array(32);
        const blockSize = 7; // 224 / 32
        
        for (let by = 0; by < 32; by++) {
            for (let bx = 0; bx < 32; bx++) {
                let sum = 0;
                for (let y = 0; y < blockSize; y++) {
                    for (let x = 0; x < blockSize; x++) {
                        const idx = (by * blockSize + y) * 224 + (bx * blockSize + x);
                        sum += gray[idx];
                    }
                }
                patternFreq[by] += sum / (blockSize * blockSize);
            }
        }
        
        return Array.from(patternFreq);
    }
    
    // 색상 프로파일 추출
    extractColorProfile(ctx) {
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const data = imageData.data;
        
        // HSV 히스토그램
        const hBins = new Float32Array(18); // 20도 간격
        const sBins = new Float32Array(5);  // 20% 간격
        const vBins = new Float32Array(5);  // 20% 간격
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            const [h, s, v] = this.rgbToHsv(r, g, b);
            
            const hBin = Math.floor(h / 20);
            const sBin = Math.floor(s * 5);
            const vBin = Math.floor(v * 5);
            
            hBins[Math.min(hBin, 17)]++;
            sBins[Math.min(sBin, 4)]++;
            vBins[Math.min(vBin, 4)]++;
        }
        
        // 정규화
        const total = 224 * 224;
        return {
            hue: Array.from(hBins).map(v => v / total),
            saturation: Array.from(sBins).map(v => v / total),
            value: Array.from(vBins).map(v => v / total)
        };
    }
    
    rgbToHsv(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        if (diff !== 0) {
            if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
            else if (max === g) h = ((b - r) / diff + 2) * 60;
            else h = ((r - g) / diff + 4) * 60;
        }
        
        const s = max === 0 ? 0 : diff / max;
        const v = max;
        
        return [h, s, v];
    }
    
    // 하이브리드 유사도 계산
    async calculateHybridSimilarity(queryEmbedding, queryBrandFeatures, candidateData) {
        // MobileNet 임베딩 유사도
        const embeddingSim = await this.cosineSimilarity(
            queryEmbedding,
            candidateData.embedding
        );
        
        // 브랜드 특징 유사도
        const brandSim = this.calculateBrandSimilarity(
            queryBrandFeatures,
            candidateData.brandFeatures
        );
        
        // 가중 평균 (임베딩 60%, 브랜드 특징 40%)
        const weights = {
            embedding: 0.6,
            brand: 0.4
        };
        
        const finalScore = embeddingSim * weights.embedding + 
                          brandSim * weights.brand;
        
        // 브랜드별 임계값 적용
        return this.applyBrandThreshold(finalScore, candidateData.detectedBrand);
    }
    
    calculateBrandSimilarity(features1, features2) {
        if (!features1 || !features2) return 0;
        
        // 텍스처 유사도
        const textureSim = this.arrayCosineSimilarity(
            features1.texture || [],
            features2.texture || []
        );
        
        // 패턴 유사도
        const patternSim = this.arrayCosineSimilarity(
            features1.pattern || [],
            features2.pattern || []
        );
        
        // 색상 유사도
        const colorSim = this.calculateColorSimilarity(
            features1.color || {},
            features2.color || {}
        );
        
        // 가중 평균
        return textureSim * 0.4 + patternSim * 0.4 + colorSim * 0.2;
    }
    
    calculateColorSimilarity(color1, color2) {
        if (!color1.hue || !color2.hue) return 0;
        
        const hueSim = this.arrayCosineSimilarity(color1.hue, color2.hue);
        const satSim = this.arrayCosineSimilarity(color1.saturation, color2.saturation);
        const valSim = this.arrayCosineSimilarity(color1.value, color2.value);
        
        return (hueSim * 0.5 + satSim * 0.25 + valSim * 0.25);
    }
    
    arrayCosineSimilarity(arr1, arr2) {
        if (!arr1 || !arr2 || arr1.length !== arr2.length) return 0;
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < arr1.length; i++) {
            dotProduct += arr1[i] * arr2[i];
            norm1 += arr1[i] * arr1[i];
            norm2 += arr2[i] * arr2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    
    async cosineSimilarity(tensor1, tensor2) {
        return tf.tidy(() => {
            const dotProduct = tf.sum(tf.mul(tensor1, tensor2));
            const norm1 = tf.sqrt(tf.sum(tf.square(tensor1)));
            const norm2 = tf.sqrt(tf.sum(tf.square(tensor2)));
            const similarity = tf.div(dotProduct, tf.mul(norm1, norm2));
            return similarity.arraySync();
        });
    }
    
    applyBrandThreshold(score, detectedBrand) {
        if (!detectedBrand) return score;
        
        const threshold = this.brandSignatures[detectedBrand]?.threshold || 0.8;
        
        // 브랜드별 조정
        if (detectedBrand === 'goyard' && score > 0.9) {
            // 고야드는 더 엄격한 기준 적용
            return score * 0.95;
        } else if (detectedBrand === 'louis_vuitton' && score > 0.85) {
            // LV는 표준 유지
            return score;
        } else if (detectedBrand === 'chanel' && score > 0.8) {
            // 샤넬은 약간 완화
            return score * 1.02;
        }
        
        return score;
    }
    
    // 브랜드 검출
    async detectBrand(imageElement, features) {
        // KNN 분류기가 학습된 경우 사용
        if (this.models.knnClassifier && this.models.knnClassifier.getNumClasses() > 0) {
            const embedding = await this.extractDeepFeatures(imageElement);
            const prediction = await this.models.knnClassifier.predictClass(embedding);
            embedding.dispose();
            
            if (prediction.confidences[prediction.label] > 0.7) {
                return prediction.label;
            }
        }
        
        // 휴리스틱 기반 브랜드 검출
        return this.detectBrandHeuristic(features);
    }
    
    detectBrandHeuristic(features) {
        if (!features || !features.color) return 'unknown';
        
        const colorProfile = features.color;
        
        // 브라운 계열이 dominant한 경우 -> LV 가능성
        if (colorProfile.hue[1] > 0.3 && colorProfile.saturation[1] > 0.2) {
            return 'louis_vuitton';
        }
        
        // 블랙/화이트가 dominant한 경우 -> 샤넬 가능성
        if (colorProfile.value[0] > 0.3 || colorProfile.value[4] > 0.3) {
            return 'chanel';
        }
        
        // 다양한 색상이 있는 경우 -> 고야드 가능성
        if (Math.max(...colorProfile.saturation) > 0.3) {
            return 'goyard';
        }
        
        return 'unknown';
    }
    
    // 이미지 처리
    async processImage(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                // 미리보기 표시
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                
                // 특징 추출
                const embedding = await this.extractDeepFeatures(img);
                const brandFeatures = await this.extractBrandFeatures(img);
                const detectedBrand = await this.detectBrand(img, brandFeatures);
                
                // 분석 결과 표시
                this.displayAnalysis(detectedBrand, brandFeatures);
                
                // 유사 이미지 검색
                await this.searchSimilar(embedding, brandFeatures);
                
                // 메모리 정리
                embedding.dispose();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    displayAnalysis(brand, features) {
        const brandNames = {
            'louis_vuitton': 'Louis Vuitton',
            'chanel': 'Chanel',
            'goyard': 'Goyard',
            'unknown': '알 수 없음'
        };
        
        const analysisHtml = `
            <div class="analysis-result">
                <h3>🔍 분석 결과</h3>
                <div class="brand-tag">${brandNames[brand] || brand}</div>
                <div>패턴 강도: ${(Math.max(...features.pattern) * 100).toFixed(1)}%</div>
                <div>텍스처 복잡도: ${(features.texture.length > 0 ? 
                    (Math.abs(Math.max(...features.texture)) * 100).toFixed(1) : 0)}%</div>
            </div>
        `;
        
        document.getElementById('analysisResult').innerHTML = analysisHtml;
    }
    
    // 유사 이미지 검색
    async searchSimilar(queryEmbedding, queryBrandFeatures) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const images = request.result;
            const results = [];
            
            for (const image of images) {
                // 저장된 임베딩을 텐서로 변환
                const candidateEmbedding = tf.tensor(image.embedding);
                
                // 하이브리드 유사도 계산
                const similarity = await this.calculateHybridSimilarity(
                    queryEmbedding,
                    queryBrandFeatures,
                    {
                        embedding: candidateEmbedding,
                        brandFeatures: image.brandFeatures,
                        detectedBrand: image.detectedBrand
                    }
                );
                
                candidateEmbedding.dispose();
                
                results.push({
                    ...image,
                    similarity: similarity
                });
            }
            
            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 상위 20개 결과 표시
            this.displayResults(results.slice(0, 20));
        };
    }
    
    displayResults(results) {
        const resultsDiv = document.getElementById('results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }
        
        const html = results.map(item => {
            const similarity = (item.similarity * 100).toFixed(1);
            const color = this.getScoreColor(item.similarity);
            
            return `
                <div class="result-item">
                    <img src="${item.path}" alt="${item.filename}">
                    <div class="similarity-score" style="color: ${color}">
                        ${similarity}%
                    </div>
                    <div style="text-align: center;">
                        <div class="brand-tag">${item.detectedBrand || 'unknown'}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${item.filename}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        resultsDiv.innerHTML = `
            <h3>🎯 검색 결과 (상위 ${results.length}개)</h3>
            <div>${html}</div>
        `;
    }
    
    getScoreColor(score) {
        if (score > 0.9) return '#00c851';
        if (score > 0.8) return '#33b5e5';
        if (score > 0.7) return '#ffbb33';
        if (score > 0.6) return '#ff8800';
        return '#ff4444';
    }
    
    // 폴더 선택 및 인덱싱
    async selectFolder() {
        console.log('🔍 selectFolder 함수 시작');
        
        // 모델 체크
        if (!this.models.mobileNet) {
            alert('⚠️ 딥러닝 모델이 아직 로드되지 않았습니다. 잠시만 기다려주세요.');
            return;
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.multiple = true;
        
        // onchange와 addEventListener 둘 다 사용
        const handleFiles = async (e) => {
            console.log('📂 폴더 선택 이벤트 발생!');
            console.log('Files 객체:', e.target.files);
            console.log('전체 파일 수:', e.target.files?.length || 0);
            
            if (!e.target.files || e.target.files.length === 0) {
                console.log('⚠️ 파일이 선택되지 않았습니다.');
                this.updateStatus('⚠️ 파일이 선택되지 않았습니다.');
                return;
            }
            
            const allFiles = Array.from(e.target.files);
            console.log('첫 번째 파일 정보:');
            if (allFiles[0]) {
                console.log('  이름:', allFiles[0].name);
                console.log('  타입:', allFiles[0].type || '타입 없음');
                console.log('  크기:', allFiles[0].size, 'bytes');
                console.log('  경로:', allFiles[0].webkitRelativePath || '경로 없음');
            }
            
            // 이미지 파일 필터링
            const imageFiles = allFiles.filter(f => {
                // type이 비어있을 수 있으므로 확장자로도 체크
                const isImageType = f.type && f.type.startsWith('image/');
                const ext = f.name.toLowerCase().split('.').pop();
                const isImageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
                
                return isImageType || isImageExt;
            });
            
            console.log(`📁 ${imageFiles.length}개 이미지 발견 (전체: ${allFiles.length}개)`);
            
            if (imageFiles.length === 0) {
                this.updateStatus('⚠️ 이미지 파일이 없습니다.');
                alert('선택한 폴더에 이미지 파일이 없습니다.');
                return;
            }
            
            try {
                await this.indexImages(imageFiles);
            } catch (error) {
                console.error('❌ 인덱싱 오류:', error);
                this.updateStatus(`❌ 인덱싱 실패: ${error.message}`);
            }
        };
        
        // 두 가지 방법으로 이벤트 등록
        input.onchange = handleFiles;
        input.addEventListener('change', handleFiles);
        
        // 추가 이벤트 리스너
        input.addEventListener('cancel', () => {
            console.log('❌ 폴더 선택 취소됨');
        });
        
        // DOM에 추가했다가 제거하는 방법 시도
        document.body.appendChild(input);
        input.style.display = 'none';
        
        console.log('📂 폴더 선택 다이얼로그 열기...');
        input.click();
        
        // 나중에 제거
        setTimeout(() => {
            if (input.parentNode) {
                document.body.removeChild(input);
            }
        }, 60000); // 1분 후 제거
    }
    
    // 다중 파일 선택 (폴더 대신)
    async selectMultipleFiles() {
        console.log('🌆 다중 파일 선택 모드');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            console.log(`📸 ${files.length}개 이미지 파일 선택됨`);
            
            if (files.length === 0) {
                this.updateStatus('⚠️ 파일이 선택되지 않았습니다.');
                return;
            }
            
            // 파일 목록 표시
            console.log('선택된 파일:');
            files.forEach((f, i) => {
                console.log(`  ${i + 1}. ${f.name} (${(f.size / 1024).toFixed(1)}KB)`);
            });
            
            try {
                await this.indexImages(files);
            } catch (error) {
                console.error('❌ 인덱싱 오류:', error);
                this.updateStatus(`❌ 인덱싱 실패: ${error.message}`);
            }
        };
        
        input.click();
    }
    
    async indexImages(files) {
        const progressDiv = document.getElementById('indexProgress');
        progressDiv.innerHTML = '<div class="progress-bar"><div class="progress-fill" id="progressFill">0%</div></div>';
        
        // 먼저 기존 데이터 삭제
        await this.clearDB();
        
        this.updateStatus(`🔄 ${files.length}개 이미지 인덱싱 중...`);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length * 100).toFixed(1);
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('progressFill').textContent = `${progress}%`;
            
            try {
                const dataUrl = await this.fileToDataUrl(file);
                const img = await this.loadImage(dataUrl);
                
                // 딥러닝 특징 추출
                const embedding = await this.extractDeepFeatures(img);
                const brandFeatures = await this.extractBrandFeatures(img);
                const detectedBrand = await this.detectBrand(img, brandFeatures);
                
                // DB에 저장 - 새로운 트랜잭션으로
                const imageData = {
                    filename: file.name,
                    path: dataUrl,
                    embedding: Array.from(await embedding.array()),
                    brandFeatures: brandFeatures,
                    detectedBrand: detectedBrand,
                    indexed: new Date().toISOString()
                };
                
                await this.saveImageToDB(imageData);
                
                // 메모리 정리
                embedding.dispose();
                
                console.log(`✅ ${file.name} - ${detectedBrand}`);
            } catch (error) {
                console.error(`❌ ${file.name} 처리 실패:`, error);
            }
        }
        
        this.updateStatus(`✅ ${files.length}개 이미지 인덱싱 완료!`);
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
    
    // ML 재인덱싱
    async reindexWithML() {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const images = request.result;
            console.log(`🔄 ${images.length}개 이미지 재인덱싱 시작`);
            
            for (const imageData of images) {
                const img = await this.loadImage(imageData.path);
                
                // 새로운 딥러닝 특징 추출
                const embedding = await this.extractDeepFeatures(img);
                const brandFeatures = await this.extractBrandFeatures(img);
                const detectedBrand = await this.detectBrand(img, brandFeatures);
                
                // 업데이트
                imageData.embedding = Array.from(await embedding.array());
                imageData.brandFeatures = brandFeatures;
                imageData.detectedBrand = detectedBrand;
                imageData.reindexed = new Date().toISOString();
                
                await store.put(imageData);
                
                embedding.dispose();
                
                console.log(`✅ ${imageData.filename} 재인덱싱 완료`);
            }
            
            this.updateStatus(`✅ ${images.length}개 이미지 ML 재인덱싱 완료!`);
        };
    }
    
    // 디버그 기능들
    async testBrandExtraction() {
        const testImages = [
            { name: '검정', color: [0, 0, 0] },
            { name: '브라운 LV 스타일', color: [139, 69, 19] },
            { name: '베이지 샤넬 스타일', color: [245, 245, 220] }
        ];
        
        const console = document.getElementById('debugConsole');
        let log = '=== 브랜드 추출 테스트 v18.0 ===\n';
        
        for (const test of testImages) {
            // 테스트 캔버스 생성
            const canvas = document.createElement('canvas');
            canvas.width = 224;
            canvas.height = 224;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = `rgb(${test.color.join(',')})`;
            ctx.fillRect(0, 0, 224, 224);
            
            const features = await this.extractBrandFeatures(canvas);
            const brand = this.detectBrandHeuristic(features);
            
            log += `\n${test.name}:\n`;
            log += `  검출 브랜드: ${brand}\n`;
            log += `  패턴 강도: ${Math.max(...features.pattern).toFixed(3)}\n`;
        }
        
        console.textContent = log;
    }
    
    async compareModels() {
        const console = document.getElementById('debugConsole');
        console.textContent = '=== 모델 성능 비교 ===\n\n';
        
        // MobileNet 성능 테스트
        const testImg = document.getElementById('previewImage');
        if (!testImg || !testImg.src) {
            console.textContent += '테스트할 이미지를 먼저 업로드하세요.\n';
            return;
        }
        
        // MobileNet 추론 시간 측정
        const start = performance.now();
        const embedding = await this.extractDeepFeatures(testImg);
        const mobileNetTime = performance.now() - start;
        
        // 브랜드 특징 추출 시간 측정
        const brandStart = performance.now();
        const brandFeatures = await this.extractBrandFeatures(testImg);
        const brandTime = performance.now() - brandStart;
        
        console.textContent += `MobileNet 추론: ${mobileNetTime.toFixed(2)}ms\n`;
        console.textContent += `브랜드 특징 추출: ${brandTime.toFixed(2)}ms\n`;
        console.textContent += `임베딩 차원: ${(await embedding.array()).length}\n`;
        console.textContent += `총 처리 시간: ${(mobileNetTime + brandTime).toFixed(2)}ms\n`;
        
        embedding.dispose();
    }
    
    async validateDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const console = document.getElementById('debugConsole');
            
            let log = '=== DB 검증 결과 ===\n\n';
            log += `총 이미지 수: ${images.length}\n\n`;
            
            // 브랜드별 통계
            const brandCounts = {};
            images.forEach(img => {
                const brand = img.detectedBrand || 'unknown';
                brandCounts[brand] = (brandCounts[brand] || 0) + 1;
            });
            
            log += '브랜드별 분포:\n';
            for (const [brand, count] of Object.entries(brandCounts)) {
                const percentage = (count / images.length * 100).toFixed(1);
                log += `  ${brand}: ${count}개 (${percentage}%)\n`;
            }
            
            // 임베딩 검증
            let validEmbeddings = 0;
            images.forEach(img => {
                if (img.embedding && img.embedding.length > 0) {
                    validEmbeddings++;
                }
            });
            
            log += `\n유효한 임베딩: ${validEmbeddings}/${images.length}\n`;
            
            console.textContent = log;
        };
    }
    
    clearCache() {
        this.cache.clear();
        this.updateStatus('✅ 캐시 초기화 완료');
        document.getElementById('debugConsole').textContent = '캐시가 초기화되었습니다.\n';
    }
    
    async exportEmbeddings() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const exportData = images.map(img => ({
                filename: img.filename,
                brand: img.detectedBrand,
                embeddingSize: img.embedding?.length || 0
            }));
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                                 { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `embeddings_v18_${new Date().toISOString()}.json`;
            a.click();
            
            this.updateStatus('✅ 임베딩 내보내기 완료');
        };
    }
    
    async clearAndReload() {
        if (confirm('모든 데이터를 삭제하고 새로 시작하시겠습니까?')) {
            await this.deleteDB();
            location.reload();
        }
    }
    
    // DB 헬퍼 함수들
    async clearDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('✅ DB 초기화 완료');
                resolve();
            };
            
            request.onerror = () => {
                console.error('❌ DB 초기화 실패:', request.error);
                reject(request.error);
            };
        });
    }
    
    async saveImageToDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.put(imageData);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = () => {
                console.error('❌ DB 저장 실패:', request.error);
                reject(request.error);
            };
        });
    }
    
    // DB 관리
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
                    const store = db.createObjectStore('images', 
                        { keyPath: 'filename' });
                    store.createIndex('brand', 'detectedBrand', { unique: false });
                    store.createIndex('date', 'indexed', { unique: false });
                }
            };
        });
    }
    
    async checkDBStatus() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
            const count = countRequest.result;
            if (count > 0) {
                console.log(`📊 DB 로드: ${count}개 이미지`);
                this.updateStatus(`✅ ${count}개 이미지 준비 완료`);
            } else {
                console.log('📊 DB가 비어있습니다.');
                this.updateStatus('💡 폴더를 선택하여 이미지를 인덱싱하세요');
            }
        };
    }
    
    async deleteDB() {
        if (this.db) {
            this.db.close();
        }
        return new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(this.dbName);
            deleteReq.onsuccess = resolve;
            deleteReq.onerror = reject;
        });
    }
    
    // UI 헬퍼
    switchMode(mode) {
        this.currentMode = mode;
        console.log(`🔄 모드 전환: ${mode}`);
        
        // 모든 모드 숨기기
        document.getElementById('searchMode').style.display = 'none';
        document.getElementById('indexMode').style.display = 'none';
        document.getElementById('debugMode').style.display = 'none';
        
        // 선택된 모드 표시
        document.getElementById(`${mode}Mode`).style.display = 'block';
        
        // 버튼 활성화 상태 업데이트
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
    }
    
    updateStatus(message) {
        document.getElementById('status').textContent = message;
        console.log(message);
    }
    
    log(message) {
        const debugConsole = document.getElementById('debugConsole');
        if (debugConsole) {
            const timestamp = new Date().toLocaleTimeString();
            debugConsole.textContent += `[${timestamp}] ${message}\n`;
            debugConsole.scrollTop = debugConsole.scrollHeight;
        }
        console.log(message);
    }
}

// 앱 초기화
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new LuxuryFashionSearchApp();
    window.app = app; // 전역 접근용
});

// 앱 시작 메시지
console.log(`
╔════════════════════════════════════════╗
║   Fashion Search v18.0 - AI Powered   ║
║   MobileNet + Brand Recognition        ║
║   🚀 Deep Learning Edition             ║
╚════════════════════════════════════════╝
`);
