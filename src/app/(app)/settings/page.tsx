import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { CLAUDE_MODEL, getEngine } from "@/server/ai/engine";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const user = await requireUser();
  const e = getEngine();
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Cài đặt" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tài khoản</CardTitle></CardHeader>
          <CardContent><dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm"><dt className="text-muted-foreground">Họ tên</dt><dd>{user.name}</dd><dt className="text-muted-foreground">Email</dt><dd className="break-all">{user.email}</dd></dl></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bộ máy AI</CardTitle><CardDescription>Cấu hình bằng biến môi trường trên máy chủ; khóa API không bao giờ gửi xuống trình duyệt.</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center gap-2">Đang dùng: <Badge tone={e.kind === "claude" ? "success" : "warning"}>{e.label}</Badge></p>
            <p className="text-muted-foreground">{e.detail}</p>
            {e.kind === "rules" && <Alert tone="info">Để bật Claude AI: đặt <code>ANTHROPIC_API_KEY</code> trong tệp <code>.env</code> của máy chủ rồi khởi động lại. Mô hình: <code>{CLAUDE_MODEL}</code>. Khi AI lỗi hoặc từ chối, hệ thống tự dùng bộ máy quy tắc và ghi rõ trên giao diện.</Alert>}
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              <li>Pha 1: AI phân bổ học sinh theo mô tả nhóm + điểm + đặc trưng; kết quả được kiểm tra (đủ học sinh, đúng sĩ số tối đa).</li>
              <li>Pha 2: AI tạo tiến trình chung và nhiệm vụ phân hóa; trợ lý gợi ý, tạo học liệu, điều chỉnh độ khó.</li>
              <li>Dữ liệu gửi AI được ẩn danh (HS01…); “Kiểm tra mục tiêu” luôn dùng quy tắc xác định.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
