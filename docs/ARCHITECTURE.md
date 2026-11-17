# Kiến trúc hệ thống — AI Personalized Lesson Planner

> Tài liệu kiến trúc (Phần 14 – Bước 2, 3). Cập nhật cùng code ở mỗi sprint.

## 1. Kiểm tra codebase ban đầu

- Thư mục làm việc **trống** khi bắt đầu → khởi tạo dự án mới, không có code cũ cần bảo toàn.
- Môi trường: Node 22, npm 10, PostgreSQL 16 (local).
- Lưu ý mạng: registry của shadcn/ui bị chặn trong môi trường phát triển → các component UI được viết tay **theo đúng quy ước shadcn/ui** (Radix UI + `class-variance-authority` + `tailwind-merge`, thư mục `src/components/ui`). Có thể thay bằng `npx shadcn add` khi có mạng mà không đổi API.

## 2. Kiến trúc tổng thể

```
┌──────────────────────── Next.js 15 (App Router, TypeScript) ────────────────────────┐
│  UI (React Server Components + Client Components, Tailwind v4, shadcn-style UI)       │
│     │ Server Components gọi trực tiếp service      │ Client Components gọi REST API   │
│     ▼                                               ▼                                 │
│  src/server/services/*  (nghiệp vụ, phân quyền theo dữ liệu)  ◄──  src/app/api/*      │
│     │                         │                                   (REST, Zod validate)│
│     ▼                         ▼                                                       │
│  Prisma ORM ──► PostgreSQL    src/server/ai/* (AI service: runner, providers, prompts)│
│                               │   ├─ mock provider (mặc định, đánh dấu isMock)         │
│  File storage (Sprint 3):     │   └─ OpenAI provider (khi có OPENAI_API_KEY)           │
│  local ./storage → S3/R2      ▼                                                       │
│                         Ẩn danh hóa dữ liệu học sinh trước khi gửi prompt              │
└──────────────────────────────────────────────────────────────────────────────────────┘
middleware.ts: xác thực JWT (cookie httpOnly) cho mọi route trừ /login, /register.
```

**Nguyên tắc:**
1. Mọi nghiệp vụ nằm trong `src/server/services` — route API và Server Component chỉ là lớp mỏng.
2. Phân quyền 2 lớp: (a) middleware chặn chưa đăng nhập; (b) service luôn lọc theo `teacherId` sở hữu lớp.
3. AI là **module độc lập** (`src/server/ai`) có thể tách thành service riêng sau này: chỉ giao tiếp qua `runAITask(task, input)` với input/output có Zod schema.
4. API key chỉ đọc ở server (`server-only`).

## 3. Cấu trúc thư mục

```
prisma/                 schema.prisma, migrations/, seed.ts (dữ liệu mẫu, isSample=true)
docs/                   ARCHITECTURE.md, SPRINT_PLAN.md
src/
  app/
    (auth)/             login, register (layout 2 cột)
    (app)/              layout có sidebar + header; dashboard, classes, students, frameworks,
                        data-intake, evidence, analysis, profiles, lesson-plans, settings, audit, admin
    api/                REST endpoints
  components/
    ui/                 button, card, input, label, badge, alert, progress, skeleton,
                        empty-state, dropdown-menu, sheet
    layout/             app-shell, sidebar-nav, user-menu, page-header, module-placeholder
    dashboard/          stat-card, class-progress, recent-lesson-plans, quick-actions
    auth/               login-form, register-form, form-field
  config/navigation.ts  menu theo luồng nghiệp vụ + sprint dự kiến
  hooks/                use-api-form
  lib/                  prisma, api (lỗi chuẩn), audit, labels (nhãn tiếng Việt), utils, auth/*
  schemas/              Zod schemas (dùng chung client/server)
  server/
    services/           auth, dashboard (… class, student, evidence, profile, lesson-plan)
    ai/                 config, runner, types, anonymize, providers/, prompts/, tasks/ (Sprint 4+)
  middleware.ts
```

## 4. Danh sách trang (pages)

| Route | Module | Sprint |
|---|---|---|
| `/login`, `/register` | Tài khoản | 1 ✅ |
| `/dashboard` | Dashboard | 1 ✅ |
| `/settings` | Cài đặt (tài khoản, trạng thái AI) | 1 ✅ (cơ bản) |
| `/classes`, `/classes/[id]` | Quản lý lớp học | 2 ✅ |
| `/students` (+ dialog import) | Quản lý học sinh, import Excel | 2 ✅ |
| `/profiles`, `/profiles/[studentId]` | Hồ sơ học sinh (9 tab) | 2 ✅ → 4 (AI) |
| `/frameworks`, `/frameworks/[id]` | Thiết lập khung thông tin A–F | 2 ✅ |
| `/data-intake` | Tiếp nhận dữ liệu (upload + nhập văn bản) | 3 ✅ |
| `/evidence`, `/evidence/[id]` | Quản lý minh chứng, xem trước, phân loại | 3 ✅ |
| `/analysis`, `/analysis/[studentId]` | Phân tích AI & xác nhận | 4 |
| `/lesson-plans/new` → `/lesson-plans/[id]/wizard?step=1..6` | Wizard KHBD | 5–6 |
| `/lesson-plans`, `/lesson-plans/[id]` | Quản lý KHBD, phiên bản, xuất | 6 |
| `/training`, `/training/[id]`, `/training/documents/[id]` | Training – kho tài liệu chuyên môn theo môn (RAG) | ✅ (bổ sung) |
| `/audit`, `/admin/users` | Nhật ký, tài khoản & phân quyền | 7 |

Các trang chưa triển khai hiển thị **trang giữ chỗ trung thực** (ghi rõ sprint dự kiến), không có nút/dữ liệu giả.

## 5. Database schema

Xem `prisma/schema.prisma` (đã migrate). 28 entity theo Phần 9 + 3 bảng hỗ trợ:

- **Tổ chức:** `User`, `Teacher`, `School`, `Subject`, `Class`, `ClassSubject` (lớp ↔ môn ↔ GV).
- **Học sinh:** `Student` (có `profileStatus`, **không có** trường xếp loại học lực).
- **Khung:** `AssessmentFramework` → `AssessmentCriteria` (theo `ProfileDimension` A–F, tùy chỉnh được).
- **Dữ liệu & minh chứng:** `StudentEvidence` (loại, nguồn, file, văn bản, trạng thái xử lý, thời gian thu thập) ↔ `EvidenceStudentLink` (một minh chứng – nhiều HS) ↔ tiêu chí; `StudentObservation`; `AcademicResult` (điểm **lưu riêng**, chỉ tham khảo).
- **Hồ sơ cấp 1:** `StudentInterest`, `StudentStrength`, `StudentLearningNeed`, `StudentLearningPreference`, `StudentDevelopmentGoal`, `CompetencyAssessment` (mô tả định tính), `StudentCompetencyProfile` (tóm tắt, phiên bản). Mỗi mục có `origin` (TEACHER/AI/IMPORT), `reviewStatus`, `confidence`, liên kết minh chứng và `recommendationId` để truy vết.
- **KHBD cấp 2:** `LessonPlan` (wizardStep, lessonAnalysis, content JSON) → `LessonActivity` (4 pha) → `LearningGroup` → `LearningGroupMember` (vai trò, căn cứ, `isNewChallenge`, `insufficientData`) → `DifferentiatedTask` (guidanceLevel) ↔ `LearningMaterial`; `LessonPlanVersion` (snapshot).
- **AI & phê duyệt:** `AIAnalysis` (taskType, provider, model, **isMock**, promptVersion, input ẩn danh, output) → `AIRecommendation` (nhận định, lập luận, evidenceRefs, confidence, missingInfo) → `TeacherApproval` (APPROVED/EDITED/REJECTED/REANALYZE_REQUESTED).
- **Kiểm toán:** `AuditLog`.

Quy tắc dữ liệu: chỉ mục có `reviewStatus ∈ {CONFIRMED, EDITED}` được dùng để xây dựng KHBD. Nhóm hoạt động luôn gắn `lessonPlanId`.

## 6. API endpoints

| Method | Endpoint | Mô tả | Sprint |
|---|---|---|---|
| GET | `/api/students?q&classId&status` · GET/PATCH/DELETE `/api/students/:id` | Danh sách / hồ sơ / sửa / xóa học sinh | 2 ✅ |
| GET | `/api/students/import-template` · `/api/subjects` | Tệp mẫu Excel, môn học | 2 ✅ |
| POST | `/api/students/:id/profile-items` · PATCH/DELETE `/api/profile-items/:dimension/:id` | Mục hồ sơ do giáo viên nhập | 2 ✅ |
| PATCH | `/api/students/:id/profile` | Tóm tắt, nhận xét chung, trạng thái hồ sơ | 2 ✅ |
| POST | `/api/students/:id/academic-results` · DELETE `/api/academic-results/:id` | Kết quả học tập (tham khảo) | 2 ✅ |
| POST | `/api/auth/register` · `/login` · `/logout` | Xác thực | 1 ✅ |
| GET | `/api/auth/me` | Phiên hiện tại | 1 ✅ |
| GET | `/api/dashboard/stats` | Số liệu dashboard | 1 ✅ |
| GET | `/api/health` | DB + chế độ AI | 1 ✅ |
| GET/POST | `/api/classes` · GET/PATCH/DELETE `/api/classes/:id` | CRUD lớp || 2 ✅ |
| GET/POST | `/api/classes/:id/students` · PATCH/DELETE `/api/students/:id` | CRUD học sinh || 2 ✅ |
| POST | `/api/classes/:id/students/import` | Import Excel/CSV (preview → commit) || 2 ✅ |
| GET/POST/PATCH | `/api/frameworks`, `/api/frameworks/:id/criteria` | Khung & tiêu chí || 2 ✅ |
| POST | `/api/evidence` (multipart) · GET `/api/evidence?q&classId&studentId&type&status&page` | Tải tệp / danh sách minh chứng | 3 ✅ |
| POST | `/api/evidence/note` | Nhập văn bản tự do | 3 ✅ |
| GET/PATCH/DELETE | `/api/evidence/:id` · GET `/api/evidence/:id/file` · POST `/api/evidence/:id/extract` | Chi tiết, phân loại, tệp, trích xuất lại | 3 ✅ |
| POST | `/api/students/:id/observations` · DELETE `/api/observations/:id` | Nhận xét quan sát | 2 ✅ |
| POST | `/api/students/:id/analyze` | Chạy phân tích AI | 4 |
| POST | `/api/recommendations/:id/decision` | Đồng ý/sửa/từ chối/phân tích lại | 4 |
| GET | `/api/students/:id/profile` | Hồ sơ tổng hợp | 4 |
| GET/POST | `/api/training/collections` · GET/PATCH/DELETE `/api/training/collections/:id` | Bộ tài liệu training theo môn | ✅ |
| POST | `/api/training/collections/:id/documents` (multipart) | Tải tài liệu PDF/DOCX → trích xuất, chia đoạn, đánh chỉ mục | ✅ |
| GET | `/api/training/collections/:id/search?q&lesson&limit` | Truy xuất đoạn tài liệu kèm trích dẫn | ✅ |
| GET/PATCH/DELETE | `/api/training/documents/:id` · `/chunks` · `/file` · POST `/reprocess` | Quản lý tài liệu | ✅ |
| POST/PATCH | `/api/lesson-plans`, `/api/lesson-plans/:id` | Wizard KHBD (lưu từng bước) | 5 |
| POST | `/api/lesson-plans/:id/analyze` · `/groups/suggest` · `/tasks/suggest` | AI bài học/nhóm/nhiệm vụ | 5 |
| CRUD | `/api/lesson-plans/:id/groups`, `/groups/:gid/members` | Nhóm & thành viên | 5 |
| POST | `/api/lesson-plans/:id/generate` · `/activities/:aid/revise` | Tạo/viết lại KHBD | 6 |
| POST/GET | `/api/lesson-plans/:id/versions` · `/export?format=docx|pdf` | Phiên bản, xuất | 6 |

Định dạng phản hồi thống nhất: `{ data }` hoặc `{ error, details }` (422 cho lỗi validation theo field).

## 7. Kiến trúc AI service

```
service nghiệp vụ ──► runAITask(taskDef, input)
                        ├─ inputSchema.parse (Zod)
                        ├─ provider = getAIConfig()  ── mock | openai
                        │     mock  → taskDef.mock(input)   (xác định, isMock=true)
                        │     openai→ buildPrompt → completeJSON (JSON mode)
                        └─ outputSchema.parse → lưu AIAnalysis + AIRecommendation (PENDING)
                                                    └─ giáo viên duyệt → TeacherApproval → mục hồ sơ CONFIRMED
```

- `prompts/shared.ts`: nguyên tắc cốt lõi chèn vào mọi prompt (không bịa, không xếp loại, nêu căn cứ & mức tin cậy, ghi `missingInfo`).
- `prompts/registry.ts`: danh mục 10 tác vụ độc lập (Phần 10); mỗi tác vụ là một file trong `ai/tasks/` với `promptVersion` để truy vết.
- `anonymize.ts`: thay tên HS bằng mã tạm (HS01…), bỏ ngày sinh/giới tính trước khi gửi prompt; ánh xạ ngược chỉ ở bộ nhớ server.
- Đổi model qua `AI_MODEL`; thêm provider mới bằng cách triển khai interface `AIProvider`.
- **Mock không giả vờ là AI thật:** badge “AI: chế độ mô phỏng” trên header, cờ `isMock` trong DB.

### 7.1. Training – kho tài liệu tham chiếu (RAG)

```
PDF/DOCX ─► trích văn bản THEO TRANG (unpdf / mammoth)
         ─► nhận diện cấu trúc: số trang in, "Bài N" + tiêu đề, "Ôn tập học kì", "Văn bản N", Đọc/Viết/Nói và nghe…, trang mục lục
         ─► nối các phần của cùng một cuốn (cùng "Tập", trang liền kề) để kế thừa bài học khi tệp bắt đầu giữa bài
         ─► chia đoạn ~1.200 ký tự, không vượt trang (trích dẫn chính xác), gắn bài + đề mục
         ─► KnowledgeChunk.searchText (không dấu) + chỉ mục GIN to_tsvector('simple')
truy vấn ─► AND (đủ từ) + cộng điểm cụm từ liền nhau, bổ sung OR; hạ điểm trang mục lục
         ─► retrieveReferenceContext(subjectId, query) → [{ citation: "SGV…, tr. 52 (Bài 2)", content }]
```
- Đây là cơ chế **truy xuất ngữ cảnh**, không fine-tune mô hình. Sprint 5–6: Phân tích bài học / Tạo KHBD sẽ đưa các đoạn truy xuất vào prompt và bắt buộc trích dẫn nguồn.
- Khi có API key: có thể bổ sung embedding (pgvector) để tìm theo ngữ nghĩa, giữ full-text làm phương án song song.
- Tài liệu (có thể có bản quyền) chỉ chủ sở hữu xem được; tệp gốc không đưa vào git (`/storage`).

## 8. Thiết kế giao diện

- **Layout:** sidebar cố định 256px (desktop) / drawer (mobile, tablet < 1024px); header sticky gồm trạng thái AI và menu người dùng; nội dung tối đa 1280px.
- **Sidebar:** nhóm theo luồng nghiệp vụ — Tổng quan → Lớp học → Hồ sơ học sinh → Kế hoạch bài dạy → Hệ thống; mục chưa xong có nhãn `S{n}`.
- **Màu sắc:** trung tính slate + một màu nhấn indigo; màu trạng thái (success/warning/danger/info) chỉ dùng cho trạng thái. Font Be Vietnam Pro.
- **Dashboard:** 5 thẻ số liệu, tiến độ hồ sơ theo lớp, KHBD gần đây, tiến độ tổng, thao tác nhanh.
- **Lớp học:** bảng có tìm kiếm/lọc theo năm học, môn; cột trạng thái hồ sơ dạng thanh tiến độ.
- **Hồ sơ học sinh:** header (tên, lớp, trạng thái) + 9 tab; mỗi mục hiển thị huy hiệu nguồn (GV/AI), trạng thái duyệt, mức tin cậy, link minh chứng.
- **Tiếp nhận dữ liệu:** bộ chọn lớp/HS/môn/tiêu chí → vùng kéo-thả nhiều tệp + vùng nhập văn bản → danh sách tệp với trạng thái xử lý và kết quả trích xuất.
- **Phân tích AI:** 3 cột — dữ liệu đầu vào | nhận định AI (mức tin cậy, căn cứ) | minh chứng; thao tác Đồng ý / Sửa / Từ chối / Phân tích lại.
- **Wizard KHBD:** stepper 6 bước, lưu nháp mỗi bước vào DB (quay lại không mất dữ liệu).
- **Nhóm hoạt động:** thẻ nhóm (mục tiêu, thành viên + lý do, nhiệm vụ, sản phẩm, học liệu, hỗ trợ), chuyển HS giữa nhóm, không hiển thị nhãn học lực.
- **Soạn thảo KHBD:** cấu trúc I–V dạng các khối chỉnh sửa được; mỗi hoạt động có nút “AI viết lại / phát triển chi tiết”; thanh phiên bản & xuất.

## 9. Bảo mật

- Mật khẩu bcrypt (cost 12); phiên JWT HS256 trong cookie `httpOnly`, `sameSite=lax`, `secure` khi production, hết hạn 8 giờ.
- Phân quyền theo vai trò (ADMIN, SCHOOL_MANAGER, TEACHER) + theo quyền sở hữu dữ liệu.
- Ghi `AuditLog` cho đăng nhập/đăng ký/đăng xuất (mở rộng cho mọi thao tác ghi từ Sprint 2).
- Upload: xác định loại bằng magic bytes (không tin Content-Type/phần mở rộng), giới hạn 10 MB × 10 tệp, khóa lưu trữ UUID, chống path traversal, tệp chỉ đọc được qua route kiểm tra quyền sở hữu (`nosniff`, `no-store`).
- Hạn chế đã biết: phiên JWT stateless — đăng xuất xóa cookie nhưng token đã lộ vẫn hợp lệ tới khi hết hạn. Kế hoạch Sprint 7: thêm bảng phiên/thu hồi token và rate-limit đăng nhập.
