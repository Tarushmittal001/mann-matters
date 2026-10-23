import type { Locale } from "@/lib/i18n";
import {
  AGE_MIN,
  LANGUAGE_OPTIONS,
  OTP_LENGTH,
  PASSWORD_MIN,
  STATE_OPTIONS,
} from "@/lib/validation";

/**
 * The words of the sign-in and sign-up form, in both languages.
 *
 * Kept apart from copy.ts because the form is long and has its own vocabulary
 * (OTP, consent, the under-18 notice), and so the two files can be edited
 * without stepping on each other. Same rules as copy.ts: the Hindi is written,
 * not translated — everyday Hindi, with the English words people actually say
 * (account, password, email, OTP, code, mobile, session) kept in Devanagari,
 * and numbers in Western digits.
 *
 * The verb forms are chosen so nothing depends on the reader's gender:
 * "सहमत हूँ", not "मानता/मानती हूँ".
 *
 * What stays English on purpose: the development-only panels (a developer
 * reads them, never a client), and the values sent to the server — a Hindi
 * label on a dropdown still submits the English value the server checks.
 */

type Intro = { eyebrow: string; title: string };

export type AuthCopy = {
  intro: Record<"login" | "signup" | "forgot" | "reset", Intro>;
  lede: { loginEmail: string; loginPhone: string; signup: string };
  method: { group: string; email: string; phone: string };
  field: {
    firstName: string;
    firstNamePlaceholder: string;
    lastName: string;
    lastNamePlaceholder: string;
    dateOfBirth: string;
    gender: string;
    choose: string;
    language: string;
    noPreference: string;
    languageHint: string;
    mobile: string;
    mobileHintSignup: string;
    city: string;
    cityPlaceholder: string;
    state: string;
    organisation: string;
    organisationHint: string;
    email: string;
    password: string;
    passwordPlaceholderLogin: string;
    passwordPlaceholderSignup: string;
    passwordHint: string;
    otp: string;
    otpPlaceholder: string;
    otpExpiresHint: string;
    indianOnlyHint: string;
    codeSentTo: (phone: string) => string;
    signupCodeHint: string;
  };
  gender: Record<string, string>;
  /** Display names for the language dropdown, keyed on the value it submits. */
  languages: Record<(typeof LANGUAGE_OPTIONS)[number], string>;
  /** Display names for the state dropdown, keyed on the value it submits. */
  states: Record<(typeof STATE_OPTIONS)[number], string>;
  guardianNotice: (age: number) => string;
  consent: { before: string; terms: string; middle: string; privacy: string; after: string };
  changeDetails: string;
  forgotPassword: string;
  errors: { generic: string; network: string };
  resend: { sending: string; sent: string; failed: string; confirmation: string };
  busy: { checkingCode: string; sendingCode: string; signingIn: string; creating: string };
  submit: {
    verifyAndSignIn: string;
    sendOtp: string;
    signIn: string;
    verifyAndCreate: string;
    create: string;
  };
  changeNumber: string;
  resendCode: string;
  footer: { newHere: string; createAccount: string; haveAccount: string; signIn: string };
  privacyNote: string;
  pending: {
    eyebrow: string;
    titleSent: string;
    titleNotSent: string;
    /** Split around the address, which is rendered in bold between them. */
    sentBefore: string;
    sentAfter: string;
    notSentBefore: string;
    notSentAfter: string;
    resendEmail: string;
    backToSignIn: string;
    footnote: string;
  };
};

const en: AuthCopy = {
  intro: {
    login: { eyebrow: "welcome back", title: "Good to see you again." },
    signup: { eyebrow: "create your account", title: "Let's get you set up." },
    forgot: { eyebrow: "forgot password", title: "Let's get you back in." },
    reset: { eyebrow: "new password", title: "Choose a new password." },
  },
  lede: {
    loginEmail: "Use your email and password to manage your sessions.",
    loginPhone: "We'll text a one-time code to the phone linked to your account.",
    signup: "One account for booking sessions, tracking them, and moving them when life happens.",
  },
  method: { group: "Choose how to sign in", email: "Email", phone: "Phone" },
  field: {
    firstName: "First name",
    firstNamePlaceholder: "Riya",
    lastName: "Last name",
    lastNamePlaceholder: "Kapoor",
    dateOfBirth: "Date of birth",
    gender: "Gender",
    choose: "Choose…",
    language: "Language you'd rather talk in",
    noPreference: "No preference",
    languageHint:
      "Optional. Feelings are easier to find in the language you think in — we'll use this when matching you.",
    mobile: "Mobile number",
    mobileHintSignup: "We'll text a code to confirm it's yours.",
    city: "City or town",
    cityPlaceholder: "Jaipur",
    state: "State",
    organisation: "School, college or workplace",
    organisationHint: "Optional. It helps us match you with someone who gets your world.",
    email: "Email",
    password: "Password",
    passwordPlaceholderLogin: "Your password",
    passwordPlaceholderSignup: `At least ${PASSWORD_MIN} characters`,
    passwordHint:
      "A phrase you'll remember beats a word you won't. Length matters more than symbols.",
    otp: "One-time code",
    otpPlaceholder: `${OTP_LENGTH}-digit code`,
    otpExpiresHint: "The code expires in 5 minutes.",
    indianOnlyHint: "Indian mobile numbers only.",
    codeSentTo: (phone) => `Code sent to ${phone}`,
    signupCodeHint: "It can take a minute. The code works for 10 minutes.",
  },
  gender: {
    female: "Female",
    male: "Male",
    "non-binary": "Non-binary",
    "prefer-not-to-say": "Prefer not to say",
  },
  languages: Object.fromEntries(LANGUAGE_OPTIONS.map((l) => [l, l])) as AuthCopy["languages"],
  states: Object.fromEntries(STATE_OPTIONS.map((s) => [s, s])) as AuthCopy["states"],
  guardianNotice: (age) =>
    `You're under ${age}, so a parent or guardian needs to agree to therapy with you. We'll ask about that before your first session.`,
  consent: {
    before: "I agree to the ",
    terms: "Terms of use",
    middle: " and ",
    privacy: "Privacy policy",
    after:
      ", including Emoraa processing the health information I choose to share so I can get care.",
  },
  changeDetails: "Change my details",
  forgotPassword: "Forgot password?",
  errors: {
    generic: "Something went wrong. Please try again.",
    network: "Couldn't reach the server. Please check your connection and try again.",
  },
  resend: {
    sending: "Sending…",
    sent: "Sent. Check your inbox — and your spam folder.",
    failed: "Couldn't resend just now. Please try again.",
    confirmation: "Resend confirmation email",
  },
  busy: {
    checkingCode: "Checking code…",
    sendingCode: "Sending code…",
    signingIn: "Signing in…",
    creating: "Creating your account…",
  },
  submit: {
    verifyAndSignIn: "Verify and sign in",
    sendOtp: "Send one-time code",
    signIn: "Sign in",
    verifyAndCreate: "Verify and create account",
    create: "Create account",
  },
  changeNumber: "Change number",
  resendCode: "Resend code",
  footer: {
    newHere: "New here?",
    createAccount: "Create an account",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
  },
  privacyNote:
    "Your account holds your sessions and nothing else. We don't sell data, and we never see what happens inside a session.",
  pending: {
    eyebrow: "one last step",
    titleSent: "Check your inbox.",
    titleNotSent: "One link stands between us.",
    sentBefore: "We've sent a confirmation link to ",
    sentAfter: ". Click it to activate your account — the link expires in 24 hours.",
    notSentBefore: "Your account for ",
    notSentAfter:
      " is created, but no email could be sent — this server has no mail provider configured yet.",
    resendEmail: "Resend email",
    backToSignIn: "Back to sign in",
    footnote:
      "No email? Check your spam folder, or use “Resend”. With no mail provider configured, the link is printed in the server console and shown above.",
  },
};

const hi: AuthCopy = {
  intro: {
    login: { eyebrow: "फिर से स्वागत है", title: "आपको फिर से देखकर अच्छा लगा।" },
    signup: { eyebrow: "अपना अकाउंट बनाइए", title: "चलिए, शुरू करते हैं।" },
    forgot: { eyebrow: "पासवर्ड भूल गए", title: "चलिए, आपको वापस अंदर लाते हैं।" },
    reset: { eyebrow: "नया पासवर्ड", title: "नया पासवर्ड चुनिए।" },
  },
  lede: {
    loginEmail: "अपने सेशन देखने और संभालने के लिए ईमेल और पासवर्ड से साइन इन कीजिए।",
    loginPhone: "आपके अकाउंट से जुड़े मोबाइल नंबर पर हम एक ओटीपी भेजेंगे।",
    signup: "एक ही अकाउंट से सेशन बुक कीजिए, उनका हिसाब रखिए, और ज़रूरत पड़े तो समय बदलिए।",
  },
  method: { group: "साइन इन का तरीका चुनिए", email: "ईमेल", phone: "फ़ोन" },
  field: {
    firstName: "पहला नाम",
    firstNamePlaceholder: "रिया",
    lastName: "सरनेम",
    lastNamePlaceholder: "कपूर",
    dateOfBirth: "जन्म की तारीख़",
    gender: "जेंडर",
    choose: "चुनिए…",
    language: "किस भाषा में बात करना चाहेंगे",
    noPreference: "कोई भी चलेगी",
    languageHint:
      "ज़रूरी नहीं। जिस भाषा में आप सोचते हैं, उसी में मन की बात कहना आसान होता है — थेरेपिस्ट चुनते समय हम इसका ध्यान रखेंगे।",
    mobile: "मोबाइल नंबर",
    mobileHintSignup: "नंबर आपका ही है, यह पक्का करने के लिए हम इस पर एक कोड भेजेंगे।",
    city: "शहर या कस्बा",
    cityPlaceholder: "जयपुर",
    state: "राज्य",
    organisation: "स्कूल, कॉलेज या ऑफ़िस",
    organisationHint: "ज़रूरी नहीं। इससे हम आपके लिए ऐसा थेरेपिस्ट ढूँढ पाते हैं जो आपकी दुनिया समझे।",
    email: "ईमेल",
    password: "पासवर्ड",
    passwordPlaceholderLogin: "आपका पासवर्ड",
    passwordPlaceholderSignup: `कम से कम ${PASSWORD_MIN} अक्षर`,
    passwordHint:
      "जो वाक्य याद रहे, वह उस शब्द से अच्छा है जो भूल जाएँ। सिंबल से ज़्यादा लंबाई मायने रखती है।",
    otp: "ओटीपी",
    otpPlaceholder: `${OTP_LENGTH} अंकों का कोड`,
    otpExpiresHint: "यह कोड 5 मिनट तक चलेगा।",
    indianOnlyHint: "सिर्फ़ भारतीय मोबाइल नंबर।",
    codeSentTo: (phone) => `${phone} पर भेजा गया कोड`,
    signupCodeHint: "कोड आने में एक मिनट लग सकता है। यह 10 मिनट तक चलेगा।",
  },
  gender: {
    female: "महिला",
    male: "पुरुष",
    "non-binary": "नॉन-बाइनरी",
    "prefer-not-to-say": "नहीं बताना चाहते",
  },
  languages: {
    English: "अंग्रेज़ी",
    Hindi: "हिन्दी",
    Hinglish: "हिंग्लिश",
    Marathi: "मराठी",
    Bengali: "बांग्ला",
    Tamil: "तमिल",
    Telugu: "तेलुगु",
    Kannada: "कन्नड़",
    Malayalam: "मलयालम",
    Gujarati: "गुजराती",
    Punjabi: "पंजाबी",
    Urdu: "उर्दू",
    Odia: "ओड़िया",
    Assamese: "असमिया",
    Konkani: "कोंकणी",
    Kashmiri: "कश्मीरी",
    Maithili: "मैथिली",
    Bhojpuri: "भोजपुरी",
    Rajasthani: "राजस्थानी",
    Nepali: "नेपाली",
    Manipuri: "मणिपुरी",
    "Indian Sign Language": "इंडियन साइन लैंग्वेज (ISL)",
  },
  states: {
    "Andhra Pradesh": "आंध्र प्रदेश",
    "Arunachal Pradesh": "अरुणाचल प्रदेश",
    Assam: "असम",
    Bihar: "बिहार",
    Chhattisgarh: "छत्तीसगढ़",
    Goa: "गोवा",
    Gujarat: "गुजरात",
    Haryana: "हरियाणा",
    "Himachal Pradesh": "हिमाचल प्रदेश",
    Jharkhand: "झारखंड",
    Karnataka: "कर्नाटक",
    Kerala: "केरल",
    "Madhya Pradesh": "मध्य प्रदेश",
    Maharashtra: "महाराष्ट्र",
    Manipur: "मणिपुर",
    Meghalaya: "मेघालय",
    Mizoram: "मिज़ोरम",
    Nagaland: "नागालैंड",
    Odisha: "ओडिशा",
    Punjab: "पंजाब",
    Rajasthan: "राजस्थान",
    Sikkim: "सिक्किम",
    "Tamil Nadu": "तमिलनाडु",
    Telangana: "तेलंगाना",
    Tripura: "त्रिपुरा",
    "Uttar Pradesh": "उत्तर प्रदेश",
    Uttarakhand: "उत्तराखंड",
    "West Bengal": "पश्चिम बंगाल",
    "Andaman and Nicobar Islands": "अंडमान और निकोबार द्वीप समूह",
    Chandigarh: "चंडीगढ़",
    "Dadra and Nagar Haveli and Daman and Diu": "दादरा और नगर हवेली और दमन और दीव",
    Delhi: "दिल्ली",
    "Jammu and Kashmir": "जम्मू और कश्मीर",
    Ladakh: "लद्दाख",
    Lakshadweep: "लक्षद्वीप",
    Puducherry: "पुडुचेरी",
  },
  guardianNotice: (age) =>
    `आपकी उम्र ${age} से कम है, इसलिए थेरेपी के लिए माता-पिता या गार्जियन की मंज़ूरी चाहिए। पहले सेशन से पहले हम आपसे इस बारे में पूछेंगे।`,
  consent: {
    before: "मैं ",
    terms: "इस्तेमाल की शर्तों",
    middle: " और ",
    privacy: "प्राइवेसी पॉलिसी",
    after:
      " से सहमत हूँ। इसमें यह भी शामिल है कि मुझे सही मदद मिल सके, इसके लिए Emoraa मेरी बताई हुई सेहत की जानकारी का इस्तेमाल करेगा।",
  },
  changeDetails: "अपनी जानकारी बदलिए",
  forgotPassword: "पासवर्ड भूल गए?",
  errors: {
    generic: "कुछ गड़बड़ हो गई। फिर से कोशिश कीजिए।",
    network: "सर्वर से जुड़ नहीं पाए। अपना इंटरनेट देखकर फिर से कोशिश कीजिए।",
  },
  resend: {
    sending: "भेज रहे हैं…",
    sent: "भेज दिया। अपना इनबॉक्स देखिए — और स्पैम फ़ोल्डर भी।",
    failed: "अभी दोबारा नहीं भेज पाए। थोड़ी देर में फिर कोशिश कीजिए।",
    confirmation: "कन्फ़र्मेशन ईमेल फिर से भेजिए",
  },
  busy: {
    checkingCode: "कोड जाँच रहे हैं…",
    sendingCode: "कोड भेज रहे हैं…",
    signingIn: "साइन इन हो रहा है…",
    creating: "आपका अकाउंट बन रहा है…",
  },
  submit: {
    verifyAndSignIn: "कोड जाँचिए और साइन इन कीजिए",
    sendOtp: "ओटीपी भेजिए",
    signIn: "साइन इन कीजिए",
    verifyAndCreate: "कोड जाँचिए और अकाउंट बनाइए",
    create: "अकाउंट बनाइए",
  },
  changeNumber: "नंबर बदलिए",
  resendCode: "कोड फिर से भेजिए",
  footer: {
    newHere: "पहली बार आए हैं?",
    createAccount: "अकाउंट बनाइए",
    haveAccount: "पहले से अकाउंट है?",
    signIn: "साइन इन कीजिए",
  },
  privacyNote:
    "आपके अकाउंट में सिर्फ़ आपके सेशन रहते हैं, और कुछ नहीं। हम डेटा नहीं बेचते, और सेशन के अंदर क्या बात होती है, वह हम कभी नहीं देखते।",
  pending: {
    eyebrow: "बस एक कदम और",
    titleSent: "अपना इनबॉक्स देखिए।",
    titleNotSent: "बस एक लिंक की दूरी है।",
    sentBefore: "हमने ",
    sentAfter:
      " पर एक कन्फ़र्मेशन लिंक भेजा है। अकाउंट चालू करने के लिए उस पर क्लिक कीजिए — यह लिंक 24 घंटे तक चलेगा।",
    notSentBefore: "",
    notSentAfter:
      " के लिए आपका अकाउंट बन गया है, पर ईमेल नहीं भेजा जा सका — इस सर्वर पर अभी मेल प्रोवाइडर सेट नहीं है।",
    resendEmail: "ईमेल फिर से भेजिए",
    backToSignIn: "साइन इन पर वापस जाइए",
    footnote:
      "ईमेल नहीं आया? स्पैम फ़ोल्डर देखिए, या “फिर से भेजिए” दबाइए। अगर मेल प्रोवाइडर सेट नहीं है, तो लिंक सर्वर कंसोल में छपता है और ऊपर दिखता है।",
  },
};

const AUTH: Record<Locale, AuthCopy> = { en, hi };

export function authCopy(locale: Locale): AuthCopy {
  return AUTH[locale] ?? AUTH.en;
}

/* ------------------------------------------------------------ messages */

/**
 * Field and server messages, in Hindi.
 *
 * lib/validation.ts and the API routes speak English, and they are shared with
 * the server, so they stay as they are. The form keeps the English message in
 * its state and asks for the Hindi one only when it draws it — keyed on the
 * English text. A message missing from this list (a new rule, a reworded
 * server error) falls back to its English, which is honest rather than broken.
 */
const HI_MESSAGES: Record<string, string> = {
  // lib/validation.ts
  "Please tell us your name.": "अपना नाम बताइए।",
  "Please tell us your first name.": "अपना पहला नाम बताइए।",
  "Please tell us your last name.": "अपना सरनेम बताइए।",
  "We need an email to reach you.": "आप तक पहुँचने के लिए हमें ईमेल चाहिए।",
  "That email doesn't look right.": "यह ईमेल सही नहीं लग रहा।",
  [`Password must be at least ${PASSWORD_MIN} characters.`]: `पासवर्ड कम से कम ${PASSWORD_MIN} अक्षरों का होना चाहिए।`,
  "That password is too long.": "यह पासवर्ड बहुत लंबा है।",
  "Enter a 10-digit Indian mobile number.": "10 अंकों का भारतीय मोबाइल नंबर डालिए।",
  "Enter your mobile number.": "अपना मोबाइल नंबर डालिए।",
  [`Enter the ${OTP_LENGTH}-digit code.`]: `${OTP_LENGTH} अंकों का कोड डालिए।`,
  "Please choose one of the languages listed.": "दी गई भाषाओं में से एक चुनिए।",
  "Please choose your state.": "अपना राज्य चुनिए।",
  "Please choose one of the states listed.": "दिए गए राज्यों में से एक चुनिए।",
  "Please tell us which city or town you are in.": "आप किस शहर या कस्बे में हैं, यह बताइए।",
  "Please enter the full name of your city or town.": "अपने शहर या कस्बे का पूरा नाम लिखिए।",
  "Please enter just the city or town name, without a house or street number.":
    "सिर्फ़ शहर या कस्बे का नाम लिखिए, मकान या गली नंबर के बिना।",
  "Please enter just the city or town name.": "सिर्फ़ शहर या कस्बे का नाम लिखिए।",
  "Please agree to the Terms of use and Privacy policy to continue.":
    "आगे बढ़ने के लिए इस्तेमाल की शर्तों और प्राइवेसी पॉलिसी से सहमति दीजिए।",
  "Please tell us your date of birth.": "अपनी जन्म की तारीख़ बताइए।",
  "Please enter a real date.": "सही तारीख़ डालिए।",
  "That date is in the future.": "यह तारीख़ तो अभी आई ही नहीं है।",
  [`You need to be ${AGE_MIN} or older to use Emoraa.`]: `Emoraa इस्तेमाल करने के लिए आपकी उम्र कम से कम ${AGE_MIN} साल होनी चाहिए।`,
  "Please check the year.": "साल एक बार फिर देख लीजिए।",
  "Please choose one of the options.": "दिए गए विकल्पों में से एक चुनिए।",

  // the auth API routes
  "Email or password is incorrect.": "ईमेल या पासवर्ड सही नहीं है।",
  "Please confirm your email first. Check your inbox for the link — we can resend it.":
    "पहले अपना ईमेल कन्फ़र्म कीजिए। लिंक के लिए अपना इनबॉक्स देखिए — चाहें तो हम उसे फिर से भेज सकते हैं।",
  "That code is incorrect or has expired.": "यह कोड गलत है या इसका समय निकल चुका है।",
  "Phone sign-in is temporarily unavailable. Please use email instead.":
    "फ़ोन से साइन इन अभी कुछ देर के लिए बंद है। ईमेल से साइन इन कीजिए।",
  "We couldn't send a code just now. Please use email or try again.":
    "अभी कोड नहीं भेज पाए। ईमेल से साइन इन कीजिए या फिर से कोशिश कीजिए।",
  "An account with this email already exists. Try signing in.":
    "इस ईमेल से पहले से एक अकाउंट है। साइन इन करके देखिए।",
  "An account with this email already exists.": "इस ईमेल से पहले से एक अकाउंट है।",
  "That mobile number is already linked to an account. Try signing in.":
    "यह मोबाइल नंबर पहले से एक अकाउंट से जुड़ा है। साइन इन करके देखिए।",
  "That mobile number is already registered.": "यह मोबाइल नंबर पहले से रजिस्टर है।",
  "That email or mobile number is already registered.": "यह ईमेल या मोबाइल नंबर पहले से रजिस्टर है।",
  "That code doesn't match. Please check the SMS and try again.":
    "कोड मेल नहीं खाया। SMS एक बार फिर देखकर कोशिश कीजिए।",
  "Too many tries. Please ask for a new code.": "बहुत बार कोशिश हो गई। नया कोड मँगवाइए।",
  "That code has expired. We can send you a new one.": "इस कोड का समय निकल गया। हम नया भेज सकते हैं।",
  "We can't send SMS codes just now. Please WhatsApp or call us instead.":
    "अभी हम SMS से कोड नहीं भेज पा रहे। हमें WhatsApp या कॉल कीजिए।",
  "We couldn't send the SMS just now. Please try again in a moment.":
    "अभी SMS नहीं भेज पाए। थोड़ी देर में फिर कोशिश कीजिए।",
  "Please check the highlighted fields.": "जिन जगहों पर निशान लगा है, उन्हें एक बार देख लीजिए।",
  "Too many attempts. Please wait a moment and try again.":
    "बहुत बार कोशिश हो गई। थोड़ा रुककर फिर कोशिश कीजिए।",
  "We couldn't read that request. Please try again.": "हम आपकी रिक्वेस्ट पढ़ नहीं पाए। फिर से कोशिश कीजिए।",
  "Request blocked for your safety.": "आपकी सुरक्षा के लिए यह रिक्वेस्ट रोक दी गई।",
  "Something went wrong on our side. Please try again in a moment.":
    "हमारी तरफ़ कुछ गड़बड़ हो गई। थोड़ी देर में फिर कोशिश कीजिए।",
  "This account isn't available right now. Please email connect@emoraa.com and we'll help. If you need someone urgently, Tele-MANAS is on 14416, any time.":
    "यह अकाउंट अभी उपलब्ध नहीं है। connect@emoraa.com पर ईमेल कीजिए, हम मदद करेंगे। अगर अभी किसी से बात करनी है, तो Tele-MANAS 14416 पर कभी भी कॉल कीजिए।",
};

/** "Please keep this under N characters." comes with several different N. */
const KEEP_UNDER = /^Please keep this under (\d+) characters\.$/;

/** The message in the reader's language, or the English one if there is no Hindi for it yet. */
export function authMessage(locale: Locale, message: string): string {
  if (locale === "en" || !message) return message;
  const exact = HI_MESSAGES[message];
  if (exact) return exact;
  const keep = KEEP_UNDER.exec(message);
  if (keep) return `इसे ${keep[1]} अक्षरों से छोटा रखिए।`;
  return message;
}
