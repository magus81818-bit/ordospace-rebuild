import { IUserRepo } from "../../application/contracts/user-repo.contract.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import {
  TechnicalException,
  TechnicalExceptionCode,
} from "../../shared/exceptions/technical.exception.js";
import { prismaClient } from "./prismaClient.js";

export const createUserRepo = (): IUserRepo => {
  // 이메일로 사용자 조회
  const findUserByEmail: IUserRepo["findUserByEmail"] = async (email) => {
    return prismaClient.user.findUnique({ where: { email } });
  };

  // ID로 사용자 조회
  const findUserById: IUserRepo["findUserById"] = async (id) => {
    return prismaClient.user.findUnique({ where: { id } });
  };

  // 사용자 생성
  const createUser: IUserRepo["createUser"] = async (params) => {
    try {
      return await prismaClient.user.create({ data: params });
    } catch (err) {
      // DB unique 제약 위반(P2002)을 시스템 예외로 번역
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new TechnicalException(
          err.message,
          TechnicalExceptionCode.EMAIL_DUPLICATED,
        );
      }
      throw err;
    }
  };

  return { findUserByEmail, findUserById, createUser };
};
