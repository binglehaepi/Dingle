# 🧪 배포 테스트 가이드

**Digital Scrap Diary - 자동 업데이트 테스트**

이 문서는 자동 업데이트 기능이 올바르게 작동하는지 테스트하는 방법을 설명합니다.

---

## 사전 준비 확인

### 1. 필수 파일 확인

다음 파일들이 수정되었는지 확인하세요:

- ✅ `package.json` - electron-updater 설치됨
- ✅ `electron-builder.json` - publish 설정 완료
- ✅ `electron/main.ts` - 자동 업데이트 로직 추가됨
- ✅ `electron/preload.ts` - 업데이트 IPC 채널 추가됨
- ✅ `.github/workflows/release.yml` - --publish always 추가됨
- ✅ `components/UpdateNotification.tsx` - UI 컴포넌트 생성됨
- ✅ `App.tsx` - UpdateNotification 컴포넌트 추가됨

### 2. GitHub 저장소 정보 업데이트 필요

다음 파일에서 GitHub 정보를 실제 값으로 변경해야 합니다:

**package.json:**
```json
{
  "repository": {
    "url": "https://github.com/yourusername/digitalscrapdiary.git"
  }
}
```

**electron-builder.json:**
```json
{
  "publish": [
    {
      "owner": "yourusername",
      "repo": "digitalscrapdiary"
    }
  ]
}
```

⚠️ **주의**: 위의 `yourusername`을 실제 GitHub 사용자명으로 변경해야 합니다!

---

## 로컬 빌드 테스트

### Windows 빌드

```bash
# 현재 디렉토리 확인
cd c:\work\digitalscrapdiary-2

# 빌드 실행
npm run electron:build:win
```

**예상 결과:**

```
✔ Building Electron app...
✔ Packaging for Windows...
✔ Creating NSIS installer...

생성된 파일:
  release/Digital Scrap Diary Setup 1.0.0.exe
  release/Digital Scrap Diary 1.0.0.exe (portable)
  release/latest.yml
```

### 생성된 파일 확인

`release/` 폴더에 다음 파일들이 있는지 확인:

- `Digital Scrap Diary Setup 1.0.0.exe` - 설치 프로그램
- `Digital Scrap Diary 1.0.0.exe` - 포터블 버전
- `latest.yml` - 자동 업데이트 메타데이터 ⭐ 중요!

`latest.yml` 내용 예시:
```yaml
version: 1.0.0
files:
  - url: Digital Scrap Diary Setup 1.0.0.exe
    sha512: ...
    size: 60000000
path: Digital Scrap Diary Setup 1.0.0.exe
sha512: ...
releaseDate: '2026-01-30T...'
```

---

## GitHub 배포 준비

### 1. GitHub 저장소 생성

아직 GitHub 저장소가 없다면:

1. GitHub.com 접속
2. New repository 클릭
3. 저장소 이름: `digitalscrapdiary`
4. Public 또는 Private 선택
5. Create repository

### 2. 로컬 코드 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init

# .gitignore 확인 (node_modules, dist, release 제외)
# 이미 .gitignore가 있어야 합니다

# 원격 저장소 추가
git remote add origin https://github.com/실제사용자명/digitalscrapdiary.git

# 브랜치 생성
git branch -M main

# 모든 파일 추가
git add .

# 커밋
git commit -m "feat: Add auto-update support"

# 푸시
git push -u origin main
```

### 3. GitHub 정보 업데이트

실제 저장소가 생성되었으면, 다음 파일을 수정:

```bash
# package.json과 electron-builder.json 수정
# (위의 "GitHub 저장소 정보 업데이트 필요" 섹션 참조)

# 수정 후 커밋
git add package.json electron-builder.json
git commit -m "chore: Update GitHub repository info"
git push
```

---

## GitHub Actions 테스트

### 1. 첫 릴리스 태그 생성

```bash
# v1.0.0 태그 생성
git tag v1.0.0

# 태그 푸시
git push origin v1.0.0
```

### 2. GitHub Actions 확인

1. GitHub 저장소로 이동
2. **Actions** 탭 클릭
3. "Release Desktop App" 워크플로우 실행 확인
4. 빌드 진행 상황 모니터링 (약 10-20분 소요)

**빌드 단계:**
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Install dependencies
- ✅ Build Electron app (macOS)
- ✅ Build Electron app (Windows)
- ✅ Build Electron app (Linux)
- ✅ Upload artifacts
- ✅ Release

### 3. 릴리스 확인

빌드가 완료되면:

1. **Releases** 탭으로 이동
2. `v1.0.0` 릴리스 확인
3. 다음 파일들이 업로드되었는지 확인:

**Windows:**
- `Digital Scrap Diary Setup 1.0.0.exe`
- `Digital Scrap Diary 1.0.0.exe`
- `latest.yml` ⭐

**macOS:**
- `Digital Scrap Diary-1.0.0-arm64.dmg`
- `Digital Scrap Diary-1.0.0-x64.dmg`
- `Digital Scrap Diary-1.0.0-arm64-mac.zip`
- `Digital Scrap Diary-1.0.0-x64-mac.zip`
- `latest-mac.yml` ⭐

**Linux:**
- `Digital-Scrap-Diary-1.0.0.AppImage`
- `digital-scrap-diary_1.0.0_amd64.deb`

---

## 자동 업데이트 테스트

### 준비: v1.0.0 설치

1. GitHub Releases에서 `Digital Scrap Diary Setup 1.0.0.exe` 다운로드
2. 설치 실행
3. 앱 실행 확인

### 테스트: v1.0.1 업데이트

#### 1단계: 코드 수정

간단한 변경 사항 추가:

```bash
# 예: README.md 수정
echo "## Version 1.0.1 - Test Update" >> README.md

git add .
git commit -m "test: Version 1.0.1 update test"
git push
```

#### 2단계: 버전 업데이트

```bash
# 버전을 1.0.1로 증가
npm version patch

# 자동으로 생성된 태그 푸시
git push --follow-tags
```

#### 3단계: GitHub Actions 대기

- GitHub → Actions에서 빌드 진행 확인
- 약 10-20분 소요

#### 4단계: 설치된 앱에서 업데이트 테스트

1. **v1.0.0 앱 실행**
2. 앱이 백그라운드에서 업데이트 확인 (약 5초 후)
3. 알림 표시 확인:
   ```
   🎉 새 버전 1.0.1이 있습니다!
   ```
4. **"다운로드"** 버튼 클릭
5. 다운로드 진행률 확인:
   ```
   ⬇️ 업데이트 다운로드 중...
   ████████████░░░░░░░░ 60.5%
   ```
6. 다운로드 완료 후 알림:
   ```
   ✅ 업데이트 준비 완료!
   ```
7. **"지금 재시작"** 버튼 클릭
8. 앱이 자동으로 종료 → 설치 → 재시작
9. 새 버전으로 실행 확인

#### 5단계: 버전 확인

앱 내에서 버전 확인:
- 개발자 도구(F12) → Console
- `window.electron.getVersion()` 실행
- version이 "1.0.1"인지 확인

---

## 수동 테스트 (GitHub 없이)

GitHub 저장소가 아직 준비되지 않았다면, 수동으로 테스트할 수 있습니다:

### 1. 로컬 서버 설정

```bash
# 로컬 웹 서버 시작 (release 폴더)
cd release
python -m http.server 8080
```

### 2. dev-app-update.yml 생성

프로젝트 루트에 `dev-app-update.yml` 생성:

```yaml
provider: generic
url: http://localhost:8080
```

### 3. 앱 실행 및 테스트

```bash
# 개발 모드 실행
npm run electron:dev
```

개발자 도구(F12)에서 업데이트 수동 확인:

```javascript
// 업데이트 확인
await window.electron.updateCheck()

// 다운로드
await window.electron.updateDownload()

// 설치
await window.electron.updateInstall()
```

---

## 문제 해결

### "업데이트 확인 실패"

**확인 사항:**
1. `latest.yml` 파일이 GitHub Releases에 있는지 확인
2. `electron-builder.json`의 GitHub 정보가 올바른지 확인
3. 네트워크 연결 확인

**디버깅:**
```bash
# 개발자 도구(F12) → Console에서:
# 1. Electron 환경 확인
console.log(window.electron)

# 2. 수동 업데이트 확인
window.electron.updateCheck().then(console.log).catch(console.error)
```

### "빌드 실패"

**일반적인 원인:**
1. TypeScript 컴파일 오류
2. 의존성 문제
3. 아이콘 파일 누락 (선택사항이지만 경고 발생)

**해결:**
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 컴파일 확인
npm run electron:compile

# Vite 빌드 확인
npm run build
```

### "GitHub Actions 실패"

**확인:**
1. GitHub → Actions → 실패한 워크플로우 클릭
2. 로그 확인
3. 일반적인 문제:
   - Node.js 버전 불일치
   - npm ci 실패 (package-lock.json 문제)
   - 빌드 스크립트 오류

---

## 테스트 체크리스트

### 로컬 빌드 ✅
- [ ] `npm run electron:build:win` 성공
- [ ] `release/` 폴더에 파일 생성 확인
- [ ] `latest.yml` 파일 존재 확인
- [ ] 설치 프로그램 실행 테스트

### GitHub 배포 ✅
- [ ] GitHub 저장소 생성
- [ ] `package.json`, `electron-builder.json` 수정
- [ ] 코드 푸시 완료
- [ ] 태그 생성 및 푸시 (`v1.0.0`)
- [ ] GitHub Actions 빌드 성공
- [ ] Releases에 파일 업로드 확인

### 자동 업데이트 ✅
- [ ] v1.0.0 설치 완료
- [ ] v1.0.1 릴리스 생성
- [ ] 앱 실행 시 업데이트 감지
- [ ] 알림 UI 표시 확인
- [ ] 다운로드 진행률 확인
- [ ] "지금 재시작" 후 자동 설치
- [ ] 새 버전으로 실행 확인

---

## 다음 단계

모든 테스트가 성공했다면:

1. ✅ 자동 업데이트 기능 완성
2. 📝 사용자 문서 작성 (설치 가이드, 업데이트 안내)
3. 🎉 정식 릴리스 준비
4. 🚀 배포 및 사용자에게 공유

---

**작성일**: 2026-01-30  
**문서 버전**: 1.0



