# ⚠️ 빠른 수정 가이드

**문제**: Vite HMR 캐시 오류  
**해결 시간**: 1분

---

## 🔧 해결 방법

터미널에서 실행:

```bash
# 1. 프로세스 종료 (Ctrl+C로 이미 종료했다면 생략)
pkill -f "electron"
pkill -f "vite"

# 2. 캐시 삭제
rm -rf node_modules/.vite
rm -rf dist-electron

# 3. 재시작
npm run electron:dev
```

---

## ✅ 예상 결과

- ✅ Vite dev server 정상 시작
- ✅ Electron 윈도우 열림
- ✅ 에러 없이 앱 실행

---

**또는 간단히**:

```bash
npm run dev
```

(웹 브라우저에서 먼저 테스트)




