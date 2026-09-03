export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Anxiety" | "Relationships" | "Student Life" | "Workplace" | "Self-care";
  readTime: string;
  date: string;
  displayDate: string;
  /** The photograph behind the cover, softened and washed. */
  cover: string;
  /** The Devanagari word set across it. */
  deva: string;
  coverAlt: string;
  author: { name: string; role: string };
  /** The short version, for readers who need it before they need the essay. */
  takeaways: string[];
  /** A free tool that puts the piece into practice. */
  tool: { href: string; label: string; note: string };
  featured?: boolean;
  content: PostBlock[];
};

export const posts: Post[] = [
  {
    slug: "your-first-therapy-session",
    title: "Your first therapy session: what actually happens in those 50 minutes",
    excerpt:
      "No couch, no inkblots, no one writing 'interesting' in a notepad. A gentle walkthrough of the first session, for everyone who has hovered over the book button.",
    category: "Self-care",
    readTime: "6 min read",
    date: "2026-05-28",
    displayDate: "28 May 2026",
    cover:
      "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1600&q=80",
    deva: "शुरुआत",
    coverAlt: "A warm cup of coffee beside a notebook near a bright window",
    author: { name: "Ananya Iyer", role: "Clinical Psychologist" },
    takeaways: [
      "It opens with confidentiality — what stays private, and the rare exceptions. That isn't fine print; ask as much about it as you want.",
      "You don't need a prepared story. Ten nervous minutes about your commute is a normal way to start, and your therapist has seen it a hundred times.",
      "Ending a first session isn't signing up for life. And if the fit felt wrong, saying so is how the process is meant to work — not rudeness.",
    ],
    tool: {
      href: "/match",
      label: "Find your therapist",
      note: "Three questions — concern, language, budget — and we'll point you to someone who fits.",
    },
    featured: true,
    content: [
      {
        type: "p",
        text: "Most people sit with the idea of therapy for months before they book anything. Not because they don't need it — because they don't know what they're walking into. The movies haven't helped. So here is the honest, unglamorous truth about the first 50 minutes.",
      },
      {
        type: "p",
        text: "It starts with logistics, and that's deliberate. Your therapist will explain confidentiality — what stays private (almost everything) and the rare exceptions (if you're at serious risk of harm). This isn't fine print. It's the foundation the whole relationship stands on, and you're allowed to ask as many questions about it as you want.",
      },
      {
        type: "h2",
        text: "You don't need a rehearsed story",
      },
      {
        type: "p",
        text: "Many first-timers arrive with a prepared summary, like a job interview. You can drop it. A good therapist will ask simple, open questions — what's been feeling heavy, when it started, what your days look like. If you cry, that's normal. If you don't, that's normal too. If you spend ten minutes talking about your commute because you're nervous, your therapist has seen that a hundred times.",
      },
      {
        type: "quote",
        text: "The first session isn't a test you can fail. It's two people figuring out whether they can work together.",
      },
      {
        type: "p",
        text: "Somewhere in the middle, you might notice something unusual: you're being listened to without anyone waiting for their turn to speak, fixing you, or relating it back to themselves. For a lot of people, that alone is worth the fee. It's also a clue about what therapy actually is — not advice, but attention with training behind it.",
      },
      {
        type: "h2",
        text: "How it ends",
      },
      {
        type: "p",
        text: "In the last ten minutes, your therapist will usually reflect back what they heard, suggest a rough direction, and ask how you'd like to proceed. You are not signing up for life. You're deciding whether to come back next week. And if the fit felt wrong — too formal, too quiet, too something — say so. Switching therapists isn't rude. It's how the process is supposed to work.",
      },
      {
        type: "p",
        text: "Book the session. Be ten minutes early. Bring water. That's the whole preparation.",
      },
    ],
  },
  {
    slug: "exam-isnt-the-enemy",
    title: "The exam isn't the enemy: a kinder way through board season",
    excerpt:
      "When a single number feels like it will decide your whole life, your nervous system acts accordingly. How to lower the stakes your body believes in — without lowering your effort.",
    category: "Student Life",
    readTime: "7 min read",
    date: "2026-05-14",
    displayDate: "14 May 2026",
    cover:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=80",
    deva: "परीक्षा",
    coverAlt: "An open textbook with handwritten notes and a pen",
    author: { name: "Meera Krishnan", role: "Counselling Psychologist" },
    takeaways: [
      "“Just relax and study” fails because you cannot think your way out of a state your body is already in.",
      "Fixed sleep, regular meals and a walk are part of preparation, not breaks from it — memory consolidates during rest, not the eleventh hour of practice papers.",
      "For parents: ask “how are you?” as often as “how was the paper?”. Children size a failure by watching how the adults talk about it.",
    ],
    tool: {
      href: "/breathe",
      label: "Take a breath",
      note: "One guided minute to bring a racing pre-exam mind back down before you open the book.",
    },
    content: [
      {
        type: "p",
        text: "By February, you can feel it in any Indian household with a Class 10 or 12 student: the TV goes quiet, relatives start calling with 'helpful' advice, and a teenager somewhere is awake at 1 a.m. doing the maths on how many chapters remain. The pressure isn't imaginary. But the story attached to it — one exam, one future, one chance — is.",
      },
      {
        type: "p",
        text: "Your brain doesn't distinguish between a tiger and a tanking mock-test score. If it believes your survival is on the line, it floods you with the same chemistry: racing heart, blank mind, sleepless nights. This is why 'just relax and study' is useless advice. You can't think your way out of a state your body is in.",
      },
      { type: "h2", text: "Lower the stakes your body believes" },
      {
        type: "p",
        text: "What actually helps is boring and physical. Fixed sleep and wake times, even during revision — an exhausted brain retrieves nothing. Meals at regular hours. A walk where you're not listening to a lecture at 2x speed. These aren't breaks from preparation; they're part of it. Memory consolidates during rest, not during the eleventh straight hour of practice papers.",
      },
      {
        type: "quote",
        text: "You are allowed to want a good result and refuse to make it the measure of your worth. Both can be true.",
      },
      { type: "h2", text: "For parents reading this" },
      {
        type: "p",
        text: "Your child can hear the difference between 'how was the paper?' and 'how are you?'. Ask the second one sometimes. Mention, out loud, a story of someone who took a different route and is doing fine — the cousin who took a drop year, the neighbour who switched streams. Children calibrate the size of a failure by watching how adults talk about it.",
      },
      {
        type: "p",
        text: "And if the anxiety has crossed from motivating into paralysing — panic before mock tests, tears that don't stop, sleep that won't come — that's not weakness or drama. It's a signal, and it responds extremely well to a few sessions with a counsellor who works with students every day.",
      },
    ],
  },
  {
    slug: "log-kya-kahenge-in-your-head",
    title: "When 'log kya kahenge' lives in your head rent-free",
    excerpt:
      "The audience you perform for is mostly imaginary — but the exhaustion is real. On family expectations, the inner critic with an aunty's voice, and getting your own opinion back.",
    category: "Self-care",
    readTime: "8 min read",
    date: "2026-04-30",
    displayDate: "30 April 2026",
    cover:
      "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=1600&q=80",
    deva: "लोग",
    coverAlt: "A person sitting quietly by a window in soft morning light",
    author: { name: "Sana Qureshi", role: "Clinical Psychologist" },
    takeaways: [
      "The audience is internalised, not real — a committee of people who, right now, are not thinking about you at all.",
      "Its signature is specific: most tired after events where nothing bad happened, and relief instead of joy when you achieve something.",
      "Cross-examine it. Name the exact person you're imagining, then ask when you last spoke to them and whether you'd take their advice if it were offered directly.",
    ],
    tool: {
      href: "/tools/journal",
      label: "Worry journal",
      note: "Write the thought down and put it under cross-examination — the exercise from this piece, somewhere private.",
    },
    content: [
      {
        type: "p",
        text: "There's a committee that meets in your head before every decision. A relative who once raised an eyebrow at your career choice. A neighbour who asked when you're getting married. A classmate's parent who compared marks fifteen years ago. None of them are thinking about you right now. You're thinking about them on their behalf.",
      },
      {
        type: "p",
        text: "Psychologists call it an internalised audience. In collectivist cultures it's especially loud, because we grow up learning — correctly — that belonging matters, and that reputations are shared family property. The instinct isn't stupid. It just doesn't know when to switch off, so it reviews your clothes, your job, your relationship status, and your Instagram captions with the same severity it would apply to an actual scandal.",
      },
      { type: "h2", text: "The cost of constant performance" },
      {
        type: "p",
        text: "Living for the committee has a particular signature: you feel most tired after social events where nothing bad happened. You rehearse conversations that may never occur. You achieve things and feel relief instead of joy — because the point was never the thing, it was avoiding the verdict.",
      },
      {
        type: "quote",
        text: "Notice whose voice the criticism arrives in. It's almost never your own.",
      },
      {
        type: "p",
        text: "One practical exercise from therapy rooms: when the 'what will people say' spiral starts, name the specific person you're imagining. Then ask two questions. When did I last actually speak to them? And would I take life advice from them if they offered it directly? The committee shrinks remarkably fast under cross-examination.",
      },
      {
        type: "p",
        text: "This isn't about rejecting your family or culture. People who do this work in therapy usually end up closer to their families, not further — because honest closeness becomes possible once performance stops doing all the talking. The goal isn't 'I don't care what anyone thinks.' Nobody healthy thinks that. The goal is a shorter, kinder list of people whose opinions you actually weigh.",
      },
    ],
  },
  {
    slug: "burnout-doesnt-announce-itself",
    title: "Burnout doesn't announce itself. Here's what it sounds like.",
    excerpt:
      "It rarely arrives as collapse. It arrives as 'I'm fine, just busy' said for the fourteenth consecutive month. The early signals, and what to do before the wall.",
    category: "Workplace",
    readTime: "6 min read",
    date: "2026-04-16",
    displayDate: "16 April 2026",
    cover:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80",
    deva: "थकान",
    coverAlt: "An empty desk with a laptop in a dim office after hours",
    author: { name: "Arjun Mehta", role: "Counselling Psychologist" },
    takeaways: [
      "Exhaustion is only the famous signature. Cynicism and a creeping sense of ineffectiveness arrive earlier, and almost nobody notices them.",
      "A holiday treats tiredness, not burnout — you return to the same conditions and the meter restarts within days.",
      "What works is specific: renegotiate one or two concrete things, rebuild the boundary between work and sleep, and protect small doses of the work you used to like.",
    ],
    tool: {
      href: "/check-in",
      label: "Mood check-in",
      note: "Four questions on energy, sleep and thoughts — an honest read on where you actually are.",
    },
    content: [
      {
        type: "p",
        text: "The popular image of burnout is dramatic: someone crying in a conference room, a resignation letter, a breakdown. The real thing is quieter and starts much earlier. It sounds like 'I'll rest after this sprint.' It looks like checking Slack from bed at 11:40 p.m., not because anything is urgent, but because not checking feels worse.",
      },
      {
        type: "p",
        text: "Burnout has three signatures, and exhaustion is only the famous one. The second is cynicism — the slow curdling of 'I love this work' into 'nothing here matters anyway.' The third is a sense of ineffectiveness: working longer hours while feeling like you're producing less. Most people notice the hours. Almost nobody notices the curdling.",
      },
      { type: "h2", text: "Why 'just take a vacation' fails" },
      {
        type: "p",
        text: "A week in Goa treats tiredness. It doesn't treat burnout, because burnout isn't a deficit of rest — it's a surplus of conditions: unclear expectations, no control over your time, effort that goes unacknowledged, and values that quietly conflict with what the job rewards. You return from leave to the same conditions, and the meter starts running again, usually within days.",
      },
      {
        type: "quote",
        text: "Burnout is not a personal failure to cope. It's a reasonable response to unreasonable conditions sustained for too long.",
      },
      {
        type: "p",
        text: "What helps is specific: renegotiating one or two concrete things (meeting load, on-call rotation, a deadline that was always fictional), rebuilding the boundary between work and sleep, and — this part surprises people — reconnecting with the parts of the work you used to like, in small protected doses. A therapist's job here is part detective, part negotiator: finding which conditions are actually driving the depletion, and which ones you have more leverage over than you think.",
      },
      {
        type: "p",
        text: "If you've read this far with a growing sense of being personally described: that's the announcement. Burnout doesn't send a clearer memo than this one.",
      },
    ],
  },
  {
    slug: "3am-and-wide-awake",
    title: "3 a.m. and wide awake: rebuilding a relationship with sleep",
    excerpt:
      "The harder you chase sleep, the faster it leaves the room. Why effort is the enemy, and how the anxious-sleepless loop actually gets broken.",
    category: "Anxiety",
    readTime: "7 min read",
    date: "2026-03-26",
    displayDate: "26 March 2026",
    cover:
      "https://images.unsplash.com/photo-1494548162494-384bba4ab999?auto=format&fit=crop&w=1600&q=80",
    deva: "नींद",
    coverAlt: "A dark blue sky at dawn over a quiet horizon",
    author: { name: "Rohan Nair", role: "Counselling Psychologist" },
    takeaways: [
      "Sleep is one of the few things that punishes effort. Trying is arousal, and arousal is sleep's opposite.",
      "The CBT-I move that feels wrong at 3 a.m.: awake more than twenty minutes, get out of bed and do something genuinely boring until drowsiness returns.",
      "A fixed wake time — weekends included — is the anchor everything else hangs from. None of it works in three days; all of it together works in weeks.",
    ],
    tool: {
      href: "/tools/sleep",
      label: "Sleep wind-down",
      note: "A slow, guided sequence for the hour before bed, built on the same CBT-I principles.",
    },
    content: [
      {
        type: "p",
        text: "It's 3:07 a.m. You've calculated, twice, exactly how many hours remain if you fall asleep right now. You've tried the breathing app. You've flipped the pillow to the cold side. And underneath it all runs the real engine of the problem: the rising panic about not sleeping, which is the one state of mind in which sleep is impossible.",
      },
      {
        type: "p",
        text: "Sleep is one of the few things in life that punishes effort. You cannot try to sleep the way you try to finish a report. Trying is arousal, and arousal is sleep's opposite. People with insomnia usually don't have a sleep problem at first — they have a few bad nights, then develop a vigilance problem about sleep, and the vigilance becomes the insomnia.",
      },
      { type: "h2", text: "Break the bed-anxiety association" },
      {
        type: "p",
        text: "The counterintuitive move, straight from CBT-I (the gold-standard, medication-free treatment for insomnia): if you've been awake more than 20-odd minutes, get out of bed. Sit somewhere dim and do something genuinely boring until drowsiness returns. It feels wasteful at 3 a.m. But it retrains the oldest part of your brain to associate the bed with sleep instead of with lying awake doing maths and dreading the morning.",
      },
      {
        type: "quote",
        text: "Your body knows how to sleep. The work is removing what you've stacked on top of that knowledge.",
      },
      {
        type: "p",
        text: "The other levers are unglamorous: a fixed wake time (yes, weekends too — it's the anchor everything else hangs from), daylight in the first hour of the morning, caffeine ending by early afternoon, and the phone charging outside arm's reach. None of these works in three days. All of them together, held for a few weeks, work better than almost anything sold to you as a sleep hack.",
      },
      {
        type: "p",
        text: "And if your 3 a.m. mind isn't anxious about sleep, but about everything else — work, money, family, a spiralling replay of the day — then sleep isn't really the problem. It's the messenger. That's a conversation worth having with a professional, in daylight hours, when you can actually do something about it.",
      },
    ],
  },
  {
    slug: "talking-to-parents-about-therapy",
    title: "How to talk to your parents about going to therapy",
    excerpt:
      "For many Indian families, therapy still translates to 'something is seriously wrong.' A script-free guide to having the conversation — or choosing, validly, not to.",
    category: "Relationships",
    readTime: "6 min read",
    date: "2026-03-05",
    displayDate: "5 March 2026",
    cover:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=80",
    deva: "परिवार",
    coverAlt: "A family having tea together at a kitchen table",
    author: { name: "Sana Qureshi", role: "Clinical Psychologist" },
    takeaways: [
      "If you're an adult, you don't need permission. Telling them months later, or never, is a legitimate choice rather than a betrayal.",
      "Fear often comes out sounding like judgement — for a generation whose only visible mental health care was the psychiatric hospital.",
      "Translate before you explain. “I'm talking to a specialist about stress, like seeing a doctor for your knee” lands differently from a diagnosis.",
    ],
    tool: {
      href: "/match",
      label: "Find your therapist",
      note: "Quietly, on your own terms — sessions are confidential and nobody else is told.",
    },
    content: [
      {
        type: "p",
        text: "First, the part nobody says clearly: if you're an adult, you don't need permission. Therapy at Emoraa is confidential, you can pay for it yourself, and 'my parents wouldn't understand' is a reason to plan the conversation carefully — not a reason to deny yourself help. Plenty of our clients tell their families months later, or never. That's a legitimate choice, not a betrayal.",
      },
      {
        type: "p",
        text: "But many people want their parents to know, because hiding something this important feels like distance. If that's you, it helps to understand what the word 'therapy' triggers for a generation that grew up when the only visible mental health care was psychiatric hospitals. They're often not judging you. They're frightened for you, and fear comes out sounding like judgement.",
      },
      { type: "h2", text: "Translate it into their language" },
      {
        type: "p",
        text: "Skip the clinical vocabulary on the first pass. 'I've been feeling very stressed and I'm talking to a specialist about it, the way you'd see a doctor for your knee' lands differently from 'I have an anxiety disorder.' Lead with the outcome they care about — you're taking care of yourself, you're being responsible — and let the details follow over weeks, not in one sitting.",
      },
      {
        type: "quote",
        text: "You're not asking for their approval. You're offering them information about someone they love.",
      },
      {
        type: "p",
        text: "Expect the classic responses and don't take the bait: 'But what is there to be sad about?' isn't an argument, it's bewilderment. 'We never needed this in our time' usually means 'we never had this in our time.' You can answer both with the same calm sentence: 'Maybe, but this is helping me.' Repetition, without escalation, does more than the perfect rebuttal.",
      },
      {
        type: "p",
        text: "And sometimes the conversation goes better than the one you rehearsed. A surprising number of parents respond, after the initial wobble, with some version of 'I wish this had existed for me.' Occasionally they ask a quiet follow-up question a few weeks later — about themselves. Be ready for that one. It's a door opening.",
      },
    ],
  },
  {
    slug: "quiet-cost-of-the-sorted-friend",
    title: "The quiet cost of being the 'sorted' friend",
    excerpt:
      "Everyone brings you their crises. You bring yours nowhere. On the helpers who never get helped, and what happens when the strong one finally sits down.",
    category: "Anxiety",
    readTime: "5 min read",
    date: "2026-02-12",
    displayDate: "12 February 2026",
    cover:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&q=80",
    deva: "मुखौटा",
    coverAlt: "Two friends talking on a bench in golden evening light",
    author: { name: "Ananya Iyer", role: "Clinical Psychologist" },
    takeaways: [
      "The role has a clause written in invisible ink: your problems have nowhere to go, because the friendship circuits all run one direction.",
      "It usually gets assigned early — the responsible eldest, the calm one during family turbulence — until competence becomes the price of belonging.",
      "One experiment this week: when a close friend asks how you are, answer with one true sentence before redirecting. Just one.",
    ],
    tool: {
      href: "/check-in",
      label: "Mood check-in",
      note: "Nobody has asked you properly in a while. Four questions, two minutes, no audience.",
    },
    content: [
      {
        type: "p",
        text: "You're the one people call at midnight. The one who knows what to say after a breakup, who talks the group through every crisis, whose advice is so reliable that nobody thinks to ask how you are. And on the rare occasion someone does ask, you have a reflex answer ready before the question finishes: 'I'm good, yaar. Tell me about you.'",
      },
      {
        type: "p",
        text: "Being the sorted friend is a real role with real rewards — you're needed, trusted, central. But it has a clause written in invisible ink: you can't have problems, because your problems have nowhere to go. The friendship circuits all run one direction. Over years, this produces a specific kind of loneliness: surrounded, loved, and completely unheld.",
      },
      { type: "h2", text: "How helpers get stuck" },
      {
        type: "p",
        text: "Often the role was assigned early — the responsible eldest child, the calm one during family turbulence — and you got so skilled at it that it became your personality's load-bearing wall. Competence became the price of belonging. So now, struggling doesn't just feel bad; it feels like breach of contract.",
      },
      {
        type: "quote",
        text: "The strong friend doesn't need to become weak. They need one place where strength isn't the entry fee.",
      },
      {
        type: "p",
        text: "This is, quietly, one of the most common profiles in any therapy practice: the person everyone leans on, finally sitting in the one room where leaning back is the whole point. The early sessions are often funny and a little awkward — helpers instinctively try to take care of the therapist, ask about their day, apologise for 'rambling.' Then, somewhere around session three or four, the actual exhale happens.",
      },
      {
        type: "p",
        text: "If you recognise yourself here, try one small experiment this week: when a close friend asks how you are, answer with one true sentence before redirecting. Just one. Watch what happens. The people worth keeping will lean in — they've been waiting for a turn to hold something for you.",
      },
    ],
  },
  {
    slug: "therapy-in-hindi-without-translating-yourself",
    title: "Therapy in Hindi: what changes when you stop translating yourself",
    excerpt:
      "Sometimes the English word is accurate but the Hindi one is true. Why language fit can change the pace, texture, and honesty of therapy.",
    category: "Self-care",
    readTime: "6 min read",
    date: "2026-08-20",
    displayDate: "20 August 2026",
    cover:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=80",
    deva: "अपनी भाषा",
    coverAlt: "A person listening thoughtfully during a quiet conversation",
    author: { name: "Ananya Iyer", role: "Clinical Psychologist" },
    takeaways: [
      "Language fit is not about speaking perfectly; it is about reaching the words that carry the most meaning for you.",
      "Hinglish is welcome. A useful session can move between languages as naturally as your thoughts do.",
      "Language is one part of fit alongside trust, therapeutic approach, experience, availability, and cost.",
    ],
    tool: {
      href: "/therapy/hindi",
      label: "Explore therapy in Hindi",
      note: "Meet psychologists who list Hindi and learn how online sessions work.",
    },
    content: [
      { type: "p", text: "You can explain a difficult week in polished English and still feel that the real thing never entered the room. Then one Hindi phrase slips out — the one your family uses, the one that carries twenty years of context — and suddenly the conversation is closer to the truth." },
      { type: "p", text: "This does not mean therapy only works in a first language. It means language is part of emotional access. We often learn professional vocabulary in English and intimate vocabulary at home. Anxiety may be a useful label; ghabrahat may describe how it actually lives in the body." },
      { type: "h2", text: "You do not have to choose one language" },
      { type: "p", text: "Many sessions move naturally between Hindi and English. A sentence can begin in one and end in the other. There is no prize for consistency, and a therapist who works bilingually should not make you stop and translate every turn of phrase." },
      { type: "quote", text: "The useful language is the one in which you can be least edited." },
      { type: "h2", text: "Language fit is not the whole fit" },
      { type: "p", text: "A shared language can make the door easier to open, but what happens after that still depends on trust, skill, pace, and approach. Look at a psychologist's specialties and experience too. In the first session, notice whether you feel understood rather than merely understood literally." },
      { type: "p", text: "If you have been postponing therapy because explaining your family or your feelings in English sounds exhausting, ask directly for Hindi. You are not making the work less professional. You are making it more available to you." },
    ],
  },
  {
    slug: "sunday-scaries-and-work-anxiety",
    title: "When Sunday evening already feels like Monday",
    excerpt:
      "The inbox is closed, but your body has started the workweek early. A practical look at anticipatory work anxiety and how to interrupt it.",
    category: "Workplace",
    readTime: "7 min read",
    date: "2026-08-06",
    displayDate: "6 August 2026",
    cover:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
    deva: "रविवार",
    coverAlt: "An empty office with warm light at the end of the day",
    author: { name: "Arjun Mehta", role: "Counselling Psychologist" },
    takeaways: [
      "Sunday anxiety is often anticipation, not evidence that you are failing at rest.",
      "A short closing ritual on Friday can reduce the unfinished loops your mind carries into the weekend.",
      "If dread is persistent, physical, or changing how you sleep and function, it deserves more than productivity advice.",
    ],
    tool: {
      href: "/tools/journal",
      label: "Put the worry down",
      note: "A private local journal for naming the thought your mind keeps reopening.",
    },
    content: [
      { type: "p", text: "It often arrives around sunset: a small drop in the stomach, the urge to check email, the mental replay of everything waiting tomorrow. Nothing has happened yet, but your nervous system has clocked in. By bedtime, Sunday has become a rehearsal for Monday." },
      { type: "p", text: "Anticipatory anxiety tries to create safety by thinking ahead. It scans for unfinished work, difficult conversations, and possible mistakes. The trouble is that scanning feels productive while keeping the body in a state where rest becomes almost impossible." },
      { type: "h2", text: "Close the loops you can close" },
      { type: "p", text: "Before ending work on Friday, write three lines: what is finished, what is waiting, and the first concrete action for Monday. The list is not a weekend plan. It is a receipt for your brain that the work has somewhere to live besides memory." },
      { type: "quote", text: "Rest does not begin when every task is finished. It begins when unfinished tasks have a trusted place to wait." },
      { type: "h2", text: "Give Sunday a boundary" },
      { type: "p", text: "If checking Monday's calendar helps, choose one ten-minute window and stop when it ends. Pair it with something sensory and present: tea on the balcony, a shower, a walk without a podcast. The aim is not to force calm. It is to give your body evidence that this hour is not the office." },
      { type: "p", text: "Persistent dread can also be useful information. If work anxiety regularly takes your sleep, appetite, relationships, or whole weekend, the answer may not be a better routine. Therapy can help separate what can be changed inside your patterns from what needs to change in the job itself." },
    ],
  },
  {
    slug: "how-to-support-a-friend-starting-therapy",
    title: "How to support a friend who is starting therapy",
    excerpt:
      "You do not need the perfect advice. You need curiosity, steadiness, and the discipline not to make their therapy about your questions.",
    category: "Relationships",
    readTime: "5 min read",
    date: "2026-07-23",
    displayDate: "23 July 2026",
    cover:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
    deva: "साथ",
    coverAlt: "Friends sitting together and talking outdoors",
    author: { name: "Dr. Kabir Shah", role: "Counselling Psychologist" },
    takeaways: [
      "Ask what kind of support they want instead of assuming they need advice or details questioned out of them.",
      "Do not ask for a session report. Privacy helps therapy become a place where honesty is possible.",
      "Practical support — a reminder, a quiet room, a walk afterward — often matters more than a perfect sentence.",
    ],
    tool: {
      href: "/blog/your-first-therapy-session",
      label: "Understand the first session",
      note: "A plain-language walkthrough you can read or share without turning it into pressure.",
    },
    content: [
      { type: "p", text: "When a friend says they are starting therapy, the instinct is often to become useful immediately: recommend a therapist, ask what happened, promise that everything will get better. Good intentions can accidentally turn a vulnerable disclosure into another conversation they have to manage." },
      { type: "p", text: "Begin smaller. 'I'm glad you told me' is enough. Then ask, 'Do you want me to listen, help with something practical, or leave it with you for now?' The question gives control back to the person whose life is being discussed." },
      { type: "h2", text: "Let the session stay theirs" },
      { type: "p", text: "After an appointment, avoid asking what they talked about unless they invite the question. Try: 'How are you feeling after it?' or 'Do you want company?' Therapy can stir up relief, tiredness, uncertainty, or nothing dramatic at all. None of these reactions needs to be corrected." },
      { type: "quote", text: "Support is not access. You can be close to someone without being entitled to the contents of their healing." },
      { type: "h2", text: "Help with ordinary things" },
      { type: "p", text: "The most useful support may be unremarkable: lending headphones, making space in a shared flat, taking a walk afterward, or not teasing them about 'what the therapist said.' Consistency communicates safety better than one intense conversation." },
      { type: "p", text: "And remember the boundary in the other direction. You are their friend, not their emergency service or therapist. If they may be in immediate danger, involve crisis support rather than carrying the situation alone. Care and limits belong in the same relationship." },
    ],
  },
];

/** Stable anchor id for an h2, so the contents list and the prose agree. */
export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function headingsOf(post: Post) {
  return post.content
    .filter((b): b is { type: "h2"; text: string } => b.type === "h2")
    .map((b) => ({ id: headingId(b.text), text: b.text }));
}

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

export const categories = [
  "All",
  "Anxiety",
  "Relationships",
  "Student Life",
  "Workplace",
  "Self-care",
] as const;
