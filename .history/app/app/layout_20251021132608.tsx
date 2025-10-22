import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "./providers/WalletProvider";
import { Providers } from "./providers/providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Africa Research Base",
  description:
    "A decentralized platform for African research data management and collaboration on Solana blockchain",
  keywords: ["Africa", "Research", "Solana", "Blockchain", "Data", "Collaboration"],
  authors: [{ name: "Africa Research Base Team" }],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-full flex flex-col bg-background text-foreground`}
      >
        <Providers>
          <SolanaWalletProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </SolanaWalletProvider>
        </Providers>
      </body>
    </html>
  );
}
