import {
  ModuleCard,
  CardStatus,
  QcStatus,
  Role,
} from "../../generated/prisma/client.js";

// 소유권 판정을 위해 프로젝트의 clientId를 함께 싣는다
export type ModuleCardWithProject = ModuleCard & {
  project: { clientId: number };
};

export interface IModuleCardRepo {
  findAllForRole: (params: {
    userId: number;
    role: Role;
  }) => Promise<ModuleCard[]>;
  findById: (id: number) => Promise<ModuleCardWithProject | null>;
  create: (data: {
    projectId: number;
    module: string;
    title: string;
    description: string;
    status: CardStatus;
    assignedToId: number | null;
    dueDate: Date | null;
  }) => Promise<ModuleCard>;
  update: (
    id: number,
    data: {
      status?: CardStatus;
      progress?: number;
      qcStatus?: QcStatus;
      revisionCount?: number;
    },
  ) => Promise<ModuleCard>;
}
