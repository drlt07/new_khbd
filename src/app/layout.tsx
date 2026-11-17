import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const font = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"], variable: "--font-be-vietnam" });

export const metadata: Metadata = {
  title: { default: "Chia nhóm học sinh", template: "%s · Chia nhóm học sinh" },
  description: "Chia nhóm học sinh theo sở thích, thế mạnh và nhu cầu hỗ trợ.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${font.variable} antialiased`}>{children}</body>
    </html>
  );
}
