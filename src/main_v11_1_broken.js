import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v11.1 - Enhanced Product Recognition
class EnhancedFashionSearch {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.productDatabase = {};
        this.version = '11.1.0';
        this.model = null;
        this.modelLoaded = false;
        this.debugMode = true; // 디버그 모드 활성화
        
        // LocalForage 설정
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV11'
        });
        
        console.log(`🚀 Fashion Search v${this.version} - Enhanced Product Recognition`);
        console.log('✨ 개선사항: 제품 ID 추출 강화, 가중치 최적화, 디버그 모드');
        this.init();
    }

    async init() {
        console.log('🔧 시스템 초기화 중...');
        
        // TensorFlow.js 백엔드 설정
        await tf.setBackend('webgl');
        await tf.ready();
        
        // WebGL 최적화
        tf.env().set('WEBGL_VERSION', 2);
        tf.env().set('WEBGL_PACK_DEPTHWISECONV', true);
        tf.env().set('WEBGL_CPU_FORWARD', false);
        tf.env().set('WEBGL_PACK_BINARY_OPERATIONS', true);
        tf.env().set('WEBGL_PACK_UNARY_OPERATIONS', true);
        
        console.log('✅ TensorFlow.js 백엔드 준비 완료:', tf.getBackend());
        
        await this.loadModel();
        await this.loadDatabase();
        this.setupEventListeners();
        
        console.log('✅ 초기화 완료!');
        
        // 전역 객체로 등록
        window.fashionApp = this;
    }

    async loadModel() {
        try {
            this.showLoading('딥러닝 모델 로드 중... (첫 실행시 다운로드 필요)');
            
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            
            // 모델 워밍업
            console.log('🔥 모델 워밍업 중...');
            const dummyImg = tf.zeros([224, 224, 3]);
            const dummyPrediction = await this.model.infer(dummyImg, true);
            dummyPrediction.dispose();
            dummyImg.dispose();
            
            this.modelLoaded = true;
            console.log('✅ MobileNet v2 모델 로드 완료!');
            this.hideLoading();
        } catch (error) {
            console.error('❌ 모델 로드 실패:', error);
            alert('모델 로드 실패. 인터넷 연결을 확인해주세요.');
            this.hideLoading();
        }
    }

    setupEventListeners() {
        console.log('🔧 이벤트 리스너 설정 중...');
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
                console.log(`모드 전환: ${mode}`);
            });
        });

        // 파일 업로드
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => {
                console.log('업로드 영역 클릭');
                fileInput.click();
            });

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', async (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    await this.handleImageUpload(file);
                }
            });

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    console.log(`파일 선택됨: ${file.name}`);
                    await this.handleImageUpload(file);
                }
            });
        }

        // 검색 버튼
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                console.log('검색 버튼 클릭');
                if (this.uploadedImage) {
                    await this.searchSimilarImages();
                }
            });
        }

        // 폴더 선택 버튼
        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', async () => {
                console.log('폴더 선택 버튼 클릭');
                await this.selectFolder();
            });
        }

        // DB 초기화 버튼
        const clearDbBtn = document.getElementById('clear-db-btn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', async () => {
                console.log('DB 초기화 버튼 클릭');
                if (confirm('데이터베이스를 초기화하시겠습니까? 모든 인덱싱된 데이터가 삭제됩니다.')) {
                    await this.clearDB();
                    alert('데이터베이스가 초기화되었습니다.');
                    console.log('🗑️ 데이터베이스 초기화 완료');
                }
            });
        }

        console.log('✅ 이벤트 리스너 설정 완료');
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // UI 업데이트
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        document.querySelectorAll('.mode-section').forEach(section => {
            section.style.display = section.id.includes(mode) ? 'block' : 'none';
        });
    }

    async handleImageUpload(file) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const imgElement = document.getElementById('uploaded-image');
            if (imgElement) {
                imgElement.src = e.target.result;
                imgElement.style.display = 'block';
            }
            
            // 이미지를 tensor로 변환
            const img = new Image();
            img.src = e.target.result;
            await img.decode();
            
            this.uploadedImage = {
                file: file,
                tensor: await this.preprocessImage(img),
                element: img
            };
            
            // 검색 버튼 활성화
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.disabled = false;
            }
            
            console.log(`✅ 이미지 업로드 완료: ${file.name}`);
        };
        
        reader.readAsDataURL(file);
    }

    async preprocessImage(imgElement) {
        return tf.tidy(() => {
            // 이미지를 tensor로 변환
            let tensor = tf.browser.fromPixels(imgElement);
            
            // 224x224로 리사이즈
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            
            // 정규화 (MobileNet 표준)
            const normalized = resized.div(255.0);
            
            // 배치 차원 추가
            const batched = normalized.expandDims(0);
            
            return batched;
        });
    }

    // 개선된 제품 ID 추출 함수
    extractProductId(filename) {
        // 파일명에서 확장자 제거
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // 다양한 패턴으로 제품 ID 추출 시도
        const patterns = [
            /^(\d{5})(?:[\s_\-]|$)/,    // 시작 부분 5자리 숫자
            /^(\d{4,6})(?:[\s_\-]|$)/,   // 시작 부분 4-6자리 숫자
            /[\s_\-](\d{5})(?:[\s_\-]|$)/, // 중간 5자리 숫자
            /(\d{5})/,                    // 어디든 5자리 숫자
            /^(\d+)/                      // 시작 부분 모든 숫자
        ];
        
        for (const pattern of patterns) {
            const match = nameWithoutExt.match(pattern);
            if (match) {
                const productId = match[1].trim();
                if (this.debugMode) {
                    console.log(`📦 제품 ID 추출: ${filename} → ${productId}`);
                }
                return productId;
            }
        }
        
        if (this.debugMode) {
            console.log(`⚠️ 제품 ID 추출 실패: ${filename}`);
        }
        return null;
    }

    // 개선된 유사 이미지 검색
    async searchSimilarImages() {
        if (!this.uploadedImage || !this.modelLoaded) {
            alert('이미지를 업로드하고 모델이 로드될 때까지 기다려주세요.');
            return;
        }

        console.log('🔍 v11.1 Enhanced 검색 시작...');
        this.showLoading('유사 이미지 검색 중...');

        try {
            // 업로드된 이미지의 특징 추출
            const queryFeatures = await this.model.infer(this.uploadedImage.tensor, true);
            const queryArray = await queryFeatures.array();
            const queryVector = queryArray[0];
            queryFeatures.dispose();

            console.log(`📊 특징 벡터 추출 완료: ${queryVector.length}차원`);

            // 모든 이미지와 유사도 계산
            const results = [];
            
            // 업로드한 이미지의 제품 ID 추출 (있다면)
            const uploadedProductId = this.extractProductId(this.uploadedImage.file.name);
            
            for (const img of this.imageDatabase) {
                // 개별 이미지 유사도 계산
                const individualSim = this.calculateCosineSimilarity(queryVector, img.features);
                
                // 제품 ID 확인
                const imgProductId = this.extractProductId(img.name);
                
                // 초기 유사도는 개별 유사도
                let finalSimilarity = individualSim;
                let boosted = false;
                let productSim = 0;
                
                // 제품별 부스팅 (가중치 조정됨)
                if (imgProductId && this.productDatabase[imgProductId]) {
                    const product = this.productDatabase[imgProductId];
                    
                    // 제품 평균 특징과 비교
                    if (product.averageFeatures) {
                        productSim = this.calculateCosineSimilarity(queryVector, product.averageFeatures);
                        
                        // 더 균형잡힌 가중치 적용 (0.75:0.25)
                        finalSimilarity = individualSim * 0.75 + productSim * 0.25;
                        boosted = true;
                        
                        // 같은 제품 ID면 추가 부스팅
                        if (uploadedProductId && uploadedProductId === imgProductId) {
                            finalSimilarity = Math.min(finalSimilarity * 1.1, 0.99);
                            boosted = true;
                        }
                    }
                }
                
                results.push({
                    ...img,
                    similarity: finalSimilarity,
                    debug: this.debugMode ? {
                        individualSim: individualSim.toFixed(3),
                        productSim: productSim.toFixed(3),
                        productId: imgProductId,
                        boosted: boosted,
                        uploadedProductId: uploadedProductId
                    } : null
                });
            }

            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);

            console.log(`✅ 검색 완료: ${results.length}개 결과`);
            
            // 상위 결과 로그
            if (this.debugMode) {
                console.log('📊 상위 10개 결과 (디버그):');
                results.slice(0, 10).forEach((result, index) => {
                    console.log(`  ${index + 1}. ${result.name}: ${(result.similarity * 100).toFixed(1)}%`, result.debug);
                });
            }

            // 결과 표시
            this.displayResults(results);
            
        } catch (error) {
            console.error('❌ 검색 실패:', error);
            alert('검색 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    calculateCosineSimilarity(vec1, vec2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        return dotProduct / (norm1 * norm2);
    }

    async displayResults(results) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        // 상위 20개만 표시
        const topResults = results.slice(0, 20);

        for (const result of topResults) {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // 유사도에 따른 테두리 색상
            let borderClass = '';
            if (result.similarity > 0.85) {
                borderClass = 'perfect-match';  // 녹색
            } else if (result.similarity > 0.75) {
                borderClass = 'good-match';      // 노란색
            } else if (result.similarity > 0.65) {
                borderClass = 'fair-match';      // 주황색
            }
            
            resultItem.classList.add(borderClass);
            
            // 이미지 로드 (개선된 방식)
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData], { 
                    type: this.getMimeType(result.path) 
                });
                const imageUrl = URL.createObjectURL(blob);
                
                // 제품 ID 표시
                const productId = this.extractProductId(result.name);
                const productBadge = productId ? `<span class="product-badge">#${productId}</span>` : '';
                
                // 디버그 정보
                const debugInfo = this.debugMode && result.debug ? `
                    <div class="debug-info">
                        <small>
                            개별: ${result.debug.individualSim} | 
                            제품: ${result.debug.productSim} | 
                            ${result.debug.boosted ? '⚡부스팅' : ''}
                        </small>
                    </div>
                ` : '';
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" onerror="this.src='placeholder.jpg'">
                    <div class="result-info">
                        <div class="result-name">${result.name}</div>
                        ${productBadge}
                        <div class="result-similarity">${(result.similarity * 100).toFixed(1)}%</div>
                        ${debugInfo}
                    </div>
                `;
                
                // 클릭시 원본 이미지 열기
                resultItem.addEventListener('click', () => {
                    window.open(imageUrl, '_blank');
                });
                
            } catch (error) {
                console.error(`이미지 로드 실패: ${result.path}`, error);
                resultItem.innerHTML = `
                    <div class="error-placeholder">이미지 로드 실패</div>
                    <div class="result-info">
                        <div class="result-name">${result.name}</div>
                        <div class="result-similarity">${(result.similarity * 100).toFixed(1)}%</div>
                    </div>
                `;
            }
            
            resultsContainer.appendChild(resultItem);
        }

        // 결과 섹션 표시
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }

    getMimeType(filepath) {
        const ext = filepath.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'bmp': 'image/bmp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    async selectFolder() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: '이미지 폴더 선택'
            });

            if (selected) {
                console.log(`폴더 선택됨: ${selected}`);
                await this.indexFolder(selected);
            }
        } catch (error) {
            console.error('폴더 선택 실패:', error);
        }
    }

    async indexFolder(folderPath) {
        this.showLoading('이미지 인덱싱 중... 시간이 걸릴 수 있습니다.');
        console.log(`📁 폴더 인덱싱 시작: ${folderPath}`);

        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const images = [];

            // 이미지 파일 필터링
            function collectImages(entries, basePath = '') {
                for (const entry of entries) {
                    if (entry.children) {
                        collectImages(entry.children, `${basePath}${entry.name}/`);
                    } else {
                        const ext = entry.name.split('.').pop().toLowerCase();
                        if (imageExtensions.includes(ext)) {
                            images.push({
                                name: entry.name,
                                path: entry.path
                            });
                        }
                    }
                }
            }

            collectImages(entries);
            console.log(`🖼️ ${images.length}개의 이미지 발견`);

            // 기존 데이터 초기화
            this.imageDatabase = [];
            this.productDatabase = {};
            
            // 각 이미지 처리
            let processed = 0;
            const updateProgress = () => {
                const progress = Math.round((processed / images.length) * 100);
                this.updateLoadingMessage(`인덱싱 중... (${processed}/${images.length}) - ${progress}%`);
            };

            for (const imageInfo of images) {
                try {
                    // 이미지 로드
                    const imageData = await readBinaryFile(imageInfo.path);
                    const blob = new Blob([imageData]);
                    const url = URL.createObjectURL(blob);
                    
                    // 이미지 엘리먼트 생성
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = url;
                    });

                    // 특징 추출
                    const tensor = await this.preprocessImage(img);
                    const features = await this.model.infer(tensor, true);
                    const featuresArray = await features.array();
                    
                    // 데이터베이스에 저장
                    const imageEntry = {
                        name: imageInfo.name,
                        path: imageInfo.path,
                        features: featuresArray[0]
                    };
                    
                    this.imageDatabase.push(imageEntry);
                    
                    // 제품별 그룹화
                    const productId = this.extractProductId(imageInfo.name);
                    if (productId) {
                        if (!this.productDatabase[productId]) {
                            this.productDatabase[productId] = {
                                images: [],
                                features: []
                            };
                        }
                        this.productDatabase[productId].images.push(imageEntry);
                        this.productDatabase[productId].features.push(featuresArray[0]);
                    }
                    
                    // 메모리 정리
                    tensor.dispose();
                    features.dispose();
                    URL.revokeObjectURL(url);
                    
                    processed++;
                    
                    // 진행상황 업데이트 (10개마다)
                    if (processed % 10 === 0) {
                        updateProgress();
                        // 메모리 정리
                        await tf.nextFrame();
                    }
                    
                } catch (error) {
                    console.error(`이미지 처리 실패: ${imageInfo.name}`, error);
                    processed++;
                }
            }

            // 제품별 평균 특징 계산
            for (const productId in this.productDatabase) {
                const product = this.productDatabase[productId];
                if (product.features.length > 1) {
                    // 평균 특징 벡터 계산
                    const avgFeatures = new Array(product.features[0].length).fill(0);
                    
                    for (const features of product.features) {
                        for (let i = 0; i < features.length; i++) {
                            avgFeatures[i] += features[i];
                        }
                    }
                    
                    for (let i = 0; i < avgFeatures.length; i++) {
                        avgFeatures[i] /= product.features.length;
                    }
                    
                    product.averageFeatures = avgFeatures;
                    
                    console.log(`📦 제품 ${productId}: ${product.images.length}개 이미지 그룹화`);
                }
            }

            // LocalForage에 저장
            await this.saveDatabase();
            
            console.log(`✅ v11.1 인덱싱 완료: ${this.imageDatabase.length}개 이미지`);
            console.log(`📦 제품 그룹: ${Object.keys(this.productDatabase).length}개`);
            
            // 통계 표시
            this.displayStats();
            
        } catch (error) {
            console.error('인덱싱 실패:', error);
            alert('인덱싱 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    async saveDatabase() {
        try {
            await this.storage.setItem('imageDatabase', this.imageDatabase);
            await this.storage.setItem('productDatabase', this.productDatabase);
            await this.storage.setItem('version', this.version);
            console.log('💾 데이터베이스 저장 완료 (v11.1)');
        } catch (error) {
            console.error('데이터베이스 저장 실패:', error);
        }
    }

    async loadDatabase() {
        try {
            const version = await this.storage.getItem('version');
            const imageDb = await this.storage.getItem('imageDatabase');
            const productDb = await this.storage.getItem('productDatabase');
            
            if (imageDb && version === this.version) {
                this.imageDatabase = imageDb;
                this.productDatabase = productDb || {};
                console.log(`📂 ${this.imageDatabase.length}개의 이미지 로드됨`);
                console.log(`📦 ${Object.keys(this.productDatabase).length}개의 제품 그룹 로드됨`);
                this.displayStats();
            } else if (version !== this.version) {
                console.log('⚠️ 버전 불일치. DB 재인덱싱이 필요합니다.');
                await this.clearDB();
            }
        } catch (error) {
            console.error('데이터베이스 로드 실패:', error);
        }
    }

    async clearDB() {
        await this.storage.clear();
        this.imageDatabase = [];
        this.productDatabase = {};
        this.updateStats('데이터베이스가 초기화되었습니다.');
    }

    displayStats() {
        const totalImages = this.imageDatabase.length;
        const totalProducts = Object.keys(this.productDatabase).length;
        const productsWithMultiple = Object.values(this.productDatabase)
            .filter(p => p.images && p.images.length > 1).length;
        
        const avgImagesPerProduct = totalProducts > 0 
            ? (totalImages / totalProducts).toFixed(1) 
            : 0;
        
        const statsText = `
            📊 데이터베이스 통계:
            • 총 이미지: ${totalImages}개
            • 총 제품: ${totalProducts}개
            • 제품당 평균: ${avgImagesPerProduct}개
            • 다중 이미지 제품: ${productsWithMultiple}개
        `;
        
        this.updateStats(statsText.trim());
        console.log(statsText);
    }

    updateStats(message) {
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.textContent = message;
        }
    }

    showLoading(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.textContent = message || '처리 중...';
        }
    }

    updateLoadingMessage(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.textContent = message;
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // 콘솔 명령어
    version() {
        return `Fashion Search v${this.version} - Enhanced Product Recognition`;
    }

    memory() {
        const used = performance.memory?.usedJSHeapSize || 0;
        const total = performance.memory?.totalJSHeapSize || 0;
        return `메모리 사용: ${(used / 1048576).toFixed(2)}MB / ${(total / 1048576).toFixed(2)}MB`;
    }

    async testFeatures() {
        console.log('🧪 특징 추출 테스트 시작...');
        const testImg = tf.randomNormal([1, 224, 224, 3]);
        const features = await this.model.infer(testImg, true);
        const shape = features.shape;
        features.dispose();
        testImg.dispose();
        console.log(`✅ 특징 차원: ${shape}`);
        return shape;
    }

    stats() {
        this.displayStats();
        return {
            images: this.imageDatabase.length,
            products: Object.keys(this.productDatabase).length,
            productsWithMultiple: Object.values(this.productDatabase)
                .filter(p => p.images && p.images.length > 1).length
        };
    }

    findProduct(productId) {
        const product = this.productDatabase[productId];
        if (product) {
            console.log(`📦 제품 ${productId}:`, {
                images: product.images.map(img => img.name),
                count: product.images.length,
                hasAverage: !!product.averageFeatures
            });
            return product;
        } else {
            console.log(`❌ 제품 ${productId}를 찾을 수 없습니다.`);
            return null;
        }
    }

    getProductImages(productId) {
        const product = this.productDatabase[productId];
        return product ? product.images.map(img => img.name) : [];
    }

    debug(enabled = true) {
        this.debugMode = enabled;
        console.log(`🔧 디버그 모드: ${enabled ? 'ON' : 'OFF'}`);
        return `디버그 모드가 ${enabled ? '활성화' : '비활성화'}되었습니다.`;
    }

    async reloadModel() {
        console.log('🔄 모델 재로드 중...');
        this.modelLoaded = false;
        if (this.model) {
            this.model.dispose();
        }
        await this.loadModel();
        return '✅ 모델 재로드 완료';
    }
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 로드 완료, 앱 초기화 시작...');
    
    // CSS 스타일 추가 (디버그 모드용)
    const style = document.createElement('style');
    style.textContent = `
        .result-item.perfect-match {
            border: 3px solid #4CAF50 !important;
        }
        .result-item.good-match {
            border: 3px solid #FFC107 !important;
        }
        .result-item.fair-match {
            border: 3px solid #FF9800 !important;
        }
        .product-badge {
            background: #2196F3;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 8px;
        }
        .debug-info {
            margin-top: 4px;
            color: #666;
            font-size: 11px;
        }
    `;
    document.head.appendChild(style);
    
    new EnhancedFashionSearch();
    
    console.log('🎯 Fashion Search v11.1 초기화 완료!');
    console.log('💡 개선사항:');
    console.log('  ✅ 강화된 제품 ID 추출');
    console.log('  ✅ 균형잡힌 가중치 (75:25)');
    console.log('  ✅ 디버그 모드 추가');
    console.log('  ✅ 제품 그룹 통계');
    
    console.log('콘솔 명령어:');
    console.log('  fashionApp.version() - 버전 정보');
    console.log('  fashionApp.stats() - 통계 정보');
    console.log('  fashionApp.findProduct("80159") - 특정 제품 검색');
    console.log('  fashionApp.getProductImages("80159") - 제품 이미지 목록');
    console.log('  fashionApp.debug(true/false) - 디버그 모드');
    console.log('  fashionApp.clearDB() - DB 초기화');
    console.log('  fashionApp.memory() - 메모리 사용량');
});

// 전역 에러 처리
window.addEventListener('error', (event) => {
    console.error('전역 에러:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);
});
