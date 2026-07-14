import { Router, Request, Response, NextFunction } from "express";
import { ModuleCardServiceType } from "../../application/services/module-card.service.js";
import { AuthMiddlewareType } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  createCardSchema,
  updateCardSchema,
  sendToClientSchema,
  requestRevisionSchema,
} from "../schemas/module-card.schemas.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { Role } from "../../generated/prisma/client.js";
import z from "zod";

export const createModuleCardController = (
  svc: ModuleCardServiceType,
  authMiddleware: AuthMiddlewareType,
) => {
  const router = Router();

  // 역할 필터 목록
  router.get(
    "/",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const cards = await svc.getCards({
        userId: req.userId!,
        role: req.role as Role,
      });
      res.json({ cards });
    },
  );

  // 상세
  router.get(
    "/:id",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const card = await svc.getCard(Number(req.params.id));
      res.json({ card });
    },
  );

  // ADMIN 생성·배정
  router.post(
    "/",
    authMiddleware,
    requireRole("ADMIN"),
    async (req: Request, res: Response, next: NextFunction) => {
      const result = createCardSchema.safeParse(req.body);
      if (!result.success)
        throw new BusinessException(z.prettifyError(result.error));
      const card = await svc.assign({
        actorId: req.userId!,
        actorRole: req.role as Role,
        ...result.data,
      });
      res.json({ card });
    },
  );

  // WORKER 진행 업데이트
  router.patch(
    "/:id",
    authMiddleware,
    requireRole("WORKER"),
    async (req: Request, res: Response, next: NextFunction) => {
      const result = updateCardSchema.safeParse(req.body);
      if (!result.success)
        throw new BusinessException(z.prettifyError(result.error));
      const card = await svc.update({
        cardId: Number(req.params.id),
        actorId: req.userId!,
        actorRole: req.role as Role,
        ...result.data,
      });
      res.json({ card });
    },
  );

  // WORKER 제출
  router.post(
    "/:id/submit",
    authMiddleware,
    requireRole("WORKER"),
    async (req: Request, res: Response, next: NextFunction) => {
      const card = await svc.submit({
        cardId: Number(req.params.id),
        actorId: req.userId!,
        actorRole: req.role as Role,
      });
      res.json({ card });
    },
  );

  // ADMIN 전달
  router.post(
    "/:id/send-to-client",
    authMiddleware,
    requireRole("ADMIN"),
    async (req: Request, res: Response, next: NextFunction) => {
      const result = sendToClientSchema.safeParse(req.body ?? {});
      if (!result.success)
        throw new BusinessException(z.prettifyError(result.error));
      const card = await svc.sendToClient({
        cardId: Number(req.params.id),
        actorId: req.userId!,
        actorRole: req.role as Role,
        ...result.data,
      });
      res.json({ card });
    },
  );

  // CLIENT 승인
  router.post(
    "/:id/approve",
    authMiddleware,
    requireRole("CLIENT"),
    async (req: Request, res: Response, next: NextFunction) => {
      const card = await svc.approve({
        cardId: Number(req.params.id),
        actorId: req.userId!,
        actorRole: req.role as Role,
      });
      res.json({ card });
    },
  );

  // CLIENT 수정 요청
  router.post(
    "/:id/request-revision",
    authMiddleware,
    requireRole("CLIENT"),
    async (req: Request, res: Response, next: NextFunction) => {
      const result = requestRevisionSchema.safeParse(req.body);
      if (!result.success)
        throw new BusinessException(z.prettifyError(result.error));
      const card = await svc.requestRevision({
        cardId: Number(req.params.id),
        actorId: req.userId!,
        actorRole: req.role as Role,
        ...result.data,
      });
      res.json({ card });
    },
  );

  return { router };
};
