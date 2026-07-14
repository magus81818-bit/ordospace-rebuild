import {
  IModuleCardRepo,
  ModuleCardWithProject,
} from "../../application/contracts/module-card-repo.contract.js";
import { prismaClient } from "./prismaClient.js";

export const createModuleCardRepo = (): IModuleCardRepo => {
  // 역할별 가시성: ADMIN 전체 / WORKER 담당 카드 / CLIENT 소유 프로젝트 카드
  const findAllForRole: IModuleCardRepo["findAllForRole"] = async ({
    userId,
    role,
  }) => {
    const where =
      role === "ADMIN"
        ? {}
        : role === "WORKER"
          ? { assignedToId: userId }
          : { project: { clientId: userId } };
    return prismaClient.moduleCard.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        assignedTo: { select: { id: true, username: true } },
        project: { select: { id: true, name: true, clientId: true } },
        _count: { select: { comments: true, activities: true } },
      },
    });
  };

  const findById: IModuleCardRepo["findById"] = async (id) => {
    return prismaClient.moduleCard.findUnique({
      where: { id },
      include: { project: { select: { clientId: true } } },
    }) as Promise<ModuleCardWithProject | null>;
  };

  const create: IModuleCardRepo["create"] = async (data) => {
    return prismaClient.moduleCard.create({ data });
  };

  const update: IModuleCardRepo["update"] = async (id, data) => {
    return prismaClient.moduleCard.update({ where: { id }, data });
  };

  return { findAllForRole, findById, create, update };
};
