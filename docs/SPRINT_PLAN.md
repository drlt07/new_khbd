# Kế hoạch triển khai

## Sprint 1 — Khởi tạo nền tảng ✅
- [x] Khởi tạo Next.js 15 + TypeScript + Tailwind v4 + UI kit kiểu shadcn
- [x] PostgreSQL + Prisma; schema đầy đủ 28+ entity; migration `init`
- [x] Seed dữ liệu mẫu (gắn cờ `isSample`, hiển thị nhãn “Dữ liệu mẫu”)
- [x] Xác thực: đăng ký, đăng nhập, đăng xuất, middleware bảo vệ route, phân quyền theo vai trò
- [x] Audit log cho các sự kiện xác thực
- [x] Layout: sidebar, drawer mobile, header (trạng thái AI, menu người dùng)
- [x] Dashboard với số liệu thật từ DB (lọc theo giáo viên), loading/empty/error state
- [x] Khung AI service: config, provider mock/OpenAI, runner có Zod, prompt dùng chung, ẩn danh hóa
- [x] Trang giữ chỗ trung thực cho các module tương lai; trang Cài đặt
- [x] Kiểm tra: typecheck, lint, build production, smoke test API & trình duyệt (desktop + mobile)

## Sprint 2 — Lớp học & học sinh
- Service + API CRUD lớp (năm học, khối, môn học qua ClassSubject), lưu trữ/khôi phục lớp
- Trang danh sách lớp: tìm kiếm, lọc năm học/môn, trạng thái hồ sơ
- Trang chi tiết lớp: danh sách HS, thêm/sửa/xóa HS
- Import Excel/CSV: tải mẫu, xem trước, báo lỗi theo dòng, xác nhận nhập (thư viện `xlsx`/`exceljs`)
- Thiết lập khung thông tin A–F: sao chép khung mặc định, thêm/sửa/ẩn tiêu chí, gắn với môn học
- Hồ sơ học sinh: khung 9 tab, giáo viên nhập trực tiếp mục hồ sơ (origin = TEACHER)
- Audit log cho mọi thao tác ghi

## Sprint 3 — Tiếp nhận dữ liệu
- Storage adapter (local ↔ S3) + upload nhiều tệp (PDF, DOCX, XLSX, CSV, PNG, JPG), kiểm tra MIME/magic bytes, giới hạn dung lượng
- Xem trước tệp (ảnh, PDF, bảng), phân loại minh chứng, gắn HS/môn/tiêu chí, thời gian & nguồn
- Nhập nhận xét văn bản tự do, nhận xét quan sát
- Trạng thái xử lý; trích xuất văn bản không dùng AI (pdf-parse, mammoth, xlsx)

## Sprint 4 — AI phân tích hồ sơ
- Task: Document Extraction, Student Profile Analysis, Evidence Mapping, Learning Needs Analysis
- Lưu AIAnalysis/AIRecommendation; màn hình phân tích 3 cột
- Xác nhận/sửa/từ chối/phân tích lại → cập nhật mục hồ sơ và `profileStatus`
- Phát hiện thông tin thiếu/không nhất quán; lịch sử cập nhật hồ sơ

## Sprint 5 — Xây dựng KHBD (bước 1–4)
- Wizard lưu theo bước; nhập tay hoặc tải tài liệu bài học/mẫu KHBD
- Task: Lesson Analysis, Activity Recommendation, Flexible Grouping, Differentiated Task Generation
- Trang nhóm hoạt động: thêm/xóa nhóm, chuyển HS, sửa nhiệm vụ, đề xuất lại, hiện lý do & căn cứ

## Sprint 6 — Hoàn thiện KHBD (bước 5–6)
- Task: Lesson Plan Generation (cấu trúc I–V hoặc theo mẫu), Lesson Plan Revision
- Trình soạn thảo theo khối, phiên bản, xác nhận, xuất Word (docx) và PDF

## Sprint 7 — Kiểm thử & hoàn thiện
- Test nghiệp vụ (Vitest) + e2e (Playwright), kiểm thử phân quyền
- Quản lý tài khoản & phân quyền, nhật ký hoạt động, thu hồi phiên, rate limit
- Sao lưu dữ liệu, tối ưu hiệu suất, tài liệu hướng dẫn
