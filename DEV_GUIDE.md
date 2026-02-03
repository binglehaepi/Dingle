# 개발 환경 가이드

## 빠른 개발 (권장)

### 1. Electron 개발 모드
```bash
npm run electron:dev
```
- Vite 개발 서버 자동 실행
- Electron 자동 실행
- 파일 저장 시 자동 새로고침
- 가장 빠른 개발 방법

### 2. 웹 개발 모드 (Electron 없이)
```bash
npm run dev
```
- 브라우저에서 확인 (http://localhost:3000)
- Electron 기능은 작동하지 않음

## 프로덕션 빌드

### 빌드 및 실행
```bash
npm run build
npm run electron:compile
npm start
```

### Windows 배포 파일 생성
```bash
npm run electron:build:win
```

## 배포 프로세스

1. 코드 수정 및 테스트 (`npm run electron:dev`)
2. 빌드 확인 (`npm run build`)
3. 버전 업데이트 (package.json)
4. Git 커밋 및 태그
```bash
git add .
git commit -m "v1.3.0: 기능 설명"
git tag v1.3.0
git push origin main
git push origin v1.3.0
```
5. GitHub Actions 자동 빌드 (5-10분)
6. Release 페이지에서 설치 파일 다운로드

## 주의사항
- `electron:dev` 모드는 개발용이므로 최종 확인은 빌드 후 진행
- 핫 리로드가 안 될 경우 Electron 재시작




