# 🚀 Digital Scrap Diary - 배포 가이드

**작성일**: 2025-12-18 15:45 KST  
**버전**: 1.0.0

---

## 📋 목차

1. [로컬 빌드](#로컬-빌드)
2. [GitHub Releases 자동 배포](#github-releases-자동-배포)
3. [코드 서명 (선택사항)](#코드-서명)
4. [보안 경고 우회 방법](#보안-경고-우회-방법)
5. [트러블슈팅](#트러블슈팅)

---

## 1️⃣ 로컬 빌드

### 사전 준비

#### 1. 아이콘 준비 (선택사항)
아이콘이 없어도 빌드는 가능하지만, 전문적인 외관을 위해 권장합니다.

```bash
# 아이콘 가이드 확인
cat build/ICON_GUIDE.md
```

**필요한 파일**:
- `build/icon.icns` (macOS)
- `build/icon.ico` (Windows)
- `build/icon.png` (Linux)

#### 2. package.json 확인
`package.json`에서 다음 정보를 수정하세요:

```json
{
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/digitalscrapdiary.git"
  }
}
```

---

### macOS 빌드

```bash
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"

# 1. 의존성 설치 (최초 1회)
npm install

# 2. macOS 빌드 실행
npm run electron:build:mac
```

**생성되는 파일**:
```
release/
├── Digital Scrap Diary-1.0.0-arm64-mac.zip    # Apple Silicon (M1/M2)
├── Digital Scrap Diary-1.0.0-x64-mac.zip      # Intel Mac
├── Digital Scrap Diary-1.0.0-arm64.dmg        # Apple Silicon 인스톨러
└── Digital Scrap Diary-1.0.0-x64.dmg          # Intel 인스톨러
```

**설치 방법**:
1. `.dmg` 파일 더블클릭
2. 앱을 Applications 폴더로 드래그
3. 첫 실행 시: **우클릭 → 열기** (보안 경고 우회)

---

### Windows 빌드

```bash
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"

# Windows 빌드 실행
npm run electron:build:win
```

**생성되는 파일**:
```
release/
├── Digital Scrap Diary Setup 1.0.0.exe        # 인스톨러
└── Digital Scrap Diary 1.0.0.exe              # 포터블 버전 (설치 불필요)
```

**설치 방법**:
1. `.exe` 파일 더블클릭
2. "Windows의 PC 보호" 경고 시:
   - "추가 정보" 클릭
   - "실행" 클릭

---

### Linux 빌드

```bash
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"

# Linux 빌드 실행
npm run electron:build:linux
```

**생성되는 파일**:
```
release/
├── Digital-Scrap-Diary-1.0.0.AppImage         # 범용 실행 파일
└── digital-scrap-diary_1.0.0_amd64.deb        # Debian/Ubuntu 패키지
```

**설치 방법**:

**AppImage** (모든 배포판):
```bash
chmod +x Digital-Scrap-Diary-1.0.0.AppImage
./Digital-Scrap-Diary-1.0.0.AppImage
```

**Deb 패키지** (Ubuntu/Debian):
```bash
sudo dpkg -i digital-scrap-diary_1.0.0_amd64.deb
```

---

### 모든 플랫폼 한 번에 빌드

```bash
npm run electron:build
```

⚠️ **주의**: 
- macOS 빌드는 macOS에서만 가능
- Windows 빌드는 Windows에서만 가능 (또는 Wine 사용)
- Linux 빌드는 Linux/macOS에서 가능

---

## 2️⃣ GitHub Releases 자동 배포

### 설정 방법

#### 1. GitHub 저장소 생성
```bash
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"

# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit"

# GitHub 저장소와 연결
git remote add origin https://github.com/yourusername/digitalscrapdiary.git
git branch -M main
git push -u origin main
```

#### 2. GitHub Token 확인
GitHub Actions는 자동으로 `GITHUB_TOKEN`을 제공하므로 별도 설정이 불필요합니다.

#### 3. 릴리스 태그 푸시
```bash
# 버전 태그 생성
git tag v1.0.0

# 태그를 GitHub에 푸시
git push origin v1.0.0
```

#### 4. 자동 빌드 확인
1. GitHub 저장소 → **Actions** 탭
2. "Release Desktop App" 워크플로우 실행 확인
3. 완료 후 **Releases** 탭에서 다운로드 가능

---

### 릴리스 프로세스

```bash
# 1. 코드 변경 후 커밋
git add .
git commit -m "feat: Add new feature"

# 2. 버전 업데이트
npm version patch  # 1.0.0 → 1.0.1
# 또는
npm version minor  # 1.0.0 → 1.1.0
# 또는
npm version major  # 1.0.0 → 2.0.0

# 3. 태그와 함께 푸시
git push --follow-tags

# 4. GitHub Actions가 자동으로 빌드 & 릴리스 생성
```

---

### 수동 릴리스 업로드

GitHub Actions 없이 수동으로 업로드하려면:

1. 로컬에서 빌드:
   ```bash
   npm run electron:build
   ```

2. GitHub → **Releases** → **Draft a new release**

3. 파일 업로드:
   - `release/` 디렉토리의 모든 파일을 드래그앤드롭

4. 릴리스 노트 작성 및 **Publish release**

---

## 3️⃣ 코드 서명 (선택사항)

코드 서명은 보안 경고를 없애고 사용자 신뢰를 높입니다.

### macOS 코드 서명

#### 비용
- **Apple Developer Program**: $99/년

#### 설정 방법

1. **Apple Developer 등록**:
   - https://developer.apple.com/programs/
   - 개인 또는 조직 등록

2. **인증서 발급**:
   - Xcode → Preferences → Accounts → Manage Certificates
   - "Developer ID Application" 인증서 생성

3. **electron-builder.json 수정**:
   ```json
   {
     "mac": {
       "identity": "Developer ID Application: Your Name (TEAM_ID)",
       "hardenedRuntime": true,
       "gatekeeperAssess": false,
       "entitlements": "build/entitlements.mac.plist",
       "entitlementsInherit": "build/entitlements.mac.plist"
     }
   }
   ```

4. **빌드 시 자동 서명**:
   ```bash
   npm run electron:build:mac
   ```

5. **Notarization** (공증):
   ```bash
   # .env 파일에 추가
   APPLE_ID=your-apple-id@example.com
   APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
   ```

   electron-builder.json에 추가:
   ```json
   {
     "afterSign": "scripts/notarize.js"
   }
   ```

---

### Windows 코드 서명

#### 비용
- **Code Signing Certificate**: $80-300/년
  - Sectigo, DigiCert, GlobalSign 등

#### 설정 방법

1. **인증서 구매**:
   - https://www.ksoftware.net (저렴)
   - https://www.digicert.com (프리미엄)

2. **인증서 설치**:
   - `.pfx` 파일 다운로드
   - Windows에 설치 또는 파일로 보관

3. **electron-builder.json 수정**:
   ```json
   {
     "win": {
       "certificateFile": "certs/certificate.pfx",
       "certificatePassword": "password",
       "signingHashAlgorithms": ["sha256"],
       "signDlls": false
     }
   }
   ```

4. **환경 변수 사용 (권장)**:
   ```bash
   # .env 파일
   CSC_LINK=path/to/certificate.pfx
   CSC_KEY_PASSWORD=your-password
   ```

---

## 4️⃣ 보안 경고 우회 방법

### macOS: "확인되지 않은 개발자" 경고

**사용자 가이드** (README에 포함):

```markdown
### macOS 설치 방법

1. `.dmg` 파일 다운로드
2. 앱을 Applications 폴더로 이동
3. **첫 실행 시**:
   - 앱을 더블클릭하면 "확인되지 않은 개발자" 경고 표시
   - **우클릭 (또는 Control + 클릭)** → **열기**
   - "열기" 버튼 클릭
   - 이후부터는 정상적으로 실행 가능

**또는**:
```bash
# 터미널에서 보안 속성 제거
xattr -cr /Applications/Digital\ Scrap\ Diary.app
```
```

**무료 우회 방법**:
- ✅ 사용자에게 "우클릭 → 열기" 안내
- ✅ README/설치 가이드에 명시
- ⚠️ 코드 서명 없이는 완전히 제거 불가능

---

### Windows: "Windows의 PC 보호" 경고

**사용자 가이드**:

```markdown
### Windows 설치 방법

1. `.exe` 파일 다운로드
2. 실행 시 "Windows의 PC 보호" 경고 표시
3. **"추가 정보"** 클릭
4. **"실행"** 버튼 클릭
5. 설치 진행

**또는**:
- 포터블 버전 사용 (설치 불필요)
```

**무료 우회 방법**:
- ✅ SmartScreen 경고는 다운로드 횟수가 증가하면 자동으로 완화됨
- ✅ GitHub Releases에서 다운로드 시 신뢰도 향상
- ⚠️ 코드 서명 없이는 완전히 제거 불가능

---

### Linux

Linux는 별도의 보안 경고가 없습니다!

단, AppImage 실행 권한 필요:
```bash
chmod +x Digital-Scrap-Diary-1.0.0.AppImage
```

---

## 5️⃣ 트러블슈팅

### 빌드 오류

#### "Cannot find module 'electron'"
```bash
rm -rf node_modules package-lock.json
npm install
```

#### "EACCES: permission denied"
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
```

#### "vite build failed"
```bash
# Vite 캐시 삭제
rm -rf node_modules/.vite
npm run build
```

---

### 실행 오류

#### macOS: "앱이 손상되어 열 수 없습니다"
```bash
xattr -cr /Applications/Digital\ Scrap\ Diary.app
```

#### Windows: "msvcp140.dll이 없습니다"
- Visual C++ Redistributable 설치:
  https://aka.ms/vs/17/release/vc_redist.x64.exe

#### Linux: "Permission denied"
```bash
chmod +x Digital-Scrap-Diary-1.0.0.AppImage
```

---

### 빌드 시간

| 플랫폼 | 예상 시간 |
|--------|----------|
| macOS | 3-5분 |
| Windows | 5-8분 |
| Linux | 2-4분 |
| 전체 | 10-15분 |

---

### 빌드 용량

| 플랫폼 | 대략적인 크기 |
|--------|--------------|
| macOS (.dmg) | 80-120 MB |
| Windows (.exe) | 60-90 MB |
| Linux (.AppImage) | 70-100 MB |

---

## 📞 지원

### 문서
- `build/ICON_GUIDE.md` - 아이콘 생성 가이드
- `FINAL_PROJECT_REPORT.md` - 프로젝트 종합 보고서
- `README.md` - 프로젝트 개요

### 커뮤니티
- GitHub Issues: 버그 리포트 및 기능 요청
- GitHub Discussions: 질문 및 토론

---

## 🎉 체크리스트

배포 전 확인:

- [ ] `package.json` 메타데이터 업데이트 (author, repository)
- [ ] 아이콘 파일 준비 (선택사항)
- [ ] 로컬 빌드 테스트
- [ ] README.md 작성 (설치 방법 포함)
- [ ] CHANGELOG.md 작성
- [ ] GitHub 저장소 생성
- [ ] 코드 푸시
- [ ] 버전 태그 푸시
- [ ] GitHub Actions 성공 확인
- [ ] 생성된 파일 다운로드 및 테스트
- [ ] 릴리스 노트 작성

---

**작성일**: 2025-12-18 15:45 KST  
**다음 업데이트**: 버전 업그레이드 시

---

## 📚 추가 자료

### electron-builder 공식 문서
- https://www.electron.build/

### 코드 서명 가이드
- macOS: https://www.electron.build/code-signing
- Windows: https://www.electron.build/code-signing#windows

### GitHub Actions
- https://docs.github.com/actions
