import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLessonDraft, groupStyle } from "../src/lib/lesson/template";
import { GROUP_PRESETS } from "../src/lib/grouping/presets";

import { effectiveCriteria } from "../src/lib/grouping/interpret";
const nv = GROUP_PRESETS.find((p) => p.id === "ngu-van")!.groups;
const groups = effectiveCriteria(nv, [], []).map((g, i) => ({ ...g, id: "g" + i, profile: nv[i].description }));

test("nhận diện phong cách nhóm từ đặc trưng GV đặt", () => {
  assert.deepEqual(groups.map(groupStyle), ["creative", "analytic", "communication", "support"]);
  assert.equal(groupStyle({ ...groups[0], id: "x", keywords: [], scoreMin: 8, scoreMax: null }), "advanced");
});

test("KHBD có 4 hoạt động, nhiệm vụ khác nhau cho từng nhóm, đủ thời lượng", () => {
  const acts = buildLessonDraft({ subject: "Ngữ văn", title: "Tây Tiến", periods: 2, requirements: "Phân tích được hình tượng người lính" }, groups);
  assert.equal(acts.length, 4);
  assert.equal(acts.reduce((a, x) => a + (x.minutes ?? 0), 0), 90);
  for (const a of acts.filter((x) => x.byGroup)) {
    assert.equal(a.tasks.length, 4);
    assert.equal(new Set(a.tasks.map((t) => t.task)).size, 4, "nhiệm vụ các nhóm phải khác nhau");
    assert.ok(a.tasks.every((t) => t.task.includes("Tây Tiến")));
  }
});

test("nhóm chỉ có khoảng điểm ở mức giữa nhận nhiệm vụ riêng, không chung chung", () => {
  const g = { id: "m", name: "Phát triển", profile: null, keywords: [], scoreMin: 6.5, scoreMax: 8, forSupport: false };
  assert.equal(groupStyle(g), "developing");
});
