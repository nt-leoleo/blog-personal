import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";
import SiteHeader from "@/components/site-header";
import "./globals.css";

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Newsreader({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog personal",
  description: "Blog minimalista con publicaciones multimedia y comentarios autenticados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}

