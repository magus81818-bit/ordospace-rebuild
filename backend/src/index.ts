import "dotenv/config";

// 프로세스 안전망: 비동기 에러 하나로 서버 전체가 죽는 것을 막고, 원인을 로그에 남긴다
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./inbound/middlewares/error.middleware.js";
import { bootstrap } from "./bootstrap.js";

const { authRouter, userRouter, moduleCardRouter } = bootstrap();

const app = express();

// Render 등 프록시 뒤에서는 첫 홉을 신뢰해야 실제 클라이언트 IP로 rate-limit 된다
// (없으면 모든 요청이 프록시 IP 하나로 뭉쳐 한 바구니를 공유 → 헬스체크까지 429).
app.set("trust proxy", 1);

// 공통 미들웨어: CORS 허용, JSON 파싱, 로깅, 보안 헤더, 요청 횟수 제한
// CORS_ORIGIN이 있으면 그 오리진만 허용(쉼표로 여러 개), 없으면 개발용 전체 허용
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// 헬스체크는 rate-limit '앞'에 등록 — Render 헬스체크가 429로 막히지 않게 항상 통과.
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: "너무 많은 요청이 발생했습니다. 잠시 뒤에 다시 시도해주세요.",
  }),
);

// 기능 라우터 장착
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/module-cards", moduleCardRouter);

// 못 찾은 요청과 에러는 마지막에 처리
app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`서버 포트: ${process.env.PORT}`);
});
