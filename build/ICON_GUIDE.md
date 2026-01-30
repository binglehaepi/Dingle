# 📱 앱 아이콘 가이드

## 필요한 아이콘 파일

### macOS (.icns)
**파일명**: `icon.icns`  
**위치**: `build/icon.icns`

**생성 방법**:

#### 옵션 1: 온라인 도구 (가장 간단)
1. 512x512 또는 1024x1024 PNG 이미지 준비
2. https://cloudconvert.com/png-to-icns 방문
3. PNG 업로드 → ICNS 변환
4. 다운로드한 파일을 `build/icon.icns`에 저장

#### 옵션 2: 맥 터미널 (Mac에서만)
```bash
# 1. 512x512 PNG 이미지를 icon.png로 저장
# 2. 다음 명령어 실행:

mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

iconutil -c icns icon.iconset
mv icon.icns build/
```

---

### Windows (.ico)
**파일명**: `icon.ico`  
**위치**: `build/icon.ico`

**생성 방법**:

#### 옵션 1: 온라인 도구
1. 256x256 이상 PNG 이미지 준비
2. https://convertio.co/png-ico/ 방문
3. PNG 업로드 → ICO 변환 (256x256 선택)
4. 다운로드한 파일을 `build/icon.ico`에 저장

#### 옵션 2: ImageMagick (크로스 플랫폼)
```bash
# ImageMagick 설치 후:
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

---

### Linux (.png)
**파일명**: `icon.png`  
**위치**: `build/icon.png`

**요구사항**:
- 크기: 512x512 이상
- 포맷: PNG (투명 배경 권장)

단순히 512x512 PNG를 `build/icon.png`에 저장하면 됩니다.

---

## 🎨 아이콘 디자인 가이드

### 권장 사항
- **크기**: 1024x1024 (고해상도)
- **포맷**: PNG (투명 배경)
- **스타일**: 
  - 단순하고 명확한 디자인
  - 앱의 정체성을 나타내는 심볼
  - 작은 크기(16x16)에서도 식별 가능

### Digital Scrap Diary 추천 아이콘
- 📔 일기장 아이콘
- 📸 사진 + 펜 조합
- 🎨 스크랩북 이미지
- 📖 열린 책 + 별

---

## ⚠️ 아이콘 없이 빌드하기

아이콘이 준비되지 않았다면:

1. **임시 방법**: 기본 Electron 아이콘 사용
   ```bash
   # build/ 디렉토리에 아이콘 없이 빌드 가능
   # 경고가 나오지만 빌드는 됩니다
   npm run electron:build:mac
   ```

2. **추후 교체**: 아이콘 준비 후 다시 빌드
   ```bash
   # 아이콘 파일을 build/에 추가
   npm run electron:build:mac
   ```

---

## 🔍 아이콘 확인

빌드 전 아이콘 파일 확인:
```bash
ls -lh build/
# 다음 파일들이 있어야 함:
# icon.icns (Mac)
# icon.ico (Windows)
# icon.png (Linux)
```

---

## 📦 무료 아이콘 리소스

1. **Figma Community**: https://figma.com/community
2. **Flaticon**: https://flaticon.com
3. **Icons8**: https://icons8.com
4. **Font Awesome**: https://fontawesome.com

**주의**: 라이선스 확인 필수!

---

**현재 상태**: 아이콘 파일이 없어도 빌드는 가능하지만, 기본 Electron 아이콘이 사용됩니다.



