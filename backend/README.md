# ORDOSPACE Backend (rebuild)

메모잇(`my-memo-backend`) 방법론 기반 ORDOSPACE 백엔드. TypeScript + Express + Prisma + PostgreSQL + Zod + bcrypt/JWT, 클린 4레이어(inbound → application → outbound → shared).

## 라운드 진행 상황
- R1: 인증 슬라이스 — signup(role) / signin(JWT userId+role) / GET /me. 서비스 테스트 포함.
- R2: ModuleCard 라이프사이클 — 순수 상태전이 도메인 + 서비스 + 컨트롤러(역할 가드) + Activity 이력.
- **R3 (현재): 시드 + 통합 스모크** — 3역할 계정/샘플 카드 시드, 전체 라이프사이클 fetch 스모크.
- R3.5: 프론트 배선(기존 ORDOSPACE UI → 새 API) — 예정
- R4: Render(백엔드+DB, Free) + Vercel(프론트, 유료) 배포 — 예정

## ⚠️ 실행 함정 (PowerShell)
PowerShell 실행정책이 `npm.ps1`/`npx.ps1`을 막으면(PSSecurityException) **`npm.cmd`/`npx.cmd`로 호출**한다.
(대안: 한 번 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 실행 후 Y — 그러면 `npm`/`npx`도 됨.)

## 로컬 실행 (PowerShell — 절대규칙 7)
```powershell
cd "C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_rebuild\backend"
npm.cmd install
Copy-Item .env.example .env      # 그리고 .env의 DATABASE_URL / JWT_SECRET 채우기
npx.cmd prisma generate          # src/generated/prisma 생성 (테스트/빌드 전 필수)
npm.cmd test                     # 서비스/도메인 단위 테스트 (DB 불필요)
npm.cmd run type                 # 타입 체크
```

## DB 연결 후 API 확인
```powershell
# .env의 DATABASE_URL을 로컬 PostgreSQL로 두고
npx.cmd prisma migrate dev --name init
npm.cmd run dev                  # http://localhost:3000
curl -X POST localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"admin@a.com","password":"pw123456","username":"admin","role":"ADMIN"}'
curl -X POST localhost:3000/api/auth/signin -H "Content-Type: application/json" -d '{"email":"admin@a.com","password":"pw123456"}'
curl localhost:3000/api/users/me -H "Authorization: Bearer <TOKEN>"
```

## R3 시드 + 스모크 (로컬)
```powershell
# 서버는 .env의 로컬 DATABASE_URL + DATABASE_SSL=false 로
npx.cmd prisma migrate dev --name init   # 스키마 반영 (최초 1회)
npm.cmd run seed                          # admin/worker/client + 샘플 카드 (비번 pw123456)
npm.cmd run dev                           # 별도 창에서 서버 실행 (localhost:3000)
npm.cmd run smoke                         # 전체 라이프사이클 통합 스모크 (서버 켜둔 채 실행)
```
스모크가 검사하는 것: 헬스체크 → 3역할 로그인/JWT → /me → admin 생성 → 역할 가드(client 생성 차단) → worker 업데이트/제출 → admin 전달 → client 승인(APPROVED).

## 배포 커맨드 (R4, Render — 메모잇 함정 로그 반영, TS 기준)
- Build: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- Start: `npm start`
- 레슨의 `npm install --production` 커맨드는 devDeps(typescript/prisma)를 빼서 빌드 실패하므로 사용 금지.

## 비밀값
`.env`(DATABASE_URL, JWT_SECRET)는 절대 커밋/기록 금지. `.gitignore`에 포함됨.
