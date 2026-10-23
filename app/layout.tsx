import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import InstallApp from "@/components/pwa/InstallApp";
import ChatAssistant from "@/components/tools/ChatAssistant";
import SafetyNotice from "@/components/layout/SafetyNotice";
import PublicChrome from "@/components/layout/PublicChrome";
import CookieConsent from "@/components/layout/CookieConsent";
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
    "Book confidential 1-on-1 sessions with certified psychologists — online, in your language, from ₹999 — or ₹599 for students. For students, professionals, and everyone in between.",
  // canonical/hreflang live on each page: set here, every page that forgot
  // its own would inherit "/" and tell search engines it is the homepage
  openGraph: {
    type: "website",
    siteName: "Emoraa",
    title: "Emoraa — Your emotions matter",
    description:
      "Confidential online therapy with certified Indian psychologists, in your language, from ₹999 — or ₹599 for students.",
    url: site.url,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emoraa — Your emotions matter",
    description:
      "Confidential online therapy with certified Indian psychologists, in your language, from ₹999 — or ₹599 for students.",
  },
  // installed on a home screen, it is called "Emoraa" and nothing else — the
  // icon on a shared phone should not announce what the app is for
  applicationName: "Emoraa",
  appleWebApp: {
    capable: true,
    title: "Emoraa",
    statusBarStyle: "default",
  },
  /*
   * Every icon is named here rather than left to Next's file convention.
   *
   * This block used to carry only `apple`, and declaring it at all was enough
   * to stop app/icon.svg being linked — the tab fell back to favicon.ico alone
   * and the SVG, which is the only one that stays sharp on a high-density
   * screen, was served but never referenced. Listing them all removes the
   * guesswork: the SVG leads, the .ico is there for anything that won't take
   * one, and both are the same forest tile.
   */
  icons: {
    // favicon.ico is not listed: Next emits it from app/favicon.ico on its
    // own, and naming it here as well puts the same file in the head twice.
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/app/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/app/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E3B33",
  // Without "cover", iOS reports every env(safe-area-inset-*) as 0, and the
  // bottom sheets, chat launcher and menu that pad by them sat on the home
  // indicator. The horizontal insets are handled in .wrap (globals.css).
  viewportFit: "cover",
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
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-forest-800 focus:px-5 focus:py-2.5 focus:text-[0.9rem] focus:font-semibold focus:text-ivory"
          >
            Skip to content
          </a>
          <PublicChrome>
            <Navbar />
          </PublicChrome>
          <main id="main" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
          <PublicChrome>
            <Footer />
            {/* the one floating button: Manu's chat (WhatsApp is in the footer and on /contact) */}
            <ChatAssistant />
            <SafetyNotice />
            <InstallApp />
            <CookieConsent />
          </PublicChrome>
        </Providers>
      </body>
    </html>
  );
}
