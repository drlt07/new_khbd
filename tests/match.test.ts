import assert from "node:assert/strict";
import { test } from "node:test";
import { assignToGroups, keywordMatches, weightedAverage, type MStudent } from "../src/lib/grouping/match";
import { GROUP_PRESETS } from "../src/lib/grouping/presets";
import { effectiveCriteria as eff0 } from "../src/lib/grouping/interpret";
const NV = () => eff0(GROUP_PRESETS.find((p) => p.id === "ngu-van")!.groups, [], []);

const st = (id: string, o: Partial<MStudent> = {}): MStudent => ({ id, fullName: id, interests: [], strengths: [], needs: [], score: null, ...o });

test("so khớp từ khóa không dấu, theo cụm từ", () => {
  assert.ok(keywordMatches("Văn học", "van hoc"));
  assert.ok(keywordMatches("Văn", "Văn học"));
  assert.ok(!keywordMatches("Vẽ", "Viết sáng tạo"));
});

test("xếp đúng nhóm theo đặc trưng GV đặt, số nhóm cố định", () => {
  const groups = NV();
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
  const groups = NV();
  const students = Array.from({ length: 10 }, (_, i) => st("s" + i, { strengths: ["Viết sáng tạo"] }));
  const res = assignToGroups(students, groups, true);
  const sizes = groups.map((_, gi) => res.filter((r) => r.groupIndex === gi).length);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `sizes ${sizes}`);
  assert.ok(res.some((r) => r.reason.includes("đã đủ sĩ số")));
});

test("khoảng điểm: dưới 6,5 vào Củng cố, từ 8 vào Mở rộng", () => {
  const groups = [
    { name: "Củng cố", keywords: [], scoreMin: null, scoreMax: 6.5, forSupport: true },
    { name: "Phát triển", keywords: [], scoreMin: 6.5, scoreMax: 8, forSupport: false },
    { name: "Mở rộng", keywords: [], scoreMin: 8, scoreMax: null, forSupport: false },
  ];
  const res = assignToGroups([st("x", { score: 5.5 }), st("y", { score: 7 }), st("z", { score: 8.6 })], groups, false);
  assert.deepEqual(res.map((r) => [r.studentId, r.groupIndex]).sort(), [["x", 0], ["y", 1], ["z", 2]]);
});

test("thiếu dữ liệu: ghi rõ, không suy đoán", () => {
  const res = assignToGroups([st("n")], NV(), true);
  assert.equal(res[0].fit, "none");
  assert.match(res[0].reason, /Chưa có đặc trưng/);
});

test("điểm trung bình theo hệ số", () => {
  assert.equal(weightedAverage([{ value: 6, weight: 1 }, { value: 9, weight: 2 }]), 8);
  assert.equal(weightedAverage([]), null);
});

import { effectiveCriteria, detectLevel } from "../src/lib/grouping/interpret";
import { checkGrouping } from "../src/lib/grouping/check";

test("diễn giải mô tả nhóm của GV thành mức điểm theo phân bố lớp", () => {
  assert.equal(detectLevel("Học sinh có năng lực tốt, khả năng tự học cao"), 3);
  assert.equal(detectLevel("Học sinh khá, có khả năng vận dụng"), 2);
  assert.equal(detectLevel("Học sinh trung bình, cần hướng dẫn"), 1);
  assert.equal(detectLevel("Học sinh cần hỗ trợ củng cố kiến thức nền"), 0);
  assert.equal(detectLevel("Có khả năng thuyết trình"), null, "“khả năng” không phải “khá”");
  const groups = ["Học sinh có năng lực tốt, khả năng tự học cao", "Học sinh khá, có khả năng vận dụng", "Học sinh trung bình, cần hướng dẫn", "Học sinh cần hỗ trợ củng cố kiến thức nền"]
    .map((d, i) => ({ name: `Nhóm ${i + 1}`, description: d, keywords: [], scoreMin: null, scoreMax: null, forSupport: false, maxSize: null }));
  const scores = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5];
  const eff = effectiveCriteria(groups, [], scores);
  const students = scores.map((s, i) => st("s" + i, { score: s }));
  const res = assignToGroups(students, eff, false);
  const sizes = eff.map((_, gi) => res.filter((r) => r.groupIndex === gi).length);
  assert.ok(sizes.every((n) => n >= 2), `mỗi nhóm có học sinh: ${sizes}`);
  assert.equal(res.find((r) => r.studentId === "s11")!.groupIndex, 0, "điểm cao nhất vào nhóm năng lực tốt");
  assert.equal(res.find((r) => r.studentId === "s0")!.groupIndex, 3, "điểm thấp nhất vào nhóm củng cố");
  assert.ok(eff[0].keywords.includes("Tự học"));
});

test("không mặc định sĩ số bằng nhau; tôn trọng sĩ số tối đa", () => {
  const g = [{ name: "A", keywords: ["Vẽ"], scoreMin: null, scoreMax: null, forSupport: false, maxSize: 2 }, { name: "B", keywords: [], scoreMin: null, scoreMax: null, forSupport: false, maxSize: null }];
  const res = assignToGroups(Array.from({ length: 5 }, (_, i) => st("v" + i, { strengths: ["Vẽ"] })), g, false);
  assert.equal(res.filter((r) => r.groupIndex === 0).length, 2);
  assert.equal(res.filter((r) => r.groupIndex === 1).length, 3);
});

test("kiểm tra phân nhóm phát hiện nhóm trống và học sinh chưa xếp", () => {
  const g = [{ name: "A", keywords: [], scoreMin: null, scoreMax: null, forSupport: false, members: ["x"] }, { name: "B", keywords: [], scoreMin: null, scoreMax: null, forSupport: false, members: [] }];
  const r = checkGrouping(g, [st("x"), st("y")], ["x", "y"]);
  assert.ok(r.issues.some((i) => i.level === "error" && i.message.includes("B")));
  assert.ok(r.issues.some((i) => i.message.includes("chưa được xếp")));
});
