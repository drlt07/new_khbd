# KHBD cá thể hóa — Chia nhóm → Soạn bài

Ứng dụng hỗ trợ giáo viên soạn **kế hoạch bài dạy (KHBD) cá thể hóa theo nhóm**, gồm 2 pha:

| Pha | Giáo viên làm | Hệ thống làm |
|---|---|---|
| **Pha 1 — Dữ liệu → Chia nhóm** | Nhập danh sách học sinh kèm đặc trưng (sở thích, thế mạnh, cần hỗ trợ), tải bảng điểm, **đặt số nhóm cố định và đặc trưng từng nhóm** | Nhận diện bảng điểm (vnEdu/SMAS/tự lập), xếp mỗi học sinh vào nhóm phù hợp nhất kèm lý do; giáo viên kéo thả chỉnh lại |
| **Pha 2 — Soạn KHBD** | Chọn bộ nhóm, nhập bài học, yêu cầu cần đạt; chỉnh nội dung | Dựng khung KHBD 4 hoạt động (CV 5512), **gợi ý nhiệm vụ, sản phẩm, mức hỗ trợ riêng cho từng nhóm**; xuất Word |

## Cách tổ chức giao diện
Lấy cảm hứng từ Google Classroom (mọi việc nằm trong lớp) và các trang hướng dẫn thiết lập từng bước:

- **Lớp học** → chọn lớp → các tab theo đúng thứ tự công việc:
  `Tổng quan` · **Pha 1:** `Học sinh & đặc trưng` · `Bảng điểm` · `Chia nhóm` · **Pha 2:** `Soạn KHBD`
- Tab Tổng quan là danh sách bước có trạng thái ✓ và nút “bước tiếp theo”.
- Sidebar: Lớp học, Kế hoạch bài dạy (tất cả lớp), danh sách lớp của tôi.

## Đặc trưng nhóm (Pha 1)
Mỗi nhóm có: tên, mô tả đặc trưng, **thế mạnh/sở thích phù hợp** (từ khóa), **khoảng điểm** (tùy chọn), cờ **ưu tiên học sinh cần hỗ trợ**. Có 3 bộ mẫu: Thiên hướng Ngữ văn, Vai trò dự án, Theo mức đáp ứng (bảng điểm). Thuật toán: `src/lib/grouping/match.ts` (có kiểm thử).

## Nhiệm vụ theo nhóm (Pha 2)
`src/lib/lesson/template.ts` sinh nhiệm vụ theo phong cách nhóm (cảm thụ – sáng tạo, phân tích – lập luận, trình bày, thiết kế, kỹ thuật, hỗ trợ từng bước, luyện có định hướng, mở rộng). **Đây là gợi ý theo mẫu, chưa dùng AI** — giáo viên chỉnh sửa trực tiếp.

## Chạy local
```bash
cp .env.example .env      # DATABASE_URL, AUTH_SECRET (>= 32 ký tự)
npm install
npx prisma migrate deploy
npm run db:seed           # dữ liệu mẫu (tên hư cấu, có nhãn "Dữ liệu mẫu")
npm run dev               # http://localhost:3000
npm test                  # kiểm thử thuật toán xếp nhóm, đọc bảng điểm, sinh KHBD
```
Tài khoản mẫu: `giaovien@demo.vn` / `Demo@1234`.

Công nghệ: Next.js 15 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · docx · exceljs.
