/**
 * Thuật toán chia nhóm học sinh — thuần (không I/O), có thể kiểm thử độc lập.
 *
 * Nguyên tắc:
 *  - KHÔNG dùng điểm số / học lực.
 *  - Sĩ số các nhóm chênh nhau tối đa 1.
 *  - Mỗi học sinh có lý do xếp nhóm dựa trên hồ sơ; thiếu dữ liệu thì nói rõ, không suy đoán.
 *  - Kết quả chỉ là gợi ý — giáo viên chỉnh sửa trước khi lưu.
 */

export type GroupingMethod = "MIXED" | "INTEREST" | "RANDOM";

export type GStudent = {
  id: string;
  fullName: string;
  interests: string[];
  strengths: string[];
  needs: string[];
};

export type GMember = { studentId: string; reason: string };
export type GGroup = { name: string; task: string | null; members: GMember[] };

/** PRNG có seed để "Chia lại" cho kết quả khác nhưng vẫn tái lập được khi kiểm thử. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const norm = (s: string) => s.trim().toLowerCase();

/** Sức chứa từng nhóm: chênh lệch tối đa 1 */
function capacities(n: number, k: number) {
  const base = Math.floor(n / k);
  return Array.from({ length: k }, (_, i) => base + (i < n % k ? 1 : 0));
}

export function suggestGroups(students: GStudent[], groupCount: number, method: GroupingMethod, seed = 1): GGroup[] {
  const k = Math.max(1, Math.min(groupCount, students.length || 1));
  const rand = mulberry32(seed);
  const pool = shuffle(students, rand);
  if (method === "RANDOM") return randomGroups(pool, k);
  if (method === "INTEREST") return interestGroups(pool, k);
  return mixedGroups(pool, k);
}

// ───────────── Ngẫu nhiên ─────────────

function randomGroups(pool: GStudent[], k: number): GGroup[] {
  const groups: GGroup[] = Array.from({ length: k }, (_, i) => ({ name: `Nhóm ${i + 1}`, task: null, members: [] }));
  pool.forEach((s, i) => groups[i % k].members.push({ studentId: s.id, reason: "Chia ngẫu nhiên" }));
  return groups;
}

// ───────────── Đa dạng thế mạnh ─────────────

function mixedGroups(pool: GStudent[], k: number): GGroup[] {
  const cap = capacities(pool.length, k);
  const buckets: GStudent[][] = Array.from({ length: k }, () => []);

  // Xếp trước: học sinh cần hỗ trợ (để rải đều), rồi học sinh nhiều thế mạnh (để phân tán thế mạnh)
  const order = [...pool].sort((a, b) => (b.needs.length > 0 ? 1 : 0) - (a.needs.length > 0 ? 1 : 0) || b.strengths.length - a.strengths.length);

  for (const s of order) {
    const myStrengths = new Set(s.strengths.map(norm));
    let best = -1;
    let bestCost = Infinity;
    buckets.forEach((g, i) => {
      if (g.length >= cap[i]) return;
      const needCount = g.filter((m) => m.needs.length > 0).length;
      const overlap = g.reduce((acc, m) => acc + m.strengths.filter((x) => myStrengths.has(norm(x))).length, 0);
      const groupHasSupporter = g.some((m) => m.needs.length === 0 && m.strengths.length > 0);
      let cost = 0.5 * g.length; // cân bằng sĩ số
      if (s.needs.length > 0) cost += 3 * needCount; // rải đều HS cần hỗ trợ
      cost += 2 * overlap; // tránh dồn cùng một thế mạnh
      // HS có thế mạnh ưu tiên vào nhóm đang có bạn cần hỗ trợ mà chưa có người hỗ trợ
      if (s.needs.length === 0 && s.strengths.length > 0 && needCount > 0 && !groupHasSupporter) cost -= 2.5;
      if (cost < bestCost) { bestCost = cost; best = i; }
    });
    buckets[best].push(s);
  }

  return buckets.map((members, i) => ({
    name: `Nhóm ${i + 1}`,
    task: null,
    members: members.map((s) => ({ studentId: s.id, reason: mixedReason(s, members) })),
  }));
}

function mixedReason(s: GStudent, group: GStudent[]): string {
  const parts: string[] = [];
  if (s.strengths.length) parts.push(`Đóng góp thế mạnh: ${s.strengths.slice(0, 3).join(", ")}`);
  if (s.needs.length) {
    const helper = group.find((m) => m.id !== s.id && m.needs.length === 0 && m.strengths.length > 0);
    parts.push(
      `Cần hỗ trợ: ${s.needs.slice(0, 2).join(", ")}` +
        (helper ? ` — cùng nhóm với ${helper.fullName} (${helper.strengths[0]})` : ""),
    );
  }
  if (!parts.length) return s.interests.length ? `Sở thích: ${s.interests.slice(0, 2).join(", ")} — xếp để cân bằng nhóm` : "Chưa có dữ liệu hồ sơ — xếp để cân bằng sĩ số";
  return parts.join(". ");
}

// ───────────── Theo sở thích ─────────────

function interestGroups(pool: GStudent[], k: number): GGroup[] {
  // Đếm sở thích (không phân biệt hoa thường), giữ cách viết đầu tiên gặp
  const counts = new Map<string, { label: string; n: number }>();
  for (const s of pool) for (const it of new Set(s.interests.map(norm))) {
    const label = s.interests.find((x) => norm(x) === it)!;
    counts.set(it, { label: counts.get(it)?.label ?? label, n: (counts.get(it)?.n ?? 0) + 1 });
  }
  const themes = [...counts.entries()].sort((a, b) => b[1].n - a[1].n || a[1].label.localeCompare(b[1].label, "vi")).slice(0, k);
  const cap = capacities(pool.length, k);
  const buckets: GStudent[][] = Array.from({ length: k }, () => []);
  const themeKey = (i: number) => themes[i]?.[0] ?? null;

  // Học sinh ít lựa chọn (ít sở thích trùng chủ đề) được xếp trước
  const matchCount = (s: GStudent) => s.interests.filter((x) => themes.some(([t]) => t === norm(x))).length;
  const order = [...pool].sort((a, b) => (matchCount(a) || 99) - (matchCount(b) || 99));
  const matched = new Map<string, boolean>();

  for (const s of order) {
    const mine = new Set(s.interests.map(norm));
    const open = buckets.map((g, i) => i).filter((i) => buckets[i].length < cap[i]);
    const fits = open.filter((i) => themeKey(i) && mine.has(themeKey(i)!));
    const pickFrom = fits.length ? fits : open;
    const target = pickFrom.reduce((best, i) => (buckets[i].length < buckets[best].length ? i : best), pickFrom[0]);
    buckets[target].push(s);
    matched.set(s.id, fits.length > 0);
  }

  return buckets.map((members, i) => {
    const theme = themes[i]?.[1].label ?? null;
    return {
      name: theme ? `Nhóm ${i + 1} · ${theme}` : `Nhóm ${i + 1}`,
      task: null,
      members: members.map((s) => ({
        studentId: s.id,
        reason: matched.get(s.id) && theme
          ? `Sở thích: ${theme}`
          : s.interests.length
            ? `Sở thích (${s.interests.slice(0, 2).join(", ")}) chưa trùng chủ đề nhóm — cơ hội thử sức lĩnh vực mới`
            : "Chưa có dữ liệu sở thích — xếp để cân bằng sĩ số",
      })),
    };
  });
}
