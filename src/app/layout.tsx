import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veridian — Discover Every Business Worth Knowing",
  description:
    "The operating system for discovering businesses, products, services, inventory and pricing. Map-first, search-intelligent, verified trust.",
  keywords: ["business directory", "discover businesses", "manufacturers", "hospitals", "products", "services", "verified business"],
  authors: [{ name: "Veridian" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Veridian — Business Discovery Platform",
    description: "Discover verified businesses, products and services across every industry.",
    siteName: "Veridian",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
