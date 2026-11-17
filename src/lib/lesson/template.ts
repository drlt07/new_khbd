/**
 * PHA 2 — Sinh khung KHBD (CV 5512) và nhiệm vụ riêng cho từng nhóm từ đặc trưng nhóm ở Pha 1.
 * Đây là GỢI Ý THEO MẪU (quy tắc), không dùng AI. Giáo viên chỉnh sửa toàn bộ trước khi dùng.
 * Nguyên tắc: các nhóm khác nhau về cách tiếp cận, sản phẩm và mức hỗ trợ — cùng hướng tới yêu cầu cần đạt chung.
 */
import { keywordMatches } from "@/lib/grouping/match";

export type Phase = "OPENING" | "KNOWLEDGE" | "PRACTICE" | "APPLICATION";
export const PHASE_LABEL: Record<Phase, string> = {
  OPENING: "Hoạt động 1: Mở đầu",
  KNOWLEDGE: "Hoạt động 2: Hình thành kiến thức mới",
  PRACTICE: "Hoạt động 3: Luyện tập",
  APPLICATION: "Hoạt động 4: Vận dụng",
};
export const PHASES: Phase[] = ["OPENING", "KNOWLEDGE", "PRACTICE", "APPLICATION"];

export type TemplateGroup = { id: string; name: string; profile: string | null; keywords: string[]; scoreMin: number | null; scoreMax: number | null; forSupport: boolean };
export type TemplateLesson = { subject: string; title: string; periods: number; requirements: string | null };
export type DraftTask = { groupId: string; task: string; product: string | null; support: string | null };
export type DraftActivity = {
  phase: Phase; title: string; minutes: number | null; goal: string | null; content: string | null;
  product: string | null; organization: string | null; byGroup: boolean; tasks: DraftTask[];
};

type Style = "support" | "developing" | "advanced" | "creative" | "analytic" | "communication" | "design" | "technical" | "general";

const STYLE_KEYWORDS: [Style, string[]][] = [
  ["creative", ["viết sáng tạo", "sáng tác", "tưởng tượng", "văn học", "sân khấu", "diễn xuất", "âm nhạc", "cảm thụ"]],
  ["design", ["vẽ", "thiết kế", "hội họa", "đồ họa", "mỹ thuật"]],
  ["technical", ["lập trình", "làm video", "công nghệ", "kỹ thuật", "tin học"]],
  ["analytic", ["phân tích", "đọc hiểu", "tư duy logic", "lập luận", "tranh biện", "khoa học", "giải quyết vấn đề", "quan sát"]],
  ["communication", ["thuyết trình", "giao tiếp", "tổ chức nhóm", "hoạt động xã hội", "hợp tác", "lãnh đạo"]],
];

/** Phân loại phong cách nhóm từ đặc trưng GV đã đặt */
export function groupStyle(g: TemplateGroup): Style {
  if (g.forSupport || (g.scoreMax != null && g.scoreMax <= 6.5 && g.scoreMin == null)) return "support";
  if (g.scoreMin != null && g.scoreMin >= 8) return "advanced";
  const text = [...g.keywords, g.name, g.profile ?? ""];
  let best: Style = "general", bestHits = 0;
  for (const [style, kws] of STYLE_KEYWORDS) {
    const hits = kws.filter((k) => text.some((t) => keywordMatches(k, t) || t.toLowerCase().includes(k))).length;
    if (hits > bestHits) { best = style; bestHits = hits; }
  }
  // Nhóm chỉ đặt khoảng điểm ở mức giữa (không có từ khóa thế mạnh) -> luyện có định hướng
  if (best === "general" && (g.scoreMin != null || g.scoreMax != null)) return "developing";
  return best;
}

export const STYLE_LABEL: Record<Style, string> = {
  support: "Cần hỗ trợ từng bước", developing: "Luyện tập có định hướng", advanced: "Nhiệm vụ mở rộng", creative: "Cảm thụ – sáng tạo", analytic: "Phân tích – lập luận",
  communication: "Trình bày – truyền thông", design: "Trực quan – thiết kế", technical: "Kỹ thuật – công nghệ", general: "Theo đặc trưng nhóm",
};

type Frame = { task: string; product: string; support: string };
// {B} = tên bài, {Y} = yêu cầu cần đạt trọng tâm
const FRAMES: Record<Exclude<Phase, "OPENING">, Record<Style, Frame>> = {
  KNOWLEDGE: {
    creative: { task: "Đọc/tìm hiểu nội dung chính của “{B}”, chọn 2–3 chi tiết, hình ảnh tiêu biểu; ghi lại cảm nhận, liên tưởng của nhóm và lý giải vì sao các chi tiết đó giúp đạt yêu cầu: {Y}.", product: "Phiếu cảm nhận nhóm (chi tiết – cảm nhận – lý giải)", support: "Phiếu gợi mở cảm xúc; GV gợi ý khi nhóm chưa chọn được chi tiết" },
    analytic: { task: "Phân tích nội dung trọng tâm của “{B}” bằng bảng/sơ đồ: nêu luận điểm hoặc đặc điểm chính, dẫn chứng và nhận xét, bám sát yêu cầu: {Y}.", product: "Bảng phân tích / sơ đồ tư duy có dẫn chứng", support: "Khung bảng phân tích có sẵn tiêu chí" },
    communication: { task: "Tìm hiểu nội dung chính của “{B}” và chuẩn bị phần trình bày 3 phút giới thiệu kiến thức trọng tâm cho cả lớp, có ít nhất một câu hỏi tương tác.", product: "Dàn ý thuyết trình + câu hỏi tương tác", support: "Tiêu chí trình bày (rõ ý, đúng thời gian, có tương tác)" },
    design: { task: "Trực quan hóa kiến thức trọng tâm của “{B}” bằng sơ đồ, infographic hoặc tranh minh họa có chú thích, thể hiện đúng yêu cầu: {Y}.", product: "Sơ đồ / infographic có chú thích", support: "Mẫu bố cục infographic tham khảo" },
    technical: { task: "Tra cứu, tổng hợp thông tin về “{B}” từ SGK và nguồn tin cậy; tổ chức thông tin thành bảng hoặc mô hình, ghi rõ nguồn.", product: "Bảng tổng hợp thông tin / mô hình có ghi nguồn", support: "Danh sách nguồn tham khảo GV cung cấp" },
    developing: { task: "Tìm hiểu nội dung trọng tâm của “{B}” qua phiếu câu hỏi phân bậc (hiểu → vận dụng), mỗi câu trả lời có dẫn chứng, hướng tới yêu cầu: {Y}.", product: "Phiếu câu hỏi phân bậc có dẫn chứng", support: "Câu hỏi gợi mở ở các câu vận dụng; GV gợi ý khi nhóm cần" },
    support: { task: "Hoàn thành phiếu học tập có câu hỏi gợi ý từng bước về nội dung cơ bản của “{B}” (nhận biết → hiểu), đối chiếu với ví dụ mẫu.", product: "Phiếu học tập đã hoàn thành", support: "Phiếu từng bước, ví dụ mẫu, từ khóa gợi ý; GV/bạn hỗ trợ trực tiếp; thêm thời gian" },
    advanced: { task: "Tự nghiên cứu “{B}”, so sánh với một nội dung/văn bản đã học và đặt 2 câu hỏi phản biện cho cả lớp, hướng tới yêu cầu: {Y}.", product: "Bảng so sánh + 2 câu hỏi phản biện", support: "Ít gợi ý; tự đánh giá theo tiêu chí" },
    general: { task: "Tìm hiểu nội dung trọng tâm của “{B}” theo phiếu học tập của nhóm, hướng tới yêu cầu: {Y}.", product: "Phiếu học tập nhóm", support: "GV quan sát, gợi ý khi cần" },
  },
  PRACTICE: {
    creative: { task: "Viết đoạn văn (6–8 câu) cảm nhận về một chi tiết/khía cạnh nổi bật của “{B}”, có sử dụng kiến thức vừa học.", product: "Đoạn văn cảm nhận", support: "Rubric đoạn văn; câu mở đầu gợi ý nếu cần" },
    analytic: { task: "Giải quyết bài tập/câu hỏi vận dụng về “{B}”: trình bày lập luận có dẫn chứng, so sánh hai cách hiểu và nêu ý kiến của nhóm.", product: "Bài làm có lập luận, dẫn chứng", support: "Câu hỏi phân bậc; khung lập luận (luận điểm – dẫn chứng – nhận xét)" },
    communication: { task: "Tổ chức một vòng hỏi – đáp/tranh luận ngắn về “{B}” với nhóm khác; ghi biên bản ý kiến hai bên.", product: "Biên bản tranh luận / câu trả lời của nhóm", support: "Quy tắc tranh luận; phiếu ghi biên bản" },
    design: { task: "Thiết kế sơ đồ hệ thống hóa kiến thức “{B}” hoặc minh họa một nội dung bằng hình ảnh, kèm 3–5 câu giải thích.", product: "Sơ đồ hệ thống / tranh minh họa có giải thích", support: "Mẫu sơ đồ; tiêu chí đánh giá sản phẩm trực quan" },
    technical: { task: "Thực hành áp dụng kiến thức “{B}” vào bài tập/tình huống cụ thể; kiểm tra lại kết quả và nêu cách làm.", product: "Bài thực hành + mô tả cách làm", support: "Bài mẫu đã giải; danh sách lỗi thường gặp" },
    developing: { task: "Làm bài luyện tập về “{B}” từ mức hiểu đến vận dụng; tự kiểm tra bằng đáp án/tiêu chí rồi sửa lỗi sai.", product: "Bài luyện tập đã tự chữa", support: "Rubric, đáp án gợi ý để tự kiểm tra" },
    support: { task: "Làm bài tập cơ bản về “{B}” theo mẫu đã giải, sau đó tự làm 1–2 bài tương tự.", product: "Bài tập cơ bản đã hoàn thành", support: "Bài mẫu, khung trả lời, gợi ý từng bước; bạn cùng nhóm/GV kèm" },
    advanced: { task: "Giải bài tập mở/nâng cao về “{B}”, đề xuất cách giải khác và nhận xét ưu – nhược điểm.", product: "Bài giải + phương án khác + nhận xét", support: "Tự đánh giá, đánh giá đồng đẳng theo rubric" },
    general: { task: "Làm bài luyện tập về “{B}” theo phiếu của nhóm.", product: "Bài luyện tập", support: "Gợi ý khi cần" },
  },
  APPLICATION: {
    creative: { task: "Sáng tạo sản phẩm (viết, nhập vai, kết thúc khác, thơ…) lấy cảm hứng từ “{B}”, kèm lời tự giới thiệu ý tưởng.", product: "Sản phẩm sáng tạo + lời giới thiệu", support: "Tiêu chí sản phẩm sáng tạo" },
    analytic: { task: "Viết đoạn/bài ngắn nêu ý kiến về một vấn đề thực tiễn gợi ra từ “{B}”, có lập luận và dẫn chứng.", product: "Đoạn/bài nghị luận ngắn", support: "Khung dàn ý nghị luận" },
    communication: { task: "Thiết kế và trình bày một thông điệp (thuyết trình, video ngắn, bản tin) liên hệ “{B}” với đời sống.", product: "Bài thuyết trình / video / bản tin", support: "Tiêu chí trình bày và thời lượng" },
    design: { task: "Thiết kế poster/infographic truyền tải thông điệp từ “{B}” tới bạn bè, cộng đồng.", product: "Poster / infographic", support: "Tiêu chí thẩm mỹ – nội dung" },
    technical: { task: "Ứng dụng công nghệ (video, trang trình chiếu, sản phẩm số…) để giới thiệu hoặc giải quyết một vấn đề liên quan “{B}”.", product: "Sản phẩm số", support: "Hướng dẫn công cụ; tiêu chí sản phẩm" },
    developing: { task: "Vận dụng kiến thức “{B}” để giải quyết một tình huống gần gũi trong học tập/đời sống, trình bày cách làm theo tiêu chí.", product: "Bài vận dụng theo tiêu chí", support: "Tiêu chí hướng dẫn; ví dụ tình huống tham khảo" },
    support: { task: "Liên hệ “{B}” với một trải nghiệm của bản thân: trả lời 3 câu hỏi gợi ý rồi viết 3–5 câu chia sẻ.", product: "Đoạn chia sẻ 3–5 câu", support: "Câu hỏi gợi ý, khung câu; thêm thời gian, GV phản hồi trực tiếp" },
    advanced: { task: "Thực hiện dự án nhỏ mở rộng từ “{B}” (nghiên cứu, sáng tạo hoặc phản biện), chia sẻ kết quả với lớp.", product: "Sản phẩm dự án + chia sẻ", support: "Tự lập kế hoạch; GV tư vấn" },
    general: { task: "Vận dụng kiến thức “{B}” để giải quyết một tình huống thực tiễn theo đặc trưng nhóm.", product: "Sản phẩm vận dụng", support: "Gợi ý khi cần" },
  },
};

const ORG = (who: string) =>
  `Bước 1 – Chuyển giao nhiệm vụ: GV giao nhiệm vụ ${who}, nêu rõ sản phẩm và thời gian.\n` +
  "Bước 2 – Thực hiện nhiệm vụ: HS thực hiện; GV quan sát, hỗ trợ theo mức phù hợp với từng nhóm.\n" +
  "Bước 3 – Báo cáo, thảo luận: đại diện HS/nhóm trình bày; các nhóm khác nhận xét, bổ sung.\n" +
  "Bước 4 – Kết luận, nhận định: GV đánh giá, chốt kiến thức trọng tâm.";

const firstRequirement = (r: string | null) => r?.split(/\n+/).map((x) => x.replace(/^[-•\d.)\s]+/, "").trim()).find(Boolean) ?? "yêu cầu cần đạt của bài";

export function suggestTask(phase: Exclude<Phase, "OPENING">, lesson: TemplateLesson, g: TemplateGroup): DraftTask {
  const style = groupStyle(g);
  const f = FRAMES[phase][style];
  const fill = (s: string) => s.replaceAll("{B}", lesson.title).replaceAll("{Y}", firstRequirement(lesson.requirements));
  let task = fill(f.task);
  if (style === "general" && g.profile) task += ` (Phù hợp đặc trưng nhóm: ${g.profile})`;
  return { groupId: g.id, task, product: fill(f.product), support: fill(f.support) };
}

export function buildLessonDraft(lesson: TemplateLesson, groups: TemplateGroup[]): DraftActivity[] {
  const total = lesson.periods * 45;
  const minutes = [0.1, 0.4, 0.3, 0.2].map((p) => Math.max(5, Math.round((total * p) / 5) * 5));
  minutes[1] += total - minutes.reduce((a, b) => a + b, 0);
  const B = lesson.title, Y = firstRequirement(lesson.requirements);
  return [
    {
      phase: "OPENING", title: PHASE_LABEL.OPENING, minutes: minutes[0], byGroup: false, tasks: [],
      goal: `Tạo tâm thế, khơi gợi hứng thú và kết nối hiểu biết của HS với bài “${B}”.`,
      content: `GV nêu câu hỏi/tình huống khởi động gắn với bài “${B}”; HS chia sẻ hiểu biết, trải nghiệm.`,
      product: "Câu trả lời, chia sẻ của HS.",
      organization: ORG("cho cả lớp"),
    },
    {
      phase: "KNOWLEDGE", title: PHASE_LABEL.KNOWLEDGE, minutes: minutes[1], byGroup: true,
      goal: `HS hình thành kiến thức trọng tâm, hướng tới: ${Y}.`,
      content: "Mỗi nhóm tìm hiểu kiến thức trọng tâm theo cách tiếp cận phù hợp đặc trưng nhóm (xem nhiệm vụ từng nhóm).",
      product: "Sản phẩm của từng nhóm (xem bảng nhiệm vụ).",
      organization: ORG("riêng cho từng nhóm theo đặc trưng"),
      tasks: groups.map((g) => suggestTask("KNOWLEDGE", lesson, g)),
    },
    {
      phase: "PRACTICE", title: PHASE_LABEL.PRACTICE, minutes: minutes[2], byGroup: true,
      goal: "HS củng cố, luyện tập kiến thức vừa học ở mức độ phù hợp.",
      content: "Bài luyện tập phân hóa theo nhóm — cùng yêu cầu cần đạt, khác mức hỗ trợ và độ mở.",
      product: "Bài làm của từng nhóm.",
      organization: ORG("phân hóa theo nhóm"),
      tasks: groups.map((g) => suggestTask("PRACTICE", lesson, g)),
    },
    {
      phase: "APPLICATION", title: PHASE_LABEL.APPLICATION, minutes: minutes[3], byGroup: true,
      goal: `HS vận dụng kiến thức bài “${B}” vào tình huống thực tiễn, phát huy thế mạnh của nhóm.`,
      content: "Mỗi nhóm tạo một sản phẩm vận dụng theo thế mạnh (có thể hoàn thiện ở nhà).",
      product: "Sản phẩm vận dụng của từng nhóm.",
      organization: ORG("theo nhóm, có thể tiếp tục ở nhà"),
      tasks: groups.map((g) => suggestTask("APPLICATION", lesson, g)),
    },
  ];
}
