export type Message = {
  role: "user" | "manu";
  text: string;
};

export type Scenario = {
  id: string;
  chipLabel: string;
  lang: "hinglish";
  thread: Message[];
};

export const scenarios: Scenario[] = [
  {
    id: "exam-stress",
    chipLabel: "Exam stress",
    lang: "hinglish",
    thread: [
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
  {
    id: "family-pressure",
    chipLabel: "Family pressure",
    lang: "hinglish",
    thread: [
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
  {
    id: "breakup",
    chipLabel: "Breakup",
    lang: "hinglish",
    thread: [
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
  {
    id: "placements",
    chipLabel: "Placements",
    lang: "hinglish",
    thread: [
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
  {
    id: "loneliness",
    chipLabel: "Akela lag raha hai",
    lang: "hinglish",
    thread: [
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
];
