import { motion } from "framer-motion";

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative inline-flex h-2 w-2">
        <motion.span
          className="absolute inset-0 rounded-full bg-[var(--coral)]"
          animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--coral)] shadow-[0_0_12px_var(--coral)]" />
      </span>
      <span className="text-[15px] font-semibold tracking-tightest text-ink">Pulse</span>
    </div>
  );
}
