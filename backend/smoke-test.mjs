// 통합 스모크: 서버(npm run dev)와 시드(npm run seed)가 준비된 상태에서 실행.
//   node smoke-test.mjs        (기본 http://localhost:3000)
//   node smoke-test.mjs http://localhost:3000
const BASE = process.argv[2] || "http://localhost:3000";
const PW = "pw123456";

let step = 0;
const ok = (m) => console.log(`  ✔ [${++step}] ${m}`);
const fail = (m, extra) => {
  console.error(`  ✗ 실패 [${step + 1}] ${m}`, extra ?? "");
  process.exit(1);
};

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const signin = async (email) => {
  const { status, data } = await call("POST", "/api/auth/signin", {
    body: { email, password: PW },
  });
  if (status !== 200 || !data.token) fail(`로그인 ${email}`, data);
  return data.token;
};

const run = async () => {
  console.log(`ORDOSPACE 백엔드 스모크 @ ${BASE}`);

  // 헬스체크
  const h = await call("GET", "/api/health");
  if (h.status !== 200) fail("헬스체크", h.data);
  ok("헬스체크 200");

  // 세 역할 로그인 (시드 계정)
  const [adminT, workerT, clientT] = await Promise.all([
    signin("admin@ordo.com"),
    signin("worker@ordo.com"),
    signin("client@ordo.com"),
  ]);
  ok("admin/worker/client 로그인 + JWT 발급");

  // /me 로 role 확인
  const me = await call("GET", "/api/users/me", { token: adminT });
  if (me.data?.me?.role !== "ADMIN") fail("admin /me role", me.data);
  ok("/me role=ADMIN 확인 (비번 미포함)");

  // 담당 worker id 파악 (worker /me)
  const workerMe = await call("GET", "/api/users/me", { token: workerT });
  const workerId = workerMe.data.me.id;

  // 1) admin 생성·배정
  const created = await call("POST", "/api/module-cards", {
    token: adminT,
    body: {
      projectId: (await firstProjectId(adminT)),
      module: "QA",
      title: "스모크 라이프사이클 카드",
      description: "생성→제출→전달→승인",
      assignedToId: workerId,
    },
  });
  if (created.status !== 200) fail("admin 카드 생성", created.data);
  const cardId = created.data.card.id;
  if (created.data.card.status !== "PENDING") fail("생성 상태 PENDING", created.data);
  ok(`admin 카드 생성 #${cardId} (PENDING)`);

  // 2) 권한 가드: client가 생성 시도 → 거부(401)
  const forbidden = await call("POST", "/api/module-cards", {
    token: clientT,
    body: { projectId: 1, module: "x", title: "x", description: "x", assignedToId: workerId },
  });
  if (forbidden.status === 200) fail("역할 가드(클라이언트 생성 차단)", forbidden.data);
  ok("역할 가드: client의 카드 생성 차단");

  // 3) worker 업데이트 100%+PASSED → QC_READY
  const updated = await call("PATCH", `/api/module-cards/${cardId}`, {
    token: workerT,
    body: { progress: 100, qcStatus: "PASSED", note: "완료" },
  });
  if (updated.data.card?.status !== "QC_READY") fail("worker 업데이트 QC_READY", updated.data);
  ok("worker 업데이트 → QC_READY");

  // 4) worker 제출 → ADMIN_REVIEW
  const submitted = await call("POST", `/api/module-cards/${cardId}/submit`, { token: workerT });
  if (submitted.data.card?.status !== "ADMIN_REVIEW") fail("제출 ADMIN_REVIEW", submitted.data);
  ok("worker 제출 → ADMIN_REVIEW");

  // 5) admin 전달 → CLIENT_REVIEW
  const sent = await call("POST", `/api/module-cards/${cardId}/send-to-client`, { token: adminT, body: {} });
  if (sent.data.card?.status !== "CLIENT_REVIEW") fail("전달 CLIENT_REVIEW", sent.data);
  ok("admin 전달 → CLIENT_REVIEW");

  // 6) client 승인 → APPROVED
  const approved = await call("POST", `/api/module-cards/${cardId}/approve`, { token: clientT });
  if (approved.data.card?.status !== "APPROVED") fail("승인 APPROVED", approved.data);
  ok("client 승인 → APPROVED (progress 100)");

  console.log("\n✅ 스모크 전체 통과 — 라이프사이클 + 역할 가드 동작 확인");
};

// admin 목록에서 첫 프로젝트 id 얻기 (시드가 만든 프로젝트)
const firstProjectId = async (token) => {
  const { data } = await call("GET", "/api/module-cards", { token });
  const card = (data.cards || [])[0];
  if (!card) fail("시드 카드 없음 — 먼저 npm run seed 실행");
  return card.projectId;
};

run().catch((e) => fail("예외", e?.message || e));
