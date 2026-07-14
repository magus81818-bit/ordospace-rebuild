export enum TechnicalExceptionCode {
  JWT_VERIFY_FAILED = "JWT_VERIFY_FAILED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",
  EMAIL_DUPLICATED = "EMAIL_DUPLICATED",
}

// 시스템 문제로 발생하는 예외 (JWT 검증 실패, DB 제약 위반 등)
export class TechnicalException extends Error {
  code: TechnicalExceptionCode;
  originalErr: unknown;

  constructor(
    message: string,
    code: TechnicalExceptionCode,
    originalErr?: unknown,
  ) {
    super(message);
    this.code = code;
    this.originalErr = originalErr;
  }
}
