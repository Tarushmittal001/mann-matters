import type { Locale } from "@/lib/i18n";

/**
 * The words in the site's chrome — the parts every page shares: navbar labels
 * and menus, footer, cookie question, safety note, chat assistant and the
 * crisis line. Same rules as copy.ts: the Hindi is written, not translated;
 * the loanwords people say (सेशन, थेरेपी, WhatsApp, चैट) stay as they are said;
 * numbers stay in Western digits.
 *
 * Pages that exist only in English (most tools, legal pages) are still linked
 * from a Hindi page — their label is Hindi so the menu reads as one language,
 * and the page itself says it is in English.
 */

export type ChromeCopy = {
  account: { signIn: string; admin: string; expert: string; mySessions: string };
  home: string;
  book: string;
  footer: {
    blurb: string;
    explore: string;
    reachUs: string;
    whatsapp: string;
    legal: string;
    privacy: string;
    terms: string;
    refund: string;
    cookies: string;
    cookieSettings: string;
    inCrisis: string;
    callTeleManas: string;
    crisisRest: string;
    madeWithCare: string;
  };
  cookies: { title: string; body: string; policy: string; essential: string; allow: string };
  safety: {
    pill: string;
    pillLabel: string;
    region: string;
    short: string;
    call: string;
    more: string;
    dismissLabel: string;
    gentle: string;
    bodyBefore: string;
    bodyStrong: string;
    bodyAfter: string;
    reachOut: string;
    teleManasNote: string;
    emergency: string;
    gotIt: string;
    minimize: string;
    safetyFirst: string;
  };
  chat: {
    greeting: string;
    quick: string[];
    title: string;
    subtitle: string;
    conversation: string;
    typing: string;
    inputLabel: string;
    placeholder: string;
    send: string;
    open: string;
    close: string;
    failure: string;
    whatsapp: string;
  };
  crisisLine: { lead: string; call: string; more: string };
  mobileCrisis: string;
};

const en: ChromeCopy = {
  account: { signIn: "Sign in", admin: "Admin", expert: "Expert portal", mySessions: "My sessions" },
  home: "Home",
  book: "Book a session",
  footer: {
    blurb:
      "Therapy and counselling for Indian youth, students, and working professionals — confidential, affordable, and in your language.",
    explore: "Explore",
    reachUs: "Reach us",
    whatsapp: "WhatsApp us",
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of use",
    refund: "Refund & cancellation",
    cookies: "Cookie policy",
    cookieSettings: "Cookie settings",
    inCrisis: "In crisis?",
    callTeleManas: "Call Tele-MANAS",
    crisisRest: "— free, confidential, 24x7, in 20+ Indian languages. Emoraa is not a crisis service.",
    madeWithCare: "© 2026 Emoraa. Made with care in India.",
  },
  cookies: {
    title: "A quick question about cookies",
    body:
      "We use essential cookies to keep you signed in. With your OK, we'd also count anonymous page views to see what helps. Never on your dashboard, bookings or crisis pages.",
    policy: "Cookie policy",
    essential: "Essential only",
    allow: "Allow analytics",
  },
  safety: {
    pill: "Safety Info",
    pillLabel: "Show safety notice",
    region: "Safety and crisis support",
    short: "Emoraa is not an emergency service. Immediate help is available 24x7.",
    call: "Call 14416",
    more: "More support",
    dismissLabel: "Dismiss safety notice",
    gentle: "A gentle note before you begin",
    bodyBefore: "Emoraa offers emotional wellness tools & connects you with qualified therapists. We are ",
    bodyStrong: "not a substitute",
    bodyAfter: " for emergency psychiatric care or clinical diagnosis.",
    reachOut: "Reach out now if you need immediate support:",
    teleManasNote: "(24×7, govt. helpline)",
    emergency: "Emergency:",
    gotIt: "Got it",
    minimize: "Minimize",
    safetyFirst: "Your safety comes first, always.",
  },
  chat: {
    greeting: "Hi, I'm Manu, Emoraa's AI chat 🌿 Ask me anything, or tell me how you're feeling.",
    quick: ["How much does it cost?", "Which therapist is right for me?", "Is it confidential?", "I'm not feeling great"],
    title: "Manu",
    subtitle: "AI chat · not a therapist or crisis line",
    conversation: "Conversation with Manu",
    typing: "Manu is typing",
    inputLabel: "Type your message",
    placeholder: "Type a message…",
    send: "Send",
    open: "Chat with Manu",
    close: "Close chat with Manu",
    failure: "I couldn't reply just now. You can try again, or talk to a real person on WhatsApp.",
    whatsapp: "Chat on WhatsApp",
  },
  crisisLine: {
    lead: "Need someone right now, before your session?",
    call: "Call Tele-MANAS 14416",
    more: "More crisis support",
  },
  mobileCrisis: "In crisis? Call Tele-MANAS 14416 — free, 24x7.",
};

const hi: ChromeCopy = {
  account: { signIn: "साइन इन", admin: "एडमिन", expert: "एक्सपर्ट पोर्टल", mySessions: "मेरे सेशन" },
  home: "होम",
  book: "सेशन बुक करें",
  footer: {
    blurb:
      "भारत के युवाओं, छात्रों और नौकरी करने वालों के लिए थेरेपी और काउंसलिंग — गोपनीय, किफ़ायती, और आपकी भाषा में।",
    explore: "देखें",
    reachUs: "हमसे संपर्क करें",
    whatsapp: "WhatsApp पर लिखें",
    legal: "नियम और नीतियाँ",
    privacy: "प्राइवेसी पॉलिसी",
    terms: "इस्तेमाल की शर्तें",
    refund: "रिफ़ंड और कैंसलेशन",
    cookies: "कुकी पॉलिसी",
    cookieSettings: "कुकी सेटिंग्स",
    inCrisis: "संकट में हैं?",
    callTeleManas: "Tele-MANAS को कॉल करें",
    crisisRest: "— मुफ़्त, गोपनीय, 24x7, 20 से ज़्यादा भारतीय भाषाओं में। Emoraa कोई क्राइसिस सेवा नहीं है।",
    madeWithCare: "© 2026 Emoraa. भारत में, परवाह के साथ बनाया गया।",
  },
  cookies: {
    title: "कुकीज़ के बारे में एक छोटा-सा सवाल",
    body:
      "आपको साइन-इन रखने के लिए हम ज़रूरी कुकीज़ इस्तेमाल करते हैं। आपकी इजाज़त हो, तो हम बिना नाम वाले पेज व्यूज़ भी गिनेंगे, ताकि पता चले कि क्या काम आ रहा है। आपके डैशबोर्ड, बुकिंग या क्राइसिस पेजों पर कभी नहीं।",
    policy: "कुकी पॉलिसी",
    essential: "सिर्फ़ ज़रूरी",
    allow: "एनालिटिक्स की इजाज़त दें",
  },
  safety: {
    pill: "सुरक्षा जानकारी",
    pillLabel: "सुरक्षा सूचना दिखाएँ",
    region: "सुरक्षा और क्राइसिस सहायता",
    short: "Emoraa कोई इमरजेंसी सेवा नहीं है। तुरंत मदद 24x7 मौजूद है।",
    call: "14416 पर कॉल करें",
    more: "और सहायता",
    dismissLabel: "सुरक्षा सूचना बंद करें",
    gentle: "शुरू करने से पहले एक छोटी-सी बात",
    bodyBefore:
      "Emoraa भावनात्मक सेहत के टूल देता है और आपको योग्य थेरेपिस्ट से जोड़ता है। हम इमरजेंसी साइकिएट्रिक देखभाल या क्लिनिकल डायग्नोसिस का ",
    bodyStrong: "विकल्प नहीं हैं",
    bodyAfter: "।",
    reachOut: "अगर अभी तुरंत मदद चाहिए, तो यहाँ बात करें:",
    teleManasNote: "(24×7, सरकारी हेल्पलाइन)",
    emergency: "इमरजेंसी:",
    gotIt: "ठीक है",
    minimize: "छोटा करें",
    safetyFirst: "आपकी सुरक्षा सबसे पहले, हमेशा।",
  },
  chat: {
    greeting: "नमस्ते, मैं मनु हूँ, Emoraa का AI चैट 🌿 कुछ भी पूछिए, या बताइए कि आप कैसा महसूस कर रहे हैं।",
    quick: ["इसका ख़र्च कितना है?", "मेरे लिए कौन-सा थेरेपिस्ट सही रहेगा?", "क्या यह गोपनीय है?", "मेरा मन ठीक नहीं है"],
    title: "मनु",
    subtitle: "AI चैट · थेरेपिस्ट या क्राइसिस लाइन नहीं",
    conversation: "मनु से बातचीत",
    typing: "मनु जवाब लिख रहा है",
    inputLabel: "अपना मैसेज लिखें",
    placeholder: "मैसेज लिखें…",
    send: "भेजें",
    open: "मनु से चैट करें",
    close: "मनु की चैट बंद करें",
    failure: "अभी जवाब नहीं दे पाया। फिर से कोशिश करें, या WhatsApp पर किसी असली इंसान से बात करें।",
    whatsapp: "WhatsApp पर चैट करें",
  },
  crisisLine: {
    lead: "सेशन से पहले, अभी किसी से बात करनी है?",
    call: "Tele-MANAS 14416 पर कॉल करें",
    more: "और क्राइसिस सहायता",
  },
  mobileCrisis: "संकट में हैं? Tele-MANAS 14416 पर कॉल करें — मुफ़्त, 24x7।",
};

/** Hindi labels and one-line descriptions for the links the menus and footer share, by path. */
const hiLinks: Record<string, { label: string; desc?: string }> = {
  "/": { label: "होम" },
  "/book": { label: "सेशन बुक करें" },
  "/services": { label: "सेवाएँ" },
  "/for-organisations": { label: "संस्थानों के लिए" },
  "/blog": { label: "ब्लॉग" },
  "/about": { label: "हमारे बारे में", desc: "हम कौन हैं, और यह क्यों बनाया" },
  "/made-in-india": { label: "मेड इन इंडिया", desc: "यहीं बना, यहीं के लिए" },
  "/contact": { label: "संपर्क", desc: "किसी असली इंसान से बात करें" },
  "/therapists": { label: "हमारी केयर टीम", desc: "वे साइकोलॉजिस्ट और साइकिएट्रिस्ट, जिनसे आप मिलेंगे" },
  "/crisis": { label: "क्राइसिस सहायता", desc: "हेल्पलाइन — मुफ़्त, 24x7" },
  "/tools/burnout": { label: "बर्नआउट चेक", desc: "बर्नआउट है, या बस एक बुरा हफ़्ता?" },
  "/breathe": { label: "एक गहरी साँस", desc: "1 मिनट की गाइडेड ब्रीदिंग" },
  "/tools/grounding": { label: "5-4-3-2-1 ग्राउंडिंग", desc: "बेचैन मन को थामें" },
  "/tools/relax": { label: "मसल रिलैक्सेशन", desc: "सिर से पैर तक — कसें, फिर छोड़ें" },
  "/tools/sounds": { label: "शांत आवाज़ें", desc: "बारिश, नदी, तानपुरे की गूँज" },
  "/tools/affirmations": { label: "अफ़र्मेशन", desc: "छोटी, सच्ची बातें — हिंदी + English" },
  "/tools/journal": { label: "चिंता डायरी", desc: "लिख डालिए, फिर जाने दीजिए" },
  "/tools/bmi": { label: "BMI कैलकुलेटर", desc: "एक नंबर, संदर्भ के साथ — फ़ैसला नहीं" },
  "/check-in": { label: "मूड चेक-इन", desc: "2 मिनट का ठहराव" },
  "/match": { label: "अपना थेरेपिस्ट ढूँढें", desc: "3 सवालों में आपका मैच" },
  "/tools": { label: "सभी मुफ़्त टूल", desc: "सब कुछ एक जगह" },
};

export function chromeCopy(locale: Locale): ChromeCopy {
  return locale === "hi" ? hi : en;
}

/** A shared link in the reader's language; English falls through to the item as written. */
export function linkCopy<T extends { href: string; label: string; desc?: string }>(locale: Locale, item: T): T {
  if (locale !== "hi") return item;
  const h = hiLinks[item.href];
  return h ? { ...item, label: h.label, desc: h.desc ?? item.desc } : item;
}
