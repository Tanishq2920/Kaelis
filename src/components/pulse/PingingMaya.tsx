import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { Quest } from "@/lib/pulse-data";

interface Props {
  match: Quest;
  onDone: () => void;
}

const PING_TEXT = "Reaching Maya";

export function PingingMaya({ match, onDone }: Props) {
  const [phase, setPhase] = useState<"pinging" | "waved">("pinging");
  const [typed, setTyped] = useState("");

  // Typewriter for "Reaching Maya"
  useEffect(() => {
    if (phase !== "pinging") return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(PING_TEXT.slice(0, i));
      if (i >= PING_TEXT.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, [phase]);

  // Stage transitions: ping (1.8s) -> waved (1.5s) -> onDone
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("waved"), 1800);
    const t2 = setTimeout(() => onDone(), 1800 + 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <main
      className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6"
      style={{
        backgroundImage:
          "radial-gradient(60% 50% at 50% 40%, oklch(0.22 0.07 25 / 35%) 0%, transparent 70%)",
      }}
    >
      {/* Top text */}
      <div className="flex h-12 items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "pinging" ? (
            <motion.div
              key="ping"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-1 text-[13px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]"
            >
              <span>{typed}</span>
              <span className="inline-flex w-5 justify-start">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="ml-[1px] inline-block h-[3px] w-[3px] rounded-full bg-[color:var(--ink-dim)]"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="waved"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3"
            >
              <h2 className="text-[32px] font-semibold tracking-tightest text-ink">
                Maya waved back.
              </h2>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 380,
                  damping: 18,
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--coral)] text-white"
              >
                <Check size={14} strokeWidth={3} />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar with halo */}
      <div className="relative mt-8 flex h-[220px] w-[220px] items-center justify-center">
        {/* Continuous breathing halo (only during ping phase) */}
        {phase === "pinging" &&
          [0, 0.4, 0.8].map((delay, i) => (
            <motion.span
              key={i}
              className="absolute h-[100px] w-[100px] rounded-full"
              style={{
                background: "radial-gradient(circle, var(--cyan) 0%, transparent 70%)",
              }}
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay,
                ease: "easeOut",
              }}
            />
          ))}

        {/* Sharp single pulse on wave-back */}
        <AnimatePresence>
          {phase === "waved" && (
            <motion.span
              key="burst"
              className="absolute h-[100px] w-[100px] rounded-full"
              style={{
                background: "radial-gradient(circle, var(--cyan) 0%, transparent 65%)",
              }}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <motion.div
          animate={
            phase === "waved"
              ? {
                  boxShadow: [
                    "0 0 28px -2px var(--cyan)",
                    "0 0 60px 4px var(--cyan)",
                    "0 0 30px -2px var(--cyan)",
                  ],
                }
              : { boxShadow: "0 0 36px 0px var(--cyan)" }
          }
          transition={{ duration: 0.8 }}
          className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full text-[40px] font-semibold text-white"
          style={{ background: "var(--cyan)" }}
        >
          {match.initial}
        </motion.div>
      </div>

      {/* Context line */}
      <div className="mt-10 h-12 px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="text-[14px] leading-relaxed text-[color:var(--ink-dim)]"
          >
            {phase === "pinging"
              ? "She just left the same room. She's 30 seconds away."
              : "She's grabbing her things. Coffee at the espresso bar in 8 min."}
          </motion.p>
        </AnimatePresence>
      </div>
    </main>
  );
}
