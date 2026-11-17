# Trợ lý dạy học cá thể hóa (EDU AI Workspace)

Quản lý lớp học · Phân nhóm · Thiết kế KHBD · Theo dõi tiến trình.

- **Pha 1 — Phân tích & phân nhóm:** dữ liệu (điểm, đặc trưng) → GV đặt số nhóm cố định và mô tả từng nhóm → AI phân bổ, giải thích, kiểm tra → GV duyệt → **Hồ sơ nhóm** (có phiên bản).
- **Pha 2 — Thiết kế KHBD phân hóa:** chọn hồ sơ nhóm đã duyệt → bài học → tiến trình chung → nhiệm vụ riêng cho từng nhóm → chỉnh sửa trong trình soạn 3 vùng → xuất Word/PDF.

Chi tiết kiến trúc, 4 thực thể dữ liệu và quy tắc phiên bản: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## AI
Đặt `ANTHROPIC_API_KEY` trong `.env` để dùng Claude (`claude-opus-5-5`). Không có khóa: hệ thống dùng bộ máy quy tắc và ghi rõ trên giao diện.

## Chạy local
```bash
cp .env.example .env      # DATABASE_URL, AUTH_SECRET (>= 32 ký tự)
npm install
npx prisma migrate deploy
npm run db:seed           # dữ liệu mẫu (tên hư cấu, có nhãn "Dữ liệu mẫu")
npm run dev               # http://localhost:3000
npm test                  # kiểm thử phân nhóm, diễn giải mô tả nhóm, đọc bảng điểm, sinh KHBD
```
Tài khoản mẫu: `giaovien@demo.vn` / `Demo@1234`.

Công nghệ: Next.js 15 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Anthropic SDK · docx · exceljs.
