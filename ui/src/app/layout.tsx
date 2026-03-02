import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel 747",
  description: "Cockpit-inspired campaign intelligence dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
