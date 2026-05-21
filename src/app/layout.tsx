import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { AuthWrapper } from "@/components/shared/AuthWrapper";
import { PwaSetup } from "@/components/shared/PwaSetup";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFAFB" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export const metadata: Metadata = {
  title: "Rumah Flow | Homemaker Planner",
  description: "Life in flow. Aplikasi produktivitas dengan timer masak multi-stage.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rumah Flow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-w-0 overflow-x-hidden`}>
        <Providers>
          <AuthWrapper>
            {children}
          </AuthWrapper>
          <PwaSetup />
        </Providers>
        <Toaster position="top-center" richColors theme="system" />
      </body>
    </html>
  );
}