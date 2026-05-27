import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wordmark } from "./Wordmark";
import { generateMeetingRecap } from "@/lib/gemini.server";
import { ComposerSubmit } from "./QuestComposer";

interface Props {
  onBack: () => void;
  composerPayload?: ComposerSubmit | null;
}

const STATS = [
  { value: "4", label: "Quests dropped" },
  { value: "3", label: "People met" },
  { value: "1,247", label: "Quests in the room" },
];

const TOPICS = [
  { label: "AI safety", n: 218 },
  { label: "Hiring", n: 174 },
  { label: "Climate", n: 142 },
];

export function DayRecap({ onBack, composerPayload }: Props) {
  const [archetype, setArchetype] = useState("The Ambient Explorer");
  const [story, setStory] = useState(
    "Spontaneous coffee and lightweight connections. You centered around genuine dialogues, dropping thoughtful quests and comparison notes nicely.",
  );
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    const generateRecap = async () => {
      setGenerating(true);
      try {
        const p = composerPayload?.personality ?? "balanced";
        const topicName =
          composerPayload?.topic ||
          composerPayload?.justAttended?.split(" — ")[0] ||
          "AI Frameworks";
        const res = await generateMeetingRecap({
          data: {
            questsCount: 4,
            connectionsCount: 3,
            mainTopic: topicName,
            personality: p,
            energyLeft: composerPayload?.socialBattery ?? 75,
          },
        });
        if (res && active) {
          if (res.archetype) setArchetype(res.archetype);
          if (res.story) setStory(res.story);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setGenerating(false);
      }
    };

    generateRecap();
    return () => {
      active = false;
    };
  }, [composerPayload]);
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 pt-7 pb-16">
      <header className="flex items-center justify-between">
        <Wordmark />
        <button
          onClick={onBack}
          className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)] transition-colors hover:text-ink"
        >
          Back to radar
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-12"
      >
        <h1 className="text-[40px] font-semibold leading-[1.05] tracking-tightest text-ink">
          Your day in the room
        </h1>
        <p className="mt-2 text-[13px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
          May 14, 2026
        </p>
      </motion.div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="glass rounded-2xl p-4"
          >
            <p className="text-[28px] font-semibold tracking-tightest text-ink">{s.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-dim)]">
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass relative mt-6 overflow-hidden rounded-2xl p-5"
      >
        <span className="absolute left-0 top-0 h-full w-1 bg-[var(--coral)]" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
          Most valuable match
        </p>
        <p className="mt-2 text-[18px] font-semibold tracking-tight text-ink">
          Sarah · AI infra investor
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[color:oklch(0.85_0.005_280)]">
          "Looking for technical founders building inference infra at the edge — 15 min, no pitch,
          just exploring."
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass mt-4 rounded-2xl p-5 relative overflow-hidden"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
          Your archetype{" "}
          {generating && (
            <span className="text-[10px] animate-pulse font-mono text-[var(--coral)] ml-2">
              • calculating...
            </span>
          )}
        </p>
        <p className="mt-2 text-[36px] font-semibold tracking-tightest text-ink">{archetype}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-dim)]">{story}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
          The room today
        </p>
        <div className="glass relative overflow-hidden rounded-2xl p-4">
          <Heatmap />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex flex-wrap gap-2"
      >
        {TOPICS.map((t) => (
          <span key={t.label} className="glass rounded-full px-3.5 py-1.5 text-[12px] text-ink">
            {t.label} <span className="text-[color:var(--ink-dim)]">· {t.n}</span>
          </span>
        ))}
      </motion.div>

      <p className="mt-12 text-center text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
        Web Summit · May 14, 2026
      </p>
    </main>
  );
}

function Heatmap() {
  const hotspots = [
    { x: 80, y: 70, r: 50, label: "Startup Lounge — 312 matches" },
    { x: 250, y: 110, r: 38, label: "West Atrium — 184 matches" },
    { x: 190, y: 200, r: 28, label: "Hall C entrance — 97 matches" },
  ];
  return (
    <div className="relative">
      <svg viewBox="0 0 360 260" className="block w-full">
        <defs>
          <radialGradient id="hot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.85" />
            <stop offset="60%" stopColor="var(--coral)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* floorplan outline */}
        <rect
          x="20"
          y="20"
          width="320"
          height="220"
          rx="14"
          fill="none"
          stroke="oklch(1 0 0 / 12%)"
          strokeWidth="1"
        />
        <line x1="160" y1="20" x2="160" y2="160" stroke="oklch(1 0 0 / 8%)" strokeWidth="1" />
        <line x1="20" y1="160" x2="340" y2="160" stroke="oklch(1 0 0 / 8%)" strokeWidth="1" />

        {hotspots.map((h, i) => (
          <g key={i}>
            <circle cx={h.x} cy={h.y} r={h.r} fill="url(#hot)" />
            <circle cx={h.x} cy={h.y} r={3} fill="var(--coral)" />
          </g>
        ))}
      </svg>
      <div className="mt-3 grid gap-1.5">
        {hotspots.map((h) => (
          <p key={h.label} className="text-[12px] text-[color:var(--ink-dim)]">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--coral)] align-middle" />
            {h.label}
          </p>
        ))}
      </div>
    </div>
  );
}
