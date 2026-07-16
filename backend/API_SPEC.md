# ORDOSPACE Rebuild — API 기능 명세서

Base URL (배포): `https://ordospace-rebuild.onrender.com`
인증: `Authorization: Bearer <JWT>` (로그인 성공 시 발급, 대부분의 엔드포인트에 필요)

## 1. 인증 (Auth)

| 메서드 | 경로 | 인증 | 역할 | 요청 본문 | 응답 |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | ✕ | — | `{ email, password, username, role }` | `{ user }` (비밀번호 제외) |
| POST | `/api/auth/signin` | ✕ | — | `{ email, password }` | `{ token }` |
| POST | `/api/auth/signout` | ✕ | — | — | `{ message }` |

- 비밀번호는 bcrypt로 해시하여 저장, 원문은 저장하지 않음.
- 로그인 성공 시 JWT 발급, 이후 요청은 `Authorization: Bearer <token>` 헤더로 인증.

## 2. 사용자 (User)

| 메서드 | 경로 | 인증 | 역할 | 요청 본문 | 응답 |
|---|---|---|---|---|---|
| GET | `/api/users/me` | ✓ | any | — | `{ me: { id, email, username, role } }` |

## 3. ModuleCard (핵심 라이프사이클)

| 메서드 | 경로 | 인증 | 역할 | 요청 본문 | 응답 | 결과 상태 |
|---|---|---|---|---|---|---|
| GET | `/api/module-cards` | ✓ | any | — | `{ cards: [...] }` (역할별 필터: ADMIN=전체, WORKER=담당분, CLIENT=소유 프로젝트) | — |
| GET | `/api/module-cards/:id` | ✓ | 열람권 | — | `{ card }` | — |
| POST | `/api/module-cards` | ✓ | ADMIN | `{ projectId, module, title, description, assignedToId, dueDate? }` | `{ card }` | `PENDING` |
| PATCH | `/api/module-cards/:id` | ✓ | WORKER(담당자) | `{ progress, qcStatus, note? }` | `{ card }` | `IN_PROGRESS` 또는 `QC_READY` |
| POST | `/api/module-cards/:id/submit` | ✓ | WORKER(담당자) | — | `{ card }` | `ADMIN_REVIEW` |
| POST | `/api/module-cards/:id/send-to-client` | ✓ | ADMIN | `{ note? }` | `{ card }` | `CLIENT_REVIEW` |
| POST | `/api/module-cards/:id/approve` | ✓ | CLIENT(프로젝트 소유) | — | `{ card }` | `APPROVED` (progress=100) |
| POST | `/api/module-cards/:id/request-revision` | ✓ | CLIENT(프로젝트 소유) | `{ note }` | `{ card }` | `REVISION_REQUESTED` |

### 상태 전이 규칙

```
PENDING → IN_PROGRESS → QC_READY → ADMIN_REVIEW → CLIENT_REVIEW → APPROVED
                                                          ↓
                                                  REVISION_REQUESTED → (WORKER 재작업)
```

- 서버가 Zod 스키마로 입력을 검증하고, 각 행위의 역할·현재 상태를 확인해 불법 전이를 차단(`BusinessException`).
- 모든 상태 전이는 `Activity` 테이블에 자동 기록(누가, 언제, 무엇을).

## 4. 헬스체크

| 메서드 | 경로 | 인증 | 응답 |
|---|---|---|---|
| GET | `/api/health` | ✕ | `{ ok: true }` |

## 5. 공통 에러 응답

| 상황 | HTTP 상태 | 응답 형식 |
|---|---|---|
| 인증/권한/업무 규칙 위반 | 401 | `{ message }` |
| 서버 내부 오류 | 500 | `{ message }` |
| 존재하지 않는 경로 | 401 | `{ message: "존재하지 않는 api 요청입니다." }` |

## 6. 데이터 모델 요약

- **User**: id, email, password(해시), username, role(ADMIN/WORKER/CLIENT)
- **Project**: id, name, clientId
- **ModuleCard**: id, projectId, module, title, description, status, assignedToId, dueDate, progress, qcStatus, revisionCount
- **Comment**: id, cardId, authorId, body
- **Activity**: id, cardId, actorId, type, fromStatus, toStatus, note
