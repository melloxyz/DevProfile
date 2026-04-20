import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { QueryProvider } from "@/components/ui/query-provider";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { getSiteOrigin } from "@/lib/seo";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_ORIGIN = getSiteOrigin();
const DEFAULT_TITLE = "melloxyz";
const DEFAULT_DESCRIPTION =
  "Perfil publico, portfolio e links de desenvolvedor em uma unica pagina.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: `${DEFAULT_TITLE} | Dev Profile`,
    template: "%s | Dev Profile",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: "Dev Profile",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Dev Profile",
    title: `${DEFAULT_TITLE} | Dev Profile`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Dev Profile de melloxyz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${DEFAULT_TITLE} | Dev Profile`,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
          themes={["dark", "light"]}
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
