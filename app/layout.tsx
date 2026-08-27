import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import ChatAssistant from "@/components/tools/ChatAssistant";
import SafetyNotice from "@/components/layout/SafetyNotice";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "mann Matters — Therapy & counselling for India, online",
    template: "%s · mann Matters",
  },
  description:
    "Book confidential 1-on-1 sessions with licensed psychologists — online, in 2+ languages, from ₹599. For students, young professionals, and everyone in between.",
  openGraph: {
    type: "website",
    siteName: "mann Matters",
    title: "mann Matters — Your mind matters",
    description:
      "Confidential online therapy with licensed Indian psychologists, in your language, from ₹599.",
    url: site.url,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "mann Matters — Your mind matters",
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
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <WhatsAppButton />
          <ChatAssistant />
          <SafetyNotice />
        </Providers>
      </body>
    </html>
  );
}
