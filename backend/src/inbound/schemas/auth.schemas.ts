import { z } from "zod";

export const signUpDataSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 최소 8자 이상입니다."),
  username: z
    .string()
    .min(1, "이름은 최소 1글자 이상입니다.")
    .max(20, "이름은 최대 20글자입니다."),
  role: z.enum(["ADMIN", "WORKER", "CLIENT"], {
    message: "역할은 ADMIN, WORKER, CLIENT 중 하나여야 합니다.",
  }),
});

export const signInDataSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});
