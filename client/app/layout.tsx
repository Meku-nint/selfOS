import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppNavbar from "./navigation/page";
import Footer from "./components/Footer";
import PWARegister from "./components/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "SelfOS",
  title: {
    default: "SelfOS",
    template: "%s | SelfOS"
  },
  description: "SelfOS helps you track tasks, focus, and productivity like a mobile-first personal operating system.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/selfos-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icons/selfos-512.svg", type: "image/svg+xml", sizes: "512x512" }
    ],
    apple: [{ url: "/icons/selfos-192.svg", sizes: "192x192", type: "image/svg+xml" }]
  },
  appleWebApp: {
    capable: true,
    title: "SelfOS",
    statusBarStyle: "default"
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1917"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black-50/10`}
      >
        <PWARegister />
        <AppNavbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
