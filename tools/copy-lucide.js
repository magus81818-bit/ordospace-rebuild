/* ============================================================
   [이 파일은] Lucide 아이콘 라이브러리를 node_modules에서 app/vendor/로 복사하는
                빌드 보조 스크립트. 번들러 없이 아이콘을 사용하기 위한 수동 복사 도구.
   [언제 실행] npm install 후 아이콘 업데이트가 필요할 때 수동 실행
   [수정할 때 주의] lucide 패키지 구조가 바뀌면 source 경로 확인 필요.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'node_modules', 'lucide', 'dist', 'umd', 'lucide.min.js');
const targetDir = path.join(root, 'app', 'vendor', 'lucide');
const target = path.join(targetDir, 'lucide.min.js');

if (!fs.existsSync(source)) {
  throw new Error(`Lucide UMD bundle not found: ${source}`);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Copied ${path.relative(root, source)} -> ${path.relative(root, target)}`);
