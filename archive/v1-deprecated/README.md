# V1 Deprecated Code Archive

이 디렉토리는 V1 아키텍처의 잔재 코드를 보관합니다.

## 삭제 파일 목록

### geminiService.ts.backup (24KB)
- **삭제일**: 2025-12-18
- **이유**: 클라이언트 CORS 프록시 사용 (정책 위반)
- **대체**: services/apiClient.ts (서버 API)
- **사용 여부**: ❌ 코드에서 import 안 됨

## 복원 방법 (긴급 시)

```bash
cp archive/v1-deprecated/geminiService.ts.backup services/geminiService.ts
```

⚠️ 주의: V2 아키텍처와 호환되지 않으므로 복원 시 정책 위반 발생

