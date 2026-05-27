import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  Zap,
  BookOpen,
  TrendingUp,
  Brain,
  Layers,
  Briefcase,
  Cpu,
  Target,
  Compass,
  CornerDownRight,
  Plus,
  Check,
  User,
  Activity,
  ArrowRight,
} from "lucide-react";
import { expandTopicGraph } from "@/lib/gemini.server";

// Define categories structure
type NodeType = "core" | "subtopic" | "tech" | "business-model" | "use-case" | "people-archetype";

export interface SemanticItem {
  label: string;
  type: NodeType;
  summary: string;
  rationale?: string;
  confidence?: number;
  insight?: {
    summary: string;
    useCases: string[];
    startupOpportunities: string[];
    relatedTech: string[];
    trends: string;
    prompts: string[];
    learningRoadmap: string[];
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  summary: string;
  rationale?: string;
  confidence?: number;
  insight?: {
    summary: string;
    useCases: string[];
    startupOpportunities: string[];
    relatedTech: string[];
    trends: string;
    prompts: string[];
    learningRoadmap: string[];
  };
  // Physics positions
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

interface SemanticGraphProps {
  initialTopic: string;
  onSelectGoal: (clusterTitle: string, clusterSub: string) => void;
  onClose?: () => void;
  isOverlay?: boolean;
}

// Particle interface
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

const CATEGORY_THEMES: Record<
  NodeType,
  {
    glow: string;
    bg: string;
    border: string;
    text: string;
    badge: string;
    Icon: React.ElementType;
  }
> = {
  core: {
    glow: "rgba(6, 182, 212, 0.4)",
    bg: "bg-cyan-950/90",
    border: "border-cyan-400",
    text: "text-cyan-400",
    badge: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    Icon: Brain,
  },
  subtopic: {
    glow: "rgba(139, 92, 246, 0.35)",
    bg: "bg-violet-950/90",
    border: "border-violet-400",
    text: "text-violet-400",
    badge: "bg-violet-400/10 text-violet-400 border-violet-400/20",
    Icon: Layers,
  },
  tech: {
    glow: "rgba(244, 63, 94, 0.35)",
    bg: "bg-rose-950/90",
    border: "border-rose-400",
    text: "text-rose-400",
    badge: "bg-rose-400/10 text-rose-400 border-rose-400/20",
    Icon: Cpu,
  },
  "business-model": {
    glow: "rgba(16, 185, 129, 0.35)",
    bg: "bg-emerald-950/90",
    border: "border-emerald-400",
    text: "text-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    Icon: Briefcase,
  },
  "use-case": {
    glow: "rgba(245, 158, 11, 0.35)",
    bg: "bg-amber-950/90",
    border: "border-amber-400",
    text: "text-amber-400",
    badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    Icon: Target,
  },
  "people-archetype": {
    glow: "rgba(59, 130, 246, 0.35)",
    bg: "bg-blue-950/90",
    border: "border-blue-400",
    text: "text-blue-400",
    badge: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    Icon: User,
  },
};

const stubActiveNode: GraphNode = {
  id: "stub-temp",
  label: "Analyzing...",
  type: "subtopic",
  summary: "Initialising knowledge constellation...",
  confidence: 100,
  insight: {
    summary: "Scanning context node streams around designated coordinates.",
    useCases: ["Analysing cluster values..."],
    startupOpportunities: ["Detecting market velocity..."],
    relatedTech: ["Semantic Matrix"],
    trends: "Detecting alignment direction...",
    prompts: ["Preparing contextual networking vectors..."],
    learningRoadmap: ["Connecting dynamic cluster feeds..."],
  },
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  depth: 0,
};

export function SemanticGraph({
  initialTopic,
  onSelectGoal,
  onClose,
  isOverlay = false,
}: SemanticGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Core semantic data states
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Search and load states
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Panoramic Transform State for Zoom/Pan
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Right Drawer active tab
  const [activePanelTab, setActivePanelTab] = useState<"insights" | "prompts" | "roadmap">(
    "insights",
  );

  // Physics constraints config
  const springLength = 140;
  const kSpring = 0.05; // Spring stiffness
  const repulsionForce = 4500; // Force repelling nodes
  const friction = 0.82; // Momentum damping
  const centerGravity = 0.035; // Center binding force

  // Procedural Particles Field background
  const [particles, setParticles] = useState<Particle[]>([]);

  // Sound cue simulation (visual sparks)
  const [sparking, setSparking] = useState(false);

  // Core Root Tracker
  const rootNodeLabel = initialTopic || "AI Agents";

  // Build root node & fetch initial semantic branches
  useEffect(() => {
    const parentWidth = containerRef.current?.clientWidth || 800;
    const parentHeight = containerRef.current?.clientHeight || 500;
    const centerX = parentWidth / 2;
    const centerY = parentHeight / 2;

    const initialRoot: GraphNode = {
      id: "root-0",
      label: rootNodeLabel,
      type: "core",
      summary: `The neural foundation topic representing "${rootNodeLabel}" discussions.`,
      depth: 0,
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      confidence: 100,
      insight: {
        summary: `A paramount direction addressing ${rootNodeLabel} core technical dynamics, emerging architectural constraints, and strategic market implications for software builders.`,
        useCases: [
          `Rapid sandbox deployment testing around ${rootNodeLabel}`,
          "Optimizing multi-agent network pipelines with low computing overhead",
        ],
        startupOpportunities: [
          `Commercial middlewares indexing telemetry streams of ${rootNodeLabel}`,
          "Low-code interface toolboxes allowing fluid drag-and-deploy operations",
        ],
        relatedTech: ["Web APIs", "Client Pipelines", "Multi-Thread Handlers"],
        trends: "Rapidly Emerging Conference Highlight (Top 3 discussed)",
        prompts: [
          `What led you to focus on ${rootNodeLabel} as your core project domain?`,
          "Where have you experienced the highest deployment drag inside this paradigm?",
        ],
        learningRoadmap: [
          "Delineate basic security trust boundaries",
          "Map performance overhead across standard browsers",
          "Design scalable feedback loops for user actions",
        ],
      },
    };

    setNodes([initialRoot]);
    setSelectedNodeId("root-0");
    triggerInitialization(initialRoot, centerX, centerY);
    generateBackgroundParticles(parentWidth, parentHeight);
  }, [rootNodeLabel]);

  // Setup Background Particles procedural movement
  const generateBackgroundParticles = (w: number, h: number) => {
    const freshParticles: Particle[] = [];
    const colors = [
      "rgba(6, 182, 212, 0.15)",
      "rgba(139, 92, 246, 0.12)",
      "rgba(244, 63, 94, 0.08)",
    ];
    for (let i = 0; i < 40; i++) {
      freshParticles.push({
        id: i,
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        color: colors[i % colors.length],
      });
    }
    setParticles(freshParticles);
  };

  // Particles dynamic frame updates
  useEffect(() => {
    let frameId: number;
    const updateParticles = () => {
      setParticles((prev) =>
        prev.map((p) => {
          let nx = p.x + p.speedX;
          let ny = p.y + p.speedY;
          const parentWidth = containerRef.current?.clientWidth || 800;
          const parentHeight = containerRef.current?.clientHeight || 500;

          if (nx < 0) nx = parentWidth;
          if (nx > parentWidth) nx = 0;
          if (ny < 0) ny = parentHeight;
          if (ny > parentHeight) ny = 0;

          return { ...p, x: nx, y: ny };
        }),
      );
      frameId = requestAnimationFrame(updateParticles);
    };
    frameId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Root Node bootstrap expander
  const triggerInitialization = async (rootNode: GraphNode, cx: number, cy: number) => {
    setLoading(true);
    setLoadingMessage("Gemini expanding semantic universe nodes...");
    try {
      const res = await expandTopicGraph({
        data: {
          topic: rootNode.label,
          existingNodes: [rootNode.label],
        },
      });

      if (res && res.relatedNodes) {
        const angleStep = (2 * Math.PI) / res.relatedNodes.length;
        const newNodes: GraphNode[] = res.relatedNodes.map((item: SemanticItem, idx: number) => {
          const angle = idx * angleStep;
          const dist = springLength * 1.25;
          return {
            id: `node-${idx + 1}`,
            label: item?.label || "Adjacent Topic",
            type: item?.type || "subtopic",
            summary: item?.summary || "",
            rationale: item?.rationale || "",
            confidence: item?.confidence || 80,
            insight: item?.insight || {
              summary: "Insight loading...",
              useCases: [],
              startupOpportunities: [],
              relatedTech: [],
              trends: "",
              prompts: [],
              learningRoadmap: [],
            },
            depth: 1,
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
          };
        });

        const newLinks: GraphLink[] = newNodes.map((n) => ({
          source: rootNode.id,
          target: n.id,
          strength: 1.0,
        }));

        setNodes([rootNode, ...newNodes]);
        setLinks(newLinks);
      }
    } catch (e) {
      console.error("Galaxy Initial Load Failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // Node Clicking - Expand adjacent concept branches recursively
  const handleNodeClick = async (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setSparking(true);
    setTimeout(() => setSparking(false), 900);

    // If node is already expanded (not core depth 0) and has deep connections, just view.
    // Otherwise, we load the child leaves!
    const leafNodesCount = nodes.filter((n) => n.id.startsWith(`leaf-${node.id}`)).length;
    if (leafNodesCount > 0 || node.depth > 1) {
      return;
    }

    setLoading(true);
    setLoadingMessage(`Gemini exploring branches around "${node.label}"...`);

    try {
      const currentLabelList = nodes.filter(Boolean).map((n) => n.label);
      const res = await expandTopicGraph({
        data: {
          topic: node.label,
          parentTopic: nodes.find((n) => n && n.id === "root-0")?.label,
          existingNodes: currentLabelList,
        },
      });

      if (res && res.relatedNodes) {
        const count = res.relatedNodes.length;
        const angleStep = (2 * Math.PI) / count;

        const startAngle = Math.random() * Math.PI;

        const leafNodes: GraphNode[] = res.relatedNodes
          .slice(0, 4)
          .map((item: SemanticItem, idx: number) => {
            const angle = startAngle + idx * angleStep;
            const dist = springLength * 0.85;

            return {
              id: `leaf-${node.id}-${idx}`,
              label: item?.label || "Adjacent Topic",
              type: item?.type || "subtopic",
              summary: item?.summary || "",
              rationale: item?.rationale || "",
              confidence: item?.confidence || 80,
              insight: item?.insight || {
                summary: "Insight loading...",
                useCases: [],
                startupOpportunities: [],
                relatedTech: [],
                trends: "",
                prompts: [],
                learningRoadmap: [],
              },
              depth: node.depth + 1,
              x: node.x + Math.cos(angle) * dist,
              y: node.y + Math.sin(angle) * dist,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
            };
          });

        const newLinks: GraphLink[] = leafNodes.map((n) => ({
          source: node.id,
          target: n.id,
          strength: 0.8,
        }));

        setNodes((prev) => [...prev, ...leafNodes]);
        setLinks((prev) => [...prev, ...newLinks]);
      }
    } catch (err) {
      console.error("Recursive node expansion failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Searching nodes directly and focal warping
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Direct search inside existing nodes
    const localMatch = nodes.find((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()));

    if (localMatch) {
      setSelectedNodeId(localMatch.id);
      // Pan to the matched location smoothly
      const w = containerRef.current?.clientWidth || 800;
      const h = containerRef.current?.clientHeight || 500;
      setPanOffset({
        x: w / 2 - localMatch.x * zoom,
        y: h / 2 - localMatch.y * zoom,
      });
      setSearchQuery("");
      return;
    }

    // Not in local nodes: generate semantic root around searched topic
    setLoading(true);
    setLoadingMessage(`Gemini anchoring a brand-new Semantic Universe for "${searchQuery}"...`);
    try {
      const parentWidth = containerRef.current?.clientWidth || 800;
      const parentHeight = containerRef.current?.clientHeight || 500;
      const centerX = parentWidth / 2;
      const centerY = parentHeight / 2;

      const newRoot: GraphNode = {
        id: `root-${Date.now()}`,
        label: searchQuery,
        type: "core",
        summary: `Custom generated mind map surrounding "${searchQuery}" concepts.`,
        depth: 0,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        confidence: 100,
        insight: {
          summary: `A targeted inquiry analyzing the technical patterns, GTM structures, and development frameworks surrounding "${searchQuery}".`,
          useCases: [
            `Prototyping core workflows based on ${searchQuery}`,
            `Interfacing enterprise stacks with ${searchQuery} APIs`,
          ],
          startupOpportunities: [
            `SaaS management platforms coordinating ${searchQuery} instances`,
            `Open source libraries optimizing cold boot times`,
          ],
          relatedTech: ["Next-gen SDKs", "REST interfaces", "Native wrappers"],
          trends: "Hyper momentum category, rapid startup interest",
          prompts: [
            `What is the main barrier in loading ${searchQuery} into current configurations?`,
            `How do you measure productivity uplift since integrating ${searchQuery}?`,
          ],
          learningRoadmap: [
            "Deconstruct structural baseline elements",
            "Trace operational boundaries",
            "Deploy a minor secure endpoint trial",
          ],
        },
      };

      setNodes([newRoot]);
      setSelectedNodeId(newRoot.id);
      setPanOffset({ x: 0, y: 0 }); // Center pan
      setZoom(1);
      await triggerInitialization(newRoot, centerX, centerY);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setSearchQuery("");
    }
  };

  // 2D Realtime Force-Directed Physics Logic Loop
  useEffect(() => {
    let animId: number;

    const runPhysics = () => {
      setNodes((prevNodes) => {
        if (prevNodes.length === 0) return prevNodes;

        const parentWidth = containerRef.current?.clientWidth || 800;
        const parentHeight = containerRef.current?.clientHeight || 500;
        const cx = parentWidth / 2;
        const cy = parentHeight / 2;

        const updated = prevNodes.map((n) => ({
          ...n,
          vx: n.vx || 0,
          vy: n.vy || 0,
        }));

        // 1. Repulsion between all nodes
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const nA = updated[i];
            const nB = updated[j];

            const dx = nB.x - nA.x || 1;
            const dy = nB.y - nA.y || 1;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < springLength * 2.5) {
              const force = repulsionForce / (distance * distance || 1);
              const fx = (dx / distance) * force;
              const fy = (dy / distance) * force;

              // Don't push anchored/dragged nodes
              updated[i].vx -= fx;
              updated[i].vy -= fy;
              updated[j].vx += fx;
              updated[j].vy += fy;
            }
          }
        }

        // 2. Spring attraction along links
        links.forEach((l) => {
          const sNode = updated.find((n) => n.id === l.source);
          const tNode = updated.find((n) => n.id === l.target);

          if (!sNode || !tNode) return;

          const dx = tNode.x - sNode.x || 1;
          const dy = tNode.y - sNode.y || 1;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Spring force
          const force = (distance - springLength) * kSpring * l.strength;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          const sIdx = updated.findIndex((n) => n.id === l.source);
          const tIdx = updated.findIndex((n) => n.id === l.target);

          updated[sIdx].vx += fx;
          updated[sIdx].vy += fy;
          updated[tIdx].vx -= fx;
          updated[tIdx].vy -= fy;
        });

        // 3. Gravity binding to center core + Friction + Integrations
        return updated.map((n) => {
          // Inner core is strongly bonded to coordinate center
          const gx = (cx - n.x) * centerGravity * (n.depth === 0 ? 0.8 : 0.25);
          const gy = (cy - n.y) * centerGravity * (n.depth === 0 ? 0.8 : 0.25);

          let vx = (n.vx + gx) * friction;
          let vy = (n.vy + gy) * friction;

          // Limit speed
          const speed = Math.sqrt(vx * vx + vy * vy);
          const maxSpeed = 16;
          if (speed > maxSpeed) {
            vx = (vx / speed) * maxSpeed;
            vy = (vy / speed) * maxSpeed;
          }

          // Bound within viewport limits
          let nx = n.x + vx;
          let ny = n.y + vy;

          const margin = 50;
          if (nx < margin) {
            nx = margin;
            vx = 0;
          }
          if (nx > parentWidth - margin) {
            nx = parentWidth - margin;
            vx = 0;
          }
          if (ny < margin) {
            ny = margin;
            vy = 0;
          }
          if (ny > parentHeight - margin) {
            ny = parentHeight - margin;
            vy = 0;
          }

          return {
            ...n,
            x: nx,
            y: ny,
            vx,
            vy,
          };
        });
      });

      animId = requestAnimationFrame(runPhysics);
    };

    animId = requestAnimationFrame(runPhysics);
    return () => cancelAnimationFrame(animId);
  }, [links]);

  // Map Canvas Panning Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Left click only
    if (e.button !== 0) return;
    setPanning(true);
    setPanOrigin({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panning) return;
    setPanOffset({
      x: e.clientX - panOrigin.x,
      y: e.clientY - panOrigin.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setPanning(false);
  };

  const activeNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0] || stubActiveNode;
  }, [nodes, selectedNodeId]);

  const previewNode = useMemo(() => {
    return nodes.find((n) => n.id === hoveredNodeId);
  }, [nodes, hoveredNodeId]);

  // Export Chosen Node context back as the user's quest goal
  const handleAlignQuest = () => {
    if (!activeNode || activeNode.id === "stub-temp") return;
    // Call props function to feed target values back into step state!
    onSelectGoal(
      activeNode.label,
      activeNode.summary || `Semantic connection built surrounding ${activeNode.label}`,
    );
    if (onClose) onClose();
  };

  return (
    <div
      id="semantic-universe-canvas"
      className={`relative w-full h-full flex flex-col bg-neutral-980 border border-white/5 rounded-3xl overflow-hidden select-none ${
        isOverlay
          ? "fixed inset-0 z-55 bg-black/95 m-0 rounded-none border-0"
          : "min-h-[460px] md:min-h-[520px]"
      }`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      {/* Background Static Gradients & Particles Canvas */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(11,20,38,1)_0%,rgba(5,5,10,1)_100%)] pointer-events-none" />
      <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/5 blur-[120px] pointer-events-none animate-pulse rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 blur-[120px] pointer-events-none animate-pulse rounded-full" />

      {/* Background floating particles */}
      <svg className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={p.color}
            className="transition-all"
          />
        ))}
      </svg>

      {/* Grid coordinates */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1px)",
          backgroundSize: "28px 28px",
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: "center",
        }}
      />

      {/* Interactive Hub Search & Header Menu */}
      <div className="absolute top-4 sm:top-5 inset-x-4 sm:inset-x-6 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(6,182,212,0.6)]">
            <Sparkles className="h-4.5 w-4.5 text-white animate-spin-slow" />
          </div>
          <div>
            <span className="block text-[13px] font-semibold text-white tracking-wide">
              Semantic Galaxy OS
            </span>
            <span className="block text-[9px] uppercase font-mono tracking-widest text-[#06b6d4]">
              Intel core mapping • v3.5
            </span>
          </div>
        </div>

        {/* Global Search Node Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center bg-black/50 border border-white/10 rounded-full px-4 py-1.5 w-full sm:max-w-xs focus-within:border-cyan-400/50 focus-within:bg-black/80 transition-all pointer-events-auto"
        >
          <Search className="h-3.5 w-3.5 text-white/40 mr-2" />
          <input
            id="node-galaxy-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Focus node on any topic..."
            className="bg-transparent text-[11px] text-white placeholder-white/30 focus:outline-none w-full font-sans"
          />
        </form>

        <div className="flex items-center gap-2 pointer-events-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
              title="Exit Galaxy View"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loader UI for API triggers */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute bottom-6 left-6 z-20 flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/90 border border-white/10 shadow-[0_12px_45px_oklch(0_0_0_/_80%)] backdrop-blur-md cursor-default pointer-events-auto"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="h-4 w-4 rounded-full border border-t-cyan-400 border-r-transparent border-b-cyan-500/20 border-l-transparent"
            />
            <span className="text-[11px] font-mono text-cyan-300 tracking-wide">
              {loadingMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkles feedback upon node clicking */}
      <AnimatePresence>
        {sparking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-5 flex items-center justify-center mix-blend-color-dodge"
          >
            <div className="w-[180px] h-[180px] bg-gradient-radial from-cyan-400/20 to-transparent animate-ping rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Galaxy Core Canvas Platform */}
      <div className="flex-1 w-full relative z-5 overflow-hidden">
        {/* Panning Container */}
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: "center",
            transition: panning ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Main SVG Render Layer for connection links */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
              </linearGradient>

              {/* Glowing filters */}
              <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing lines render */}
            {links.map((link, idx) => {
              const sourceNode = nodes.find((n) => n.id === link.source);
              const targetNode = nodes.find((n) => n.id === link.target);

              if (!sourceNode || !targetNode) return null;

              // Draw bezier curve connector or straight line
              const midX = (sourceNode.x + targetNode.x) / 2;
              const midY = (sourceNode.y + targetNode.y) / 2;

              // Compute offset for curved edge if desirable
              const isLeaf = link.strength < 1;

              return (
                <g key={`link-${idx}`} className="opacity-70">
                  {/* Outer Laser Line Glow */}
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isLeaf ? "rgba(139, 92, 246, 0.12)" : "rgba(6, 182, 212, 0.2)"}
                    strokeWidth={isLeaf ? "2" : "3.5"}
                    filter="url(#laserGlow)"
                  />
                  {/* Core solid wire */}
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="url(#linkGradient)"
                    strokeWidth={isLeaf ? "0.85" : "1.25"}
                    className="stroke-dasharray-anim"
                    style={{
                      strokeDasharray: isLeaf ? "4,4" : "15,10",
                    }}
                  />
                  {/* Photon Pulse travelling downward connection link */}
                  <circle r="2.5" fill="#22d3ee" className="photon-pulse">
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from={`${sourceNode.x},${sourceNode.y}`}
                      to={`${targetNode.x},${targetNode.y}`}
                      dur={`${1.8 + idx * 0.45}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* Graphical Knowledge Nodes rendering block */}
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {nodes.filter(Boolean).map((node) => {
              const nodeType = node.type || "subtopic";
              const theme = CATEGORY_THEMES[nodeType] || CATEGORY_THEMES.subtopic;
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const IconComp = theme.Icon || CATEGORY_THEMES.subtopic.Icon;

              // Ring dimension styles per level
              const size = node.depth === 0 ? 56 : node.depth === 1 ? 44 : 36;

              return (
                <div
                  key={node.id}
                  className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: node.x,
                    top: node.y,
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={(e) => handleNodeClick(node, e)}
                >
                  <motion.div
                    whileHover={{ scale: 1.12 }}
                    className="focus:outline-none cursor-pointer flex flex-col items-center select-none"
                  >
                    {/* Glowing Aura layer */}
                    <div
                      className="absolute rounded-full border flex items-center justify-center transition-all duration-300"
                      style={{
                        width: size + 16,
                        height: size + 16,
                        borderColor:
                          isSelected || isHovered ? theme.border : "rgba(255,255,255,0.02)",
                        background: isSelected || isHovered ? theme.glow : "transparent",
                        boxShadow: isSelected || isHovered ? `0 0 25px -4px ${theme.glow}` : "none",
                      }}
                    />

                    {/* Sphere Orb */}
                    <div
                      className={`rounded-full relative border flex items-center justify-center transition-all bg-neutral-900 border-white/10 ${
                        isSelected
                          ? `${theme.border} border-2`
                          : isHovered
                            ? "border-white/30"
                            : "border-white/10"
                      }`}
                      style={{
                        width: size,
                        height: size,
                      }}
                    >
                      {/* Inside particle impulse core */}
                      {node.depth === 0 ? (
                        <div className="h-3 w-3 rounded-full bg-cyan-400 filter shadow-[0_0_8px_var(--cyan)] animate-pulse" />
                      ) : (
                        <IconComp
                          className={`h-4.5 w-4.5 ${
                            isSelected || isHovered ? theme.text : "text-white/60"
                          } transition-colors`}
                        />
                      )}
                    </div>

                    {/* Tag label */}
                    <div
                      className={`mt-2.5 px-3 py-1 rounded-xl backdrop-blur-md border text-center transition-all shadow-[0_4px_16px_oklch(0_0_0_/_30%)] ${
                        isSelected
                          ? "bg-black/90 border-cyan-400 font-medium text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                          : isHovered
                            ? "bg-[#111] border-white/20 text-white"
                            : "bg-black/70 border-white/5 text-white/80"
                      }`}
                      style={{ maxWidth: 140 }}
                    >
                      <p className="text-[10px] tracking-wide truncate leading-tight">
                        {node.label}
                      </p>
                      {node.confidence && node.confidence < 100 ? (
                        <span className="block text-[7px] font-mono text-[#06b6d4]">
                          {node.confidence}% Match
                        </span>
                      ) : null}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating canvas map controls overlay (panning / zoom controls) */}
      <div className="absolute bottom-5 left-5 z-10 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <div className="h-3 w-px bg-white/20 mx-1.5" />
        <button
          onClick={() => {
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="px-2 py-1 select-none text-[8px] font-mono uppercase tracking-wider text-cyan-400 hover:text-cyan-300 block bg-cyan-400/5 rounded border border-cyan-400/10 cursor-pointer"
        >
          Reset View
        </button>
      </div>

      {/* Floating Hover node summary card trigger (Apple styled ambient preview) */}
      <AnimatePresence>
        {previewNode && previewNode.id !== selectedNodeId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute bottom-18 left-5 z-20 w-[240px] p-3 rounded-2xl bg-black/90 border border-white/10 shadow-[0_12px_45px_oklch(0_0_0_/_80%)] backdrop-blur-md pointer-events-none select-none"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[8px] tracking-wider font-semibold uppercase px-1.5 py-0.5 rounded border ${
                  CATEGORY_THEMES[previewNode?.type || "subtopic"]?.badge ||
                  CATEGORY_THEMES.subtopic.badge
                }`}
              >
                {previewNode?.type || "subtopic"}
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                {previewNode.confidence || 90}% confidence
              </span>
            </div>
            <p className="text-[12px] font-semibold text-white leading-tight mb-1 truncate">
              {previewNode.label}
            </p>
            <p className="text-[10px] text-white/60 leading-snug">{previewNode.summary}</p>
            {previewNode.rationale && (
              <div className="mt-1.5 pt-1.5 border-t border-white/5 flex gap-1 items-start">
                <CornerDownRight className="h-2.5 w-2.5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[9px] text-[#06b6d4]/80 italic leading-tight">
                  {previewNode.rationale}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Inspector Details sliding Panel (Right aligned premium Glassmorphism cockpit) */}
      <div className="absolute top-18 bottom-4 right-4 z-10 w-full max-w-[340px] pointer-events-none md:block hidden">
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full h-full glass-strong bg-neutral-980/90 border border-white/8 rounded-2xl flex flex-col pointer-events-auto backdrop-blur-md shadow-[0_24px_80px_oklch(0_0_0_/_80%)]"
        >
          {/* Header section badge */}
          <div className="p-4 border-b border-white/10">
            <div className="flex justify-between items-center mb-1">
              <span
                className={`text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                  CATEGORY_THEMES[activeNode?.type || "subtopic"]?.badge ||
                  CATEGORY_THEMES.subtopic.badge
                }`}
              >
                {activeNode?.type || "subtopic"}
              </span>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono text-white/55">Active Analysis</span>
              </div>
            </div>
            <h3 className="text-white font-bold text-[15px] leading-tight mb-1 truncate">
              {activeNode.label}
            </h3>
            <p className="text-[11px] text-[color:var(--ink-dim)] line-clamp-2 leading-relaxed">
              {activeNode.summary}
            </p>
          </div>

          {/* Drawer tab navigation buttons */}
          <div className="flex border-b border-white/5 px-2 py-1.5 bg-neutral-900/60">
            {[
              { id: "insights", label: "Insights", Icon: Sparkles },
              { id: "prompts", label: "Prompts", Icon: Target },
              { id: "roadmap", label: "Roadmap", Icon: BookOpen },
            ].map((tab) => {
              const TabIcon = tab.Icon;
              const isTabSelected = activePanelTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePanelTab(tab.id as "insights" | "prompts" | "roadmap")}
                  className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-lg pr-1 pl-1 transition-all text-center border cursor-pointer ${
                    isTabSelected
                      ? "bg-white/5 border-white/10 text-cyan-400 font-medium"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5 mb-1" />
                  <span className="text-[9px]">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Context container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-left">
            {activePanelTab === "insights" && activeNode.insight && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono mb-1.5 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Strategic Assessment
                  </h4>
                  <p className="text-[11px] text-white/75 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl">
                    {activeNode.insight.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-rose-400 font-mono mb-1.5 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    Trending Momentum
                  </h4>
                  <div className="flex items-center gap-2 bg-rose-400/5 border border-rose-400/20 p-2.5 rounded-xl">
                    <TrendingUp className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="text-[11px] text-rose-200 font-medium leading-tight">
                      {activeNode.insight.trends}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono mb-2 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    Startup Core Opportunities
                  </h4>
                  <div className="space-y-2">
                    {activeNode.insight.startupOpportunities.map((op, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-[11px] leading-snug border border-white/[0.03] bg-neutral-950/40 p-2 rounded-xl"
                      >
                        <span className="text-emerald-400 shrink-0 font-bold font-mono">
                          0{i + 1}.
                        </span>
                        <span className="text-white/80">{op}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-violet-400 font-mono mb-2 flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5" />
                    Related Tech
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeNode.insight.relatedTech.map((tech, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono text-cyan-300 bg-cyan-950/20 px-2 py-1 rounded-lg border border-cyan-400/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activePanelTab === "prompts" && activeNode.insight && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono mb-2.5 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5" />
                    Contextual Discussion Hooks
                  </h4>
                  <p className="text-[11px] text-[color:var(--ink-dim)] leading-relaxed mb-3">
                    Copy or prompt these icebreakers when meeting related builders nearby:
                  </p>
                  <div className="space-y-3">
                    {activeNode.insight.prompts.map((p, i) => (
                      <div
                        key={i}
                        className="relative p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                      >
                        <p className="text-[11px] text-white leading-relaxed italic pr-4">"{p}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-amber-400 font-mono mb-2 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    Corporate Use Cases
                  </h4>
                  <div className="space-y-2">
                    {activeNode.insight.useCases.map((uc, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 border border-white/5 p-2 rounded-xl text-[11px] leading-snug bg-neutral-950/30 text-white/70"
                      >
                        <span className="text-amber-400 shrink-0 select-none">•</span>
                        <span>{uc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activePanelTab === "roadmap" && activeNode.insight && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-wider text-violet-400 font-mono mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Skill Learning Roadmap
                </h4>
                <p className="text-[11px] text-[color:var(--ink-dim)] leading-relaxed">
                  Recommended curriculum path to scale computational expertise around here:
                </p>
                <div className="space-y-3 relative pl-3 border-l border-white/10 mt-2">
                  {activeNode.insight.learningRoadmap.map((step, i) => (
                    <div key={i} className="relative space-y-1">
                      {/* Floating dot connector */}
                      <span className="absolute -left-[17px] top-1.5 block w-2 h-2 rounded-full border border-[#06b6d4] bg-[#0c1426] z-10" />
                      <span className="block text-[9px] uppercase font-mono tracking-widest text-[#06b6d4]">
                        Phase 0{i + 1}
                      </span>
                      <p className="text-[11px] text-white/80 leading-relaxed font-sans">{step}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Deploy Quest/Submit Button */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleAlignQuest}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-95 text-white text-[12px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_24px_-4px_rgba(6,182,212,0.4)]"
            >
              Align Quest Connection
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Floating alignment option for smaller screens (sliding bottom banner) */}
      {activeNode.id !== "stub-temp" && (
        <div className="absolute bottom-5 inset-x-5 z-10 md:hidden flex flex-col pointer-events-none items-center">
          <button
            onClick={handleAlignQuest}
            className="w-full max-w-sm pointer-events-auto py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-95 text-white text-[12px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_24px_oklch(0_0_0_/_60%)]"
          >
            Align Quest: "{activeNode.label}"
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
