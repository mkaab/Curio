import type { Metadata } from "next";
import { Libre_Caslon_Text, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

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
  title: "Curio | Preloved Fashion Marketplace",
  description: "Curated preloved fashion and lifestyle marketplace in Pakistan.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Curio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${libreCaslonText.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
