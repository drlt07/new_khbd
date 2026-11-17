"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FormField } from "./form-field";
import { useApiForm } from "./use-api-form";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { submit, pending, error, fieldError } = useApiForm("/api/auth/login");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await submit({ email: fd.get("email"), password: fd.get("password") });
    if (res) {
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <FormField id="email" label="Email" type="email" autoComplete="email" required error={fieldError("email")} />
      <FormField id="password" label="Mật khẩu" type="password" autoComplete="current-password" required error={fieldError("password")} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Đăng nhập
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản? <Link href="/register" className="font-medium text-primary hover:underline">Đăng ký giáo viên</Link>
      </p>
    </form>
  );
}
