import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Tạo tài khoản giáo viên</h1>
        <p className="text-sm text-muted-foreground">Dữ liệu học sinh chỉ hiển thị với tài khoản của thầy cô.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
