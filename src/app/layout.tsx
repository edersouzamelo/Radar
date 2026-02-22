import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import { TendersProvider } from "@/contexts/tenders-context";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RADAR - Monitoramento de Licitações",
  description: "Acompanhamento de pregões eletrônicos e licitações",
  icons: {
    icon: "/radar-logo.png",
    shortcut: "/radar-logo.png",
    apple: "/radar-logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="h-full bg-gray-50" suppressHydrationWarning>
      <body className={`${inter.className} h-full overflow-hidden bg-radar-cream`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <UserProvider>
            <TendersProvider>
              <NotificationsProvider>
                <AppShell>
                  {children}
                </AppShell>
              </NotificationsProvider>
            </TendersProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
