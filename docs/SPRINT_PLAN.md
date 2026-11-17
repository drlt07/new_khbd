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

## Sprint 2 — Lớp học & học sinh ✅
- [x] CRUD lớp (năm học, khối, môn học qua ClassSubject; tự tạo môn mới, không phân biệt hoa thường), lưu trữ → khôi phục → xóa vĩnh viễn (chỉ khi đã lưu trữ)
- [x] Danh sách lớp: tìm kiếm, lọc năm học / môn / trạng thái lưu trữ (đồng bộ URL), tiến độ hồ sơ
- [x] Chi tiết lớp: thống kê, danh sách học sinh, thêm / sửa / chuyển lớp / xóa học sinh
- [x] Trang Học sinh toàn bộ: tìm theo tên/mã, lọc lớp & trạng thái hồ sơ
- [x] Import Excel/CSV 2 bước: xem trước + báo lỗi theo dòng (thiếu tên, ngày sai, mã trùng trong tệp/lớp, giới tính lạ) → xác nhận; tệp mẫu .xlsx; kiểm tra chữ ký tệp, giới hạn 2 MB / 500 dòng
- [x] Khung thông tin A–F: tự tạo khung mặc định cho giáo viên mới, tạo khung theo môn, thêm / đổi tên / ẩn / xóa tiêu chí
- [x] Hồ sơ học sinh 9 tab: Tổng quan (tóm tắt, thông tin cơ bản), Sở thích, Thế mạnh, Năng lực (+ kết quả học tập lưu riêng, ghi rõ chỉ tham khảo), Nhu cầu hỗ trợ (+ cách học phù hợp), Định hướng phát triển, Minh chứng (chờ Sprint 3), Nhận xét (nhận xét chung + quan sát), Lịch sử cập nhật
- [x] Mục hồ sơ hiển thị nguồn (GV/AI), trạng thái duyệt, mức tin cậy, tiêu chí, số minh chứng; tiêu chí phải khớp phương diện
- [x] Audit log cho mọi thao tác ghi; phân quyền theo quyền sở hữu (404 với dữ liệu của giáo viên khác)
- [x] Kiểm thử: API (hợp lệ + lỗi + cô lập giữa 2 giáo viên), luồng UI bằng Playwright, mobile không tràn ngang

## Sprint 3 — Tiếp nhận dữ liệu ✅
- [x] Storage adapter (`src/server/storage`): local disk, khóa lưu trữ ngẫu nhiên, chống path traversal; interface sẵn sàng cho S3/R2 (chưa cài đặt driver)
- [x] Upload nhiều tệp (≤ 10 tệp, ≤ 10 MB/tệp): PDF, DOCX, XLSX, CSV, PNG, JPG — xác định loại bằng magic bytes, đối chiếu phần mở rộng, phát hiện tệp trùng (sha256)
- [x] Nhập văn bản tự do (nhận xét quan sát) — một văn bản có thể gắn nhiều học sinh
- [x] Phân loại: lớp, môn học, loại minh chứng, ngày thu thập, học sinh (nhiều), tiêu chí (nhiều, theo phương diện A–F); kiểm tra mọi liên kết thuộc lớp/giáo viên
- [x] Trích xuất KHÔNG dùng AI: PDF (unpdf), DOCX (mammoth), XLSX (exceljs), CSV; ảnh lưu để xem (OCR để Sprint 4); trạng thái UPLOADED → EXTRACTING → EXTRACTED/FAILED; trích xuất lại
- [x] Gợi ý học sinh liên quan bằng so khớp họ tên/mã (không dấu, ranh giới từ) kèm trích đoạn — giáo viên bấm “Gắn”
- [x] Trang Minh chứng: tìm kiếm cả trong nội dung đã trích xuất, lọc lớp/loại/trạng thái, phân trang
- [x] Chi tiết minh chứng: xem trước ảnh / PDF / bảng / văn bản, sửa phân loại, tải về, xóa (xóa cả tệp)
- [x] Phục vụ tệp qua route có kiểm tra quyền (`nosniff`, `no-store`, CSP cho ảnh); không có URL công khai
- [x] Tab Minh chứng trong hồ sơ + nút “Thêm minh chứng” điền sẵn lớp/học sinh; lịch sử hồ sơ ghi gắn/gỡ minh chứng
- [x] Kiểm thử API (7 loại tệp gồm tệp giả mạo, cô lập dữ liệu, trùng tệp) và luồng UI Playwright (desktop + mobile)

## Bổ sung — Training: kho tài liệu chuyên môn theo môn ✅
- [x] Mục menu “Training” → “Kho tài liệu training”, mục con theo từng bộ tài liệu (ví dụ “Ngữ văn 12”)
- [x] Bộ tài liệu theo môn/khối; tải PDF/DOCX (≤ 50 MB/tệp), chống trùng, xử lý lại, xóa
- [x] Trích xuất theo trang, nhận diện bài học/đề mục/trang in, nối các phần của cùng một tập (kể cả khi tải không theo thứ tự)
- [x] Tìm kiếm full-text không dấu có trích dẫn (tài liệu, tập, trang, bài, đề mục); lọc theo bài; hạ điểm trang mục lục
- [x] Hàm `retrieveReferenceContext` sẵn sàng cho AI phân tích bài học / soạn KHBD (Sprint 5–6)
- [x] Đã nạp bộ “Ngữ văn 12 – SGV Kết nối tri thức”: 4 tệp, 256 trang, 712 đoạn, nhận diện Bài 1–9 + Ôn tập HK I/II

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
