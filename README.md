# AI Personalized Lesson Planner

Nền tảng hỗ trợ giáo viên xây dựng **kế hoạch bài dạy (KHBD) có cá thể hóa** dựa trên hồ sơ đặc điểm, sở thích, thế mạnh và nhu cầu hỗ trợ của học sinh. Hệ thống **không** dùng AI để xếp loại học sinh; giáo viên luôn là người quyết định cuối cùng.

- Kiến trúc: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Kế hoạch sprint & tiến độ: [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md)

## Công nghệ
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · UI theo quy ước shadcn/ui (Radix) · PostgreSQL · Prisma 6 · Zod · JWT (jose) · AI service độc lập (mock / OpenAI).

## Chạy local

Yêu cầu: Node.js ≥ 20, PostgreSQL ≥ 14.

```bash
cp .env.example .env        # điền DATABASE_URL, AUTH_SECRET (>= 32 ký tự)
npm install
npm run db:migrate          # tạo bảng
npm run db:seed             # dữ liệu mẫu (được gắn nhãn)
npm run dev                 # http://localhost:3000
```

Tài khoản mẫu: `giaovien@demo.vn` / `Demo@1234` (giáo viên), `admin@demo.vn` / `Demo@1234` (quản trị).

## AI
Mặc định `AI_PROVIDER=mock`: mọi kết quả AI là **mô phỏng**, được gắn nhãn trên giao diện và lưu `isMock=true`. Để dùng AI thật, đặt `AI_PROVIDER=openai` và `OPENAI_API_KEY` (chỉ ở server).

## Scripts
`dev`, `build`, `start`, `lint`, `typecheck`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio`.
