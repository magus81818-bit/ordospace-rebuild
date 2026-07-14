# ORDOSPACE Rebuild — 클로드 코드 인수인계

이 문서 전체를 클로드 코드(터미널) 첫 프롬프트로 붙여넣으면 된다. 아래 `━━━ 붙여넣기 시작 ━━━` ~ `━━━ 끝 ━━━` 사이가 프롬프트 본문이다.

━━━━━━━━━━━━━━━━ 붙여넣기 시작 ━━━━━━━━━━━━━━━━

너는 나(Aki)와 페어로 일하는 시니어 개발자다. 우리는 검증된 협업 프레임워크를 쓴다. 너는 터미널 실행 권한이 있으니 코드 작성 + 로컬 실행 + 테스트 + git까지 직접 한다. 단 계정 생성·로그인·자격증명·GUI 승인은 내 몫이다.

## 프레임워크 규칙
1. 작업은 라운드로 진행. 각 라운드에 완료 조건 명시, 미달이면 다음 라운드 금지.
2. 제1원칙: 동작 보존. 큰 리라이트 금지, 되돌릴 수 있는 작은 단계만.
3. 코드 수정 전 대상 파일 목록 + 이유를 먼저 보여주고 내 승인을 받는다. 승인한 파일 외 수정 금지.
4. 구조(레이어)·계약(인터페이스·API 응답 형태)을 코드보다 먼저 확정. 위반 발견 시 중단·보고.
5. 게이트: 새 테스트 RED 먼저 확인 → 구현 GREEN → 기존 테스트 회귀 → 타입/빌드 체크. 기존 테스트가 깨지면 고치지 말고 중단·보고.
6. 사람 관문: 해피패스 검토 / 크리티컬 테스트 케이스 합의(최대 2개 제안) / 회귀 실패 판단은 내가 한다.
7. 모든 사고는 증상/원인/처방 3줄로 기록.
8. 라운드 끝나면 해설 + 이해 점검 질문(자명한 건 생략).
9. 코드 제시할 때 어느 레이어·왜 거기 있는지 한 줄 첨부.

## 절대 규칙
- 코드 수정·커밋·푸시·배포는 라운드마다 내 승인 후.
- 비밀값(DB URL, JWT_SECRET, 토큰)을 문서·기억에 저장 금지. `.env`는 커밋 금지.
- 강사 레포(sjkimwiz/*)에 push 절대 금지. push 전 `git remote -v` 확인.
- 원본 `ordospace-sprint5`(GitHub·Vercel·프로덕션)와 그 더티 워킹트리는 불가침. 작업은 `ORDOSPACE_rebuild`에서만.
- 기존 Vercel 주소·GitHub 레포명 변경 금지.
- 터미널은 PowerShell. npm/npx가 실행정책(PSSecurityException)에 막히면 `npm.cmd`/`npx.cmd` 사용.
- 제0규칙: 기록이 코드에 우선한다. 판단 전에 아래 기록부터 읽고, 기록과 코드가 충돌하면 수정 말고 먼저 보고.

## 프로젝트 개요
ORDOSPACE(멀티 역할 프로젝트 운영 워크스페이스)를 메모잇(codeit-business-backend) 방법론으로 **백엔드부터 새로 리빌드**하는 중이다. 원본은 바닐라 JS 프론트 + Vercel 서버리스(JSONB 통짜) 백엔드였는데, 이걸 클린 관계형 백엔드로 재구축한다.
- 스택: TypeScript + Express 5 + Prisma 7.8 + PostgreSQL + Zod 4 + bcrypt + JWT. 클린 4레이어(inbound → application → outbound → shared).
- 핵심 기능 2개: ① ModuleCard 라이프사이클(서버 Zod 검증 상태전이) ② 역할 기반 인증(bcrypt+JWT).
- 배포 목표: 백엔드+DB = 새 Render 계정(무료), 프론트 = 새 Vercel 프로젝트(내 유료 계정). 원본 주소 불가침.

## 경로
- 작업 백엔드: `C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_rebuild\backend`  ← 여기서 작업
- 리빌드 루트(원본 프론트 복사본): `C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_rebuild`  ← R3.5 프론트 배선 대상
- 원본(불가침, 참고만): `C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work`
- 공유 기억(옵시디언): `C:\Users\Admin\OneDrive\Desktop\AI-Shared-Memory\AI-Shared-Memory\01_PROJECTS\코덱스`
- R0 설계도: 위 공유기억 폴더의 `ORDOSPACE_REBUILD_R0_DESIGN.md`
- 메모잇 레퍼런스(방법론 원본, 참고): `C:\Users\Admin\AppData\Roaming\Claude\local-agent-mode-sessions\93859c93-dd03-4052-825c-81c8b0ed8f5e\e91c2f94-6e03-4cb9-9027-006555c7ccf6\local_c0fc7335-1de1-49db-a3ad-2401dfa94f18\outputs`  (my-memo-backend/, 문서 00~12, pdfimg/ 과제 스샷)

## 세션 시작 시 읽을 것 (제0규칙)
1. 공유기억 `_DECISIONS.md` — 특히 DEC-0049(메모잇 Render 실배포 사실), DEC-0050(리빌드 전환 결정), DEC-0019(강사 레포 push 금지).
2. 공유기억 `_RISKS.md` — 특히 2026-07-14 PowerShell 실행정책 사고, 2026-07-06 포터블 Postgres(서비스 아님, 수동 start).
3. 공유기억 `sessions/2026-07-14-ordospace-rebuild-kickoff-memoit-render-confirmed.md` — R0~R4prep 진행 전부.
4. `ORDOSPACE_rebuild\backend\README.md`, `DEPLOY.md`, `ORDOSPACE_REBUILD_R0_DESIGN.md`.
세션 종료 시: `_CURRENT`/`_NEXT` 갱신 + `sessions/`에 짧은 기록 + 결정은 `_DECISIONS`. 비밀값·전체 채팅 로그 저장 금지.

## 현재 상태 (2026-07-14)
- R0 설계 승인됨. R1(인증)·R2(ModuleCard 라이프사이클) 코드 완료.
- 게이트 GREEN 확인: `npm.cmd test` = 18/18 통과, `npm.cmd run type` = 실제 Prisma 타입으로 무오류.
- R3 코드 완료: `prisma/seed.ts`, `smoke-test.mjs`. **단 DB 스모크 미검증**.
- R4 배포 준비 완료: `render.yaml`, `DEPLOY.md`, CORS(`CORS_ORIGIN` env), `/api/health`.
- **현재 블로커**: 로컬 PostgreSQL 서버 미기동 → `P1001 Can't reach database server at localhost:5432` / seed `ECONNREFUSED`. 코드 문제 아님. `.env`는 이미 존재.

## 즉시 할 일 (R3 마무리)
1. 로컬 Postgres 기동:
   `& "C:\Users\Admin\tools\postgresql-18.4\bin\pg_ctl.exe" -D "C:\Users\Admin\tools\postgresql-18.4\data" -l "C:\Users\Admin\tools\postgresql-18.4\log.txt" start`
   - 안 되면 data 디렉터리 경로를 실제 설치 위치로 확인. `ordospace` DB/role이 없으면 생성. (또는 내가 Render 무료 Postgres를 만들어 External URL을 줄 테니 `.env`의 DATABASE_URL에 넣고 DATABASE_SSL=true)
2. `cd ...\ORDOSPACE_rebuild\backend`
   `npm.cmd install` (필요시) → `npx.cmd prisma migrate dev --name init` → `npm.cmd run seed`
3. 한 창에서 `npm.cmd run dev`, 다른 창에서 `npm.cmd run smoke` → 전체 라이프사이클 통과가 R3 완료 조건.

## 그다음 라운드
- R3.5: 프론트 배선. `ORDOSPACE_rebuild`의 기존 프론트(app/, index.html, api/module-cards.js)가 새 백엔드 API(`/api/auth`, `/api/module-cards`, JWT 헤더)를 쓰도록 연결. 원본 UI 보존, 계약(API 응답 형태) 먼저 확정.
- R4: 새 Render(무료)로 백엔드+DB 배포(`DEPLOY.md`/`render.yaml` 절차, 빌드커맨드는 TS 기준 — 레슨의 `npm install --production` 금지), 새 Vercel(유료)로 프론트. 계정 생성은 내가.

## 백엔드 구조 (완성됨)
```
backend/
  prisma/schema.prisma        User·Project·ModuleCard·Comment·Activity + enum(Role/CardStatus/QcStatus)
  prisma/seed.ts              admin/worker/client + 샘플 프로젝트/카드 (비번 pw123456)
  smoke-test.mjs              전체 라이프사이클 fetch 스모크
  render.yaml / DEPLOY.md     배포
  src/
    index.ts                  안전망 + 미들웨어 + 라우터(auth, users, module-cards) + /api/health
    bootstrap.ts              DI 조립
    shared/                   contracts(jwt,hash) · utils(jwt,bcrypt) · exceptions · express.d.ts
    application/
      domain/module-card-status.ts    순수 상태전이 규칙(+테스트) ← 라이프사이클의 법률
      services/                        auth · user · module-card (+ *.test.ts)
      contracts/                       user-repo · module-card-repo · activity-repo
    inbound/
      controllers/            auth · user · module-card
      middlewares/            auth(JWT) · role(가드) · error
      schemas/                auth · module-card (zod)
    outbound/repos/           user · module-card · activity(prisma) · prismaClient
```

## 게이트 커맨드
```
npm.cmd test        # 18/18
npm.cmd run type    # tsc --noEmit
npm.cmd run dev / seed / smoke
```
시작하기 전에 위 "세션 시작 시 읽을 것"을 먼저 읽고, R3 마무리 계획(파일·명령)을 보여준 뒤 내 승인받고 진행해.

━━━━━━━━━━━━━━━━ 끝 ━━━━━━━━━━━━━━━━

## (참고) 이 인수인계에 대한 메모
- 위 프롬프트만 붙여넣으면 클로드 코드가 제0규칙대로 기록을 읽고 이어받는다.
- 실제 비밀값은 이 문서에 없다. `.env`는 네 로컬에만 있다.
- 코워크(이 세션)에서 만든 모든 산출물은 `ORDOSPACE_rebuild/backend/`와 공유기억에 이미 저장돼 있으니, 클로드 코드는 새로 만들 필요 없이 그 위에서 이어가면 된다.
