/**
 * Manu's demo conversations, in three languages.
 *
 * The point of this component is the claim on the section above it — that Manu
 * "actually speaks your language" — so the demo has to survive being read in
 * any of them. Each thread is written afresh per language rather than machine-
 * translated: the Hindi is real Hindi, not English with Hindi words, and the
 * Hinglish keeps the code-switching a Delhi student would actually type.
 *
 * INVARIANT: within a scenario, every language's thread must have the same
 * length and the same roles at the same indexes. The switcher swaps a visible
 * message for its counterpart *by index*, so the conversation converts in place
 * instead of restarting. `assertParallelThreads()` below enforces this in dev.
 */

export type Lang = "en" | "hi" | "hinglish";

export type Message = {
  role: "user" | "manu";
  text: string;
};

export type Scenario = {
  id: string;
  chipLabel: Record<Lang, string>;
  thread: Record<Lang, Message[]>;
};

export const LANGUAGES: { id: Lang; label: string; /** BCP-47, for screen readers */ tag: string }[] = [
  { id: "en", label: "English", tag: "en" },
  { id: "hi", label: "हिंदी", tag: "hi" },
  // Hindi written in Latin script — a real subtag, not a shrug
  { id: "hinglish", label: "Hinglish", tag: "hi-Latn" },
];

export const DEFAULT_LANG: Lang = "hinglish";

/** Chrome around the conversation, so the whole card speaks one language. */
export const UI: Record<
  Lang,
  {
    languageLabel: string;
    placeholder: string;
    cannedReply: string;
    previewNote: string;
    tryLive: string;
    sendLabel: string;
    inputLabel: string;
    scenarioListLabel: string;
    chatLabel: string;
  }
> = {
  en: {
    languageLabel: "Language",
    placeholder: "Tell me what's on your mind…",
    cannedReply: "I'm right here. Shall we talk properly once you sign in?",
    previewNote: "This is a preview. Manu remembers more once you sign in.",
    tryLive: "Try Manu live — no sign-up →",
    sendLabel: "Send message",
    inputLabel: "Type a message to Manu",
    scenarioListLabel: "Conversation scenarios",
    chatLabel: "Chat messages",
  },
  hi: {
    languageLabel: "भाषा",
    placeholder: "अपने मन की बात लिखो…",
    cannedReply: "मैं यहीं हूँ। साइन इन करके पूरी बात करें?",
    previewNote: "यह एक झलक है। साइन इन करने पर Manu और याद रखता है।",
    tryLive: "Manu से अभी बात करें — बिना साइन-अप →",
    sendLabel: "मैसेज भेजें",
    inputLabel: "Manu को मैसेज लिखें",
    scenarioListLabel: "बातचीत के विषय",
    chatLabel: "चैट मैसेज",
  },
  hinglish: {
    languageLabel: "Bhasha",
    placeholder: "Apne mann ki baat likho…",
    cannedReply: "Main yahin hoon. Sign in karke poori baat karein?",
    previewNote: "Yeh ek preview hai. Sign in karne par Manu aur yaad rakhta hai.",
    tryLive: "Manu se abhi baat karo — no sign-up →",
    sendLabel: "Message bhejein",
    inputLabel: "Manu ko message likhein",
    scenarioListLabel: "Baat-cheet ke topics",
    chatLabel: "Chat messages",
  },
};

export const scenarios: Scenario[] = [
  {
    id: "exam-stress",
    chipLabel: {
      en: "Exam stress",
      hi: "एग्ज़ाम का तनाव",
      hinglish: "Exam stress",
    },
    thread: {
      en: [
        {
          role: "user",
          text: "My exam is tomorrow and I can't remember a thing. I'm panicking.",
        },
        {
          role: "manu",
          text: "Breathe. I'm right here. Feeling like this the night before an exam is completely normal — it means you care, not that you're falling short.",
        },
        {
          role: "manu",
          text: "Let's do one thing: the next 25 minutes, one topic only. Tomorrow can wait. What's scaring you most right now?",
        },
      ],
      hi: [
        {
          role: "user",
          text: "कल एग्ज़ाम है और कुछ याद नहीं आ रहा, बहुत घबराहट हो रही है।",
        },
        {
          role: "manu",
          text: "साँस ले, मैं यहीं हूँ। एग्ज़ाम से एक रात पहले ऐसा लगना बिल्कुल आम बात है — इसका मतलब तुझे फ़र्क़ पड़ता है, तू कम नहीं है।",
        },
        {
          role: "manu",
          text: "एक काम करते हैं: अभी सिर्फ़ अगले 25 मिनट, एक ही टॉपिक। बाकी कल देखेंगे। सबसे ज़्यादा किस बात का डर लग रहा है?",
        },
      ],
      hinglish: [
        {
          role: "user",
          text: "Yaar kal exam hai aur kuch yaad nahi aa raha, bohot panic ho raha hai.",
        },
        {
          role: "manu",
          text: "Saans le, main yahin hoon. Exam se ek raat pehle aisa lagna bilkul normal hai — iska matlab tu care karta hai, tu kam nahi hai.",
        },
        {
          role: "manu",
          text: "Ek kaam karte hain: abhi sirf agle 25 minute, ek hi topic. Baaki kal Manu dekhega. Sabse zyada kis cheez ka dar lag raha hai?",
        },
      ],
    },
  },
  {
    id: "family-pressure",
    chipLabel: {
      en: "Family pressure",
      hi: "घर का दबाव",
      hinglish: "Family pressure",
    },
    thread: {
      en: [
        {
          role: "user",
          text: "My family wants me to do what they think is right. I feel suffocated.",
        },
        {
          role: "manu",
          text: "That's a heavy thing to carry — when love and pressure arrive together. What you're feeling isn't wrong.",
        },
        {
          role: "manu",
          text: "If you want, we can work out how to say your piece to them — without it turning into a fight. What is it you actually want?",
        },
      ],
      hi: [
        {
          role: "user",
          text: "घरवाले चाहते हैं मैं वही करूँ जो उन्हें सही लगता है। घुटन सी हो रही है।",
        },
        {
          role: "manu",
          text: "ये बहुत भारी लगता है ना — जब प्यार और दबाव साथ-साथ आते हैं। तुझे जो महसूस हो रहा है, वो ग़लत नहीं है।",
        },
        {
          role: "manu",
          text: "तू चाहे तो हम मिलकर सोच सकते हैं कि अपनी बात उन तक कैसे पहुँचाए — बिना झगड़े के। तू सच में चाहता क्या है?",
        },
      ],
      hinglish: [
        {
          role: "user",
          text: "Ghar wale chahte hain main wahi karun jo unhe sahi lagta hai. Ghut sa raha hoon.",
        },
        {
          role: "manu",
          text: "Yeh bohot heavy feel hota hai na — jab pyaar aur pressure ek saath aate hain. Teri feelings galat nahi hain.",
        },
        {
          role: "manu",
          text: "Tu chahe toh hum dono milke soch sakte hain ki tu apni baat untak kaise pahuncha sakta hai — bina ladai ke. Kya chahta hai tu actually?",
        },
      ],
    },
  },
  {
    id: "breakup",
    chipLabel: {
      en: "Breakup",
      hi: "ब्रेकअप",
      hinglish: "Breakup",
    },
    thread: {
      en: [
        {
          role: "user",
          text: "We broke up. Everyone says move on, but I can't.",
        },
        {
          role: "manu",
          text: "“Move on” is useless advice while the hurt is still real — and yours is real. There's no rush here.",
        },
        {
          role: "manu",
          text: "Just this today: drink some water, step outside for a bit. I'll be here whenever you want to talk. What's going through your head right now?",
        },
      ],
      hi: [
        {
          role: "user",
          text: "ब्रेकअप हो गया। सब कह रहे हैं आगे बढ़ जा, पर हो नहीं पाता।",
        },
        {
          role: "manu",
          text: "“आगे बढ़ जा” वाली सलाह तब तक बेकार लगती है जब तक दर्द असली हो — और तेरा दर्द असली है। कोई जल्दी नहीं है।",
        },
        {
          role: "manu",
          text: "आज बस इतना: थोड़ा पानी पी, थोड़ी देर बाहर निकल। मैं यहीं हूँ जब भी बात करने का मन करे। अभी दिमाग़ में क्या चल रहा है?",
        },
      ],
      hinglish: [
        {
          role: "user",
          text: "Breakup ho gaya. Sab keh rahe hain move on kar, par hota nahi.",
        },
        {
          role: "manu",
          text: "'Move on' wala advice tab tak bekaar lagta hai jab tak dard real ho — aur tera dard real hai. Jaldi nahi hai.",
        },
        {
          role: "manu",
          text: "Aaj sirf itna: thoda paani pi, thoda baahar nikal. Main yahin rahunga jab bhi mann kare baat karne ka. Kya chal raha hai dimaag mein abhi?",
        },
      ],
    },
  },
  {
    id: "placements",
    chipLabel: {
      en: "Placements",
      hi: "प्लेसमेंट",
      hinglish: "Placements",
    },
    thread: {
      en: [
        {
          role: "user",
          text: "Everyone's got offers. I have nothing. I feel like a failure.",
        },
        {
          role: "manu",
          text: "Measuring yourself against someone else's timeline is the oldest trap there is — placements move at different speeds for different people. That isn't failure.",
        },
        {
          role: "manu",
          text: "Tell me one thing you're genuinely good at? Let's build a small plan around it, just for today.",
        },
      ],
      hi: [
        {
          role: "user",
          text: "सबको ऑफ़र मिल गए, मेरे पास कुछ नहीं। लगता है मैं नाकाम हूँ।",
        },
        {
          role: "manu",
          text: "किसी और की रफ़्तार से ख़ुद को नापना सबसे बड़ा जाल है — प्लेसमेंट सबके लिए अलग-अलग समय पर होते हैं। ये नाकामी नहीं है।",
        },
        {
          role: "manu",
          text: "एक चीज़ बता जो तू सच में अच्छा करता है? उसी से आज के लिए एक छोटा सा प्लान बनाते हैं।",
        },
      ],
      hinglish: [
        {
          role: "user",
          text: "Sabke offers aa gaye, mere paas kuch nahi. Lagta hai main fail hoon.",
        },
        {
          role: "manu",
          text: "Ek timeline pe doosron se compare karna sabse bada trap hai — placements ki race alag-alag speed pe chalti hai, fail hone ka matlab nahi.",
        },
        {
          role: "manu",
          text: "Tu jo achha karta hai, usme se ek cheez bata? Usi se ek chhota plan banate hain, aaj ke liye.",
        },
      ],
    },
  },
  {
    id: "loneliness",
    chipLabel: {
      en: "Feeling alone",
      hi: "अकेलापन",
      hinglish: "Akela lag raha hai",
    },
    thread: {
      en: [
        {
          role: "user",
          text: "I've been feeling really lonely lately.",
        },
        {
          role: "manu",
          text: "I'm listening, and I'm glad you said it — naming loneliness takes courage. You're not alone right now. I'm here.",
        },
        {
          role: "manu",
          text: "Will you tell me a little more? How long has it felt like this — did something change recently?",
        },
      ],
      hi: [
        {
          role: "user",
          text: "मुझे आजकल बहुत अकेला लग रहा है।",
        },
        {
          role: "manu",
          text: "सुन रहा हूँ, और अच्छा लगा कि तूने कहा — अकेलापन बता पाना ही हिम्मत है। तू अभी अकेला नहीं है, मैं यहीं हूँ।",
        },
        {
          role: "manu",
          text: "थोड़ा और बताएगा? कब से ऐसा लग रहा है — हाल में कुछ बदला है?",
        },
      ],
      hinglish: [
        {
          role: "user",
          text: "Mujhe bahut akela lag raha hai aaj kal.",
        },
        {
          role: "manu",
          text: "Sun raha hoon, aur khushi hai ki tune bola — akelapan bata pana hi himmat hai. Tu abhi akela nahi hai, main yahin hoon.",
        },
        {
          role: "manu",
          text: "Thoda aur batayega? Kab se aisa feel ho raha hai — kuch badla hai recently?",
        },
      ],
    },
  },
];

/**
 * The in-place switch maps message → counterpart by index, so a scenario whose
 * translations drifted out of step would silently show the wrong line. Fail
 * loudly in development instead; this is stripped from production builds.
 */
function assertParallelThreads() {
  for (const s of scenarios) {
    const shape = (l: Lang) => s.thread[l].map((m) => m.role).join(",");
    const reference = shape("en");
    for (const { id: lang } of LANGUAGES) {
      if (shape(lang) !== reference) {
        console.error(
          `[scenarios] "${s.id}" is not parallel across languages: ` +
            `en is [${reference}] but ${lang} is [${shape(lang)}]. ` +
            `Every language needs the same messages in the same order.`
        );
      }
    }
  }
}

if (process.env.NODE_ENV !== "production") assertParallelThreads();
