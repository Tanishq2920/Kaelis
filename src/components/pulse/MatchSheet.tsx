import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MessageCircle, MapPin } from "lucide-react";
import type { Quest } from "@/lib/pulse-data";
import { generateOpeners } from "@/lib/gemini.server";
import { ComposerSubmit } from "./QuestComposer";

function ContextStrip({ match }: { match: Quest }) {
  const rows: { icon: ReactNode; label: string; value: string }[] = [];

  if (match.contextType === "session" && match.justAttended) {
    rows.push({
      icon: <Calendar size={13} />,
      label: "Just attended",
      value: match.justAttended,
    });
  } else if (match.contextType === "topic") {
    rows.push({
      icon: <MessageCircle size={13} />,
      label: "Wants to talk about",
      value: match.topic ?? match.quest,
    });
  } else if (match.contextType === "situation") {
    if (match.currentSituation) {
      rows.push({
        icon: <Clock size={13} />,
        label: "Current State",
        value: match.currentSituation,
      });
    }
    if (match.distanceStr) {
      rows.push({
        icon: <MapPin size={13} />,
        label: "Physical Co-Presence",
        value: `${match.distanceStr} (${match.proximityWarmth ?? "Glow Zone"})`,
      });
    }
  }

  if (match.freeUntil) {
    rows.push({
      icon: <Clock size={13} />,
      label: "Free until",
      value: match.freeUntil,
    });
  }

  if (match.conversationGoal) {
    rows.push({
      icon: <MessageCircle size={13} />,
      label: "Wants to",
      value: match.conversationGoal,
    });
  }

  if (rows.length === 0) return null;

  return (
    <div className="glass mt-6 space-y-2.5 rounded-2xl p-4">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3">
          <span className="mt-[3px] text-[var(--cyan)]">{r.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
              {r.label}
            </p>
            <p className="text-[13px] leading-snug text-ink">{r.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface Props {
  match: Quest | null;
  onClose: () => void;
  onWave: (q: Quest) => void;
  composerPayload?: ComposerSubmit | null;
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

export function MatchSheet({ match, onClose, onWave, composerPayload }: Props) {
  const [startersList, setStartersList] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (match) {
      setStartersList([match.opener]);

      const loadCustomOpeners = async () => {
        setGenerating(true);
        try {
          const personality = composerPayload?.personality ?? "balanced";
          const battery = composerPayload?.socialBattery ?? 80;
          const viewerQuest = composerPayload?.quest ?? "A technical drop to explore alignments.";
          const response = await generateOpeners({
            data: {
              matchName: match.name,
              matchQuest: match.quest,
              viewerQuest: viewerQuest,
              personality: personality,
              socialBattery: battery,
            },
          });
          if (response && response.starters && response.starters.length > 0) {
            setStartersList(response.starters);
          }
        } catch (err) {
          console.error("Openers fail", err);
        } finally {
          setGenerating(false);
        }
      };

      loadCustomOpeners();
    }
  }, [match, composerPayload]);

  return (
    <AnimatePresence>
      {match && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="glass-strong fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[78vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] px-6 pb-8 pt-5"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-2 text-[color:var(--ink-dim)] transition-colors hover:bg-white/5 hover:text-ink"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-[20px] font-semibold text-[var(--cyan)]"
                style={{
                  background: "var(--cyan-soft)",
                  boxShadow: "0 0 24px -4px var(--cyan)",
                }}
              >
                {match.initial}
              </div>
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
                  {match.ring} ring
                </p>
                <p className="text-[20px] font-semibold tracking-tightest text-ink">{match.name}</p>
              </div>
              <p className="text-[34px] font-semibold tracking-tightest text-[var(--coral)] tabular-nums">
                <CountUp to={match.match} />%
                <span className="ml-0.5 text-[14px] font-normal text-[color:var(--ink-dim)]">
                  match
                </span>
              </p>
            </div>

            <div className="mt-6 border-l-2 border-[var(--coral)] pl-4">
              <p className="text-[15px] leading-relaxed text-ink">"{match.quest}"</p>
            </div>

            <ContextStrip match={match} />

            <div className="mt-6">
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
                Why you'll click
              </p>
              <p className="text-[14px] leading-relaxed text-[color:oklch(0.85_0.005_280)]">
                {match.why}
              </p>
            </div>

            {/* Semantic Intelligence stats (Card 2 unique details) */}
            {(match.conceptualOverlap ||
              match.collaborationDirection ||
              match.conversationDepth) && (
              <div className="grid grid-cols-1 gap-3 mt-6">
                {match.conceptualOverlap && (
                  <div
                    className={`p-4 rounded-2xl border transition-colors ${
                      match.contextType === "situation"
                        ? "bg-amber-950/10 border-amber-500/10 shadow-[inset_0_1px_12px_rgba(245,158,11,0.03)] hover:border-amber-500/20"
                        : "bg-cyan-950/10 border-cyan-500/10 shadow-[inset_0_1px_12px_rgba(6,182,212,0.03)] hover:border-cyan-500/20"
                    }`}
                  >
                    <span
                      className={`text-[9px] uppercase tracking-widest font-mono block mb-1.5 ${
                        match.contextType === "situation" ? "text-amber-400" : "text-cyan-400"
                      }`}
                    >
                      {match.contextType === "situation"
                        ? "Social Compatibility & Vibe"
                        : "Shared Technical Overlap"}
                    </span>
                    <p className="text-[13.5px] leading-relaxed text-zinc-200">
                      {match.conceptualOverlap}
                    </p>
                  </div>
                )}
                {match.collaborationDirection && (
                  <div
                    className={`p-4 rounded-2xl border transition-colors ${
                      match.contextType === "situation"
                        ? "bg-amber-950/10 border-amber-500/10 shadow-[inset_0_1px_12px_rgba(245,158,11,0.03)] hover:border-amber-500/20"
                        : "bg-indigo-950/15 border-indigo-500/10 hover:border-indigo-500/20"
                    }`}
                  >
                    <span
                      className={`text-[9px] uppercase tracking-widest font-mono block mb-1.5 ${
                        match.contextType === "situation" ? "text-amber-400" : "text-indigo-400"
                      }`}
                    >
                      {match.contextType === "situation"
                        ? "Where to Find Them"
                        : "Potential Collaboration Angle"}
                    </span>
                    <p className="text-[13.5px] leading-relaxed text-zinc-200">
                      {match.collaborationDirection}
                    </p>
                  </div>
                )}
                {match.conversationDepth && (
                  <div
                    className={`p-4 rounded-2xl border transition-colors ${
                      match.contextType === "situation"
                        ? "bg-emerald-950/10 border-emerald-500/10 hover:border-emerald-500/20"
                        : "bg-emerald-950/10 border-emerald-500/10 hover:border-emerald-500/20"
                    }`}
                  >
                    <span
                      className={`text-[9px] uppercase tracking-widest font-mono block mb-1.5 ${
                        match.contextType === "situation" ? "text-emerald-400" : "text-emerald-400"
                      }`}
                    >
                      {match.contextType === "situation"
                        ? "Interaction Vibe"
                        : "Synthesized Discussion Depth"}
                    </span>
                    <p className="text-[13.5px] leading-relaxed text-zinc-200">
                      {match.conversationDepth}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="glass mt-6 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
                  Suggested Contextual Starters ({composerPayload?.personality ?? "balanced"} style)
                </p>
                {generating && (
                  <span className="text-[10px] animate-pulse font-mono text-[var(--coral)]">
                    AI composing ideas...
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {startersList.map((starter, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[13.5px] leading-relaxed text-ink hover:border-white/10 hover:bg-white/[0.02] cursor-pointer transition-all"
                    onClick={() => {
                      match.opener = starter;
                    }}
                  >
                    "{starter}"
                  </div>
                ))}
              </div>

              {!generating && (
                <button
                  type="button"
                  onClick={async () => {
                    setGenerating(true);
                    try {
                      const response = await generateOpeners({
                        data: {
                          matchName: match.name,
                          matchQuest: match.quest,
                          viewerQuest: composerPayload?.quest || "",
                          personality: composerPayload?.personality || "balanced",
                          socialBattery: composerPayload?.socialBattery || 80,
                        },
                      });
                      if (response && response.starters) {
                        setStartersList(response.starters);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setGenerating(false);
                    }
                  }}
                  className="mt-3.5 text-[11px] uppercase tracking-wider text-cyan-400 font-semibold hover:underline block text-center w-full"
                >
                  Regenerate Starters ✨
                </button>
              )}
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="rounded-2xl border border-white/10 py-3.5 text-[14px] font-medium text-[color:var(--ink-dim)] transition-colors hover:text-ink"
              >
                Pass
              </button>
              <button
                onClick={() => onWave(match)}
                className="relative overflow-hidden rounded-2xl bg-[var(--coral)] py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_40px_-10px_var(--coral)] transition-all hover:shadow-[0_14px_50px_-10px_var(--coral)]"
              >
                {match.contextType === "situation" ? "Send Quick Wave 👋" : "Wave"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
