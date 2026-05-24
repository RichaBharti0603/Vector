import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI ATC System",
  description: "AI-native desktop overlay system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-transparent">
        {children}
      </body>
    </html>
  );
}
