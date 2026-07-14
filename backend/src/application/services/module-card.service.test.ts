import { describe, it, expect, jest } from "@jest/globals";
import { createModuleCardService } from "./module-card.service.js";
import { IModuleCardRepo } from "../contracts/module-card-repo.contract.js";
import { IActivityRepo } from "../contracts/activity-repo.contract.js";

// 테스트용 카드 팩토리 (필요한 필드만 덮어쓰기)
const makeCard = (over: Record<string, unknown> = {}) =>
  ({
    id: 10,
    projectId: 1,
    module: "UI",
    title: "제목",
    description: "설명",
    status: "QC_READY",
    assignedToId: 2, // worker id
    dueDate: null,
    progress: 100,
    qcStatus: "PASSED",
    revisionCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: { clientId: 3 }, // client id
    ...over,
  }) as any;

const build = (cardOverride: Record<string, unknown> = {}) => {
  const findAllForRole = jest.fn<IModuleCardRepo["findAllForRole"]>();
  const findById = jest
    .fn<IModuleCardRepo["findById"]>()
    .mockResolvedValue(makeCard(cardOverride));
  const createCard = jest
    .fn<IModuleCardRepo["create"]>()
    .mockImplementation(async (d) => makeCard(d));
  const updateCard = jest
    .fn<IModuleCardRepo["update"]>()
    .mockImplementation(async (id, d) => makeCard({ id, ...d }));
  const createActivity = jest
    .fn<IActivityRepo["create"]>()
    .mockResolvedValue({} as any);
  const svc = createModuleCardService(
    findAllForRole,
    findById,
    createCard,
    updateCard,
    createActivity,
  );
  return { svc, findById, createCard, updateCard, createActivity };
};

describe("ModuleCardService (해피패스)", () => {
  it("admin이 카드를 생성하면 PENDING 상태 + assigned 활동이 기록된다", async () => {
    const { svc, createCard, createActivity } = build();
    await svc.assign({
      actorId: 1,
      actorRole: "ADMIN",
      projectId: 1,
      module: "UI",
      title: "제목",
      description: "설명",
      assignedToId: 2,
    });
    expect(createCard).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING", assignedToId: 2 }),
    );
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: "assigned", toStatus: "PENDING" }),
    );
  });

  it("담당 worker가 100%+PASSED로 업데이트하면 QC_READY로 간다", async () => {
    const { svc, updateCard } = build({ status: "IN_PROGRESS" });
    await svc.update({
      cardId: 10,
      actorId: 2,
      actorRole: "WORKER",
      progress: 100,
      qcStatus: "PASSED",
    });
    expect(updateCard).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: "QC_READY" }),
    );
  });

  it("client 수정 요청은 revisionCount를 올리고 REVISION_REQUESTED로 간다", async () => {
    const { svc, updateCard } = build({
      status: "CLIENT_REVIEW",
      revisionCount: 1,
    });
    await svc.requestRevision({
      cardId: 10,
      actorId: 3,
      actorRole: "CLIENT",
      note: "색상 수정 바랍니다",
    });
    expect(updateCard).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        status: "REVISION_REQUESTED",
        qcStatus: "BLOCKED",
        revisionCount: 2,
      }),
    );
  });
});

describe("ModuleCardService (크리티컬 케이스)", () => {
  it("담당자가 아닌 worker가 제출하면 거부된다 (소유권 가드)", async () => {
    const { svc } = build({ status: "QC_READY", assignedToId: 99 });
    await expect(
      svc.submit({ cardId: 10, actorId: 2, actorRole: "WORKER" }),
    ).rejects.toThrow("담당자만 제출할 수 있습니다");
  });

  it("CLIENT_REVIEW가 아닌 카드를 승인하면 거부된다 (불법 전이)", async () => {
    const { svc } = build({ status: "PENDING" });
    await expect(
      svc.approve({ cardId: 10, actorId: 3, actorRole: "CLIENT" }),
    ).rejects.toThrow("승인할 수 없는 상태입니다");
  });

  it("수정 요청 사유가 비면 거부된다", async () => {
    const { svc } = build({ status: "CLIENT_REVIEW" });
    await expect(
      svc.requestRevision({
        cardId: 10,
        actorId: 3,
        actorRole: "CLIENT",
        note: "   ",
      }),
    ).rejects.toThrow("수정 요청 사유를 입력해주세요");
  });
});
