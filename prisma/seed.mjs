import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* ──────────────────────────────────────────────────────────────────────────
   1. Admin
   ────────────────────────────────────────────────────────────────────────── */

const adminEmail = process.env.ADMIN_EMAIL || "admin@mannmatters.in";
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error("ADMIN_PASSWORD is not set — add it to .env before seeding.");
  process.exit(1);
}

await prisma.user.upsert({
  where: { email: adminEmail },
  update: {
    passwordHash: await bcrypt.hash(adminPassword, 10),
    role: "ADMIN",
    emailVerified: new Date(),
  },
  create: {
    name: "mann Matters Admin",
    email: adminEmail,
    passwordHash: await bcrypt.hash(adminPassword, 10),
    role: "ADMIN",
    emailVerified: new Date(),
  },
});

console.log(`Admin account ready: ${adminEmail}`);

/* ──────────────────────────────────────────────────────────────────────────
   2. Practitioners

   lib/experts.ts stays the source of truth for the public catalogue; this is
   the private side of the same six people. `notesPolicy` is spread across its
   three values on purpose, so the portal's policy gate can be seen working
   without editing the database by hand.
   ────────────────────────────────────────────────────────────────────────── */

const expertPassword = process.env.EXPERT_PASSWORD;

const practitioners = [
  {
    id: "ananya-iyer",
    name: "Ananya Iyer",
    credentials: "M.Phil. Clinical Psychology, RCI Licensed",
    years: 9,
    languages: ["English", "Hindi", "Tamil"],
    specialties: ["Anxiety", "Workplace stress", "Self-esteem"],
    headline: "CBT for anxiety and workplace stress, in English, Hindi and Tamil.",
    bio: "I work mostly with people whose worry has started running their week — the 2am scroll, the email they read eleven times before sending. We go at your pace, with practical tools you can use the same evening, and no jargon unless you ask for it.",
    notesPolicy: "APPROVED",
  },
  {
    id: "kabir-shah",
    name: "Dr. Kabir Shah",
    credentials: "Ph.D. Counselling Psychology",
    years: 12,
    languages: ["English", "Hindi", "Gujarati"],
    specialties: ["Relationships", "Couples therapy", "Grief"],
    headline: "Twelve years with couples, families, and people carrying a loss.",
    bio: "Most of the couples I see are not fighting about the dishes. We slow the conversation down until both people can hear what the other is actually asking for. I also work with grief, including the kind that arrives years late.",
    notesPolicy: "APPROVED",
  },
  {
    id: "meera-krishnan",
    name: "Meera Krishnan",
    credentials: "M.A. Clinical Psychology",
    years: 7,
    languages: ["English", "Malayalam", "Kannada"],
    specialties: ["Student stress", "Exam anxiety", "Sleep"],
    headline: "Exam pressure, placements, and the sleep that goes with them.",
    bio: "I see a lot of students and first-jobbers: the boards, the entrance, the appraisal that felt like a verdict. Sessions are practical and unhurried, and nothing you say goes home to your parents.",
    notesPolicy: "APPROVED",
  },
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    credentials: "M.Sc. Psychology, Dip. CBT",
    years: 6,
    languages: ["English", "Hindi", "Marathi"],
    specialties: ["Career anxiety", "Burnout", "Life transitions"],
    headline: "Burnout, career anxiety, and the year everything changed at once.",
    bio: "Burnout rarely looks dramatic — it looks like being fine at work and empty at home. We map where your energy is actually going, then rebuild from there.",
    notesPolicy: "PENDING",
  },
  {
    id: "sana-qureshi",
    name: "Sana Qureshi",
    credentials: "M.Phil. Clinical Psychology, RCI Licensed",
    years: 10,
    languages: ["English", "Hindi", "Urdu"],
    specialties: ["Depression", "Family expectations", "Women's mental health"],
    headline: "Depression, family expectation, and women's mental health.",
    bio: "A lot of what I hear is not a diagnosis, it is exhaustion from being what everyone needs. We make room for what you want, and work out what to do with the guilt that follows.",
    notesPolicy: "BLOCKED",
  },
  {
    id: "rohan-nair",
    name: "Rohan Nair",
    credentials: "M.A. Counselling Psychology",
    years: 5,
    languages: ["English", "Malayalam", "Hindi"],
    specialties: ["Sleep", "Anxiety", "Mindfulness-based therapy"],
    headline: "Mindfulness-based work for sleep and anxiety.",
    bio: "I teach the boring, effective things: what to do at 3am, how to get out of a spiral without arguing with it, and how to stop treating rest as a reward you have to earn.",
    notesPolicy: "APPROVED",
  },
];

/** Mon–Fri two blocks, Saturday morning. Everything in clinic time (IST). */
const weeklyHours = [
  ...[1, 2, 3, 4, 5].flatMap((weekday) => [
    { weekday, start: "10:00", end: "13:00" },
    { weekday, start: "15:00", end: "19:00" },
  ]),
  { weekday: 6, start: "10:00", end: "13:00" },
];

if (!expertPassword) {
  console.log("EXPERT_PASSWORD is not set — skipping practitioner accounts.");
} else {
  const passwordHash = await bcrypt.hash(expertPassword, 10);

  for (const p of practitioners) {
    const email = `${p.id}@mannmatters.in`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "EXPERT", emailVerified: new Date() },
      create: {
        name: p.name,
        email,
        passwordHash,
        role: "EXPERT",
        emailVerified: new Date(),
      },
    });

    const profileData = {
      headline: p.headline,
      bio: p.bio,
      credentials: p.credentials,
      experienceYears: p.years,
      languages: JSON.stringify(p.languages),
      specialties: JSON.stringify(p.specialties),
      notesPolicy: p.notesPolicy,
      notesPolicyNote:
        p.notesPolicy === "PENDING"
          ? "Your data-handling agreement is with our clinical governance lead. Notes switch on the day it is countersigned."
          : p.notesPolicy === "BLOCKED"
            ? "Your organisation keeps clinical records in its own system, so notes are off here by agreement."
            : "",
    };

    await prisma.expertProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: { userId: user.id, expertId: p.id, ...profileData },
    });

    const existingHours = await prisma.availabilityRule.count({ where: { expertId: p.id } });
    if (existingHours === 0) {
      await prisma.availabilityRule.createMany({
        data: weeklyHours.map((h) => ({ expertId: p.id, ...h })),
      });
    }
  }

  console.log(`Practitioner accounts ready: ${practitioners.map((p) => p.id + "@mannmatters.in").join(", ")}`);
}

/* ──────────────────────────────────────────────────────────────────────────
   3. Demo sessions — only with SEED_DEMO=1

   Enough of a calendar to see the portal's states: one session in progress,
   one starting shortly with no room set, a finished session still waiting on
   its outcome, and a past week of closed sessions.
   ────────────────────────────────────────────────────────────────────────── */

if (process.env.SEED_DEMO === "1" && expertPassword) {
  const istParts = (d) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(d)
      .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

  const now = new Date();
  const t = istParts(now);
  const today = `${t.year}-${t.month}-${t.day}`;
  const shift = (days) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const clock = (minutesFromNow) => {
    const d = new Date(now.getTime() + minutesFromNow * 60_000);
    const p = istParts(d);
    return `${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
  };

  const clients = [
    { name: "Ishita Raghunathan", email: "ishita.demo@example.com" },
    { name: "Devansh Kapoor", email: "devansh.demo@example.com" },
    { name: "Priya Balasubramanian", email: "priya.demo@example.com" },
    { name: "Aman", email: "aman.demo@example.com" },
  ];

  const clientPassword = await bcrypt.hash("demo-client-password", 10);
  const clientRows = [];
  for (const c of clients) {
    clientRows.push(
      await prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: {
          name: c.name,
          email: c.email,
          passwordHash: clientPassword,
          role: "USER",
          emailVerified: new Date(),
        },
      })
    );
  }

  const expert = practitioners[0];
  const meet = "https://meet.google.com/mmp-demo-room";

  const demo = [
    // in progress right now
    { client: 0, date: today, time: clock(-20), status: "CONFIRMED", concern: "anxiety", url: meet },
    // starting shortly, and nobody has set a room
    { client: 1, date: today, time: clock(75), status: "CONFIRMED", concern: "stress", url: null },
    // finished this morning, outcome not recorded yet
    { client: 2, date: today, time: clock(-260), status: "CONFIRMED", concern: "sleep", url: meet },
    // the days ahead
    { client: 3, date: shift(1), time: "11:00", status: "CONFIRMED", concern: "career", url: meet },
    { client: 0, date: shift(2), time: "16:00", status: "CONFIRMED", concern: "anxiety", url: null },
    { client: 1, date: shift(9), time: "18:00", status: "CONFIRMED", concern: "stress", url: null },
    // the week behind
    { client: 0, date: shift(-7), time: "11:00", status: "COMPLETED", concern: "anxiety", url: meet },
    { client: 2, date: shift(-9), time: "17:00", status: "COMPLETED", concern: "sleep", url: meet },
    { client: 3, date: shift(-11), time: "12:00", status: "NO_SHOW", concern: "career", url: meet },
    { client: 1, date: shift(-14), time: "10:00", status: "CANCELLED", concern: "stress", url: null },
  ];

  const existing = await prisma.booking.count({ where: { expertId: expert.id } });
  if (existing > 0) {
    console.log(`Demo skipped: ${expert.id} already has ${existing} bookings.`);
  } else {
    let n = 0;
    for (const d of demo) {
      n += 1;
      await prisma.booking.create({
        data: {
          ref: `MM-DEMO${String(n).padStart(2, "0")}`,
          userId: clientRows[d.client].id,
          concern: d.concern,
          expertId: expert.id,
          expertName: expert.name,
          date: d.date,
          time: d.time,
          amount: 1199,
          status: d.status,
          meetingUrl: d.url,
          closedBy: d.status === "CONFIRMED" ? null : "EXPERT",
          closedAt: d.status === "CONFIRMED" ? null : new Date(),
          closeReason: d.status === "CANCELLED" ? "Unwell and could not hold the session safely." : null,
        },
      });
    }
    console.log(`Demo calendar created for ${expert.id}: ${demo.length} sessions.`);
  }
}

await prisma.$disconnect();
