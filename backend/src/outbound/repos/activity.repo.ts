import { IActivityRepo } from "../../application/contracts/activity-repo.contract.js";
import { prismaClient } from "./prismaClient.js";

export const createActivityRepo = (): IActivityRepo => {
  const create: IActivityRepo["create"] = async (data) => {
    return prismaClient.activity.create({ data });
  };

  return { create };
};
