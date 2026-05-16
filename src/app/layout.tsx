import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { AuthWrapper } from "@/components/shared/AuthWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rumah Flow | Homemaker Planner",
  description: "Life in flow. Aplikasi produktivitas dengan timer masak multi-stage.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </Providers>
        <Toaster position="top-center" richColors theme="system" />
      </body>
    </html>
  );
}