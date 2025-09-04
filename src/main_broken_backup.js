import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v11.2 - Windows 호환성 수정 버전
class FashionSearchFixed {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.productDatabase = {};
        this.version = '11.2.0';
        this.model = null;
        this.modelLoaded = false;
        this.debugMode = true;
        
        // LocalForage 설정
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV11'
        });
        
        console.log(`🚀 Fashion Search v${this.version} - Windows 호환성 수정`);
        console.log('✨ 수정사항: HTML/JS ID 일치, 이벤트 리스너 수정');
        this.init();
    }

    async init() {
        console.log('🔧 시스템 초기화 중...');
        
        try {
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
        } catch (error) {
            console.error('⚠️ WebGL 초기화 실패, CPU 모드로 전환:', error);
            await tf.setBackend('cpu');
        }
        
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

        // 파일 업로드 - HTML ID와 정확히 일치
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        if (uploadArea && fileInput) {
            console.log('📎 업로드 영역 발견');
            
            // 클릭 이벤트
            uploadArea.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('업로드 영역 클릭');
                fileInput.click();
            });
            
            // 드래그 오버
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('dragover');
                console.log('드래그 오버');
            });
            
            // 드래그 리브
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
            });
            
            // 드롭
            uploadArea.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                console.log('파일 드롭:', files.length);
                
                if (files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                        console.log('이미지 파일 감지:', file.name);
                        await this.handleImageUpload(file);
                    } else {
                        alert('이미지 파일만 업로드 가능합니다.');
                    }
                }
            });

            // 파일 선택
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    console.log('파일 선택됨:', file.name);
                    await this.handleImageUpload(file);
                }
            });
        } else {
            console.error('❌ 업로드 영역을 찾을 수 없음');
        }

        // 검색 버튼
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                console.log('검색 버튼 클릭');
                if (this.uploadedImage) {
                    await this.searchSimilarImages();
                } else {
                    alert('먼저 이미지를 업로드해주세요.');
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

        // DB 초기화 버튼 - HTML ID와 일치
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
        
        // 버튼 활성화 상태
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // 모드 콘텐츠 전환
        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetMode = document.getElementById(`${mode}-mode`);
        if (targetMode) {
            targetMode.classList.add('active');
        }
    }

    async handleImageUpload(file) {
        console.log('📸 이미지 업로드 시작:', file.name);
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            // 이미지 미리보기 표시 - HTML ID와 일치
            const imgElement = document.getElementById('uploaded-image');
            const previewSection = document.getElementById('preview-section');
            
            if (imgElement && previewSection) {
                imgElement.src = e.target.result;
                imgElement.style.display = 'block';
                previewSection.style.display = 'block';
                console.log('✅ 이미지 미리보기 표시');
            } else {
                console.error('❌ 미리보기 요소를 찾을 수 없음');
            }
            
            // 이미지를 tensor로 변환
            const img = new Image();
            img.onload = async () => {
                try {
                    this.uploadedImage = {
                        file: file,
                        tensor: await this.preprocessImage(img),
                        element: img
                    };
                    
                    // 검색 버튼 활성화
                    const searchBtn = document.getElementById('search-btn');
                    if (searchBtn) {
                        searchBtn.disabled = false;
                        searchBtn.classList.add('enabled');
                    }
                    
                    console.log(`✅ 이미지 업로드 완료: ${file.name}`);
                } catch (error) {
                    console.error('❌ 이미지 처리 실패:', error);
                    alert('이미지 처리 중 오류가 발생했습니다.');
                }
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = (error) => {
            console.error('❌ 파일 읽기 실패:', error);
            alert('파일을 읽을 수 없습니다.');
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

    extractProductId(filename) {
        // 파일명에서 확장자 제거
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // 다양한 패턴으로 제품 ID 추출
        const patterns = [
            /^(\d{5})(?:[\s_\-]|$)/,
            /^(\d{4,6})(?:[\s_\-]|$)/,
            /[\s_\-](\d{5})(?:[\s_\-]|$)/,
            /(\d{5})/,
            /^(\d+)/
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
        
        return null;
    }

    async searchSimilarImages() {
        if (!this.uploadedImage || !this.modelLoaded) {
            alert('이미지를 업로드하고 모델이 로드될 때까지 기다려주세요.');
            return;
        }

        console.log('🔍 v11.2 검색 시작...');
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
            
            for (const img of this.imageDatabase) {
                const similarity = this.calculateCosineSimilarity(queryVector, img.features);
                
                results.push({
                    ...img,
                    similarity: similarity
                });
            }

            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);

            console.log(`✅ 검색 완료: ${results.length}개 결과`);
            
            if (this.debugMode) {
                console.log('📊 상위 5개 결과:');
                results.slice(0, 5).forEach((result, index) => {
                    console.log(`  ${index + 1}. ${result.name}: ${(result.similarity * 100).toFixed(1)}%`);
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
        // HTML ID와 일치
        const resultsContainer = document.getElementById('search-results');
        const resultsSection = document.getElementById('results-section');
        
        if (!resultsContainer) {
            console.error('❌ 검색 결과 컨테이너를 찾을 수 없음');
            return;
        }

        resultsContainer.innerHTML = '';

        // 상위 20개만 표시
        const topResults = results.slice(0, 20);

        for (const result of topResults) {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // 유사도에 따른 스타일
            if (result.similarity > 0.80) {
                resultItem.classList.add('high-match');
            } else if (result.similarity > 0.70) {
                resultItem.classList.add('medium-match');
            }
            
            // 이미지 로드
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData], { 
                    type: this.getMimeType(result.path) 
                });
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}">
                    <div class="result-info">
                        <div class="result-name">${result.name}</div>
                        <div class="result-similarity">${(result.similarity * 100).toFixed(1)}%</div>
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
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
        
        console.log(`📋 ${topResults.length}개 결과 표시 완료`);
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
                    
                    // 메모리 정리
                    tensor.dispose();
                    features.dispose();
                    URL.revokeObjectURL(url);
                    
                    processed++;
                    
                    // 진행상황 업데이트
                    if (processed % 10 === 0) {
                        updateProgress();
                        await tf.nextFrame();
                    }
                    
                } catch (error) {
                    console.error(`이미지 처리 실패: ${imageInfo.name}`, error);
                    processed++;
                }
            }

            // LocalForage에 저장
            await this.saveDatabase();
            
            console.log(`✅ v11.2 인덱싱 완료: ${this.imageDatabase.length}개 이미지`);
            
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
            console.log('💾 데이터베이스 저장 완료 (v11.2)');
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
                this.displayStats();
            } else if (version !== this.version) {
                console.log('⚠️ 버전 불일치. DB 재인덱싱이 필요합니다.');
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
        const statsText = `📊 데이터베이스: ${totalImages}개 이미지`;
        this.updateStats(statsText);
        console.log(statsText);
    }

    updateStats(message) {
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.textContent = message;
        }
    }

    showLoading(message) {
        // HTML ID와 일치
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
            const textElement = loadingElement.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message || '처리 중...';
            }
        }
    }

    updateLoadingMessage(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            const textElement = loadingElement.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message;
            }
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
        return `Fashion Search v${this.version} - Windows 호환성 수정`;
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
            version: this.version
        };
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
    
    // CSS 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .upload-area.dragover {
            background-color: #e3f2fd !important;
            border-color: #2196F3 !important;
        }
        .result-item.high-match {
            border: 3px solid #4CAF50 !important;
        }
        .result-item.medium-match {
            border: 3px solid #FFC107 !important;
        }
        .search-btn.enabled {
            background-color: #2196F3 !important;
            cursor: pointer !important;
        }
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .mode-content {
            display: none;
        }
        .mode-content.active {
            display: block;
        }
    `;
    document.head.appendChild(style);
    
    new FashionSearchFixed();
    
    console.log('🎯 Fashion Search v11.2 초기화 완료!');
    console.log('💡 수정사항:');
    console.log('  ✅ HTML/JavaScript ID 완전 일치');
    console.log('  ✅ 이벤트 리스너 수정');
    console.log('  ✅ Windows 호환성 개선');
    console.log('  ✅ 드래그 앤 드롭 수정');
    
    console.log('콘솔 명령어:');
    console.log('  fashionApp.version() - 버전 정보');
    console.log('  fashionApp.stats() - 통계 정보');
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
