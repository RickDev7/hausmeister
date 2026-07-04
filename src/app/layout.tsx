import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/hooks/use-app";
import { I18nProvider } from "@/hooks/use-i18n";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationScheduler } from "@/components/notification-scheduler";
import { PwaRegister } from "@/components/pwa-register";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Onboarding } from "@/components/onboarding/onboarding";
import { OfflineBanner } from "@/components/offline-banner";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Planejador de Lixo",
  description: "Datas de coleta de lixo a partir de arquivos .ics – local e privado",
  other: { google: "notranslate" },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Planejador de Lixo",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#006a60" },
    { media: "(prefers-color-scheme: dark)", color: "#141218" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      translate="no"
      className={`${roboto.variable} notranslate h-full`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-surface text-foreground antialiased"
        suppressHydrationWarning
      >
        <AppProvider>
          <I18nProvider>
            <ThemeProvider>
              <PwaRegister />
              <OfflineBanner />
              <NotificationScheduler />
              <Onboarding />
              <main className="mx-auto min-h-full max-w-lg px-4 pb-24 pt-0">
                {children}
              </main>
              <BottomNav />
            </ThemeProvider>
          </I18nProvider>
        </AppProvider>
      </body>
    </html>
  );
}
