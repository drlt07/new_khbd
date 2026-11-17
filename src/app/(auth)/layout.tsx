import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15"><GraduationCap className="size-5" /></span>
          Chia nhóm học sinh
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">Chia nhóm học sinh theo sở thích và thế mạnh.</h2>
          <p className="text-primary-foreground/80">
            Không xếp loại theo học lực. Hệ thống gợi ý cách chia nhóm, giáo viên kéo thả để chỉnh và là người quyết định cuối cùng.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} Chia nhóm học sinh</p>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </div>
  );
}
