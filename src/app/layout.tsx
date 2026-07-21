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
  title: "Veridian — B2B Supplier Discovery Platform",
  description:
    "The B2B marketplace for discovering verified manufacturers, distributors, raw material suppliers and industrial service providers. Free ERP included.",
  keywords: ["B2B marketplace", "b2b suppliers", "manufacturers", "wholesale", "industrial machinery", "raw materials", "verified suppliers", "b2b directory"],
  authors: [{ name: "Veridian" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Veridian — B2B Supplier Discovery Platform",
    description: "Find verified B2B suppliers, manufacturers and distributors with live inventory and pricing.",
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
