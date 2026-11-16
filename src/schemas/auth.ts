import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(100),
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .regex(/[A-Za-z]/, "Mật khẩu cần có chữ cái")
      .regex(/[0-9]/, "Mật khẩu cần có chữ số"),
    confirmPassword: z.string(),
    schoolName: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại không khớp",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
