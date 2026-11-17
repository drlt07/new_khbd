import assert from "node:assert/strict";
import { test } from "node:test";
import { detectScoreTable, detectComponent } from "../src/lib/scores/detect";

test("bảng điểm vnEdu: tiêu đề 2 dòng gộp ô, nhiều môn", () => {
  const t = [
    ["BẢNG ĐIỂM HỌC KỲ I – LỚP 12A1"],
    ["STT", "Mã HS", "Họ và tên", "Ngữ văn", "Ngữ văn", "Ngữ văn", "Toán"],
    ["STT", "Mã HS", "Họ và tên", "TX1", "Giữa kỳ", "Cuối kỳ", "TB HK1"],
    ["1", "HS01", "Nguyễn Minh An", "7", "6,5", "8", "5"],
    ["2", "HS02", "Trần Bảo Châu", "8", "", "9", "7.5"],
    ["3", "HS03", "Lê Gia Huy", "5", "6", "6", "9"],
  ];
  const d = detectScoreTable(t);
  assert.deepEqual(d.headerRows, [2, 3]);
  assert.equal(d.codeColumn, "Mã HS");
  assert.equal(d.rows.length, 3);
  assert.deepEqual(d.scoreColumns.map((c) => [c.subject, c.component]), [["Ngữ văn", "TX"], ["Ngữ văn", "GK"], ["Ngữ văn", "CK"], ["Toán", "TB"]]);
  assert.deepEqual(d.rows[0].scores, { 3: 7, 4: 6.5, 5: 8, 6: 5 });
  assert.equal(d.rows[1].scores[4], undefined);
});

test("bảng chỉ có 1 cột điểm, họ và tên tách 2 cột", () => {
  const t = [["Họ", "Tên", "Điểm thi vào 10"], ["Nguyễn Văn", "An", "7"], ["Phạm Thị", "Hoa", "8.25"]];
  const d = detectScoreTable(t);
  assert.equal(d.rows[1].fullName, "Phạm Thị Hoa");
  assert.equal(d.scoreColumns.length, 1);
});

test("báo lỗi rõ khi không có cột điểm", () => {
  assert.throws(() => detectScoreTable([["Họ và tên"], ["Nguyễn An"], ["Lê Bình"]]), /danh sách học sinh|cột điểm/);
});

test("nhận diện loại điểm", () => {
  assert.equal(detectComponent("ĐĐGgk"), "GK");
  assert.equal(detectComponent("Điểm TB cả năm"), "TB");
  assert.equal(detectComponent("Kiểm tra miệng"), "TX");
});
