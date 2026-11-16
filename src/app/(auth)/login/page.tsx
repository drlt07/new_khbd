import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground">Chào mừng thầy cô quay lại.</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      {process.env.NODE_ENV !== "production" && (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Môi trường phát triển — tài khoản mẫu: <b>giaovien@demo.vn</b> / <b>Demo@1234</b>
        </p>
      )}
    </div>
  );
}
