const fs = require('fs');
const path = require('path');

const WEBP_PATH = path.join(__dirname, '../public/coconut_brown_460.webp');
const BUILD_DIR = path.join(__dirname, '../build');

// 생성할 아이콘 크기들
const ICON_SIZES = [16, 32, 48, 64, 128, 256, 1024];

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
    
    // build 디렉토리 확인
    if (!fs.existsSync(BUILD_DIR)) {
      fs.mkdirSync(BUILD_DIR, { recursive: true });
    }
    
    // 각 크기별로 아이콘 생성
    for (const size of ICON_SIZES) {
      const outputPath = path.join(BUILD_DIR, `icon-${size}.png`);
      
      await sharp(WEBP_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // 투명 배경
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${size}x${size} 아이콘 생성: icon-${size}.png`);
    }
    
    // icon.png (1024x1024)를 메인 아이콘으로 복사
    const mainIconPath = path.join(BUILD_DIR, 'icon.png');
    fs.copyFileSync(path.join(BUILD_DIR, 'icon-1024.png'), mainIconPath);
    console.log(`✅ 메인 아이콘 생성: icon.png`);
    
    console.log('');
    console.log('🎉 모든 아이콘 생성 완료!');
    console.log('');
    console.log('다음 단계:');
    console.log('1. node scripts/generate-icon-ico-final.js (Windows ICO 생성)');
    console.log('2. npm run electron:build:win (빌드)');
    
  } catch (error) {
    console.error('❌ 아이콘 생성 실패:', error.message);
    console.log('');
    console.log('대안: 수동 변환');
    console.log('1. public/coconut_brown_460.webp를 이미지 편집기로 열기');
    console.log('2. 각 크기별로 PNG로 저장');
    console.log('3. build/ 디렉토리로 복사');
    process.exit(1);
  }
}

generateIcon();

