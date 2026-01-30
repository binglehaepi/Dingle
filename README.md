# 📔 Digital Scrap Diary

> 당신의 디지털 스크랩북 다이어리 - 추억을 모아 나만의 이야기를 만드세요

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/digitalscrapdiary/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/yourusername/digitalscrapdiary)

---

## ✨ 주요 기능

### 💾 **안전한 데이터 관리**
- 🔄 자동 저장 (5초 디바운스)
- 📂 파일 시스템 기반 저장 (무제한 용량)
- 🕐 버전 히스토리 & 백업 관리
- 🔐 Atomic write (파일 깨짐 방지)

### 📤 **고급 내보내기**
- 🖼️ PNG 내보내기 (4단계 품질)
- 📄 PDF 내보내기 (A4 가로)
- 🛡️ 안전 모드 (SNS 임베드 제외)
- 🏷️ 커스텀 워터마크 (5가지 위치)

### 📱 **반응형 디자인**
- 🖥️ 데스크톱: 2페이지 스프레드 뷰
- 📱 모바일/태블릿: 1페이지 뷰 + 스와이프
- 🎨 다양한 레이아웃 (월간, 주간, 자유)
- ✏️ 실시간 편집 및 드래그앤드롭

### 🌐 **오프라인 작동**
- ✅ 완전 오프라인: 앱 실행, 편집, 저장, 백업
- ⚠️ 인터넷 필요: 링크 스크랩, SNS 임베드 (트위터/인스타그램)
- 🛡️ Fallback 지원: 인터넷 실패 시 자동으로 링크 카드 생성

### 🎨 **콘텐츠 추가**
- 🔗 링크 스크랩 (자동 메타데이터)
- 🐦 트위터/인스타그램 임베드
- 📷 이미지 업로드
- 🎨 스티커 & 데코레이션
- 📝 텍스트 입력

---

## 📥 다운로드 & 설치

⚠️ **중요**: 자세한 설치 가이드는 [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)를 참조하세요!

### macOS

**다운로드**:
- **Apple Silicon (M1/M2/M3)**: [Digital Scrap Diary-1.0.0-arm64.dmg](https://github.com/yourusername/digitalscrapdiary/releases) ⭐ 권장
- **Intel Mac**: [Digital Scrap Diary-1.0.0.dmg](https://github.com/yourusername/digitalscrapdiary/releases)

**빠른 설치**:
1. `.dmg` 파일 다운로드 및 열기
2. 앱을 Applications 폴더로 드래그
3. **⚠️ 첫 실행 시 필수**: 
   - Finder → Applications 폴더
   - **Digital Scrap Diary를 우클릭 (⌃ + 클릭)**
   - **"열기"** 선택 → **"열기"** 버튼 클릭
4. 이후 정상 실행

**문제 해결**:
```bash
# "손상되어 열 수 없습니다" 오류 시
xattr -cr /Applications/Digital\ Scrap\ Diary.app
```

📖 **상세 가이드**: [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

### Windows
1. [Digital Scrap Diary Setup 1.0.0.exe](https://github.com/yourusername/digitalscrapdiary/releases) 다운로드
2. `.exe` 파일 실행
3. **"Windows의 PC 보호" 경고 시**:
   - **"추가 정보"** 클릭
   - **"실행"** 버튼 클릭
4. 설치 진행

**포터블 버전** (설치 불필요):
- [Digital Scrap Diary 1.0.0.exe](https://github.com/yourusername/digitalscrapdiary/releases) 다운로드
- 바로 실행 가능

### Linux
**AppImage** (모든 배포판):
```bash
chmod +x Digital-Scrap-Diary-1.0.0.AppImage
./Digital-Scrap-Diary-1.0.0.AppImage
```

**Debian/Ubuntu**:
```bash
sudo dpkg -i digital-scrap-diary_1.0.0_amd64.deb
```

---

## 🚀 개발 환경 설정

### 사전 요구사항
- **Node.js** 18.0.0 이상
- **npm** 9.0.0 이상

### 설치
```bash
git clone https://github.com/yourusername/digitalscrapdiary.git
cd digitalscrapdiary
npm install
```

### 개발 모드 실행

#### 웹 버전
```bash
npm run dev
# http://localhost:3000 에서 확인
```

#### Electron 앱
```bash
npm run electron:dev
# 데스크톱 앱이 자동으로 실행됨
```

---

## 📦 빌드

### 로컬 빌드

#### macOS
```bash
npm run electron:build:mac
# 결과: release/Digital Scrap Diary-1.0.0.dmg
```

#### Windows
```bash
npm run electron:build:win
# 결과: release/Digital Scrap Diary Setup 1.0.0.exe
```

#### Linux
```bash
npm run electron:build:linux
# 결과: release/Digital-Scrap-Diary-1.0.0.AppImage
```

#### 모든 플랫폼
```bash
npm run electron:build
```

### 빌드 파일 위치
```
release/
├── Digital Scrap Diary-1.0.0-arm64-mac.zip     # macOS Apple Silicon
├── Digital Scrap Diary-1.0.0-x64-mac.zip       # macOS Intel
├── Digital Scrap Diary-1.0.0-arm64.dmg         # macOS Apple Silicon 인스톨러
├── Digital Scrap Diary-1.0.0-x64.dmg           # macOS Intel 인스톨러
├── Digital Scrap Diary Setup 1.0.0.exe         # Windows 인스톨러
├── Digital Scrap Diary 1.0.0.exe               # Windows 포터블
├── Digital-Scrap-Diary-1.0.0.AppImage          # Linux AppImage
└── digital-scrap-diary_1.0.0_amd64.deb         # Debian/Ubuntu 패키지
```

---

## 📚 사용 가이드

### 기본 사용법

#### 1. 다이어리 시작
- 앱을 실행하면 자동으로 데이터가 로드됩니다
- 데이터 위치: `~/Documents/ScrapDiary/current.json`

#### 2. 콘텐츠 추가
- **상단 입력창**: URL 입력 → 자동 스크랩
- **➕ 버튼**: 이미지, 스티커, 데코레이션 추가
- **드래그앤드롭**: 자유롭게 배치

#### 3. 자동 저장
- 편집 후 5초마다 자동 저장
- 수동 저장: 💾 버튼 클릭

#### 4. 백업 관리
- 💾 백업 버튼 → "새 백업 생성"
- 백업 목록에서 복원 가능

#### 5. 내보내기
- **PNG 내보내기**: 보라색 화살표 버튼
- **PDF 내보내기**: 빨간색 화살표 버튼
- **옵션**: 품질, 안전 모드, 워터마크 선택
- **🛡️ 안전 모드 권장**: SNS 임베드 제외 (저작권 안전, 공유용)

---

### 레이아웃

#### 월간 레이아웃
- 왼쪽: 프로필 & 위젯
- 오른쪽: 월간 캘린더
- 날짜 클릭 → 일간 페이지로 전환

#### 주간 레이아웃
- 7일간의 일정 관리
- 주별 메인 이벤트 설정

#### 자유 레이아웃
- 자유로운 스크랩북 형식
- 무제한 콘텐츠 배치

---

## 🛠 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링

### Desktop
- **Electron 28** - 데스크톱 앱 프레임워크
- **Node.js 18** - 런타임
- **electron-builder** - 앱 패키징

### Storage
- **파일 시스템** - JSON 파일 기반
- **Atomic write** - 데이터 안전성

---

## 📁 프로젝트 구조

```
digitalscrapdiary/
├── src/                      # React 소스 코드
│   ├── components/           # UI 컴포넌트
│   ├── hooks/                # 커스텀 훅
│   ├── services/             # 비즈니스 로직
│   ├── types/                # TypeScript 타입
│   └── App.tsx               # 메인 앱
├── electron/                 # Electron 메인 프로세스
│   ├── main.ts               # 메인 프로세스
│   ├── preload.ts            # 프리로드 스크립트
│   └── tsconfig.json         # TypeScript 설정
├── build/                    # 빌드 리소스
│   ├── icon.icns             # macOS 아이콘
│   ├── icon.ico              # Windows 아이콘
│   └── icon.png              # Linux 아이콘
├── .github/workflows/        # GitHub Actions
│   └── release.yml           # 릴리스 자동화
├── package.json              # 프로젝트 메타데이터
├── electron-builder.json     # 빌드 설정
└── vite.config.ts            # Vite 설정
```

---

## 🤝 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🐛 버그 리포트

버그를 발견하셨나요? [Issue](https://github.com/yourusername/digitalscrapdiary/issues)를 생성해주세요!

**포함할 정보**:
- OS 버전 (macOS 14.0, Windows 11 등)
- 앱 버전 (1.0.0)
- 재현 단계
- 예상 동작 vs 실제 동작
- 스크린샷 (선택사항)

---

## 📖 문서

- [📚 FINAL_PROJECT_REPORT.md](FINAL_PROJECT_REPORT.md) - 프로젝트 종합 보고서
- [🚀 DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 배포 가이드
- [🔐 CODE_SIGNING_GUIDE.md](CODE_SIGNING_GUIDE.md) - 코드 서명 가이드
- [🎨 build/ICON_GUIDE.md](build/ICON_GUIDE.md) - 아이콘 생성 가이드

---

## 🔒 보안

### 데이터 저장
- 모든 데이터는 로컬에 저장됩니다 (`~/Documents/ScrapDiary/`)
- 외부 서버로 전송되지 않습니다
- 백업 파일은 사용자가 직접 관리합니다

### 코드 서명
- 현재 버전은 코드 서명되지 않았습니다
- 오픈소스로 소스 코드를 확인할 수 있습니다
- 향후 버전에서 코드 서명 추가 예정

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 💬 커뮤니티

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **GitHub Discussions**: 질문 및 토론
- **Email**: support@digitalscrapdiary.app

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 라이브러리를 사용합니다:

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [electron-builder](https://www.electron.build/)

---

## 🎉 버전 히스토리

### v1.0.0 (2025-12-18)
- 🎉 첫 번째 공식 릴리스
- ✨ Electron 데스크톱 앱 전환
- 💾 파일 시스템 기반 저장
- 📤 PNG/PDF 내보내기
- 🛡️ 안전 모드 & 워터마크
- 🕐 버전 히스토리 & 백업 관리

---

<div align="center">

**Made with ❤️ by Digital Scrap Diary Team**

[⬆ 맨 위로 가기](#-digital-scrap-diary)

</div>
