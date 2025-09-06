// v18.0 Alternative - 파일 다중 선택 버전
// Tauri 환경에서 폴더 선택이 안 될 때 사용

function addAlternativeButtons() {
    const indexMode = document.getElementById('indexMode');
    if (!indexMode) return;
    
    // 대체 버튼 추가
    const altButton = document.createElement('button');
    altButton.textContent = '🖼️ 이미지 파일 선택 (다중)';
    altButton.style.cssText = `
        padding: 12px 24px;
        margin: 10px;
        background: linear-gradient(135deg, #ff6b6b, #ff8787);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
    `;
    
    altButton.onclick = function() {
        console.log('🖼️ 다중 파일 선택 모드');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            console.log(`📸 ${files.length}개 이미지 선택됨`);
            
            if (files.length > 0) {
                // 선택된 파일 정보 표시
                const fileList = files.map(f => `${f.name} (${(f.size/1024).toFixed(1)}KB)`);
                console.log('선택된 파일:', fileList);
                
                // 인덱싱 시작
                if (window.app && window.app.indexImages) {
                    try {
                        await window.app.indexImages(files);
                    } catch (error) {
                        console.error('인덱싱 오류:', error);
                        alert('인덱싱 중 오류가 발생했습니다: ' + error.message);
                    }
                } else {
                    console.error('app.indexImages 함수를 찾을 수 없습니다');
                }
            }
        };
        
        input.click();
    };
    
    // 버튼 추가
    const folderBtn = document.getElementById('selectFolderBtn');
    if (folderBtn && folderBtn.parentNode) {
        folderBtn.parentNode.insertBefore(altButton, folderBtn.nextSibling);
    }
    
    // Drag & Drop 영역 추가
    const dropZone = document.createElement('div');
    dropZone.innerHTML = `
        <div style="
            border: 3px dashed #ff6b6b;
            border-radius: 15px;
            padding: 40px;
            margin: 20px 0;
            text-align: center;
            background: #fff5f5;
            transition: all 0.3s;
        " id="dropZone">
            <h3>🎯 이미지 드래그 & 드롭</h3>
            <p>여러 이미지를 한 번에 드래그해서 놓으세요</p>
        </div>
    `;
    
    indexMode.appendChild(dropZone);
    
    const zone = document.getElementById('dropZone');
    
    zone.ondragover = (e) => {
        e.preventDefault();
        zone.style.background = '#ffe0e0';
        zone.style.transform = 'scale(1.02)';
    };
    
    zone.ondragleave = (e) => {
        e.preventDefault();
        zone.style.background = '#fff5f5';
        zone.style.transform = 'scale(1)';
    };
    
    zone.ondrop = async (e) => {
        e.preventDefault();
        zone.style.background = '#fff5f5';
        zone.style.transform = 'scale(1)';
        
        const files = Array.from(e.dataTransfer.files).filter(f => 
            f.type.startsWith('image/')
        );
        
        console.log(`🎯 ${files.length}개 이미지 드롭됨`);
        
        if (files.length > 0 && window.app && window.app.indexImages) {
            try {
                await window.app.indexImages(files);
            } catch (error) {
                console.error('인덱싱 오류:', error);
            }
        }
    };
}

// 페이지 로드 후 실행
setTimeout(addAlternativeButtons, 2000);

console.log('✅ 대체 파일 선택 버튼 추가됨');
