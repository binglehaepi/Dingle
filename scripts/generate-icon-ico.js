const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../build/icon.png');
const outputDir = path.join(__dirname, '../build');

async function generateIco() {
  console.log('🪟 Windows 아이콘 생성 중...');
  
  try {
    // 여러 크기의 PNG 생성 (ICO는 여러 크기 포함)
    const sizes = [16, 32, 48, 64, 128, 256];
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}.png`);
      await sharp(inputPath)
        .resize(size, size)
        .toFile(outputPath);
      console.log(`✅ ${size}x${size} PNG 생성: icon-${size}.png`);
    }
    
    console.log('\n📝 다음 단계:');
    console.log('1. electron-builder는 build/icon.png에서 자동으로 icon.ico를 생성합니다');
    console.log('2. 또는 https://convertio.co/png-ico/ 에서 수동 변환');
    console.log('3. 빌드 실행: npm run electron:build:win\n');
    
  } catch (error) {
    console.error('❌ 실패:', error);
  }
}

generateIco();

