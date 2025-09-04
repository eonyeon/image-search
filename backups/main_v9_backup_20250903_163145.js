import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v10.0 - 최신 딥러닝 기반 (브랜드 감지 제거)
class ModernFashionSearch {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '10.0.0';
        this.model = null;
        this.modelLoaded = false;
        
        // LocalForage 설정
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV10'
        });
        
        console.log(`🚀 Modern Fashion Search v${this.version} - 딥러닝 기반 고정밀 검색`);
        this.init();
    }

    async init() {
        console.log('🔧 시스템 초기화 중...');
        
        // TensorFlow.js 백엔드 설정 (WebGL 가속)
        await tf.setBackend('webgl');
        await tf.ready();
        
        // WebGL 최적화 설정
        tf.env().set('WEBGL_VERSION', 2);
        tf.env().set('WEBGL_PACK_DEPTHWISECONV', true);
        tf.env().set('WEBGL_CPU_FORWARD', false);
        tf.env().set('WEBGL_PACK_BINARY_OPERATIONS', true);
        tf.env().set('WEBGL_PACK_UNARY_OPERATIONS', true);
        
        console.log('✅ TensorFlow.js 백엔드 준비 완료:', tf.getBackend());
        
        // 모델 로드
        await this.loadModel();
        
        // 데이터베이스 로드
        await this.loadDatabase();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        console.log('✅ 초기화 완료!');
    }

    async loadModel() {
        try {
            this.showLoading('딥러닝 모델 로드 중... (첫 실행시 다운로드 필요)');
            
            // MobileNet v2 로드 (v3가 없는 경우 v2 사용)
            // version 2, alpha 1.0 = 최고 정확도
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
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    this.handleImageUpload(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    console.log('파일 선택됨:', file.name);
                    this.handleImageUpload(file);
                }
            });
        }

        // 검색 버튼
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                console.log('검색 버튼 클릭');
                this.searchSimilarImages();
            });
        }

        // 폴더 선택 버튼
        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                console.log('폴더 선택 버튼 클릭');
                this.selectFolder();
            });
        }

        // 데이터베이스 초기화 버튼
        const clearDbBtn = document.getElementById('clear-database-btn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', async () => {
                console.log('DB 초기화 버튼 클릭');
                if (confirm('모든 인덱싱된 데이터가 삭제됩니다. 계속하시겠습니까?')) {
                    this.imageDatabase = [];
                    await this.storage.clear();
                    alert('데이터베이스가 초기화되었습니다.');
                    console.log('🗑️ 데이터베이스 초기화 완료');
                }
            });
        }
        
        console.log('✅ 이벤트 리스너 설정 완료');
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetMode = document.getElementById(`${mode}-mode`);
        if (targetMode) {
            targetMode.classList.add('active');
        }
    }

    async handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                this.uploadedImage = {
                    file: file,
                    dataUrl: e.target.result,
                    width: img.width,
                    height: img.height
                };

                const previewImage = document.getElementById('preview-image');
                const previewSection = document.getElementById('preview-section');
                const resultsSection = document.getElementById('results-section');
                
                if (previewImage) previewImage.src = e.target.result;
                if (previewSection) previewSection.style.display = 'block';
                if (resultsSection) resultsSection.style.display = 'none';
                
                console.log('✅ 이미지 업로드 완료:', file.name);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 이미지 전처리 (ImageNet 표준)
    preprocessImage(imageElement) {
        return tf.tidy(() => {
            // 이미지를 텐서로 변환
            let tensor = tf.browser.fromPixels(imageElement);
            
            // 중앙 크롭을 위한 크기 계산
            const [height, width] = tensor.shape.slice(0, 2);
            const shorter = Math.min(height, width);
            const startHeight = Math.floor((height - shorter) / 2);
            const startWidth = Math.floor((width - shorter) / 2);
            
            // 중앙 크롭
            const cropped = tf.slice(tensor, [startHeight, startWidth, 0], [shorter, shorter, 3]);
            
            // 224x224로 리사이즈
            const resized = tf.image.resizeBilinear(cropped, [224, 224]);
            
            // 정규화 (0-1 범위)
            const normalized = resized.toFloat().div(tf.scalar(255.0));
            
            // ImageNet 평균과 표준편차로 정규화
            const mean = tf.tensor([0.485, 0.456, 0.406]);
            const std = tf.tensor([0.229, 0.224, 0.225]);
            const standardized = normalized.sub(mean).div(std);
            
            // 배치 차원 추가
            return standardized.expandDims(0);
        });
    }

    // MobileNet 특징 추출
    async extractFeatures(imageElement) {
        if (!this.modelLoaded) {
            console.error('모델이 아직 로드되지 않았습니다.');
            return null;
        }

        return tf.tidy(() => {
            try {
                // MobileNet은 자체 전처리를 하므로 원본 이미지 사용
                // infer 메서드는 embedding을 반환 (1280차원 벡터)
                const features = this.model.infer(imageElement, true); // true = embedding 반환
                
                // L2 정규화 (코사인 유사도를 위해)
                const norm = tf.norm(features, 2, 1, true);
                const normalized = features.div(norm);
                
                return normalized;
            } catch (error) {
                console.error('특징 추출 실패:', error);
                return null;
            }
        });
    }

    // 다중 스케일 특징 추출 (선택적 - 더 높은 정확도)
    async extractMultiScaleFeatures(imageElement) {
        const scales = [224, 299, 384];  // 여러 크기로 테스트
        const features = [];
        const weights = [0.3, 0.35, 0.35];  // 각 스케일의 가중치
        
        for (let i = 0; i < scales.length; i++) {
            const scale = scales[i];
            const weight = weights[i];
            
            // 캔버스로 리사이즈
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = scale;
            canvas.height = scale;
            
            // 중앙 크롭하여 그리기
            const size = Math.min(imageElement.width, imageElement.height);
            const x = (imageElement.width - size) / 2;
            const y = (imageElement.height - size) / 2;
            ctx.drawImage(imageElement, x, y, size, size, 0, 0, scale, scale);
            
            // 특징 추출
            const scaleFeatures = await this.extractFeatures(canvas);
            if (scaleFeatures) {
                const featArray = await scaleFeatures.data();
                
                if (features.length === 0) {
                    // 첫 번째 스케일
                    for (let j = 0; j < featArray.length; j++) {
                        features[j] = featArray[j] * weight;
                    }
                } else {
                    // 가중 평균
                    for (let j = 0; j < featArray.length; j++) {
                        features[j] += featArray[j] * weight;
                    }
                }
                
                scaleFeatures.dispose();
            }
        }
        
        // 최종 L2 정규화
        const norm = Math.sqrt(features.reduce((sum, val) => sum + val * val, 0));
        return features.map(val => val / norm);
    }

    // 코사인 유사도 계산
    calculateCosineSimilarity(features1, features2) {
        if (!features1 || !features2 || features1.length !== features2.length) {
            return 0;
        }
        
        // 이미 L2 정규화된 벡터들의 내적 = 코사인 유사도
        let dotProduct = 0;
        for (let i = 0; i < features1.length; i++) {
            dotProduct += features1[i] * features2[i];
        }
        
        // 코사인 유사도는 -1에서 1 사이, 0에서 1로 정규화
        return (dotProduct + 1) / 2;
    }

    // 유클리드 거리 (선택적)
    calculateEuclideanDistance(features1, features2) {
        if (!features1 || !features2 || features1.length !== features2.length) {
            return Infinity;
        }
        
        let sum = 0;
        for (let i = 0; i < features1.length; i++) {
            const diff = features1[i] - features2[i];
            sum += diff * diff;
        }
        
        return Math.sqrt(sum);
    }

    async searchSimilarImages() {
        if (!this.uploadedImage) {
            alert('먼저 이미지를 업로드해주세요.');
            return;
        }

        if (this.imageDatabase.length === 0) {
            alert('인덱싱된 이미지가 없습니다. 먼저 이미지를 인덱싱해주세요.');
            return;
        }

        if (!this.modelLoaded) {
            alert('모델이 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        this.showLoading('딥러닝 모델로 이미지 분석 중...');
        console.log('🔍 v10.0 딥러닝 기반 검색 시작...');

        try {
            const img = document.getElementById('preview-image');
            
            // 특징 추출 (다중 스케일 사용 가능)
            const useMultiScale = false;  // 필요시 true로 변경
            let queryFeatures;
            
            if (useMultiScale) {
                queryFeatures = await this.extractMultiScaleFeatures(img);
            } else {
                const features = await this.extractFeatures(img);
                queryFeatures = await features.data();
                features.dispose();
            }
            
            console.log('📊 특징 벡터 추출 완료:', queryFeatures.length, '차원');

            // 모든 이미지와 유사도 계산
            const results = this.imageDatabase.map((item) => {
                const similarity = this.calculateCosineSimilarity(queryFeatures, item.features);
                return {
                    ...item,
                    similarity: similarity
                };
            });

            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 자기 자신 제외 (유사도 0.98 이상)
            const filteredResults = results.filter(r => r.similarity < 0.98);
            
            // 상위 30개만 표시
            this.displayResults(filteredResults.slice(0, 30));
            
            console.log(`✅ 검색 완료: ${filteredResults.length}개 결과`);
            
            // 상위 5개 결과 로그
            console.log('📊 상위 5개 결과:');
            filteredResults.slice(0, 5).forEach((r, i) => {
                console.log(`  ${i+1}. ${r.name}: ${(r.similarity * 100).toFixed(1)}%`);
            });

        } catch (error) {
            console.error('❌ 검색 중 오류:', error);
            alert('검색 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(results) {
        const resultsGrid = document.getElementById('results-grid');
        const resultCount = document.getElementById('result-count');
        
        if (resultCount) resultCount.textContent = `(${results.length}개)`;
        if (!resultsGrid) return;
        
        resultsGrid.innerHTML = '';

        results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const similarity = Math.round(result.similarity * 100);
            
            const img = document.createElement('img');
            img.className = 'result-image';
            img.alt = result.name;
            img.loading = 'lazy';
            
            this.loadResultImage(img, result.path, result.name);
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'result-info';
            
            const displayName = result.name.length > 30 
                ? result.name.substring(0, 27) + '...' 
                : result.name;
            
            // 유사도에 따른 색상 (높을수록 녹색)
            const color = similarity >= 80 ? '#10b981' : 
                         similarity >= 60 ? '#f59e0b' : '#ef4444';
            
            infoDiv.innerHTML = `
                <div class="result-filename" title="${result.name}">${displayName}</div>
                <div class="result-similarity">
                    유사도: <strong style="color: ${color}">${similarity}%</strong>
                </div>
            `;
            
            resultItem.appendChild(img);
            resultItem.appendChild(infoDiv);
            
            // 클릭시 파일 위치 열기
            resultItem.addEventListener('click', async () => {
                try {
                    await invoke('open_file_location', { path: result.path });
                } catch (error) {
                    console.error('파일 위치 열기 실패:', error);
                }
            });

            resultsGrid.appendChild(resultItem);
        });

        const resultsSection = document.getElementById('results-section');
        if (resultsSection) resultsSection.style.display = 'block';
    }

    async loadResultImage(imgElement, filePath, fileName) {
        try {
            let normalizedPath = filePath.replace(/\\/g, '/');
            const cleanFileName = fileName.trim();
            
            if (cleanFileName.includes(' ')) {
                const dirPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
                normalizedPath = `${dirPath}/${cleanFileName}`;
            }
            
            const assetUrl = convertFileSrc(normalizedPath);
            imgElement.src = assetUrl;
            
            imgElement.onerror = async () => {
                try {
                    const imageData = await readBinaryFile(filePath);
                    const ext = fileName.split('.').pop().toLowerCase();
                    const mimeTypes = {
                        'jpg': 'image/jpeg',
                        'jpeg': 'image/jpeg',
                        'png': 'image/png',
                        'gif': 'image/gif',
                        'webp': 'image/webp'
                    };
                    
                    const blob = new Blob([imageData], { type: mimeTypes[ext] || 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    
                    imgElement.src = url;
                    
                    imgElement.onload = () => {
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    };
                } catch (error) {
                    console.error(`이미지 읽기 실패: ${filePath}`, error);
                    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEzcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+로드 실패</text></svg>';
                }
            };
        } catch (error) {
            console.error(`이미지 처리 오류: ${filePath}`, error);
        }
    }

    async selectFolder() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: '이미지 폴더 선택'
            });

            if (selected) {
                await this.indexFolder(selected);
            }
        } catch (error) {
            console.error('폴더 선택 오류:', error);
        }
    }

    async indexFolder(folderPath) {
        if (!this.modelLoaded) {
            alert('모델이 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        this.showLoading('딥러닝 모델로 이미지 분석 중...');

        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageFiles = entries.filter(entry => {
                if (!entry.name) return false;
                const ext = entry.name.toLowerCase().split('.').pop();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
            });

            const folderPathEl = document.getElementById('folder-path');
            const imageCountEl = document.getElementById('image-count');
            const folderInfoEl = document.getElementById('folder-info');
            
            if (folderPathEl) folderPathEl.textContent = folderPath;
            if (imageCountEl) imageCountEl.textContent = imageFiles.length;
            if (folderInfoEl) folderInfoEl.style.display = 'block';

            if (imageFiles.length === 0) {
                alert('선택한 폴더에 이미지가 없습니다.');
                this.hideLoading();
                return;
            }

            const progressEl = document.getElementById('indexing-progress');
            const resultsEl = document.getElementById('index-results');
            
            if (progressEl) progressEl.style.display = 'block';
            if (resultsEl) resultsEl.style.display = 'none';

            const newDatabase = [];
            const totalImages = imageFiles.length;
            let processedCount = 0;
            let errorCount = 0;

            const batchSize = 5;  // 메모리 관리를 위해 배치 크기 제한
            
            for (let i = 0; i < imageFiles.length; i += batchSize) {
                const batch = imageFiles.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (file) => {
                    try {
                        const imageData = await readBinaryFile(file.path);
                        const blob = new Blob([imageData]);
                        const imageUrl = URL.createObjectURL(blob);

                        const img = new Image();
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            img.src = imageUrl;
                        });

                        // 특징 추출
                        const features = await this.extractFeatures(img);
                        const featuresArray = await features.data();
                        features.dispose();
                        
                        newDatabase.push({
                            path: file.path,
                            name: file.name || 'Unknown',
                            features: featuresArray
                        });

                        URL.revokeObjectURL(imageUrl);
                        processedCount++;

                    } catch (error) {
                        console.error(`이미지 처리 실패: ${file.name}`, error);
                        errorCount++;
                    }
                }));

                const progress = Math.round((Math.min(i + batchSize, totalImages) / totalImages) * 100);
                const fillEl = document.getElementById('progress-fill');
                const textEl = document.getElementById('progress-text');
                
                if (fillEl) fillEl.style.width = `${progress}%`;
                if (textEl) textEl.textContent = `${Math.min(i + batchSize, totalImages)} / ${totalImages}`;

                // 메모리 정리
                if (i % 20 === 0) {
                    await tf.nextFrame();
                }
            }

            this.imageDatabase = newDatabase;
            await this.saveDatabase();

            const fillEl = document.getElementById('progress-fill');
            const textEl = document.getElementById('progress-text');
            
            if (fillEl) fillEl.style.width = '100%';
            if (textEl) textEl.textContent = `${totalImages} / ${totalImages}`;
            
            setTimeout(() => {
                if (progressEl) progressEl.style.display = 'none';
                if (resultsEl) resultsEl.style.display = 'block';
                
                const countEl = document.getElementById('indexed-count');
                if (countEl) countEl.textContent = processedCount;
                
                if (errorCount > 0) {
                    alert(`✅ 인덱싱 완료!\n성공: ${processedCount}개\n실패: ${errorCount}개`);
                } else {
                    console.log(`✅ v10.0 딥러닝 인덱싱 완료: ${processedCount}개 성공`);
                }
            }, 500);

        } catch (error) {
            console.error('인덱싱 오류:', error);
            alert('인덱싱 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    async saveDatabase() {
        try {
            const dbData = {
                version: 10,
                timestamp: Date.now(),
                appVersion: this.version,
                modelType: 'MobileNetV2',
                featureDimension: 1280,
                data: this.imageDatabase
            };
            
            await this.storage.setItem('fashionDatabase', dbData);
            console.log(`💾 데이터베이스 저장 완료 (v${dbData.version})`);
        } catch (error) {
            console.error('❌ 데이터베이스 저장 실패:', error);
        }
    }

    async loadDatabase() {
        try {
            const stored = await this.storage.getItem('fashionDatabase');
            
            if (stored) {
                if (stored.version === 10 && stored.modelType === 'MobileNetV2') {
                    this.imageDatabase = stored.data || [];
                    console.log(`📂 ${this.imageDatabase.length}개의 이미지 로드됨`);
                } else {
                    console.log('⚠️ 이전 버전 데이터베이스. 재인덱싱 필요');
                    this.imageDatabase = [];
                    await this.storage.clear();
                }
            }
        } catch (error) {
            console.error('❌ 데이터베이스 로드 실패:', error);
            this.imageDatabase = [];
        }
    }

    showLoading(text = '처리 중...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) loadingText.textContent = text;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // 메모리 사용량 모니터링
    getMemoryInfo() {
        const numTensors = tf.memory().numTensors;
        const numBytes = tf.memory().numBytes;
        const numMB = (numBytes / 1024 / 1024).toFixed(2);
        
        console.log(`📊 메모리 사용량: ${numMB}MB, 텐서 수: ${numTensors}`);
        return { numTensors, numMB };
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 로드 완료, 앱 초기화 시작...');
    
    const app = new ModernFashionSearch();
    
    // 전역 접근을 위한 콘솔 명령어
    window.fashionApp = {
        version: () => {
            console.log(`버전: v${app.version}`);
            console.log(`모델: MobileNetV2`);
            console.log(`특징 차원: 1280`);
            console.log(`DB 크기: ${app.imageDatabase.length} 개`);
            console.log(`모델 로드 상태: ${app.modelLoaded ? '✅' : '❌'}`);
        },
        clearDB: async () => {
            app.imageDatabase = [];
            await app.storage.clear();
            console.log('✅ DB 초기화 완료');
        },
        testFeatures: async () => {
            if (app.uploadedImage) {
                const img = document.getElementById('preview-image');
                const features = await app.extractFeatures(img);
                const featArray = await features.data();
                console.log('특징 벡터:', featArray.slice(0, 10), '...');
                console.log('벡터 차원:', featArray.length);
                console.log('L2 노름:', Math.sqrt(featArray.reduce((sum, val) => sum + val * val, 0)));
                features.dispose();
            } else {
                console.log('먼저 이미지를 업로드하세요');
            }
        },
        memory: () => {
            return app.getMemoryInfo();
        },
        reloadModel: async () => {
            console.log('모델 재로드 중...');
            await app.loadModel();
        }
    };
    
    console.log('%c🎯 Modern Fashion Search v10.0 초기화 완료!', 'color: #10b981; font-size: 16px; font-weight: bold;');
    console.log('%c딥러닝 기반 고정밀 검색 시스템', 'color: #666; font-style: italic;');
    console.log('✨ v10.0 핵심 특징:');
    console.log('  ✅ MobileNetV2 딥러닝 모델');
    console.log('  ✅ 1280차원 특징 벡터');
    console.log('  ✅ 코사인 유사도 기반 매칭');
    console.log('  ✅ ImageNet 표준 전처리');
    console.log('  ✅ WebGL GPU 가속');
    console.log('콘솔 명령어:');
    console.log('  fashionApp.version() - 버전 정보');
    console.log('  fashionApp.clearDB() - DB 초기화');
    console.log('  fashionApp.testFeatures() - 특징 추출 테스트');
    console.log('  fashionApp.memory() - 메모리 사용량');
    console.log('  fashionApp.reloadModel() - 모델 재로드');
});