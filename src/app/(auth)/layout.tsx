import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15"><GraduationCap className="size-5" /></span>
          AI Personalized Lesson Planner
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">Hiểu rõ từng học sinh để thiết kế bài dạy phù hợp hơn.</h2>
          <p className="text-primary-foreground/80">
            Hệ thống không dùng AI để xếp loại học sinh. AI giúp giáo viên nhận diện sở thích, thế mạnh và nhu cầu hỗ trợ —
            giáo viên luôn là người quyết định cuối cùng.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} AI Lesson Planner</p>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </div>
  );
}
