# 🔐 코드 서명 빌드 가이드

**작성일**: 2025-12-18  
**목적**: Apple Developer 인증서로 서명/공증하여 "확인되지 않은 개발자" 경고 제거

---

## ⚠️ 사전 준비

### 1. 프로젝트 위치 확인

**중요**: Desktop/iCloud/Dropbox 경로에서는 xattr 문제가 발생할 수 있습니다!

**권장 경로**:
```bash
# 권장: 홈 디렉토리의 Projects 폴더
~/Projects/digitalscrapdiary/

# 피해야 할 경로:
~/Desktop/                    # ❌ Desktop (iCloud 동기화)
~/Library/Mobile Documents/   # ❌ iCloud Drive
~/Dropbox/                    # ❌ Dropbox
```

**프로젝트 이동**:
```bash
# 현재 위치
cd "/Users/ieun-yeong/Desktop/digitalscrapdiary 2"

# Projects 폴더로 이동
mkdir -p ~/Projects
cp -R . ~/Projects/digitalscrapdiary/
cd ~/Projects/digitalscrapdiary/

# xattr 정리
npm run clean:xattr
```

---

## 🔧 2. xattr 정리 스크립트 사용

빌드 전 반드시 실행:

```bash
# xattr 정리
npm run clean:xattr

# 확인
xattr -lr . | head -50
# → 아무것도 출력되지 않아야 함
```

---

## 💳 3. Apple Developer Program 가입

### 가입 절차
1. https://developer.apple.com/programs/ 방문
2. Apple ID로 로그인
3. **$99/년** 결제
4. 승인 대기 (1~2일)

### Team ID 확인
```
Apple Developer → Account → Membership
→ Team ID 기록 (예: ABC123XYZ)
```

---

## 🔑 4. 인증서 발급

### macOS에서 인증서 생성

```bash
# Xcode 설치 확인
xcode-select --install

# Xcode 실행
# Preferences → Accounts → "+" → Apple ID 추가
# Manage Certificates → "+" → "Developer ID Application"
```

### 인증서 ID 확인
```bash
# 인증서 목록 조회
security find-identity -v -p codesigning

# 출력 예시:
# 1) 9DA7A27C334C0C3D55F31B47C55D68C0A8550EF9 "Developer ID Application: Your Name (TEAM_ID)"

# → 이 해시값을 기록
```

---

## 🔐 5. App-Specific Password 생성

### 공증을 위한 비밀번호

1. https://appleid.apple.com 방문
2. 로그인 → **보안** 섹션
3. **"App별 암호"** → 암호 생성
4. 이름: "electron-builder"
5. 생성된 암호 기록 (예: `xxxx-xxxx-xxxx-xxxx`)

---

## 📝 6. 환경 변수 설정

### .env 파일 생성

```bash
# .env 파일 생성
cat > .env << 'EOF'
# Apple Developer 정보
APPLE_ID=your-apple-id@example.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=ABC123XYZ

# 코드 서명 인증서
CSC_NAME="Developer ID Application: Your Name (ABC123XYZ)"
EOF

# .gitignore에 추가
echo ".env" >> .gitignore
```

---

## 🛠️ 7. electron-builder.json 수정

### 서명 활성화

```json
{
  "mac": {
    "category": "public.app-category.productivity",
    "icon": "build/icon.icns",
    "target": [...],
    "darkModeSupport": true,
    
    // ✅ 서명 활성화 (identity: null 제거)
    "identity": "${env.CSC_NAME}",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  
  // ✅ 공증 hook 추가
  "afterSign": "build/scripts/notarize.js"
}
```

---

## 📜 8. 공증 스크립트 생성

### build/scripts/notarize.js

```bash
mkdir -p build/scripts
```

```javascript
// build/scripts/notarize.js
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log('🔐 공증 시작...');
  
  return await notarize({
    appBundleId: 'com.digitalscrapdiary.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

### 의존성 설치

```bash
npm install --save-dev @electron/notarize
```

---

## 🚀 9. 서명 빌드 실행

### prebuild 스크립트 실행 (권장)

```bash
# xattr 정리 + 경고 메시지
npm run prebuild:signed

# 출력:
# ⚠️  서명 빌드 전 xattr 정리 완료. iCloud/Dropbox 경로 확인 필요!
```

### package.json 수정

```json
{
  "scripts": {
    "electron:build:mac:signed": "npm run prebuild:signed && vite build && npm run electron:compile && electron-builder --mac"
  }
}
```

### 빌드 실행

```bash
# 서명 + 공증 빌드
npm run electron:build:mac:signed
```

**예상 시간**: 5~10분 (공증 단계가 느림)

---

## ✅ 10. 서명 확인

### 서명 검증

```bash
# 서명 확인
codesign -dv --verbose=4 "release/mac/Digital Scrap Diary.app"

# 출력 예시:
# Authority=Developer ID Application: Your Name (TEAM_ID)
# Authority=Apple Worldwide Developer Relations Certification Authority
# Authority=Apple Root CA
```

### 공증 확인

```bash
# 공증 티켓 확인
spctl -a -vvv -t install "release/mac/Digital Scrap Diary.app"

# 출력 예시:
# source=Notarized Developer ID
# accepted
```

---

## 📦 11. 배포

서명/공증된 DMG는:
- ✅ "우클릭 → 열기" 불필요
- ✅ 더블클릭으로 바로 실행
- ✅ 회사/학교 Mac에서도 대부분 작동
- ✅ 전문적인 이미지

---

## 🐛 문제 해결

### "resource fork, Finder information" 오류

```bash
# 프로젝트 전체 xattr 정리
npm run clean:xattr

# 특정 파일 확인
xattr -l "release/mac/Digital Scrap Diary.app"

# 수동 정리
find . -name "._*" -delete
find . -name ".DS_Store" -delete
dot_clean -m .
```

### "공증 실패" 오류

```bash
# 공증 로그 확인
xcrun notarytool log <submission-id> --apple-id your@email.com --team-id TEAM_ID

# 일반적인 원인:
# 1. APPLE_APP_SPECIFIC_PASSWORD 오류
# 2. hardenedRuntime 누락
# 3. entitlements 설정 오류
```

### "인증서를 찾을 수 없습니다" 오류

```bash
# 인증서 목록 다시 확인
security find-identity -v -p codesigning

# CSC_NAME 환경 변수 확인
echo $CSC_NAME
```

---

## 📋 체크리스트

서명 빌드 전:
- [ ] 프로젝트를 iCloud/Dropbox 밖으로 이동
- [ ] `npm run clean:xattr` 실행
- [ ] Apple Developer Program 가입 완료
- [ ] 인증서 발급 완료
- [ ] `.env` 파일 설정 완료
- [ ] `@electron/notarize` 설치 완료
- [ ] `notarize.js` 스크립트 생성 완료

서명 빌드 후:
- [ ] `codesign -dv` 검증 통과
- [ ] `spctl -a` 검증 통과
- [ ] 더블클릭 실행 테스트
- [ ] 다른 Mac에서 테스트

---

## 💰 비용 요약

| 항목 | 비용 | 주기 |
|------|------|------|
| Apple Developer Program | $99 | 연간 |
| 총 비용 | **$99/년** | - |

**ROI**: 
- 설치 장벽 90% 감소
- 문의/환불 대폭 감소
- 전문성 향상

**권장 시점**: 매출 $500+ 또는 월 50+ 다운로드

---

## 📞 지원

- **공식 문서**: https://www.electron.build/code-signing
- **Apple Notarization**: https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution

---

**최종 업데이트**: 2025-12-18



