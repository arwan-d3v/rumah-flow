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
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFAFB" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export const metadata: Metadata = {
  title: "Rumah Flow | Homemaker Planner",
  description: "Life in flow. Aplikasi produktivitas dengan timer masak multi-stage.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
    other: [
      { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
      { rel: "mask-icon", url: "/icons/icon-192x192.png", color: "#8ba888" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rumah Flow",
  },
  formatDetection: {
    telephone: false,
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