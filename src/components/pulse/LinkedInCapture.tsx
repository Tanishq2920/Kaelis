import { useState } from "react";
import { motion } from "framer-motion";
import { Linkedin, Loader2 } from "lucide-react";

interface Props {
  mayaInitial: string;
  onSave: () => void;
  onSkip: () => void;
}

export function LinkedInCapture({ mayaInitial, onSave, onSkip }: Props) {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    setTimeout(onSave, 500);
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]">
        Quest completion · Step 2 of 3
      </p>

      <div className="flex flex-1 flex-col justify-center py-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center text-[34px] font-semibold tracking-tightest text-ink"
        >
          Make it last.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-center text-[14px] text-[color:var(--ink-dim)]"
        >
          Drop in their LinkedIn so the conversation outlives the conference.
        </motion.p>

        <div className="mt-12 flex items-start justify-center gap-6 sm:gap-10">
          <PersonColumn initial="A" color="var(--coral)" label="You" delay={0.3} />
          <PersonColumn
            initial={mayaInitial}
            color="var(--cyan)"
            label="Maya"
            url="linkedin.com/in/maya-chen-design"
            delay={0.45}
          />
          <PersonColumn
            initial="T"
            color="var(--cyan)"
            label="Tara"
            url="linkedin.com/in/tara-okafor"
            delay={0.6}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="mt-12 flex items-center justify-between gap-4"
        >
          <button
            onClick={onSkip}
            className="text-[13px] text-[color:var(--ink-dim)] underline-offset-4 hover:text-ink hover:underline"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--coral)] px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_40px_-10px_var(--coral)] transition-all hover:shadow-[0_14px_50px_-10px_var(--coral)] disabled:opacity-80"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            <span>{saving ? "Saving…" : "Save these connections →"}</span>
          </button>
        </motion.div>
      </div>
    </main>
  );
}

function PersonColumn({
  initial,
  color,
  label,
  url,
  delay,
}: {
  initial: string;
  color: string;
  label: string;
  url?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center"
    >
      {url ? (
        <div className="glass mb-3 flex h-9 w-[180px] items-center gap-2 rounded-full px-3">
          <Linkedin size={14} className="shrink-0 text-[var(--cyan)]" />
          <span className="truncate text-[12px] text-ink">{url}</span>
        </div>
      ) : (
        <div className="mb-3 h-9 w-[180px]" />
      )}

      <motion.div
        animate={{
          boxShadow: [`0 0 18px -4px ${color}`, `0 0 32px 0px ${color}`, `0 0 18px -4px ${color}`],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-[64px] w-[64px] items-center justify-center rounded-full text-[22px] font-semibold text-white"
        style={{ background: color }}
      >
        {initial}
      </motion.div>
      <p className="mt-2 text-[12px] text-[color:var(--ink-dim)]">{label}</p>
    </motion.div>
  );
}
