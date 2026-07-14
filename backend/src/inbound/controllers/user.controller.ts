import { Router, Request, Response, NextFunction } from "express";
import { UserServiceType } from "../../application/services/user.service.js";
import { AuthMiddlewareType } from "../middlewares/auth.middleware.js";

export const createUserController = (
  getMe: UserServiceType["getMe"],
  authMiddleware: AuthMiddlewareType,
) => {
  const router = Router();

  router.get(
    "/me",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      // 미들웨어가 심어준 userId로 내 정보 조회
      const me = await getMe(req.userId!);
      res.json({ me });
    },
  );

  return { router };
};
