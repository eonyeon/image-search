import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v10.3 - 정확도 복구 및 개선
class ModernFashionSearch {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '10.3.0';
        this.model = null;
        this.modelLoaded = false;
        
        // LocalForage 설정
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV10'
        });
        
        console.log(`🚀 Modern Fashion Search v${this.version} - 정확도 복구 버전`);
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

    // MobileNet 특징 추출 - v10.0 방식으로 복구
    async extractFeatures(imageElement) {
        if (!this.modelLoaded) {
            console.error('모델이 아직 로드되지 않았습니다.');
            return null;
        }

        return tf.tidy(() => {
            try {
                // MobileNet은 자체 전처리를 하므로 원본 이미지 사용
                const features = this.model.infer(imageElement, true); // true = embedding 반환
                
                // L2 정규화 (코사인 유사도를 위해)
                const norm = tf.norm(features, 2, 1, true);
                const normalized = features.div(norm.add(1e-7)); // 0 나누기 방지
                
                return normalized;
            } catch (error) {
                console.error('특징 추출 실패:', error);
                return null;
            }
        });
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
        
        // 클립핑으로 수치 오류 방지
        dotProduct = Math.max(-1, Math.min(1, dotProduct));
        
        // 0에서 1로 정규화
        return (dotProduct + 1) / 2;
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
        console.log('🔍 v10.3 딥러닝 기반 검색 시작...');

        try {
            const img = document.getElementById('preview-image');
            
            // 단일 스케일 특징 추출 (v10.0 방식)
            const features = await this.extractFeatures(img);
            const queryFeatures = await features.data();
            features.dispose();
            
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
            
            // 상위 30개 표시 (자기 제외 로직 제거)
            const topResults = results.slice(0, 30);
            
            this.displayResults(topResults);
            
            console.log(`✅ 검색 완료: ${topResults.length}개 결과`);
            
            // 상위 10개 결과 로그
            console.log('📊 상위 10개 결과:');
            topResults.slice(0, 10).forEach((r, i) => {
                console.log(`  ${i+1}. ${r.name}: ${(r.similarity * 100).toFixed(1)}%`);
            });
            
            // 평균 유사도 계산
            if (topResults.length > 0) {
                const avgSimilarity = topResults.slice(0, 10).reduce((sum, r) => sum + r.similarity, 0) / Math.min(10, topResults.length);
                console.log(`📈 상위 10개 평균 유사도: ${(avgSimilarity * 100).toFixed(1)}%`);
            }

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
            
            // 이미지 로드
            this.loadResultImage(img, result.path, result.name);
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'result-info';
            
            const displayName = result.name.length > 30 
                ? result.name.substring(0, 27) + '...' 
                : result.name;
            
            // 유사도에 따른 색상
            const color = similarity >= 80 ? '#10b981' : 
                         similarity >= 70 ? '#f59e0b' : 
                         similarity >= 60 ? '#3b82f6' : '#ef4444';
            
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

    // 이미지 로드 함수
    async loadResultImage(imgElement, filePath, fileName) {
        try {
            // 바로 바이너리 읽기로 시작
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
            
            // 메모리 정리
            imgElement.onload = () => {
                setTimeout(() => {
                    try {
                        URL.revokeObjectURL(url);
                    } catch (e) {
                        // 무시
                    }
                }, 5000);
            };
            
            imgElement.onerror = () => {
                console.warn(`이미지 표시 실패: ${fileName}`);
                imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEzcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+로드 실패</text></svg>';
            };
        } catch (error) {
            console.error(`이미지 읽기 실패: ${filePath}`, error);
            imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEzcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+파일 없음</text></svg>';
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

                        // 단일 스케일 특징 추출 (v10.0 방식)
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
                    console.log(`✅ v10.3 인덱싱 완료: ${processedCount}개 성공`);
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
                // v10.x 버전은 모두 호환
                if (stored.version >= 10 && stored.version < 11) {
                    this.imageDatabase = stored.data || [];
                    console.log(`📂 ${this.imageDatabase.length}개의 이미지 로드됨 (v${stored.version})`);
                    
                    // v10.2 DB인 경우 재인덱싱 권장
                    if (stored.modelType === 'MobileNetV2-MultiScale') {
                        console.log('⚠️ v10.2 다중 스케일 DB 감지. 재인덱싱을 권장합니다.');
                    }
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

    // 디버그 정보
    getDebugInfo() {
        return {
            version: this.version,
            model: 'MobileNetV2',
            dbSize: this.imageDatabase.length,
            modelLoaded: this.modelLoaded,
            backend: tf.getBackend(),
            memory: this.getMemoryInfo()
        };
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
        },
        debug: () => {
            return app.getDebugInfo();
        },
        findImage: (name) => {
            const results = app.imageDatabase.filter(item => 
                item.name.toLowerCase().includes(name.toLowerCase())
            );
            console.log(`'${name}' 검색 결과:`, results);
            return results;
        }
    };
    
    console.log('%c🎯 Modern Fashion Search v10.3 초기화 완료!', 'color: #10b981; font-size: 16px; font-weight: bold;');
    console.log('%c정확도 복구 버전', 'color: #666; font-style: italic;');
    console.log('✨ v10.3 변경사항:');
    console.log('  ✅ v10.0 단일 스케일 방식으로 복구');
    console.log('  ✅ 자기 제외 로직 제거');
    console.log('  ✅ 안정적인 특징 추출');
    console.log('  ⚠️  v10.2 DB 사용 가능하나 재인덱싱 권장');
    console.log('콘솔 명령어:');
    console.log('  fashionApp.version() - 버전 정보');
    console.log('  fashionApp.clearDB() - DB 초기화');
    console.log('  fashionApp.testFeatures() - 특징 추출 테스트');
    console.log('  fashionApp.memory() - 메모리 사용량');
    console.log('  fashionApp.debug() - 디버그 정보');
    console.log('  fashionApp.findImage("80159") - 이미지 검색');
});