import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    // ✅ Electron 호환: .env 파일 사용 (없어도 빌드 가능)
    let env: Record<string, string> = {};
    
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            env[key.trim()] = value.trim();
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ .env 파일을 읽을 수 없습니다. 기본값을 사용합니다.');
    }
    
    return {
      base: './',  // ✅ Electron에서 상대 경로 필요
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          overlay: true, // HMR 오류 오버레이
        },
        // 캐시 무효화 헤더 추가 (개발 모드 캐시 문제 해결)
        headers: {
          'Cache-Control': 'no-store',
        },
      },
      plugins: [
        react(),
        {
          name: 'ohaasa-api',
          configureServer(server) {
            // date 단위 캐시 (onair_date 기반)
            const cache = new Map<string, any>(); // key: `${onair}:${sign}`
            const jsonUrl = 'https://www.asahi.co.jp/data/ohaasa2020/horoscope.json';
            const sourceUrl = 'https://www.asahi.co.jp/ohaasa/week/horoscope';
            const signToSt: Record<string, string> = {
              aries: '01',
              taurus: '02',
              gemini: '03',
              cancer: '04',
              leo: '05',
              virgo: '06',
              libra: '07',
              scorpio: '08',
              sagittarius: '09',
              capricorn: '10',
              aquarius: '11',
              pisces: '12',
            };

            const yyyymmddToIso = (d: string) => (/^\\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d);

            server.middlewares.use('/api/ohaasa', async (req, res) => {
              try {
                const url = new URL(req.url || '', 'http://localhost');
                const sign = (url.searchParams.get('sign') || 'aries').toLowerCase();
                const st = signToSt[sign];
                if (!st) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'invalid sign' }));
                  return;
                }

                const raw = await fetch(jsonUrl).then((r) => r.json());
                const entry = Array.isArray(raw) ? raw[0] : raw;
                const onair = String(entry?.onair_date || '');
                const cacheKey = `${onair}:${sign}`;
                const cached = cache.get(cacheKey);
                if (cached) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(cached));
                  return;
                }

                const list: any[] = Array.isArray(entry?.detail) ? entry.detail : [];
                const hit = list.find((x) => String(x?.horoscope_st) === st);
                if (!hit) throw new Error('sign not found');

                const payload = {
                  date: yyyymmddToIso(onair),
                  sign,
                  rank: Number(hit?.ranking_no),
                  textJa: typeof hit?.horoscope_text === 'string' ? hit.horoscope_text : undefined,
                  sourceUrl,
                };
                cache.set(cacheKey, payload);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(payload));
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: String(e?.message || e || 'failed'), sourceUrl: 'https://www.asahi.co.jp/ohaasa/week/horoscope' }));
              }
            });
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false, // 프로덕션에서는 sourcemap 비활성화
        rollupOptions: {
          external: ['electron'],
          output: {
            // Code splitting 최소화 (프로덕션 환경에서 chunk 로딩 실패 방지)
            manualChunks: undefined,
            // 에셋 파일명 간소화
            assetFileNames: 'assets/[name].[ext]',
            chunkFileNames: 'assets/[name].js',
            entryFileNames: 'assets/[name].js',
          }
        },
        // CSS 인라인화 (별도 파일이 아니라 JS에 포함하여 로딩 실패 방지)
        cssCodeSplit: false,
        // 에셋 크기 제한 증가 (큰 이미지도 포함)
        assetsInlineLimit: 0
      }
    };
});
