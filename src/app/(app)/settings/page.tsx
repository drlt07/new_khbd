import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAIConfig } from "@/server/ai/config";
import { AI_TASK_CATALOG } from "@/server/ai/prompts/registry";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const session = await requireSession();
  const ai = getAIConfig();
  return (
    <>
      <PageHeader title="Cài đặt" description="Thông tin tài khoản và cấu hình dịch vụ AI." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tài khoản</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Họ tên</dt><dd>{session.name}</dd>
              <dt className="text-muted-foreground">Email</dt><dd className="break-all">{session.email}</dd>
              <dt className="text-muted-foreground">Vai trò</dt><dd>{session.role}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dịch vụ AI</CardTitle>
            <CardDescription>Cấu hình qua biến môi trường ở máy chủ. API key không bao giờ gửi xuống trình duyệt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              Trạng thái: <Badge tone={ai.isMock ? "warning" : "success"}>{ai.isMock ? "Mô phỏng (mock)" : `Đang dùng ${ai.provider}`}</Badge>
            </div>
            {ai.isMock && (
              <Alert tone="warning">
                Chưa có API key. Mọi kết quả AI sẽ là kết quả mô phỏng, được đánh dấu rõ trên giao diện và trong cơ sở dữ liệu (isMock = true).
              </Alert>
            )}
            {ai.misconfigured && <Alert tone="danger">AI_PROVIDER=openai nhưng thiếu OPENAI_API_KEY — đã chuyển về chế độ mô phỏng.</Alert>}
            <div>
              <p className="mb-1.5 font-medium">Các tác vụ AI độc lập</p>
              <ul className="divide-y rounded-lg border">
                {Object.entries(AI_TASK_CATALOG).map(([key, t]) => (
                  <li key={key} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>{t.label}</span>
                    <Badge>Sprint {t.sprint}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
