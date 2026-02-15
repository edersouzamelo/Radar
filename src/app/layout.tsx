import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import { TendersProvider } from "@/contexts/tenders-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RADAR - Monitoramento de Licitações",
  description: "Acompanhamento de pregões eletrônicos e licitações",
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <TendersProvider>
              <div className="flex h-full">
                {/* Sidebar */}
                <div className="hidden md:flex md:w-[18rem] md:flex-col md:fixed md:inset-y-0 z-50">
                  <Sidebar />
                </div>

                {/* Área principal */}
                <div className="flex flex-col flex-1 md:pl-[18rem] h-full">
                  <Header />
                  <main className="flex-1 overflow-y-auto px-8 pb-8">
                    {children}
                  </main>
                </div>
              </div>
            </TendersProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
