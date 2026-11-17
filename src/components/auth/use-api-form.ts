"use client";
import { useState } from "react";

type FieldErrors = Record<string, string[] | undefined>;

/** Gửi form tới REST API, gom lỗi validation theo field và lỗi chung. */
export function useApiForm<TResponse = unknown>(url: string, method: "POST" | "PUT" | "PATCH" = "POST") {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function submit(body: unknown): Promise<TResponse | null> {
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Đã xảy ra lỗi, vui lòng thử lại");
        if (json.details && typeof json.details === "object") setFieldErrors(json.details);
        return null;
      }
      return json.data as TResponse;
    } catch {
      setError("Không thể kết nối tới máy chủ");
      return null;
    } finally {
      setPending(false);
    }
  }

  const fieldError = (name: string) => fieldErrors[name]?.[0];
  return { submit, pending, error, fieldError };
}
