import { IUserRepo } from "../contracts/user-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

export const createUserService = (findUserById: IUserRepo["findUserById"]) => {
  // 내 정보 조회
  const getMe = async (userId: number) => {
    // 유저 존재 확인
    const foundUser = await findUserById(userId);
    if (!foundUser) {
      throw new BusinessException("존재하지 않는 유저입니다");
    }

    // 비밀번호는 응답에서 제외
    const { password, ...me } = foundUser;
    return me;
  };

  return { getMe };
};

export type UserServiceType = ReturnType<typeof createUserService>;
