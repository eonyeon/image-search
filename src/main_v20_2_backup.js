// Fashion Image Search v20.2 - Full Working Version
// 실제 작동하는 완전한 버전
// 2025-01-03

console.log('🚀 Fashion Search v20.2 - Full Working Version');

class LuxuryFashionSearchApp {
    constructor() {
        console.log('📱 App constructor 시작');
        this.version = 'v20.2.0-WORKING';
        this.dbName = 'fashionSearchDB_v20_2';
        this.db = null;
        this.currentMode = 'search';
        this.currentSearchFile = null;
        this.models = {
            mobileNet: null,
            activeModel: 'standard'
        };
        this.isReady = false;
        this.init();
    }
    
    async init() {
        console.log('🔄 init() 시작');
        try {
            // 1. DB 초기화
            await this.openDB();
            console.log('✅ DB 초기화 완료');
            
            // 2. UI 생성
            this.setupUI();
            console.log('✅ UI 생성 완료');
            
            // 3. 이벤트 리스너
            this.attachEventListeners();
            console.log('✅ 이벤트 리스너 연결 완료');
            
            // 4. 상태 업데이트
            this.updateStatus('🔄 AI 모델 로딩 중...');
            
            // 5. 모델 로드
            await this.loadModels();
            
        } catch (error) {
            console.error('❌ 초기화 실패:', error);
            alert('초기화 실패: ' + error.message);
        }
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
                    const store = db.createObjectStore('images', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('filename', 'filename', { unique: false });
                    store.createIndex('indexed', 'indexed', { unique: false });
                }
            };
        });
    }
    
    async loadModels() {
        try {
            console.log('🤖 AI 모델 로딩 시작...');
            
            // TensorFlow.js 로드
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // MobileNet 로드
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet v2 로드 완료');
            
            // WebGL 백엔드 설정
            if (tf && tf.getBackend() !== 'webgl') {
                await tf.setBackend('webgl');
                console.log('✅ WebGL 가속 활성화');
            }
            
            this.isReady = true;
            this.updateStatus('✅ AI 모델 준비 완료! 검색 및 인덱싱이 가능합니다.');
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능만 사용 가능합니다.');
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
        console.log('🎨 UI 생성 중...');
        
        // 기존 로딩 메시지 제거
        document.body.innerHTML = '';
        
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
                <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <h1 style="text-align: center; color: #333; margin-bottom: 10px;">🎯 Fashion Image Search v20.2</h1>
                    <p id="status" style="text-align: center; color: #666; font-size: 14px;">초기화 중...</p>
                    
                    <!-- 모드 버튼 -->
                    <div style="text-align: center; margin: 20px 0;">
                        <button class="mode-btn active" data-mode="search" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            🔍 검색 모드
                        </button>
                        <button class="mode-btn" data-mode="index" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            📁 인덱싱 모드
                        </button>
                        <button class="mode-btn" data-mode="debug" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            ⚙️ 설정
                        </button>
                    </div>
                    
                    <!-- 검색 모드 -->
                    <div id="searchMode" class="mode-content" style="background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">🔍 검색 모드</h2>
                        <div style="border: 3px dashed #667eea; border-radius: 15px; padding: 60px 20px; text-align: center; cursor: pointer; background: white; transition: all 0.3s;" id="uploadArea">
                            <p style="color: #667eea; font-size: 18px; margin: 0;">🖼️ 이미지를 드래그하거나 클릭하여 선택하세요</p>
                            <input type="file" id="fileInput" accept="image/*" style="display:none">
                        </div>
                        <div id="previewContainer" style="display: none; margin-top: 20px; text-align: center;">
                            <img id="previewImage" style="max-width: 400px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                            <div id="searchStatus" style="margin-top: 10px; color: #666;"></div>
                        </div>
                        <div id="results" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 30px;"></div>
                    </div>
                    
                    <!-- 인덱싱 모드 -->
                    <div id="indexMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">📁 인덱싱 모드</h2>
                        <div style="text-align: center;">
                            <button id="selectFilesBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🖼️ 이미지 파일 선택
                            </button>
                            <button id="selectFolderBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: white; color: #667eea; border: 2px solid #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                📂 폴더 선택
                            </button>
                            <button id="clearDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🗑️ DB 초기화
                            </button>
                        </div>
                        
                        <div id="dropZone" style="margin-top: 20px; border: 3px dashed #667eea; border-radius: 15px; padding: 40px 20px; text-align: center; background: white;">
                            <h3 style="color: #667eea; margin: 0 0 10px 0;">📥 파일 드래그 & 드롭</h3>
                            <p style="color: #999; margin: 0;">여러 이미지를 여기에 드래그하세요</p>
                        </div>
                        
                        <div id="indexingProgress" style="margin-top: 20px; padding: 20px; background: white; border-radius: 10px; min-height: 100px; text-align: center;"></div>
                    </div>
                    
                    <!-- 디버그 모드 -->
                    <div id="debugMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">⚙️ 설정 및 디버그</h2>
                        <div style="text-align: center;">
                            <button id="validateDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                ✔️ DB 검증
                            </button>
                            <button id="reinitBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                💣 완전 초기화
                            </button>
                        </div>
                        <div id="debugOutput" style="margin-top: 20px; padding: 20px; background: white; border-radius: 10px; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto; font-size: 13px; line-height: 1.5;"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.innerHTML = html;
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        console.log('✅ HTML 삽입 완료');
    }
    
    attachEventListeners() {
        console.log('🔗 이벤트 리스너 연결 중...');
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('모드 버튼 클릭:', e.target.dataset.mode);
                
                // 버튼 스타일 변경
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'white';
                    b.style.color = '#667eea';
                });
                e.target.classList.add('active');
                e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.target.style.color = 'white';
                
                // 모든 모드 숨기기
                document.querySelectorAll('.mode-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // 선택된 모드 표시
                const mode = e.target.dataset.mode;
                const modeElement = document.getElementById(mode + 'Mode');
                if (modeElement) {
                    modeElement.style.display = 'block';
                }
                
                this.currentMode = mode;
            });
        });
        
        // 파일 업로드 (검색)
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            // 클릭 이벤트
            uploadArea.addEventListener('click', () => {
                console.log('업로드 영역 클릭');
                fileInput.click();
            });
            
            // 파일 선택 이벤트
            fileInput.addEventListener('change', (e) => {
                console.log('파일 선택됨:', e.target.files);
                if (e.target.files.length > 0) {
                    this.processSearchImage(e.target.files[0]);
                }
            });
            
            // 드래그 앤 드롭
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#764ba2';
                uploadArea.style.background = '#f0f2ff';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#667eea';
                uploadArea.style.background = 'white';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#667eea';
                uploadArea.style.background = 'white';
                
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length > 0) {
                    this.processSearchImage(files[0]);
                }
            });
        }
        
        // 인덱싱 파일 선택
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        if (selectFilesBtn) {
            selectFilesBtn.addEventListener('click', () => {
                console.log('파일 선택 버튼 클릭');
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    console.log(`${files.length}개 파일 선택됨`);
                    if (files.length > 0) {
                        this.indexFiles(files);
                    }
                };
                input.click();
            });
        }
        
        // 폴더 선택
        const selectFolderBtn = document.getElementById('selectFolderBtn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                console.log('폴더 선택 버튼 클릭');
                const input = document.createElement('input');
                input.type = 'file';
                input.webkitdirectory = true;
                input.directory = true;
                input.multiple = true;
                
                input.onchange = (e) => {
                    const allFiles = Array.from(e.target.files);
                    console.log(`전체 파일 수: ${allFiles.length}`);
                    
                    // 이미지 파일만 필터링
                    const imageFiles = allFiles.filter(f => {
                        const isImage = f.type.startsWith('image/') || 
                                       /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f.name);
                        if (isImage) {
                            console.log(`이미지 파일: ${f.name}`);
                        }
                        return isImage;
                    });
                    
                    console.log(`이미지 파일 수: ${imageFiles.length}`);
                    
                    if (imageFiles.length > 0) {
                        if (confirm(`${imageFiles.length}개의 이미지를 발견했습니다. 인덱싱을 시작하시겠습니까?`)) {
                            this.indexFiles(imageFiles);
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
                dropZone.style.borderColor = '#764ba2';
                dropZone.style.background = '#f0f2ff';
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.style.borderColor = '#667eea';
                dropZone.style.background = 'white';
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#667eea';
                dropZone.style.background = 'white';
                
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length > 0) {
                    this.indexFiles(files);
                }
            });
        }
        
        // DB 초기화
        const clearDBBtn = document.getElementById('clearDBBtn');
        if (clearDBBtn) {
            clearDBBtn.addEventListener('click', async () => {
                if (confirm('정말로 DB를 초기화하시겠습니까? 모든 인덱싱된 이미지가 삭제됩니다.')) {
                    await this.clearDB();
                    document.getElementById('indexingProgress').innerHTML = '<p style="color: green;">✅ DB가 초기화되었습니다.</p>';
                }
            });
        }
        
        // DB 검증
        const validateDBBtn = document.getElementById('validateDBBtn');
        if (validateDBBtn) {
            validateDBBtn.addEventListener('click', () => {
                this.validateDB();
            });
        }
        
        // 완전 초기화
        const reinitBtn = document.getElementById('reinitBtn');
        if (reinitBtn) {
            reinitBtn.addEventListener('click', () => {
                if (confirm('완전 초기화를 진행하시겠습니까? 모든 데이터가 삭제되고 페이지가 새로고침됩니다.')) {
                    indexedDB.deleteDatabase(this.dbName);
                    location.reload();
                }
            });
        }
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
        console.log('상태:', message);
    }
    
    // 이미지 특징 추출
    async extractFeatures(imageElement) {
        if (!this.models.mobileNet) {
            console.warn('MobileNet이 로드되지 않았습니다.');
            return new Array(1286).fill(0);
        }
        
        try {
            // MobileNet 특징 추출
            const embeddings = this.models.mobileNet.infer(imageElement, true);
            const mobileNetFeatures = await embeddings.array();
            embeddings.dispose();
            
            // 색상 특징 추출
            const colorFeatures = await this.extractColorFeatures(imageElement);
            
            // 특징 결합 (1280 + 6 = 1286)
            const features = [...mobileNetFeatures[0], ...colorFeatures];
            
            return features;
            
        } catch (error) {
            console.error('특징 추출 실패:', error);
            return new Array(1286).fill(0);
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
        
        let totalR = 0, totalG = 0, totalB = 0;
        let isDark = 0, isBrown = 0, isWhite = 0;
        
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            totalR += r;
            totalG += g;
            totalB += b;
            
            // 색상 카테고리 판별
            const brightness = (r + g + b) / 3;
            if (brightness < 50) isDark++;
            if (brightness > 200) isWhite++;
            if (r > g && r > b && r > 100 && r < 180) isBrown++;
        }
        
        return [
            totalR / pixelCount / 255,  // 평균 R
            totalG / pixelCount / 255,  // 평균 G
            totalB / pixelCount / 255,  // 평균 B
            isDark / pixelCount,        // 검정 비율
            isBrown / pixelCount,       // 브라운 비율
            isWhite / pixelCount        // 흰색 비율
        ];
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        this.currentSearchFile = file.name;
        console.log('🔍 검색 파일:', this.currentSearchFile);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                // 미리보기 표시
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                document.getElementById('searchStatus').textContent = '🔍 검색 중...';
                
                try {
                    // 특징 추출
                    const features = await this.extractFeatures(img);
                    console.log('검색 특징 추출 완료:', features.length);
                    
                    // 유사 이미지 검색
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
            
            if (images.length === 0) {
                document.getElementById('results').innerHTML = '<p style="text-align:center; color:#999;">인덱싱된 이미지가 없습니다. 먼저 이미지를 인덱싱하세요.</p>';
                return;
            }
            
            for (const image of images) {
                // 자기 자신 제외
                if (this.currentSearchFile && image.filename === this.currentSearchFile) {
                    continue;
                }
                
                if (!image.embedding || image.embedding.length === 0) {
                    continue;
                }
                
                // 유사도 계산
                const similarity = this.calculateSimilarity(queryFeatures, image.embedding);
                
                results.push({
                    ...image,
                    similarity: similarity
                });
            }
            
            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            console.log('=== 상위 5개 결과 ===');
            results.slice(0, 5).forEach((r, i) => {
                console.log(`${i+1}. ${r.filename}: ${(r.similarity * 100).toFixed(1)}%`);
            });
            
            // 결과 표시
            this.displayResults(results.slice(0, 20));
        };
    }
    
    // 유사도 계산
    calculateSimilarity(features1, features2) {
        if (!features1 || !features2) return 0;
        
        const len = Math.min(features1.length, features2.length);
        
        // MobileNet 특징 (0-1280)
        const mobileNetLen = Math.min(1280, len);
        let mobileNetSim = 0;
        for (let i = 0; i < mobileNetLen; i++) {
            mobileNetSim += features1[i] * features2[i];
        }
        
        // 색상 특징 (1280-1286)
        let colorSim = 0;
        if (len > 1280) {
            for (let i = 1280; i < Math.min(1286, len); i++) {
                colorSim += features1[i] * features2[i];
            }
            colorSim = colorSim / 6;  // 정규화
        }
        
        // 가중 평균 (형태 60%, 색상 40%)
        let finalSim = mobileNetSim * 0.6 + colorSim * 0.4;
        
        // 색상 보너스/페널티 (브라운 예시)
        if (len >= 1285) {
            const brown1 = features1[1284];
            const brown2 = features2[1284];
            if (brown1 > 0.3 && brown2 > 0.3) {
                finalSim = Math.min(1, finalSim * 1.15);  // 같은 브라운
            } else if (brown1 > 0.3 && brown2 < 0.1) {
                finalSim = finalSim * 0.85;  // 다른 색상
            }
        }
        
        return Math.max(0, Math.min(1, finalSim));
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
            
            const scoreColor = score >= 70 ? '#4caf50' : score >= 50 ? '#ff9800' : '#f44336';
            
            return `
                <div style="position: relative; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: white; border: 1px solid #eee;">
                    <div style="position: absolute; top: 10px; left: 10px; background: ${rankColor}; color: white; padding: 5px 10px; border-radius: 20px; font-weight: bold; font-size: 12px;">
                        #${index + 1}
                    </div>
                    <img src="${item.path}" style="width: 100%; height: 200px; object-fit: cover; display: block;">
                    <div style="padding: 12px;">
                        <div style="font-size: 20px; font-weight: bold; color: ${scoreColor};">${score}%</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">${item.filename}</div>
                        <div style="height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; margin-top: 8px;">
                            <div style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); width: ${score}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 파일 인덱싱
    async indexFiles(files) {
        if (!this.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        const progressDiv = document.getElementById('indexingProgress');
        const startTime = Date.now();
        
        progressDiv.innerHTML = `
            <h3>🔄 인덱싱 준비 중...</h3>
            <p>총 ${files.length}개 파일</p>
        `;
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length * 100).toFixed(1);
            
            progressDiv.innerHTML = `
                <h3>🔄 인덱싱 진행 중... (${i + 1}/${files.length})</h3>
                <p>현재 파일: ${file.name}</p>
                <div style="width: 100%; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin-top: 10px;">
                    <div style="width: ${progress}%; background: linear-gradient(90deg, #667eea, #764ba2); height: 20px;"></div>
                </div>
                <p style="margin-top: 10px; font-size: 12px;">성공: ${successCount} | 실패: ${failCount}</p>
            `;
            
            try {
                await this.processFile(file);
                successCount++;
            } catch (error) {
                console.error(`파일 처리 실패 (${file.name}):`, error);
                failCount++;
            }
            
            // 약간의 딜레이 (UI 업데이트)
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        progressDiv.innerHTML = `
            <h3>✅ 인덱싱 완료!</h3>
            <p>성공: ${successCount}개 | 실패: ${failCount}개</p>
            <p>소요 시간: ${elapsedTime}초</p>
        `;
    }
    
    // 파일 처리
    async processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        // 특징 추출
                        const embedding = await this.extractFeatures(img);
                        
                        // DB에 저장
                        const imageData = {
                            filename: file.name,
                            path: e.target.result,
                            embedding: embedding,
                            indexed: new Date().toISOString()
                        };
                        
                        await this.saveImageToDB(imageData);
                        console.log(`✅ ${file.name} 인덱싱 완료`);
                        resolve();
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // DB에 이미지 저장
    async saveImageToDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.add(imageData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // DB 초기화
    async clearDB() {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        await store.clear();
    }
    
    // DB 검증
    async validateDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const output = document.getElementById('debugOutput');
            
            let report = `=== DB 검증 결과 ===\n`;
            report += `총 이미지 수: ${images.length}개\n`;
            report += `DB 이름: ${this.dbName}\n`;
            report += `앱 버전: ${this.version}\n\n`;
            
            if (images.length > 0) {
                report += `=== 최근 5개 이미지 ===\n`;
                images.slice(-5).forEach((img, i) => {
                    report += `${i+1}. ${img.filename}\n`;
                    report += `   - 인덱싱: ${img.indexed}\n`;
                    report += `   - 특징 벡터: ${img.embedding ? img.embedding.length : 0}차원\n`;
                });
            }
            
            output.textContent = report;
        };
    }
}

// 앱 시작
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded - 앱 시작');
    
    // 로딩 메시지 제거
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) {
        loadingEl.remove();
    }
    
    // 앱 인스턴스 생성
    try {
        window.app = new LuxuryFashionSearchApp();
        console.log('✅ 앱 생성 성공');
    } catch (error) {
        console.error('❌ 앱 생성 실패:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h2>❌ 앱 로딩 실패</h2>
                <p>에러: ${error.message}</p>
                <p>개발자 도구(F12)를 열어 콘솔을 확인하세요.</p>
            </div>
        `;
    }
});

console.log('✅ main.js (v20.2) 로드 완료');
