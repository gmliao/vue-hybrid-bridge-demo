const fs = require('fs')
const path = require('path')

// 準備 GitHub Pages 部署目錄結構
const distDir = path.join(__dirname, '../dist')
const vue3Dist = path.join(__dirname, '../packages/vue3-host/dist')
const vue2Dist = path.join(__dirname, '../packages/vue2-legacy/dist')

// 創建 dist 目錄
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// 複製 Vue3 Host 到根目錄
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// 複製 Vue3 Host
if (fs.existsSync(vue3Dist)) {
  copyDir(vue3Dist, distDir)
  console.log('✅ Copied Vue3 Host to dist/')
}

// 創建 legacy 目錄並複製 Vue2 Legacy
const legacyDir = path.join(distDir, 'legacy')
if (fs.existsSync(vue2Dist)) {
  copyDir(vue2Dist, legacyDir)
  console.log('✅ Copied Vue2 Legacy to dist/legacy/')
}

// 創建 .nojekyll 文件
const nojekyllPath = path.join(distDir, '.nojekyll')
fs.writeFileSync(nojekyllPath, '')
console.log('✅ Created .nojekyll file')

console.log('✅ GitHub Pages deployment directory prepared!')

