import { IModuleCardRepo } from "../contracts/module-card-repo.contract.js";
import { IActivityRepo } from "../contracts/activity-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { QcStatus, Role } from "../../generated/prisma/client.js";
import {
  canPerform,
  nextStatusOf,
  resolveWorkerUpdateStatus,
} from "../domain/module-card-status.js";

export const createModuleCardService = (
  findAllForRole: IModuleCardRepo["findAllForRole"],
  findById: IModuleCardRepo["findById"],
  createCard: IModuleCardRepo["create"],
  updateCard: IModuleCardRepo["update"],
  createActivity: IActivityRepo["create"],
) => {
  // 역할에 맞는 카드 목록
  const getCards = (params: { userId: number; role: Role }) =>
    findAllForRole(params);

  // 카드 상세 (존재 확인)
  const getCard = async (id: number) => {
    const card = await findById(id);
    if (!card) throw new BusinessException("존재하지 않는 카드입니다");
    return card;
  };

  // ADMIN: 생성·배정
  const assign = async (params: {
    actorId: number;
    actorRole: Role;
    projectId: number;
    module: string;
    title: string;
    description: string;
    assignedToId: number;
    dueDate?: Date;
  }) => {
    if (!canPerform("assign", params.actorRole, "PENDING")) {
      throw new BusinessException("이 작업을 수행할 권한이 없습니다");
    }
    const card = await createCard({
      projectId: params.projectId,
      module: params.module,
      title: params.title,
      description: params.description,
      status: "PENDING",
      assignedToId: params.assignedToId,
      dueDate: params.dueDate ?? null,
    });
    await createActivity({
      cardId: card.id,
      actorId: params.actorId,
      type: "assigned",
      toStatus: "PENDING",
    });
    return card;
  };

  // WORKER(담당자): 진행 업데이트
  const update = async (params: {
    cardId: number;
    actorId: number;
    actorRole: Role;
    progress: number;
    qcStatus: QcStatus;
    note?: string;
  }) => {
    const card = await getCard(params.cardId);
    if (!canPerform("update", params.actorRole, card.status)) {
      throw new BusinessException("지금 상태에서는 업데이트할 수 없습니다");
    }
    if (card.assignedToId !== params.actorId) {
      throw new BusinessException("담당자만 업데이트할 수 있습니다");
    }
    const toStatus = resolveWorkerUpdateStatus(params.progress, params.qcStatus);
    const updated = await updateCard(params.cardId, {
      status: toStatus,
      progress: params.progress,
      qcStatus: params.qcStatus,
    });
    await createActivity({
      cardId: params.cardId,
      actorId: params.actorId,
      type: "updated",
      fromStatus: card.status,
      toStatus,
      note: params.note,
    });
    return updated;
  };

  // WORKER(담당자): admin 리뷰 요청
  const submit = async (params: {
    cardId: number;
    actorId: number;
    actorRole: Role;
  }) => {
    const card = await getCard(params.cardId);
    if (!canPerform("submit", params.actorRole, card.status)) {
      throw new BusinessException("제출할 수 없는 상태입니다");
    }
    if (card.assignedToId !== params.actorId) {
      throw new BusinessException("담당자만 제출할 수 있습니다");
    }
    const toStatus = nextStatusOf("submit");
    const updated = await updateCard(params.cardId, { status: toStatus });
    await createActivity({
      cardId: params.cardId,
      actorId: params.actorId,
      type: "submitted",
      fromStatus: card.status,
      toStatus,
    });
    return updated;
  };

  // ADMIN: client에게 전달
  const sendToClient = async (params: {
    cardId: number;
    actorId: number;
    actorRole: Role;
    note?: string;
  }) => {
    const card = await getCard(params.cardId);
    if (!canPerform("sendToClient", params.actorRole, card.status)) {
      throw new BusinessException("전달할 수 없는 상태입니다");
    }
    const toStatus = nextStatusOf("sendToClient");
    const updated = await updateCard(params.cardId, { status: toStatus });
    await createActivity({
      cardId: params.cardId,
      actorId: params.actorId,
      type: "sent_to_client",
      fromStatus: card.status,
      toStatus,
      note: params.note,
    });
    return updated;
  };

  // CLIENT(프로젝트 소유): 승인
  const approve = async (params: {
    cardId: number;
    actorId: number;
    actorRole: Role;
  }) => {
    const card = await getCard(params.cardId);
    if (!canPerform("approve", params.actorRole, card.status)) {
      throw new BusinessException("승인할 수 없는 상태입니다");
    }
    if (card.project.clientId !== params.actorId) {
      throw new BusinessException("이 프로젝트의 클라이언트만 승인할 수 있습니다");
    }
    const toStatus = nextStatusOf("approve");
    const updated = await updateCard(params.cardId, {
      status: toStatus,
      progress: 100,
    });
    await createActivity({
      cardId: params.cardId,
      actorId: params.actorId,
      type: "approved",
      fromStatus: card.status,
      toStatus,
    });
    return updated;
  };

  // CLIENT(프로젝트 소유): 수정 요청 (사유 필수)
  const requestRevision = async (params: {
    cardId: number;
    actorId: number;
    actorRole: Role;
    note: string;
  }) => {
    const card = await getCard(params.cardId);
    if (!canPerform("requestRevision", params.actorRole, card.status)) {
      throw new BusinessException("수정 요청할 수 없는 상태입니다");
    }
    if (card.project.clientId !== params.actorId) {
      throw new BusinessException(
        "이 프로젝트의 클라이언트만 수정 요청할 수 있습니다",
      );
    }
    if (!params.note || params.note.trim() === "") {
      throw new BusinessException("수정 요청 사유를 입력해주세요");
    }
    const toStatus = nextStatusOf("requestRevision");
    const updated = await updateCard(params.cardId, {
      status: toStatus,
      qcStatus: "BLOCKED",
      revisionCount: card.revisionCount + 1,
    });
    await createActivity({
      cardId: params.cardId,
      actorId: params.actorId,
      type: "revision_requested",
      fromStatus: card.status,
      toStatus,
      note: params.note,
    });
    return updated;
  };

  return {
    getCards,
    getCard,
    assign,
    update,
    submit,
    sendToClient,
    approve,
    requestRevision,
  };
};

export type ModuleCardServiceType = ReturnType<typeof createModuleCardService>;
