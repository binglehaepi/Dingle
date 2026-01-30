#!/bin/bash

# Electron 설치 스크립트
# Phase 2: Electron 환경 세팅

echo "🔧 npm 권한 수정 중..."
sudo chown -R $(whoami) "$HOME/.npm"

echo "📦 Electron 패키지 설치 중..."
cd "$(dirname "$0")"

npm install --save-dev \
  electron@^28.0.0 \
  electron-builder@^24.9.1 \
  concurrently@^8.2.2 \
  wait-on@^7.2.0 \
  --legacy-peer-deps

echo "✅ 설치 완료!"
echo ""
echo "다음 명령어로 Electron 앱 실행:"
echo "  npm run electron:dev"




