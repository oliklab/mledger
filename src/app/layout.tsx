import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from "@/components/ui/toaster"


export const metadata: Metadata = {
  title: "Maker's Ledger | Inventory & Bookkeeping for crafters",
  description: "Stop guessing profits. Maker's Ledger is the simple inventory and cost-tracking app for Etsy sellers and crafters. Track raw materials, calculate your true COGS with our recipe system, and price your handmade products with confidence. Try it free.",
  metadataBase: new URL('https://makersledger.com/'),
  alternates: {
    canonical: 'https://makersledger.com/',
  },
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
  const gaID = 'G-LG6PY822G8';
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Maker's Ledger",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Maker's Ledger is a simple inventory and cost-tracking app for Etsy sellers and handmade creators. Track raw materials, calculate your true COGS with our recipe system, and price your products with confidence.",
    "url": "https://makersledger.com/",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "5.00",
      "highPrice": "15.00",
      "priceCurrency": "USD",
      "offers": [
        {
          "@type": "Offer",
          "name": "Hobbyist Plan",
          "price": "5.00",
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "5.00",
            "priceCurrency": "USD",
            "valueAddedTaxIncluded": true,
            "billingIncrement": "P1M"
          }
        },
        {
          "@type": "Offer",
          "name": "Crafter Plan",
          "price": "9.00",
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "9.00",
            "priceCurrency": "USD",
            "valueAddedTaxIncluded": true,
            "billingIncrement": "P1M"
          }
        }
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": "Olik Software Lab",
      "url": "https://makersledger.com/"
    }
  };

  return (
    <html lang="en">
      <body className={theme}>
        <section>
          {/* Add JSON-LD to your page */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
            }}
          />
        </section>
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
