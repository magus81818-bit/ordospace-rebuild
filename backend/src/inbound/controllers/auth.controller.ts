import { Router, Request, Response, NextFunction } from "express";
import { AuthServiceType } from "../../application/services/auth.service.js";
import { signUpDataSchema, signInDataSchema } from "../schemas/auth.schemas.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import z from "zod";

export const createAuthController = (
  signIn: AuthServiceType["signIn"],
  signUp: AuthServiceType["signUp"],
) => {
  const router = Router();

  router.post(
    "/signup",
    async (req: Request, res: Response, next: NextFunction) => {
      // 입구에서 형식 검증 (role 포함)
      const result = signUpDataSchema.safeParse(req.body);
      if (!result.success) {
        throw new BusinessException(z.prettifyError(result.error));
      }

      // 비밀번호를 응답에서 제외
      const { password, ...newUser } = await signUp(result.data);
      res.json({ user: newUser });
    },
  );

  router.post(
    "/signin",
    async (req: Request, res: Response, next: NextFunction) => {
      const result = signInDataSchema.safeParse(req.body);
      if (!result.success) {
        throw new BusinessException(z.prettifyError(result.error));
      }

      const token = await signIn(result.data);
      res.json({ token });
    },
  );

  router.post("/signout", (req: Request, res: Response) => {
    // JWT는 서버가 상태를 안 가지므로 클라이언트가 토큰을 버리면 로그아웃
    res.json({ message: "로그아웃 되었습니다." });
  });

  return { router };
};
