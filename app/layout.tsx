import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeCare HMS - Hospital Management System",
  description: "Phần mềm demo quản lý bệnh viện dành cho bệnh nhân và bác sĩ.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
