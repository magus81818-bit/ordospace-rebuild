import { describe, it, expect } from "@jest/globals";
import {
  canPerform,
  nextStatusOf,
  resolveWorkerUpdateStatus,
} from "./module-card-status.js";

describe("module-card-status (순수 전이 규칙)", () => {
  it("worker는 QC_READY 카드를 제출할 수 있다", () => {
    expect(canPerform("submit", "WORKER", "QC_READY")).toBe(true);
  });

  it("worker는 IN_PROGRESS 카드를 제출할 수 없다 (불법 시작 상태)", () => {
    expect(canPerform("submit", "WORKER", "IN_PROGRESS")).toBe(false);
  });

  it("worker는 승인 행위를 할 수 없다 (역할 불일치)", () => {
    expect(canPerform("approve", "WORKER", "CLIENT_REVIEW")).toBe(false);
  });

  it("client는 CLIENT_REVIEW 카드를 승인할 수 있다", () => {
    expect(canPerform("approve", "CLIENT", "CLIENT_REVIEW")).toBe(true);
  });

  it("업데이트 목표 상태: 100%+PASSED면 QC_READY, 아니면 IN_PROGRESS", () => {
    expect(resolveWorkerUpdateStatus(100, "PASSED")).toBe("QC_READY");
    expect(resolveWorkerUpdateStatus(50, "PASSED")).toBe("IN_PROGRESS");
    expect(resolveWorkerUpdateStatus(100, "BLOCKED")).toBe("IN_PROGRESS");
  });

  it("행위별 목표 상태 매핑", () => {
    expect(nextStatusOf("submit")).toBe("ADMIN_REVIEW");
    expect(nextStatusOf("sendToClient")).toBe("CLIENT_REVIEW");
    expect(nextStatusOf("approve")).toBe("APPROVED");
    expect(nextStatusOf("requestRevision")).toBe("REVISION_REQUESTED");
  });
});
