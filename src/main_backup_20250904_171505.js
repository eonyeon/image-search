import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v11.6 - 99.9% 버그 수정 버전
class FashionSearchFixed {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '11.6.0';
        this.model = null;
        this.modelLoaded = false;
        
        // 완전히 새로운 DB (강제 재인덱싱)
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV116Clean'
        });
        
        console.log(`🚀 Fashion Search v${this.version} - 99.9% 버그 수정`);
        console.log('⚠️ 반드시 DB 초기화 후 재인덱싱 필요!');
        this.init();
    }

    async init() {
        console.log('🔧 시스템 초기화 중...');
        
        try {
            // TensorFlow 초기화
            await tf.setBackend('webgl');
            await tf.ready();
            console.log('✅ TensorFlow 백엔드:', tf.getBackend());
        } catch (error) {
            console.error('WebGL 실패, CPU 모드:', error);
            await tf.setBackend('cpu');
        }
        
        await this.loadModel();
        await this.loadDatabase();
        this.setupEventListeners();
        
        console.log('✅ 초기화 완료!');
        console.log('🔍 진단: fashionApp.diagnose()');
        
        window.fashionApp = this;
    }

    async loadModel() {
        try {
            this.showLoading('모델 로드 중...');
            
            // MobileNet v2 로드
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            
            this.modelLoaded = true;
            console.log('✅ MobileNet v2 로드 완료');
            
            // 모델 테스트
            await this.testModelOutput();
            
            this.hideLoading();
        } catch (error) {
            console.error('❌ 모델 로드 실패:', error);
            this.hideLoading();
        }
    }
    
    // 모델 출력 테스트 - 다른 이미지에 대해 다른 벡터가 나오는지 확인
    async testModelOutput() {
        console.log('🧪 모델 출력 테스트...');
        
        // 두 개의 다른 테스트 이미지 생성
        const testImg1 = tf.randomNormal([224, 224, 3]);
        const testImg2 = tf.randomNormal([224, 224, 3]);
        
        const batch1 = testImg1.expandDims(0);
        const batch2 = batch2.expandDims(0);
        
        // 특징 추출
        const features1 = await this.model.infer(batch1, true);
        const features2 = await this.model.infer(batch2, true);
        
        // 배열로 변환
        const arr1 = await features1.array();
        const arr2 = await features2.array();
        
        // 첫 5개 값 비교
        console.log('벡터1 샘플:', arr1[0].slice(0, 5));
        console.log('벡터2 샘플:', arr2[0].slice(0, 5));
        
        // 같은지 확인
        const isSame = JSON.stringify(arr1[0]) === JSON.stringify(arr2[0]);
        if (isSame) {
            console.error('⚠️ 경고: 모델이 같은 벡터를 출력합니다!');
        } else {
            console.log('✅ 모델이 다른 벡터를 출력합니다.');
        }
        
        // 메모리 정리
        testImg1.dispose();
        testImg2.dispose();
        batch1.dispose();
        batch2.dispose();
        features1.dispose();
        features2.dispose();
    }

    setupEventListeners() {
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
                            extensions: ['png', 'jpeg', 'jpg', 'gif', 'webp']
                        }]
                    });
                    
                    if (selected) {
                        await this.handleFileUpload(selected);
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
                if (confirm('DB를 초기화하시겠습니까?')) {
                    await this.clearDB();
                    alert('DB가 초기화되었습니다. 폴더를 다시 선택해주세요.');
                }
            });
        }
    }

    async handleFileUpload(filePath) {
        try {
            const fileData = await readBinaryFile(filePath);
            const fileName = filePath.split('\\').pop().split('/').pop();
            const blob = new Blob([fileData]);
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                await this.handleDataUrl(e.target.result, fileName);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('파일 읽기 실패:', error);
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
            // 이미지를 텐서로 변환
            const tensor = tf.browser.fromPixels(imgElement);
            // 224x224로 리사이즈
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            // 0-1 범위로 정규화
            const normalized = resized.div(255.0);
            // 배치 차원 추가
            const batched = normalized.expandDims(0);
            return batched;
        });
    }

    // 단순한 코사인 유사도 계산 (정규화 없이)
    calculateSimpleSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
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
        
        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }
        
        const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        
        // -1 ~ 1 범위를 0 ~ 1로 변환
        return (similarity + 1) / 2;
    }

    async searchSimilarImages() {
        if (!this.uploadedImage || !this.modelLoaded) {
            alert('이미지를 선택하고 모델이 로드될 때까지 기다려주세요.');
            return;
        }

        console.log('🔍 검색 시작...');
        this.showLoading('유사 이미지 검색 중...');

        try {
            // 쿼리 이미지의 특징 추출
            const queryFeatures = await this.model.infer(this.uploadedImage.tensor, true);
            const queryArray = await queryFeatures.array();
            
            // 깊은 복사로 벡터 생성
            const queryVector = JSON.parse(JSON.stringify(queryArray[0]));
            
            queryFeatures.dispose();
            
            console.log('쿼리 벡터 추출 완료:', queryVector.length, '차원');
            console.log('쿼리 벡터 샘플:', queryVector.slice(0, 5));
            
            // 모든 이미지와 유사도 계산
            const results = [];
            
            for (const img of this.imageDatabase) {
                const similarity = this.calculateSimpleSimilarity(queryVector, img.features);
                
                results.push({
                    ...img,
                    similarity: similarity
                });
            }

            // 유사도로 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 유사도 분포 확인
            if (results.length > 0) {
                const similarities = results.map(r => r.similarity);
                const max = Math.max(...similarities);
                const min = Math.min(...similarities);
                const avg = similarities.reduce((a,b) => a+b, 0) / similarities.length;
                
                console.log('📊 유사도 분포:');
                console.log(`  최대: ${(max * 100).toFixed(1)}%`);
                console.log(`  최소: ${(min * 100).toFixed(1)}%`);
                console.log(`  평균: ${(avg * 100).toFixed(1)}%`);
                console.log(`  범위: ${((max - min) * 100).toFixed(1)}%`);
                
                if (max - min < 0.01) {
                    console.error('⚠️ 모든 유사도가 거의 동일!');
                    alert('유사도 계산 문제 감지. DB를 재인덱싱해주세요.');
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
                const blob = new Blob([imageData]);
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" style="width: 100%; height: auto;">
                    <div style="padding: 10px;">
                        <div style="font-size: 12px;">${result.name}</div>
                        <div style="font-size: 16px; font-weight: bold; color: #2196F3;">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error(`이미지 로드 실패: ${result.path}`);
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
            'webp': 'image/webp'
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
                console.log(`폴더 선택: ${selected}`);
                await this.indexFolder(selected);
            }
        } catch (error) {
            console.error('폴더 선택 실패:', error);
        }
    }

    async indexFolder(folderPath) {
        this.showLoading('이미지 인덱싱 중...');
        console.log(`📁 인덱싱 시작: ${folderPath}`);

        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const images = [];

            // 이미지 파일 수집
            function collectImages(entries) {
                for (const entry of entries) {
                    if (entry.children) {
                        collectImages(entry.children);
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
            console.log(`🖼️ ${images.length}개 이미지 발견`);

            // DB 초기화
            this.imageDatabase = [];
            
            let processed = 0;
            let testVectors = []; // 테스트용
            
            for (const imageInfo of images) {
                try {
                    // 이미지 로드
                    const imageData = await readBinaryFile(imageInfo.path);
                    const blob = new Blob([imageData]);
                    const url = URL.createObjectURL(blob);
                    
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = url;
                    });

                    // 이미지 전처리
                    const tensor = await this.preprocessImage(img);
                    
                    // 특징 추출
                    const features = await this.model.infer(tensor, true);
                    const featuresArray = await features.array();
                    
                    // 깊은 복사로 특징 벡터 저장 (중요!)
                    const featureVector = JSON.parse(JSON.stringify(featuresArray[0]));
                    
                    // 처음 몇 개 벡터 테스트
                    if (processed < 3) {
                        console.log(`이미지 ${processed + 1} (${imageInfo.name}):`);
                        console.log('  벡터 샘플:', featureVector.slice(0, 5));
                        testVectors.push(featureVector);
                    }
                    
                    // DB에 저장
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
                    
                    // 진행률 업데이트
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱 중... (${processed}/${images.length}) - ${progress}%`);
                        
                        // 메모리 정리를 위한 프레임 대기
                        await tf.nextFrame();
                    }
                    
                } catch (error) {
                    console.error(`이미지 처리 실패: ${imageInfo.name}`, error);
                    processed++;
                }
            }

            // 테스트: 처음 몇 개 벡터 비교
            if (testVectors.length >= 2) {
                const testSim = this.calculateSimpleSimilarity(testVectors[0], testVectors[1]);
                console.log(`📊 테스트 유사도 (이미지1 vs 이미지2): ${(testSim * 100).toFixed(1)}%`);
                
                if (testSim > 0.99) {
                    console.error('⚠️ 경고: 특징 벡터가 거의 동일합니다!');
                }
            }

            // DB 저장
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
            console.log('💾 DB 저장 완료 (v11.6)');
        } catch (error) {
            console.error('DB 저장 실패:', error);
        }
    }

    async loadDatabase() {
        try {
            const version = await this.storage.getItem('version');
            const imageDb = await this.storage.getItem('imageDatabase');
            
            if (imageDb && version === this.version) {
                this.imageDatabase = imageDb;
                console.log(`📂 ${this.imageDatabase.length}개 이미지 로드`);
                
                // 로드된 데이터 검증
                if (this.imageDatabase.length > 0) {
                    const sample = this.imageDatabase[0];
                    console.log('DB 샘플:', sample.name);
                    console.log('특징 벡터 차원:', sample.features ? sample.features.length : 0);
                    
                    // 처음 두 이미지 유사도 테스트
                    if (this.imageDatabase.length >= 2) {
                        const testSim = this.calculateSimpleSimilarity(
                            this.imageDatabase[0].features,
                            this.imageDatabase[1].features
                        );
                        console.log(`DB 테스트 유사도: ${(testSim * 100).toFixed(1)}%`);
                        
                        if (testSim > 0.99) {
                            console.error('⚠️ DB에 문제가 있습니다. 재인덱싱 필요!');
                            alert('DB에 문제가 감지되었습니다. DB를 초기화하고 재인덱싱해주세요.');
                        }
                    }
                }
            } else if (version !== this.version) {
                console.log('⚠️ 버전 변경. 재인덱싱 필요.');
                alert('새 버전이 설치되었습니다. DB를 초기화하고 재인덱싱해주세요.');
            }
        } catch (error) {
            console.error('DB 로드 실패:', error);
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

    // 진단 메서드
    diagnose() {
        const lines = [];
        lines.push(`=== Fashion Search v${this.version} 진단 ===\n`);
        lines.push(`TensorFlow: ${tf.getBackend()}`);
        lines.push(`모델: ${this.modelLoaded ? '✅' : '❌'}`);
        lines.push(`이미지 DB: ${this.imageDatabase.length}개\n`);
        
        if (this.imageDatabase.length >= 2) {
            const img1 = this.imageDatabase[0];
            const img2 = this.imageDatabase[1];
            const sim = this.calculateSimpleSimilarity(img1.features, img2.features);
            
            lines.push(`유사도 테스트:`);
            lines.push(`  ${img1.name} vs ${img2.name}`);
            lines.push(`  결과: ${(sim * 100).toFixed(1)}%\n`);
            
            // 모든 이미지 쌍의 유사도 범위 확인
            let minSim = 1, maxSim = 0;
            for (let i = 0; i < Math.min(10, this.imageDatabase.length); i++) {
                for (let j = i + 1; j < Math.min(10, this.imageDatabase.length); j++) {
                    const pairSim = this.calculateSimpleSimilarity(
                        this.imageDatabase[i].features,
                        this.imageDatabase[j].features
                    );
                    minSim = Math.min(minSim, pairSim);
                    maxSim = Math.max(maxSim, pairSim);
                }
            }
            
            lines.push(`유사도 범위 (상위 10개):`);
            lines.push(`  최소: ${(minSim * 100).toFixed(1)}%`);
            lines.push(`  최대: ${(maxSim * 100).toFixed(1)}%`);
            lines.push(`  차이: ${((maxSim - minSim) * 100).toFixed(1)}%\n`);
            
            if (maxSim - minSim < 0.01) {
                lines.push(`⚠️ 문제: 모든 유사도가 거의 동일!`);
                lines.push(`해결: DB 초기화 → 재인덱싱`);
            } else if (sim > 0.99) {
                lines.push(`⚠️ 문제: 첫 두 이미지 유사도 너무 높음`);
                lines.push(`해결: DB 초기화 → 재인덱싱`);
            } else {
                lines.push(`✅ 정상 작동 중`);
            }
        } else {
            lines.push(`이미지를 인덱싱해주세요.`);
        }
        
        const message = lines.join('\n');
        alert(message);
        console.log(message);
        return message;
    }
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 앱 초기화...');
    
    // CSS 스타일
    const style = document.createElement('style');
    style.textContent = `
        #upload-area { cursor: pointer; transition: all 0.3s; }
        #upload-area:hover { background-color: #f5f5f5; border-color: #2196F3; }
        #upload-area.dragover { background-color: #e3f2fd; border-color: #2196F3; }
        .result-item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin: 10px; cursor: pointer; }
        .result-item:hover { transform: scale(1.05); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
        #loading { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 9999; flex-direction: column; }
        .loading-text { color: white; margin-top: 20px; font-size: 18px; }
        .loader { border: 5px solid #f3f3f3; border-top: 5px solid #2196F3; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .mode-content { display: none; }
        .mode-content.active { display: block; }
    `;
    document.head.appendChild(style);
    
    new FashionSearchFixed();
    
    console.log('✅ Fashion Search v11.6 시작');
    console.log('⚠️ 99.9% 버그가 있으면 DB 초기화 후 재인덱싱!');
});
