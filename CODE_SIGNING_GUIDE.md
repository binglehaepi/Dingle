# 🔐 코드 서명 완벽 가이드

**작성일**: 2025-12-18 15:50 KST  
**목적**: 보안 경고 제거 및 사용자 신뢰 확보

---

## 📊 코드 서명 비교

| 항목 | 서명 없음 | 서명 있음 |
|------|----------|----------|
| **macOS 경고** | ⚠️ "확인되지 않은 개발자" | ✅ 경고 없음 |
| **Windows 경고** | ⚠️ "Windows의 PC 보호" | ✅ 경고 없음 |
| **사용자 신뢰** | 낮음 | 높음 |
| **다운로드 차단** | 가능성 있음 | 없음 |
| **비용** | **무료** | **$180-400/년** |
| **설정 난이도** | 쉬움 | 중간-높음 |

---

## 💰 비용 분석

### macOS 코드 서명
- **Apple Developer Program**: **$99/년**
- **필수 요구사항**:
  - Apple ID
  - 신용카드
  - 개인 또는 조직 정보

### Windows 코드 서명
- **저렴한 옵션**: $80-150/년
  - [K Software](https://www.ksoftware.net): ~$80/년
  - [Sectigo](https://sectigo.com): ~$100/년
- **프리미엄 옵션**: $200-500/년
  - [DigiCert](https://www.digicert.com): ~$300/년
  - [GlobalSign](https://www.globalsign.com): ~$350/년

### 총 비용
- **macOS만**: $99/년
- **Windows만**: $80-150/년
- **macOS + Windows**: **$180-250/년**
- **무료 대안**: 사용자 가이드 제공 (아래 참조)

---

## 🆓 무료 우회 방법 (권장)

코드 서명 없이 사용자가 설치할 수 있도록 안내하는 방법입니다.

### macOS 사용자 가이드

**README.md에 추가**:

```markdown
## 📥 macOS 설치 방법

### 방법 1: 우클릭으로 열기 (권장)
1. `.dmg` 파일을 다운로드합니다
2. 앱을 Applications 폴더로 드래그합니다
3. Finder에서 Applications 폴더를 엽니다
4. **Digital Scrap Diary를 우클릭 (또는 Control + 클릭)**
5. **"열기"**를 선택합니다
6. "열기" 버튼을 다시 클릭합니다
7. 이후부터는 정상적으로 실행됩니다

### 방법 2: 터미널 명령어
```bash
# Gatekeeper 속성 제거
xattr -cr /Applications/Digital\ Scrap\ Diary.app
```

### ⚠️ 보안 안내
이 앱은 코드 서명되지 않았지만, 오픈소스이며 GitHub에서 소스 코드를 확인할 수 있습니다.
```

---

### Windows 사용자 가이드

**README.md에 추가**:

```markdown
## 📥 Windows 설치 방법

### SmartScreen 경고 우회
1. `.exe` 파일을 다운로드합니다
2. 파일을 더블클릭합니다
3. "Windows의 PC 보호" 창이 나타나면:
   - **"추가 정보"**를 클릭합니다
   - **"실행"** 버튼을 클릭합니다
4. 설치를 진행합니다

### 포터블 버전 (설치 불필요)
- `Digital Scrap Diary 1.0.0.exe` (포터블) 다운로드
- 바로 실행 가능 (설치 불필요)

### ⚠️ 보안 안내
SmartScreen 경고는 코드 서명이 없는 앱에 표시됩니다.
GitHub에서 소스 코드를 확인하실 수 있습니다.
```

---

### Linux

Linux는 별도의 보안 경고가 없습니다!

```markdown
## 📥 Linux 설치 방법

### AppImage (모든 배포판)
```bash
chmod +x Digital-Scrap-Diary-1.0.0.AppImage
./Digital-Scrap-Diary-1.0.0.AppImage
```

### Debian/Ubuntu
```bash
sudo dpkg -i digital-scrap-diary_1.0.0_amd64.deb
```
```

---

## 💳 유료 코드 서명 가이드

예산이 있다면 코드 서명을 권장합니다.

### A. macOS 코드 서명 (Apple Developer)

#### 1단계: Apple Developer 등록
1. https://developer.apple.com/programs/ 방문
2. "Enroll" 클릭
3. Apple ID로 로그인
4. **$99/년** 결제
5. 승인 대기 (1-2일)

#### 2단계: 인증서 발급
```bash
# Xcode 설치 (Mac에서)
xcode-select --install

# Xcode 실행
# Preferences → Accounts → "+" → Apple ID 추가
# Manage Certificates → "+" → Developer ID Application
```

#### 3단계: electron-builder.json 설정
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

#### 4단계: 공증 (Notarization) 설정
```bash
# .env 파일 생성
echo "APPLE_ID=your-apple-id@example.com" >> .env
echo "APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx" >> .env
echo "APPLE_TEAM_ID=YOUR_TEAM_ID" >> .env
```

**App-Specific Password 생성**:
1. https://appleid.apple.com 방문
2. 로그인 → 보안 섹션
3. "App별 암호" → 암호 생성
4. 생성된 암호를 `.env`에 저장

#### 5단계: 공증 스크립트 생성
```bash
mkdir scripts
```

**scripts/notarize.js**:
```javascript
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.digitalscrapdiary.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

**package.json에 의존성 추가**:
```bash
npm install --save-dev @electron/notarize
```

**electron-builder.json에 추가**:
```json
{
  "afterSign": "scripts/notarize.js"
}
```

#### 6단계: 빌드
```bash
npm run electron:build:mac
```

---

### B. Windows 코드 서명

#### 1단계: 인증서 구매
**추천 업체**:
1. **K Software** (저렴): https://www.ksoftware.net
   - Standard Code Signing: ~$80/년
2. **Sectigo** (중간): https://sectigo.com
   - Code Signing Certificate: ~$100/년
3. **DigiCert** (프리미엄): https://www.digicert.com
   - EV Code Signing: ~$300/년

#### 2단계: 인증서 설치
인증서를 받으면 `.pfx` 또는 `.p12` 파일을 받습니다.

**파일 저장**:
```bash
mkdir certs
# certificate.pfx를 certs/ 폴더에 저장
```

#### 3단계: .env 파일 설정
```bash
# .env 파일에 추가
echo "CSC_LINK=certs/certificate.pfx" >> .env
echo "CSC_KEY_PASSWORD=your-certificate-password" >> .env
```

⚠️ **보안 주의**: `.env` 파일을 `.gitignore`에 추가하세요!

#### 4단계: electron-builder.json 설정
```json
{
  "win": {
    "certificateFile": "certs/certificate.pfx",
    "certificatePassword": "${env.CSC_KEY_PASSWORD}",
    "signingHashAlgorithms": ["sha256"],
    "signDlls": false,
    "publisherName": "Your Company Name"
  }
}
```

#### 5단계: 빌드
```bash
npm run electron:build:win
```

---

## 🔄 CI/CD에서 코드 서명

### GitHub Actions에서 macOS 서명

**.github/workflows/release.yml**:
```yaml
jobs:
  release-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Import Apple Certificate
        env:
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}
        run: |
          echo $APPLE_CERTIFICATE | base64 --decode > certificate.p12
          security create-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
          security import certificate.p12 -k build.keychain -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" build.keychain
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run electron:build:mac
```

**GitHub Secrets 설정**:
1. GitHub 저장소 → Settings → Secrets → New repository secret
2. 다음 시크릿 추가:
   - `APPLE_CERTIFICATE`: 인증서 파일 (base64 인코딩)
   - `APPLE_CERTIFICATE_PASSWORD`: 인증서 암호
   - `KEYCHAIN_PASSWORD`: 임시 키체인 암호 (아무거나)
   - `APPLE_ID`: Apple ID
   - `APPLE_APP_SPECIFIC_PASSWORD`: App-Specific Password
   - `APPLE_TEAM_ID`: Team ID

---

### GitHub Actions에서 Windows 서명

```yaml
jobs:
  release-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: npm run electron:build:win
```

**GitHub Secrets 설정**:
1. `.pfx` 파일을 base64로 인코딩:
   ```bash
   base64 certificate.pfx > certificate.base64
   ```
2. GitHub Secrets 추가:
   - `WIN_CSC_LINK`: base64 인코딩된 인증서
   - `WIN_CSC_KEY_PASSWORD`: 인증서 암호

---

## 📋 체크리스트

### 무료 방법 (권장)
- [ ] README.md에 설치 가이드 추가
- [ ] macOS: "우클릭 → 열기" 안내
- [ ] Windows: "추가 정보 → 실행" 안내
- [ ] 소스 코드 공개 (신뢰도 향상)
- [ ] GitHub Releases 사용

### 유료 코드 서명
- [ ] 예산 확보 ($180-250/년)
- [ ] Apple Developer 등록 (macOS)
- [ ] Code Signing Certificate 구매 (Windows)
- [ ] 인증서 설정 및 테스트
- [ ] CI/CD 파이프라인 설정
- [ ] 자동 공증 설정 (macOS)

---

## 🎯 권장 사항

### 개인 프로젝트 / 오픈소스
→ **무료 방법** 사용
- 사용자 가이드 제공
- GitHub에서 소스 공개
- SmartScreen 경고는 다운로드가 증가하면 자동 완화

### 상업용 프로젝트 / 엔터프라이즈
→ **코드 서명** 권장
- 전문적인 이미지
- 사용자 신뢰 확보
- 다운로드 차단 방지

### 혼합 전략
→ **macOS만 서명** ($99/년)
- macOS는 경고가 매우 엄격
- Windows는 SmartScreen이 시간이 지나면 완화됨

---

## 📞 지원

### 공식 문서
- electron-builder: https://www.electron.build/code-signing
- Apple Notarization: https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution

### 커뮤니티
- electron-builder GitHub Issues
- Stack Overflow: [electron-builder] 태그

---

**최종 업데이트**: 2025-12-18 15:50 KST



