import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, Pencil } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { rowToViewer, type Quest, type QuestRow, type Ring, type Viewer } from "@/lib/pulse-data";
import { supabase } from "@/integrations/supabase/client";
import { type ComposerSubmit } from "@/components/pulse/QuestComposer";

interface Props {
  waveBurstFrom: { x: number; y: number } | null;
  onSelect: (q: Quest, origin: { x: number; y: number }) => void;
  onEndDay: () => void;
  onOpenProfile: () => void;
  viewer: Viewer | null;
  onViewerLoaded: (v: Viewer) => void;
  composerPayload?: ComposerSubmit | null;
}

const SIZE = 560;
const CENTER = SIZE / 2;
const RING_R: Record<Ring, number> = { inner: 110, middle: 180, outer: 250 };

interface Dot {
  id: string;
  name: string;
  initial: string;
  ring: Ring;
  angle: number; // clockwise from top, degrees
  match: number;
  quest: string;
  why: string;
  opener: string;
  contextType: "session" | "topic" | "situation";
  justAttended: string | null;
  freeUntil: string | null;
  conversationGoal: string | null;
  isTrending?: boolean;
  recentlyExited?: boolean;
  elapsedStr?: string;
  conceptualOverlap?: string;
  collaborationDirection?: string;
  conversationDepth?: string;
  suggestedAdjacentDirections?: string[];
  pullFactor?: number;
  energyPulse?: boolean;
  currentSituation?: string | null;
  distanceStr?: string;
  proximityWarmth?: string;
  isQuietMode?: boolean;
}

// Hardcoded radar population per spec. Positions are designer-specified
// to make the "fresh shared context" cluster read at a glance.
const DOTS: Dot[] = [
  {
    id: "maya",
    name: "Maya",
    initial: "M",
    ring: "inner",
    angle: 45,
    match: 94,
    quest:
      "Coming out of the Metalabs masterclass — want to compare notes on Pip's AI-in-design-process bit before the next session.",
    why: "Maya just left the same room as you. Her quest cites Pip's framing on AI in the design process — exactly what you wanted to keep chewing on.",
    opener:
      "Hey Maya — you were at the Metalabs talk too, right? What did you make of Pip's bit on AI in the loop?",
    contextType: "session",
    justAttended: "AI Design Systems at Scale — Metalabs Masterclass",
    freeUntil: "Free for the next 30 minutes",
    conversationGoal: "Trade takes on Pip's AI-in-design framing",
  },
  {
    id: "tara",
    name: "Tara",
    initial: "T",
    ring: "inner",
    angle: 75,
    match: 92,
    quest:
      "Just left Metalabs. Looking for one good coffee chat about AI tooling in real design teams before the 3pm.",
    why: "Same masterclass, same 30-min window. Tara explicitly wants a coffee chat about AI tooling in design teams.",
    opener: "Tara — caught your quest on the radar. Coffee at the Hall C bar in 10?",
    contextType: "session",
    justAttended: "AI Design Systems at Scale — Metalabs Masterclass",
    freeUntil: "Free until 3:00pm",
    conversationGoal: "Coffee chat about AI tooling in design teams",
  },
  {
    id: "omar",
    name: "Omar",
    initial: "O",
    ring: "inner",
    angle: 110,
    match: 89,
    quest:
      "Fresh out of Metalabs. Curious how others are wiring AI into their design system pipelines.",
    why: "Walked out of the same room minutes ago. Wants to dig into AI in design system pipelines — adjacent to your espresso-bar plan.",
    opener: "Omar — same room as me a minute ago. Want to grab a coffee and unpack it?",
    contextType: "session",
    justAttended: "AI Design Systems at Scale — Metalabs Masterclass",
    freeUntil: "Free for the next 25 minutes",
    conversationGoal: "Compare AI design-system pipelines",
  },
  {
    id: "sarah",
    name: "Sarah",
    initial: "S",
    ring: "middle",
    angle: 200,
    match: 91,
    quest:
      "Want to talk to someone hands-on with AI in production design workflows. 30 min of brain candy.",
    why: "Strong topical overlap with your post-masterclass thread. Sarah's intent reads like a continuation of the room you just left.",
    opener: "Sarah — your quest landed right next to mine. Coffee at Hall C?",
    contextType: "topic",
    justAttended: null,
    freeUntil: "Free for 30 minutes",
    conversationGoal: "Brain candy on AI in production design workflows",
  },
  {
    id: "priya",
    name: "Priya",
    initial: "P",
    ring: "middle",
    angle: 240,
    match: 84,
    quest:
      "Free until 2:45. Down to nerd out on design tokens, AI variant generation, anything spicy.",
    why: "Topical adjacency on AI variant generation. Window aligns with your espresso-bar window.",
    opener: "Priya — radar says we overlap. Espresso bar in 10?",
    contextType: "topic",
    justAttended: null,
    freeUntil: "Free until 2:45pm",
    conversationGoal: "Talk AI variant generation and design tokens",
  },
  {
    id: "raj",
    name: "Raj",
    initial: "R",
    ring: "middle",
    angle: 290,
    match: 86,
    quest:
      "Wandering Hall C looking for one substantive convo about AI-assisted design ops before the next keynote.",
    why: "Situationally co-located in Hall C with a window that matches yours. Wants substance, not small talk.",
    opener: "Raj — I'm heading to the espresso bar in Hall C. Join?",
    contextType: "situation",
    justAttended: null,
    freeUntil: "Free until 3:10pm",
    conversationGoal: "One substantive AI design ops conversation",
  },
  {
    id: "kenji",
    name: "Kenji",
    initial: "K",
    ring: "outer",
    angle: 30,
    match: 78,
    quest: "Open to chat on early-stage design hiring. 20 min window.",
    why: "Lower direct overlap, but adjacent thinking on team-building.",
    opener: "Kenji — short window but radar paired us. Worth a quick hello?",
    contextType: "topic",
    justAttended: null,
    freeUntil: "Free for 20 minutes",
    conversationGoal: "Talk early-stage design hiring",
  },
  {
    id: "marcus",
    name: "Marcus",
    initial: "M",
    ring: "outer",
    angle: 130,
    match: 71,
    quest: "Looking for a founder doing weird things with AI infra.",
    why: "Tangential overlap on AI tooling — could be a fun left-turn conversation.",
    opener: "Marcus — different angle, but our radar pinged. Coffee?",
    contextType: "topic",
    justAttended: null,
    freeUntil: "Free until 3:00pm",
    conversationGoal: "Find a weird AI infra founder",
  },
  {
    id: "sasha",
    name: "Sasha",
    initial: "S",
    ring: "outer",
    angle: 220,
    match: 65,
    quest: "Just want a quiet table and someone interesting for 15 min.",
    why: "Soft overlap. Open to whatever — a low-pressure hello if it's on your way.",
    opener: "Sasha — saw your quest. I'm grabbing a coffee in 10, want to swing by?",
    contextType: "situation",
    justAttended: null,
    freeUntil: "Free for 15 minutes",
    conversationGoal: "A quiet, interesting 15 minutes",
  },
  {
    id: "lin",
    name: "Lin",
    initial: "L",
    ring: "outer",
    angle: 320,
    match: 68,
    quest: "Want to meet a design eng who has shipped AI features end-to-end.",
    why: "Lower priority, but a clean topic match on shipping AI features.",
    opener: "Lin — your quest pinged my radar. Espresso bar in Hall C in 10?",
    contextType: "topic",
    justAttended: null,
    freeUntil: "Free until 3:30pm",
    conversationGoal: "Find a design eng who shipped AI features",
  },
];

const sessionTemplates: Record<
  string,
  {
    shortName: string;
    room: string;
    topicTag: string;
    theme: "AI" | "Startup";
    trendingTopics: string[];
    phrases: {
      maya: string;
      tara: string;
      omar: string;
    };
  }
> = {
  "AI Design Systems at Scale — Metalabs Masterclass": {
    shortName: "AI Design Systems",
    room: "Metalabs Room",
    topicTag: "AI Design",
    theme: "AI",
    trendingTopics: ["Figma token engines", "AI layouts", "auto-spacing"],
    phrases: {
      maya: "compare notes on Pip's AI layout framing and spacing constraints before the next room",
      tara: "chat about scale design tokens and automated variant generation in design workflows",
      omar: "discuss automated developer handoff pipelines with custom AI engine integrations",
    },
  },
  "The Future of Developer Tools — Panel": {
    shortName: "Future of DevTools",
    room: "Stage B",
    topicTag: "Developer Tools",
    theme: "AI",
    trendingTopics: ["Agentic compilers", "Distributed inference", "Memory loops"],
    phrases: {
      maya: "debate agent memory persistence and runtime distributed compiler loops",
      tara: "explore browser-based coding loops and distributed inference performance benchmarks",
      omar: "swapping thoughts on telemetry feedback loops and offline code execution modes",
    },
  },
  "Pricing AI Products — Workshop": {
    shortName: "Pricing AI Products",
    room: "Workshop Room A",
    topicTag: "Pricing Logic",
    theme: "AI",
    trendingTopics: ["Credit optimization", "Token unit economics", "Multi-tenant margins"],
    phrases: {
      maya: "debate credit-based pricing vs. hard pay-per-token billing structures",
      tara: "unpack value-based pricing metrics for enterprise agentic features",
      omar: "discuss API monetization strategies and protecting margins from raw LLM costs",
    },
  },
  "Founder Therapy — Fireside": {
    shortName: "Founder Therapy",
    room: "The Sanctuary Lounge",
    topicTag: "Mental Strength",
    theme: "Startup",
    trendingTopics: ["burnouts", "cofounder split risk", "authentic leadership"],
    phrases: {
      maya: "share stories on managing cofounder split risk and preventing early team burnout",
      tara: "have a quiet, raw conversation about scaling pain, anxiety, and keeping mental fitness high",
      omar: "trade notes on advisor equity dilution and setting expectations with early hires",
    },
  },
  "From Seed to Series A — Keynote": {
    shortName: "Seed to Series A",
    room: "Grand Keynote Hall",
    topicTag: "Funding Pipeline",
    theme: "Startup",
    trendingTopics: ["Institutional rounds", "Warm intro mapping", "Pitch storytelling"],
    phrases: {
      maya: "map out institutional pipelines and structure warm lead intros",
      tara: "review venture pipelines, deck narratives, and milestone checklists in the current market",
      omar: "unpack real Series A expectations and current valuation metrics for seed-stage startups",
    },
  },
  "Building in Public — Panel": {
    shortName: "Building in Public",
    room: "Community Stage",
    topicTag: "Audience growth",
    theme: "Startup",
    trendingTopics: ["Twitter metrics", "Roadmap transparency", "Telemetry sharing"],
    phrases: {
      maya: "talk telemetry log transparency and Twitter audience acquisition rules",
      tara: "build a robust, high-integrity community roadmap and active feedback loop",
      omar: "discuss balancing extreme transparent build-logs with competitive intellectual property IP",
    },
  },
};

function dotToQuest(d: Dot): Quest {
  return {
    id: d.id,
    name: d.name,
    initial: d.initial,
    quest: d.quest,
    ring: d.ring,
    tier: d.match >= 80 ? "high" : "medium",
    match: d.match,
    angle: d.angle,
    why: d.why,
    opener: d.opener,
    contextType: d.contextType,
    justAttended: d.justAttended,
    currentSituation: d.currentSituation ?? null,
    freeUntil: d.freeUntil,
    conversationGoal: d.conversationGoal,
    topic: null,
    conceptualOverlap: d.conceptualOverlap,
    collaborationDirection: d.collaborationDirection,
    conversationDepth: d.conversationDepth,
    suggestedAdjacentDirections: d.suggestedAdjacentDirections,
    pullFactor: d.pullFactor,
    energyPulse: d.energyPulse,
    distanceStr: d.distanceStr,
    proximityWarmth: d.proximityWarmth,
    isQuietMode: d.isQuietMode,
  };
}

function polar(angleDeg: number, r: number) {
  // 0° = top, clockwise
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

export function Radar({
  waveBurstFrom,
  onSelect,
  onEndDay,
  onOpenProfile,
  viewer,
  onViewerLoaded,
  composerPayload,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [burstKey, setBurstKey] = useState(0);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [activeCount, setActiveCount] = useState(23);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const expiresAtRef = useRef<number>(Date.now() + 30 * 60_000);

  const currentDots: Dot[] = useMemo(() => {
    const userSession = composerPayload?.justAttended;
    if (userSession && composerPayload?.contextType === "session") {
      const template =
        sessionTemplates[userSession] ||
        sessionTemplates["AI Design Systems at Scale — Metalabs Masterclass"];
      const activeTheme = template.theme;

      const relatedSessions = Object.keys(sessionTemplates).filter(
        (key) => key !== userSession && sessionTemplates[key].theme === activeTheme,
      );
      const unrelatedSessions = Object.keys(sessionTemplates).filter(
        (key) => sessionTemplates[key].theme !== activeTheme,
      );

      const r1 = relatedSessions[0] || "Pricing AI Products — Workshop";
      const r2 = relatedSessions[1] || "The Future of Developer Tools — Panel";

      const u1 = unrelatedSessions[0] || "Founder Therapy — Fireside";
      const u2 = unrelatedSessions[1] || "From Seed to Series A — Keynote";
      const u3 = unrelatedSessions[2] || "Building in Public — Panel";

      return DOTS.map((d) => {
        if (d.id === "maya") {
          return {
            ...d,
            ring: "inner" as Ring,
            match: 94,
            contextType: "session" as const,
            justAttended: userSession,
            freeUntil: "Free for the next 30 minutes",
            quest: `Coming out of the ${template.shortName} talk. Want to ${template.phrases.maya}.`,
            why: `Maya recently exited the same session (${template.shortName}) 3 minutes ago. Her quest specifically focuses on ${template.trendingTopics[0]}, giving you a high direct overlap.`,
            opener: `Hey Maya — you were at the ${template.shortName} talk too, right? What was your take on their point about ${template.trendingTopics[0]}?`,
            conversationGoal: `Compare notes on ${template.trendingTopics[0]}`,
            isTrending: true,
            recentlyExited: true,
            elapsedStr: "3 min ago",
          };
        }
        if (d.id === "tara") {
          return {
            ...d,
            ring: "inner" as Ring,
            match: 92,
            contextType: "session" as const,
            justAttended: userSession,
            freeUntil: "Free for the next 25 minutes",
            quest: `Fresh out of ${template.shortName}. Looking to ${template.phrases.tara}.`,
            why: `Tara exited your talk (${template.shortName}) 5 minutes ago. She wants to check in on ${template.trendingTopics[1]} which overlaps with your profile.`,
            opener: `Tara — caught your quest from ${template.shortName}. Coffee in 5 to check in on ${template.trendingTopics[1]}?`,
            conversationGoal: `Coffee on ${template.trendingTopics[1]}`,
            isTrending: true,
            recentlyExited: true,
            elapsedStr: "5 min ago",
          };
        }
        if (d.id === "omar") {
          return {
            ...d,
            ring: "inner" as Ring,
            match: 89,
            contextType: "session" as const,
            justAttended: userSession,
            freeUntil: "Free for the next 20 minutes",
            quest: `Exited the ${template.shortName} room. Curious to ${template.phrases.omar}.`,
            why: `Omar walked out of your talk (${template.shortName}) 7 minutes ago. He is looking for immediate post-talk coffee to talk about ${template.trendingTopics[2]}.`,
            opener: `Omar — same room just minutes ago. Join me for coffee to unpack ${template.trendingTopics[2]}?`,
            conversationGoal: `Unpack ${template.trendingTopics[2]} over coffee`,
            isTrending: true,
            recentlyExited: true,
            elapsedStr: "7 min ago",
          };
        }
        if (d.id === "sarah") {
          const tRef = sessionTemplates[r1];
          return {
            ...d,
            ring: "middle" as Ring,
            match: 88,
            contextType: "topic" as const,
            justAttended: r1,
            freeUntil: "Free for 30 minutes",
            quest: `Just walked out of the related session: ${tRef.shortName}. Down to talk about ${tRef.trendingTopics[0]} and adjacent ${template.topicTag} trends.`,
            why: `Sarah just exited a related track (${tRef.shortName}). Her focus on ${tRef.trendingTopics[0]} has high semantic overlap with your main session context.`,
            opener: `Hey Sarah — saw your profile from the ${tRef.shortName} track. Want to grab a coffee and talk about ${tRef.trendingTopics[0]}?`,
            conversationGoal: `Related track exchange on ${tRef.trendingTopics[0]}`,
          };
        }
        if (d.id === "priya") {
          const tRef = sessionTemplates[r2];
          return {
            ...d,
            ring: "middle" as Ring,
            match: 85,
            contextType: "topic" as const,
            justAttended: r2,
            freeUntil: "Free until 4:00 PM",
            quest: `Nerd-diving into the ${tRef.shortName} key concepts. Down to swap live implementation stories on ${tRef.trendingTopics[0]}.`,
            why: `Priya is attending the related session ${tRef.shortName}. Her topic overlaps with your broader context.`,
            opener: `Priya — saw your workspace quest on ${tRef.trendingTopics[0]}. Care to grab an espresso and swap stories?`,
            conversationGoal: `Insights on ${tRef.trendingTopics[0]}`,
          };
        }
        if (d.id === "raj") {
          return {
            ...d,
            ring: "middle" as Ring,
            match: 84,
            contextType: "situation" as const,
            justAttended: null,
            freeUntil: "Free until 3:30 PM",
            quest: `Wandering around Hall C trying to link up with anyone interested in ${template.trendingTopics[1]} or general ${template.topicTag}.`,
            why: `Raj is co-located in Hall C and looking to chat about themes closely related to your session.`,
            opener: `Raj — I'm right in Hall C too. Down for a quick coffee to talk about ${template.topicTag}?`,
            conversationGoal: `Discuss ${template.topicTag}`,
          };
        }
        if (d.id === "kenji") {
          const tRef = sessionTemplates[u1];
          return {
            ...d,
            ring: "outer" as Ring,
            match: 76,
            contextType: "topic" as const,
            justAttended: u1,
            freeUntil: "Free for 20 minutes",
            quest: `Exited ${tRef.shortName}. Open to quick chat on ${tRef.trendingTopics[0]}.`,
            why: `Kenji is attending a different track (${tRef.shortName}). Lower semantic match but interesting side-topic.`,
            opener: `Kenji — caught your quest from the ${tRef.shortName} talk. Worth a quick greeting?`,
            conversationGoal: `Intro to ${tRef.trendingTopics[0]}`,
          };
        }
        if (d.id === "marcus") {
          const tRef = sessionTemplates[u2];
          return {
            ...d,
            ring: "outer" as Ring,
            match: 71,
            contextType: "topic" as const,
            justAttended: u2,
            freeUntil: "Free for 45 minutes",
            quest: `Looking to swap frameworks for ${tRef.trendingTopics[1]} in teams.`,
            why: `Marcus is in the ${tRef.shortName} room. A different angle, but could offer a fresh perspective.`,
            opener: `Marcus — saw your quest on ${tRef.trendingTopics[1]}. Want to grab a coffee?`,
            conversationGoal: `Talk ${tRef.trendingTopics[1]}`,
          };
        }
        if (d.id === "sasha") {
          return {
            ...d,
            ring: "outer" as Ring,
            match: 65,
            contextType: "situation" as const,
            justAttended: null,
            freeUntil: "Free for 15 minutes",
            quest: "Just want a quiet coffee and someone interesting to talk to.",
            why: "Sasha wants a general low-pressure intro, unrelated to session topics.",
            opener: "Sasha — saw your quest. Down to grab a quick coffee block?",
            conversationGoal: "Low pressure conversation",
          };
        }
        if (d.id === "lin") {
          const tRef = sessionTemplates[u3];
          return {
            ...d,
            ring: "outer" as Ring,
            match: 68,
            contextType: "topic" as const,
            justAttended: u3,
            freeUntil: "Free and looking around",
            quest: `Building public roadmaps around ${tRef.trendingTopics[0]} and early systems.`,
            why: `Lin is in the ${tRef.shortName} track. Soft topic match on scalability.`,
            opener: `Lin — caught your quest about ${tRef.trendingTopics[0]}. Coffee in Hall C?`,
            conversationGoal: `Discuss ${tRef.trendingTopics[0]}`,
          };
        }
        return d;
      });
    }

    if (composerPayload?.contextType === "situation") {
      const uBattery = composerPayload.socialBattery ?? 80;
      return DOTS.map((d) => {
        if (d.id === "maya") {
          return {
            ...d,
            ring: "inner" as Ring,
            match: 98,
            contextType: "situation" as const,
            currentSituation: "grabbing coffee ☕",
            freeUntil: "Free for 20 minutes",
            quest: "Grabbing an iced matcha near the espresso bar. Down for a low-pressure talk!",
            why: "Maya is right by the espresso stand and has active coffee-match energy that fits your current mode.",
            opener:
              "Hi Maya — I'm heading to get coffee too. Mind if I say a quick hello near the table?",
            conversationGoal: "Casual coffee break",
            conceptualOverlap: `You are both in decompressing, grab-coffee mode. Easy, direct social alignment with compatible energy (${uBattery}% vs 90%).`,
            collaborationDirection: "Sitting by the high wooden counters next to Stage B.",
            conversationDepth: "Lightweight Coffee Spotting",
            proximityWarmth: "Warm Glow",
            distanceStr: "15 meters away",
            isTrending: true,
            pullFactor: 0.85,
          };
        }
        if (d.id === "tara") {
          return {
            ...d,
            ring: "inner" as Ring,
            match: 94,
            contextType: "situation" as const,
            currentSituation: "open to chat 👋",
            freeUntil: "Free for 30 minutes",
            quest: "Wandering near the startup expo booth. Open to casual hello or quick intro!",
            why: "Tara is right next to you, looking to connect over shared casual interest with no agenda.",
            opener: "Tara — saw you're open to chat near the expo. I'm roaming around, say hi?",
            conversationGoal: "Lightweight Hello",
            conceptualOverlap:
              "Both open for a rapid meetup with friendly, zero-pressure atmosphere.",
            collaborationDirection: "Walking near Expo Hall Row A, looking at hardware booths.",
            conversationDepth: "Spontaneous Hallway Greet",
            proximityWarmth: "Calm Pulse",
            distanceStr: "25 meters away",
            isTrending: true,
            pullFactor: 0.75,
          };
        }
        if (d.id === "omar") {
          return {
            ...d,
            ring: "inner" as Ring,
            match: 91,
            contextType: "situation" as const,
            currentSituation: "decompressing after keynote 🍃",
            freeUntil: "Free for 45 minutes",
            quest:
              "Decompressing on the courtyard benches. Down for quiet passive social presence.",
            why: "Omar is in quiet-mode decompressing nearby, perfect for a low-energy, low-pressure rest space.",
            opener:
              "Omar — also catching some sun in the courtyard. Down for a silent nod or a brief quiet greet.",
            conversationGoal: "Quiet decompression",
            conceptualOverlap:
              "Both seeking to recharge after high-intensity sessions. Silent companion option is fully open.",
            collaborationDirection: "Sitting on the benches near the main green courtyard path.",
            conversationDepth: "Quiet-Mode Passive Connection",
            isQuietMode: true,
            proximityWarmth: "Soft Glow",
            distanceStr: "35 meters away",
            isTrending: false,
            pullFactor: 0.65,
          };
        }
        if (d.id === "sarah") {
          return {
            ...d,
            ring: "middle" as Ring,
            match: 89,
            contextType: "situation" as const,
            currentSituation: "lunch break 🍱",
            freeUntil: "Free for 40 minutes",
            quest: "Grabbing tacos at Food Truck #3. Come join for informal group lunch!",
            why: "Sarah is forming a temporary micro-group at the courtyard tables. Lunch group formation is active!",
            opener:
              "Sarah — saw your food truck ping! I'm in line for tacos too, want to form a taco group?",
            conversationGoal: "Informal Group Lunch",
            conceptualOverlap:
              "Both in lunch break mode looking for dynamic table conversation and casual food buddies.",
            collaborationDirection: "Group of 3 sitting at the red bench outside.",
            conversationDepth: "Casual Lunch Crewing",
            proximityWarmth: "Bright Hearth",
            distanceStr: "50 meters away",
            isTrending: true,
            pullFactor: 0.55,
          };
        }
        if (d.id === "priya") {
          return {
            ...d,
            ring: "middle" as Ring,
            match: 86,
            contextType: "situation" as const,
            currentSituation: "between meetings ⏳",
            freeUntil: "Free for 15 minutes",
            quest: "Have a brief 15min block between client panels. Free for rapid espresso!",
            why: "Priya has a brief gap that perfectly lines up with your available block for quick greetings.",
            opener: "Priya — quick 15 min pitstop before my next panel too. Espresso-bar speedrun?",
            conversationGoal: "Quick espresso pitstop",
            conceptualOverlap:
              "Both looking to fill a tiny gap before sessions with fresh human energy.",
            collaborationDirection: "Staged near the main lounge escalator.",
            conversationDepth: "Express Interaction",
            proximityWarmth: "Active Spark",
            distanceStr: "65 meters away",
            isTrending: false,
            pullFactor: 0.5,
          };
        }
        if (d.id === "raj") {
          return {
            ...d,
            ring: "middle" as Ring,
            match: 85,
            contextType: "situation" as const,
            currentSituation: "walking to next session 🚶",
            freeUntil: "Free for 10 minutes",
            quest: "Strolling towards Hall C for the design showcase. Stroll together!",
            why: "Raj is walking in your exact direction, looking for friendly social walking company.",
            opener: "Raj — heading to Hall C as well! Stroll together for a few mins?",
            conversationGoal: "Hallway travel conversation",
            conceptualOverlap:
              "Both in transit looking to share a light walking conversation on key highlights.",
            collaborationDirection: "Near the pathway entrance to Hall C.",
            conversationDepth: "Walking Companion",
            proximityWarmth: "Pulsing Aura",
            distanceStr: "75 meters away",
            isTrending: false,
            pullFactor: 0.45,
          };
        }
        if (d.id === "kenji") {
          return {
            ...d,
            ring: "outer" as Ring,
            match: 80,
            contextType: "situation" as const,
            currentSituation: "grabbing coffee ☕",
            freeUntil: "Free until 4:15 PM",
            quest:
              "Just got coffee, sitting on the third floor balcony space. Come grab a seat if around!",
            why: "Kenji has passive openness to share space, offering a scenic balcony view.",
            opener: "Kenji — congrats on the coffee score! Sitting at the balcony too?",
            conversationGoal: "Scenic coffee pause",
            conceptualOverlap:
              "Both in coffee decompress mode but from a distance, enjoying balcony vibes.",
            collaborationDirection: "Sitting at Balcony Table 12, overlooking the plaza.",
            conversationDepth: "Quiet Ambient Coffee",
            proximityWarmth: "Soft Glow",
            distanceStr: "100 meters away",
            isTrending: false,
            pullFactor: 0.4,
          };
        }
        if (d.id === "marcus") {
          return {
            ...d,
            ring: "outer" as Ring,
            match: 75,
            contextType: "situation" as const,
            currentSituation: "lunch break 🍱",
            freeUntil: "Free for 35 minutes",
            quest: "Hunting for dumplings near Booth 24. Let's form a rapid food crew!",
            why: "Marcus is looking for people to form a quick sub-group for local snacks.",
            opener: "Marcus — dumpling scouting! Count me in.",
            conversationGoal: "Lightweight food group",
            conceptualOverlap:
              "Both searching out dumpling vendors with friendly, relaxed group-eating vibes.",
            collaborationDirection: "By the dumpling stand in Expo Hall 2.",
            conversationDepth: "Casual Foodie Meetup",
            proximityWarmth: "Warm Aura",
            distanceStr: "120 meters away",
            isTrending: false,
            pullFactor: 0.35,
          };
        }
        if (d.id === "sasha") {
          return {
            ...d,
            ring: "outer" as Ring,
            match: 73,
            contextType: "situation" as const,
            currentSituation: "exploring the venue 🗺️",
            freeUntil: "Free until 5 PM",
            quest: "Just wandering around startup booths looking at cool demos. Walk with me!",
            why: "Exploring the venue at a slower pace, open to friendly encounters.",
            opener: "Sasha — checking out the booths too. Let's walk the arena floor?",
            conversationGoal: "Casual venue stroll",
            conceptualOverlap: "Both enjoying the summit vibe at a relaxed, low-pressure speed.",
            collaborationDirection: "Roaming the Alpha Startup arena, near tech displays.",
            conversationDepth: "Extremely Relaxed Exploration",
            proximityWarmth: "Calm Wave",
            distanceStr: "140 meters away",
            isTrending: false,
            pullFactor: 0.3,
          };
        }
        if (d.id === "lin") {
          return {
            ...d,
            ring: "outer" as Ring,
            match: 70,
            contextType: "situation" as const,
            currentSituation: "decompressing after keynote 🍃",
            freeUntil: "Free until 4 PM",
            quest: "Taking in the keynote replay outdoors in the sun. Passive openness.",
            why: "Lin is in absolute low-energy quiet mode, signaling they are happy to chat if you approach quietly.",
            opener:
              "Lin — relaxing in the courtyard too. Say hi if you are open to casual sunbathing chat.",
            conversationGoal: "Low energy sunbathing chat",
            conceptualOverlap: "Both seeking outdoor tranquility over chaotic inside hallways.",
            collaborationDirection: "Sitting on the lawn, near the east gazebo green belt.",
            conversationDepth: "Quiet-Mode Passive Connection",
            isQuietMode: true,
            proximityWarmth: "Gentle Breeze",
            distanceStr: "150 meters away",
            isTrending: false,
            pullFactor: 0.3,
          };
        }
        return {
          ...d,
          contextType: "situation" as const,
          match: d.match || 70,
          why: `${d.name} is co-located near you. Perfect for low-pressure greetings.`,
        };
      });
    }

    if (composerPayload?.contextType === "topic") {
      const topicText = composerPayload.topic || "Core Topic";
      const matches = (composerPayload.generatedMatches || []) as {
        id: string;
        match: number;
        quest: string;
        why: string;
        opener: string;
        conceptualOverlap?: string;
        collaborationDirection?: string;
        conversationDepth?: string;
        pullFactor?: number;
        energyPulse?: boolean;
        suggestedAdjacentDirections?: string[];
      }[];
      return DOTS.map((d) => {
        const matchObj = matches.find((m) => m.id === d.id);
        if (matchObj) {
          return {
            ...d,
            match: matchObj.match,
            ring:
              matchObj.match >= 93
                ? ("inner" as Ring)
                : matchObj.match >= 85
                  ? ("middle" as Ring)
                  : ("outer" as Ring),
            quest: matchObj.quest,
            why: matchObj.why,
            opener: matchObj.opener,
            contextType: "topic" as const,
            conceptualOverlap: matchObj.conceptualOverlap,
            collaborationDirection: matchObj.collaborationDirection,
            conversationDepth: matchObj.conversationDepth,
            pullFactor: matchObj.pullFactor,
            energyPulse: matchObj.energyPulse,
            suggestedAdjacentDirections: matchObj.suggestedAdjacentDirections,
          };
        }
        return {
          ...d,
          match: d.match || 70,
          contextType: "topic" as const,
          why: `${d.name} is also exploring elements adjacent to ${topicText}. Worth checking alignment.`,
        };
      });
    }

    return DOTS;
  }, [composerPayload]);

  // Pull viewer from Supabase (don't break the data wiring), but fall back
  // to a fixture so the page always demos.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("quests")
        .select("*")
        .eq("is_viewer", true)
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (data) {
        const v = rowToViewer(data as QuestRow);
        onViewerLoaded(v);
        const exp = new Date(v.expiresAt).getTime();
        if (!Number.isNaN(exp) && exp > Date.now()) expiresAtRef.current = exp;
      }
    })();
    return () => {
      active = false;
    };
  }, [onViewerLoaded]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Counter ticks up by 1 every few seconds, sometimes pausing.
  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      const delay = 2200 + Math.random() * 4200; // 2.2s – 6.4s
      setTimeout(() => {
        if (cancelled) return;
        // Sometimes pause (skip a tick)
        if (Math.random() > 0.25) setActiveCount((c) => c + 1);
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
    };
  }, []);

  // The killer detail: tooltip over Maya, then fades.
  useEffect(() => {
    const inT = setTimeout(() => setTooltipVisible(true), 1400);
    const outT = setTimeout(() => setTooltipVisible(false), 1400 + 2500);
    return () => {
      clearTimeout(inT);
      clearTimeout(outT);
    };
  }, []);

  useEffect(() => {
    if (waveBurstFrom) setBurstKey((k) => k + 1);
  }, [waveBurstFrom]);

  const seconds = useMemo(() => {
    return Math.max(0, Math.floor((expiresAtRef.current - now) / 1000));
  }, [now]);
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const minsLeft = Math.max(0, Math.ceil(seconds / 60));

  const justAttended = useMemo(() => {
    const userSession = composerPayload?.justAttended;
    if (userSession) {
      const parts = userSession.split(" — ");
      const namePart = parts[0] ? parts[0] : "AI Design Systems";
      const catPart = parts[1] ? parts[1] : "Session Continuation";
      return `${namePart} · ${catPart}`;
    }
    return "AI Design Systems · Metalabs Masterclass";
  }, [composerPayload]);

  const questText = useMemo(() => {
    return (
      viewer?.questText ??
      composerPayload?.quest ??
      "Grabbing coffee at the espresso bar by Hall C in 10 min. Want to keep chewing on what Pip said about AI in the design process. Room for two."
    );
  }, [viewer, composerPayload]);

  const ringOrderDelay = (r: Ring) => (r === "inner" ? 0 : r === "middle" ? 0.45 : 0.9);

  const mayaPos = polar(45, RING_R.inner);

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 pt-7">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <Wordmark />
        <button
          onClick={onOpenProfile}
          aria-label="Open profile"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white transition-transform hover:scale-105"
          style={{
            background: "linear-gradient(150deg, var(--coral), oklch(0.55 0.22 18))",
            boxShadow: "0 0 18px -4px var(--coral), inset 0 1px 0 0 oklch(1 0 0 / 25%)",
          }}
        >
          {viewer?.initial ?? "A"}
        </button>
      </header>

      {/* Context strip */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 justify-between w-full"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase tracking-[0.22em] font-medium ${
                composerPayload?.contextType === "topic"
                  ? "text-cyan-400"
                  : composerPayload?.contextType === "situation"
                    ? "text-amber-400 font-mono"
                    : "text-[color:var(--ink-dim)]"
              }`}
            >
              {composerPayload?.contextType === "topic"
                ? "TOPIC TARGET"
                : composerPayload?.contextType === "situation"
                  ? "AMBIENT MODE"
                  : "FRESH FROM"}
            </span>
            <span className="text-[12px] font-semibold text-ink/85">
              {composerPayload?.contextType === "topic"
                ? composerPayload.selectedCluster || "Semantic Target"
                : composerPayload?.contextType === "situation"
                  ? composerPayload.currentSituation || "Spontaneous Openness"
                  : justAttended}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]">
              Free for
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/85">
              <Clock size={12} className="text-[var(--coral)]" />
              <span className="tabular-nums">{minsLeft} min</span>
            </span>
          </div>
          {composerPayload?.contextType === "situation" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]">
                Energy
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/85 font-mono">
                <span className="h-2 w-3.5 rounded bg-amber-500/10 border border-amber-500/45 inline-block overflow-hidden relative">
                  <span
                    className="h-full bg-amber-500 absolute left-0 top-0"
                    style={{ width: `${composerPayload.socialBattery ?? 80}%` }}
                  />
                </span>
                {composerPayload.socialBattery ?? 80}%
              </span>
            </div>
          )}
        </div>

        {/* ADAPTIVE TOPIC EVOLUTION CHIPS */}
        {composerPayload?.contextType === "topic" && composerPayload?.suggestedDirections && (
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-mono text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Adaptive Angle
          </div>
        )}
      </motion.div>

      {/* Suggested adjacent directions panel */}
      {composerPayload?.contextType === "topic" && composerPayload?.suggestedDirections && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-3.5 p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 flex flex-wrap items-center gap-2 shadow-[inset_0_1px_12px_rgba(6,182,212,0.04)]"
        >
          <span className="text-[9px] font-mono tracking-widest text-[color:var(--ink-dim)] uppercase block mr-1">
            CONVERGING TOPICAL VECTORS:
          </span>
          {composerPayload.suggestedDirections.map((dir, dIdx) => (
            <motion.span
              key={dir}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + dIdx * 0.08 }}
              className="px-2.5 py-1 rounded-lg bg-neutral-900/60 border border-white/5 text-[11px] text-zinc-300 font-mono flex items-center gap-1 shrink-0"
            >
              <span className="h-1 w-1 rounded-full bg-cyan-400/70" />
              {dir}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* Radar */}
      <div className="relative mx-auto mt-4" style={{ width: "min(100%, 560px, 58vh)" }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block w-full"
          style={{ aspectRatio: "1 / 1", overflow: "hidden" }}
        >
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.20" />
              <stop offset="60%" stopColor="var(--coral)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--coral)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0.55" />
            </linearGradient>
            <radialGradient id="coffeeHotspot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="courtyardHotspot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.65 0.16 180)" stopOpacity="0.22" />
              <stop offset="50%" stopColor="oklch(0.65 0.16 180)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="oklch(0.65 0.16 180)" stopOpacity="0" />
            </radialGradient>
            <filter id="cyanGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>

          {/* Center warm glow */}
          <circle cx={CENTER} cy={CENTER} r={RING_R.outer} fill="url(#centerGlow)" />

          {/* Custom Ambient Heatmap pulses */}
          {heatmapActive && (
            <g opacity={0.65}>
              <radialGradient id="hotspot1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.45" />
                <stop offset="45%" stopColor="var(--coral)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hotspot2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.45" />
                <stop offset="45%" stopColor="var(--cyan)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
              </radialGradient>

              <circle cx="140" cy="160" r="95" fill="url(#hotspot1)">
                <animate attributeName="r" values="85;105;85" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="410" cy="380" r="115" fill="url(#hotspot2)">
                <animate attributeName="r" values="95;120;95" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="210" cy="410" r="85" fill="url(#hotspot1)">
                <animate attributeName="r" values="75;95;75" dur="3s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Ambient Social Warmth Zones — active only in situation mode */}
          {composerPayload?.contextType === "situation" && (
            <g opacity={0.65} style={{ mixBlendMode: "screen" }}>
              <circle cx="395" cy="195" r="95" fill="url(#coffeeHotspot)">
                <animate attributeName="r" values="85;105;85" dur="4.2s" repeatCount="indefinite" />
              </circle>
              <text
                x="395"
                y="135"
                fill="#f97316"
                fontSize="9.5"
                fontWeight={600}
                letterSpacing="0.08em"
                fontFamily="Inter, sans-serif"
                textAnchor="middle"
                opacity={0.8}
              >
                ☕ Stage B Espresso Stand (Active)
              </text>

              {/* Court Yard Quiet Zone */}
              <circle cx="165" cy="375" r="85" fill="url(#courtyardHotspot)">
                <animate attributeName="r" values="75;95;75" dur="5s" repeatCount="indefinite" />
              </circle>
              <text
                x="165"
                y="435"
                fill="oklch(0.65 0.16 180)"
                fontSize="9.5"
                fontWeight={600}
                letterSpacing="0.08em"
                fontFamily="Inter, sans-serif"
                textAnchor="middle"
                opacity={0.8}
              >
                🍃 Decompression Courtyard (Resting)
              </text>
            </g>
          )}

          {/* Rings */}
          {(
            [
              { r: "outer", op: 0.15 },
              { r: "middle", op: 0.25 },
              { r: "inner", op: 0.4 },
            ] as const
          ).map(({ r, op }) => (
            <circle
              key={r}
              cx={CENTER}
              cy={CENTER}
              r={RING_R[r as Ring]}
              fill="none"
              stroke="var(--coral)"
              strokeOpacity={op}
              strokeWidth={1}
            />
          ))}

          {/* Scanning sweep — native SVG rotation around the exact same
              CENTER used by the rings and dots. Avoid CSS transform-origin
              drift between browsers. */}
          <path
            d={`M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - RING_R.outer} A ${RING_R.outer} ${RING_R.outer} 0 0 1 ${CENTER + RING_R.outer * Math.sin(Math.PI / 3)} ${CENTER - RING_R.outer * Math.cos(Math.PI / 3)} Z`}
            fill="url(#sweep)"
            opacity={0.08}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${CENTER} ${CENTER}`}
              to={`360 ${CENTER} ${CENTER}`}
              dur="6s"
              repeatCount="indefinite"
            />
          </path>

          {/* Center heartbeat halos */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={16}
            fill="var(--coral)"
            animate={{ r: [16, 29], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={16}
            fill="var(--coral)"
            animate={{ r: [16, 29], opacity: [0.4, 0] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.45,
            }}
          />

          {/* Adi center dot */}
          <g>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={16}
              fill="var(--coral)"
              style={{ filter: "drop-shadow(0 0 14px var(--coral))" }}
            />
            <text
              x={CENTER}
              y={CENTER + 4}
              fill="white"
              fontSize="12"
              fontWeight={600}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
            >
              {viewer?.initial ?? "A"}
            </text>
          </g>

          {/* Wave burst from a tapped dot */}
          <AnimatePresence>
            {waveBurstFrom && (
              <motion.circle
                key={burstKey}
                cx={waveBurstFrom.x}
                cy={waveBurstFrom.y}
                r={10}
                fill="none"
                stroke="var(--coral)"
                strokeWidth={1.5}
                initial={{ r: 10, opacity: 0.9 }}
                animate={{ r: 320, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          {/* Dots */}
          {currentDots.map((d, i) => {
            const baseR = RING_R[d.ring];
            // Semantic Gravity: Stronger overlap pulls coords closer to center (up to 20% closer)
            const finalR = d.pullFactor ? baseR * (1 - d.pullFactor * 0.18) : baseR;
            const { x, y } = polar(d.angle, finalR);
            const high = d.match >= 80;
            const radius = high ? 7 : 5;
            const baseDelay = ringOrderDelay(d.ring) + (i % 4) * 0.06 + 0.4;
            return (
              <motion.g
                key={d.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: baseDelay,
                  duration: 0.35,
                  ease: "easeOut",
                }}
                style={{
                  cursor: "pointer",
                }}
                onClick={() => onSelect(dotToQuest(d), { x, y })}
              >
                {high && (
                  <>
                    {/* outer soft glow */}
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 8}
                      fill={
                        d.isQuietMode
                          ? "oklch(0.65 0.16 180)"
                          : d.isTrending
                            ? "var(--coral)"
                            : "var(--cyan)"
                      }
                      opacity={d.isQuietMode ? 0.35 : d.isTrending ? 0.25 : 0.18}
                      filter={
                        d.isQuietMode
                          ? "drop-shadow(0 0 6px oklch(0.65 0.16 180))"
                          : d.isTrending
                            ? "drop-shadow(0 0 8px var(--coral))"
                            : "url(#cyanGlow)"
                      }
                    />
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={radius + 4}
                      fill="none"
                      stroke={
                        d.isQuietMode
                          ? "oklch(0.65 0.16 180)"
                          : d.isTrending
                            ? "var(--coral)"
                            : "var(--cyan)"
                      }
                      strokeOpacity={0.45}
                      animate={{
                        r: [radius + 4, radius + 7, radius + 4],
                        opacity: d.isQuietMode ? [0.4, 0.1, 0.4] : [0.55, 0.15, 0.55],
                      }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: (i * 0.21) % 1.4,
                      }}
                    />

                    {/* DYNAMIC TOPIC ENERGY PULSE RING */}
                    {d.energyPulse && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r={radius}
                        fill="none"
                        stroke="var(--cyan)"
                        strokeWidth="1.2"
                        animate={{
                          r: [radius, radius + 15],
                          opacity: [0.8, 0],
                        }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: (i * 0.4) % 2.2,
                        }}
                      />
                    )}

                    {/* DYNAMIC CONVERSATIONAL DEPTH spinning halo indicators */}
                    {d.conversationDepth && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r={radius + 12}
                        fill="none"
                        stroke="rgba(6,182,212,0.6)"
                        strokeWidth="1"
                        strokeDasharray="4 3"
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 8,
                          ease: "linear",
                        }}
                      />
                    )}
                    {d.isTrending && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r={radius + 8}
                        fill="none"
                        stroke="var(--coral)"
                        strokeOpacity={0.6}
                        animate={{
                          r: [radius + 7, radius + 11, radius + 7],
                          opacity: [0.7, 0.1, 0.7],
                        }}
                        transition={{
                          duration: 1.1,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: (i * 0.15) % 1.1,
                        }}
                      />
                    )}
                  </>
                )}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={
                    high
                      ? d.isQuietMode
                        ? "oklch(0.65 0.16 180)"
                        : d.isTrending
                          ? "var(--coral)"
                          : "var(--cyan)"
                      : "oklch(0.97 0.005 280 / 0.6)"
                  }
                  animate={
                    high ? { r: [radius, radius + 1.2, radius] } : { opacity: [0.55, 0.7, 0.55] }
                  }
                  transition={{
                    duration: 1.6 + (i % 5) * 0.18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: (i * 0.27) % 1.6,
                  }}
                  style={{
                    filter: high
                      ? d.isQuietMode
                        ? "drop-shadow(0 0 6px oklch(0.65 0.16 180))"
                        : d.isTrending
                          ? "drop-shadow(0 0 6px var(--coral))"
                          : "drop-shadow(0 0 6px var(--cyan))"
                      : undefined,
                  }}
                />
                <text
                  x={x}
                  y={y + (high ? 3 : 3)}
                  fill={high ? "oklch(0.15 0.02 220)" : "oklch(0.15 0.01 280)"}
                  fontSize={high ? 8 : 7}
                  fontWeight={700}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  style={{ pointerEvents: "none" }}
                >
                  {d.initial}
                </text>
              </motion.g>
            );
          })}

          {/* Ring labels — anchored to the bottom of each ring on the
              south axis so each label clearly belongs to its own ring. */}
          {(composerPayload?.contextType === "situation"
            ? [
                { r: "inner" as Ring, label: "IMMEDIATE (15m - 35m)" },
                { r: "middle" as Ring, label: "NEARBY (50m - 75m)" },
                { r: "outer" as Ring, label: "BEYOND (100m+)" },
              ]
            : [
                { r: "inner" as Ring, label: "ROOM" },
                { r: "middle" as Ring, label: "HALL" },
                { r: "outer" as Ring, label: "VENUE" },
              ]
          ).map(({ r, label }) => (
            <text
              key={label}
              x={CENTER}
              y={CENTER - RING_R[r] - 8}
              fill="var(--ink-dim)"
              fontSize="9"
              letterSpacing="0.22em"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              opacity={0.7}
            >
              {label}
            </text>
          ))}
        </svg>

        {/* "Killer detail" tooltip — anchored over Maya in HTML space so we
            get smooth backdrop blur + soft text rendering. */}
        <AnimatePresence>
          {tooltipVisible && (
            <div
              key="maya-tip-anchor"
              className="pointer-events-none absolute z-10"
              style={{
                left: `${(mayaPos.x / SIZE) * 100}%`,
                top: `${(mayaPos.y / SIZE) * 100}%`,
                transform: "translate(-50%, calc(-100% - 14px))",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -2, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "50% 100%" }}
              >
                <div
                  className="glass-strong relative rounded-xl px-3 py-2 text-[12px] text-ink"
                  style={{
                    borderLeft: "2px solid var(--coral)",
                    whiteSpace: "nowrap",
                    boxShadow: "0 12px 30px -10px oklch(0 0 0 / 60%), 0 0 24px -8px var(--coral)",
                  }}
                >
                  {currentDots.find((d) => d.id === "maya")?.isTrending
                    ? "Maya just left the same session · Unpacking design tokens ⚡"
                    : "Maya just left the same room as you."}
                  <span
                    className="absolute"
                    style={{
                      bottom: -5,
                      left: "50%",
                      width: 10,
                      height: 10,
                      background: "oklch(0.16 0.012 280 / 92%)",
                      borderRight: "1px solid oklch(1 0 0 / 8%)",
                      borderBottom: "1px solid oklch(1 0 0 / 8%)",
                      transform: "translate(-50%, 0) rotate(45deg)",
                    }}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Status line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-1 text-center text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]"
      >
        <motion.span
          key={activeCount}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="font-semibold text-ink/90 tabular-nums"
        >
          {activeCount}
        </motion.span>{" "}
        active quests in the venue · <span className="font-semibold text-ink/90">7</span> in your
        context window
      </motion.p>

      {/* Live Heatmap and Recap Triggers */}
      <div className="flex justify-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => setHeatmapActive(!heatmapActive)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-all border ${
            heatmapActive
              ? "border-[var(--coral)] bg-[var(--coral)]/10 text-white shadow-[0_0_15px_-4px_var(--coral)]"
              : "border-white/10 bg-transparent text-[color:var(--ink-dim)] hover:border-white/20 hover:text-ink"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${heatmapActive ? "bg-[var(--coral)] animate-pulse" : "bg-white/30"}`}
          />
          Live Zone Heatmap
        </button>
        <button
          type="button"
          onClick={onEndDay}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)] transition-colors hover:border-white/20 hover:text-ink"
        >
          End Day Recap 🗺️
        </button>
      </div>

      {/* Quest card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative mx-auto mb-8 mt-5 w-full rounded-2xl p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-dim)]">
            Your quest
          </p>
          <p className="font-mono text-[14px] tabular-nums text-[var(--coral)]">
            {mins}
            <motion.span
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.span>
            {secs}
          </p>
        </div>

        <p className="mt-2 text-[14px] leading-relaxed text-ink">{questText}</p>

        <div className="my-4 h-px w-full bg-white/8" />

        <div className="flex items-center justify-between gap-4 text-[12px] text-[color:var(--ink-dim)]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} className="text-[var(--coral)]" />
            Espresso Bar, Hall C
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} />
            In 10 min
          </span>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-dim)] transition-colors hover:border-white/20 hover:text-ink"
          >
            <Pencil size={11} />
            Edit
          </button>
        </div>
      </motion.div>

      {/* Hidden util to satisfy onEndDay binding without taking visual space */}
      <button onClick={onEndDay} className="sr-only" aria-hidden="true" tabIndex={-1}>
        end day
      </button>
    </main>
  );
}
