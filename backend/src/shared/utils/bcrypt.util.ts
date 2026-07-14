import bcrypt from "bcrypt";
import { IHashUtil } from "../contracts/hash-util.contract.js";

export const createBcryptUtil = (): IHashUtil => {
  // 비밀번호를 복원 불가능한 해시로 변환
  const hash: IHashUtil["hash"] = async (params) => {
    return bcrypt.hash(params.password, params.saltRounds);
  };

  // 입력한 비밀번호와 저장된 해시 비교
  const compare: IHashUtil["compare"] = async (params) => {
    return bcrypt.compare(params.password, params.hashedPassword);
  };

  return { hash, compare };
};

export const bcryptUtil = createBcryptUtil();
