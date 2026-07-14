import { z } from "zod";

export const createCardSchema = z.object({
  projectId: z.number().int().positive(),
  module: z.string().min(1, "모듈명을 입력해주세요.").max(50),
  title: z.string().min(1, "제목을 입력해주세요.").max(100),
  description: z.string().min(1, "설명을 입력해주세요.").max(2000),
  assignedToId: z.number().int().positive(),
  dueDate: z.coerce.date().optional(),
});

export const updateCardSchema = z.object({
  progress: z.number().int().min(0).max(100),
  qcStatus: z.enum(["PENDING", "BLOCKED", "PASSED"]),
  note: z.string().max(500).optional(),
});

export const sendToClientSchema = z.object({
  note: z.string().max(500).optional(),
});

export const requestRevisionSchema = z.object({
  note: z.string().min(1, "수정 요청 사유를 입력해주세요."),
});
