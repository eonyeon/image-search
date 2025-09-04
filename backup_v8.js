// 기존 v8.0 백업
const fs = require('fs');
const path = require('path');

// 백업 생성
const sourceFile = path.join(__dirname, 'main.js');
const backupFile = path.join(__dirname, 'main.js.backup_v8');

fs.copyFileSync(sourceFile, backupFile);
console.log('✅ v8.0 백업 완료: main.js.backup_v8');
