import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, MapPin, Check, Clock } from "lucide-react";

interface Props {
  questText: string;
  onMet: () => void;
  onDidntHappen: () => void;
}

export function QuestCheckIn({ questText, onMet, onDidntHappen }: Props) {
  const [picked, setPicked] = useState<"met" | "no" | null>(null);

  const handlePick = (choice: "met" | "no") => {
    if (picked) return;
    setPicked(choice);
    setTimeout(() => {
      if (choice === "met") onMet();
      else onDidntHappen();
    }, 650);
  };

  return (
    <main
      className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10"
      style={{
        backgroundImage:
          "radial-gradient(60% 50% at 50% 30%, oklch(0.22 0.05 25 / 35%) 0%, transparent 70%)",
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]">
        Your quest
      </p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass mt-3 rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 text-[14px] text-ink">
          <Coffee size={16} className="text-[var(--coral)]" />
          <span>Adi · Maya · Tara</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-[color:var(--ink-dim)]">
          <MapPin size={14} className="text-[var(--coral)]" />
          <span>Espresso Bar, Hall C</span>
        </div>
        <p className="mt-2 text-[12px] text-[color:var(--ink-dim)]">Started 32 minutes ago</p>
      </motion.div>

      <div className="flex flex-1 flex-col justify-center py-12">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center text-[32px] font-semibold tracking-tightest text-ink"
        >
          How did the coffee go?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-center text-[14px] text-[color:var(--ink-dim)]"
        >
          Pulse only counts the conversations that actually happened.
        </motion.p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChoiceCard
            icon={<Check size={28} className="text-[var(--coral)]" />}
            title="We met."
            subtitle="Real conversation. Worth recording."
            pulseColor="var(--coral)"
            selected={picked === "met"}
            dimmed={picked === "no"}
            onClick={() => handlePick("met")}
          />
          <ChoiceCard
            icon={<Clock size={28} className="text-[color:var(--ink-dim)]" />}
            title="Didn't happen."
            subtitle="Couldn't make it, or didn't click."
            pulseColor="oklch(1 0 0 / 60%)"
            selected={picked === "no"}
            dimmed={picked === "met"}
            onClick={() => handlePick("no")}
          />
        </div>
      </div>
    </main>
  );
}

function ChoiceCard({
  icon,
  title,
  subtitle,
  pulseColor,
  selected,
  dimmed,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  pulseColor: string;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3 }}
      animate={{ opacity: dimmed ? 0.35 : 1 }}
      className="glass relative overflow-hidden rounded-3xl p-6 text-left transition-colors hover:bg-white/5"
      style={{
        borderColor: selected ? "var(--coral)" : undefined,
      }}
    >
      <div className="relative flex h-12 w-12 items-center justify-center">
        {icon}
        <AnimatePresence>
          {selected && (
            <motion.span
              key="pulse"
              initial={{ scale: 0.4, opacity: 0.7 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${pulseColor} 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>
      </div>
      <p className="mt-4 text-[20px] font-semibold text-ink">{title}</p>
      <p className="mt-1 text-[13px] text-[color:var(--ink-dim)]">{subtitle}</p>
    </motion.button>
  );
}

export function DidntHappen({ onRestart }: { onRestart: () => void }) {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-[28px] font-semibold tracking-tightest text-[color:var(--ink-dim)]"
      >
        That's okay.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-3 text-[16px] text-[color:var(--ink-dim)]"
      >
        The right moment doesn't always land.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={onRestart}
        className="mt-10 rounded-2xl bg-[var(--coral)] px-8 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_40px_-10px_var(--coral)] transition-all hover:shadow-[0_14px_50px_-10px_var(--coral)]"
      >
        Find someone else.
      </motion.button>
    </main>
  );
}
