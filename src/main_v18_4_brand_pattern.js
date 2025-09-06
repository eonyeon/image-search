// Fashion Image Search v18.4 - Brand Pattern Enhancement
// 브랜드별 패턴 인식 강화 버전
// 2025-01-03

console.log('🚀 Fashion Search v18.4 - Brand Pattern Enhancement');

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v18.4.0-BRAND-PATTERN';
        this.dbName = 'fashionSearchDB_v18_4';
        this.db = null;
        this.currentMode = 'search';
        this.models = {
            mobileNet: null,
            knnClassifier: null
        };
        this.isReady = false;
        
        // 브랜드별 패턴 특징 가중치
        this.brandWeights = {
            'LV': { pattern: 0.4, color: 0.3, shape: 0.3 },
            'CHANEL': { pattern: 0.3, color: 0.2, shape: 0.5 },
            'GOYARD': { pattern: 0.5, color: 0.3, shape: 0.2 }
        };
        
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
            console.log('✅ MobileNet 로드 완료');
            
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.2/dist/knn-classifier.min.js');
            this.models.knnClassifier = knnClassifier.create();
            console.log('✅ KNN Classifier 로드 완료');
            
            this.updateStatus('✅ 모든 시스템 준비 완료! (AI 모델 포함)');
            
            await this.checkAndMigrateDB();
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능은 사용 가능합니다.');
        }
    }
    
    // 브랜드 감지 함수 (파일명 기반)
    detectBrand(filename) {
        const name = filename.toLowerCase();
        
        // 파일명에서 브랜드 식별
        if (name.includes('lv') || name.includes('louis') || name.includes('vuitton')) {
            return 'LV';
        } else if (name.includes('chanel') || name.includes('샤넬')) {
            return 'CHANEL';
        } else if (name.includes('goyard') || name.includes('고야드')) {
            return 'GOYARD';
        }
        
        // 코드 번호로 브랜드 추정 (801XX 패턴)
        const codeMatch = name.match(/80(\d{3})/);
        if (codeMatch) {
            const code = parseInt(codeMatch[1]);
            if (code >= 140 && code <= 160) return 'LV';
            else if (code >= 160 && code <= 190) return 'CHANEL';
            else if (code >= 100 && code <= 140) return 'GOYARD';
        }
        
        return 'UNKNOWN';
    }
    
    // 색상 특징 추출
    async extractColorFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(imageElement, 0, 0, 50, 50);
        
        const imageData = ctx.getImageData(0, 0, 50, 50);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0;
        let browns = 0, blacks = 0, whites = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            
            // 색상 분류
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (avg < 60) blacks++;
            else if (avg > 200) whites++;
            else if (data[i] > data[i + 1] && data[i] > data[i + 2]) browns++;
        }
        
        const pixelCount = data.length / 4;
        
        return {
            avgR: r / pixelCount / 255,
            avgG: g / pixelCount / 255,
            avgB: b / pixelCount / 255,
            brownRatio: browns / pixelCount,
            blackRatio: blacks / pixelCount,
            whiteRatio: whites / pixelCount
        };
    }
    
    // 패턴 특징 추출 (엣지 검출)
    async extractPatternFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        let edges = 0;
        let diagonals = 0;
        
        // 간단한 엣지 검출
        for (let y = 1; y < 99; y++) {
            for (let x = 1; x < 99; x++) {
                const idx = (y * 100 + x) * 4;
                const left = (y * 100 + (x - 1)) * 4;
                const top = ((y - 1) * 100 + x) * 4;
                
                const diffH = Math.abs(data[idx] - data[left]);
                const diffV = Math.abs(data[idx] - data[top]);
                
                if (diffH > 30 || diffV > 30) edges++;
                
                // 대각선 패턴 검출 (퀼팅용)
                const topLeft = ((y - 1) * 100 + (x - 1)) * 4;
                const diffDiag = Math.abs(data[idx] - data[topLeft]);
                if (diffDiag > 30) diagonals++;
            }
        }
        
        return {
            edgeDensity: edges / (100 * 100),
            diagonalRatio: diagonals / edges
        };
    }
    
    // 향상된 특징 추출
    async extractEnhancedFeatures(imageElement, filename) {
        const brand = this.detectBrand(filename);
        
        // MobileNet 기본 특징
        const mobileNetFeatures = await this.extractFeaturesArray(imageElement);
        
        // 색상 특징
        const colorFeatures = await this.extractColorFeatures(imageElement);
        
        // 패턴 특징
        const patternFeatures = await this.extractPatternFeatures(imageElement);
        
        // 브랜드별 특징 벡터 생성
        const brandVector = this.createBrandVector(brand, colorFeatures, patternFeatures);
        
        // 특징 결합 (MobileNet + 브랜드 특징)
        const enhancedFeatures = [
            ...mobileNetFeatures,
            ...brandVector
        ];
        
        return {
            embedding: enhancedFeatures,
            brand: brand,
            colorFeatures: colorFeatures,
            patternFeatures: patternFeatures
        };
    }
    
    // 브랜드 특징 벡터 생성
    createBrandVector(brand, colorFeatures, patternFeatures) {
        const vector = new Array(20).fill(0);
        
        // 브랜드별 특징 강조
        switch(brand) {
            case 'LV':
                // 루이비통: 브라운 색상, 모노그램 패턴
                vector[0] = colorFeatures.brownRatio * 2;
                vector[1] = colorFeatures.avgR;
                vector[2] = patternFeatures.edgeDensity;
                vector[3] = 1; // LV 플래그
                break;
                
            case 'CHANEL':
                // 샤넬: 블랙/화이트, 퀼팅 패턴
                vector[4] = colorFeatures.blackRatio * 2;
                vector[5] = colorFeatures.whiteRatio;
                vector[6] = patternFeatures.diagonalRatio * 2;
                vector[7] = 1; // CHANEL 플래그
                break;
                
            case 'GOYARD':
                // 고야드: Y자 패턴, 다양한 색상
                vector[8] = patternFeatures.edgeDensity * 1.5;
                vector[9] = patternFeatures.diagonalRatio;
                vector[10] = 1; // GOYARD 플래그
                break;
                
            default:
                vector[11] = 1; // UNKNOWN 플래그
        }
        
        return vector;
    }
    
    // 파일 처리 (수정된 버전)
    async processFile(file) {
        const dataUrl = await this.fileToDataUrl(file);
        const img = await this.loadImage(dataUrl);
        
        let enhancedData;
        
        if (this.models.mobileNet) {
            try {
                enhancedData = await this.extractEnhancedFeatures(img, file.name);
                console.log(`✅ ${file.name} - 브랜드: ${enhancedData.brand}, 임베딩 크기: ${enhancedData.embedding.length}`);
            } catch (error) {
                console.warn('특징 추출 실패:', error.message);
                enhancedData = {
                    embedding: new Array(1300).fill(0), // 1280 + 20
                    brand: 'UNKNOWN'
                };
            }
        } else {
            enhancedData = {
                embedding: new Array(1300).fill(0),
                brand: 'UNKNOWN'
            };
        }
        
        const imageData = {
            filename: file.name,
            path: dataUrl,
            embedding: enhancedData.embedding,
            brand: enhancedData.brand,
            colorFeatures: enhancedData.colorFeatures,
            patternFeatures: enhancedData.patternFeatures,
            indexed: new Date().toISOString()
        };
        
        await this.saveImageToDB(imageData);
    }
    
    // 검색 이미지 처리 (수정된 버전)
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
                    const enhancedData = await this.extractEnhancedFeatures(img, file.name);
                    console.log(`검색 이미지 - 브랜드: ${enhancedData.brand}, 임베딩 크기: ${enhancedData.embedding.length}`);
                    
                    await this.searchSimilar(enhancedData);
                    
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
    
    // 유사 이미지 검색 (브랜드 가중치 적용)
    async searchSimilar(queryData) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const results = [];
            
            console.log(`검색 대상: ${images.length}개 이미지`);
            
            for (const image of images) {
                if (!image.embedding || image.embedding.length < 1280) {
                    console.warn(`${image.filename}: 잘못된 임베딩`);
                    continue;
                }
                
                // 기본 유사도 계산
                let similarity = this.cosineSimilarity(
                    queryData.embedding.slice(0, 1280),
                    image.embedding.slice(0, 1280)
                );
                
                // 브랜드 보너스 (같은 브랜드면 가중치 부여)
                if (queryData.brand !== 'UNKNOWN' && queryData.brand === image.brand) {
                    similarity *= 1.2; // 20% 보너스
                }
                
                // 브랜드가 다르면 페널티
                if (queryData.brand !== 'UNKNOWN' && image.brand !== 'UNKNOWN' && 
                    queryData.brand !== image.brand) {
                    similarity *= 0.8; // 20% 페널티
                }
                
                // 색상/패턴 특징 추가 비교 (있는 경우)
                if (image.colorFeatures && queryData.colorFeatures) {
                    const colorSim = this.compareColorFeatures(
                        queryData.colorFeatures,
                        image.colorFeatures
                    );
                    similarity = similarity * 0.8 + colorSim * 0.2;
                }
                
                results.push({
                    ...image,
                    similarity: Math.min(similarity, 1.0) // 최대값 1.0으로 제한
                });
            }
            
            console.log(`유효한 결과: ${results.length}개`);
            
            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 상위 20개 표시
            this.displayResults(results.slice(0, 20));
        };
    }
    
    // 색상 특징 비교
    compareColorFeatures(features1, features2) {
        if (!features1 || !features2) return 0;
        
        const diff = Math.abs(features1.avgR - features2.avgR) +
                    Math.abs(features1.avgG - features2.avgG) +
                    Math.abs(features1.avgB - features2.avgB) +
                    Math.abs(features1.brownRatio - features2.brownRatio) * 0.5 +
                    Math.abs(features1.blackRatio - features2.blackRatio) * 0.5;
        
        return Math.max(0, 1 - diff / 3);
    }
    
    // MobileNet 특징 추출 (기존 함수 유지)
    async extractFeaturesArray(imageElement) {
        if (!this.models.mobileNet) {
            throw new Error('MobileNet이 아직 로드되지 않았습니다');
        }
        
        try {
            const embeddings = this.models.mobileNet.infer(imageElement, true);
            const norm = tf.norm(embeddings);
            const normalized = tf.div(embeddings, norm);
            const arrayData = await normalized.array();
            
            embeddings.dispose();
            norm.dispose();
            normalized.dispose();
            
            if (Array.isArray(arrayData[0])) {
                return arrayData[0];
            }
            
            return arrayData;
            
        } catch (error) {
            console.error('특징 추출 오류:', error);
            throw error;
        }
    }
    
    // 나머지 함수들은 v18.3과 동일...
    
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
                <h1>🎯 Fashion Search v18.4 - Brand Pattern</h1>
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
                        <div id="brandInfo" style="margin-top:10px;"></div>
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
                    <button id="reindexBtn">🔄 임베딩 재인덱싱</button>
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
                uploadArea.style.background = '#e3f2fd';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.background = '#fafafa';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.background = '#fafafa';
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
                dropZone.style.borderColor = '#1976d2';
                dropZone.style.background = '#e3f2fd';
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
        document.getElementById('reindexBtn')?.addEventListener('click', () => this.reindexAll());
        
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 20px;
                font-size: 32px;
                text-align: center;
            }
            
            #status {
                background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                color: #5e35b1;
                padding: 15px;
                border-radius: 12px;
                margin-bottom: 25px;
                font-weight: 600;
                text-align: center;
                border: 2px solid #7e57c2;
            }
            
            .mode-buttons {
                display: flex;
                gap: 12px;
                margin-bottom: 30px;
            }
            
            .mode-btn {
                flex: 1;
                padding: 15px 20px;
                background: white;
                border: 2px solid #e0e0e0;
                color: #666;
                border-radius: 12px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .mode-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .mode-btn.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-color: transparent;
            }
            
            .upload-area {
                border: 3px dashed #7e57c2;
                border-radius: 20px;
                padding: 80px 20px;
                text-align: center;
                cursor: pointer;
                background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
                transition: all 0.3s;
            }
            
            .upload-area:hover {
                background: linear-gradient(135deg, #f3e5f5 0%, #e3f2fd 100%);
                transform: scale(1.02);
            }
            
            .upload-area p {
                color: #5e35b1;
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
                padding: 18px;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .primary-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .primary-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
            }
            
            .secondary-btn {
                background: linear-gradient(135deg, #78909c 0%, #546e7a 100%);
                color: white;
            }
            
            .secondary-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(120, 144, 156, 0.5);
            }
            
            .danger-btn {
                background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                color: white;
            }
            
            .danger-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(244, 67, 54, 0.5);
            }
            
            #dropZone {
                border: 3px dashed #b39ddb;
                border-radius: 20px;
                padding: 50px;
                text-align: center;
                background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
                transition: all 0.3s;
                margin-bottom: 25px;
            }
            
            #dropZone:hover {
                background: linear-gradient(135deg, #f3e5f5 0%, #e3f2fd 100%);
            }
            
            #dropZone h3 {
                color: #5e35b1;
                margin-bottom: 15px;
                font-size: 24px;
            }
            
            #dropZone p {
                color: #9575cd;
                font-size: 16px;
            }
            
            #previewContainer {
                text-align: center;
                margin: 30px 0;
            }
            
            #previewImage {
                max-width: 100%;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            
            #searchStatus {
                margin-top: 20px;
                padding: 15px;
                background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                border-radius: 12px;
                font-weight: 600;
                color: #5e35b1;
            }
            
            #brandInfo {
                padding: 10px;
                background: #fff3e0;
                border-radius: 8px;
                color: #e65100;
                font-weight: 600;
            }
            
            #results {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 25px;
                margin-top: 35px;
            }
            
            .result-item {
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                transition: all 0.3s;
                cursor: pointer;
                position: relative;
            }
            
            .result-item:hover {
                transform: translateY(-8px) scale(1.03);
                box-shadow: 0 15px 40px rgba(0,0,0,0.2);
            }
            
            .result-item img {
                width: 100%;
                height: 200px;
                object-fit: cover;
            }
            
            .result-info {
                padding: 15px;
                background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            }
            
            .similarity-score {
                font-size: 24px;
                font-weight: bold;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .brand-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 5px 10px;
                background: rgba(0,0,0,0.7);
                color: white;
                border-radius: 15px;
                font-size: 11px;
                font-weight: bold;
            }
            
            .progress-bar {
                background: #f0f0f0;
                border-radius: 15px;
                overflow: hidden;
                margin: 25px 0;
                height: 35px;
                box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .progress-fill {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                transition: width 0.3s;
                box-shadow: 0 2px 10px rgba(102, 126, 234, 0.5);
            }
            
            #debugConsole {
                background: #1e1e1e;
                color: #4fc3f7;
                padding: 25px;
                border-radius: 15px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                max-height: 400px;
                overflow-y: auto;
                white-space: pre-wrap;
                margin-top: 25px;
                box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }
    
    // 결과 표시 (브랜드 표시 추가)
    displayResults(results) {
        const resultsDiv = document.getElementById('results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align:center; color:#999;">검색 결과가 없습니다.</p>';
            return;
        }
        
        resultsDiv.innerHTML = results.map((item, index) => {
            const score = (item.similarity * 100).toFixed(1);
            const validScore = isNaN(score) ? 0 : score;
            
            const brandColors = {
                'LV': '#8B4513',
                'CHANEL': '#000000',
                'GOYARD': '#FF6B35',
                'UNKNOWN': '#999999'
            };
            
            return `
                <div class="result-item" data-rank="${index + 1}">
                    ${item.brand ? `<div class="brand-badge" style="background: ${brandColors[item.brand]}">${item.brand}</div>` : ''}
                    <img src="${item.path}" alt="${item.filename}">
                    <div class="result-info">
                        <div class="similarity-score">${validScore}%</div>
                        <div style="font-size:12px;color:#666;">${item.filename}</div>
                        <div style="font-size:10px;color:#999;">순위: ${index + 1}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 파일 선택 함수들
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
        this.updateStatus(`✅ ${successCount}개 이미지 인덱싱 완료!`);
        
        await this.validateDB();
    }
    
    // 유틸리티 함수들
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
    
    cosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2) {
            console.error('벡터가 null입니다');
            return 0;
        }
        
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
        
        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }
        
        const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        
        if (isNaN(similarity)) {
            return 0;
        }
        
        return similarity;
    }
    
    // DB 관리 함수들
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
                    store.createIndex('brand', 'brand', { unique: false });
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
                if (image.embedding && image.embedding.length < 1280) {
                    needMigration = true;
                    break;
                }
            }
            
            if (needMigration) {
                console.log('🔄 기존 DB 마이그레이션 필요');
                if (confirm('기존 데이터베이스를 새 형식으로 마이그레이션해야 합니다. 재인덱싱하시겠습니까?')) {
                    await this.clearDB();
                    this.updateStatus('⚠️ DB 초기화 완료. 이미지를 다시 인덱싱해주세요.');
                }
            }
        };
    }
    
    async reindexAll() {
        alert('재인덱싱 기능은 v18.4에서 준비 중입니다.');
    }
    
    // 디버그 기능들
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
        }
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
            const brandCounts = {};
            
            console.textContent = `=== DB 검증 ===\n\n`;
            console.textContent += `총 이미지: ${images.length}개\n\n`;
            
            for (const img of images) {
                if (img.embedding && img.embedding.length >= 1280) {
                    validCount++;
                    
                    // 브랜드 카운트
                    if (img.brand) {
                        brandCounts[img.brand] = (brandCounts[img.brand] || 0) + 1;
                    }
                } else {
                    invalidCount++;
                    console.textContent += `❌ ${img.filename}: 잘못된 임베딩 (크기: ${img.embedding?.length || 0})\n`;
                }
            }
            
            console.textContent += `\n✅ 유효: ${validCount}개\n`;
            console.textContent += `❌ 무효: ${invalidCount}개\n`;
            
            console.textContent += `\n브랜드별 분포:\n`;
            for (const [brand, count] of Object.entries(brandCounts)) {
                console.textContent += `  ${brand}: ${count}개\n`;
            }
            
            if (validCount > 0) {
                console.textContent += `\n샘플 데이터 (상위 5개):\n`;
                images.slice(0, 5).forEach((img, i) => {
                    console.textContent += `${i+1}. ${img.filename}\n`;
                    console.textContent += `   브랜드: ${img.brand || 'UNKNOWN'}\n`;
                    console.textContent += `   임베딩 크기: ${img.embedding?.length || 0}\n`;
                });
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

console.log('Fashion Search v18.4 - Brand Pattern Enhancement Ready');
