import type { Locale } from "@/lib/i18n";

/**
 * The words, in both languages.
 *
 * The Hindi is written, not translated. Where a sentence would only work in
 * English it has been replaced with a Hindi sentence that does the same job,
 * and the English loanwords people actually use — therapy, session, online,
 * book — are kept in Devanagari rather than swapped for Sanskritised coinages
 * nobody says out loud. "मनोचिकित्सकीय परामर्श सत्र" is not what anyone calls
 * a therapy session.
 *
 * Numbers stay in Western digits, which is how prices and phone numbers are
 * read in India in both languages.
 */

export type Copy = {
  nav: {
    home: string;
    services: string;
    institutions: string;
    blog: string;
    tools: string;
    toolsEyebrow: string;
    more: string;
    moreEyebrow: string;
    book: string;
    sos: string;
    sosLabel: string;
    switchTo: string;
    menu: string;
    close: string;
  };
  home: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    lede: string;
    ctaBook: string;
    ctaFree: string;
    trust: { value: string; label: string }[];
    howEyebrow: string;
    howTitle: string;
    how: { step: string; title: string; body: string }[];
    whyEyebrow: string;
    whyTitle: string;
    why: { title: string; body: string }[];
    closingTitle: string;
    closingBody: string;
    closingCta: string;
  };
  services: {
    eyebrow: string;
    title: string;
    lede: string;
    from: string;
    perSession: string;
    view: string;
    minutes: string;
  };
  crisis: {
    eyebrow: string;
    title: string;
    lede: string;
    callNow: string;
    hours: string;
    notAlone: string;
    ifSomeoneElse: string;
    ifSomeoneElseBody: string;
  };
  booking: {
    eyebrow: string;
    headline: string;
    /** Once a session is chosen, its real length goes in. {duration} */
    headlineFor: string;
    gateTitle: string;
    gateBody: string;
    steps: string[];
    concernTitle: string;
    concernLede: string;
    expertTitle: string;
    /** {service} is the session name. */
    expertLede: string;
    feeNote: string;
    timeTitle2: string;
    showAll: string;
    showingFor: string;
    timeTitle: string;
    timeLede: string;
    reviewTitle: string;
    reviewLede: string;
    payTitle: string;
    back: string;
    next: string;
    hold: string;
    fee: string;
    youPay: string;
    haveCode: string;
    signInFirst: string;
    signInBody: string;
    signIn: string;
    createAccount: string;
  };
  signup: {
    title: string;
    lede: string;
    haveAccount: string;
    signIn: string;
  };
  price: {
    /** "Save 33%" — {n} is the number. */
    save: string;
    /** "launch price until 31 Dec 2026" — {date} is the date. */
    launchUntil: string;
  };
  common: {
    confidential: string;
    languageNote: string;
    readInEnglish: string;
    readInHindi: string;
  };
};

const en: Copy = {
  nav: {
    home: "Home",
    services: "Services",
    institutions: "For institutions",
    blog: "Blog",
    tools: "Free tools",
    toolsEyebrow: "free & private",
    more: "More",
    moreEyebrow: "about emoraa",
    book: "Book a session",
    sos: "SOS",
    sosLabel: "SOS — get crisis help now",
    switchTo: "हिन्दी में पढ़ें",
    menu: "Open menu",
    close: "Close menu",
  },
  home: {
    eyebrow: "therapy, counselling & psychiatry, online",
    headline: "Your emotions",
    headlineAccent: "matter.",
    lede: "Confidential sessions with certified psychologists and psychiatrists, in the language you think in.",
    ctaBook: "Book a session",
    ctaFree: "Try it free",
    trust: [],
    howEyebrow: "how it works",
    howTitle: "Three steps, about five minutes.",
    how: [],
    whyEyebrow: "why emoraa",
    whyTitle: "Built for here.",
    why: [],
    closingTitle: "Time that is yours.",
    closingBody: "Most people find a slot within 48 hours.",
    closingCta: "Find a time",
  },
  services: {
    eyebrow: "what we do",
    title: "Services",
    lede: "Whatever brought you here, there is someone who works on exactly that.",
    from: "from",
    perSession: "per session",
    view: "Read more",
    minutes: "minutes",
  },
  crisis: {
    eyebrow: "crisis support",
    title: "Help, right now.",
    lede: "These lines are free, confidential, and answer around the clock.",
    callNow: "Call now",
    hours: "Hours",
    notAlone: "You are not the first person to dial one of these, and you will not be the last.",
    ifSomeoneElse: "If it's someone else",
    ifSomeoneElseBody:
      "Stay with them. Ask directly whether they are thinking about hurting themselves — asking does not plant the idea, it is the question that lets somebody finally say yes.",
  },
  booking: {
    eyebrow: "book a session",
    headline: "Let's find your time",
    headlineFor: "Let's find your {duration}",
    gateTitle: "First, a place to keep your sessions safe.",
    gateBody:
      "Booking takes about two minutes. We ask you to sign in before we ask anything about what you are going through. That way, what you tell us is attached to an account you control. And nothing private is typed into a form you might get logged out of.",
    steps: ["Session", "Therapist", "Time", "Review", "Pay"],
    concernTitle: "What kind of session?",
    concernLede:
      "This sets the length and the fee, and decides which therapists can take it. You can talk about anything once you're in the room.",
    expertTitle: "Choose your expert",
    expertLede: "Everyone here is qualified for {service} and verified by us. Best matches are listed first.",
    feeNote: "for {duration}, whichever therapist you choose",
    timeTitle2: "Pick a date and time",
    showAll: "Show every session",
    showingFor: "Showing the sessions {name} takes.",
    timeTitle: "When suits you?",
    timeLede: "All times are IST.",
    reviewTitle: "One last look",
    reviewLede: "Check the details.",
    payTitle: "Confirm your session",
    back: "Back",
    next: "Continue",
    hold: "Hold this time & pay",
    fee: "Session fee",
    youPay: "You pay",
    haveCode: "Have a code?",
    signInFirst: "Sign in to book",
    signInBody: "Your sessions, receipts and notes live in your account.",
    signIn: "Sign in",
    createAccount: "Create an account",
  },
  signup: {
    title: "Create your account",
    lede: "A minute now, and everything after this is one tap.",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
  },
  price: {
    save: "Save {n}%",
    launchUntil: "launch price until {date}",
  },
  common: {
    confidential: "Confidential. What you discuss stays between you and your therapist.",
    languageNote: "Sessions are available in Hindi, English and more.",
    readInEnglish: "Read in English",
    readInHindi: "हिन्दी में पढ़ें",
  },
};

const hi: Copy = {
  nav: {
    home: "होम",
    services: "सेवाएँ",
    institutions: "संस्थानों के लिए",
    blog: "ब्लॉग",
    tools: "मुफ़्त टूल",
    toolsEyebrow: "मुफ़्त और निजी",
    more: "और",
    moreEyebrow: "Emoraa के बारे में",
    book: "सेशन बुक करें",
    sos: "SOS",
    sosLabel: "SOS — तुरंत मदद चाहिए",
    switchTo: "Read in English",
    menu: "मेन्यू खोलें",
    close: "मेन्यू बंद करें",
  },
  home: {
    eyebrow: "थेरेपी, काउंसलिंग और साइकियाट्री, ऑनलाइन",
    headline: "आपकी भावनाएँ",
    headlineAccent: "मायने रखती हैं।",
    lede: "योग्य मनोवैज्ञानिकों और मनोचिकित्सकों से निजी बातचीत — उसी भाषा में, जिसमें आप सोचते हैं।",
    ctaBook: "सेशन बुक करें",
    ctaFree: "पहला सेशन मुफ़्त",
    trust: [
      { value: "50 मिनट", label: "एक सेशन" },
      { value: "2+ भाषाएँ", label: "हिन्दी, अंग्रेज़ी और भी" },
      { value: "100%", label: "गोपनीय" },
    ],
    howEyebrow: "कैसे काम करता है",
    howTitle: "तीन कदम, लगभग पाँच मिनट।",
    how: [
      {
        step: "01",
        title: "बताइए क्या चल रहा है",
        body: "नींद, चिंता, रिश्ते, पढ़ाई, काम — या कुछ ऐसा जिसे नाम देना अभी मुश्किल लग रहा है। वह भी ठीक है।",
      },
      {
        step: "02",
        title: "अपना थेरेपिस्ट चुनिए",
        body: "हर थेरेपिस्ट योग्य है, और उनकी योग्यता हमने खुद जाँची है। भाषा, अनुभव और जिस चीज़ पर वे काम करते हैं — सब लिखा है।",
      },
      {
        step: "03",
        title: "समय चुनिए और जुड़िए",
        body: "वीडियो कॉल पर, अपने कमरे से। लिंक सेशन से 15 मिनट पहले आपके पेज पर आ जाता है।",
      },
    ],
    whyEyebrow: "Emoraa ही क्यों",
    whyTitle: "यहीं के लिए, यहीं बना।",
    why: [
      {
        title: "आपकी भाषा में",
        body: "हिन्दी में सोचकर अंग्रेज़ी में समझाना अपने आप में थकाने वाला काम है। यहाँ वह करने की ज़रूरत नहीं।",
      },
      {
        title: "घरवालों को पता नहीं चलेगा",
        body: "आपका रिकॉर्ड सिर्फ़ आपका है। न कोई फ़ोन जाता है, न कोई मैसेज — जब तक आप खुद न कहें।",
      },
      {
        title: "जो लोग यहाँ की ज़िंदगी समझते हैं",
        body: "बोर्ड, प्लेसमेंट, जॉइंट फ़ैमिली, शादी का दबाव — इन्हें समझाने में आपका आधा सेशन नहीं जाएगा।",
      },
      {
        title: "कीमत साफ़ लिखी है",
        body: "जो दाम दिख रहा है, वही लगेगा। कोई छुपा हुआ चार्ज नहीं, कोई पैकेज ज़बरदस्ती नहीं।",
      },
    ],
    closingTitle: "वह समय, जो सिर्फ़ आपका है।",
    closingBody: "ज़्यादातर लोगों को 48 घंटे के अंदर समय मिल जाता है।",
    closingCta: "समय चुनिए",
  },
  services: {
    eyebrow: "हम क्या करते हैं",
    title: "सेवाएँ",
    lede: "जो भी आपको यहाँ लाया है, उस पर काम करने वाला कोई न कोई यहाँ है।",
    from: "शुरू",
    perSession: "प्रति सेशन",
    view: "और पढ़ें",
    minutes: "मिनट",
  },
  crisis: {
    eyebrow: "तुरंत मदद",
    title: "अभी मदद चाहिए?",
    lede: "ये नंबर मुफ़्त हैं, गोपनीय हैं, और चौबीसों घंटे उठते हैं।",
    callNow: "अभी कॉल करें",
    hours: "समय",
    notAlone:
      "इनमें से कोई नंबर मिलाने वाले आप न पहले हैं, न आख़िरी। फ़ोन उठाने वाला इंसान इसी काम के लिए बैठा है।",
    ifSomeoneElse: "अगर बात किसी और की है",
    ifSomeoneElseBody:
      "उनके पास रहिए। सीधे पूछिए कि क्या वे खुद को नुकसान पहुँचाने की सोच रहे हैं — पूछने से यह ख़याल आता नहीं है, बल्कि यही वह सवाल है जिसके बाद कोई पहली बार 'हाँ' कह पाता है।",
  },
  booking: {
    eyebrow: "सेशन बुक करें",
    headline: "आइए, आपका समय तय करते हैं",
    headlineFor: "आइए, आपके {duration} तय करते हैं",
    gateTitle: "पहले, एक जगह जहाँ आपके सेशन सुरक्षित रहें।",
    gateBody:
      "बुकिंग में लगभग दो मिनट लगते हैं। आपकी परेशानी के बारे में कुछ भी पूछने से पहले हम साइन इन करवाते हैं — ताकि जो आप बताएँ वह आपके अपने अकाउंट से जुड़े, और कोई निजी बात ऐसे फ़ॉर्म में न लिखी जाए जिससे आप बीच में बाहर हो सकते हैं।",
    steps: ["सेशन", "थेरेपिस्ट", "समय", "जाँच", "भुगतान"],
    concernTitle: "किस तरह का सेशन?",
    concernLede:
      "इससे सेशन की लंबाई और फ़ीस तय होती है, और यह भी कि कौन से थेरेपिस्ट इसे ले सकते हैं। बात आप किसी भी चीज़ पर कर सकते हैं।",
    expertTitle: "अपना थेरेपिस्ट चुनिए",
    expertLede: "यहाँ सब {service} के लिए योग्य हैं और हमारे जाँचे हुए हैं। सबसे मिलते-जुलते सबसे ऊपर।",
    feeNote: "{duration} के लिए — थेरेपिस्ट कोई भी हो, यही फ़ीस है",
    timeTitle2: "दिन और समय चुनिए",
    showAll: "सारे सेशन दिखाइए",
    showingFor: "{name} जो सेशन लेते हैं, वही दिख रहे हैं।",
    timeTitle: "कौन सा समय ठीक रहेगा?",
    timeLede: "सारे समय भारतीय समय (IST) में हैं।",
    reviewTitle: "एक आख़िरी नज़र",
    reviewLede: "सब ठीक है? फिर आगे बढ़ते हैं।",
    payTitle: "सेशन पक्का कीजिए",
    back: "पीछे",
    next: "आगे बढ़िए",
    hold: "समय रोकिए और भुगतान कीजिए",
    fee: "सेशन की फ़ीस",
    youPay: "आप देंगे",
    haveCode: "कोई कोड है?",
    signInFirst: "बुक करने के लिए साइन इन कीजिए",
    signInBody: "आपके सेशन, रसीदें और बाक़ी सब आपके अकाउंट में रहता है।",
    signIn: "साइन इन",
    createAccount: "नया अकाउंट बनाइए",
  },
  signup: {
    title: "अपना अकाउंट बनाइए",
    lede: "अभी एक मिनट, उसके बाद सब कुछ एक टैप पर।",
    haveAccount: "पहले से अकाउंट है?",
    signIn: "साइन इन कीजिए",
  },
  price: {
    save: "{n}% की बचत",
    launchUntil: "{date} तक लॉन्च कीमत",
  },
  common: {
    confidential: "पूरी तरह गोपनीय। जो बात सेशन में होती है, वह आपके और आपके थेरेपिस्ट के बीच रहती है।",
    languageNote: "सेशन हिन्दी, अंग्रेज़ी और कुछ और भाषाओं में उपलब्ध हैं।",
    readInEnglish: "Read in English",
    readInHindi: "हिन्दी में पढ़ें",
  },
};

const COPY: Record<Locale, Copy> = { en, hi };

export function copy(locale: Locale): Copy {
  return COPY[locale] ?? COPY.en;
}
