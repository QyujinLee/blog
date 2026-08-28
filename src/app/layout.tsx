import type { Metadata } from "next";
import { pretendard, jetbrainsMono } from "@/lib/fonts";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LoginModal } from "@/components/auth/login-modal";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "gyujin's log",
    template: "%s | gyujin's log",
  },
  description: "실무에서 마주친 문제와 해결 과정을 정리합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${pretendard.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
          <LoginModal />
        </Providers>
      </body>
    </html>
  );
}
