export type ServiceDetail = {
  introduction: string;
  forWhom: string[];
  process: Array<{ title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
};

export const serviceDetails: Record<string, ServiceDetail> = {
  "individual-therapy": {
    introduction:
      "Individual therapy is a private, recurring conversation with one psychologist. You can arrive with a clear concern or only the sense that something has felt off for a while. The first session is for understanding what is happening and whether the therapist feels like the right fit.",
    forWhom: [
      "Anxiety, overthinking, panic, low mood, grief, or difficulty sleeping",
      "Work pressure, burnout, confidence, identity, or a major life transition",
      "Anyone who wants a confidential place to understand recurring patterns",
    ],
    process: [
      { title: "Begin with context", body: "Your therapist asks what has been difficult, what your days look like, and what you want to change. You do not need a diagnosis or a prepared story." },
      { title: "Agree on a direction", body: "Together you choose a practical focus. That may include understanding triggers, building coping skills, or changing a pattern that keeps repeating." },
      { title: "Review as you go", body: "Therapy is collaborative. You can discuss pace, what is useful, what is not, and whether a different therapist or approach would serve you better." },
    ],
    faqs: [
      { q: "How often should I attend?", a: "Many people begin weekly or fortnightly, then adjust with their therapist. There is no subscription and no fixed minimum." },
      { q: "Do I need to know what is wrong?", a: "No. Feeling overwhelmed, stuck, or unlike yourself is enough reason to begin a conversation." },
      { q: "Can I change therapists?", a: "Yes. Fit matters, and choosing someone else is a normal part of finding useful care." },
    ],
  },
  "couples-counseling": {
    introduction:
      "Couples counselling creates a structured conversation where both partners can be heard without the session becoming another argument. It supports married, unmarried, queer, long-distance, and separated partners without deciding who is right.",
    forWhom: [
      "Recurring conflict, emotional distance, trust ruptures, or communication fatigue",
      "Couples navigating marriage, parenting, relocation, family pressure, or separation",
      "Partners who want preventive support before a problem becomes a crisis",
    ],
    process: [
      { title: "Hear both stories", body: "The counsellor maps the cycle between you rather than assigning blame to one person." },
      { title: "Slow the pattern", body: "Sessions identify what happens beneath familiar arguments and practise safer ways to respond." },
      { title: "Carry it home", body: "You leave with small, specific experiments for communication, boundaries, repair, or decision-making." },
    ],
    faqs: [
      { q: "Do both partners need to attend?", a: "Joint attendance is usually best. A counsellor may suggest individual check-ins when they support the shared work." },
      { q: "Will the counsellor take sides?", a: "The work focuses on the relationship pattern and each person's safety, needs, and choices, not on declaring a winner." },
      { q: "Is counselling only for relationships in crisis?", a: "No. Many couples come before marriage or during a transition because they want stronger ways to communicate." },
    ],
  },
  "student-support": {
    introduction:
      "Student support is therapy shaped around the realities of study in India: exams, entrances, placements, family expectations, comparison, sleep loss, and the uncertainty of what comes next.",
    forWhom: [
      "School, college, and postgraduate students dealing with pressure or burnout",
      "Students experiencing exam anxiety, procrastination, poor sleep, or loss of confidence",
      "Young adults balancing independence with family expectations",
    ],
    process: [
      { title: "Make the pressure specific", body: "The first conversation separates workload, fear, family pressure, sleep, and self-worth so they can be handled one at a time." },
      { title: "Build usable skills", body: "Sessions may cover grounding, realistic planning, recovery after setbacks, and ways to communicate needs at home." },
      { title: "Protect confidentiality", body: "For adult students, sessions are private. Parent involvement happens only with consent, except where safety requires action." },
    ],
    faqs: [
      { q: "Is this only for exam stress?", a: "No. Students also bring loneliness, relationships, identity, motivation, family conflict, and decisions about work or further study." },
      { q: "Will my parents be told?", a: "Adult sessions are confidential. If you are under 18, the therapist explains consent and confidentiality boundaries before beginning." },
      { q: "Can therapy help if the exam is very close?", a: "It cannot replace preparation, but it can help reduce panic, protect sleep, and make the remaining time more workable." },
    ],
  },
  "group-sessions": {
    introduction:
      "A therapy group brings a small number of people together around one shared experience. A trained facilitator protects the structure so participants can speak, listen, and discover that their struggle is not uniquely theirs.",
    forWhom: [
      "People who benefit from shared experience alongside professional facilitation",
      "Themes such as grief, anxiety, new parenthood, loneliness, or life transitions",
      "Anyone seeking a lower-cost way to begin structured emotional support",
    ],
    process: [
      { title: "Start with fit", body: "A brief conversation checks whether the group's theme and format match what you need right now." },
      { title: "Agree on safety", body: "The facilitator establishes confidentiality, respectful participation, and what to do if someone needs individual support." },
      { title: "Participate at your pace", body: "You are invited to contribute, but listening is also participation, especially in the first sessions." },
    ],
    faqs: [
      { q: "Do I have to speak in the first session?", a: "No. You can listen while you understand the group and join the conversation when you feel ready." },
      { q: "Is a group confidential?", a: "Every participant agrees to confidentiality. The facilitator explains its limits and reinforces the agreement throughout the group." },
      { q: "Can group therapy replace individual therapy?", a: "Sometimes it is enough; sometimes it complements individual care. The initial fit conversation helps decide." },
    ],
  },
  "psychiatry-medication": {
    introduction:
      "A psychiatrist is a medical doctor who can assess whether medication would help, prescribe it, and review how it is working. Seeing one is not a verdict on how bad things are, and it does not replace therapy — for many people the two run alongside each other, with medication making the days workable enough to do the rest.",
    forWhom: [
      "Persistent low mood, anxiety or panic that has not shifted with therapy alone",
      "Sleep that has broken down, or appetite and energy that have changed markedly",
      "Anyone already on medication who wants a careful second opinion or a dose review",
    ],
    process: [
      { title: "Assessment", body: "A detailed history: what you are experiencing, for how long, what you have already tried, and what else is going on medically. Nothing is prescribed in the first ten minutes." },
      { title: "A recommendation, with reasons", body: "The psychiatrist explains whether medication is indicated, what it would and would not do, the likely side effects, and what happens if you would rather not. Declining is a real option." },
      { title: "Review", body: "If you start something, follow-ups check how it is working and adjust. Coming off, when the time comes, is planned rather than abrupt." },
    ],
    faqs: [
      { q: "Will I be put on medication straight away?", a: "No. Plenty of consultations end with a recommendation for therapy, sleep work, or simply a review in a few weeks. Medication is prescribed when it is likely to help, not by default." },
      { q: "Can I see a psychiatrist and a therapist?", a: "Yes, and it is common. With your consent the two coordinate, so you are not repeating your history or getting conflicting advice." },
      { q: "Is 30 minutes enough?", a: "For a first assessment it is the standard length, and longer slots are arranged when the picture is complex. Reviews are usually shorter." },
    ],
  },
  "daily-life-stress": {
    introduction:
      "Not every difficulty is a disorder. The commute, the deadlines, the family calls, the money, the sense of being permanently a step behind — none of it is a crisis, and all of it accumulates. This is short, practical work for the pressure that never quite becomes an emergency.",
    forWhom: [
      "Anyone carrying a workload or a home life that has stopped feeling sustainable",
      "Overthinking, irritability, Sunday dread, or sleep that has become unreliable",
      "People who feel they are not unwell enough to deserve support — you are",
    ],
    process: [
      { title: "Name what is actually heavy", body: "Most people arrive saying everything is fine but exhausting. The first session separates the strands so there is something specific to work on." },
      { title: "Change something small", body: "Practical adjustments to sleep, boundaries, workload, and the loops that run at 2 a.m. Small changes that hold beat large ones that do not." },
      { title: "Check whether it is working", body: "This is designed to be short. Many people need four to six sessions, and your therapist will say so rather than book you indefinitely." },
    ],
    faqs: [
      { q: "Is this really therapy?", a: "It is therapy with a narrow, practical focus. The same licensed psychologists and the same confidentiality, aimed at everyday load rather than a diagnosis." },
      { q: "How many sessions will I need?", a: "Often four to six. If something deeper is going on, your therapist will tell you and help you move to the right format." },
      { q: "Can I book in the evening?", a: "Yes. Evening and weekend slots exist precisely because this is the pressure that shows up after work." },
    ],
  },
  "career-counselling": {
    introduction:
      "Career counselling here is not an aptitude test and a printout. It is a structured conversation about what you want from work, what is genuinely stopping you, and how much of the pressure you are feeling belongs to you rather than to somebody else's plan for you.",
    forWhom: [
      "Students choosing a stream, a course, or a first job",
      "Professionals weighing a switch, a break, or whether the burnout is the job or the field",
      "Anyone whose career decisions are being made in a room full of other people's expectations",
    ],
    process: [
      { title: "What you are actually choosing between", body: "Options get written down honestly, including the ones you have not said aloud. Constraints — money, family, location, a visa — are treated as real." },
      { title: "The part that is fear", body: "Separating a bad fit from imposter feelings, and a genuine risk from a catastrophic story about risk. The two need different responses." },
      { title: "A next step you will actually take", body: "You leave with something concrete and small enough to do this month, not a five-year plan that dies in a week." },
    ],
    faqs: [
      { q: "Do you do aptitude testing?", a: "Only where it genuinely adds something, and never as the whole answer. A test can narrow options; it cannot tell you what you value." },
      { q: "Can you help with family pressure?", a: "That is often most of the work. Your counsellor treats family expectation as part of the problem to work with, not an obstacle to dismiss." },
      { q: "Is this different from a career coach?", a: "Yes. This is a licensed psychologist, so where the block is anxiety, burnout or self-worth, that can be worked on directly rather than routed around." },
    ],
  },
  "love-life-counselling": {
    introduction:
      "For the part of your love life you are working through by yourself. Your partner does not need to attend, or to know. This is one-on-one work on what you want, what keeps repeating, and what you are willing to accept — whether the relationship in question is ongoing, ending, or has not started.",
    forWhom: [
      "Breakups, situationships, and relationships nobody else is taking seriously",
      "Dating fatigue, repeated patterns, jealousy, or the aftermath of infidelity",
      "Arranged-marriage pressure, and wanting someone your family has not agreed to",
    ],
    process: [
      { title: "The actual situation", body: "Told once, in full, to someone with no stake in the outcome and no opinion about who you should be with." },
      { title: "The pattern underneath", body: "What keeps recurring across relationships, and which parts of it are yours to change. This is where one-on-one work does what couples work cannot." },
      { title: "What you will and will not accept", body: "Ending with something you can hold onto when the conversation gets hard, or when the phone lights up at midnight." },
    ],
    faqs: [
      { q: "Can I come without my partner?", a: "Yes, and most people do. This format is designed for exactly that." },
      { q: "What if we later want to come together?", a: "Then couples counselling is the right format, and we can move you — usually to a different counsellor, so nobody feels the therapist has already taken a side." },
      { q: "Will I be told to leave?", a: "No. Your counsellor helps you see the situation clearly and decide for yourself, rather than delivering a verdict on your relationship." },
    ],
  },
  "family-therapy": {
    introduction:
      "The Indian family is close, and closeness is not the same as ease. Family therapy brings two or more members into the same room with someone whose responsibility is the relationship rather than any one person's case. Nobody is put on trial, and the aim is not for somebody to win.",
    forWhom: [
      "Adult children and parents who cannot get through a conversation intact",
      "Sibling conflict, in-law tension, or a family adjusting after illness, loss or separation",
      "Households where one person's difficulty has quietly become everybody's",
    ],
    process: [
      { title: "Everyone is heard once, properly", body: "The first session gives each person uninterrupted time. For many families it is the first such conversation in years." },
      { title: "The pattern, not the culprit", body: "Attention moves from who started it to how the sequence repeats, which is the part that can actually be changed." },
      { title: "Agreements that survive the week", body: "Small, specific changes that hold outside the room, reviewed honestly at the next session." },
    ],
    faqs: [
      { q: "Does everyone have to attend?", a: "No. Useful work happens with whoever is willing. Some members join for a session or two, and individual check-ins alongside are common." },
      { q: "Will the therapist take sides?", a: "No. If you want somebody in your corner, individual therapy is the right format, and your therapist will say so." },
      { q: "Can this be done online?", a: "Yes, including with members in different cities, which is often the only way to get everyone in one room." },
    ],
  },
  "lgbtqia-affirmative": {
    introduction:
      "Affirmative therapy starts from the position that your identity is not the problem. Being queer, trans, non-binary, asexual or questioning is not something to be treated — what may need attention is everything the world stacks on top of it. Several of our counsellors are from the community, and all of them are trained in affirmative practice.",
    forWhom: [
      "Anyone navigating coming out, a family reaction, or deciding not to come out yet",
      "Gender identity, transition, and the medical and legal paperwork around it",
      "Minority stress, isolation, and relationships that have to be kept partly hidden",
    ],
    process: [
      { title: "Your terms", body: "You set the language for your own identity and relationships. Nobody is going to correct your vocabulary or ask you to justify it." },
      { title: "The real pressures", body: "Family, work, safety, housing, and the daily cost of deciding who to be out to. Practical as well as emotional." },
      { title: "Support that keeps up", body: "As things change — coming out, transition, a new relationship, a family rupture — the work changes with them." },
    ],
    faqs: [
      { q: "Do you offer conversion therapy?", a: "Never. It is unethical, it causes documented harm, and it is prohibited in India. No therapist offering it would be practising here." },
      { q: "Will my therapist actually understand?", a: "Counsellors on this service are trained in affirmative practice and several are from the community. If the fit is not right, tell us and we will move you." },
      { q: "Is it confidential from my family?", a: "Yes. Sessions are confidential, and nothing about your identity reaches anyone — including a family member who may be paying." },
    ],
  },
};