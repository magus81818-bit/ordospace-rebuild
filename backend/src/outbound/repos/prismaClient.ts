import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

// PostgreSQL 드라이버 어댑터로 Prisma 클라이언트 생성 (앱 전체에서 하나만 공유)
// - Render 같은 외부 DB는 SSL 필수 → DATABASE_SSL=true면 SSL로 접속
// - 무료 인스턴스에 맞게 커넥션 풀을 작게 유지하고 유휴 커넥션은 빨리 정리
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ...(process.env.DATABASE_SSL === "true"
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});
export const prismaClient = new PrismaClient({ adapter });
