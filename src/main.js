import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v11.5 - 진단 및 수정 버전
class FashionSearchDiagnostic {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '11.5.0';
        this.model = null;
        this.modelLoaded = false;
        this.debugMode = true;
        
        // 새 DB (문제 해결을 위해 완전히 새로운 스토어)
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV115'
        });
        
        this.modelStorage = localforage.createInstance({
            name: 'FashionSearchModel',
            storeName: 'modelCache'
        });
        
        console.log(`🚀 Fashion Search v${this.version} - 진단 및 수정 버전`);
        console.log('🔍 특징 벡터 문제 진단 중...');
        this.init();
    }

    async init() {
        console.log('🔧 시스템 초기화 중...');
        
        try {
            // TensorFlow.js 백엔드 설정
            await tf.setBackend('webgl');
            await tf.ready();
            
            console.log('✅ TensorFlow.js 백엔드:', tf.getBackend());
            console.log('📊 TensorFlow.js 버전:', tf.version.tfjs);
        } catch (error) {
            console.error('⚠️ WebGL 실패, CPU 모드 전환:', error);
            await tf.setBackend('cpu');
        }
        
        await this.loadModel();
        await this.loadDatabase();
        this.setupEventListeners();
        
        console.log('✅ 초기화 완료!');
        window.fashionApp = this;
    }

    async loadModel() {
        try {
            this.showLoading('딥러닝 모델 로드 중...');
            
            // MobileNet v2 로드 - alpha 1.0은 가장 정확한 버전
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            
            // 모델 테스트
            console.log('🧪 모델 테스트 중...');
            await this.testModel();
            
            this.modelLoaded = true;
            console.log('✅ MobileNet v2 모델 준비 완료!');
            this.hideLoading();
        } catch (error) {
            console.error('❌ 모델 로드 실패:', error);
            alert('모델 로드 실패. 인터넷 연결을 확인해주세요.');
            this.hideLoading();
        }
    }

    // 모델이 제대로 작동하는지 테스트
    async testModel() {
        // 두 개의 다른 랜덤 이미지 생성
        const img1 = tf.randomNormal([224, 224, 3]);
        const img2 = tf.randomNormal([224, 224, 3]);
        
        const batch1 = img1.expandDims(0);
        const batch2 = img2.expandDims(0);
        
        // 특징 추출
        const features1 = await this.model.infer(batch1, true);
        const features2 = await this.model.infer(batch2, true);
        
        const array1 = await features1.array();
        const array2 = await features2.array();
        
        // 유사도 계산
        const similarity = this.calculateCosineSimilarity(array1[0], array2[0]);
        
        console.log('🧪 모델 테스트 결과:');
        console.log('  - 특징 벡터 1 샘플:', array1[0].slice(0, 5));
        console.log('  - 특징 벡터 2 샘플:', array2[0].slice(0, 5));
        console.log('  - 랜덤 이미지 유사도:', (similarity * 100).toFixed(2) + '%');
        
        if (similarity > 0.95) {
            console.warn('⚠️ 경고: 다른 이미지인데 유사도가 너무 높습니다!');
        } else {
            console.log('✅ 모델이 정상적으로 작동합니다.');
        }
        
        // 메모리 정리
        img1.dispose();
        img2.dispose();
        batch1.dispose();
        batch2.dispose();
        features1.dispose();
        features2.dispose();
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

        // 업로드 영역
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const selected = await open({
                        multiple: false,
                        filters: [{
                            name: 'Image',
                            extensions: ['png', 'jpeg', 'jpg', 'gif', 'webp', 'bmp']
                        }],
                        title: '검색할 이미지 선택'
                    });
                    
                    if (selected) {
                        await this.handleTauriFileUpload(selected);
                    }
                } catch (error) {
                    console.error('파일 선택 실패:', error);
                }
            });
            
            // 드래그 앤 드롭
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', async (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    const file = files[0];
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        await this.handleDataUrl(event.target.result, file.name);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // 검색 버튼
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                if (this.uploadedImage) {
                    await this.searchSimilarImages();
                }
            });
        }

        // 폴더 선택
        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', async () => {
                await this.selectFolder();
            });
        }

        // DB 초기화
        const clearDbBtn = document.getElementById('clear-db-btn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', async () => {
                if (confirm('데이터베이스를 초기화하시겠습니까?')) {
                    await this.clearDB();
                    alert('데이터베이스가 초기화되었습니다.');
                }
            });
        }
    }

    async handleTauriFileUpload(filePath) {
        console.log('📸 파일 처리:', filePath);
        
        try {
            const fileData = await readBinaryFile(filePath);
            const fileName = filePath.split('\\').pop().split('/').pop();
            const blob = new Blob([fileData], { type: this.getMimeType(fileName) });
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                await this.handleDataUrl(e.target.result, fileName);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('❌ 파일 읽기 실패:', error);
        }
    }

    async handleDataUrl(dataUrl, fileName) {
        const imgElement = document.getElementById('uploaded-image');
        const previewSection = document.getElementById('preview-section');
        
        if (imgElement && previewSection) {
            imgElement.src = dataUrl;
            imgElement.style.display = 'block';
            previewSection.style.display = 'block';
        }
        
        const img = new Image();
        img.onload = async () => {
            this.uploadedImage = {
                file: { name: fileName },
                tensor: await this.preprocessImage(img),
                element: img
            };
            
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.disabled = false;
            }
            
            console.log(`✅ 이미지 준비 완료: ${fileName}`);
        };
        
        img.src = dataUrl;
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

    async preprocessImage(imgElement) {
        return tf.tidy(() => {
            // 이미지를 tensor로 변환
            let tensor = tf.browser.fromPixels(imgElement);
            
            // 224x224로 리사이즈
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            
            // 0-1 범위로 정규화
            const normalized = resized.div(255.0);
            
            // 배치 차원 추가
            const batched = normalized.expandDims(0);
            
            return batched;
        });
    }

    // 단순하고 검증된 코사인 유사도 계산
    calculateCosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            console.error('벡터 크기 불일치');
            return 0;
        }
        
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
        
        if (norm1 === 0 || norm2 === 0) {
            console.warn('제로 벡터 감지');
            return 0;
        }
        
        // 코사인 유사도 계산
        const cosineSim = dotProduct / (norm1 * norm2);
        
        // -1 ~ 1 범위를 0 ~ 1로 변환
        return (cosineSim + 1) / 2;
    }

    async searchSimilarImages() {
        if (!this.uploadedImage || !this.modelLoaded) {
            alert('이미지를 선택하고 모델이 로드될 때까지 기다려주세요.');
            return;
        }

        console.log('🔍 v11.5 검색 시작...');
        this.showLoading('유사 이미지 검색 중...');

        try {
            // 업로드된 이미지의 특징 추출
            const queryFeatures = await this.model.infer(this.uploadedImage.tensor, true);
            const queryArray = await queryFeatures.array();
            const queryVector = Array.from(queryArray[0]); // 명시적 배열 복사
            queryFeatures.dispose();
            
            console.log('📊 쿼리 특징 벡터:');
            console.log('  - 차원:', queryVector.length);
            console.log('  - 샘플:', queryVector.slice(0, 5));
            console.log('  - 평균:', queryVector.reduce((a,b) => a+b, 0) / queryVector.length);
            
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
            
            if (results.length > 0) {
                // 유사도 분포 분석
                const similarities = results.map(r => r.similarity);
                const max = Math.max(...similarities);
                const min = Math.min(...similarities);
                const avg = similarities.reduce((a,b) => a+b, 0) / similarities.length;
                
                console.log('📈 유사도 분포:');
                console.log(`  - 최대: ${(max * 100).toFixed(1)}%`);
                console.log(`  - 최소: ${(min * 100).toFixed(1)}%`);
                console.log(`  - 평균: ${(avg * 100).toFixed(1)}%`);
                
                // 상위 5개 결과
                console.log('🏆 상위 5개:');
                results.slice(0, 5).forEach((r, i) => {
                    console.log(`  ${i+1}. ${r.name}: ${(r.similarity * 100).toFixed(1)}%`);
                });
                
                // 경고: 모든 결과가 비슷한 경우
                if (max - min < 0.01) {
                    console.error('⚠️ 경고: 모든 유사도가 거의 동일합니다!');
                    alert('경고: 유사도 계산에 문제가 있습니다. DB를 재인덱싱해주세요.');
                }
            }

            await this.displayResults(results);
            
        } catch (error) {
            console.error('❌ 검색 실패:', error);
            alert('검색 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    async displayResults(results) {
        const resultsContainer = document.getElementById('search-results');
        const resultsSection = document.getElementById('results-section');
        
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        const topResults = results.slice(0, 20);

        for (const result of topResults) {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // 유사도별 색상
            if (result.similarity > 0.8) {
                resultItem.style.border = '3px solid #4CAF50';
            } else if (result.similarity > 0.7) {
                resultItem.style.border = '3px solid #FFC107';
            } else if (result.similarity > 0.6) {
                resultItem.style.border = '3px solid #FF9800';
            }
            
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData], { 
                    type: this.getMimeType(result.path) 
                });
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" style="width: 100%; height: auto;">
                    <div class="result-info" style="padding: 10px;">
                        <div style="font-size: 12px;">${result.name}</div>
                        <div style="font-size: 16px; font-weight: bold; color: #2196F3;">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error(`이미지 로드 실패: ${result.path}`, error);
            }
            
            resultsContainer.appendChild(resultItem);
        }

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
        this.showLoading('이미지 인덱싱 중...');
        console.log(`📁 폴더 인덱싱 시작: ${folderPath}`);

        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const images = [];

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

            // 초기화
            this.imageDatabase = [];
            
            let processed = 0;
            const featureVectors = []; // 디버깅용
            
            for (const imageInfo of images) {
                try {
                    const imageData = await readBinaryFile(imageInfo.path);
                    const blob = new Blob([imageData]);
                    const url = URL.createObjectURL(blob);
                    
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
                    
                    // 명시적으로 배열 복사 (참조 문제 방지)
                    const featureVector = Array.from(featuresArray[0]);
                    
                    // 디버그: 특징 벡터 확인
                    if (processed < 3) {
                        console.log(`🔍 이미지 ${processed + 1} (${imageInfo.name}):`);
                        console.log('  - 특징 샘플:', featureVector.slice(0, 5));
                        console.log('  - 평균값:', featureVector.reduce((a,b) => a+b, 0) / featureVector.length);
                        featureVectors.push(featureVector);
                    }
                    
                    // 저장
                    this.imageDatabase.push({
                        name: imageInfo.name,
                        path: imageInfo.path,
                        features: featureVector
                    });
                    
                    // 메모리 정리
                    tensor.dispose();
                    features.dispose();
                    URL.revokeObjectURL(url);
                    
                    processed++;
                    
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱 중... (${processed}/${images.length}) - ${progress}%`);
                        await tf.nextFrame();
                    }
                    
                } catch (error) {
                    console.error(`이미지 처리 실패: ${imageInfo.name}`, error);
                    processed++;
                }
            }

            // 디버그: 처음 몇 개 이미지의 유사도 테스트
            if (featureVectors.length >= 2) {
                const sim = this.calculateCosineSimilarity(featureVectors[0], featureVectors[1]);
                console.log(`📊 테스트 유사도 (이미지 1 vs 2): ${(sim * 100).toFixed(1)}%`);
            }

            // 저장
            await this.saveDatabase();
            
            console.log(`✅ 인덱싱 완료: ${this.imageDatabase.length}개`);
            
            alert(`인덱싱 완료!\n${this.imageDatabase.length}개의 이미지가 인덱싱되었습니다.`);
            
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
            await this.storage.setItem('version', this.version);
            console.log('💾 데이터베이스 저장 완료 (v11.5)');
        } catch (error) {
            console.error('데이터베이스 저장 실패:', error);
        }
    }

    async loadDatabase() {
        try {
            const version = await this.storage.getItem('version');
            const imageDb = await this.storage.getItem('imageDatabase');
            
            if (imageDb && version === this.version) {
                this.imageDatabase = imageDb;
                console.log(`📂 ${this.imageDatabase.length}개의 이미지 로드됨`);
                
                // 데이터 검증
                if (this.imageDatabase.length > 0) {
                    const sample = this.imageDatabase[0];
                    console.log('📋 DB 검증:');
                    console.log('  - 첫 이미지:', sample.name);
                    console.log('  - 특징 차원:', sample.features ? sample.features.length : 'N/A');
                    console.log('  - 특징 샘플:', sample.features ? sample.features.slice(0, 3) : 'N/A');
                }
            } else if (version !== this.version) {
                console.log('⚠️ 버전 변경. 재인덱싱 필요.');
            }
        } catch (error) {
            console.error('데이터베이스 로드 실패:', error);
        }
    }

    async clearDB() {
        await this.storage.clear();
        this.imageDatabase = [];
        console.log('🗑️ DB 초기화 완료');
    }

    showLoading(message) {
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

    // 진단 명령어들
    version() {
        return `Fashion Search v${this.version} - 진단 버전`;
    }
    
    // 팝업으로 진단 결과 보여주기
    showDiagnostics() {
        const diagnostics = [];
        diagnostics.push(`=== Fashion Search v${this.version} 진단 ===\n`);
        diagnostics.push(`TensorFlow: ${tf.getBackend()}`);
        diagnostics.push(`모델 로드: ${this.modelLoaded ? '✅' : '❌'}`);
        diagnostics.push(`이미지 DB: ${this.imageDatabase.length}개\n`);
        
        if (this.imageDatabase.length >= 2) {
            const img1 = this.imageDatabase[0];
            const img2 = this.imageDatabase[1];
            const sim = this.calculateCosineSimilarity(img1.features, img2.features);
            diagnostics.push(`샘플 유사도 테스트:`);
            diagnostics.push(`${img1.name} vs ${img2.name}`);
            diagnostics.push(`결과: ${(sim * 100).toFixed(1)}%`);
            
            if (sim > 0.99) {
                diagnostics.push(`\n⚠️ 경고: 유사도가 비정상적으로 높습니다!`);
                diagnostics.push(`DB를 초기화하고 재인덱싱해주세요.`);
            } else {
                diagnostics.push(`\n✅ 유사도가 정상 범위입니다.`);
            }
        } else {
            diagnostics.push(`테스트할 이미지가 부족합니다.`);
        }
        
        const message = diagnostics.join('\n');
        alert(message);
        console.log(message);
        return message;
    }

    async diagnose() {
        console.log('🔍 시스템 진단 시작...');
        
        console.log('1️⃣ TensorFlow 상태:');
        console.log('  - Backend:', tf.getBackend());
        console.log('  - Version:', tf.version.tfjs);
        
        console.log('2️⃣ 모델 상태:');
        console.log('  - Loaded:', this.modelLoaded);
        
        console.log('3️⃣ 데이터베이스:');
        console.log('  - Images:', this.imageDatabase.length);
        
        if (this.imageDatabase.length >= 2) {
            const img1 = this.imageDatabase[0];
            const img2 = this.imageDatabase[1];
            const sim = this.calculateCosineSimilarity(img1.features, img2.features);
            console.log('4️⃣ 샘플 유사도:');
            console.log(`  - ${img1.name} vs ${img2.name}: ${(sim * 100).toFixed(1)}%`);
            
            if (sim > 0.99) {
                console.error('⚠️ 문제 감지: 유사도가 비정상적으로 높음!');
                return '문제 있음: 특징 벡터가 동일';
            }
        }
        
        return '진단 완료';
    }

    // 특징 벡터 직접 확인
    checkFeatures() {
        if (this.imageDatabase.length === 0) {
            return '이미지 없음';
        }
        
        const sample = this.imageDatabase[0];
        console.log('특징 벡터 체크:');
        console.log('- 이미지:', sample.name);
        console.log('- 차원:', sample.features.length);
        console.log('- 처음 10개:', sample.features.slice(0, 10));
        console.log('- 평균:', sample.features.reduce((a,b) => a+b, 0) / sample.features.length);
        
        return sample.features;
    }
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 로드 완료, 앱 초기화 시작...');
    
    // CSS 스타일
    const style = document.createElement('style');
    style.textContent = `
        #upload-area { cursor: pointer; transition: all 0.3s; }
        #upload-area:hover { background-color: #f5f5f5; border-color: #2196F3; }
        #upload-area.dragover { background-color: #e3f2fd; border-color: #2196F3; }
        .result-item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin: 10px; }
        #loading { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 9999; flex-direction: column; }
        .loading-text { color: white; margin-top: 20px; font-size: 18px; }
        .loader { border: 5px solid #f3f3f3; border-top: 5px solid #2196F3; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .mode-content { display: none; }
        .mode-content.active { display: block; }
    `;
    document.head.appendChild(style);
    
    new FashionSearchDiagnostic();
    
    console.log('🎯 Fashion Search v11.5 초기화 완료!');
    console.log('');
    console.log('🔧 진단 명령어:');
    console.log('  fashionApp.diagnose() - 시스템 진단');
    console.log('  fashionApp.checkFeatures() - 특징 벡터 확인');
    console.log('  fashionApp.version() - 버전 정보');
    console.log('');
    console.log('⚠️  중요: DB 재인덱싱 필수!');
});
