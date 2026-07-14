import { describe, it, expect, jest } from "@jest/globals";
import { createAuthService } from "./auth.service.js";
import { IUserRepo } from "../contracts/user-repo.contract.js";
import { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";
import { IHashUtil } from "../../shared/contracts/hash-util.contract.js";

describe("AuthService", () => {
  describe("signUp (해피패스)", () => {
    it("새 이메일로 가입하면 해싱된 비밀번호와 role로 유저가 생성된다", async () => {
      const mockFindUserByEmail = jest
        .fn<IUserRepo["findUserByEmail"]>()
        .mockResolvedValue(null);

      const mockCreateUser = jest
        .fn<IUserRepo["createUser"]>()
        .mockResolvedValue({
          id: 1,
          email: "aki@test.com",
          password: "hashed_pw",
          username: "aki",
          role: "WORKER",
        });

      const mockHashUtil: IHashUtil = {
        hash: jest.fn<IHashUtil["hash"]>().mockResolvedValue("hashed_pw"),
        compare: jest.fn<IHashUtil["compare"]>(),
      };
      const mockSignJwt = jest.fn<IJwtUtil["signJwt"]>();

      const { signUp } = createAuthService(
        mockFindUserByEmail,
        mockCreateUser,
        mockSignJwt,
        mockHashUtil,
      );

      const newUser = await signUp({
        email: "aki@test.com",
        password: "plain_pw",
        username: "aki",
        role: "WORKER",
      });

      // 비밀번호는 반드시 해싱된 값으로, role과 함께 저장되어야 한다
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "aki@test.com",
        password: "hashed_pw",
        username: "aki",
        role: "WORKER",
      });
      expect(newUser.email).toBe("aki@test.com");
    });
  });

  describe("signIn (해피패스)", () => {
    it("올바른 이메일과 비밀번호면 userId와 role을 담은 토큰을 반환한다", async () => {
      const mockFindUserByEmail = jest
        .fn<IUserRepo["findUserByEmail"]>()
        .mockResolvedValue({
          id: 1,
          email: "aki@test.com",
          password: "hashed_pw",
          username: "aki",
          role: "ADMIN",
        });

      const mockHashUtil: IHashUtil = {
        hash: jest.fn<IHashUtil["hash"]>(),
        compare: jest.fn<IHashUtil["compare"]>().mockResolvedValue(true),
      };
      const mockSignJwt = jest
        .fn<IJwtUtil["signJwt"]>()
        .mockReturnValue("fake.jwt.token");
      const mockCreateUser = jest.fn<IUserRepo["createUser"]>();

      const { signIn } = createAuthService(
        mockFindUserByEmail,
        mockCreateUser,
        mockSignJwt,
        mockHashUtil,
      );

      const token = await signIn({
        email: "aki@test.com",
        password: "plain_pw",
      });

      // 토큰에는 userId와 role이 담겨야 한다 (역할 가드용)
      expect(mockSignJwt).toHaveBeenCalledWith({
        data: { userId: 1, role: "ADMIN" },
        expiresIn: 3600,
      });
      expect(token).toBe("fake.jwt.token");
    });
  });
});

describe("AuthService (크리티컬 케이스)", () => {
  it("비밀번호가 틀리면 이메일 오류와 동일한 메시지로 BusinessException을 던진다", async () => {
    const mockFindUserByEmail = jest
      .fn<IUserRepo["findUserByEmail"]>()
      .mockResolvedValue({
        id: 1,
        email: "aki@test.com",
        password: "hashed_pw",
        username: "aki",
        role: "CLIENT",
      });
    const mockHashUtil: IHashUtil = {
      hash: jest.fn<IHashUtil["hash"]>(),
      compare: jest.fn<IHashUtil["compare"]>().mockResolvedValue(false),
    };
    const { signIn } = createAuthService(
      mockFindUserByEmail,
      jest.fn<IUserRepo["createUser"]>(),
      jest.fn<IJwtUtil["signJwt"]>(),
      mockHashUtil,
    );

    await expect(
      signIn({ email: "aki@test.com", password: "wrong_pw" }),
    ).rejects.toThrow("이메일 또는 비밀번호가 일치하지 않습니다");
  });

  it("이미 존재하는 이메일로 가입하면 BusinessException을 던진다", async () => {
    const mockFindUserByEmail = jest
      .fn<IUserRepo["findUserByEmail"]>()
      .mockResolvedValue({
        id: 1,
        email: "aki@test.com",
        password: "hashed_pw",
        username: "aki",
        role: "WORKER",
      });
    const mockHashUtil: IHashUtil = {
      hash: jest.fn<IHashUtil["hash"]>(),
      compare: jest.fn<IHashUtil["compare"]>(),
    };
    const { signUp } = createAuthService(
      mockFindUserByEmail,
      jest.fn<IUserRepo["createUser"]>(),
      jest.fn<IJwtUtil["signJwt"]>(),
      mockHashUtil,
    );

    await expect(
      signUp({
        email: "aki@test.com",
        password: "pw123456",
        username: "aki",
        role: "WORKER",
      }),
    ).rejects.toThrow("계정이 이미 존재합니다");
  });
});
