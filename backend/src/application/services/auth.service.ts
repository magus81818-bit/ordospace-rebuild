import { IUserRepo } from "../contracts/user-repo.contract.js";
import { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";
import { IHashUtil } from "../../shared/contracts/hash-util.contract.js";
import { Role } from "../../generated/prisma/client.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import {
  TechnicalException,
  TechnicalExceptionCode,
} from "../../shared/exceptions/technical.exception.js";

export const createAuthService = (
  findUserByEmail: IUserRepo["findUserByEmail"],
  createUser: IUserRepo["createUser"],
  signJwt: IJwtUtil["signJwt"],
  hashUtil: IHashUtil,
) => {
  const signIn = async (params: { email: string; password: string }) => {
    const { email, password } = params;

    // 이메일로 유저 조회 (어느 쪽이 틀렸는지 노출하지 않는 동일한 메시지)
    const foundUser = await findUserByEmail(email);
    if (foundUser == null) {
      throw new BusinessException("이메일 또는 비밀번호가 일치하지 않습니다");
    }

    // 비밀번호 해시 비교
    const isPasswordValid = await hashUtil.compare({
      password,
      hashedPassword: foundUser.password,
    });
    if (!isPasswordValid) {
      throw new BusinessException("이메일 또는 비밀번호가 일치하지 않습니다");
    }

    // userId와 role을 담은 토큰 발급 (1시간). role은 역할 가드가 DB 조회 없이 쓰기 위함
    const token = signJwt({
      data: { userId: foundUser.id, role: foundUser.role },
      expiresIn: 3600,
    });
    return token;
  };

  const signUp = async (params: {
    email: string;
    password: string;
    username: string;
    role: Role;
  }) => {
    const { email, password, username, role } = params;

    // 이메일 중복 1차 방어 (동시 요청은 DB unique 제약이 최종 방어)
    const foundUser = await findUserByEmail(email);
    if (foundUser !== null) {
      throw new BusinessException("계정이 이미 존재합니다");
    }

    // 비밀번호는 반드시 해싱 후 저장
    const hashedPassword = await hashUtil.hash({ password, saltRounds: 10 });

    try {
      const newUser = await createUser({
        email,
        password: hashedPassword,
        username,
        role,
      });
      return newUser;
    } catch (err) {
      // DB unique 제약 위반(동시 가입)을 사용자 에러로 번역
      if (
        err instanceof TechnicalException &&
        err.code === TechnicalExceptionCode.EMAIL_DUPLICATED
      ) {
        throw new BusinessException("계정이 이미 존재합니다");
      }
      throw err;
    }
  };

  return { signIn, signUp };
};

export type AuthServiceType = ReturnType<typeof createAuthService>;
