import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getLesson } from "@/server/services/lesson.service";
import { PrintButton } from "@/components/phase2/print-button";

export const metadata: Metadata = { title: "In KHBD" };

const Lines = ({ v }: { v: string | null }) => v ? <>{v.split(/\n+/).map((x, i) => <p key={i} className="mb-1">{x}</p>)}</> : <p className="italic text-slate-400">(chưa nhập)</p>;

export default async function PrintLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const l = await getLesson(user.userId, id).catch(() => null);
  if (!l) notFound();
  const groups = l.session.groups;
  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 font-serif text-[15px] leading-relaxed text-black print:p-0">
      <div className="mb-6 flex justify-end print:hidden"><PrintButton auto /></div>
      <h1 className="text-center text-xl font-bold">KẾ HOẠCH BÀI DẠY</h1>
      <h2 className="mb-2 text-center text-lg font-bold uppercase">{l.title}</h2>
      <p className="text-center">Môn: {l.subject} · Lớp: {l.session.class.name} · Thời lượng: {l.periods} tiết</p>
      <p className="mb-4 text-center text-sm italic">Hồ sơ nhóm: {l.session.title} (phiên bản {l.session.version}, {groups.length} nhóm)</p>
      <h3 className="mt-4 font-bold">I. MỤC TIÊU</h3>
      <p className="font-semibold">Yêu cầu cần đạt:</p><Lines v={l.requirements} />
      <p className="font-semibold">1. Kiến thức:</p><Lines v={l.knowledgeGoals} />
      <p className="font-semibold">2. Năng lực:</p><Lines v={l.competencyGoals} />
      <p className="font-semibold">3. Phẩm chất:</p><Lines v={l.qualityGoals} />
      <h3 className="mt-4 font-bold">II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h3><Lines v={l.materials} />
      <h3 className="mt-4 font-bold">III. TIẾN TRÌNH DẠY HỌC</h3>
      {l.activities.map((a) => (
        <section key={a.id} className="mt-3 break-inside-avoid-page">
          <h4 className="font-bold">{a.title}{a.minutes ? ` (${a.minutes} phút)` : ""}</h4>
          <p className="font-semibold">a) Mục tiêu:</p><Lines v={a.goal} />
          <p className="font-semibold">b) Nội dung:</p><Lines v={a.content} />
          <p className="font-semibold">c) Sản phẩm:</p><Lines v={a.product} />
          <p className="font-semibold">d) Tổ chức thực hiện:</p><Lines v={a.organization} />
          {a.byGroup && a.tasks.length > 0 && (
            <table className="mt-2 w-full border-collapse text-[13px]">
              <thead><tr>{["Nhóm", "Nhiệm vụ", "Mức thử thách", "Học liệu", "Sản phẩm", "Hỗ trợ / Đánh giá"].map((h) => <th key={h} className="border border-black p-1 text-left">{h}</th>)}</tr></thead>
              <tbody>{groups.map((g) => { const t = a.tasks.find((x) => x.groupId === g.id); return t && (
                <tr key={g.id} className="align-top"><td className="border border-black p-1 font-semibold">{g.name}</td><td className="border border-black p-1">{t.task}</td><td className="border border-black p-1">{t.challenge}</td><td className="whitespace-pre-line border border-black p-1">{t.materials}</td><td className="border border-black p-1">{t.product}</td><td className="border border-black p-1">{t.support}{t.assessment ? <><br /><i>Đánh giá:</i> {t.assessment}</> : null}</td></tr>
              ); })}</tbody>
            </table>
          )}
        </section>
      ))}
      <h3 className="mt-4 font-bold">IV. ĐÁNH GIÁ</h3><Lines v={l.assessment} />
      <h3 className="mt-4 font-bold">PHỤ LỤC: HỒ SƠ NHÓM HỌC TẬP</h3>
      <table className="mt-2 w-full border-collapse text-[13px]">
        <thead><tr>{["Nhóm", "Đặc trưng năng lực", "Nhu cầu & mục tiêu hỗ trợ", "Thành viên"].map((h) => <th key={h} className="border border-black p-1 text-left">{h}</th>)}</tr></thead>
        <tbody>{groups.map((g) => <tr key={g.id} className="align-top"><td className="border border-black p-1 font-semibold">{g.name}</td><td className="border border-black p-1">{g.competency}</td><td className="border border-black p-1">{g.needs}{g.supportGoal ? <><br /><i>Mục tiêu:</i> {g.supportGoal}</> : null}</td><td className="border border-black p-1">{g.members.map((m) => m.student.fullName).join(", ")}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
