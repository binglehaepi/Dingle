# 🚀 최종 빌드 명령어 및 가이드

**작성일**: 2025-12-18 16:00 KST  
**목적**: 실제 실행 파일 생성 및 배포

---

## ✅ 최종 체크리스트

빌드 전 반드시 확인하세요:

### 1. 프로젝트 설정
- [x] `package.json` 메타데이터 확인
  - author, repository URL 수정 완료
- [x] `electron-builder.json` 설정 확인
  - appId, productName 설정 완료
- [x] `.env` 파일 확인 (있다면)
  - API 키 등 환경 변수

### 2. 아이콘 (선택사항)
- [ ] `build/icon.icns` (macOS)
- [ ] `build/icon.ico` (Windows)
- [ ] `build/icon.png` (Linux)

**없어도 빌드 가능**: 기본 Electron 아이콘 사용

### 3. 코드 정리
- [x] Linter 통과 확인
- [x] 불필요한 console.log 제거 (선택사항)
- [x] 주석 정리

---

## 🎯 빌드 명령어

### 터미널에서 실행

```bash
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"
```

---

### 1️⃣ macOS 빌드 (현재 플랫폼 권장)

```bash
# 1. 의존성 설치 (최초 1회)
npm install

# 2. macOS 빌드
npm run electron:build:mac
```

**예상 시간**: 3-5분  
**생성 위치**: `release/` 디렉토리

**생성되는 파일**:
```
release/
├── Digital Scrap Diary-1.0.0-arm64-mac.zip    # Apple Silicon (M1/M2/M3)
├── Digital Scrap Diary-1.0.0-x64-mac.zip      # Intel Mac
├── Digital Scrap Diary-1.0.0-arm64.dmg        # Apple Silicon 인스톨러 ⭐
└── Digital Scrap Diary-1.0.0-x64.dmg          # Intel 인스톨러
```

**테스트**:
```bash
# DMG 파일 열기
open "release/Digital Scrap Diary-1.0.0-arm64.dmg"
```

---

### 2️⃣ Windows 빌드 (크로스 플랫폼)

⚠️ **주의**: macOS에서 Windows 빌드는 Wine 필요

```bash
# Wine 설치 (Homebrew 사용)
brew install --cask wine-stable

# Windows 빌드
npm run electron:build:win
```

**예상 시간**: 5-8분

**생성되는 파일**:
```
release/
├── Digital Scrap Diary Setup 1.0.0.exe        # 인스톨러 ⭐
└── Digital Scrap Diary 1.0.0.exe              # 포터블 버전
```

---

### 3️⃣ Linux 빌드

```bash
npm run electron:build:linux
```

**예상 시간**: 2-4분

**생성되는 파일**:
```
release/
├── Digital-Scrap-Diary-1.0.0.AppImage         # 범용 실행 파일 ⭐
└── digital-scrap-diary_1.0.0_amd64.deb        # Debian/Ubuntu 패키지
```

---

### 4️⃣ 모든 플랫폼 한 번에

```bash
npm run electron:build
```

⚠️ **주의**: 
- macOS 빌드는 macOS에서만 가능
- Windows 빌드는 Wine 필요
- 총 소요 시간: 10-15분

---

## 📦 빌드 결과 확인

### 생성된 파일 목록 보기
```bash
ls -lh release/
```

**예상 출력**:
```
-rw-r--r--  Digital Scrap Diary-1.0.0-arm64.dmg     (85 MB)
-rw-r--r--  Digital Scrap Diary-1.0.0-x64.dmg       (90 MB)
-rw-r--r--  Digital Scrap Diary-1.0.0-arm64-mac.zip (80 MB)
-rw-r--r--  Digital Scrap Diary-1.0.0-x64-mac.zip   (85 MB)
```

### 파일 용량 체크
```bash
du -sh release/*
```

---

## 🧪 로컬 테스트

### macOS
```bash
# 방법 1: DMG 열기
open "release/Digital Scrap Diary-1.0.0-arm64.dmg"

# 방법 2: ZIP 압축 해제 후 실행
unzip "release/Digital Scrap Diary-1.0.0-arm64-mac.zip" -d test/
open test/Digital\ Scrap\ Diary.app
```

### Windows (Wine 사용)
```bash
wine "release/Digital Scrap Diary Setup 1.0.0.exe"
```

### Linux
```bash
chmod +x "release/Digital-Scrap-Diary-1.0.0.AppImage"
./release/Digital-Scrap-Diary-1.0.0.AppImage
```

---

## 🐛 빌드 오류 해결

### 에러 1: "Cannot find module 'electron'"
```bash
rm -rf node_modules package-lock.json
npm install
```

### 에러 2: "EACCES: permission denied"
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
```

### 에러 3: "vite build failed"
```bash
rm -rf node_modules/.vite dist
npm run build
```

### 에러 4: "electron:compile failed"
```bash
rm -rf dist-electron
npm run electron:compile
```

### 에러 5: "Icon not found" (경고)
```
⚠️ 이 경고는 무시 가능합니다
기본 Electron 아이콘이 사용됩니다
```

---

## 📤 GitHub Releases 업로드

### 수동 업로드

1. **GitHub 저장소 생성** (아직 안 했다면):
   ```bash
   git init
   git add .
   git commit -m "Initial release"
   git remote add origin https://github.com/yourusername/digitalscrapdiary.git
   git branch -M main
   git push -u origin main
   ```

2. **GitHub에서 Release 생성**:
   - GitHub 저장소 → **Releases** → **Draft a new release**
   - Tag: `v1.0.0`
   - Title: `Digital Scrap Diary v1.0.0`
   - Description: 릴리스 노트 작성

3. **파일 업로드**:
   - `release/` 디렉토리의 모든 파일을 드래그앤드롭
   - 또는 터미널에서:
   ```bash
   # GitHub CLI 사용 (설치 필요: brew install gh)
   gh release create v1.0.0 release/* --title "v1.0.0" --notes "First official release"
   ```

4. **Publish release** 클릭

---

### 자동 배포 (GitHub Actions)

1. **저장소에 푸시**:
   ```bash
   git add .
   git commit -m "feat: Add deployment configuration"
   git push origin main
   ```

2. **버전 태그 생성 및 푸시**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **GitHub Actions 자동 실행**:
   - GitHub → **Actions** 탭에서 진행 상황 확인
   - 완료 후 **Releases** 탭에서 파일 확인

---

## 🎨 아이콘 추가 (선택사항)

### 간단한 방법: 온라인 도구

1. **1024x1024 PNG 이미지 준비**

2. **ICNS 변환** (macOS):
   - https://cloudconvert.com/png-to-icns
   - 다운로드 → `build/icon.icns`에 저장

3. **ICO 변환** (Windows):
   - https://convertio.co/png-ico/
   - 256x256 선택
   - 다운로드 → `build/icon.ico`에 저장

4. **PNG 복사** (Linux):
   ```bash
   cp your-icon.png build/icon.png
   ```

5. **다시 빌드**:
   ```bash
   npm run electron:build:mac
   ```

---

## 📋 릴리스 노트 템플릿

**GitHub Release 설명에 사용**:

```markdown
# Digital Scrap Diary v1.0.0

## 🎉 첫 번째 공식 릴리스

### ✨ 주요 기능
- 💾 파일 시스템 기반 자동 저장
- 🕐 버전 히스토리 & 백업 관리
- 📤 PNG/PDF 고급 내보내기
- 🛡️ 안전 모드 (SNS 임베드 제외)
- 🏷️ 커스텀 워터마크
- 📱 모바일/태블릿 반응형 디자인

### 📥 다운로드

#### macOS
- **Apple Silicon (M1/M2/M3)**: [Digital Scrap Diary-1.0.0-arm64.dmg](링크)
- **Intel Mac**: [Digital Scrap Diary-1.0.0-x64.dmg](링크)

#### Windows
- **인스톨러**: [Digital Scrap Diary Setup 1.0.0.exe](링크)
- **포터블**: [Digital Scrap Diary 1.0.0.exe](링크)

#### Linux
- **AppImage**: [Digital-Scrap-Diary-1.0.0.AppImage](링크)
- **Debian/Ubuntu**: [digital-scrap-diary_1.0.0_amd64.deb](링크)

### 📖 설치 방법
README.md의 설치 가이드를 참조하세요.

### ⚠️ 알려진 이슈
- macOS: 첫 실행 시 "확인되지 않은 개발자" 경고 → 우클릭 → 열기
- Windows: "Windows의 PC 보호" 경고 → 추가 정보 → 실행

### 🙏 감사합니다
피드백과 버그 리포트는 [Issues](링크)에서 환영합니다!
```

---

## 🎯 최종 명령어 요약

```bash
# 1. 프로젝트 디렉토리로 이동
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"

# 2. 의존성 설치 (최초 1회)
npm install

# 3. macOS 빌드 (권장)
npm run electron:build:mac

# 4. 결과 확인
ls -lh release/

# 5. 테스트
open "release/Digital Scrap Diary-1.0.0-arm64.dmg"

# 6. GitHub에 업로드 (수동)
# - GitHub Releases → Draft a new release → 파일 업로드

# 또는 GitHub CLI 사용
gh release create v1.0.0 release/* --title "v1.0.0" --notes "First official release"
```

---

## 📞 지원

문제가 발생하면:
1. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 참조
2. [CODE_SIGNING_GUIDE.md](CODE_SIGNING_GUIDE.md) 참조
3. [GitHub Issues](https://github.com/yourusername/digitalscrapdiary/issues) 생성

---

**작성일**: 2025-12-18 16:00 KST  
**최종 업데이트**: 2025-12-18 16:00 KST

**🎉 빌드 성공을 기원합니다!**



