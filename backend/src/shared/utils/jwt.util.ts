import jwt from "jsonwebtoken";
import { IJwtUtil } from "../contracts/jwt-util.contract.js";
import {
  TechnicalException,
  TechnicalExceptionCode,
} from "../exceptions/technical.exception.js";

export const jwtUtil: IJwtUtil = {
  signJwt: (params) => {
    // 비밀키로 서명된 토큰 발급
    return jwt.sign(params.data, process.env.JWT_SECRET as string, {
      expiresIn: params.expiresIn,
    });
  },
  verifyJwt: (token) => {
    try {
      // 토큰 위변조·만료 검증
      return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      // jwt 라이브러리의 에러를 우리 시스템의 예외로 번역
      if (err instanceof Error && err.name === "JsonWebTokenError") {
        throw new TechnicalException(
          err.message,
          TechnicalExceptionCode.JWT_VERIFY_FAILED,
        );
      }
      if (err instanceof Error && err.name === "TokenExpiredError") {
        throw new TechnicalException(
          err.message,
          TechnicalExceptionCode.TOKEN_EXPIRED,
        );
      }
      throw err;
    }
  },
};

export const signJwt: IJwtUtil["signJwt"] = jwtUtil.signJwt;
