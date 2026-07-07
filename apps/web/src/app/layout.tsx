import type { Metadata } from "next";
import { Libre_Caslon_Text, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";
import TranslationProvider from "@/lib/i18n/client";
import { getServerTranslation } from "@/lib/i18n/server";

const libreCaslonText = Libre_Caslon_Text({
  weight: ["400", "700"],
  variable: "--font-serif",
  subsets: ["latin"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://curio.pk"),
  title: "Curio | Preloved Fashion Marketplace",
  description: "Curated preloved fashion and lifestyle marketplace in Pakistan.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Curio | Preloved Fashion Marketplace",
    description: "Curated preloved fashion and lifestyle marketplace in Pakistan.",
    url: "https://curio.pk",
    siteName: "Curio",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curio | Preloved Fashion",
    description: "Curated preloved fashion and lifestyle marketplace in Pakistan.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Curio",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getServerTranslation();

  return (
    <html
      lang={locale}
      className={`${hankenGrotesk.variable} ${libreCaslonText.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWARegister />
        <TranslationProvider defaultLocale={locale}>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
