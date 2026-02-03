# 🚀 Dingle v1.3.0 배포 단계 (후원자 전용 + 자동 업데이트)

## 📋 전체 프로세스

```
┌─────────────────────────────────────────────────────┐
│  Step 1: GitHub Release 생성 (자동 업데이트용)     │
│  ↓                                                   │
│  Step 2: 텀블벅 배포 (후원자 전용 다운로드)        │
│  ↓                                                   │
│  Step 3: 후원자 설치 완료                           │
│  ↓                                                   │
│  Step 4: 향후 자동 업데이트 (v1.4.0+)              │
└─────────────────────────────────────────────────────┘
```

---

## Step 1: GitHub Release 생성 (지금 해야 함!)

### 1-1. GitHub Actions 확인

**링크**: https://github.com/binglehaepi/Dingle/actions

**확인 사항**:
- ✅ Workflow가 실행 중이면 → **그대로 두기** (완료 대기)
- ⏳ 약 10-15분 소요
- ✅ 완료되면 자동으로 Release 생성됨

**또는 수동으로 Release 생성**:

### 1-2. 수동 Release 생성 (Actions 없이)

**링크**: https://github.com/binglehaepi/Dingle/releases/new

**설정**:
```
태그: v1.3.0 (선택)
제목: Dingle v1.3.0
설명: (RELEASE_NOTES_v1.3.0.md 내용 복사)

첨부 파일:
- release/Dingle Setup 1.3.0.exe
- release/Dingle 1.3.0.exe
- release/latest.yml (중요!)

설정:
✅ "This is a pre-release" 체크 (선택)
또는
✅ 공개 (자동 업데이트를 위해 필요)
```

**왜 공개해야 하나요?**
- `electron-updater`가 GitHub Release를 확인
- **공개 Release가 있어야 자동 업데이트 작동**
- 하지만 **다운로드는 텀블벅에서만 홍보**

---

## Step 2: 텀블벅 배포 (후원자 전용)

### 2-1. 파일 준비 (완료됨)

**파일**: `c:\work\digitalscrapdiary-2\Dingle_v1.3.0_Backers_Only.zip`
**크기**: 164.26 MB

### 2-2. 텀블벅 업로드

**방법 A: 텀블벅 직접 첨부** (권장)
1. 텀블벅 프로젝트 페이지 접속
2. 새 공지 작성
3. zip 파일 첨부
4. 후원자 전용 설정

**방법 B: GitHub Release 링크 + 텀블벅 안내**
```
텀블벅 공지:
"GitHub에서 직접 다운로드하세요:
https://github.com/binglehaepi/Dingle/releases/tag/v1.3.0

⚠️ 이 링크는 텀블벅 후원자에게만 안내됩니다."
```

### 2-3. 텀블벅 공지 내용

```markdown
🎁 [후원자 전용] Dingle v1.3.0 배포!

📥 다운로드:
[첨부 파일: Dingle_v1.3.0_Backers_Only.zip]

✨ 특별 혜택:
- 최우선 제공 (후원자만 다운로드 가능)
- 한 번 설치하면 자동 업데이트!

⚠️ 설치 시:
Windows Defender 경고 → "추가 정보" → "실행"

🔄 자동 업데이트:
향후 업데이트는 앱에서 자동으로 알림됩니다!
```

---

## Step 3: 자동 업데이트 확인

### 작동 원리

**설치된 앱이 하는 일**:
```typescript
// electron/main.ts
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'binglehaepi',
  repo: 'Dingle'
});

// 앱 시작 5초 후
autoUpdater.checkForUpdates();
```

**결과**:
1. 앱이 GitHub Release 확인
2. `latest.yml` 파일 다운로드
3. 현재 버전(v1.3.0)과 비교
4. 새 버전 있으면 알림

### 테스트 방법 (나중에)

v1.4.0 배포 시:
1. GitHub Release에 v1.4.0 업로드
2. 기존 v1.3.0 사용자에게 자동 알림
3. "다운로드" 클릭 → 자동 설치

---

## Step 4: 향후 업데이트 (v1.4.0+)

### 배포 프로세스

```bash
# 1. 코드 수정 후
git add .
git commit -m "Release v1.4.0: [변경사항]"

# 2. 태그 생성
git tag v1.4.0
git push origin v1.4.0

# 3. GitHub Actions가 자동 빌드
# 4. Release 자동 생성

# 5. 기존 사용자에게 자동 알림!
```

### 사용자 경험

**기존 후원자 (v1.3.0 설치됨)**:
```
앱 실행
  ↓
"v1.4.0 업데이트 가능" 알림
  ↓
"다운로드" 클릭
  ↓
자동 설치 완료! ✨
```

**새로운 사람**:
```
텀블벅 후원
  ↓
다운로드 (v1.4.0)
  ↓
설치
  ↓
향후 자동 업데이트 가능
```

---

## 💡 핵심 포인트

### ✅ 가능한 것들

1. **후원자 우선 제공**
   - 초기 다운로드는 텀블벅에서만
   - GitHub Release는 있지만 홍보 안 함

2. **자동 업데이트**
   - 한 번 설치한 사람은 자동 업데이트
   - GitHub Release가 공개여야 작동

3. **접근 제어**
   - 텀블벅: 후원자만 공지 확인
   - GitHub: 공개지만 찾기 어려움

### ⚠️ 제한 사항

1. **GitHub Release는 공개**
   - 누군가 GitHub에서 발견하면 다운로드 가능
   - 하지만 일반적으로 찾기 어려움
   - 텀블벅에서만 홍보

2. **완벽한 접근 제어는 불가능**
   - GitHub Release는 인증 없이 다운로드 가능
   - "후원자 우선" 모델로 이해

3. **라이선스 키 없음**
   - 누구나 설치 가능
   - 향후 라이선스 시스템 추가 가능

---

## 🎯 현재 해야 할 것 (순서대로)

### ✅ 1. GitHub Release 확인/생성

**Option A: Actions 완료 대기** (권장)
```
1. https://github.com/binglehaepi/Dingle/actions 접속
2. Workflow 완료 대기 (10-15분)
3. https://github.com/binglehaepi/Dingle/releases 확인
```

**Option B: 수동 생성**
```
1. https://github.com/binglehaepi/Dingle/releases/new
2. 태그: v1.3.0
3. 파일 첨부:
   - Dingle Setup 1.3.0.exe
   - Dingle 1.3.0.exe
   - latest.yml
4. Publish release
```

### ✅ 2. 텀블벅 업로드

```
1. 텀블벅 프로젝트 페이지
2. 새 공지 작성
3. Dingle_v1.3.0_Backers_Only.zip 첨부
4. 후원자 전용 설정
5. 공지 발송
```

### ✅ 3. 공지 내용 핵심

```
🎁 후원자 전용 최초 배포
📥 zip 파일 다운로드
⚠️ Windows Defender 대응
🔄 자동 업데이트 안내
```

---

## 📊 비교: 배포 방식

### 방식 A: GitHub Release 공개 + 텀블벅 안내 (권장)

**장점**:
- ✅ 자동 업데이트 완벽 작동
- ✅ 파일 호스팅 무료
- ✅ 빠른 다운로드

**단점**:
- ⚠️ GitHub에서 발견 가능 (하지만 어려움)
- ⚠️ 완벽한 접근 제어 불가

**구현**:
```
1. GitHub Release 공개
2. 텀블벅에서만 링크 안내
3. "후원자 우선 제공" 강조
```

### 방식 B: 텀블벅 첨부 + GitHub Release 공개

**장점**:
- ✅ 후원자는 텀블벅에서 다운로드
- ✅ 자동 업데이트는 GitHub 통해

**단점**:
- ⚠️ 중복 업로드 필요

**구현**:
```
1. 텀블벅에 zip 첨부
2. GitHub Release도 생성
3. 둘 다 유지
```

### 방식 C: 텀블벅만 (자동 업데이트 포기)

**장점**:
- ✅ 완벽한 접근 제어

**단점**:
- ❌ 자동 업데이트 안됨
- ❌ 매번 수동 다운로드

**구현**:
```
1. 텀블벅에만 업로드
2. GitHub Release 생성 안 함
```

---

## 💡 권장: 방식 A (하이브리드)

### 실행 단계

#### 1. GitHub Release 생성 (지금)
```
- 공개 Release
- 파일 업로드
- 자동 업데이트 활성화
```

#### 2. 텀블벅 공지 (지금)
```markdown
🎁 후원자님들께 가장 먼저 제공합니다!

📥 다운로드:
https://github.com/binglehaepi/Dingle/releases/tag/v1.3.0

⚠️ 이 링크는 후원자에게만 안내됩니다.

🔄 자동 업데이트:
한 번 설치하면 향후 자동 업데이트됩니다!
```

#### 3. 메시징
```
"후원자 우선 제공"
"자동 업데이트 지원"
"GitHub에 공개되지만 후원자에게만 안내"
```

---

## ✅ 체크리스트

### 지금 해야 할 것
- [ ] GitHub Actions 확인
- [ ] GitHub Release 생성/확인
- [ ] 텀블벅 공지 작성
- [ ] 후원자에게 알림

### 텀블벅 공지 핵심
- [ ] 후원자 전용임을 강조
- [ ] 다운로드 링크 제공
- [ ] Windows Defender 경고 안내
- [ ] 자동 업데이트 안내
- [ ] 외부 공유 자제 요청

---

**결론**: 
- GitHub Release는 **반드시 필요** (자동 업데이트용)
- 텀블벅에서만 **링크 안내** (후원자 전용)
- "후원자 우선 제공" 모델


