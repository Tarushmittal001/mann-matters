export type ServiceDetail = {
  introduction: string;
  forWhom: string[];
  process: Array<{ title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
};

export const serviceDetails: Record<string, ServiceDetail> = {
  "teen-therapy": {
    introduction:
      "Teen therapy is a confidential hour for someone aged 13 to 17, with a psychologist who works with this age group. A parent or guardian agrees to the sessions before the first one, and is told about direction and progress — never about what was said.",
    forWhom: [
      "Exam pressure, comparison, friendship trouble, or a mood that has changed and stayed changed",
      "Teenagers who have stopped talking at home and need somewhere that is theirs",
      "Parents who are worried and unsure whether this is ordinary teenage weather",
    ],
    process: [
      { title: "Consent, then privacy", body: "A guardian consents at booking. In the first minutes, the therapist explains to both what stays private and the one exception: a serious risk to safety is always shared." },
      { title: "Their hour, their pace", body: "No diagnosis, no lecture. The therapist follows what the teenager actually wants to talk about, which is rarely what the referral form said." },
      { title: "Parents kept in the loop", body: "You hear how it is going and what would help at home, without the contents of the session being repeated to you." },
    ],
    faqs: [
      { q: "Will you tell me what my child said?", a: "No, and that is what makes it work. You will hear the direction of the work, any concerns about safety, and what would help at home." },
      { q: "Does my child have to want this?", a: "It helps enormously. A teenager dragged to therapy will usually sit it out. One session to meet the therapist, with no commitment, is often the way in." },
      { q: "What if my child is not safe?", a: "Risk to their safety is the one thing always shared with you, immediately, along with a plan." },
    ],
  },
  "parent-coaching": {
    introduction:
      "Parent coaching is for the adult. You bring the situation at home and leave with something to try. The exact words to use. A limit you can hold. Or a clearer idea of whether your child needs their own support.",
    forWhom: [
      "Parents of teenagers who have gone quiet, angry, or withdrawn",
      "Exam years, phone battles, and arguments that keep replaying",
      "Anyone unsure whether to worry, wait, or find their child a therapist",
    ],
    process: [
      { title: "What actually happens", body: "You describe a recent scene in detail rather than in general, because the change is usually in the detail." },
      { title: "Something to say", body: "You practise the opening lines, so the next conversation starts somewhere other than where the last one ended." },
      { title: "Decide together", body: "If your child would be better served by their own therapist, you will be told plainly, and helped to raise it with them." },
    ],
    faqs: [
      { q: "Does my child need to come?", a: "No. This is your session. Many parents come without their child knowing." },
      { q: "Is this therapy or advice?", a: "Practical coaching, grounded in clinical practice. If what emerges is really about you, your therapist will say so and offer the right route." },
      { q: "Can both parents attend?", a: "Yes, and it often helps when you are pulling in different directions." },
    ],
  },
  "sleep-programme": {
    introduction:
      "Cognitive behavioural therapy for insomnia is the treatment recommended before sleeping pills. It runs as a course of six sessions: measure, reset the schedule, treat the anxiety about sleeping, then keep the gains.",
    forWhom: [
      "Trouble falling asleep, waking at 3 a.m., or lying awake dreading the alarm",
      "Anyone relying on sleeping pills who wants to need them less",
      "Sleep that broke during a difficult period and never came back",
    ],
    process: [
      { title: "Two weeks of truth", body: "A sleep diary shows the real pattern, which is almost never the remembered one." },
      { title: "Rebuild the night", body: "Your hours in bed are reset to match the hours you actually sleep, then widened as sleep consolidates. This is the part that works and the part that is hard." },
      { title: "Quiet the 3 a.m. mind", body: "Work on the worry about not sleeping, which by now keeps you awake more reliably than whatever started it." },
    ],
    faqs: [
      { q: "Why six sessions?", a: "That is what the protocol takes. Most people notice a change in three to four weeks, and the last sessions are about keeping it." },
      { q: "Do I have to stop my sleeping pills?", a: "Not to begin. Coming off them is a decision with the doctor who prescribed them, and this programme makes it more achievable." },
      { q: "Will I sleep worse at first?", a: "Often, briefly. Restricting time in bed is tiring before it works, which is why you do it with someone." },
    ],
  },
  "grief-loss": {
    introduction:
      "Grief therapy is time that belongs only to the loss. Not to move on from someone, but to be able to carry them and still live. That includes the parts of grief nobody at home wants to hear.",
    forWhom: [
      "A death, a diagnosis, a miscarriage, a marriage ending, a home left behind",
      "Grief that arrives late, or long after everyone else has moved on",
      "Feelings that feel wrong to say aloud: relief, anger, guilt",
    ],
    process: [
      { title: "Say it once, fully", body: "Somewhere the story can be told without managing anyone else's reaction, and without a time limit on how long it takes." },
      { title: "The complicated parts", body: "Relief that it is over. Anger at the person who died. Guilt about what was never said. All of it belongs in the room." },
      { title: "Carrying them", body: "Working out what continuing looks like, including the firsts: the birthday, the festival, the anniversary." },
    ],
    faqs: [
      { q: "How long after a loss should I come?", a: "Whenever it is heavy. A week later or eleven years later are both reasonable." },
      { q: "Is grief the same as depression?", a: "No, though they can overlap. Part of this work is telling them apart, because depression needs its own treatment." },
      { q: "What if I cannot talk about it yet?", a: "Then you do not have to. Sitting with someone who is not waiting for you to be alright is itself the beginning." },
    ],
  },
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
      "Student support is therapy shaped around what studying in India is actually like. Exams, entrances, placements, family expectations, comparison, lost sleep, and not knowing what comes next.",
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
      "A therapy group brings a small number of people together around one shared experience. A trained therapist keeps the structure safe, so everyone can speak, listen, and find that their struggle is not theirs alone.",
    forWhom: [
      "People who find it helps to share an experience, with a professional in the room",
      "Themes such as grief, anxiety, new parenthood, loneliness, or life transitions",
      "Anyone seeking a lower-cost way to begin structured emotional support",
    ],
    process: [
      { title: "Start with fit", body: "A brief conversation checks whether the group's theme and format match what you need right now." },
      { title: "Agree on safety", body: "The therapist sets out what stays private, how to treat each other, and what to do if someone needs one-to-one support." },
      { title: "Participate at your pace", body: "You are invited to contribute, but listening is also participation, especially in the first sessions." },
    ],
    faqs: [
      { q: "Do I have to speak in the first session?", a: "No. You can listen while you understand the group and join the conversation when you feel ready." },
      { q: "Is a group confidential?", a: "Everyone in the group agrees to keep it private. The therapist explains the limits of that, and reminds the group throughout." },
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
      { title: "A recommendation, with reasons", body: "The psychiatrist tells you whether medication would help, what it would and would not do, and the side effects you might get. They also explain what happens if you would rather not take it. Saying no is a real option." },
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
      "Not every difficulty is a disorder. The commute, the deadlines, the family calls, the money, the feeling of always being a step behind. None of it is a crisis, and all of it adds up. This is short, practical work for pressure that never quite becomes an emergency.",
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
      { q: "Is this really therapy?", a: "It is therapy with a narrow, practical focus. The same certified psychologists and the same confidentiality, aimed at everyday load rather than a diagnosis." },
      { q: "How many sessions will I need?", a: "Often four to six. If something deeper is going on, your therapist will tell you and help you move to the right format." },
      { q: "Can I book in the evening?", a: "Yes. Evening and weekend slots exist precisely because this is the pressure that shows up after work." },
    ],
  },
  "career-counselling": {
    introduction:
      "Career counselling here is not an aptitude test and a printout. It is a structured conversation about what you want from work. What is really stopping you. And how much of the pressure you feel is yours, rather than someone else's plan for you.",
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
      { q: "Is this different from a career coach?", a: "Yes. You are seeing a certified psychologist. So if anxiety, burnout or low self-worth is what is holding you back, you can work on that directly." },
    ],
  },
  "love-life-counselling": {
    introduction:
      "For the part of your love life you are working through alone. Your partner does not need to attend, or to know. This is one-to-one work on what you want, what keeps repeating, and what you are willing to accept. The relationship can be ongoing, ending, or not started yet.",
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
      { q: "What if we later want to come together?", a: "Then couples counselling is the right fit, and we can move you across. Usually to a different counsellor, so neither of you feels the therapist has already picked a side." },
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
      "Affirmative therapy starts from the position that your identity is not the problem. Being queer, trans, non-binary, asexual or questioning is not something to be treated. What may need attention is everything the world stacks on top of it. Several of our counsellors are from the community, and all of them are trained in affirmative practice.",
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