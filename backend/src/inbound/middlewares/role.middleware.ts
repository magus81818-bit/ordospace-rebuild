import { Request, Response, NextFunction } from "express";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

// 역할 가드: authMiddleware 뒤에 붙여 req.role이 허용 목록에 있는지 확인
// (실제 사용은 R2 ModuleCard 라우트에서 — 예: requireRole("ADMIN"))
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      throw new BusinessException("이 작업을 수행할 권한이 없습니다.");
    }
    next();
  };
};
