import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';

// Fashion Search v17.3 - 패턴 인식 강화 버전
class FashionSearchEnhanced {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '17.3.0';
        this.debugMode = true;
        this.debugLogs = [];
        
        // 새 DB (v17.3용)
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV173Enhanced'
        });
        
        this.init();
    }
    
    addDebugLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        this.debugLogs.push({ message, type, timestamp });
        
        const container = document.getElementById('debug-log-container');
        if (container) {
            const logEntry = document.createElement('div');
            const colors = {
                info: '#0f0',
                error: '#f00',
                warning: '#ff0',
                success: '#0ff',
                critical: '#f0f'
            };
            logEntry.style.cssText = `color: ${colors[type]}; margin: 2px 0; font-size: 11px;`;
            logEntry.textContent = `${timestamp} ${message}`;
            container.appendChild(logEntry);
            container.scrollTop = container.scrollHeight;
            
            while (container.children.length > 50) {
                container.removeChild(container.firstChild);
            }
        }
    }
    
    async init() {
        this.addDebugLog('🚀 Fashion Search v17.3 - 패턴 인식 강화', 'critical');
        this.addDebugLog('가중치 최적화: 패턴 50% + 브랜드 검출', 'warning');
        
        // 디버그 패널 생성
        this.createDebugPanel();
        
        // TensorFlow 준비
        await tf.ready();
        this.addDebugLog(`✅ TensorFlow 준비 완료`, 'success');
        
        // DB 로드
        await this.loadDatabase();
        
        // 이벤트 리스너
        this.setupEventListeners();
        
        // 전역 등록
        window.fashionApp = this;
        
        this.addDebugLog('✅ 초기화 완료!', 'success');
    }
    
    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 550px;
            max-height: 350px;
            background: rgba(0, 0, 0, 0.95);
            color: #0f0;
            border: 2px solid #0f0;
            border-radius: 5px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            z-index: 10000;
        `;
        
        debugPanel.innerHTML = `
            <div style="color: #ff0; font-weight: bold; margin-bottom: 5px;">
                🔍 Debug Console v17.3 - ENHANCED
            </div>
            <div id="debug-log-container" style="overflow-y: auto; max-height: 300px;"></div>
        `;
        
        document.body.appendChild(debugPanel);
        
        const controlPanel = document.createElement('div');
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: Arial;
            font-size: 13px;
            z-index: 9999;
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0;">🔍 v17.3 Enhanced</h3>
            <button onclick="fashionApp.testFeatureExtraction()" style="margin: 3px; padding: 5px 10px;">
                🧪 특징 추출 테스트
            </button>
            <button onclick="fashionApp.validateDatabase()" style="margin: 3px; padding: 5px 10px;">
                📊 DB 검증
            </button>
            <button onclick="fashionApp.clearAndReload()" style="margin: 3px; padding: 5px 10px; background: red;">
                💣 완전 초기화
            </button>
        `;
        
        document.body.appendChild(controlPanel);
    }
    
    // 하이브리드 특징 추출 (패턴 강화 - 544차원)
    async extractHybridFeatures(imageData, canvas) {
        const features = [];
        
        // 1. 색상 히스토그램 (256차원)
        const colorFeatures = this.extractColorHistogram(imageData);
        features.push(...colorFeatures);
        
        // 2. 엣지 검출 특징 (128차원)
        const edgeFeatures = this.extractEdgeFeatures(imageData);
        features.push(...edgeFeatures);
        
        // 3. 패턴/텍스처 특징 강화 (128차원)
        const patternFeatures = this.extractEnhancedPatternFeatures(imageData);
        features.push(...patternFeatures);
        
        // 4. 형태 특징 (32차원)
        const shapeFeatures = this.extractShapeFeatures(imageData);
        features.push(...shapeFeatures);
        
        return features; // 총 544차원
    }
    
    // 색상 히스토그램 (256차원)
    extractColorHistogram(imageData) {
        const bins = 4;
        const histogram = new Array(bins * bins * bins).fill(0);
        const hueHistogram = new Array(12).fill(0);
        const saturationLevels = [0, 0, 0];
        const brightnessLevels = [0, 0, 0];
        
        const pixelCount = imageData.width * imageData.height;
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const rBin = Math.min(Math.floor(r / (256 / bins)), bins - 1);
            const gBin = Math.min(Math.floor(g / (256 / bins)), bins - 1);
            const bBin = Math.min(Math.floor(b / (256 / bins)), bins - 1);
            const binIndex = rBin * bins * bins + gBin * bins + bBin;
            histogram[binIndex]++;
            
            const hsv = this.rgbToHsv(r, g, b);
            
            const hueBin = Math.min(Math.floor(hsv.h / 30), 11);
            hueHistogram[hueBin]++;
            
            if (hsv.s < 0.33) saturationLevels[0]++;
            else if (hsv.s < 0.66) saturationLevels[1]++;
            else saturationLevels[2]++;
            
            if (hsv.v < 0.33) brightnessLevels[0]++;
            else if (hsv.v < 0.66) brightnessLevels[1]++;
            else brightnessLevels[2]++;
        }
        
        const features = [];
        features.push(...histogram.map(v => v / pixelCount));
        features.push(...hueHistogram.map(v => v / pixelCount));
        features.push(...saturationLevels.map(v => v / pixelCount));
        features.push(...brightnessLevels.map(v => v / pixelCount));
        
        // 주요 색상 3개
        const colorCounts = {};
        for (let i = 0; i < data.length; i += 40) {
            const r = Math.floor(data[i] / 64) * 64;
            const g = Math.floor(data[i + 1] / 64) * 64;
            const b = Math.floor(data[i + 2] / 64) * 64;
            const key = `${r},${g},${b}`;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
        }
        
        const topColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([color, count]) => {
                const [r, g, b] = color.split(',').map(Number);
                return [r/255, g/255, b/255, count/(data.length/40)];
            })
            .flat();
        
        while (topColors.length < 12) topColors.push(0);
        features.push(...topColors);
        
        const colorVariance = this.calculateColorVariance(data);
        features.push(colorVariance);
        
        const brightnessDistribution = this.calculateBrightnessDistribution(data);
        features.push(...brightnessDistribution);
        
        while (features.length < 256) features.push(0);
        return features.slice(0, 256);
    }
    
    // 엣지 검출 특징 (128차원)
    extractEdgeFeatures(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        const edges = [];
        const angleHistogram = new Array(8).fill(0);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
                        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
                        gx += gray * sobelX[dy + 1][dx + 1];
                        gy += gray * sobelY[dy + 1][dx + 1];
                    }
                }
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const angle = Math.atan2(gy, gx);
                
                edges.push(magnitude);
                
                if (magnitude > 30) {
                    const angleBin = Math.min(Math.floor((angle + Math.PI) / (Math.PI / 4)), 7);
                    angleHistogram[angleBin]++;
                }
            }
        }
        
        const totalEdges = edges.reduce((a, b) => a + b, 0);
        const avgEdge = edges.length > 0 ? totalEdges / edges.length : 0;
        const maxEdge = edges.length > 0 ? Math.max(...edges) : 0;
        
        const gridSize = 8;
        const cellWidth = Math.floor(width / gridSize);
        const cellHeight = Math.floor(height / gridSize);
        const edgeGrid = new Array(gridSize * gridSize).fill(0);
        
        for (let gy = 0; gy < gridSize; gy++) {
            for (let gx = 0; gx < gridSize; gx++) {
                let cellSum = 0;
                let cellCount = 0;
                
                for (let y = gy * cellHeight; y < Math.min((gy + 1) * cellHeight, height - 1); y++) {
                    for (let x = gx * cellWidth; x < Math.min((gx + 1) * cellWidth, width - 1); x++) {
                        const idx = y * (width - 2) + x;
                        if (idx < edges.length) {
                            cellSum += edges[idx];
                            cellCount++;
                        }
                    }
                }
                
                edgeGrid[gy * gridSize + gx] = cellCount > 0 ? cellSum / cellCount : 0;
            }
        }
        
        const features = [];
        features.push(...edgeGrid.map(v => v / 255));
        
        const maxAngle = Math.max(...angleHistogram);
        features.push(...angleHistogram.map(v => maxAngle > 0 ? v / maxAngle : 0));
        
        features.push(avgEdge / 255);
        features.push(maxEdge / 255);
        
        const edgeComplexity = this.calculateEdgeComplexity(edges, width, height);
        features.push(...edgeComplexity);
        
        while (features.length < 128) features.push(0);
        return features.slice(0, 128);
    }
    
    // 강화된 패턴/텍스처 특징 (128차원) - 브랜드 패턴 검출 추가
    extractEnhancedPatternFeatures(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // 1. LBP 히스토그램 (32차원)
        const lbpFeatures = this.extractLBPFeatures(data, width, height);
        
        // 2. 퀼팅 패턴 검출 (샤넬 스타일) (16차원)
        const quiltingScore = this.detectQuiltingPattern(data, width, height);
        
        // 3. 모노그램 패턴 검출 (루이비통 스타일) (16차원)
        const monogramScore = this.detectMonogramPattern(data, width, height);
        
        // 4. 반복 패턴 밀도 (32차원)
        const repeatPattern = this.detectRepetitivePatternEnhanced(data, width, height);
        
        // 5. GLCM 텍스처 특징 (32차원)
        const glcmFeatures = this.calculateGLCMFeatures(data, width, height);
        
        const features = [];
        features.push(...lbpFeatures);
        features.push(...quiltingScore);
        features.push(...monogramScore);
        features.push(...repeatPattern);
        features.push(...glcmFeatures);
        
        while (features.length < 128) features.push(0);
        return features.slice(0, 128);
    }
    
    // LBP 특징 추출 (32차원)
    extractLBPFeatures(data, width, height) {
        const lbpHistogram = new Array(32).fill(0);
        
        for (let y = 1; y < height - 1; y += 2) {
            for (let x = 1; x < width - 1; x += 2) {
                const centerIdx = (y * width + x) * 4;
                const centerGray = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
                
                let lbpCode = 0;
                const neighbors = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]
                ];
                
                neighbors.forEach((offset, i) => {
                    const idx = ((y + offset[0]) * width + (x + offset[1])) * 4;
                    if (idx >= 0 && idx < data.length) {
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        if (gray >= centerGray) {
                            lbpCode |= (1 << i);
                        }
                    }
                });
                
                const binIndex = Math.min(Math.floor(lbpCode / 8), 31);
                lbpHistogram[binIndex]++;
            }
        }
        
        const total = Math.max(1, lbpHistogram.reduce((a, b) => a + b, 0));
        return lbpHistogram.map(v => v / total);
    }
    
    // 퀼팅 패턴 검출 (샤넬 스타일)
    detectQuiltingPattern(data, width, height) {
        const features = new Array(16).fill(0);
        const blockSize = 20;
        let featureIdx = 0;
        
        // 다이아몬드 형태 검출
        for (let y = 0; y < height - blockSize; y += blockSize) {
            for (let x = 0; x < width - blockSize; x += blockSize) {
                let diagonalScore = 0;
                
                // 대각선 패턴 체크
                for (let i = 0; i < blockSize - 1; i++) {
                    // 왼쪽 위에서 오른쪽 아래
                    const idx1 = ((y + i) * width + (x + i)) * 4;
                    const idx2 = ((y + i + 1) * width + (x + i + 1)) * 4;
                    
                    if (idx1 < data.length && idx2 < data.length) {
                        const gray1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
                        const gray2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                        
                        if (Math.abs(gray1 - gray2) < 20) {
                            diagonalScore++;
                        }
                    }
                    
                    // 오른쪽 위에서 왼쪽 아래
                    const idx3 = ((y + i) * width + (x + blockSize - i - 1)) * 4;
                    const idx4 = ((y + i + 1) * width + (x + blockSize - i - 2)) * 4;
                    
                    if (idx3 < data.length && idx4 < data.length) {
                        const gray3 = (data[idx3] + data[idx3 + 1] + data[idx3 + 2]) / 3;
                        const gray4 = (data[idx4] + data[idx4 + 1] + data[idx4 + 2]) / 3;
                        
                        if (Math.abs(gray3 - gray4) < 20) {
                            diagonalScore++;
                        }
                    }
                }
                
                if (featureIdx < 16) {
                    features[featureIdx++] = diagonalScore / (blockSize * 2);
                }
            }
        }
        
        return features;
    }
    
    // 모노그램 패턴 검출 (루이비통 스타일)
    detectMonogramPattern(data, width, height) {
        const features = new Array(16).fill(0);
        const patternSize = 30;
        let featureIdx = 0;
        
        // 반복되는 작은 패턴 검출
        for (let y = 0; y < height - patternSize * 2; y += patternSize) {
            for (let x = 0; x < width - patternSize * 2; x += patternSize) {
                let similarityScore = 0;
                
                // 현재 블록과 주변 블록 비교
                for (let dy = 0; dy < patternSize; dy += 4) {
                    for (let dx = 0; dx < patternSize; dx += 4) {
                        const idx1 = ((y + dy) * width + (x + dx)) * 4;
                        const idx2 = ((y + dy) * width + (x + dx + patternSize)) * 4;
                        const idx3 = ((y + dy + patternSize) * width + (x + dx)) * 4;
                        
                        if (idx1 < data.length && idx2 < data.length && idx3 < data.length) {
                            const gray1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
                            const gray2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                            const gray3 = (data[idx3] + data[idx3 + 1] + data[idx3 + 2]) / 3;
                            
                            // 유사한 패턴이 반복되는지 확인
                            if (Math.abs(gray1 - gray2) < 30 && Math.abs(gray1 - gray3) < 30) {
                                similarityScore++;
                            }
                        }
                    }
                }
                
                if (featureIdx < 16) {
                    features[featureIdx++] = similarityScore / ((patternSize / 4) * (patternSize / 4));
                }
            }
        }
        
        return features;
    }
    
    // 강화된 반복 패턴 검출 (32차원)
    detectRepetitivePatternEnhanced(data, width, height) {
        const features = new Array(32).fill(0);
        const scales = [8, 16, 24, 32]; // 다양한 크기의 패턴 검출
        let featureIdx = 0;
        
        for (const scale of scales) {
            for (let y = 0; y < Math.min(height - scale * 2, scale * 2); y += scale) {
                for (let x = 0; x < Math.min(width - scale * 2, scale * 2); x += scale) {
                    let repeatScore = 0;
                    
                    // 수평 반복
                    let hDiff = 0;
                    for (let dy = 0; dy < scale; dy += 2) {
                        for (let dx = 0; dx < scale; dx += 2) {
                            const idx1 = ((y + dy) * width + x + dx) * 4;
                            const idx2 = ((y + dy) * width + x + dx + scale) * 4;
                            
                            if (idx1 < data.length && idx2 < data.length) {
                                hDiff += Math.abs(data[idx1] - data[idx2]);
                            }
                        }
                    }
                    
                    // 수직 반복
                    let vDiff = 0;
                    for (let dy = 0; dy < scale; dy += 2) {
                        for (let dx = 0; dx < scale; dx += 2) {
                            const idx1 = ((y + dy) * width + x + dx) * 4;
                            const idx2 = ((y + dy + scale) * width + x + dx) * 4;
                            
                            if (idx1 < data.length && idx2 < data.length) {
                                vDiff += Math.abs(data[idx1] - data[idx2]);
                            }
                        }
                    }
                    
                    repeatScore = 1.0 / (1.0 + (hDiff + vDiff) / 10000);
                    
                    if (featureIdx < 32) {
                        features[featureIdx++] = repeatScore;
                    }
                }
            }
        }
        
        return features;
    }
    
    // GLCM 특징 (32차원)
    calculateGLCMFeatures(data, width, height) {
        const features = new Array(32).fill(0);
        const levels = 8;
        const glcm = new Array(levels * levels).fill(0);
        
        for (let y = 0; y < height - 1; y += 2) {
            for (let x = 0; x < width - 1; x += 2) {
                const idx1 = (y * width + x) * 4;
                const idx2 = (y * width + x + 1) * 4;
                
                if (idx1 < data.length && idx2 < data.length) {
                    const gray1 = Math.min(Math.floor((data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3 / (256 / levels)), levels - 1);
                    const gray2 = Math.min(Math.floor((data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3 / (256 / levels)), levels - 1);
                    
                    glcm[gray1 * levels + gray2]++;
                }
            }
        }
        
        const total = Math.max(1, glcm.reduce((a, b) => a + b, 0));
        const normalizedGLCM = glcm.map(v => v / total);
        
        let contrast = 0, homogeneity = 0, energy = 0, correlation = 0;
        
        for (let i = 0; i < levels; i++) {
            for (let j = 0; j < levels; j++) {
                const p = normalizedGLCM[i * levels + j];
                contrast += p * (i - j) * (i - j);
                homogeneity += p / (1 + Math.abs(i - j));
                energy += p * p;
                correlation += p * i * j;
            }
        }
        
        features[0] = contrast / 100;
        features[1] = homogeneity;
        features[2] = energy;
        features[3] = correlation / 100;
        
        // 추가 통계
        for (let i = 4; i < 32; i++) {
            features[i] = i < normalizedGLCM.length ? normalizedGLCM[i] : 0;
        }
        
        return features;
    }
    
    // 형태 특징 (32차원)
    extractShapeFeatures(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const binary = this.binarizeImage(imageData);
        
        const contours = this.findContours(binary, width, height);
        const huMoments = this.calculateHuMoments(contours, width, height);
        
        const aspectRatio = width / height;
        const shapeComplexity = contours.length / 1000;
        const centerX = 0.5;
        const centerY = 0.5;
        
        const features = [];
        features.push(...huMoments);
        features.push(aspectRatio);
        features.push(shapeComplexity);
        features.push(centerX, centerY);
        
        const symmetry = this.measureSymmetry(binary, width, height);
        features.push(...symmetry);
        
        const corners = this.detectCorners(imageData);
        features.push(...corners);
        
        while (features.length < 32) features.push(0);
        return features.slice(0, 32);
    }
    
    // 보조 함수들
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        let s = max === 0 ? 0 : diff / max;
        let v = max;
        
        if (diff !== 0) {
            if (max === r) {
                h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
            } else if (max === g) {
                h = ((b - r) / diff + 2) * 60;
            } else {
                h = ((r - g) / diff + 4) * 60;
            }
        }
        
        return { h, s, v };
    }
    
    calculateColorVariance(data) {
        let sum = 0, sumSq = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 40) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += gray;
            sumSq += gray * gray;
            count++;
        }
        
        if (count === 0) return 0;
        
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        return Math.sqrt(Math.max(0, variance)) / 255;
    }
    
    calculateBrightnessDistribution(data) {
        const bins = 10;
        const histogram = new Array(bins).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const bin = Math.min(Math.floor(brightness / (256 / bins)), bins - 1);
            histogram[bin]++;
        }
        
        const total = data.length / 4;
        return histogram.map(v => v / total);
    }
    
    calculateEdgeComplexity(edges, width, height) {
        const complexity = [];
        const blockSize = 4;
        const blocksX = Math.floor(width / blockSize);
        const blocksY = Math.floor(height / blockSize);
        
        for (let by = 0; by < blocksY; by++) {
            for (let bx = 0; bx < blocksX; bx++) {
                let changes = 0;
                let total = 0;
                
                for (let y = by * blockSize; y < Math.min((by + 1) * blockSize, height - 2); y++) {
                    for (let x = bx * blockSize; x < Math.min((bx + 1) * blockSize, width - 2); x++) {
                        const idx = y * (width - 2) + x;
                        if (idx < edges.length - 1) {
                            const diff = Math.abs(edges[idx] - edges[idx + 1]);
                            if (diff > 20) changes++;
                            total++;
                        }
                    }
                }
                
                complexity.push(total > 0 ? changes / total : 0);
            }
        }
        
        while (complexity.length < 54) complexity.push(0);
        return complexity.slice(0, 54);
    }
    
    binarizeImage(imageData) {
        const data = imageData.data;
        const binary = [];
        const threshold = 128;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            binary.push(gray > threshold ? 1 : 0);
        }
        
        return binary;
    }
    
    findContours(binary, width, height) {
        const contours = [];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                
                if (binary[idx] === 1) {
                    const neighbors = [
                        binary[(y - 1) * width + x],
                        binary[(y + 1) * width + x],
                        binary[y * width + (x - 1)],
                        binary[y * width + (x + 1)]
                    ];
                    
                    if (neighbors.some(n => n === 0)) {
                        contours.push({ x, y });
                    }
                }
            }
        }
        
        return contours;
    }
    
    calculateHuMoments(contours, width, height) {
        if (contours.length === 0) {
            return [0, 0, 0, 0, 0, 0, 0];
        }
        
        let cx = 0, cy = 0;
        contours.forEach(p => {
            cx += p.x;
            cy += p.y;
        });
        cx /= contours.length;
        cy /= contours.length;
        
        const moments = [];
        for (let p = 0; p <= 2; p++) {
            for (let q = 0; q <= 2; q++) {
                if (p + q <= 2) {
                    let m = 0;
                    contours.forEach(point => {
                        m += Math.pow(point.x - cx, p) * Math.pow(point.y - cy, q);
                    });
                    moments.push(m / contours.length / Math.pow(Math.max(width, height), p + q));
                }
            }
        }
        
        return moments.slice(0, 7);
    }
    
    measureSymmetry(binary, width, height) {
        let horizontalSym = 0, verticalSym = 0;
        let count = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width / 2; x++) {
                const idx1 = y * width + x;
                const idx2 = y * width + (width - 1 - x);
                
                if (binary[idx1] === binary[idx2]) {
                    horizontalSym++;
                }
                count++;
            }
        }
        
        for (let y = 0; y < height / 2; y++) {
            for (let x = 0; x < width; x++) {
                const idx1 = y * width + x;
                const idx2 = (height - 1 - y) * width + x;
                
                if (binary[idx1] === binary[idx2]) {
                    verticalSym++;
                }
            }
        }
        
        return [
            horizontalSym / count,
            verticalSym / count,
            (horizontalSym + verticalSym) / (2 * count),
            Math.abs(horizontalSym - verticalSym) / count
        ];
    }
    
    detectCorners(imageData) {
        const corners = [];
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        const gridSize = 4;
        const cellWidth = Math.floor(width / gridSize);
        const cellHeight = Math.floor(height / gridSize);
        
        for (let gy = 0; gy < gridSize; gy++) {
            for (let gx = 0; gx < gridSize; gx++) {
                let cornerScore = 0;
                
                for (let y = gy * cellHeight + 1; y < Math.min((gy + 1) * cellHeight, height - 1); y++) {
                    for (let x = gx * cellWidth + 1; x < Math.min((gx + 1) * cellWidth, width - 1); x++) {
                        const idx = (y * width + x) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        
                        const neighbors = [
                            ((y - 1) * width + (x - 1)) * 4,
                            ((y - 1) * width + x) * 4,
                            ((y - 1) * width + (x + 1)) * 4,
                            (y * width + (x - 1)) * 4,
                            (y * width + (x + 1)) * 4,
                            ((y + 1) * width + (x - 1)) * 4,
                            ((y + 1) * width + x) * 4,
                            ((y + 1) * width + (x + 1)) * 4
                        ];
                        
                        let diff = 0;
                        neighbors.forEach(nIdx => {
                            if (nIdx >= 0 && nIdx < data.length) {
                                const nGray = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
                                diff += Math.abs(gray - nGray);
                            }
                        });
                        
                        if (diff > 400) cornerScore++;
                    }
                }
                
                corners.push(cornerScore / 100);
            }
        }
        
        const maxCorners = corners.length > 0 ? Math.max(...corners) : 0;
        const avgCorners = corners.length > 0 ? corners.reduce((a, b) => a + b, 0) / corners.length : 0;
        
        corners.push(maxCorners / 10);
        
        while (corners.length < 17) corners.push(0);
        return corners.slice(0, 17);
    }
    
    // 유사도 계산 - 패턴 가중치 대폭 강화!
    calculateWeightedSimilarity(vec1, vec2) {
        if (!vec1 || !vec2) return 0;
        if (vec1.length !== vec2.length) return 0;
        if (vec1.length !== 544) return 0;
        
        // 패턴을 최우선으로 하는 새로운 가중치
        const weights = {
            color: 0.15,    // 색상: 15% (대폭 감소)
            edge: 0.20,     // 엣지: 20% (감소)
            pattern: 0.50,  // 패턴: 50% (대폭 증가!)
            shape: 0.15     // 형태: 15%
        };
        
        const ranges = {
            color: [0, 256],
            edge: [256, 384],
            pattern: [384, 512],
            shape: [512, 544]
        };
        
        const similarities = {};
        
        for (const [feature, [start, end]] of Object.entries(ranges)) {
            const sim = this.cosineSimilarity(
                vec1.slice(start, end),
                vec2.slice(start, end)
            );
            similarities[feature] = isNaN(sim) ? 0 : sim;
        }
        
        // 디버그 로그 (상위 결과만)
        const totalSim = 
            similarities.color * weights.color +
            similarities.edge * weights.edge +
            similarities.pattern * weights.pattern +
            similarities.shape * weights.shape;
        
        if (totalSim > 0.8) {
            this.addDebugLog(
                `고유사도 - 색상:${(similarities.color*100).toFixed(0)}% 패턴:${(similarities.pattern*100).toFixed(0)}%`,
                'warning'
            );
        }
        
        return isNaN(totalSim) ? 0 : Math.max(0, Math.min(1, totalSim));
    }
    
    cosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            const v1 = vec1[i] || 0;
            const v2 = vec2[i] || 0;
            
            if (!isNaN(v1) && !isNaN(v2) && isFinite(v1) && isFinite(v2)) {
                dotProduct += v1 * v2;
                norm1 += v1 * v1;
                norm2 += v2 * v2;
            }
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        const result = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        return isNaN(result) || !isFinite(result) ? 0 : result;
    }
    
    async testFeatureExtraction() {
        this.addDebugLog('=== 패턴 강화 특징 추출 테스트 v17.3 ===', 'critical');
        
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        const testCases = [
            { name: '검정', color: 'black' },
            { name: '샤넬패턴', pattern: 'chanel' },
            { name: 'LV패턴', pattern: 'lv' },
            { name: '베이지', color: '#F5DEB3' }
        ];
        
        const vectors = [];
        
        for (const test of testCases) {
            if (test.pattern === 'chanel') {
                // 샤넬 퀼팅 패턴
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, 100, 100);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                
                for (let i = 0; i < 100; i += 20) {
                    for (let j = 0; j < 100; j += 20) {
                        ctx.beginPath();
                        ctx.moveTo(i + 10, j);
                        ctx.lineTo(i + 20, j + 10);
                        ctx.lineTo(i + 10, j + 20);
                        ctx.lineTo(i, j + 10);
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            } else if (test.pattern === 'lv') {
                // LV 모노그램 패턴
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(0, 0, 100, 100);
                ctx.fillStyle = '#D4AF37';
                ctx.font = '12px Arial';
                
                for (let y = 10; y < 100; y += 25) {
                    for (let x = 10; x < 100; x += 25) {
                        ctx.fillText('LV', x, y);
                    }
                }
            } else {
                ctx.fillStyle = test.color || test.name;
                ctx.fillRect(0, 0, 100, 100);
            }
            
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const features = await this.extractHybridFeatures(imageData, canvas);
            
            vectors.push({ name: test.name, features });
            
            this.addDebugLog(`${test.name}: ${features.length}차원`, 'info');
        }
        
        this.addDebugLog('패턴 강화 유사도 (가중치: 패턴 50%):', 'critical');
        for (let i = 0; i < vectors.length; i++) {
            for (let j = i + 1; j < vectors.length; j++) {
                const sim = this.calculateWeightedSimilarity(
                    vectors[i].features,
                    vectors[j].features
                );
                const color = sim > 0.7 ? 'error' : sim > 0.5 ? 'warning' : 'success';
                this.addDebugLog(
                    `  ${vectors[i].name} vs ${vectors[j].name}: ${(sim * 100).toFixed(1)}%`,
                    color
                );
            }
        }
    }
    
    async validateDatabase() {
        if (this.imageDatabase.length < 2) {
            this.addDebugLog('DB가 비어있습니다.', 'warning');
            return;
        }
        
        this.addDebugLog('=== DB 검증 ===', 'critical');
        
        const sampleSize = Math.min(5, this.imageDatabase.length);
        const similarities = [];
        
        for (let i = 0; i < sampleSize; i++) {
            for (let j = i + 1; j < sampleSize; j++) {
                const sim = this.calculateWeightedSimilarity(
                    this.imageDatabase[i].features,
                    this.imageDatabase[j].features
                );
                similarities.push(sim);
                
                this.addDebugLog(
                    `${i+1} vs ${j+1}: ${(sim * 100).toFixed(1)}%`,
                    sim > 0.9 ? 'error' : 'info'
                );
            }
        }
        
        const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        const range = Math.max(...similarities) - Math.min(...similarities);
        
        this.addDebugLog(`평균: ${(avgSim * 100).toFixed(1)}%, 범위: ${(range * 100).toFixed(1)}%`, 'critical');
        
        if (range < 0.3) {
            this.addDebugLog('⚠️ 다양성 부족!', 'error');
        } else {
            this.addDebugLog('✅ 특징 다양성 정상', 'success');
        }
    }
    
    setupEventListeners() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMode(e.currentTarget.dataset.mode);
            });
        });
        
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.selectImageFile();
            });
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '#e3f2fd';
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '';
            });
            
            uploadArea.addEventListener('drop', async (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '';
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        await this.handleImageDataUrl(event.target.result, files[0].name);
                    };
                    reader.readAsDataURL(files[0]);
                }
            });
        }
        
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchSimilarImages());
        }
        
        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => this.selectFolder());
        }
        
        const clearDbBtn = document.getElementById('clear-db-btn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', () => this.clearAndReload());
        }
    }
    
    async selectImageFile() {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Image',
                    extensions: ['png', 'jpeg', 'jpg', 'gif', 'webp']
                }]
            });
            
            if (selected) {
                this.addDebugLog(`파일 선택: ${selected}`, 'info');
                const imageData = await readBinaryFile(selected);
                const blob = new Blob([imageData]);
                const dataUrl = await this.blobToDataURL(blob);
                const fileName = selected.split('\\').pop().split('/').pop();
                await this.handleImageDataUrl(dataUrl, fileName);
            }
        } catch (error) {
            this.addDebugLog(`파일 선택 실패: ${error.message}`, 'error');
        }
    }
    
    async handleImageDataUrl(dataUrl, fileName) {
        this.addDebugLog(`이미지 로드: ${fileName}`, 'info');
        
        const imgElement = document.getElementById('uploaded-image');
        const previewSection = document.getElementById('preview-section');
        
        if (imgElement && previewSection) {
            imgElement.src = dataUrl;
            imgElement.style.display = 'block';
            previewSection.style.display = 'block';
        }
        
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const maxSize = 200;
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            const features = await this.extractHybridFeatures(imageData, canvas);
            
            this.uploadedImage = {
                fileName: fileName,
                features: features,
                element: img
            };
            
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.disabled = false;
                searchBtn.style.opacity = '1';
            }
            
            this.addDebugLog(`✅ 이미지 준비 완료 (${features.length}차원)`, 'success');
        };
        
        img.src = dataUrl;
    }
    
    async searchSimilarImages() {
        if (!this.uploadedImage) {
            alert('이미지를 업로드해주세요.');
            return;
        }
        
        this.addDebugLog('검색 시작 (패턴 우선)...', 'info');
        this.showLoading('유사 이미지 검색 중...');
        
        try {
            const queryVector = this.uploadedImage.features;
            
            this.addDebugLog(`쿼리 벡터: ${queryVector.length}차원`, 'info');
            
            const results = [];
            
            for (const img of this.imageDatabase) {
                const similarity = this.calculateWeightedSimilarity(queryVector, img.features);
                results.push({
                    ...img,
                    similarity: similarity
                });
            }
            
            results.sort((a, b) => b.similarity - a.similarity);
            
            if (results.length > 0) {
                const sims = results.map(r => r.similarity);
                const maxSim = Math.max(...sims);
                const minSim = Math.min(...sims);
                const range = maxSim - minSim;
                
                this.addDebugLog('유사도 통계:', 'critical');
                this.addDebugLog(`  최대: ${(maxSim * 100).toFixed(1)}%`, 'info');
                this.addDebugLog(`  최소: ${(minSim * 100).toFixed(1)}%`, 'info');
                this.addDebugLog(`  범위: ${(range * 100).toFixed(1)}%`, range < 0.3 ? 'error' : 'success');
                
                this.addDebugLog('상위 5개 결과:', 'info');
                results.slice(0, 5).forEach((r, i) => {
                    this.addDebugLog(`  ${i+1}. ${r.name}: ${(r.similarity * 100).toFixed(1)}%`, 'info');
                });
            }
            
            await this.displayResults(results);
            
        } catch (error) {
            this.addDebugLog(`❌ 검색 실패: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
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
                this.addDebugLog(`폴더 선택: ${selected}`, 'info');
                await this.indexFolder(selected);
            }
        } catch (error) {
            this.addDebugLog(`폴더 선택 실패: ${error.message}`, 'error');
        }
    }
    
    async indexFolder(folderPath) {
        this.showLoading('이미지 인덱싱 중...');
        this.addDebugLog(`=== 패턴 강화 인덱싱 시작 v17.3 ===`, 'critical');
        
        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const images = [];
            
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
            this.addDebugLog(`${images.length}개 이미지 발견`, 'info');
            
            this.imageDatabase = [];
            
            let processed = 0;
            const testVectors = [];
            
            for (const imageInfo of images) {
                try {
                    const imageData = await readBinaryFile(imageInfo.path);
                    const blob = new Blob([imageData]);
                    const dataUrl = await this.blobToDataURL(blob);
                    
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = dataUrl;
                    });
                    
                    const canvas = document.createElement('canvas');
                    const maxSize = 200;
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imageDataCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    const featureVector = await this.extractHybridFeatures(imageDataCanvas, canvas);
                    
                    if (processed < 3) {
                        this.addDebugLog(`이미지 ${processed + 1}: ${imageInfo.name}`, 'info');
                        
                        if (testVectors.length > 0) {
                            const sim = this.calculateWeightedSimilarity(
                                featureVector,
                                testVectors[testVectors.length - 1]
                            );
                            this.addDebugLog(`  이전과 유사도: ${(sim * 100).toFixed(1)}%`, 
                                sim > 0.9 ? 'error' : 'success');
                        }
                        
                        testVectors.push(featureVector);
                    }
                    
                    this.imageDatabase.push({
                        name: imageInfo.name,
                        path: imageInfo.path,
                        features: featureVector
                    });
                    
                    URL.revokeObjectURL(dataUrl);
                    
                    processed++;
                    
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱 중... ${processed}/${images.length} (${progress}%)`);
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                    
                } catch (error) {
                    this.addDebugLog(`실패: ${imageInfo.name} - ${error.message}`, 'error');
                    processed++;
                }
            }
            
            if (testVectors.length >= 2) {
                const finalSim = this.calculateWeightedSimilarity(testVectors[0], testVectors[1]);
                this.addDebugLog(`최종 검증 유사도: ${(finalSim * 100).toFixed(1)}%`, 
                    finalSim > 0.9 ? 'error' : 'success');
            }
            
            await this.saveDatabase();
            
            this.addDebugLog(`✅ 패턴 강화 인덱싱 완료: ${this.imageDatabase.length}개`, 'success');
            alert(`인덱싱 완료!\n${this.imageDatabase.length}개의 이미지가 인덱싱되었습니다.`);
            
        } catch (error) {
            this.addDebugLog(`❌ 인덱싱 실패: ${error.message}`, 'error');
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
            
            const hue = 120 * result.similarity;
            resultItem.style.cssText = `
                border: 3px solid hsl(${hue}, 100%, 50%);
                border-radius: 8px;
                overflow: hidden;
                margin: 10px;
                display: inline-block;
                width: 200px;
                vertical-align: top;
                transition: all 0.3s;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData]);
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;">
                    <div style="padding: 10px; background: white;">
                        <div style="font-size: 12px; overflow: hidden; text-overflow: ellipsis;">
                            ${result.name}
                        </div>
                        <div style="font-size: 24px; font-weight: bold; color: hsl(${hue}, 100%, 40%);">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
                
                resultItem.onmouseover = () => {
                    resultItem.style.transform = 'scale(1.05)';
                    resultItem.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                };
                
                resultItem.onmouseout = () => {
                    resultItem.style.transform = '';
                    resultItem.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                };
                
            } catch (error) {
                resultItem.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <div>${result.name}</div>
                        <div style="font-size: 24px; font-weight: bold;">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            }
            
            resultsContainer.appendChild(resultItem);
        }
        
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }
    
    async blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    async saveDatabase() {
        try {
            await this.storage.setItem('imageDatabase', this.imageDatabase);
            await this.storage.setItem('version', this.version);
            this.addDebugLog('DB 저장 완료', 'success');
        } catch (error) {
            this.addDebugLog(`DB 저장 실패: ${error.message}`, 'error');
        }
    }
    
    async loadDatabase() {
        try {
            const version = await this.storage.getItem('version');
            const imageDb = await this.storage.getItem('imageDatabase');
            
            if (imageDb && version === this.version) {
                this.imageDatabase = imageDb;
                this.addDebugLog(`DB 로드: ${this.imageDatabase.length}개 이미지`, 'success');
            } else {
                this.addDebugLog('새 버전 - DB 초기화 필요', 'warning');
            }
        } catch (error) {
            this.addDebugLog(`DB 로드 실패: ${error.message}`, 'error');
        }
    }
    
    async clearAndReload() {
        if (confirm('모든 데이터를 삭제하고 새로 시작하시겠습니까?')) {
            this.addDebugLog('완전 초기화 시작...', 'critical');
            
            await this.storage.clear();
            this.imageDatabase = [];
            
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
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
        
        this.addDebugLog(`모드 전환: ${mode}`, 'info');
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
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 Fashion Search v17.3 - Enhanced');
    
    const style = document.createElement('style');
    style.textContent = `
        .mode-content { display: none; }
        .mode-content.active { display: block; }
        .mode-btn.active { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
        }
        #upload-area { 
            transition: all 0.3s; 
            cursor: pointer;
            background: white;
            border: 2px dashed #ccc;
        }
        #upload-area:hover { 
            border-color: #667eea; 
            transform: scale(1.02);
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .result-item:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
    
    new FashionSearchEnhanced();
});