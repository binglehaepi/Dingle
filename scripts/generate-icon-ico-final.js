const pngToIco = require('png-to-ico').default || require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function generateIco() {
  console.log('🪟 Windows ICO 아이콘 생성 중...');
  
  try {
    const inputFiles = [
      path.join(__dirname, '../build/icon-16.png'),
      path.join(__dirname, '../build/icon-32.png'),
      path.join(__dirname, '../build/icon-48.png'),
      path.join(__dirname, '../build/icon-64.png'),
      path.join(__dirname, '../build/icon-128.png'),
      path.join(__dirname, '../build/icon-256.png'),
    ];
    
    // 파일 존재 확인
    for (const file of inputFiles) {
      if (!fs.existsSync(file)) {
        console.warn(`⚠️  파일이 없습니다: ${file}`);
        console.log('   먼저 npm run generate:icon을 실행하세요.');
        throw new Error(`파일이 없습니다: ${file}`);
      }
    }
    
    console.log('📦 ICO에 포함될 크기: 16, 32, 48, 64, 128, 256');
    const buf = await pngToIco(inputFiles);
    const outputPath = path.join(__dirname, '../build/icon.ico');
    
    fs.writeFileSync(outputPath, buf);
    
    console.log(`✅ ICO 파일 생성 완료: ${outputPath}`);
    console.log(`📦 크기: ${(buf.length / 1024).toFixed(2)} KB`);
    console.log('');
    console.log('✨ 다음 단계:');
    console.log('   npm run electron:build:win');
  } catch (error) {
    console.error('❌ ICO 생성 실패:', error.message);
    process.exit(1);
  }
}

generateIco();

