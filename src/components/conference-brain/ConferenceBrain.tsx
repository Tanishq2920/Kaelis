import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Flame,
  Radio,
  Users,
  Compass,
  Cpu,
  Sparkles,
  Target,
  Zap,
  ArrowRight,
  Shield,
  Globe,
  Award,
} from "lucide-react";

// Robust TypeScript Definitions
export interface TrendNode {
  id: string;
  title: string;
  momentum: number;
  acceleration: number;
  density: number;
  sentiment: string;
  subtopics: string[];
  relatedTech: string;
  startupOpp: string;
  attendees: string[];
  color: string;
  glowColor: string;
  // Physics Vectors
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

interface ConferenceBrainProps {
  onSelectTrend: (trendText: string, goalText: string) => void;
  userSocialBattery?: number;
}

// Fixed Seed Trends for Collective Intelligence
const SEED_TRENDS = [
  {
    id: "agents",
    title: "AI Agents",
    momentum: 98,
    acceleration: 230,
    density: 84,
    sentiment:
      "Explosive interest in building agentic feedback loops, tool-use controllers, and autonomous task workers with Model Context Protocol (MCP).",
    subtopics: [
      "MCP Servers",
      "Browser-use scripts",
      "Agent Memory persistence",
      "Hierarchical Architectures",
    ],
    relatedTech: "Google GenAI SDK, LangChain, Autogen",
    startupOpp: "Commercial hosting networks for decentralized, heavy-inference agent grids.",
    attendees: ["Maya", "Omar", "Tara"],
    color: "from-rose-500 to-red-500",
    glowColor: "rgba(239, 68, 68, 0.3)",
  },
  {
    id: "mcp",
    title: "MCP Integration",
    momentum: 94,
    acceleration: 180,
    density: 62,
    sentiment:
      "Developers aligning on open rules to link local context files and databases directly with frontier models safely.",
    subtopics: ["Local file resolvers", "Host-client sandboxes", "Dynamic contextual insertion"],
    relatedTech: "Claude Desktop Host, Python-Fastmcp, Node-MCP Wrapper",
    startupOpp: "Secure firewalls and compliance audit proxies for third-party MCP endpoint loops.",
    attendees: ["Omar", "Lin", "Marcus"],
    color: "from-cyan-400 to-blue-500",
    glowColor: "rgba(6, 182, 212, 0.3)",
  },
  {
    id: "rag",
    title: "RAG Infrastructure",
    momentum: 89,
    acceleration: 120,
    density: 51,
    sentiment:
      "Shift in conference dialog from raw vector database matching to GraphRAG paradigms and contextual retrieval pipelines.",
    subtopics: ["Graph Databases", "Context window packing", "Dynamic citation generation"],
    relatedTech: "Neo4j Graph Database, LangGraph, Gemini 2M tokens",
    startupOpp:
      "Sync adapters providing real-time vector-graph pipeline alignment under millisecond constraints.",
    attendees: ["Sarah", "Priya", "Omar"],
    color: "from-purple-500 to-indigo-500",
    glowColor: "rgba(168, 85, 247, 0.3)",
  },
  {
    id: "fundraising",
    title: "AI Fundraising",
    momentum: 87,
    acceleration: 145,
    density: 48,
    sentiment:
      "Venture firms looking to back seed and series-A builders focused heavily on verticalized agents with clear margin defensibility.",
    subtopics: ["Vertical AI sectors", "Secure proprietary datalinks", "Token unit margins"],
    relatedTech: "Warm investor mapping, story-driven Pitch decks",
    startupOpp:
      "AI co-pilot agents optimizing fundraising pipelines and automating inbound qualified introductory emails.",
    attendees: ["Marcus", "Sarah", "Kenji"],
    color: "from-amber-400 to-orange-500",
    glowColor: "rgba(245, 158, 11, 0.3)",
  },
  {
    id: "vectors",
    title: "Vector Databases",
    momentum: 81,
    acceleration: 75,
    density: 37,
    sentiment:
      "Developers consolidating dedicated embedding stores back into production relational databases via pgvector optimizations.",
    subtopics: ["pgvector indexes", "HNSW indexing speeds", "Serverless collection sharding"],
    relatedTech: "PostgreSQL Database, Supabase client, Pinecone Serverless",
    startupOpp:
      "Real-time sync adapters linking high-throughput transactional states to vectorized targets.",
    attendees: ["Lin", "Raj", "Omar"],
    color: "from-green-400 to-emerald-600",
    glowColor: "rgba(16, 185, 129, 0.3)",
  },
  {
    id: "edge",
    title: "Edge AI",
    momentum: 76,
    acceleration: 95,
    density: 29,
    sentiment:
      "High-level interest in executing small, compressed, fine-tuned models client-side via WebGPU for low-latency, private, offline performance.",
    subtopics: ["WebGPU local runtimes", "Model distillation loops", "Privacy boundary sandboxing"],
    relatedTech: "Llama.cpp compilations, Transformers.js module, ONNX engines",
    startupOpp:
      "Fully secure offline AI appliance nodes for pharmaceutical, security, or remote physical environments.",
    attendees: ["Kenji", "Raj", "Sasha"],
    color: "from-pink-500 to-rose-500",
    glowColor: "rgba(236, 72, 153, 0.3)",
  },
  {
    id: "robotics",
    title: "Embodied AI",
    momentum: 72,
    acceleration: 80,
    density: 22,
    sentiment:
      "Robotics labs demonstrating multimodal vision-language-action (VLA) controllers coordinating multi-axis servos in real physical environments.",
    subtopics: ["VLA action schemas", "Sub-millisecond feedback grids", "Physical safety loops"],
    relatedTech: "Google RT-2 model, Nvidia Isaac Labs, Robocraft platforms",
    startupOpp:
      "Low-latency remote simulation pipelines training physical actuators on specialized synthetic tasks.",
    attendees: ["Raj", "Sasha", "Marcus"],
    color: "from-indigo-400 to-violet-600",
    glowColor: "rgba(99, 102, 241, 0.3)",
  },
  {
    id: "safety",
    title: "AI Safety & Guard",
    momentum: 68,
    acceleration: 45,
    density: 18,
    sentiment:
      "Systems engineers discussing multi-layered prompt injection mitigations, rigid output structure schemas, and real-time input boundaries.",
    subtopics: [
      "Heuristic injections scans",
      "Output JSON schemas validation",
      "Static guard layers",
    ],
    relatedTech: "Guardrails AI framework, Pydantic compiler models",
    startupOpp:
      "Real-time compliance monitoring logs and generative safety filters for commercial user input channels.",
    attendees: ["Sasha", "Lin", "Kenji"],
    color: "from-orange-500 to-amber-600",
    glowColor: "rgba(249, 115, 22, 0.3)",
  },
];

// Live Insight Feed Template Phrases
const FEED_PHRASES = [
  "Multi-agent systems discussions increasing rapidly in East Lounge C.",
  "AI infra founders and angel investors are clustering near Startup Showcase B.",
  "Model Context Protocol (MCP) integrations are dominating developer circles near Hall C.",
  "VC panel on series-A valuations just ended; fundraising-related search scores are spiking [+180%].",
  "RAG architecture debates are aligning toward hybrid graph-indexing setups near Stage A.",
  "Edge inference models see sudden acceleration from robotic and low-latency developers in Hall B.",
  "Local pgvector scaling questions trending in database roundtable discussion.",
  "Red-teaming experts gather at Hall C coffee bar to discuss prompt injection security guards.",
  "Spontaneous meetup forming near main courtyard for creators building in public.",
  "Compute unit boundaries debate heating up near the main sponsor booths.",
];

export function ConferenceBrain({ onSelectTrend, userSocialBattery = 80 }: ConferenceBrainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<TrendNode | null>(SEED_TRENDS[0] as never);
  const [nodes, setNodes] = useState<TrendNode[]>([]);
  const [insights, setInsights] = useState<
    { id: string; text: string; time: string; type: "spurt" | "surge" | "cluster" }[]
  >([
    {
      id: "1",
      text: "Conference Brain synchronized. Monitoring 8 active semantic zones.",
      time: "12:53:01",
      type: "cluster",
    },
    {
      id: "2",
      text: "Multi-agent systems discussions increasing rapidly in East Lounge C.",
      time: "12:53:15",
      type: "surge",
    },
    {
      id: "3",
      text: "Model Context Protocol (MCP) integrations are dominating developer circles near Hall C.",
      time: "12:53:26",
      type: "spurt",
    },
  ]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Initialize nodes with random positions but balanced physics properties
  useEffect(() => {
    const width = 500;
    const height = 400;

    const initialized = SEED_TRENDS.map((t, idx) => {
      // Circle layout initially to prevent instant clipping/collisions
      const angle = (idx / SEED_TRENDS.length) * Math.PI * 2;
      const r = 120 + Math.random() * 30;
      const sizeMultiplier = t.momentum / 100; // Bigger momentum = bigger diameter

      return {
        ...t,
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: 55 + sizeMultiplier * 25, // 55px to 80px nodes
      };
    });
    setNodes(initialized as never);
  }, []);

  // Physics Drift Engine & Collision Solver (Runs via RequestAnimationFrame for buttery-smooth performance)
  useEffect(() => {
    if (!isSimulating || nodes.length === 0) return;

    let animId: number;

    const updatePhysics = () => {
      const parent = containerRef.current;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const width = rect.width || 500;
      const height = rect.height || 400;

      setNodes((prevNodes) => {
        // Create deep clone for state safety
        const updated = prevNodes.map((n) => ({ ...n }));

        // 1. Position update and boundary checking
        for (let i = 0; i < updated.length; i++) {
          const n = updated[i];
          n.x += n.vx;
          n.y += n.vy;

          // Wall damping elastic bounce
          const pad = n.size / 2 + 10;
          if (n.x < pad) {
            n.x = pad;
            n.vx *= -0.9;
          } else if (n.x > width - pad) {
            n.x = width - pad;
            n.vx *= -0.9;
          }

          if (n.y < pad) {
            n.y = pad;
            n.vy *= -0.9;
          } else if (n.y > height - pad) {
            n.y = height - pad;
            n.vy *= -0.9;
          }

          // Very gentle attraction center pull to keep dots together
          const dx = width / 2 - n.x;
          const dy = height / 2 - n.y;
          n.vx += dx * 0.00002;
          n.vy += dy * 0.00002;

          // Limit maximum velocity to avoid dizzying jumps
          const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
          if (speed > 0.8) {
            n.vx = (n.vx / speed) * 0.8;
            n.vy = (n.vy / speed) * 0.8;
          }
        }

        // 2. Multi-body elastic collisions (so they don't overlap)
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const n1 = updated[i];
            const n2 = updated[j];

            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rSum = n1.size / 2 + n2.size / 2;

            if (dist < rSum && dist > 0) {
              // Overlap correction factor
              const overlap = rSum - dist;
              const pushX = (dx / dist) * overlap * 0.5;
              const pushY = (dy / dist) * overlap * 0.5;

              n1.x -= pushX;
              n1.y -= pushY;
              n2.x += pushX;
              n2.y += pushY;

              // Elastic velocity exchange
              const nx = dx / dist;
              const ny = dy / dist;

              const kx = n1.vx - n2.vx;
              const ky = n1.vy - n2.vy;
              const p = (2 * (nx * kx + ny * ky)) / 2; // Equal masses simulated 1:1

              n1.vx -= p * nx;
              n1.vy -= p * ny;
              n2.vx += p * nx;
              n2.vy += p * ny;
            }
          }
        }

        return updated;
      });

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, nodes.length]);

  // Canvas Link Connections Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = containerRef.current;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const width = rect.width || 500;
    const height = rect.height || 400;

    // Support high definition displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear previous drawing
    ctx.clearRect(0, 0, width, height);

    // Draw neural link fibers
    ctx.save();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // draw connections when closely aligned in topic coordinates
        if (dist < 180) {
          const alpha = (1 - dist / 180) * 0.28;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);

          // Beautiful tech gradients or flowing cyan/purple dashes
          ctx.strokeStyle = `rgba(147, 51, 234, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(147, 51, 234, 0.4)";
          ctx.stroke();

          // Spark particle flowing along the link node grid
          const time = Date.now() * 0.0013;
          const ratio = (time + i + j) % 1.0;
          const px = n1.x + (n2.x - n1.x) * ratio;
          const py = n1.y + (n2.y - n1.y) * ratio;

          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? "rgba(6, 182, 212, 0.95)" : "rgba(239, 68, 68, 0.95)";
          ctx.shadowBlur = 8;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }, [nodes]);

  // Insight Generator simulation loop - adds live ticking observations
  useEffect(() => {
    const handleAddInsight = () => {
      const index = Math.floor(Math.random() * FEED_PHRASES.length);
      const text = FEED_PHRASES[index];
      const now = new Date();
      const timeStr = [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
      ].join(":");

      const type = index % 3 === 0 ? "surge" : index % 3 === 1 ? "spurt" : "cluster";

      setInsights((prev) => [
        { id: String(Date.now()), text, time: timeStr, type },
        ...prev.slice(0, 7), // keep cap on list size to save space
      ]);

      // Spontaneously increase or decrease momentum of nodes slightly to show living data changes!
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (Math.random() > 0.6) {
            const shift = (Math.random() - 0.45) * 3;
            const newMem = Math.min(100, Math.max(40, Math.round(n.momentum + shift)));
            const newAcc = Math.min(
              400,
              Math.max(10, Math.round(n.acceleration + (Math.random() - 0.45) * 8)),
            );
            return { ...n, momentum: newMem, acceleration: newAcc };
          }
          return n;
        }),
      );
    };

    const interval = setInterval(handleAddInsight, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleActivation = () => {
    if (!selectedNode) return;
    // Prepare a customized goal string that explains what they are looking to talk about
    const goalText = `Keen on "${selectedNode.title}" discussions. Specifically interested in unpacking ${selectedNode.subtopics.slice(0, 3).join(", ")}. Let's share tech stacks, trade co-pilot loops, and discuss "${selectedNode.startupOpp.toLowerCase()}" opportunities.`;
    onSelectTrend(selectedNode.title, goalText);
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full text-left"
      id="conference_brain_dashboard"
    >
      {/* LEFT COLUMN: LIVE SEMANTIC CONFERENCE UNIVERSE GALAXY */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Status Hub Area */}
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between border border-white/[0.05] bg-neutral-900/40 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <div>
              <div className="text-[14px] font-semibold text-white flex items-center gap-1">
                <Brain size={15} className="text-cyan-400 animate-pulse" />
                Live Conference Consciousness
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Pulse Semantic Grid Engine v3.5 · Hotspot Gravity active
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center text-[11px] font-mono bg-zinc-950/60 border border-white/5 px-2.5 py-1 rounded-lg text-zinc-300">
            <Radio size={12} className="text-red-400 animate-pulse" />
            LIVE SIMULATION
          </div>
        </div>

        {/* Neural Network Area with Weather Heatmap clouds */}
        <div className="relative min-h-[350px] sm:min-h-[420px] rounded-3xl border border-white/[0.07] bg-black/75 overflow-hidden shadow-[inset_0_4px_40px_rgba(0,0,0,0.85)] flex flex-col justify-end">
          {/* Animated Weather Heatmap Glow Clouds in background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden blur-[80px] opacity-45">
            <div
              className="absolute -top-[10%] -left-[10%] w-[55%] h-[55%] bg-purple-600 rounded-full animate-bounce"
              style={{ animationDuration: "14s" }}
            />
            <div
              className="absolute top-[40%] right-[5%] w-[45%] h-[45%] bg-rose-600 rounded-full animate-pulse"
              style={{ animationDuration: "9s" }}
            />
            <div
              className="absolute -bottom-[10%] left-[25%] w-[50%] h-[50%] bg-cyan-600 rounded-full animate-pulse"
              style={{ animationDuration: "11s" }}
            />
          </div>

          {/* Grid Blueprint Layer overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Radial Center Core Ambient Gradient */}
          <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06),transparent_80%)] pointer-events-none" />

          {/* Canvas for connection lines and particles */}
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

          {/* Floating Nodes Element Grid (Ref-based drift coordinates) */}
          <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            {nodes.map((n) => {
              const isSelected = selectedNode?.id === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedNode(n)}
                  className="absolute origin-center transition-all duration-300 cursor-pointer select-none group"
                  style={{
                    left: n.x,
                    top: n.y,
                    transform: "translate(-50%, -50%)",
                    width: n.size,
                    height: n.size,
                  }}
                >
                  {/* Outer Pulsing Aura Circle */}
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      backgroundColor: n.glowColor,
                      boxShadow: isSelected
                        ? `0 0 24px 6px ${n.glowColor}, inset 0 0 12px 2px ${n.glowColor}`
                        : `0 0 16px -2px ${n.glowColor}`,
                      animationDuration: isSelected ? "1.8s" : "3.5s",
                      transform: isSelected ? "scale(1.12)" : "scale(1.02)",
                      border: isSelected
                        ? "1px solid rgba(255, 255, 255, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  />

                  {/* Inner Solid Card core */}
                  <div
                    className={`absolute inset-[3px] rounded-full bg-gradient-to-br ${n.color} flex flex-col items-center justify-center text-center p-2 border border-white/10 shadow-lg select-none`}
                  >
                    {/* Hotspot icons or index */}
                    {n.momentum > 85 ? (
                      <Flame size={12} className="text-white animate-bounce shrink-0" />
                    ) : (
                      <Sparkles size={11} className="text-white/80 shrink-0" />
                    )}

                    {/* Node Title fit */}
                    <span className="text-[10px] xs:text-[11px] font-bold leading-tight tracking-tight text-white block mt-0.5 max-w-[90%] truncate">
                      {n.title}
                    </span>

                    {/* Sparkle Momentum score display */}
                    <span className="text-[8px] font-mono text-white/90 font-medium block">
                      {n.momentum}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Instructions Overlay at bottom of canvas */}
          <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 pointer-events-none select-none">
            <p className="text-[10px] text-zinc-300 font-medium flex items-center gap-1.5 uppercase tracking-widest leading-none">
              <Compass size={11} className="text-indigo-400 rotate-12" />
              Hover or click nodes to dissect collective focus
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: REALTTIME AI INSIGHTS & EXPLORATION BOX */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        <AnimatePresence mode="wait">
          {selectedNode ? (
            /* DETAILED DEEP-DIVE INSPECTOR MODE */
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass p-5 rounded-3xl border border-white/[0.08] bg-neutral-900/80 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between shrink-0"
              style={{
                boxShadow: `0 24px 50px -12px rgba(0,0,0,0.7), 0 0 30px -10px ${selectedNode.glowColor}`,
              }}
            >
              {/* Dynamic light streak top line */}
              <div
                className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${selectedNode.color}`}
              />

              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-cyan-400 tracking-widest uppercase block">
                      Active Trend Node
                    </span>
                    <h3 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
                      {selectedNode.title}
                      <Flame size={16} className="text-amber-500 animate-pulse fill-amber-500" />
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <div className="text-right bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                      <span className="text-[8px] text-zinc-400 block leading-none">ACCEL</span>
                      <span className="text-[12px] text-red-400 font-bold leading-normal">
                        +{selectedNode.acceleration}%
                      </span>
                    </div>
                    <div className="text-right bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                      <span className="text-[8px] text-zinc-400 block leading-none">DENSITY</span>
                      <span className="text-[12px] text-indigo-300 font-bold leading-normal">
                        {selectedNode.density} chats
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Sentiment Analysis */}
                <div className="space-y-1 bg-black/25 p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                    <Radio size={10} className="text-red-400 fill-red-400 animate-pulse" />
                    AI COLLECTIVE ANALYSIS:
                  </span>
                  <p className="text-[13px] text-zinc-300 leading-relaxed font-sans font-normal">
                    {selectedNode.sentiment}
                  </p>
                </div>

                {/* Subtopic Chips */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono tracking-wider text-zinc-400 uppercase block font-medium">
                    HOTTEST INTENSITY SUBTOPICS:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.subtopics.map((sub) => (
                      <span
                        key={sub}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/5 text-[11px] text-zinc-300 font-medium font-mono flex items-center gap-1 shrink-0"
                      >
                        <span className="h-1 w-1 rounded-full bg-cyan-400" />
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Startup Opps & Tech */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-xl space-y-0.5">
                    <span className="text-[8px] font-mono text-zinc-400 tracking-wider uppercase flex items-center gap-1">
                      <Cpu size={10} className="text-purple-400" />
                      TECH STACK
                    </span>
                    <p className="text-[11px] font-medium text-zinc-300 truncate leading-snug">
                      {selectedNode.relatedTech}
                    </p>
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-xl space-y-0.5">
                    <span className="text-[8px] font-mono text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                      <Target size={10} />
                      OPPORTUNITY
                    </span>
                    <p className="text-[11px] font-medium text-zinc-300 truncate leading-snug">
                      {selectedNode.startupOpp}
                    </p>
                  </div>
                </div>

                {/* Nearby Active Users in context */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 uppercase">
                    <span>NEARBY ACTIVE CONVERSATIONALISTS:</span>
                    <span className="text-cyan-400 font-bold">
                      {selectedNode.attendees.length} matching
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedNode.attendees.map((att, aIdx) => {
                      const letter = att[0] || "A";
                      const clr =
                        aIdx === 0
                          ? "bg-rose-500 shadow-rose-500/20"
                          : aIdx === 1
                            ? "bg-amber-500 shadow-amber-500/20"
                            : "bg-cyan-500 shadow-cyan-500/20";
                      return (
                        <div
                          key={att}
                          className="flex items-center gap-1.5 bg-black/35 px-2 py-1 rounded-lg border border-white/[0.03]"
                        >
                          <div
                            className={`h-4.5 w-4.5 rounded-full ${clr} text-white flex items-center justify-center text-[9px] font-bold shadow-sm`}
                          >
                            {letter}
                          </div>
                          <span className="text-[11px] font-semibold text-zinc-200">{att}</span>
                        </div>
                      );
                    })}
                    <span className="text-[10px] text-zinc-400 italic">and 5 others...</span>
                  </div>
                </div>
              </div>

              {/* LOCK RECT PANEL ACTION BUTTON */}
              <button
                type="button"
                onClick={handleActivation}
                className={`w-full mt-5 py-3.5 px-4 rounded-2xl bg-gradient-to-r ${selectedNode.color} text-white font-bold text-[14px] flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-[0_8px_24px_-6px_rgba(239,68,68,0.25)] relative group cursor-pointer`}
                style={{
                  boxShadow: `0 8px 24px -6px ${selectedNode.glowColor}`,
                }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <Zap size={14} className="text-white fill-white animate-pulse" />
                Lock Networking Focus on this Topic
                <ArrowRight
                  size={14}
                  className="text-white group-hover:translate-x-1 transition-transform"
                />
              </button>
            </motion.div>
          ) : (
            /* EMPTY INITIAL SELECTION PANEL (SHOULD NOT NATIVELY HAPPEN DUE TO STATE) */
            <div className="glass p-8 rounded-3xl border border-white/[0.05] bg-neutral-900/40 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <Compass
                size={40}
                className="text-zinc-500 animate-spin mb-3"
                style={{ animationDuration: "12s" }}
              />
              <h4 className="text-[15px] font-semibold text-white">Semantic Drift Scanner</h4>
              <p className="text-[12px] text-zinc-400 max-w-xs mt-1">
                Select any trending cluster in the live grid of the conference universe to unpack
                real-time metrics.
              </p>
            </div>
          )}
        </AnimatePresence>

        {/* FEED: DYNAMIC MONITORED INTELLIGENCE OBSERVATIONS */}
        <div
          className="glass p-4 rounded-3xl border border-white/[0.06] bg-neutral-950/45 flex flex-col flex-1 overflow-hidden"
          style={{ minHeight: "180px" }}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 shrink-0">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Pulse Live Intelligence Feed
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider">
              {insights.length} streams
            </span>
          </div>

          <div
            className="flex-1 overflow-y-auto space-y-2 rounded-xl text-[12px] font-mono custom-scrollbar pr-1 relative"
            style={{ maxHeight: "200px" }}
          >
            <AnimatePresence initial={false}>
              {insights.map((ins, iIdx) => {
                const colorMap =
                  ins.type === "surge"
                    ? "text-cyan-400"
                    : ins.type === "spurt"
                      ? "text-rose-400"
                      : "text-amber-400";
                return (
                  <motion.div
                    key={ins.id}
                    initial={{ opacity: 0, x: -6, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.28 }}
                    className="p-2 border border-white/[0.03] bg-zinc-950/25 rounded-xl flex items-start gap-2 sm:gap-2.5"
                  >
                    <span className="text-[10px] text-zinc-500 shrink-0 leading-normal">
                      {ins.time}
                    </span>
                    <div className="flex-1">
                      <span className={`font-semibold mr-1.5 tracking-tightest ${colorMap}`}>
                        [{ins.type.toUpperCase()}]
                      </span>
                      <span className="text-zinc-300 leading-normal">{ins.text}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
