"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Highlight } from "./highlight";

type Hit = {
  id: string; documentId: string; documentTitle: string; volume: string | null; pdfPage: number; bookPage: number | null;
  lessonLabel: string | null; lessonTitle: string | null; heading: string | null; snippet: string; score: number;
};

/** Thử truy xuất: xem AI sẽ lấy được đoạn tài liệu nào cho một chủ đề / câu hỏi. */
export function KnowledgeSearch({ collectionId, lessons }: { collectionId: string; lessons: { value: string; label: string }[] }) {
  const [q, setQ] = useState("");
  const [lesson, setLesson] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ terms: string[]; hits: Hit[] } | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setPending(true);
    setError(null);
    try {
      const sp = new URLSearchParams({ q, limit: "10", ...(lesson ? { lesson } : {}) });
      const res = await fetch(`/api/training/collections/${collectionId}/search?${sp}`);
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Lỗi tìm kiếm");
      else setResult(json.data);
    } catch {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" aria-label="Nội dung cần tra cứu"
            placeholder="Ví dụ: yếu tố kì ảo trong truyện ngắn, tổ chức tranh biện, Tây Tiến…" />
        </div>
        <div className="sm:w-56">
          <Select aria-label="Giới hạn theo bài" value={lesson} onChange={(e) => setLesson(e.target.value)}>
            <option value="">Mọi bài học</option>
            {lessons.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </Select>
        </div>
        <Button type="submit" disabled={pending || q.trim().length < 2}>{pending ? <Loader2 className="animate-spin" /> : <Search />} Tra cứu</Button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}
      {result && (
        result.hits.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Không tìm thấy đoạn tài liệu phù hợp.</p>
        ) : (
          <ol className="space-y-3">
            {result.hits.map((h, i) => (
              <li key={h.id} className="rounded-lg border p-3">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-muted-foreground">#{i + 1}</span>
                  {h.lessonLabel && <Badge tone="primary">{h.lessonLabel}</Badge>}
                  {h.heading && <Badge>{h.heading}</Badge>}
                  <Link href={`/training/documents/${h.documentId}`} className="text-muted-foreground hover:underline">
                    {h.documentTitle}{h.volume ? ` · ${h.volume}` : ""} · tr. {h.bookPage ?? h.pdfPage}
                  </Link>
                </div>
                <p className="text-sm leading-relaxed"><Highlight text={h.snippet} terms={result.terms} /></p>
              </li>
            ))}
          </ol>
        )
      )}
    </div>
  );
}
