const fs = require('fs');
const path = require('path');

const WEBP_PATH = path.join(__dirname, '../public/coconut_brown_460.webp');
const OUTPUT_PATH = path.join(__dirname, '../build/icon.png');
const ICON_SIZE = 1024;

async function generateIcon() {
  try {
    console.log('🥥 코코넛 아이콘 생성 중...');
    
    // sharp 패키지를 동적으로 로드 시도
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.log('⚠️  sharp 패키지가 설치되어 있지 않습니다.');
      console.log('📦 설치 중... npm install --save-dev sharp');
      console.log('');
      
      // sharp 설치 명령 실행
      const { execSync } = require('child_process');
      execSync('npm install --save-dev sharp', { stdio: 'inherit' });
      
      // 다시 로드
      sharp = require('sharp');
    }
    
    // WEBP를 PNG로 변환 (1024x1024, 흰색 배경)
    await sharp(WEBP_PATH)
      .resize(ICON_SIZE, ICON_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(OUTPUT_PATH);
    
    console.log(`✅ 아이콘 생성 완료: ${OUTPUT_PATH}`);
    console.log(`📦 크기: ${ICON_SIZE}x${ICON_SIZE}`);
    console.log('');
    console.log('다음 단계:');
    console.log('1. 앱 재시작하여 트레이 아이콘 확인');
    console.log('2. electron-builder로 빌드하면 .ico/.icns 자동 생성');
    
  } catch (error) {
    console.error('❌ 아이콘 생성 실패:', error.message);
    console.log('');
    console.log('대안: 수동 변환');
    console.log('1. public/coconut_brown_460.webp를 이미지 편집기로 열기');
    console.log('2. 1024x1024 PNG로 저장');
    console.log('3. build/icon.png로 복사');
    process.exit(1);
  }
}

generateIcon();

