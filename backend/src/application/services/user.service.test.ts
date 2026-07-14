import { describe, it, expect, jest } from "@jest/globals";
import { createUserService } from "./user.service.js";
import { IUserRepo } from "../contracts/user-repo.contract.js";

describe("UserService", () => {
  it("내 정보 조회 시 비밀번호는 제외하고 반환한다", async () => {
    const mockFindUserById = jest
      .fn<IUserRepo["findUserById"]>()
      .mockResolvedValue({
        id: 1,
        email: "aki@test.com",
        password: "hashed_pw",
        username: "aki",
        role: "ADMIN",
      });

    const { getMe } = createUserService(mockFindUserById);
    const me = await getMe(1);

    // 비밀번호(해시라도)는 절대 응답에 포함되면 안 된다. role은 유지
    expect(me).toEqual({
      id: 1,
      email: "aki@test.com",
      username: "aki",
      role: "ADMIN",
    });
  });

  it("존재하지 않는 유저면 BusinessException을 던진다", async () => {
    const mockFindUserById = jest
      .fn<IUserRepo["findUserById"]>()
      .mockResolvedValue(null);

    const { getMe } = createUserService(mockFindUserById);
    await expect(getMe(999)).rejects.toThrow("존재하지 않는 유저입니다");
  });
});
