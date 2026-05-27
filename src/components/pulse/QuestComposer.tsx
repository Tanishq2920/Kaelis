import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  DoorOpen,
  MapPin,
  MessageCircle,
  AlertCircle,
  Zap,
  Smile,
  Coffee,
  Sparkles,
  Brain,
} from "lucide-react";
import { Wordmark } from "./Wordmark";
import type { ContextType } from "@/lib/pulse-data";
import { analyzeTopicIntent, generateSemanticMatches } from "@/lib/gemini.server";
import { SemanticGraph } from "../topic-intelligence/SemanticGraph";
import { ConferenceBrain } from "../conference-brain/ConferenceBrain";

const SESSIONS = [
  "AI Design Systems at Scale — Metalabs Masterclass",
  "The Future of Developer Tools — Panel",
  "Pricing AI Products — Workshop",
  "Founder Therapy — Fireside",
  "From Seed to Series A — Keynote",
  "Building in Public — Panel",
] as const;

const SITUATION_CHIPS = [
  "Heading to lunch",
  "Wandering the expo",
  "In the founders' lounge",
  "Free for an hour",
  "Just want company",
] as const;

const WINDOWS = [
  { value: 15, label: "15 min", sub: "Quick chat" },
  { value: 30, label: "30 min", sub: "A coffee" },
  { value: 45, label: "45 min", sub: "A real conversation" },
  { value: 60, label: "60 min", sub: "A walk around the floor" },
  { value: 480, label: "End of day", sub: "No rush" },
] as const;

const QUEST_EXAMPLES = [
  "Argue with someone who disagrees with what I just heard.",
  "Find someone two steps ahead of me to ask dumb questions.",
  "Trade real numbers, not theory.",
  "Just want coffee with a stranger working on something interesting.",
] as const;

type Mode = "session" | "topic" | "situation";

export interface ComposerSubmit {
  quest: string;
  windowMin: number;
  contextType: ContextType;
  justAttended: string | null;
  currentSituation: string | null;
  topic: string | null;
  personality: "introvert" | "balanced" | "extrovert";
  socialBattery: number;
  selectedCluster: string | null;
  generatedMatches?: Record<string, unknown>[] | null;
  suggestedDirections?: string[] | null;
}

interface Props {
  onSubmit: (payload: ComposerSubmit) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// ────────────────────────────────────────────────────────────────────────────
// Shell: progress bar + wordmark + step counter, shared by all 4 screens.
// ────────────────────────────────────────────────────────────────────────────

function StepShell({ step, children }: { step: 1 | 2 | 3 | 4; children: React.ReactNode }) {
  const pct = step * 25;
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[oklch(0.08_0.012_280)]">
      {/* Glowing background ambient blobs for premium startup look */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20 select-none">
        {/* Blob 1: Orange/Coral */}
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -80, 50, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-32 -left-32 w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[var(--coral)] to-rose-400 opacity-25 blur-[130px]"
        />

        {/* Blob 2: Cyan/Teal */}
        <motion.div
          animate={{
            x: [0, -100, 60, 0],
            y: [0, 90, -70, 0],
            scale: [1, 0.85, 1.15, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-40 -right-20 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 opacity-[0.18] blur-[140px]"
        />

        {/* Blob 3: Violet/Purple */}
        <motion.div
          animate={{
            x: [0, 50, -60, 0],
            y: [0, 60, 80, 0],
            scale: [1, 1.1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[35%] left-[25%] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-violet-600 to-purple-400 opacity-[0.15] blur-[120px]"
        />

        {/* Fine Star Dust Grid Accent */}
        <div
          className="absolute inset-0 opacity-[0.03] blend-overlay"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-30 h-[2px] w-full bg-white/[0.08]">
        <motion.div
          className="h-full bg-[var(--coral)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ boxShadow: "0 0 15px var(--coral)" }}
        />
      </div>

      {/* Top header */}
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-4 sm:pt-7">
        <Wordmark />
        <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]">
          Step {step} of 4
        </span>
      </header>

      {children}
    </div>
  );
}

// Slide+fade transition wrapper. Direction: 1 = forward, -1 = back.
function Slide({
  k,
  direction,
  children,
}: {
  k: string;
  direction: 1 | -1;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0, x: 20 * direction }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 * direction }}
      transition={{ duration: 0.4, ease: EASE }}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1.5 sm:pr-2.5"
    >
      {children}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Reusable selectable card
// ────────────────────────────────────────────────────────────────────────────

function SelectCard({
  selected,
  onClick,
  children,
  className = "",
  variant = "coral",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: "coral" | "cyan" | "indigo";
}) {
  const selectedStyles = {
    coral:
      "bg-gradient-to-b from-coral/15 to-coral/[0.02] border-coral shadow-[0_0_25px_-5px_rgba(255,59,92,0.25)]",
    cyan: "bg-gradient-to-b from-cyan/15 to-cyan/[0.02] border-cyan shadow-[0_0_25px_-5px_rgba(0,229,255,0.25)]",
    indigo:
      "bg-gradient-to-b from-violet-500/15 to-violet-500/[0.02] border-violet-500 shadow-[0_0_25px_-5px_rgba(139,92,246,0.25)]",
  };

  const badgeColors = {
    coral: "bg-[var(--coral)]",
    cyan: "bg-cyan-500",
    indigo: "bg-violet-500",
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, ease: EASE }}
      className={`glass onboarding-card relative w-full overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6 text-left transition-all duration-300 border ${
        selected
          ? `${selectedStyles[variant]} border-[1.5px]`
          : "border-white/5 hover:border-white/15 hover:bg-white/[0.03]"
      } ${className}`}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={`absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${badgeColors[variant]}`}
        >
          <Check size={12} strokeWidth={3} />
        </motion.span>
      )}
      {children}
    </motion.button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Bottom CTA row (Back link + Next button)
// ────────────────────────────────────────────────────────────────────────────

function CtaRow({
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled,
  loading,
  emphasize,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-3 sm:gap-5">
      <button
        onClick={onNext}
        disabled={nextDisabled || loading}
        className={
          "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--coral)] font-semibold text-white transition-all duration-300 disabled:opacity-30 disabled:shadow-none " +
          (emphasize
            ? "h-[48px] sm:h-[60px] text-[14px] sm:text-[16px] shadow-[0_10px_40px_-10px_var(--coral)] hover:shadow-[0_18px_80px_-10px_var(--coral)]"
            : "h-[44px] sm:h-[52px] text-[13px] sm:text-[15px] shadow-[0_10px_40px_-12px_var(--coral)] hover:shadow-[0_14px_60px_-12px_var(--coral)]")
        }
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "radial-gradient(120% 120% at 50% 0%, oklch(1 0 0 / 25%), transparent 60%)",
          }}
        />
        {loading ? (
          <motion.span
            className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <>
            <span className="relative">{nextLabel}</span>
            <ArrowRight size={16} className="relative" />
          </>
        )}
      </button>
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12px] text-[color:var(--ink-dim)] transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} />
          Back
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────

export function QuestComposer({ onSubmit }: Props) {
  // Demo: pre-filled state per spec.
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [mode, setMode] = useState<Mode | null>("session");
  const [sessionPick, setSessionPick] = useState<string>(SESSIONS[0]);
  const [topicValue, setTopicValue] = useState("");
  const [situationValue, setSituationValue] = useState("Heading to lunch");

  const [personality, setPersonality] = useState<"introvert" | "balanced" | "extrovert">(
    "balanced",
  );
  const [socialBattery, setSocialBattery] = useState<number>(80);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [generatedMatches, setGeneratedMatches] = useState<Record<string, unknown>[] | null>(null);
  const [suggestedDirections, setSuggestedDirections] = useState<string[] | null>(null);

  const [windowMin, setWindowMin] = useState<number>(30);
  const [goal, setGoal] = useState(
    "Grabbing coffee at the espresso bar by Hall C in 10 min. Want to keep chewing on what Pip said about AI in the design process. Room for two.",
  );

  const [loading, setLoading] = useState(false);

  const goNext = () => {
    setDirection(1);
    setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  };
  const goBack = (target?: 1 | 2 | 3 | 4) => {
    setDirection(-1);
    setStep((s) => target ?? (Math.max(1, s - 1) as 1 | 2 | 3 | 4));
  };

  const step1Valid = useMemo(() => {
    if (!mode) return false;
    if (mode === "session") return !!sessionPick;
    if (mode === "topic") return topicValue.trim().length > 0;
    if (mode === "situation") return situationValue.trim().length > 0;
    return false;
  }, [mode, sessionPick, topicValue, situationValue]);

  const submit = () => {
    if (loading) return;
    setLoading(true);

    const contextType: ContextType =
      mode === "session" ? "session" : mode === "situation" ? "situation" : "topic";
    const payload: ComposerSubmit = {
      quest: goal.trim(),
      windowMin,
      contextType,
      justAttended: mode === "session" ? sessionPick : null,
      currentSituation: mode === "situation" ? situationValue.trim() : null,
      topic: mode === "topic" ? topicValue.trim() : null,
      personality,
      socialBattery,
      selectedCluster,
      generatedMatches,
      suggestedDirections,
    };
    setTimeout(() => onSubmit(payload), 500);
  };

  return (
    <StepShell step={step}>
      {/* Background warm radial */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 35%, oklch(0.68 0.22 18 / 8%), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 px-6 pb-2">
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          {step === 1 && (
            <Slide k="s1" direction={direction}>
              <Step1
                mode={mode}
                setMode={setMode}
                sessionPick={sessionPick}
                setSessionPick={setSessionPick}
                topicValue={topicValue}
                setTopicValue={setTopicValue}
                situationValue={situationValue}
                setSituationValue={setSituationValue}
                selectedCluster={selectedCluster}
                setSelectedCluster={setSelectedCluster}
                setGoal={setGoal}
                socialBattery={socialBattery}
                setSocialBattery={setSocialBattery}
                onNext={goNext}
                canNext={step1Valid}
                setGeneratedMatches={setGeneratedMatches}
                setSuggestedDirections={setSuggestedDirections}
              />
            </Slide>
          )}

          {step === 2 && (
            <Slide k="s2" direction={direction}>
              <Step2
                windowMin={windowMin}
                setWindowMin={setWindowMin}
                personality={personality}
                setPersonality={setPersonality}
                onBack={() => goBack(1)}
                onNext={goNext}
              />
            </Slide>
          )}

          {step === 3 && (
            <Slide k="s3" direction={direction}>
              <Step3
                goal={goal}
                setGoal={setGoal}
                onBack={() => goBack(2)}
                onNext={goNext}
                canNext={goal.trim().length > 0}
              />
            </Slide>
          )}

          {step === 4 && (
            <Slide k="s4" direction={direction}>
              <Step4
                mode={mode}
                sessionPick={sessionPick}
                topicValue={topicValue}
                situationValue={situationValue}
                windowMin={windowMin}
                goal={goal}
                personality={personality}
                socialBattery={socialBattery}
                onBack={() => goBack(3)}
                onEdit={(target) => goBack(target)}
                onSubmit={submit}
                loading={loading}
              />
            </Slide>
          )}
        </AnimatePresence>
      </div>
    </StepShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// Step 1 — mode picker
// ────────────────────────────────────────────────────────────────────────────

interface Step1Props {
  mode: Mode | null;
  setMode: (m: Mode) => void;
  sessionPick: string;
  setSessionPick: (s: string) => void;
  topicValue: string;
  setTopicValue: (s: string) => void;
  situationValue: string;
  setSituationValue: (s: string) => void;
  selectedCluster: string | null;
  setSelectedCluster: (s: string | null) => void;
  setGoal: (s: string) => void;
  socialBattery: number;
  setSocialBattery: (n: number) => void;
  onNext: () => void;
  canNext: boolean;
  setGeneratedMatches: (matches: Record<string, unknown>[] | null) => void;
  setSuggestedDirections: (dirs: string[] | null) => void;
}

function Step1({
  mode,
  setMode,
  sessionPick,
  setSessionPick,
  topicValue,
  setTopicValue,
  situationValue,
  setSituationValue,
  selectedCluster,
  setSelectedCluster,
  setGoal,
  socialBattery,
  setSocialBattery,
  onNext,
  canNext,
  setGeneratedMatches,
  setSuggestedDirections,
}: Step1Props) {
  const cards: { id: Mode; title: string; sub: string; Icon: typeof DoorOpen }[] = [
    {
      id: "session",
      title: "Session Continuation",
      sub: "Post-session networking based on shared co-presence in talks.",
      Icon: DoorOpen,
    },
    {
      id: "topic",
      title: "Topic Intelligence",
      sub: "AI-enhanced semantic synthesis and intentional discussion clusters.",
      Icon: MessageCircle,
    },
    {
      id: "situation",
      title: "Conference Brain",
      sub: "Live, AI-generated collective conference intelligence.",
      Icon: Brain,
    },
  ];

  // Gemini Discussion Clusters State
  const [analyzing, setAnalyzing] = useState(false);
  const [matchingLoader, setMatchingLoader] = useState(false);
  const [clusters, setClusters] = useState<{ title: string; sub: string }[]>([]);
  const [showGalaxyOverlay, setShowGalaxyOverlay] = useState(false);

  const handleDeepAnalyze = async () => {
    if (!topicValue.trim()) return;
    setAnalyzing(true);
    setSelectedCluster(null);
    try {
      const res = await analyzeTopicIntent({ data: topicValue });
      if (res && res.clusters) {
        setClusters(res.clusters);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChooseCluster = async (clusterTitle: string, clusterSub: string) => {
    setSelectedCluster(clusterTitle);
    setGoal(`Deep diving into "${clusterTitle}" to discuss ${clusterSub.toLowerCase()}`);
    setMatchingLoader(true);
    try {
      const res = await generateSemanticMatches({
        data: {
          topic: topicValue.trim(),
          selectedCluster: clusterTitle,
        },
      });
      if (res && res.matches) {
        setGeneratedMatches(res.matches as Record<string, unknown>[]);
        const typedMatches = res.matches as {
          id: string;
          suggestedAdjacentDirections?: string[];
        }[];
        const matchedObj = typedMatches.find((m) => m.id === "maya");
        if (matchedObj && matchedObj.suggestedAdjacentDirections) {
          setSuggestedDirections(matchedObj.suggestedAdjacentDirections);
        } else {
          setSuggestedDirections([
            `Benchmarking ${topicValue}`,
            `Telemetry loops for ${topicValue}`,
            "Performance constraints under load",
          ]);
        }
      }
    } catch (err) {
      console.error("Match generation failed:", err);
    } finally {
      setMatchingLoader(false);
    }
  };

  return (
    <section className="onboarding-section flex w-full flex-col pb-8 pt-4 sm:pb-16 sm:pt-10">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="text-balance text-center text-3xl font-semibold tracking-tightest text-ink sm:text-[44px] sm:leading-[1.05]"
      >
        Where's your <span className="text-[var(--coral)]">head</span> right now?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: EASE }}
        className="onboarding-sub-margin mx-auto mt-2 sm:mt-4 max-w-md text-center text-[14px] text-[color:var(--ink-dim)]"
      >
        Choose a tailored mode for your conference networking.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.5, ease: EASE }}
        className="onboarding-grid-margin mx-auto mt-6 sm:mt-10 md:mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {cards.map(({ id, title, sub, Icon }) => {
          const variant = id === "session" ? "coral" : id === "topic" ? "cyan" : "indigo";
          const iconColors = {
            coral: "text-[var(--coral)]",
            cyan: "text-cyan-400",
            indigo: "text-violet-400",
          };
          return (
            <SelectCard
              key={id}
              selected={mode === id}
              variant={variant}
              onClick={() => {
                setMode(id);
                setSelectedCluster(null);
                setClusters([]);
              }}
              className="min-h-[140px] sm:min-h-[160px] md:min-h-[180px]"
            >
              <Icon size={20} className={iconColors[variant]} />
              <div className="mt-3 sm:mt-4 md:mt-5 text-[16px] sm:text-[18px] font-semibold leading-snug text-ink">
                {title}
              </div>
              <div className="mt-1 sm:mt-2 text-[12px] sm:text-[13px] leading-snug text-[color:var(--ink-dim)]">
                {sub}
              </div>
            </SelectCard>
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === "session" && (
          <motion.div
            key="sub-session"
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="onboarding-panel-margin mx-auto mt-4 sm:mt-6 w-full max-w-3xl overflow-hidden"
          >
            <div className="onboarding-subpanel bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 sm:p-6">
              <span className="text-[10px] uppercase tracking-widest text-[color:var(--coral)] font-semibold mb-2 block">
                Card 1 Active: Select conference session context
              </span>
              <select
                value={sessionPick}
                onChange={(e) => {
                  setSessionPick(e.target.value);
                  setGoal(
                    `Catching up on "${e.target.value.split(" — ")[0]}". Would love to compare insights with anyone who attended, and trade deployment notes.`,
                  );
                }}
                className="glass w-full rounded-2xl bg-transparent px-5 py-4 text-[15px] text-ink focus:outline-none"
              >
                <option value="" className="bg-[oklch(0.13_0.018_280)]">
                  Pick the session you just left…
                </option>
                {SESSIONS.map((s) => (
                  <option key={s} value={s} className="bg-[oklch(0.13_0.018_280)]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {mode === "topic" && (
          <motion.div
            key="sub-topic"
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="onboarding-panel-margin mx-auto mt-4 sm:mt-6 w-full max-w-3xl overflow-hidden"
          >
            <div className="onboarding-subpanel bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold block">
                  Card 2 Active: Semantic Topic Networking
                </span>
                {topicValue.trim() && (
                  <button
                    type="button"
                    onClick={handleDeepAnalyze}
                    disabled={analyzing}
                    className="text-[12px] text-cyan-400 font-medium tracking-wide flex items-center gap-1 hover:underline"
                  >
                    {analyzing ? "Synthesizing directions..." : "Deep Analyze Intent ✨"}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={topicValue}
                  onChange={(e) => setTopicValue(e.target.value)}
                  placeholder="e.g. UX design for autonomous AI agents or Multi-agent orchestration"
                  className="glass flex-1 rounded-2xl bg-transparent px-5 py-4 text-[15px] text-ink placeholder:text-[color:var(--ink-dim)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleDeepAnalyze}
                  disabled={analyzing || !topicValue.trim()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold text-[14px] hover:opacity-95 transition-all shadow-[0_0_15px_-4px_var(--cyan)] disabled:opacity-40"
                >
                  {analyzing ? "Analyzing..." : "Analyze"}
                </button>
              </div>

              {analyzing && (
                <div className="py-12 flex flex-col items-center justify-center gap-4 border border-white/[0.03] bg-white/[0.01] rounded-2xl relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none animate-pulse" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="h-10 w-10 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-500/20 border-l-transparent"
                  />
                  <div className="text-center space-y-1">
                    <span className="text-[13px] font-semibold text-white block">
                      Synthesizing Semantic Space
                    </span>
                    <span className="text-[11px] font-mono text-[color:var(--ink-dim)] block max-w-xs mx-auto">
                      Gemini model analyzing technical depth, implied interests & adjacent
                      expertise...
                    </span>
                  </div>
                </div>
              )}

              {clusters.length > 0 && !analyzing && (
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] uppercase tracking-wider text-[color:var(--ink-dim)] font-medium">
                      Interact, drag to explore, or select a semantic node:
                    </span>
                    {matchingLoader && (
                      <span className="text-[11px] font-mono animate-pulse text-cyan-400">
                        Synthesizing radar match network...
                      </span>
                    )}
                  </div>

                  {/* High Fidelity Embedded Interactive Map */}
                  <div className="relative h-[300px] sm:h-[350px] w-full rounded-3xl border border-white/[0.04] bg-black/40 overflow-hidden shadow-inner">
                    <SemanticGraph initialTopic={topicValue} onSelectGoal={handleChooseCluster} />

                    {/* Floating Expand Canvas Overlay Controller */}
                    <button
                      type="button"
                      onClick={() => setShowGalaxyOverlay(true)}
                      className="absolute top-4 right-4 z-10 py-1.5 px-3 rounded-lg bg-black/80 border border-white/10 hover:border-cyan-400 text-[10px] text-cyan-300 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.6)] select-none"
                    >
                      <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
                      Expand To Full Galaxy View 🌌
                    </button>
                  </div>

                  {/* Immersive Overlay Modal View */}
                  <AnimatePresence>
                    {showGalaxyOverlay && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] w-screen h-screen"
                      >
                        <SemanticGraph
                          initialTopic={topicValue}
                          onSelectGoal={handleChooseCluster}
                          onClose={() => setShowGalaxyOverlay(false)}
                          isOverlay={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {mode === "situation" && (
          <motion.div
            key="sub-situation"
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="onboarding-panel-margin mx-auto mt-4 sm:mt-6 w-full max-w-5xl overflow-hidden"
          >
            <div className="onboarding-subpanel bg-neutral-900/10 border border-white/[0.05] rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold block mb-2 font-mono">
                  Card 3 Active: Live Conference Brain Intelligence
                </span>
                <span className="text-[12px] text-[color:var(--ink-dim)] animate-pulse">
                  Map the collective cognitive wavelength of the entire event space in real-time.
                  Uncover emerging hot topic clusters, semantic storms, and click a node to lock
                  onto a trend.
                </span>
              </div>

              {/* The gorgeous, high-end live conference brain simulator component */}
              <ConferenceBrain
                userSocialBattery={socialBattery}
                onSelectTrend={(trendText, goalText) => {
                  setSituationValue(trendText);
                  setGoal(goalText);
                  // Since we activated a trend topic spotlight, let's proceed to next step
                  onNext();
                }}
              />

              {/* Glowing Social Wavelength Outline */}
              <div className="battery-container glass rounded-2xl p-4 sm:p-5 border border-white/[0.05] bg-white/[0.01]">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-[color:var(--ink-dim)] font-semibold font-mono">
                    My Current Social Wavelength Charge:
                  </span>
                  <span className="font-mono text-[13px] text-cyan-400 font-bold">
                    {socialBattery}% Charged
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative h-6 w-11 rounded bg-black/40 border border-white/20 p-0.5 flex items-center pr-[3px] shrink-0">
                    <motion.div
                      className="h-full rounded-sm bg-gradient-to-r from-cyan-400 to-indigo-500"
                      style={{ width: `${socialBattery}%` }}
                    />
                    <div className="absolute right-[-3px] top-[6px] h-2 w-[2px] bg-white/20" />
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={socialBattery}
                    onChange={(e) => setSocialBattery(Number(e.target.value))}
                    className="flex-1 accent-cyan-400 h-1 bg-white/10 rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="onboarding-cta-margin mt-6 sm:mt-[4vh]">
        <CtaRow onNext={onNext} nextDisabled={!canNext} />
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Step 2 — time window & communications persona
// ────────────────────────────────────────────────────────────────────────────

interface Step2Props {
  windowMin: number;
  setWindowMin: (n: number) => void;
  personality: "introvert" | "balanced" | "extrovert";
  setPersonality: (p: "introvert" | "balanced" | "extrovert") => void;
  onBack: () => void;
  onNext: () => void;
}

function Step2({
  windowMin,
  setWindowMin,
  personality,
  setPersonality,
  onBack,
  onNext,
}: Step2Props) {
  return (
    <section className="onboarding-section flex w-full flex-col pb-8 pt-4 sm:pb-16 sm:pt-10">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="text-balance text-center text-3xl font-semibold tracking-tightest text-ink sm:text-[44px] sm:leading-[1.05]"
      >
        How long are you free?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: EASE }}
        className="onboarding-sub-margin mx-auto mt-2 sm:mt-4 max-w-md text-center text-[14px] text-[color:var(--ink-dim)]"
      >
        Pulse only shows matches who are also free in the same window.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.5, ease: EASE }}
        className="onboarding-grid-margin mx-auto mt-6 sm:mt-10 md:mt-12 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-5"
      >
        {WINDOWS.map((w) => (
          <SelectCard
            key={w.value}
            selected={windowMin === w.value}
            variant="cyan"
            onClick={() => setWindowMin(w.value)}
            className="time-selection-card min-h-[80px] sm:min-h-[110px] md:min-h-[120px]"
          >
            <div className="text-[18px] sm:text-[20px] font-semibold tracking-tightest text-ink">
              {w.label}
            </div>
            <div className="mt-1 sm:mt-1.5 text-[11px] sm:text-[12px] text-[color:var(--ink-dim)]">
              {w.sub}
            </div>
          </SelectCard>
        ))}
      </motion.div>

      {/* Communications Persona Selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.5, ease: EASE }}
        className="step2-divider mx-auto mt-6 sm:mt-10 md:mt-12 w-full max-w-3xl border-t border-white/[0.05] pt-6 sm:pt-10"
      >
        <h2 className="text-center text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)] pointer-events-none">
          Communication Persona
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-3 mt-3 sm:mt-5">
          {(["introvert", "balanced", "extrovert"] as const).map((p) => {
            const isSelected = personality === p;
            const title = p.charAt(0).toUpperCase() + p.slice(1);
            const sub =
              p === "introvert"
                ? "Low pressure, gentle chats ☕"
                : p === "extrovert"
                  ? "Bold questions, high-energy ⚡"
                  : "Curious, thoughtful exchange 🧠";
            return (
              <button
                key={p}
                onClick={() => setPersonality(p)}
                type="button"
                className={`glass personality-card flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl text-center border transition-all ${
                  isSelected
                    ? "border-[var(--coral)] shadow-[0_0_20px_-5px_var(--coral)] bg-white/[0.03]"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                <span
                  className={`text-[15px] font-semibold ${isSelected ? "text-[var(--coral)]" : "text-white"}`}
                >
                  {title}
                </span>
                <span className="text-[11px] mt-1 text-[color:var(--ink-dim)] leading-tight">
                  {sub}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="onboarding-cta-margin mt-6 sm:mt-[4vh]">
        <CtaRow onBack={onBack} onNext={onNext} />
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Step 3 — quest text
// ────────────────────────────────────────────────────────────────────────────

function Step3({
  goal,
  setGoal,
  onBack,
  onNext,
  canNext,
}: {
  goal: string;
  setGoal: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <section className="onboarding-section flex w-full flex-col pb-8 pt-4 sm:pb-16 sm:pt-10">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="text-balance text-center text-3xl font-semibold tracking-tightest text-ink sm:text-[44px] sm:leading-[1.05]"
      >
        What would make this time count?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: EASE }}
        className="onboarding-sub-margin mx-auto mt-2 sm:mt-4 max-w-lg text-center text-[14px] text-[color:var(--ink-dim)]"
      >
        Be specific. The more you say, the better Pulse can find your people.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.5, ease: EASE }}
        className="onboarding-grid-margin mx-auto mt-6 sm:mt-10 w-full max-w-[640px]"
      >
        <div className="glass rounded-3xl p-1.5">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="quest-textarea w-full h-[100px] sm:h-[130px] md:h-[180px] resize-none rounded-[1.25rem] bg-transparent px-5 py-4 text-[15px] sm:text-[18px] leading-[1.5] text-ink placeholder:text-[color:var(--ink-dim)] focus:outline-none"
            placeholder="Tell Pulse what you actually want from the next chunk of time."
          />
        </div>

        <div className="mt-3 sm:mt-5 flex flex-wrap justify-center gap-2">
          {QUEST_EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setGoal(ex)}
              className="glass max-w-full truncate rounded-full px-3.5 py-1.5 text-[11px] sm:text-[12px] italic text-[color:var(--ink-dim)] transition-colors hover:text-ink"
            >
              "{ex}"
            </button>
          ))}
        </div>
      </motion.div>

      <div className="onboarding-cta-margin mt-6 sm:mt-[4vh]">
        <CtaRow onBack={onBack} onNext={onNext} nextDisabled={!canNext} />
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Step 4 — review
// ────────────────────────────────────────────────────────────────────────────

interface Step4Props {
  mode: Mode | null;
  sessionPick: string;
  topicValue: string;
  situationValue: string;
  windowMin: number;
  goal: string;
  personality: "introvert" | "balanced" | "extrovert";
  socialBattery: number;
  onBack: () => void;
  onEdit: (target: 1 | 2 | 3) => void;
  onSubmit: () => void;
  loading: boolean;
}

function Step4({
  mode,
  sessionPick,
  topicValue,
  situationValue,
  windowMin,
  goal,
  personality,
  socialBattery,
  onBack,
  onEdit,
  onSubmit,
  loading,
}: Step4Props) {
  const contextLabel =
    mode === "session"
      ? sessionPick.split("—")[0].trim()
      : mode === "topic"
        ? topicValue || "Topic"
        : situationValue || "Just in a moment";
  const minsLabel = windowMin >= 240 ? "Free until end of day" : `${windowMin} minutes free`;

  // Edge fade-out on submit
  const [fadingOut, setFadingOut] = useState(false);
  useEffect(() => {
    if (loading) setFadingOut(true);
  }, [loading]);

  return (
    <section className="onboarding-section relative flex w-full flex-col pb-8 pt-4 sm:pb-16 sm:pt-10">
      <AnimatePresence>
        {fadingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none fixed inset-0 z-20"
            style={{
              background: "radial-gradient(60% 60% at 50% 50%, transparent 30%, oklch(0 0 0) 95%)",
            }}
          />
        )}
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="onboarding-sub-margin text-center text-[10px] uppercase tracking-[0.28em] text-[color:var(--ink-dim)]"
      >
        Your quest
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{
          opacity: fadingOut ? 0 : 1,
          y: 0,
          scale: fadingOut ? 0.98 : 1,
        }}
        transition={{ delay: 0.08, duration: 0.55, ease: EASE }}
        className="onboarding-grid-margin mx-auto mt-4 sm:mt-5 w-full max-w-2xl"
      >
        <div
          className="glass-strong onboarding-subpanel relative rounded-3xl p-5 sm:p-8"
          style={{
            boxShadow: "0 24px 80px -20px oklch(0 0 0 / 60%), 0 0 60px -20px var(--coral)",
          }}
        >
          {/* Context tags */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <ContextTag Icon={MapPin}>{contextLabel}</ContextTag>
            <ContextTag Icon={Clock}>{minsLabel}</ContextTag>
            <ContextTag Icon={Smile}>
              {personality.charAt(0).toUpperCase() + personality.slice(1)} Mode
            </ContextTag>
            {mode === "situation" && <ContextTag Icon={Zap}>{socialBattery}% Charge</ContextTag>}
          </div>

          <div className="my-4 sm:my-6 h-px w-full bg-white/[0.08]" />

          <p className="text-[18px] sm:text-[22px] md:text-[24px] font-medium leading-[1.45] text-ink">
            "{goal}"
          </p>

          <p className="mt-3 sm:mt-5 text-[12px] sm:text-[13px] italic text-[color:var(--ink-dim)]">
            — Adi, you
          </p>

          <div className="mt-5 sm:mt-7 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-[12px] text-[color:var(--ink-dim)]">
            <button
              onClick={() => onEdit(1)}
              className="underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Edit mode
            </button>
            <span>·</span>
            <button
              onClick={() => onEdit(2)}
              className="underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Edit time
            </button>
            <span>·</span>
            <button
              onClick={() => onEdit(3)}
              className="underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Edit quest text
            </button>
          </div>
        </div>
      </motion.div>

      <div className="onboarding-cta-margin mt-6 sm:mt-[4vh]">
        <CtaRow
          onBack={onBack}
          onNext={onSubmit}
          nextLabel="Drop into the radar"
          loading={loading}
          emphasize
        />
      </div>
    </section>
  );
}

function ContextTag({ Icon, children }: { Icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-ink"
      style={{
        border: "1px solid var(--cyan-soft)",
        background: "oklch(0.85 0.16 210 / 6%)",
      }}
    >
      <Icon size={12} className="text-[var(--coral)]" />
      {children}
    </span>
  );
}
