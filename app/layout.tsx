import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { siteConfig } from "@/content/site";
import { getSiteContent } from "@/lib/cms/site-content";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteContent();
  return {
    title: {
      default: `${site.name || siteConfig.name} | Feeding & Care Essentials`,
      template: `%s | ${site.name || siteConfig.name}`,
    },
    description: site.description || siteConfig.description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    icons: {
      icon: [
        { url: "/images/pb-icon.png", type: "image/png", sizes: "32x32" },
        { url: site.logos.favicon || "/images/pb-icon.png", type: "image/png" },
      ],
      apple: [{ url: "/images/pb-apple-touch.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/images/pb-icon.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PK">
      <head>
        {/* Explicit links so Chromium picks the brand mark even with sticky favicon cache */}
        <link rel="icon" href="/images/pb-icon.png" type="image/png" sizes="32x32" />
        <link rel="shortcut icon" href="/images/pb-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/pb-apple-touch.png" sizes="180x180" />
      </head>
      <body className={`${jakarta.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
