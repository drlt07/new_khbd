# Chia nhóm học sinh

Ứng dụng giúp giáo viên chia học sinh thành các nhóm hoạt động cho từng bài học, dựa trên **sở thích, thế mạnh và nhu cầu hỗ trợ** — không dựa trên điểm số / học lực.

## Chức năng
- **Lớp học** – tạo, sửa, xóa lớp.
- **Học sinh** – thêm tay hoặc nhập Excel (có tệp mẫu, xem trước lỗi từng dòng); mỗi học sinh có sở thích, thế mạnh, cần hỗ trợ.
- **Chia nhóm** – chọn lớp, bài học, cách chia, số nhóm, học sinh vắng → hệ thống gợi ý kèm lý do → giáo viên kéo thả chỉnh sửa, đặt tên & nhiệm vụ nhóm → lưu, xuất Excel, in.

### Ba cách chia (`src/lib/grouping/algorithm.ts`)
| Cách | Nguyên tắc |
|---|---|
| Đa dạng thế mạnh | Mỗi nhóm nhiều thế mạnh khác nhau; HS cần hỗ trợ rải đều và xếp cùng bạn có thế mạnh |
| Theo sở thích | Mỗi nhóm một chủ đề sở thích; HS không trùng chủ đề được ghi là “cơ hội thử sức lĩnh vực mới” |
| Ngẫu nhiên | Sĩ số cân bằng |

Sĩ số các nhóm luôn chênh nhau tối đa 1. Thiếu dữ liệu thì ghi rõ “Chưa có dữ liệu”, không suy đoán.

## Công nghệ
Next.js 15 · TypeScript · Tailwind CSS · PostgreSQL · Prisma.

## Chạy local
```bash
cp .env.example .env      # điền DATABASE_URL, AUTH_SECRET
npm install
npx prisma migrate dev    # tạo bảng
npm run db:seed           # dữ liệu mẫu (tên hư cấu, có gắn nhãn)
npm run dev               # http://localhost:3000
```
Tài khoản mẫu: `giaovien@demo.vn` / `Demo@1234`.
