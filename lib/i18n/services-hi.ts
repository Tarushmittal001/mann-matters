/**
 * The service catalogue in Hindi.
 *
 * Keyed by the same slugs as `lib/services.ts`, so the price, the photograph
 * and the link all come from the one source of truth and only the words change.
 * A slug with no entry here simply falls back to English rather than
 * disappearing — a missing translation should cost a sentence, not a service.
 *
 * Written for somebody reading in Hindi, not transliterated from the English.
 * "थेरेपी", "सेशन", "काउंसलिंग" stay as they are because that is what people
 * say; the rest is plain Hindi.
 */

export type ServiceHi = { title: string; summary: string; duration: string };

export const SERVICES_HI: Record<string, ServiceHi> = {
  "psychiatry-medication": {
    title: "मनोचिकित्सा और दवा",
    summary:
      "एक रजिस्टर्ड साइकियाट्रिस्ट जो जाँचते हैं कि दवा की ज़रूरत है या नहीं, और हो तो कौन सी — थेरेपी की जगह नहीं, उसके साथ।",
    duration: "30 मिनट",
  },
  "individual-therapy": {
    title: "व्यक्तिगत थेरेपी",
    summary:
      "हफ़्ते में पचास मिनट, सिर्फ़ आपके। चिंता, उदासी, गुस्सा, या वह सब जिसे अब तक नाम नहीं मिला।",
    duration: "50 मिनट",
  },
  "daily-life-stress": {
    title: "रोज़ का तनाव",
    summary:
      "जब कुछ भी 'बड़ा' नहीं हुआ, फिर भी हर दिन भारी लगता है। यह भी असली है, और इस पर काम होता है।",
    duration: "45 मिनट",
  },
  "student-support": {
    title: "छात्रों के लिए",
    summary:
      "बोर्ड, JEE, NEET, हॉस्टल, प्लेसमेंट — और वह डर जो नतीजे से पहले ही आ जाता है।",
    duration: "45 मिनट",
  },
  "career-counselling": {
    title: "करियर काउंसलिंग",
    summary:
      "'आगे क्या' का जवाब किसी टेस्ट से नहीं आता। किसी ऐसे इंसान से आता है जो आपकी पूरी बात सुने।",
    duration: "50 मिनट",
  },
  "love-life-counselling": {
    title: "रिश्ते और प्यार",
    summary:
      "ब्रेकअप, एकतरफ़ा प्यार, घरवालों का दबाव, या वह रिश्ता जिसमें रहना और छोड़ना दोनों मुश्किल है।",
    duration: "50 मिनट",
  },
  "couples-counseling": {
    title: "कपल काउंसलिंग",
    summary:
      "दोनों के लिए एक कमरा, जहाँ कोई पक्ष नहीं लिया जाता। शादी हो या न हो — फ़र्क नहीं पड़ता।",
    duration: "60 मिनट",
  },
  "family-therapy": {
    title: "फ़ैमिली थेरेपी",
    summary:
      "जब झगड़ा दो लोगों का नहीं, पूरे घर के तरीक़े का हो। सबके लिए जगह, बारी-बारी से।",
    duration: "75 मिनट",
  },
  "lgbtqia-affirmative": {
    title: "LGBTQIA+ के लिए",
    summary:
      "ऐसे थेरेपिस्ट जिन्हें आपको अपनी पहचान समझानी नहीं पड़ेगी। कोई 'इलाज' नहीं, कोई सवाल नहीं।",
    duration: "50 मिनट",
  },
  "teen-therapy": {
    title: "किशोरों के लिए थेरेपी",
    summary:
      "13 से 17 साल के लिए। माता-पिता की सहमति ज़रूरी है, लेकिन कमरे की बात कमरे में ही रहती है।",
    duration: "45 मिनट",
  },
  "parent-coaching": {
    title: "माता-पिता के लिए",
    summary:
      "बच्चे को थेरेपी में भेजे बिना भी बहुत कुछ बदला जा सकता है — अगर घर में कोई एक तरीक़ा बदल दे।",
    duration: "50 मिनट",
  },
  "sleep-programme": {
    title: "नींद का कार्यक्रम (CBT-I)",
    summary:
      "छह सेशन का तरीक़ा, जो नींद की गोली से बेहतर चलता है और बंद करने पर वापस नहीं लौटता।",
    duration: "50 मिनट",
  },
  "grief-loss": {
    title: "शोक और नुकसान",
    summary:
      "किसी का चले जाना — और उसके बाद की वह चुप्पी, जिसमें सब यह मान लेते हैं कि अब आप ठीक हैं।",
    duration: "50 मिनट",
  },
  "group-sessions": {
    title: "ग्रुप सेशन",
    summary:
      "छह-आठ लोग, एक थेरेपिस्ट, एक ही तरह की परेशानी। यह जानना कि आप अकेले नहीं हैं, अपने आप में इलाज है।",
    duration: "90 मिनट",
  },
};
