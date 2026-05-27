import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestComposer, type ComposerSubmit } from "@/components/pulse/QuestComposer";
import { Radar } from "@/components/pulse/Radar";
import { MatchSheet } from "@/components/pulse/MatchSheet";
import { MutualWave } from "@/components/pulse/MutualWave";
import { PingingMaya } from "@/components/pulse/PingingMaya";
import { DayRecap } from "@/components/pulse/DayRecap";
import { Profile } from "@/components/pulse/Profile";
import { QuestCheckIn, DidntHappen } from "@/components/pulse/QuestCheckIn";
import { LinkedInCapture } from "@/components/pulse/LinkedInCapture";
import { QuestComplete } from "@/components/pulse/QuestComplete";
import { supabase } from "@/integrations/supabase/client";
import { rowToViewer, type Quest, type QuestRow, type Viewer } from "@/lib/pulse-data";

export type Screen =
  | "compose"
  | "radar"
  | "ping"
  | "wave"
  | "checkin"
  | "didnt"
  | "linkedin"
  | "complete"
  | "recap";

export function PulseApp() {
  const [screen, setScreen] = useState<Screen>("compose");
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [activeMatch, setActiveMatch] = useState<Quest | null>(null);
  const [waved, setWaved] = useState<Quest | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [waveOrigin, setWaveOrigin] = useState<{ x: number; y: number } | null>(null);
  const [composerPayload, setComposerPayload] = useState<ComposerSubmit | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleViewerLoaded = useCallback((v: Viewer) => setViewer(v), []);

  const handleComposeSubmit = useCallback(async (payload: ComposerSubmit) => {
    setComposerPayload(payload);
    const expiresAt = new Date(Date.now() + payload.windowMin * 60_000).toISOString();
    const freeUntilLabel =
      payload.windowMin >= 240
        ? "Free for the rest of the day"
        : `Free for the next ${payload.windowMin} minutes`;
    const tags = payload.topic
      ? [payload.topic]
      : payload.justAttended
        ? ["session"]
        : payload.currentSituation
          ? ["situation"]
          : [];
    const { data } = await supabase
      .from("quests")
      .update({
        quest_text: payload.quest,
        time_window_minutes: payload.windowMin,
        expires_at: expiresAt,
        is_active: true,
        created_at: new Date().toISOString(),
        quest_tags: tags,
        context_type: payload.contextType,
        just_attended: payload.justAttended,
        current_situation: payload.currentSituation,
        free_until: freeUntilLabel,
        conversation_goal: payload.quest,
      } as never)
      .eq("is_viewer", true)
      .select("*")
      .maybeSingle();
    if (data) setViewer(rowToViewer(data as QuestRow));
    setScreen("radar");
  }, []);

  const questText =
    viewer?.questText ??
    "Grabbing coffee at the espresso bar by Hall C in 10 min. Want to keep chewing on what Pip said about AI in the design process. Room for two.";
  const mayaInitial = waved?.initial ?? "M";

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatePresence initial={false}>
        {screen === "compose" && (
          <motion.div
            key="compose"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <QuestComposer onSubmit={handleComposeSubmit} />
          </motion.div>
        )}

        {screen === "radar" && (
          <motion.div
            key="radar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Radar
              viewer={viewer}
              onViewerLoaded={handleViewerLoaded}
              waveBurstFrom={waveOrigin}
              onSelect={(q, origin) => {
                setActiveMatch(q);
                setWaveOrigin(origin);
              }}
              onEndDay={() => setScreen("recap")}
              onOpenProfile={() => setProfileOpen(true)}
              composerPayload={composerPayload}
            />
          </motion.div>
        )}

        {screen === "ping" && waved && (
          <motion.div
            key="ping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <PingingMaya match={waved} onDone={() => setScreen("wave")} />
          </motion.div>
        )}

        {screen === "wave" && waved && (
          <motion.div
            key="wave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <MutualWave match={waved} onDone={() => setScreen("checkin")} />
          </motion.div>
        )}

        {screen === "checkin" && (
          <motion.div
            key="checkin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <QuestCheckIn
              questText={questText}
              onMet={() => setScreen("linkedin")}
              onDidntHappen={() => setScreen("didnt")}
            />
          </motion.div>
        )}

        {screen === "didnt" && (
          <motion.div
            key="didnt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <DidntHappen onRestart={() => setScreen("compose")} />
          </motion.div>
        )}

        {screen === "linkedin" && (
          <motion.div
            key="linkedin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <LinkedInCapture
              mayaInitial={mayaInitial}
              onSave={() => setScreen("complete")}
              onSkip={() => setScreen("complete")}
            />
          </motion.div>
        )}

        {screen === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <QuestComplete
              questText={questText}
              mayaInitial={mayaInitial}
              onSeeQuests={() => {
                setProfileOpen(true);
                setScreen("radar");
              }}
              onFindNew={() => setScreen("compose")}
            />
          </motion.div>
        )}

        {screen === "recap" && (
          <motion.div
            key="recap"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar"
          >
            <DayRecap onBack={() => setScreen("radar")} composerPayload={composerPayload} />
          </motion.div>
        )}
      </AnimatePresence>

      <MatchSheet
        match={activeMatch}
        onClose={() => setActiveMatch(null)}
        onWave={(q) => {
          setActiveMatch(null);
          setWaved(q);
          setTimeout(() => setScreen("ping"), 350);
        }}
        composerPayload={composerPayload}
      />

      <Profile
        viewer={viewer}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onNewQuest={() => {
          setProfileOpen(false);
          setScreen("compose");
        }}
      />
    </div>
  );
}
