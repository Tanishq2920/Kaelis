import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, MapPin, Loader2 } from "lucide-react";
import type { Quest } from "@/lib/pulse-data";

interface Props {
  match: Quest;
  onDone: () => void;
}

type TableState = "idle" | "opening" | "requesting" | "joined";

export function MutualWave({ match, onDone }: Props) {
  const [seconds, setSeconds] = useState(9 * 60 + 58);
  const [tableState, setTableState] = useState<TableState>("idle");
  const [namesHighlight, setNamesHighlight] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const thirdJoined = tableState === "joined";

  const handleOpen = () => {
    if (tableState !== "idle") return;
    setTableState("opening");
    setTimeout(() => setTableState("requesting"), 600);
  };

  const handleWelcome = () => {
    setTableState("joined");
    setNamesHighlight(true);
    setTimeout(() => setNamesHighlight(false), 1200);
  };

  const handleDecline = () => {
    setTableState("idle");
  };

  return (
    <main
      className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-start px-6 py-10"
      style={{
        backgroundImage:
          "radial-gradient(60% 50% at 50% 40%, oklch(0.22 0.07 25 / 50%) 0%, transparent 70%)",
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 text-center text-[32px] font-semibold tracking-tightest text-ink"
      >
        {thirdJoined ? "Your coffee is happening — and growing." : "Your coffee is happening."}
      </motion.h2>

      {/* Hero: Adi · Coffee · Maya (· Tara) */}
      <div className="relative mt-10 flex w-full items-center justify-center gap-6 sm:gap-8">
        {/* Adi (left) — already in place */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{
            boxShadow: [
              "0 0 24px -4px var(--coral)",
              "0 0 44px 0px var(--coral)",
              "0 0 24px -4px var(--coral)",
            ],
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-[26px] font-semibold text-white"
          style={{ background: "var(--coral)" }}
        >
          A
        </motion.div>

        {/* Coffee cup */}
        <div className="relative flex flex-col items-center">
          <div className="relative h-7 w-12">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute bottom-0 h-6 w-[3px] rounded-full"
                style={{
                  left: `${10 + i * 14}px`,
                  background: "linear-gradient(to top, oklch(0.85 0.05 60 / 50%), transparent)",
                }}
                animate={{ y: [0, -10, -18], opacity: [0, 0.7, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
          <Coffee size={48} className="text-[var(--coral)]" strokeWidth={1.6} />
          <AnimatePresence>
            {thirdJoined && (
              <motion.div
                key="burst"
                initial={{ scale: 0.6, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.65 0.18 25 / 50%) 0%, transparent 70%)",
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Tara — appears between coffee and Maya when joined */}
        <AnimatePresence>
          {thirdJoined && (
            <motion.div
              key="tara"
              initial={{ scale: 0.7, opacity: 0, width: 0, marginLeft: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                width: 72,
                marginLeft: 0,
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 24px -4px var(--cyan)",
                    "0 0 44px 0px var(--cyan)",
                    "0 0 24px -4px var(--cyan)",
                  ],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.1,
                }}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-[26px] font-semibold text-white"
                style={{ background: "var(--cyan)" }}
              >
                T
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Maya (right) — slides in from off-screen on entrance */}
        <motion.div
          initial={{ x: 240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 24,
            delay: 0.15,
          }}
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 24px -4px var(--cyan)",
                "0 0 44px 0px var(--cyan)",
                "0 0 24px -4px var(--cyan)",
              ],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7,
            }}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-[26px] font-semibold text-white"
            style={{ background: "var(--cyan)" }}
          >
            {match.initial}
          </motion.div>
        </motion.div>
      </div>

      {/* Plan card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="glass-strong mt-10 w-full max-w-md rounded-3xl p-6"
      >
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)]">
          Meeting up in
        </p>
        <p className="mt-2 text-center font-mono text-[64px] font-semibold leading-none tabular-nums tracking-tight text-[var(--coral)]">
          {mins}
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            :
          </motion.span>
          {secs}
        </p>

        <div className="my-5 h-px w-full bg-white/8" />

        <div className="flex items-center gap-3">
          <MapPin size={14} className="text-[var(--coral)]" />
          <p className="text-[14px] text-ink">Espresso Bar, Hall C</p>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--cyan)]" />
          <p className="text-[14px] text-ink">
            Adi · Maya
            {thirdJoined && (
              <>
                {" · "}
                <motion.span
                  animate={{
                    color: namesHighlight
                      ? ["var(--cyan)", "var(--cyan)", "var(--ink)"]
                      : "var(--ink)",
                  }}
                  transition={{ duration: 1.2 }}
                >
                  Tara
                </motion.span>
              </>
            )}
          </p>
        </div>
      </motion.div>

      {/* Open the table button */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        onClick={handleOpen}
        disabled={tableState !== "idle"}
        className="glass mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium text-ink transition-all hover:bg-white/5 disabled:opacity-60"
      >
        {tableState === "idle" && <span>Open the table?</span>}
        {tableState === "opening" && (
          <>
            <Loader2 size={14} className="animate-spin text-[var(--cyan)]" />
            <span>Opening…</span>
          </>
        )}
        {tableState === "requesting" && <span>Awaiting your call…</span>}
        {tableState === "joined" && (
          <span className="text-[color:var(--ink-dim)]">Table is full.</span>
        )}
      </motion.button>

      {/* Final CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        onClick={onDone}
        className="mt-8 rounded-2xl bg-[var(--coral)] px-8 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_40px_-10px_var(--coral)] transition-all hover:shadow-[0_14px_50px_-10px_var(--coral)]"
      >
        I'm on my way.
      </motion.button>

      {/* Tara request card */}
      <AnimatePresence>
        {tableState === "requesting" && (
          <motion.div
            key="tara-request"
            initial={{ y: "120%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-6 z-30 mx-auto w-full max-w-md px-4"
          >
            <div className="glass-strong rounded-3xl p-5">
              <div className="flex items-center gap-2">
                <motion.span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--cyan)]"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]">
                  New request
                </p>
              </div>

              <div className="mt-3 flex items-start gap-4">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 18px -4px var(--cyan)",
                      "0 0 32px 0px var(--cyan)",
                      "0 0 18px -4px var(--cyan)",
                    ],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[20px] font-semibold text-white"
                  style={{ background: "var(--cyan)" }}
                >
                  T
                </motion.div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">Tara · 92% match</p>
                  <p className="mt-1 text-[13px] leading-snug text-[color:var(--ink-dim)]">
                    Was in the Metalabs talk too. Wants to join.
                  </p>
                  <p className="mt-1 text-[12px] text-[color:var(--ink-dim)]">Free for 45 min</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={handleDecline}
                  className="rounded-2xl border border-white/10 py-3 text-[13px] font-medium text-[color:var(--ink-dim)] transition-colors hover:text-ink"
                >
                  Not now
                </button>
                <button
                  onClick={handleWelcome}
                  className="rounded-2xl bg-[var(--coral)] py-3 text-[13px] font-semibold text-white shadow-[0_10px_40px_-10px_var(--coral)] transition-all hover:shadow-[0_14px_50px_-10px_var(--coral)]"
                >
                  Welcome Tara
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
