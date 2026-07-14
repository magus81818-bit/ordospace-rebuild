import "dotenv/config";
import bcrypt from "bcrypt";
import { prismaClient } from "../src/outbound/repos/prismaClient.js";

// 로컬/데모용 시드: admin·worker·client 3계정 + 프로젝트 + 여러 상태의 카드
// 재실행해도 쌓이지 않도록 계정은 upsert, 프로젝트/카드는 지우고 다시 생성한다.
const main = async () => {
  const password = await bcrypt.hash("pw123456", 10);

  const admin = await prismaClient.user.upsert({
    where: { email: "admin@ordo.com" },
    update: {},
    create: { email: "admin@ordo.com", password, username: "관리자", role: "ADMIN" },
  });
  const worker = await prismaClient.user.upsert({
    where: { email: "worker@ordo.com" },
    update: {},
    create: { email: "worker@ordo.com", password, username: "작업자", role: "WORKER" },
  });
  const client = await prismaClient.user.upsert({
    where: { email: "client@ordo.com" },
    update: {},
    create: { email: "client@ordo.com", password, username: "클라이언트", role: "CLIENT" },
  });

  // 이 클라이언트의 기존 프로젝트(및 카드) 정리 후 재생성
  await prismaClient.project.deleteMany({ where: { clientId: client.id } });
  const project = await prismaClient.project.create({
    data: { name: "브랜드 리뉴얼", clientId: client.id },
  });

  await prismaClient.moduleCard.createMany({
    data: [
      {
        projectId: project.id,
        module: "디자인",
        title: "랜딩 히어로 시안",
        description: "메인 히어로 섹션 시안 작업",
        assignedToId: worker.id,
        status: "PENDING",
      },
      {
        projectId: project.id,
        module: "퍼블리싱",
        title: "반응형 헤더",
        description: "헤더 반응형 마크업",
        assignedToId: worker.id,
        status: "IN_PROGRESS",
        progress: 40,
      },
      {
        projectId: project.id,
        module: "콘텐츠",
        title: "소개 페이지 카피",
        description: "회사 소개 문구",
        assignedToId: worker.id,
        status: "CLIENT_REVIEW",
        progress: 100,
        qcStatus: "PASSED",
      },
    ],
  });

  console.log("✔ seed 완료");
  console.log("  로그인 계정 (비번 공통: pw123456)");
  console.log("  - admin@ordo.com / worker@ordo.com / client@ordo.com");
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
