# ORDOSPACE Rebuild

멀티 역할(관리자·작업자·클라이언트) 프로젝트 운영 워크스페이스.
기존 ORDOSPACE 정적 프로토타입의 UI는 그대로 보존하고, 그 뒤에 **클린 관계형 백엔드(TypeScript + Express + Prisma + PostgreSQL)** 를 새로 구축해 연결한 리빌드 버전입니다.

## 라이브 데모

| 레이어 | URL |
|---|---|
| 프론트엔드 (Vercel) | https://ordospace-rebuild.vercel.app |
| 백엔드 API (Render) | https://ordospace-rebuild.onrender.com |
| 헬스체크 | https://ordospace-rebuild.onrender.com/api/health |

> Render 무료 플랜은 유휴 시 잠들었다가 첫 요청에서 깨어납니다(최대 ~50초). 첫 로그인이 느리면 정상입니다.

**데모 계정** (비밀번호 공통: `pw123456`)

| 역할 | 이메일 | 보이는 것 |
|---|---|---|
| 관리자(PM) | `admin@ordo.com` | 전체 카드, 생성·전달 |
| 작업자 | `worker@ordo.com` | 본인 담당 카드, 업데이트·제출 |
| 클라이언트 | `client@ordo.com` | 소유 프로젝트 카드, 승인·수정요청 |

## 핵심 기능 2가지

1. **ModuleCard 라이프사이클** — 서버가 Zod로 검증하는 상태 전이.
   `PENDING → IN_PROGRESS → QC_READY → ADMIN_REVIEW → CLIENT_REVIEW → APPROVED / REVISION_REQUESTED`
   불법 전이·권한 위반은 서버가 거부하고, 모든 전이는 `Activity`로 기록됩니다. 카드 단위 갱신이라 전체 컬렉션 덮어쓰기 위험이 없습니다.
2. **역할 기반 실제 인증** — bcrypt 해시 + JWT. 로그인하면 실제 신분(역할)으로 화면·데이터·행동 권한이 결정됩니다. 백엔드에 닿지 않는 환경에서는 기존 데모(mock) 로그인으로 폴백합니다.

## 기술 스택

- **백엔드**: TypeScript · Express 5 · Prisma 7 · PostgreSQL · Zod 4 · bcrypt · JWT (+ helmet, express-rate-limit, cors, morgan)
- **프론트엔드**: 기존 정적 HTML/CSS/Vanilla JS 유지(사전 빌드된 Tailwind), 새 API 배선 레이어만 추가
- **배포**: 백엔드+DB = Render(Free) · 프론트 = Vercel

## 구조 (모노레포)

```
/                  정적 프론트엔드 (index.html + app/)
├─ app/
│  ├─ config/      화면 상수 · api.config.js(백엔드 오리진)
│  ├─ services/    session · api(JWT) · 카드 어댑터/동기화/액션 오버라이드 · app-boot
│  ├─ screens/     admin / worker / client 워크스페이스
│  └─ ...          router · ui · data · qa
└─ backend/        클린 4레이어 백엔드
   ├─ prisma/      schema.prisma · migrations · seed.ts
   └─ src/
      ├─ inbound/      controllers · middlewares(auth/role/error) · zod schemas
      ├─ application/  services(+TDD 테스트) · domain(순수 상태전이 규칙) · contracts
      ├─ outbound/     Prisma repo 구현체
      └─ shared/       jwt/bcrypt utils · exceptions
```

프론트 배선 원칙: 기존 화면·라이프사이클 코드는 수정하지 않고, 인증 시에만 백엔드판으로 동작을 교체(오버라이드)하는 **덧셈 방식**. 백엔드가 죽어도 데모 모드로 계속 동작합니다.

## 로컬 실행

```powershell
# 백엔드 (PowerShell 실행정책에 npm이 막히면 npm.cmd/npx.cmd 사용)
cd backend
npm.cmd install
Copy-Item .env.example .env     # DATABASE_URL / JWT_SECRET 채우기
npx.cmd prisma generate
npx.cmd prisma migrate dev --name init
npm.cmd run seed                # 데모 계정 + 샘플 카드
npm.cmd run dev                 # http://localhost:3000

# 게이트
npm.cmd test                    # 단위 테스트 (DB 불필요)
npm.cmd run type                # tsc --noEmit
npm.cmd run smoke               # 서버 켜둔 채: 전체 라이프사이클 통합 스모크

# 프론트: 루트를 아무 정적 서버로 서빙 (api.config.js가 localhost:3000을 자동 지목)
```

프론트 자체 빌드(Tailwind/Lucide 재생성)와 정적 검증 스크립트는 [BUILD.md](BUILD.md)와 루트 `package.json`의 `check:js` / `static:validate-*` / `smoke` 스크립트를 참고하세요. 화면 구조 상세는 `app/` 하위 README에 있습니다.

## 배포 요약

- **Render Web Service**: Root Directory `backend`, Build `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`, Start `npm start`, Health `/api/health`. Env: `DATABASE_URL`, `DATABASE_SSL`, `JWT_SECRET`, `NODE_VERSION`, `CORS_ORIGIN`(프론트 오리진만 허용).
- **Vercel**: 정적 배포(빌드 없음). 배포본은 `index.html`의 `<meta name="ordo-api-base">`로 백엔드 오리진을 지목.
- 상세 절차: [backend/DEPLOY.md](backend/DEPLOY.md)

## 원본과의 관계

이 레포는 [ordospace-sprint5](https://github.com/magus81818-bit/ordospace-sprint5) 정적 프로토타입의 **리빌드**입니다. 원본 레포·배포는 변경하지 않았습니다.
