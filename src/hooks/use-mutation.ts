"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type FieldErrors = Record<string, string[] | undefined>;
type Method = "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Gọi REST API cho các thao tác ghi. Tự refresh Server Components khi thành công
 * để danh sách/thống kê luôn phản ánh dữ liệu thật trong DB.
 */
export function useMutation() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const reset = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const mutate = useCallback(
    async <T = unknown>(
      url: string,
      method: Method,
      body?: unknown,
      opts: { refresh?: boolean } = { refresh: true },
    ): Promise<{ ok: true; data: T } | { ok: false; error: string }> => {
      setPending(true);
      reset();
      try {
        const isForm = body instanceof FormData;
        const res = await fetch(url, {
          method,
          headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
          body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = json.error ?? "Đã xảy ra lỗi, vui lòng thử lại";
          setError(msg);
          if (json.details && typeof json.details === "object") setFieldErrors(json.details);
          return { ok: false, error: msg };
        }
        if (opts.refresh !== false) router.refresh();
        return { ok: true, data: json.data as T };
      } catch {
        const msg = "Không thể kết nối tới máy chủ";
        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setPending(false);
      }
    },
    [router, reset],
  );

  return { mutate, pending, error, fieldError: (name: string) => fieldErrors[name]?.[0], reset };
}
