import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dutch Roofing Experts | Costa Blanca South - Dakdekker",
  description: "Dutch quality roofing experts serving Costa Blanca South. 25+ years experience, 15 year guarantee. Specializing in tiled roofs, flat roofs, bitumen. Free inspection.",
  keywords: "dakdekker, roofing, Costa Blanca, Dutch roofing, roof repair, roof renovation, tiled roof, flat roof, bitumen, Netherlands contractors, Spain",
  authors: [{ name: "Dutch Roofing Experts" }],
  creator: "Dutch Roofing Experts",
  publisher: "Dutch Roofing Experts",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["nl_NL", "es_ES"],
    url: "https://dutchroofingexperts.com",
    siteName: "Dutch Roofing Experts",
    title: "Dutch Roofing Experts | Costa Blanca South",
    description: "Dutch quality roofing experts serving Costa Blanca South. 25+ years experience, 15 year guarantee.",
    images: [
      {
        url: "/uploads/hero-roof.jpg",
        width: 1200,
        height: 630,
        alt: "Dutch Roofing Experts - Professional roofing Costa Blanca",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dutch Roofing Experts | Costa Blanca South",
    description: "Dutch quality roofing experts. 25+ years experience, 15 year guarantee.",
    images: ["/uploads/hero-roof.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="Content-Security-Policy" content="img-src 'self' data: blob: https: http:;" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RoofingContractor",
              "name": "Dutch Roofing Experts",
              "image": "/uploads/hero-roof.jpg",
              "@id": "https://dutchroofingexperts.com",
              "url": "https://dutchroofingexperts.com",
              "telephone": "+31 6 45577172",
              "email": "dutchroofingexperts@yahoo.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Costa Blanca South",
                "addressCountry": "ES"
              },
              "areaServed": {
                "@type": "State",
                "name": ["Costa Blanca South", "Alicante", "Valencia"]
              },
              "priceRange": "€€",
              "openingHours": "Mo-Su 00:00-24:00",
              "description": "Dutch quality roofing experts serving Costa Blanca South. Over 25 years of experience in roof repair, renovation and maintenance.",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "50"
              }
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
