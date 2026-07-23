import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { CookieBanner } from "@/components/cookie-banner"
import { JsonLd } from "@/components/json-ld"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tutasuites.com'),
  title: {
    default: "Tuta Suites | Premium Hotel & Luxury Accommodation in Mowe-Ibafo",
    template: "%s | Tuta Suites"
  },
  description: "Experience luxury and comfort at Tuta Suites. Premium hotel in Assurance CDA Estate, Orimerunmu, Mowe-Ibafo featuring 24/7 security, high-speed WiFi, fine dining, and excellent hospitality.",
  keywords: ["Tuta Suites", "Hotel in Mowe", "Hotel in Ibafo", "Luxury Hotel Ogun State", "Accommodation in Orimerunmu", "Tuta Suite", "Premium Suites"],
  authors: [{ name: "Tuta Suites" }],
  creator: "Tuta Suites",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://tutasuites.com",
    title: "Tuta Suites | Premium Hotel & Luxury Accommodation",
    description: "Experience luxury and comfort at Tuta Suites in Mowe-Ibafo. Book your perfect stay today.",
    siteName: "Tuta Suites",
    images: [
      {
        url: "/dsc_0996.jpg",
        width: 1200,
        height: 630,
        alt: "Tuta Suites Luxury Interior",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuta Suites | Premium Hotel in Mowe-Ibafo",
    description: "Experience luxury and comfort at Tuta Suites. Book your perfect stay today.",
    images: ["/dsc_0996.jpg"],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    google: "YoulJZu4QneAFsYndo8nyfj7NYM520MqufCJnAGaeEA",
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
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <JsonLd />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <CookieBanner />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
