import { Request, Response, NextFunction } from "express";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { TechnicalException } from "../../shared/exceptions/technical.exception.js";

// 등록되지 않은 경로 처리
export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  throw new BusinessException("존재하지 않는 api 요청입니다.");
};

// 모든 에러가 마지막에 도착하는 곳: 예외 종류별로 일관된 응답으로 변환
export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof BusinessException) {
    res.status(401).json({ message: err.message });
  } else if (err instanceof TechnicalException) {
    res.status(500).json({ message: "알 수 없는 에러가 발생했어요" });
    console.error(err);
  } else {
    res.status(500).json({ message: "알 수 없는 에러가 발생했어요" });
    console.error(err);
  }
};
