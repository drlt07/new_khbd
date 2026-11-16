import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: { default: "AI Personalized Lesson Planner", template: "%s · AI Lesson Planner" },
  description: "Hỗ trợ giáo viên xây dựng kế hoạch bài dạy cá thể hóa dựa trên hồ sơ học sinh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${font.variable} antialiased`}>{children}</body>
    </html>
  );
}
