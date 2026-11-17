import assert from "node:assert/strict";
import { test } from "node:test";
import { assignToGroups, keywordMatches, weightedAverage, type MStudent } from "../src/lib/grouping/match";
import { GROUP_PRESETS } from "../src/lib/grouping/presets";

const st = (id: string, o: Partial<MStudent> = {}): MStudent => ({ id, fullName: id, interests: [], strengths: [], needs: [], score: null, ...o });

test("so khớp từ khóa không dấu, theo cụm từ", () => {
  assert.ok(keywordMatches("Văn học", "van hoc"));
  assert.ok(keywordMatches("Văn", "Văn học"));
  assert.ok(!keywordMatches("Vẽ", "Viết sáng tạo"));
});

test("xếp đúng nhóm theo đặc trưng GV đặt, số nhóm cố định", () => {
  const groups = GROUP_PRESETS[0].groups;
  const students = [
    st("a", { strengths: ["Viết sáng tạo"] }),
    st("b", { strengths: ["Phân tích"] }),
    st("c", { strengths: ["Thuyết trình"] }),
    st("d", { needs: ["Cần thêm thời gian"], score: 5 }),
  ];
  const res = assignToGroups(students, groups, true);
  const g = Object.fromEntries(res.map((r) => [r.studentId, r.groupIndex]));
  assert.deepEqual(g, { a: 0, b: 1, c: 2, d: 3 });
  assert.ok(res.every((r) => r.reason.length > 0));
});

test("cân bằng sĩ số: chênh lệch tối đa 1, có ghi lý do khi bị chuyển", () => {
  const groups = GROUP_PRESETS[0].groups;
  const students = Array.from({ length: 10 }, (_, i) => st("s" + i, { strengths: ["Viết sáng tạo"] }));
  const res = assignToGroups(students, groups, true);
  const sizes = groups.map((_, gi) => res.filter((r) => r.groupIndex === gi).length);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `sizes ${sizes}`);
  assert.ok(res.some((r) => r.reason.includes("đã đủ sĩ số")));
});

test("khoảng điểm: dưới 6,5 vào Củng cố, từ 8 vào Mở rộng", () => {
  const groups = GROUP_PRESETS[2].groups;
  const res = assignToGroups([st("x", { score: 5.5 }), st("y", { score: 7 }), st("z", { score: 8.6 })], groups, false);
  assert.deepEqual(res.map((r) => [r.studentId, r.groupIndex]).sort(), [["x", 0], ["y", 1], ["z", 2]]);
});

test("thiếu dữ liệu: ghi rõ, không suy đoán", () => {
  const res = assignToGroups([st("n")], GROUP_PRESETS[0].groups, true);
  assert.equal(res[0].fit, "none");
  assert.match(res[0].reason, /Chưa có đặc trưng/);
});

test("điểm trung bình theo hệ số", () => {
  assert.equal(weightedAverage([{ value: 6, weight: 1 }, { value: 9, weight: 2 }]), 8);
  assert.equal(weightedAverage([]), null);
});
