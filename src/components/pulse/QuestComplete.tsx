import { motion } from "framer-motion";
import { Coffee } from "lucide-react";

interface Props {
  questText: string;
  mayaInitial: string;
  onSeeQuests: () => void;
  onFindNew: () => void;
}

export function QuestComplete({ questText, mayaInitial, onSeeQuests, onFindNew }: Props) {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center px-6 py-10">
      {/* Pulsing coral ambient */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.15, 0.05, 0.15] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          backgroundImage: "radial-gradient(60% 50% at 50% 45%, var(--coral) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center pt-6">
        {/* Hero avatars with single expanding ring */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center justify-center gap-5"
        >
          <motion.span
            aria-hidden
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="absolute inset-[-40px] rounded-full"
            style={{
              border: "2px solid var(--coral)",
              boxShadow: "0 0 60px 0 var(--coral)",
            }}
          />

          <Avatar initial="A" color="var(--coral)" />
          <div className="flex flex-col items-center">
            <Coffee size={36} className="text-[var(--coral)]" strokeWidth={1.6} />
          </div>
          <Avatar initial={mayaInitial} color="var(--cyan)" />
          <Avatar initial="T" color="var(--cyan)" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 text-center text-[40px] font-semibold tracking-tightest text-ink"
        >
          Quest complete.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="mt-3 text-center text-[22px] text-ink"
        >
          Two new connections, made in 30 minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="glass mt-8 max-w-md rounded-2xl p-5"
        >
          <p className="text-center text-[14px] italic leading-relaxed text-[color:var(--ink-dim)]">
            "{questText}"
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.5 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <button
            onClick={onSeeQuests}
            className="rounded-2xl border px-6 py-3 text-[13px] font-medium text-ink transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--cyan)" }}
          >
            See all my quests
          </button>
          <button
            onClick={onFindNew}
            className="rounded-2xl bg-[var(--coral)] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_10px_40px_-10px_var(--coral)] transition-all hover:shadow-[0_14px_50px_-10px_var(--coral)]"
          >
            Find someone new
          </button>
        </motion.div>
      </div>
    </main>
  );
}

function Avatar({ initial, color }: { initial: string; color: string }) {
  return (
    <motion.div
      animate={{
        boxShadow: [`0 0 24px -4px ${color}`, `0 0 44px 0px ${color}`, `0 0 24px -4px ${color}`],
      }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className="flex h-[64px] w-[64px] items-center justify-center rounded-full text-[22px] font-semibold text-white"
      style={{ background: color }}
    >
      {initial}
    </motion.div>
  );
}
