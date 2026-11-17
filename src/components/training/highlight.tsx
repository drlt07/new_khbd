/** Tô đậm các từ khóa (so khớp không dấu) trong đoạn trích. */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const src = text.normalize("NFC");
  const folded = fold(src);
  const marks = new Array(src.length).fill(false);
  for (const t of terms.filter((t) => t.length >= 2)) {
    const re = new RegExp(`(^|[^a-z0-9])(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=$|[^a-z0-9])`, "g");
    for (const m of folded.matchAll(re)) {
      const start = (m.index ?? 0) + m[1].length;
      for (let i = start; i < start + m[2].length; i++) marks[i] = true;
    }
  }
  const parts: { s: string; on: boolean }[] = [];
  for (let i = 0; i < src.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.on === marks[i]) last.s += src[i];
    else parts.push({ s: src[i], on: marks[i] });
  }
  return <>{parts.map((p, i) => (p.on ? <mark key={i} className="rounded bg-warning-soft px-0.5 text-foreground">{p.s}</mark> : <span key={i}>{p.s}</span>))}</>;
}
