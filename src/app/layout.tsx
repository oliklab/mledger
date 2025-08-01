import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from "@/components/ui/toaster"


export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PRODUCTNAME,
  description: "The simple way to track materials, recipes, and profits - for the creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let theme = process.env.NEXT_PUBLIC_THEME
  if (!theme) {
    theme = "theme-sass3"
  }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  return (
    <html lang="en">
      <body className={theme}>
        {children}
        <Analytics />
        <CookieConsent />
        {gaID && (
          <GoogleAnalytics gaId={gaID} />
        )}
        <Toaster />
      </body>
    </html>
  );
}
