import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, Linkedin, Plus, Coffee, Clock, Utensils } from "lucide-react";
import { Wordmark } from "@/components/pulse/Wordmark";
import type { Viewer } from "@/lib/pulse-data";

interface Props {
  viewer: Viewer | null;
  open: boolean;
  onClose: () => void;
  onNewQuest?: () => void;
}

interface ConnectionAvatar {
  initial: string;
  color: string;
}

interface Connection {
  id: string;
  timestamp: string;
  names: string;
  avatars: ConnectionAvatar[];
  venueIcon: "coffee" | "utensils";
  venue: string;
  duration: string;
  quote: string;
  signature: string;
  links: { name: string; url: string }[];
}

const CONNECTIONS: Connection[] = [
  {
    id: "c1",
    timestamp: "Today, 11:47 AM · Web Summit Day 2",
    names: "Maya Chen & Tara Okafor",
    avatars: [
      { initial: "M", color: "var(--cyan)" },
      { initial: "T", color: "var(--cyan)" },
    ],
    venueIcon: "coffee",
    venue: "Espresso Bar, Hall C",
    duration: "35 minutes",
    quote:
      "Grabbing coffee at the espresso bar by Hall C in 10 min. Want to keep chewing on what Pip said about AI in the design process. Room for two.",
    signature: "— Adi, you, 90 minutes ago",
    links: [
      { name: "Maya", url: "https://linkedin.com/in/maya-chen-design" },
      { name: "Tara", url: "https://linkedin.com/in/tara-okafor" },
    ],
  },
  {
    id: "c2",
    timestamp: "Yesterday, 1:15 PM · Web Summit Day 1",
    names: "James Rivera",
    avatars: [{ initial: "J", color: "var(--cyan)" }],
    venueIcon: "utensils",
    venue: "Food Court, Atrium",
    duration: "55 minutes",
    quote: "Vegan lunch buddy in the next 20 min, any background, just want company.",
    signature: "— Adi, you, yesterday",
    links: [{ name: "James", url: "https://linkedin.com/in/james-rivera" }],
  },
  {
    id: "c3",
    timestamp: "Yesterday, 4:30 PM · Web Summit Day 1",
    names: "Sarah Patel",
    avatars: [{ initial: "S", color: "var(--cyan)" }],
    venueIcon: "coffee",
    venue: "Investor Lounge",
    duration: "40 minutes",
    quote:
      "Hunting for an angel investor in AI infra who'll have a real conversation, not just take a pitch.",
    signature: "— Adi, you, yesterday",
    links: [{ name: "Sarah", url: "https://linkedin.com/in/sarah-patel-angel" }],
  },
];

interface QuestLogRow {
  done: boolean;
  timestamp: string;
  snippet: string;
  outcome: string;
}

const QUEST_LOG: QuestLogRow[] = [
  {
    done: true,
    timestamp: "Today, 11:47 AM",
    snippet: "Coffee at Espresso Bar with someone who was at Metalabs talk",
    outcome: "Met Maya & Tara",
  },
  {
    done: false,
    timestamp: "Today, 9:30 AM",
    snippet: "Quick chat with someone working on AI agents",
    outcome: "Quest expired",
  },
  {
    done: true,
    timestamp: "Yesterday, 4:30 PM",
    snippet: "Angel investor for AI infra, real conversation",
    outcome: "Met Sarah",
  },
  {
    done: true,
    timestamp: "Yesterday, 1:15 PM",
    snippet: "Vegan lunch buddy, no agenda",
    outcome: "Met James",
  },
  {
    done: false,
    timestamp: "Yesterday, 10:00 AM",
    snippet: "Anyone working on dev tools for non-technical founders",
    outcome: "Quest expired",
  },
];

const INTERESTS = ["AI", "event-tech", "design", "B2B SaaS", "developer tools", "product"];

export function Profile({ viewer, open, onClose, onNewQuest }: Props) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  };

  const goNewQuest = () => {
    if (onNewQuest) onNewQuest();
    else onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 36 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{
              background: "#0A0A0F",
              backgroundImage:
                "radial-gradient(70% 55% at 50% 0%, oklch(0.22 0.06 35 / 35%) 0%, transparent 65%), radial-gradient(60% 50% at 50% 100%, oklch(0.18 0.04 30 / 25%) 0%, transparent 70%)",
              backgroundAttachment: "fixed",
            }}
          >
            {/* Sticky top bar */}
            <div
              className="sticky top-0 z-20 border-b border-white/5 backdrop-blur-xl"
              style={{ background: "oklch(0.10 0.012 280 / 70%)" }}
            >
              <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-3.5">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-[13px] text-[color:var(--ink-dim)] transition-colors hover:text-ink"
                >
                  <ChevronLeft size={16} />
                  Back to radar
                </button>
                <Wordmark />
                <button
                  onClick={goNewQuest}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--coral)] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_8px_30px_-10px_var(--coral)] transition-all hover:shadow-[0_12px_40px_-10px_var(--coral)]"
                >
                  <Plus size={14} />
                  New quest
                </button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-2xl px-5 pb-16 pt-8 sm:px-6 sm:pt-10">
              {/* Section 1 — Identity Header */}
              <section className="flex flex-col items-center text-center">
                <div className="relative">
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "var(--coral)",
                      filter: "blur(28px)",
                      opacity: 0.55,
                    }}
                    animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.65, 0.45] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full text-[40px] font-semibold text-white"
                    style={{
                      background: "linear-gradient(150deg, var(--coral), oklch(0.55 0.22 18))",
                      boxShadow: "0 0 60px -10px var(--coral), inset 0 1px 0 0 oklch(1 0 0 / 25%)",
                    }}
                  >
                    {viewer?.initial || "A"}
                  </motion.div>
                </div>

                <h1 className="mt-6 text-[36px] font-semibold tracking-tightest text-ink">
                  {viewer?.name || "Adi"}
                </h1>
                <p className="mt-1 text-[16px] text-[color:var(--ink-dim)]">
                  Founder · Building Pulse — AI tooling for live events
                </p>

                {/* Stat strip */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[color:var(--ink-dim)]">
                  <Stat value="3" label="quests completed" />
                  <Divider />
                  <Stat value="5" label="connections made" />
                  <Divider />
                  <Stat value="2" label="conversations pending" />
                </div>

                {/* About Adi expandable */}
                <button
                  onClick={() => setAboutOpen((v) => !v)}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] font-medium text-[color:var(--ink-dim)] transition-colors hover:border-white/20 hover:text-ink"
                >
                  About Adi
                  <motion.span
                    animate={{ rotate: aboutOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {aboutOpen && (
                    <motion.div
                      key="about"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full overflow-hidden"
                    >
                      <div className="glass mx-auto mt-5 max-w-lg rounded-2xl p-5 text-left">
                        <p className="text-[14px] leading-relaxed text-[color:oklch(0.85_0.005_280)]">
                          Solo founder, technical background. Previously shipped two B2B SaaS
                          products. At Web Summit to find design partners and angel investors.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {INTERESTS.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border px-3 py-1.5 text-[13px]"
                              style={{
                                borderColor: "var(--cyan)",
                                color: "var(--cyan)",
                                background: "oklch(0.18 0.012 280 / 60%)",
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Section 2 — Connections */}
              <section className="mt-14">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--coral)]">
                  Meaningful connections
                </p>
                <h2 className="mt-2 text-[28px] font-semibold tracking-tightest text-ink">
                  People you actually met
                </h2>
                <p className="mt-1.5 text-[14px] text-[color:var(--ink-dim)]">
                  Three people. Three real conversations. Three LinkedIn connections that outlived
                  the room.
                </p>

                <div className="mt-6 flex flex-col gap-5">
                  {CONNECTIONS.map((c, i) => (
                    <ConnectionCard key={c.id} c={c} delay={0.05 + i * 0.06} />
                  ))}
                </div>
              </section>

              {/* Section 3 — Quest Log */}
              <section className="mt-14">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
                  Full journal
                </p>
                <h2 className="mt-2 text-[24px] font-semibold tracking-tightest text-ink">
                  Every quest you've dropped
                </h2>
                <p className="mt-1.5 text-[14px] text-[color:var(--ink-dim)]">
                  Five quests total. Three landed. Two didn't. That's how Pulse actually works.
                </p>

                <ul className="mt-5 flex flex-col">
                  {QUEST_LOG.map((q, i) => (
                    <li key={i}>
                      <button
                        onClick={() => showToast("Coming soon.")}
                        className="group flex w-full items-start gap-3 border-b border-white/5 py-3 text-left transition-colors hover:bg-white/[0.02]"
                      >
                        <span
                          className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{
                            background: q.done ? "var(--coral)" : "oklch(0.45 0.005 280)",
                            boxShadow: q.done ? "0 0 10px -2px var(--coral)" : "none",
                          }}
                        />
                        <div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px]">
                          <span className="text-[color:var(--ink-dim)]">{q.timestamp}</span>
                          <span className="text-[color:var(--ink-dim)]">·</span>
                          <span className="text-[color:oklch(0.85_0.005_280)]">{q.snippet}</span>
                          <span className="text-[color:var(--ink-dim)]">·</span>
                          <span
                            className={
                              q.done ? "font-medium text-ink" : "text-[color:var(--ink-dim)] italic"
                            }
                          >
                            {q.outcome}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-[12px] text-[color:var(--ink-dim)]">
                  Started using Pulse 2 days ago. 5 quests, 3 successful, 2 expired. 60% landing
                  rate.
                </p>
              </section>

              {/* Bottom CTAs */}
              <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={onClose}
                  className="glass rounded-2xl border border-white/12 px-6 py-3 text-[13px] font-medium text-ink transition-colors hover:border-white/25"
                >
                  Back to radar
                </button>
                <button
                  onClick={goNewQuest}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--coral)] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_10px_40px_-10px_var(--coral)] transition-all hover:shadow-[0_14px_50px_-10px_var(--coral)]"
                >
                  <Plus size={14} />
                  Drop a new quest
                </button>
              </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-[12px] text-ink backdrop-blur-md"
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[20px] font-semibold tabular-nums text-[var(--coral)]">{value}</span>
      <span className="text-[12px] uppercase tracking-[0.12em] text-[color:var(--ink-dim)]">
        {label}
      </span>
    </span>
  );
}

function Divider() {
  return (
    <span className="text-[color:var(--ink-dim)]" aria-hidden>
      ·
    </span>
  );
}

function ConnectionCard({ c, delay }: { c: Connection; delay: number }) {
  const VenueIcon = c.venueIcon === "coffee" ? Coffee : Utensils;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01 }}
      className="glass group relative overflow-hidden rounded-2xl border border-white/[0.08] p-5 transition-colors hover:border-white/[0.16] sm:p-7"
    >
      {/* Coral left accent */}
      <span
        aria-hidden
        className="absolute inset-y-5 left-0 w-[3px] rounded-r-full"
        style={{ background: "var(--coral)", opacity: 0.7 }}
      />

      {/* Timestamp */}
      <div className="flex items-center gap-2 text-[12px] text-[color:var(--ink-dim)]">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--coral)",
            boxShadow: "0 0 8px -1px var(--coral)",
          }}
        />
        {c.timestamp}
      </div>

      {/* Avatars + names */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex -space-x-2">
          {c.avatars.map((a, idx) => (
            <motion.div
              key={idx}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-[14px] font-semibold text-white"
              style={{
                background: a.color,
                borderColor: "oklch(0.10 0.012 280)",
                boxShadow: `0 0 0px 0px ${a.color}`,
              }}
              whileHover={{
                boxShadow: [
                  `0 0 0px 0px ${a.color}`,
                  `0 0 28px 2px ${a.color}`,
                  `0 0 0px 0px ${a.color}`,
                ],
                transition: { duration: 1.4, ease: "easeInOut" },
              }}
            >
              {a.initial}
            </motion.div>
          ))}
        </div>
        <p className="text-[17px] font-semibold" style={{ color: "var(--cyan)" }}>
          {c.names}
        </p>
      </div>

      {/* Context strip */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[color:var(--ink-dim)]">
        <span className="inline-flex items-center gap-1.5">
          <VenueIcon size={13} />
          {c.venue}
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={13} />
          {c.duration}
        </span>
      </div>

      {/* Quote */}
      <blockquote
        className="mt-4 border-l-2 pl-4 text-[15px] italic leading-relaxed text-ink"
        style={{ borderColor: "var(--coral)" }}
      >
        "{c.quote}"
      </blockquote>
      <p className="mt-2 text-[12px] text-[color:var(--ink-dim)]">{c.signature}</p>

      {/* LinkedIn buttons */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {c.links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#0A66C2" }}
          >
            <Linkedin size={14} />
            {l.name} on LinkedIn
          </a>
        ))}
      </div>
    </motion.div>
  );
}
