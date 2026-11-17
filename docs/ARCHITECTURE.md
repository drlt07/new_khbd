# Kiến trúc — Trợ lý dạy học cá thể hóa

## 1. Hai pha, một nguồn dữ liệu

```
PHA 1 — PHÂN TÍCH & PHÂN NHÓM                         PHA 2 — THIẾT KẾ KHBD PHÂN HÓA
1 Dữ liệu → 2 Tiêu chí → 3 AI phân nhóm → 4 GV duyệt  ──►  Bài học → Tiến trình chung → Nhiệm vụ theo nhóm → Hoàn thiện, xuất Word/PDF
                 Kết quả: Hồ sơ nhóm (Group Profiles, có phiên bản)      Kết quả: 1 KHBD thống nhất, nhiệm vụ phân hóa có chủ đích
```

## 2. Bốn thực thể

| Thực thể | Bảng | Nội dung |
|---|---|---|
| Class | `Class`, `Student`, `StudentTrait`, `ScoreSheet/Column/StudentScore` | Học sinh, đặc trưng, bảng điểm |
| Grouping Session | `Grouping` (model `GroupingSession`) | Tiêu chí, số nhóm, bộ máy (`engine`), **phiên bản** (`lineageId`, `version`, `status` DRAFT/CONFIRMED/SUPERSEDED), bước stepper |
| Group Profile | `Group` (model `GroupProfile`) | Mô tả của GV, tiêu chí hiệu lực (`criteria`), thành viên + lý do + mức phù hợp, đặc trưng năng lực, điểm mạnh, khó khăn, nhu cầu, mục tiêu hỗ trợ; `slotKey` giữ nguyên qua các phiên bản |
| Lesson Plan | `LessonPlan`, `LessonActivity`, `GroupTask` | Gắn với **một phiên bản** hồ sơ nhóm; mỗi hoạt động có nhiệm vụ/học liệu/mức thử thách/hỗ trợ/đánh giá cho từng nhóm |

**Quy tắc phiên bản:** phiên đã duyệt không sửa được. “Tạo phiên bản mới” sao chép sang bản nháp v+1; khi duyệt v+1, phiên cũ thành `SUPERSEDED`. KHBD dùng phiên cũ được đánh dấu “cần cập nhật” (Dashboard, Kho KHBD, banner trong trình soạn); “Cập nhật theo vN” chuyển nhiệm vụ sang nhóm mới qua `slotKey`, gợi ý nhiệm vụ cho nhóm mới, bỏ nhiệm vụ của nhóm đã xóa.

## 3. Bộ máy AI (`src/server/ai`)

- **Claude** (`claude-opus-5-5`) khi máy chủ có `ANTHROPIC_API_KEY`: đầu ra có cấu trúc (Zod), fallback phía server khi mô hình từ chối, dữ liệu học sinh ẩn danh (HS01…). Kết quả Pha 1 được kiểm tra (đủ học sinh, mỗi em một nhóm, đúng sĩ số tối đa) — sai thì dùng quy tắc.
- **Bộ máy quy tắc** (mặc định, có kiểm thử): `lib/grouping/interpret.ts` (diễn giải mô tả nhóm → mức điểm theo phân vị lớp + từ khóa), `match.ts` (phân bổ), `check.ts` (kiểm tra), `profile.ts` (hồ sơ nhóm), `lib/lesson/template.ts` (tiến trình, nhiệm vụ, học liệu, điều chỉnh độ khó, kiểm tra mục tiêu).
- Mọi kết quả ghi rõ bộ máy đã dùng (`engine`). “Kiểm tra mục tiêu” luôn dùng quy tắc xác định.

## 4. Giao diện

- **App shell (Notion):** sidebar WORKSPACE (Tổng quan · Lớp học của tôi · Dữ liệu học sinh) / TEACHING WORKFLOW (01 Phân tích & phân nhóm · 02 Thiết kế KHBD) / LIBRARY (Kho KHBD · Học liệu & tài nguyên · Cài đặt).
- **Dashboard:** quy trình đang làm dở (tiến độ từng bước), việc chờ duyệt, lớp gần đây, lịch sử hoạt động.
- **Pha 1 (Linear):** stepper 4 bước có trạng thái; bước chưa đủ đầu vào bị khóa kèm lý do; phiên đã duyệt chỉ xem.
- **Pha 2 (Canva):** trình soạn toàn màn hình 3 vùng — Cấu trúc | Nội dung dạng khối | AI Assistant (gợi ý nhiệm vụ theo nhóm, tạo học liệu, điều chỉnh độ khó, kiểm tra mục tiêu). Đề xuất AI chỉ áp dụng khi GV bấm “Áp dụng”.
- Lớp học là không gian làm việc: dữ liệu, các bộ nhóm theo phiên bản, KHBD và lịch sử chỉnh sửa (`ActivityLog`).

## 5. Kiểm thử
`npm test` — thuật toán phân nhóm, diễn giải mô tả, kiểm tra, đọc bảng điểm, sinh KHBD.
