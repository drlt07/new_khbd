"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FormField } from "./form-field";
import { useApiForm } from "@/hooks/use-api-form";

export function RegisterForm() {
  const router = useRouter();
  const { submit, pending, error, fieldError } = useApiForm("/api/auth/register");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    if (await submit(body)) {
      router.replace("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <FormField id="fullName" label="Họ và tên" autoComplete="name" required error={fieldError("fullName")} />
      <FormField id="email" label="Email" type="email" autoComplete="email" required error={fieldError("email")} />
      <FormField id="schoolName" label="Trường (không bắt buộc)" error={fieldError("schoolName")} />
      <FormField id="password" label="Mật khẩu" type="password" autoComplete="new-password" required error={fieldError("password")} />
      <FormField id="confirmPassword" label="Nhập lại mật khẩu" type="password" autoComplete="new-password" required error={fieldError("confirmPassword")} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Tạo tài khoản
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản? <Link href="/login" className="font-medium text-primary hover:underline">Đăng nhập</Link>
      </p>
    </form>
  );
}
