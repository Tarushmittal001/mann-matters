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
  "corporate-wellness": {
    introduction:
      "Workplace mental-health programs should make support easier to reach without turning private conversations into an HR data stream. Emoraa combines confidential sessions, practical workshops, and clear escalation paths for organisations in India.",
    forWhom: [
      "Teams experiencing burnout, rapid growth, restructuring, or sustained workload pressure",
      "People leaders who need practical skills for difficult and supportive conversations",
      "Organisations seeking confidential support with useful, anonymised program insight",
    ],
    process: [
      { title: "Design the access model", body: "We agree eligibility, session allowances, communication, escalation, and privacy boundaries before launch." },
      { title: "Launch quietly", body: "Employees receive a direct confidential route to care without asking a manager for permission." },
      { title: "Learn without identifying", body: "Program reporting stays aggregated and avoids exposing who attended or what anyone discussed." },
    ],
    faqs: [
      { q: "Does HR see who attends therapy?", a: "No individual attendance or session content is shared. Any organisational reporting is aggregated and designed to protect privacy." },
      { q: "Can the program include workshops?", a: "Yes. Programs can combine individual sessions with workshops for employees and practical training for managers." },
      { q: "How quickly can a program begin?", a: "A focused program can usually be scoped and prepared within two weeks after commercial and privacy requirements are agreed." },
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
};