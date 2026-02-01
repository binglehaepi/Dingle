# Windows 전용 배포 파일 생성 및 자동 업데이트 설정

## 현재 상태 확인 ✅

### 이미 완료된 것들

- ✅ electron-builder 설치됨 (v24.13.3)
- ✅ electron-updater 설치됨 (v6.7.3)
- ✅ GitHub Actions 워크플로우 구성됨 (`.github/workflows/release.yml`)
- ✅ publish 설정 (GitHub Release 자동 배포)
- ✅ autoUpdater 코드 구현됨 (`electron/main.ts`)
- ✅ 빌드 스크립트 준비됨 (`npm run electron:build:win`)
- ✅ 현재 버전: v1.3.0

### 필요한 작업

- ✅ Windows 아이콘 생성 (`build/icon.ico` 있음)
- ✅ 보안 감사 완료 (2026-02-01)
- 📦 로컬 빌드 테스트
- 🚀 GitHub Release 생성
- 📝 배포 문서 작성

---

## Phase 1: Windows 아이콘 생성 (5분)

### 현재 상태

- `build/icon.png` (1024x1024) 있음 - 코코넛 이미지
- `build/icon.ico` 없음 (Windows 필수)

### 해결 방법

`sharp` 라이브러리로 PNG → ICO 변환**`scripts/generate-icon-ico.js` 생성:**

````javascript
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../build/icon.png');
const outputPath = path.join(__dirname, '../build/icon.ico');

async function generateIco() {
  console.log('🪟 Windows 아이콘 생성 중...');
  try {
    // ICO는 여러 크기 포함 (256x256이 메인)
    await sharp(inputPath)
      .resize(256, 256)
      .toFile(outputPath.replace('.ico', '-256.png'));
    
    console.log(`✅ 임시 PNG 생성: ${outputPath.replace('.ico', '-256.png')}`);
    console.log('⚠️  ICO 변환은 수동으로 필요 (https://convertio.co/png-ico/)');
    console.log('   또는 build/icon.png를 256x256으로 복사하여 사용');
  } catch (error) {
    console.error('❌ 실패:', error);
  }
}

generateIco();
```

**또는 간단한 방법:**
- build/icon.png를 https://convertio.co/png-ico/ 에서 변환
- 또는 `electron-builder`가 자동으로 PNG에서 ICO 생성 (테스트 필요)

---

## Phase 2: 로컬 빌드 테스트 (10분)

### Step 1: 빌드 실행
```bash
# 기존 빌드 파일 정리
npm run clean:release

# Windows용 빌드
npm run electron:build:win
```

### 예상 결과
```
📁 release/
  ├─ Dingle Setup 1.3.0.exe        (설치 파일, ~40-60MB)
  ├─ Dingle 1.3.0.exe               (휴대용, ~40-60MB)
  ├─ latest.yml                     (자동 업데이트용 메타데이터)
  └─ builder-effective-config.yaml  (빌드 설정 로그)
```

### Step 2: 로컬 테스트
1. `Dingle Setup 1.3.0.exe` 실행
2. 설치 진행
3. 앱 실행 확인
4. 기능 테스트:
            - 다이어리 작성
            - 백업/복원
            - 오하아사 순위 확인
            - 스티커 업로드
            - 임베드 추가 (Spotify, SoundCloud, Pinterest)

### Step 3: 휴대용 버전 테스트
1. `Dingle 1.3.0.exe` (portable) 실행
2. 설치 없이 바로 실행되는지 확인

---

## Phase 3: GitHub Release 생성 (5분)

### 자동 배포 프로세스

**현재 설정:**
- Git 태그를 `v*.*.*` 형식으로 push하면 자동 빌드
- GitHub Actions가 Windows + Linux 빌드
- 빌드 완료 후 자동으로 GitHub Release 생성

### 배포 실행 명령어
```bash
# 1. 모든 변경사항 커밋
git add .
git commit -m "Release v1.3.0: 오하아사 날짜 표시, 임베드 기능 완성"

# 2. 태그 생성 (반드시 v로 시작)
git tag v1.3.0

# 3. 태그 push (GitHub Actions 트리거)
git push origin v1.3.0

# 4. main 브랜치도 push
git push origin main
```

### GitHub Actions 진행 상황 확인
- https://github.com/binglehaepi/Dingle/actions
- 약 10-15분 소요

### Release 확인
- https://github.com/binglehaepi/Dingle/releases
- Release Notes 자동 생성됨
- 첨부 파일:
        - `Dingle.Setup.1.3.0.exe` (Windows 설치)
        - `Dingle.1.3.0.exe` (Windows 휴대용)
        - `Dingle-1.3.0.AppImage` (Linux)
        - `latest.yml` (자동 업데이트 메타데이터)

---

## Phase 4: 자동 업데이트 작동 확인 (5분)

### 자동 업데이트 로직

**`electron/main.ts`의 구현:**
```typescript
// 1. 앱 시작 5초 후 자동 업데이트 확인
if (app.isPackaged) {
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] Auto-check failed:', err);
    });
  }, 5000);
}

// 2. 업데이트 발견 시
autoUpdater.on('update-available', (info) => {
  // 사용자에게 알림
  appWin.webContents.send('update:available', {
    version: info.version,
    releaseDate: info.releaseDate,
  });
});

// 3. 다운로드 완료 시
autoUpdater.on('update-downloaded', (info) => {
  // 설치 안내
  appWin.webContents.send('update:downloaded', {
    version: info.version,
  });
});
```

### 테스트 방법
1. v1.3.0 설치
2. v1.4.0 Release 생성 (테스트용)
3. v1.3.0 실행
4. 5초 후 업데이트 알림 표시 확인
5. 다운로드 → 설치 진행

---

## Phase 5: 배포 패키지 준비 (15분)

### 폴더 구조
```
📁 Dingle_v1.3.0_Windows배포/
  ├─ 📄 설치방법.txt
  ├─ 📄 README.txt
  ├─ 📄 업데이트_안내.txt
  ├─ 📄 문제해결_가이드.txt
  └─ 📦 Dingle-Setup-1.3.0.exe
```

### 문서 내용

#### `설치방법.txt`
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       Dingle v1.3.0 설치 방법
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Windows 10/11 전용

🔧 설치 단계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 'Dingle-Setup-1.3.0.exe' 더블클릭

2️⃣ Windows Defender 경고가 뜰 수 있습니다
   ├─ "추가 정보" 클릭
   └─ "실행" 클릭
   
   💡 Dingle은 안전한 오픈소스 앱입니다
   
3️⃣ 설치 경로 선택
   └─ 기본값 권장: C:\Users\[사용자명]\AppData\Local\Programs\dingle

4️⃣ "설치" 버튼 클릭

5️⃣ 설치 완료!
   ├─ 바탕화면 아이콘 생성됨
   └─ 시작 메뉴에도 추가됨

✨ 첫 실행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 바탕화면 또는 시작 메뉴에서 Dingle 실행
- 처음에는 빈 다이어리가 표시됩니다
- 좌측 달력에서 날짜를 클릭하여 시작!

🔄 자동 업데이트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 앱 실행 시 자동으로 업데이트 확인
- 새 버전 발견 시 자동 알림
- 클릭 한 번으로 업데이트!

⚠️ 문제 발생 시
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- "문제해결_가이드.txt" 참고
- 또는 이슈 제기: https://github.com/binglehaepi/Dingle/issues
```

#### `README.txt`
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Dingle v1.3.0
   디지털 스크랩 다이어리
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Dingle이란?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
일본의 아날로그 다이어리 감성을
디지털로 재현한 스크랩북 다이어리입니다.

✨ 주요 기능
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 월간/주간/일간 뷰
📸 사진, 스티커, 테이프 꾸미기
🎵 YouTube, Spotify, SoundCloud 임베드
📌 Pinterest, Twitter 콘텐츠 저장
🔮 오하아사 운세 (매일 자동 업데이트)
💾 자동 저장 + 백업/복원
🎨 다양한 테마 및 위젯

💻 시스템 요구사항
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- OS: Windows 10/11 (64비트)
- RAM: 4GB 이상 권장
- 디스크: 200MB 여유 공간
- 인터넷 연결 (임베드, 운세 기능용)

📦 버전 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 버전: v1.3.0
- 릴리즈 날짜: 2026년 2월
- 라이선스: MIT

🔗 링크
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- GitHub: https://github.com/binglehaepi/Dingle
- 이슈/제안: https://github.com/binglehaepi/Dingle/issues
- 텀블벅: [프로젝트 링크]

❤️ 제작자
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
빙글해피 팀

즐거운 다이어리 작성 되세요! 🎉
```

#### `업데이트_안내.txt`
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      자동 업데이트 시스템
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 자동 업데이트 작동 방식
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 업데이트 확인 (자동)
   └─ 앱 실행 시 GitHub에서 최신 버전 확인

2️⃣ 업데이트 발견 시
   ├─ 화면 우측 상단에 알림 표시
   ├─ "업데이트 다운로드" 버튼 표시
   └─ 클릭하면 백그라운드 다운로드

3️⃣ 다운로드 완료 후
   ├─ "지금 재시작" 버튼 표시
   ├─ 클릭 시 앱 재시작
   └─ 자동으로 새 버전 설치!

4️⃣ 데이터 보존
   └─ 다이어리 데이터는 모두 보존됨 ✅

💡 팁
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 중요한 작업 중에는 업데이트 나중에 하기
- 업데이트 전 자동 백업 권장
- 문제 발생 시 이전 버전 다시 설치 가능

🔍 수동 업데이트 확인
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 설정 → "업데이트 확인" 버튼
- 또는 GitHub Releases에서 직접 다운로드
  https://github.com/binglehaepi/Dingle/releases

📦 버전 히스토리
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- v1.3.0 (현재): 오하아사 날짜 표시, 임베드 개선
- v1.2.0: 스티커 업로드, 캘린더 사진 관리
- v1.1.0: 백업/복원 기능
- v1.0.0: 첫 릴리즈
```

#### `문제해결_가이드.txt`
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        문제 해결 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 설치 오류
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: "앱을 열 수 없습니다" 오류
A: Windows Defender 설정
            1. "추가 정보" 클릭
            2. "실행" 클릭

Q: 설치 파일이 실행되지 않음
A: 관리자 권한으로 실행
            1. 파일 우클릭
            2. "관리자 권한으로 실행"

❌ 실행 오류
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: 앱이 열리지 않음
A: 완전 재설치
            1. 프로그램 추가/제거에서 삭제
            2. C:\Users\[사용자명]\AppData\Local\dingle 폴더 삭제
            3. 재설치

Q: 화면이 깨져 보임
A: GPU 가속 비활성화
            1. 앱 바로가기 우클릭 → 속성
            2. 대상 끝에 추가: --disable-gpu
            3. 확인 → 재실행

❌ 데이터 문제
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: 작성한 내용이 사라짐
A: 백업 파일 복원
            1. 설정 → 백업/복원
            2. 백업 파일 선택
            3. 복원 클릭

Q: 사진이 표시되지 않음
A: 파일 경로 확인
            - 사진 파일이 삭제되었을 수 있음
            - 다시 업로드 필요

❌ 기능 오류
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: 오하아사 순위가 안 나옴
A: 인터넷 연결 확인
            - 오하아사는 온라인 데이터 필요
            - 더블클릭으로 강제 새로고침

Q: Spotify/YouTube 재생 안됨
A: 인터넷 연결 및 URL 확인
            - 유효한 URL인지 확인
            - 삭제 후 다시 추가

Q: 스티커 업로드 안됨
A: 파일 형식 확인
            - 지원 형식: PNG, JPG, WEBP, GIF
            - 파일 크기: 10MB 이하 권장

❌ 업데이트 오류
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: 자동 업데이트 실패
A: 수동 다운로드
            1. https://github.com/binglehaepi/Dingle/releases
            2. 최신 버전 다운로드
            3. 재설치

Q: 업데이트 후 데이터 사라짐
A: 백업 파일 확인
            - AppData\Local\dingle\backups 폴더 확인
            - 가장 최근 백업 파일 복원

🆘 추가 도움이 필요하신가요?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- GitHub 이슈: https://github.com/binglehaepi/Dingle/issues
- 이메일: support@dingle.app
- 디스코드: [커뮤니티 링크]

문제 보고 시 포함할 정보:
1. Windows 버전 (예: Windows 11 23H2)
2. Dingle 버전 (예: v1.3.0)
3. 오류 메시지 스크린샷
4. 재현 방법
```

---

## Phase 6: 텀블벅 배포 (5분)

### 배포 방법 옵션

#### 옵션 A: 직접 파일 첨부
```
📦 Dingle_v1.3.0_Windows.zip (업로드)
  └─ 모든 문서 + 설치 파일 포함
```

**장점:**
- 즉시 다운로드 가능
- 텀블벅 플랫폼 내에서 완결

**단점:**
- 파일 크기 제한 (50-60MB)
- 버전 관리 어려움

#### 옵션 B: GitHub Release 링크 제공 (권장)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Dingle 다운로드 안내
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 다운로드 링크
https://github.com/binglehaepi/Dingle/releases/latest

📥 설치 파일
- Windows: Dingle-Setup-1.3.0.exe

🔄 자동 업데이트
- 앱 실행 시 자동으로 최신 버전 확인
- 한 번 설치하면 자동 업데이트!

📖 상세 가이드
[첨부 문서 참조]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**장점:**
- 항상 최신 버전 제공
- 자동 업데이트 작동
- 파일 크기 제한 없음

**단점:**
- GitHub 계정 필요 (다운로드는 불필요)

---

## 최종 체크리스트

### 보안 감사 (완료 ✅)
- [x] 비밀 정보 노출 체크 (API 키 없음)
- [x] 개인정보 수집 여부 (수집 안 함)
- [x] 네트워크 통신 검증 (HTTPS만)
- [x] npm 패키지 취약점 (런타임 영향 없음)
- [x] 라이선스 검증 (모두 안전)
- [x] 보안 문서 작성 (SECURITY_AUDIT_REPORT.md, PRIVACY_POLICY.md)

### 배포 전 확인사항
- [x] Windows 아이콘 생성 (`build/icon.ico`)
- [ ] 로컬 빌드 성공 (`npm run electron:build:win`)
- [ ] 설치 파일 테스트 (신규 설치)
- [ ] 휴대용 버전 테스트
- [ ] 모든 주요 기능 작동 확인
- [ ] 백업/복원 테스트
- [ ] 버전 번호 확인 (v1.3.0)

### Git & GitHub
- [ ] 모든 변경사항 커밋
- [ ] 태그 생성 (`git tag v1.3.0`)
- [ ] 태그 push (`git push origin v1.3.0`)
- [ ] GitHub Actions 빌드 완료 대기
- [ ] GitHub Release 확인
- [ ] Release Notes 수정 (필요 시)

### 배포 문서
- [ ] 설치방법.txt 작성
- [ ] README.txt 작성
- [ ] 업데이트_안내.txt 작성
- [ ] 문제해결_가이드.txt 작성
- [ ] 배포 폴더 구성

### 텀블벅 업로드
- [ ] 배포 방법 결정 (직접 첨부 vs GitHub 링크)
- [ ] 다운로드 링크 작성
- [ ] 설치 가이드 업로드
- [ ] 후원자 공지

### 사후 관리
- [ ] 자동 업데이트 테스트 (다음 버전 배포 시)
- [ ] 사용자 피드백 수집
- [ ] 버그 리포트 대응
- [ ] 다음 버전 계획

---

## 예상 소요 시간

| 단계 | 소요 시간 |
|------|----------|
| Windows 아이콘 생성 | 5분 |
| 로컬 빌드 테스트 | 10분 |
| GitHub Release 생성 | 5분 (대기 15분) |
| 자동 업데이트 확인 | 5분 |
| 배포 문서 작성 | 15분 |
| 텀블벅 업로드 | 5분 |
| **총 소요 시간** | **45분 + 빌드 대기 15분** |

---

## 다음 버전 (v1.4.0) 배포 시

**간단한 프로세스:**
```bash
# 1. 코드 변경 후
git add .
git commit -m "Release v1.4.0: [변경사항]"

# 2. 태그 push만 하면 끝!
git tag v1.4.0
git push origin v1.4.0

# 3. GitHub Actions 자동 빌드
# 4. 기존 사용자에게 자동 업데이트 알림!
```

**사용자 입장:**
- 앱 실행 시 "v1.4.0 업데이트 가능" 알림
- "다운로드" 클릭
- 자동 설치 완료! ✨

---

## 참고 링크

- **electron-builder 문서**: https://www.electron.build/
- **electron-updater 문서**: https://www.electron.build/auto-update
- **GitHub Actions**: https://docs.github.com/actions










````