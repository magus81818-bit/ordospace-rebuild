/* ============================================================
   [이 파일은] DB 연결 검증기 — Postgres 데이터베이스에 접속할 수 있는지 확인.
                환경변수(DATABASE_URL 등)가 설정되어 있고 실제로 연결되는지 점검.
   [언제 실행] DB 설정 변경 후, 또는 배포 환경 점검 시
   [수정할 때 주의] 실제 DB에 접속하므로 환경변수가 없으면 에러 발생.
   ============================================================ */
const {
  closeSql,
  createSql,
  DATABASE_ENV_KEYS
} = require('../api/_lib/module-card-repository.cjs');

async function main() {
  const presentEnv = DATABASE_ENV_KEYS.filter((key) => Boolean(process.env[key]));
  if (!presentEnv.length) {
    throw new Error('No ModuleCard database environment variable is available.');
  }

  const sql = createSql(process.env);
  try {
    const rows = await sql`select 1 as ok`;
    const ok = Array.isArray(rows) && rows[0] && Number(rows[0].ok) === 1;
    if (!ok) throw new Error('Database connection check returned an unexpected result.');
    console.log(JSON.stringify({
      ok: true,
      envKeysPresent: presentEnv
    }));
  } finally {
    await closeSql(sql);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
