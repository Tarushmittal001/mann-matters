import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import ChatAssistant from "@/components/tools/ChatAssistant";
import SafetyNotice from "@/components/layout/SafetyNotice";
import PublicChrome from "@/components/layout/PublicChrome";
import { site } from "@/lib/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const tiro = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-deva",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Emoraa — Therapy & counselling for India, online",
    template: "%s · Emoraa",
  },
  description:
    "Book confidential 1-on-1 sessions with licensed psychologists — online, in 2+ languages, from ₹599. For students, young professionals, and everyone in between.",
  openGraph: {
    type: "website",
    siteName: "Emoraa",
    title: "Emoraa — Your mind matters",
    description:
      "Confidential online therapy with licensed Indian psychologists, in your language, from ₹599.",
    url: site.url,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emoraa — Your mind matters",
    description:
      "Confidential online therapy with licensed Indian psychologists, in your language, from ₹599.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E3B33",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable} ${tiro.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <PublicChrome>
            <Footer />
            <WhatsAppButton />
            <ChatAssistant />
            <SafetyNotice />
          </PublicChrome>
        </Providers>
      </body>
    </html>
  );
}
