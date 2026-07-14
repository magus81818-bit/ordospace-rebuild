# ORDOSPACE 배포 가이드 (R4)

메모잇과 동일 방법론. 백엔드+DB = **Render(무료, 신규 계정)**, 프론트 = **Vercel(유료, 기존 계정)**.
계정 생성·로그인은 사용자(Aki)가 수행한다.

---

## 0. 로컬 DB가 안 붙을 때 (P1001 / ECONNREFUSED)
로컬 PostgreSQL 서버가 꺼져 있어서다(포터블 설치는 재부팅 후 수동 시작 필요).
```powershell
& "C:\Users\Admin\tools\postgresql-18.4\bin\pg_ctl.exe" -D "C:\Users\Admin\tools\postgresql-18.4\data" -l "C:\Users\Admin\tools\postgresql-18.4\log.txt" start
```
또는 **아래 Render DB를 만들어 로컬 .env가 그걸 바라보게 하면 로컬 서버 없이도 검증 가능**.

---

## 1. Render PostgreSQL 생성 (무료)
1. https://render.com 로그인(GitHub 연동 권장) — **새 계정**.
2. New → **PostgreSQL** → Name `ordospace-db`, Region **Singapore**, Plan **Free** → Create.
3. 생성(수 분) 후 DB 페이지에서 두 URL을 구분해 사용:
   - **Internal Database URL** → Render 웹 서비스의 `DATABASE_URL` 용
   - **External Database URL** → 내 PC(로컬 검증·DBeaver) 용

## 2. (선택·권장) 로컬에서 Render DB로 먼저 검증
`.env`를 이렇게 두고:
```
DATABASE_URL="<Render External URL>"
DATABASE_SSL=true
JWT_SECRET="<길고 무작위>"
PORT=3000
```
```powershell
npx.cmd prisma migrate deploy    # 스키마를 Render DB에 반영
npm.cmd run seed                 # 계정+샘플 (비번 pw123456)
npm.cmd run dev                  # 로컬 서버가 Render DB에 붙음
npm.cmd run smoke                # 전체 라이프사이클 통과 확인
```

## 3. Render Web Service 생성 (무료)
- New → **Web Service** → 이 백엔드 레포/폴더 연결.
- Runtime **Node**, Plan **Free**, Region **Singapore**.
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
  - ⚠️ 레슨의 `npm install --production` 커맨드 금지 — devDeps(typescript/prisma)가 빠져 빌드 실패(메모잇 함정).
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **환경변수**:
  | key | value |
  |---|---|
  | DATABASE_URL | Render DB **Internal** URL |
  | DATABASE_SSL | true |
  | JWT_SECRET | 길고 무작위한 값 |
  | NODE_VERSION | 24 |
  | CORS_ORIGIN | 프론트 Vercel 주소 (아래 5번 이후 입력) |
- 배포 후 `https://<서비스>.onrender.com/api/health` 가 `{ok:true}` 면 성공. (무료는 유휴 시 잠들었다 첫 요청에서 느리게 깨어남 — 정상)

> Blueprint로 한 번에: 대시보드 New → **Blueprint** → `render.yaml` 인식 → DB+웹 동시 생성. CORS_ORIGIN만 나중에 입력.

## 4. DBeaver로 Render DB 열기 (선택)
New Connection → PostgreSQL → **External URL**의 host/port/db/user/password 입력 → SSL 탭 **require** → User/Project/ModuleCard/Activity 테이블 확인.

## 5. 프론트 (Vercel, 유료 신규 프로젝트)
- 기존 `ordospace-sprint5.vercel.app`은 **건드리지 않는다**(불가침).
- 새 Vercel 프로젝트 생성 → 프론트가 `VITE_API_URL`(또는 해당 설정)로 `https://<서비스>.onrender.com` 지목.
- 배포 후 그 Vercel 주소를 Render의 `CORS_ORIGIN`에 입력하고 재배포.
- (프론트 배선은 R3.5에서 코드로 진행 예정)

## 비밀값
DATABASE_URL / JWT_SECRET / External URL은 문서·기억에 저장 금지. `.env`는 `.gitignore`에 포함.
