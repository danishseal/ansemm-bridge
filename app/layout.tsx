import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const aeonikSans = localFont({
  src: "../public/Aeonik-Medium.woff2",
  variable: "--font-aeonik-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANSEM - Bridge",
  description: "Welcome to ANSEM Bridge",
  icons: {
    icon: { url: "/logo.png?v=2", sizes: "3000x3000", type: "image/png" },
    shortcut: { url: "/logo.png?v=2", sizes: "3000x3000", type: "image/png" },
    apple: { url: "/logo.png?v=2", sizes: "3000x3000", type: "image/png" },
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
      className={`${aeonikSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
