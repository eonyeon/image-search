import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v11.0 - Product-Aware Search (제품 인식 개선)
class ProductAwareFashionSearch {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.productDatabase = {}; // 제품별 그룹화
        this.version = '11.0.0';
        this.model = null;
        this.modelLoaded = false;
        
        // LocalForage 설정
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV11'
        });
        
        console.log(`🚀 Fashion Search v${this.version} - Product-Aware Search`);
        console.log('✨ 핵심 개선: 제품별 다중 이미지 & Feature Averaging');
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
    }

    async loadModel() {
        try {
            this.showLoading('딥러닝 모델 로드 중...');
            
            // MobileNet v2 로드
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

    // 제품 ID 추출 (파일명에서 제품번호 추출)
    extractProductId(filename) {
        // 예: "80159_front.jpg" -> "80159"
        // 예: "80159 .jpg" -> "80159"
        // 예: "80159.jpg" -> "80159"
        
        // 파일명에서 확장자 제거
        const nameWithoutExt = filename.split('.')[0];
        
        // 숫자로 시작하는 부분 추출
        const match = nameWithoutExt.match(/^(\d+)/);
        if (match) {
            return match[1];
        }
        
        // 숫자가 없으면 전체 이름을 ID로 사용
        return nameWithoutExt.trim();
    }

    // 특징 벡터 추출 (다중 스케일 옵션)
    async extractFeatures(imgElement, multiScale = false) {
        if (!this.modelLoaded) {
            console.error('모델이 아직 로드되지 않았습니다');
            return null;
        }
        
        try {
            if (multiScale) {
                // 다중 스케일 특징 추출 (실험적)
                const features224 = await this.extractSingleScaleFeatures(imgElement, 224);
                const features256 = await this.extractSingleScaleFeatures(imgElement, 256);
                const features192 = await this.extractSingleScaleFeatures(imgElement, 192);
                
                // 가중 평균 (224를 기준으로)
                const combined = [];
                for (let i = 0; i < features224.length; i++) {
                    combined[i] = features224[i] * 0.5 + features256[i] * 0.3 + features192[i] * 0.2;
                }
                
                return combined;
            } else {
                // 단일 스케일 (기본)
                return await this.extractSingleScaleFeatures(imgElement, 224);
            }
        } catch (error) {
            console.error('특징 추출 실패:', error);
            return null;
        }
    }

    async extractSingleScaleFeatures(imgElement, size) {
        const tensorImg = tf.browser.fromPixels(imgElement)
            .resizeNearestNeighbor([size, size])
            .toFloat();
        
        // ImageNet 표준 전처리
        const offset = tf.scalar(127.5);
        const normalized = tensorImg.sub(offset).div(offset);
        const batched = normalized.expandDims(0);
        
        // 특징 추출
        const features = await this.model.infer(batched, true);
        const featuresArray = await features.data();
        
        // 메모리 정리
        tensorImg.dispose();
        normalized.dispose();
        batched.dispose();
        features.dispose();
        offset.dispose();
        
        // L2 정규화
        return this.normalizeVector(Array.from(featuresArray));
    }

    // L2 정규화
    normalizeVector(vector) {
        const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (norm === 0) return vector;
        return vector.map(val => val / norm);
    }

    // 코사인 유사도
    calculateCosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            return 0;
        }
        
        // 이미 정규화된 벡터라면 내적만 계산
        let dotProduct = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
        }
        
        return dotProduct;
    }

    // 제품 그룹의 평균 특징 벡터 계산
    calculateProductAverageFeatures(productImages) {
        if (productImages.length === 0) return null;
        
        const featureLength = productImages[0].features.length;
        const avgFeatures = new Array(featureLength).fill(0);
        
        // 모든 특징 벡터 합산
        for (const img of productImages) {
            for (let i = 0; i < featureLength; i++) {
                avgFeatures[i] += img.features[i];
            }
        }
        
        // 평균 계산
        for (let i = 0; i < featureLength; i++) {
            avgFeatures[i] /= productImages.length;
        }
        
        // 정규화
        return this.normalizeVector(avgFeatures);
    }

    // 제품별로 그룹화
    groupByProduct() {
        this.productDatabase = {};
        
        for (const img of this.imageDatabase) {
            const productId = this.extractProductId(img.name);
            
            if (!this.productDatabase[productId]) {
                this.productDatabase[productId] = {
                    id: productId,
                    images: [],
                    averageFeatures: null
                };
            }
            
            this.productDatabase[productId].images.push(img);
        }
        
        // 각 제품의 평균 특징 계산
        for (const productId in this.productDatabase) {
            const product = this.productDatabase[productId];
            product.averageFeatures = this.calculateProductAverageFeatures(product.images);
        }
        
        console.log(`📦 ${Object.keys(this.productDatabase).length}개 제품 그룹 생성`);
        
        // 제품별 이미지 수 통계
        const stats = {};
        for (const productId in this.productDatabase) {
            const count = this.productDatabase[productId].images.length;
            stats[`${count}개`] = (stats[`${count}개`] || 0) + 1;
        }
        console.log('📊 제품별 이미지 수:', stats);
    }

    // v11 검색: 제품 단위 검색
    async searchSimilarImagesV11(uploadedImageElement) {
        if (!this.modelLoaded) {
            alert('모델이 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        console.log('🔍 v11 Product-Aware 검색 시작...');
        this.showLoading('제품 유사도 분석 중...');
        
        try {
            // 업로드된 이미지의 특징 추출
            const queryFeatures = await this.extractFeatures(uploadedImageElement);
            
            if (!queryFeatures) {
                throw new Error('특징 추출 실패');
            }
            
            console.log(`📊 특징 벡터 추출 완료: ${queryFeatures.length}차원`);
            
            // 두 가지 검색 수행
            const results = [];
            
            // 1. 개별 이미지와 비교
            for (const img of this.imageDatabase) {
                const similarity = this.calculateCosineSimilarity(queryFeatures, img.features);
                results.push({
                    ...img,
                    similarity: similarity,
                    type: 'individual'
                });
            }
            
            // 2. 제품 평균 특징과 비교 (부스팅)
            for (const productId in this.productDatabase) {
                const product = this.productDatabase[productId];
                if (product.averageFeatures) {
                    const avgSimilarity = this.calculateCosineSimilarity(
                        queryFeatures, 
                        product.averageFeatures
                    );
                    
                    // 해당 제품의 모든 이미지에 부스팅 적용
                    for (const img of product.images) {
                        const boostedResult = results.find(r => r.path === img.path);
                        if (boostedResult) {
                            // 개별 유사도와 평균 유사도를 결합
                            const originalSim = boostedResult.similarity;
                            const boostedSim = (originalSim * 0.6) + (avgSimilarity * 0.4);
                            
                            boostedResult.productSimilarity = avgSimilarity;
                            boostedResult.boostedSimilarity = boostedSim;
                            boostedResult.productId = productId;
                            
                            // 최종 유사도는 부스팅된 값 사용
                            boostedResult.finalSimilarity = boostedSim;
                        }
                    }
                }
            }
            
            // 최종 유사도 기준 정렬
            results.sort((a, b) => {
                const simA = a.finalSimilarity || a.similarity;
                const simB = b.finalSimilarity || b.similarity;
                return simB - simA;
            });
            
            console.log('✅ 검색 완료:', results.length, '개 결과');
            
            // 상위 5개 결과 로그
            console.log('📊 상위 5개 결과:');
            results.slice(0, 5).forEach((result, index) => {
                const finalSim = result.finalSimilarity || result.similarity;
                const productInfo = result.productId ? ` (제품: ${result.productId})` : '';
                const boostInfo = result.boostedSimilarity ? ' [부스팅됨]' : '';
                console.log(`  ${index + 1}. ${result.name}: ${(finalSim * 100).toFixed(1)}%${productInfo}${boostInfo}`);
            });
            
            // 제품 그룹별 최고 매칭 찾기
            const productMatches = {};
            for (const result of results) {
                if (result.productId) {
                    const sim = result.finalSimilarity || result.similarity;
                    if (!productMatches[result.productId] || productMatches[result.productId] < sim) {
                        productMatches[result.productId] = sim;
                    }
                }
            }
            
            // 매칭된 제품 수
            const highMatchProducts = Object.entries(productMatches)
                .filter(([_, sim]) => sim > 0.7)
                .sort((a, b) => b[1] - a[1]);
            
            if (highMatchProducts.length > 0) {
                console.log('🎯 높은 유사도 제품:');
                highMatchProducts.slice(0, 3).forEach(([productId, sim]) => {
                    console.log(`  제품 ${productId}: ${(sim * 100).toFixed(1)}%`);
                });
            }
            
            this.displayResults(results);
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ 검색 실패:', error);
            alert('검색 중 오류가 발생했습니다.');
            this.hideLoading();
        }
    }

    // 결과 표시
    displayResults(results) {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        // 상위 50개만 표시
        const topResults = results.slice(0, 50);
        
        topResults.forEach((result, index) => {
            const finalSim = result.finalSimilarity || result.similarity;
            const percentage = (finalSim * 100).toFixed(1);
            
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // 높은 유사도 강조
            if (finalSim > 0.8) {
                resultItem.classList.add('high-match');
            } else if (finalSim > 0.7) {
                resultItem.classList.add('good-match');
            }
            
            const img = document.createElement('img');
            img.className = 'result-image';
            
            // 이미지 로드 (바이너리 방식)
            this.loadResultImage(result.path, img);
            
            const info = document.createElement('div');
            info.className = 'result-info';
            
            // 제품 ID 표시
            const productBadge = result.productId 
                ? `<span class="product-badge">제품 ${result.productId}</span>` 
                : '';
            
            // 부스팅 여부 표시
            const boostBadge = result.boostedSimilarity 
                ? '<span class="boost-badge">⚡</span>' 
                : '';
            
            info.innerHTML = `
                <div class="result-name">${result.name} ${boostBadge}</div>
                ${productBadge}
                <div class="result-similarity">${percentage}%</div>
                <div class="result-rank">#${index + 1}</div>
            `;
            
            resultItem.appendChild(img);
            resultItem.appendChild(info);
            resultsContainer.appendChild(resultItem);
        });
        
        // 결과 섹션 표시
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }

    // 이미지 로드 (바이너리 방식)
    async loadResultImage(filePath, imgElement) {
        try {
            const imageData = await readBinaryFile(filePath);
            
            const ext = filePath.split('.').pop().toLowerCase();
            const mimeTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'bmp': 'image/bmp'
            };
            
            const mimeType = mimeTypes[ext] || 'image/jpeg';
            const blob = new Blob([imageData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            imgElement.src = url;
            imgElement.onload = () => URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error(`이미지 로드 실패: ${filePath}`, error);
            imgElement.src = '';
            imgElement.alt = '이미지 로드 실패';
        }
    }

    setupEventListeners() {
        console.log('🔧 이벤트 리스너 설정 중...');
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
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

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelect(file);
                    console.log('파일 선택됨:', file.name);
                }
            });
        }

        // 검색 버튼
        const searchButton = document.getElementById('search-button');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                console.log('검색 버튼 클릭');
                if (this.uploadedImage) {
                    this.searchSimilarImagesV11(this.uploadedImage);
                } else {
                    alert('먼저 이미지를 업로드해주세요.');
                }
            });
        }

        // 폴더 선택 버튼
        const folderButton = document.getElementById('select-folder-button');
        if (folderButton) {
            folderButton.addEventListener('click', async () => {
                console.log('폴더 선택 버튼 클릭');
                await this.selectAndIndexFolder();
            });
        }

        // DB 초기화 버튼
        const clearButton = document.getElementById('clear-db-button');
        if (clearButton) {
            clearButton.addEventListener('click', async () => {
                console.log('DB 초기화 버튼 클릭');
                if (confirm('정말 데이터베이스를 초기화하시겠습니까? 모든 인덱싱된 이미지 정보가 삭제됩니다.')) {
                    await this.clearDatabase();
                    alert('데이터베이스가 초기화되었습니다.');
                    console.log('🗑️ 데이터베이스 초기화 완료');
                }
            });
        }

        console.log('✅ 이벤트 리스너 설정 완료');
    }

    // 파일 처리
    handleFileSelect(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.uploadedImage = img;
                    this.displayUploadedImage(e.target.result);
                    console.log('✅ 이미지 업로드 완료:', file.name);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('이미지 파일만 업로드 가능합니다.');
        }
    }

    displayUploadedImage(imageSrc) {
        const previewSection = document.getElementById('preview-section');
        const uploadedImageElement = document.getElementById('uploaded-image');
        
        if (uploadedImageElement && previewSection) {
            uploadedImageElement.src = imageSrc;
            previewSection.style.display = 'block';
        }
    }

    // 폴더 선택 및 인덱싱
    async selectAndIndexFolder() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: '이미지 폴더 선택'
            });

            if (selected) {
                console.log('📁 선택된 폴더:', selected);
                await this.indexImagesInFolder(selected);
            }
        } catch (error) {
            console.error('폴더 선택 오류:', error);
            alert('폴더 선택 중 오류가 발생했습니다.');
        }
    }

    // v11: 개선된 폴더 인덱싱
    async indexImagesInFolder(folderPath) {
        console.log('🔄 v11 인덱싱 시작...');
        this.showLoading('이미지 인덱싱 중... (제품별 그룹화)');
        
        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            
            // 이미지 파일 필터링
            const imageFiles = entries.filter(entry => {
                if (entry.children) return false;
                const ext = entry.name.toLowerCase().substring(entry.name.lastIndexOf('.'));
                return imageExtensions.includes(ext);
            });
            
            console.log(`📸 ${imageFiles.length}개 이미지 발견`);
            
            let successCount = 0;
            let failCount = 0;
            const newDatabase = [];
            
            // 진행상태 표시
            const progressElement = document.getElementById('indexing-progress');
            if (progressElement) {
                progressElement.style.display = 'block';
            }
            
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                
                // 진행률 업데이트
                const progress = ((i + 1) / imageFiles.length * 100).toFixed(1);
                this.showLoading(`인덱싱 중... ${i + 1}/${imageFiles.length} (${progress}%)`);
                
                try {
                    const imageData = await readBinaryFile(file.path);
                    const blob = new Blob([imageData]);
                    const url = URL.createObjectURL(blob);
                    
                    const img = await new Promise((resolve, reject) => {
                        const imgElement = new Image();
                        imgElement.onload = () => resolve(imgElement);
                        imgElement.onerror = reject;
                        imgElement.src = url;
                    });
                    
                    // 특징 추출
                    const features = await this.extractFeatures(img);
                    
                    if (features) {
                        const productId = this.extractProductId(file.name);
                        
                        newDatabase.push({
                            name: file.name,
                            path: file.path,
                            features: features,
                            productId: productId,
                            indexed: new Date().toISOString()
                        });
                        
                        successCount++;
                        console.log(`✅ ${file.name} (제품: ${productId})`);
                    } else {
                        failCount++;
                        console.error(`❌ 특징 추출 실패: ${file.name}`);
                    }
                    
                    URL.revokeObjectURL(url);
                    
                } catch (error) {
                    failCount++;
                    console.error(`❌ 처리 실패: ${file.name}`, error);
                }
                
                // 메모리 관리
                if (i % 10 === 0) {
                    await tf.nextFrame();
                    if (typeof gc !== 'undefined') {
                        gc();
                    }
                }
            }
            
            // 데이터베이스 업데이트
            this.imageDatabase = newDatabase;
            
            // 제품별 그룹화
            this.groupByProduct();
            
            // 저장
            await this.saveDatabase();
            
            console.log(`✅ v11 인덱싱 완료: ${successCount}개 성공, ${failCount}개 실패`);
            console.log(`📦 제품 그룹: ${Object.keys(this.productDatabase).length}개`);
            
            if (progressElement) {
                progressElement.style.display = 'none';
            }
            
            this.hideLoading();
            
            alert(`인덱싱 완료!\n✅ 성공: ${successCount}개\n📦 제품: ${Object.keys(this.productDatabase).length}개\n❌ 실패: ${failCount}개`);
            
        } catch (error) {
            console.error('인덱싱 실패:', error);
            alert('인덱싱 중 오류가 발생했습니다.');
            this.hideLoading();
        }
    }

    // 데이터베이스 저장
    async saveDatabase() {
        try {
            await this.storage.setItem('imageDatabase', this.imageDatabase);
            await this.storage.setItem('productDatabase', this.productDatabase);
            await this.storage.setItem('version', this.version);
            await this.storage.setItem('indexDate', new Date().toISOString());
            console.log('💾 데이터베이스 저장 완료 (v11)');
        } catch (error) {
            console.error('데이터베이스 저장 실패:', error);
        }
    }

    // 데이터베이스 로드
    async loadDatabase() {
        try {
            const savedVersion = await this.storage.getItem('version');
            const imageDatabase = await this.storage.getItem('imageDatabase');
            const productDatabase = await this.storage.getItem('productDatabase');
            
            if (imageDatabase && savedVersion === this.version) {
                this.imageDatabase = imageDatabase;
                this.productDatabase = productDatabase || {};
                
                // 제품 데이터베이스가 없으면 재생성
                if (Object.keys(this.productDatabase).length === 0 && this.imageDatabase.length > 0) {
                    this.groupByProduct();
                }
                
                console.log(`📂 ${this.imageDatabase.length}개 이미지 로드됨`);
                console.log(`📦 ${Object.keys(this.productDatabase).length}개 제품 그룹 로드됨`);
            } else if (savedVersion !== this.version) {
                console.log('🔄 버전 변경 감지, 재인덱싱 필요');
                await this.clearDatabase();
            }
        } catch (error) {
            console.error('데이터베이스 로드 실패:', error);
        }
    }

    // 데이터베이스 초기화
    async clearDatabase() {
        await this.storage.clear();
        this.imageDatabase = [];
        this.productDatabase = {};
        console.log('🗑️ 데이터베이스 초기화 완료');
    }

    // 모드 전환
    switchMode(mode) {
        this.currentMode = mode;
        
        // 섹션 전환
        document.querySelectorAll('.mode-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const targetSection = document.getElementById(`${mode}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // 버튼 스타일 업데이트
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // 로딩 표시
    showLoading(message = '처리 중...') {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.textContent = message;
            loadingElement.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // 메모리 사용량 체크
    getMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize / 1048576;
            const total = performance.memory.totalJSHeapSize / 1048576;
            return {
                used: used.toFixed(2),
                total: total.toFixed(2),
                percent: ((used / total) * 100).toFixed(1)
            };
        }
        return null;
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            version: this.version,
            model: this.modelLoaded ? 'MobileNet v2' : 'Not loaded',
            backend: tf.getBackend(),
            imagesIndexed: this.imageDatabase.length,
            products: Object.keys(this.productDatabase).length,
            memory: this.getMemoryUsage()
        };
    }

    // 제품 검색 헬퍼
    findProduct(productId) {
        return this.productDatabase[productId] || null;
    }

    // 제품의 모든 이미지 가져오기
    getProductImages(productId) {
        const product = this.findProduct(productId);
        return product ? product.images : [];
    }

    // 통계 정보
    getStatistics() {
        const stats = {
            totalImages: this.imageDatabase.length,
            totalProducts: Object.keys(this.productDatabase).length,
            productsWithMultipleImages: 0,
            averageImagesPerProduct: 0,
            maxImagesInProduct: 0,
            minImagesInProduct: Infinity
        };
        
        for (const productId in this.productDatabase) {
            const count = this.productDatabase[productId].images.length;
            if (count > 1) stats.productsWithMultipleImages++;
            if (count > stats.maxImagesInProduct) stats.maxImagesInProduct = count;
            if (count < stats.minImagesInProduct) stats.minImagesInProduct = count;
        }
        
        stats.averageImagesPerProduct = 
            stats.totalProducts > 0 
            ? (stats.totalImages / stats.totalProducts).toFixed(1) 
            : 0;
        
        return stats;
    }
}

// DOM 로드 완료시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 로드 완료, 앱 초기화 시작...');
    
    // 전역 인스턴스 생성
    window.fashionApp = new ProductAwareFashionSearch();
    
    // 콘솔 도구 등록
    window.fashionApp.version = () => window.fashionApp.getDebugInfo();
    window.fashionApp.clearDB = () => window.fashionApp.clearDatabase();
    window.fashionApp.memory = () => window.fashionApp.getMemoryUsage();
    window.fashionApp.debug = () => window.fashionApp.getDebugInfo();
    window.fashionApp.stats = () => window.fashionApp.getStatistics();
    window.fashionApp.findProduct = (id) => window.fashionApp.findProduct(id);
    window.fashionApp.reloadModel = () => window.fashionApp.loadModel();
    
    console.log('🎯 Fashion Search v11.0 초기화 완료!');
    console.log('✨ v11 핵심 기능:');
    console.log('  ✅ 제품별 그룹화 (Product ID 추출)');
    console.log('  ✅ Feature Averaging (제품 평균 특징)');
    console.log('  ✅ Similarity Boosting (같은 제품 부스팅)');
    console.log('  ✅ 개별 + 그룹 하이브리드 검색');
    console.log('  ✅ 제품 통계 및 분석');
    console.log('콘솔 명령어:');
    console.log('  fashionApp.version() - 버전 정보');
    console.log('  fashionApp.stats() - 통계 정보');
    console.log('  fashionApp.findProduct("80159") - 제품 검색');
    console.log('  fashionApp.clearDB() - DB 초기화');
    console.log('  fashionApp.debug() - 디버그 정보');
});

// CSS 스타일 추가를 위한 동적 스타일 삽입
const style = document.createElement('style');
style.textContent = `
    .high-match {
        border: 2px solid #4CAF50 !important;
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
    }
    
    .good-match {
        border: 2px solid #FFC107 !important;
    }
    
    .product-badge {
        display: inline-block;
        padding: 2px 8px;
        background: #2196F3;
        color: white;
        border-radius: 4px;
        font-size: 11px;
        margin-top: 4px;
    }
    
    .boost-badge {
        display: inline-block;
        margin-left: 4px;
        color: #FF9800;
        font-weight: bold;
    }
    
    #indexing-progress {
        display: none;
        padding: 10px;
        background: #f0f0f0;
        border-radius: 4px;
        margin-top: 10px;
        text-align: center;
    }
`;
document.head.appendChild(style);