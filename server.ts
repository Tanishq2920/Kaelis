import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Using mock answers.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Analyze Topic Intent
  app.post("/api/gemini/analyze-topic-intent", async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      res.status(400).json({ error: "Missing topic" });
      return;
    }

    const fallback = {
      clusters: [
        {
          title: `${topic} scaling patterns`,
          sub: "Discussing bottlenecks, performance gains, and architecture optimization.",
        },
        {
          title: `Practical applications of ${topic}`,
          sub: "Sharing active case studies, deployment successes, and raw production numbers.",
        },
        {
          title: `Future trends around ${topic}`,
          sub: "Reflecting on emerging paradigms and where the sector is heading in 12 months.",
        },
      ],
    };

    try {
      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        res.json({
          clusters: [
            {
              title: "Technical Architecture",
              sub: "Deep dive into APIs, schema structures, and database pipelines.",
            },
            {
              title: "User Experience Design",
              sub: "Designing frictionless onboarding curves and ambient feedback loops.",
            },
            {
              title: "Developer Tools Business Modality",
              sub: "Monetization strategies, developer adoption, and scale channels.",
            },
          ],
        });
        return;
      }

      const prompt = `Analyze the networking topic: "${topic}". 
Generate exactly 3 distinct, highly professional, and compelling discussion clusters or subtopics that attendees can use to find their perfect conversation partner. Make them specific, high-agency, and intellectually interesting for an attendee at a major tech conference.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clusters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description:
                        "Short, snappy title of the subtopic cluster (e.g. Scaling Edge DBs).",
                    },
                    sub: {
                      type: Type.STRING,
                      description:
                        "One sentence explanation of what specific angle is being discussed.",
                    },
                  },
                  required: ["title", "sub"],
                },
              },
            },
            required: ["clusters"],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? "{}");
      res.json(parsed);
    } catch (e) {
      console.error("Gemini Analyze Topic Intent Error:", e);
      res.json(fallback);
    }
  });

  // 2. Generate Openers
  app.post("/api/gemini/generate-openers", async (req, res) => {
    const { matchName, matchQuest, viewerQuest, personality, socialBattery } = req.body;

    const fallback = {
      starters: [
        `Hi ${matchName} — noticed your quest about "${matchQuest}". Grab a coffee?`,
        `Hey! Overlapping themes on our radar. Keen to compare notes on design workflows?`,
        `Simple hello. Spotted you on the radar — would love a quick chat if you're free!`,
      ],
    };

    try {
      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        res.json({
          starters: [
            `Hey ${matchName}, saw your quest about "${matchQuest}". Very cool.`,
            `Saw we both matched on AI workflows. What's your biggest pain point today?`,
            `Coffee chat in Hall C? Quick hello.`,
          ],
        });
        return;
      }

      let toneHelp = "";
      if (personality === "introvert") {
        toneHelp =
          "Low-pressure, exceptionally gentle, highly respectful, subtle, and incredibly polite. Make it easy to ignore or say no to.";
      } else if (personality === "extrovert") {
        toneHelp =
          "Bold, energetic, highly enthusiastic, clever, and creative. Ask an exciting question right out of the gate.";
      } else {
        toneHelp =
          "Warm, balanced, professional, curious, and welcoming. Strike an elegant middle ground between relaxed and intentional.";
      }

      const prompt = `You are a professional networking companion for the Pulse app at Web Summit conference.
User's drop: "${viewerQuest}"
Match's drop ("${matchName}"): "${matchQuest}"
User's energy level: ${socialBattery}% (higher is more social)
Desired Starter Tone Style: ${personality} (${toneHelp})

Generate exactly 3 specific, contextual conversation starter messages the user can copy to break the ice with ${matchName}. Customize them deeply based on their overlapping themes, their social battery level, and their chosen communication persona. Keep them short, human, and natural (avoid generic 'AI speaker templates').`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      const parsed = JSON.parse(response.text ?? "[]");
      res.json({ starters: Array.isArray(parsed) ? parsed : [] });
    } catch (e) {
      console.error("Gemini Openers Generation fail:", e);
      res.json(fallback);
    }
  });

  // 3. Generate Meeting Recap
  app.post("/api/gemini/generate-meeting-recap", async (req, res) => {
    const { questsCount, connectionsCount, mainTopic, personality, energyLeft } = req.body;

    const fallback = {
      archetype: "The Ambient Explorer",
      story: `You navigated Web Summit today seeking genuine encounters over pure noise. Centering around "${mainTopic}", you drop quests and spark high-value dialogues effortlessly.`,
    };

    try {
      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        res.json({
          archetype: "The Strategic Architect",
          story:
            "A day calculated for high-density, low-noise connections. You came seeking specific inputs and left with deep developer alignment.",
        });
        return;
      }

      const prompt = `Based on these Web Summit conference statistics:
- Total Quests dropped: ${questsCount}
- Matches/Connections made: ${connectionsCount}
- Top topic discussed: "${mainTopic}"
- Tone style selected: "${personality}"
- Remaining social energy: ${energyLeft}%

Generate a stunning 1-sentence networking personality Archetype name (e.g. "The High-Energy Catalyst" or "The Silent Specialist") and a beautiful, crisp 2-sentence summary recap narrative of their summit networking day.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              archetype: {
                type: Type.STRING,
                description: "Naming of the custom persona archetype.",
              },
              story: {
                type: Type.STRING,
                description: "A beautifully crafted 2-sentence story summary.",
              },
            },
            required: ["archetype", "story"],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? "{}");
      res.json(parsed);
    } catch (e) {
      console.error("Gemini Recap Generation fail:", e);
      res.json(fallback);
    }
  });

  // 4. Generate Semantic Matches
  app.post("/api/gemini/generate-semantic-matches", async (req, res) => {
    const { topic, selectedCluster } = req.body;

    const fallbackMatches = [
      {
        id: "maya",
        name: "Maya",
        initial: "M",
        match: 96,
        quest: `Testing custom frameworks for ${topic} integration. Looking to swap raw production latency details.`,
        why: `Maya is deeply focused on the exact technical substrate of ${topic}${selectedCluster ? ` (specifically ${selectedCluster})` : ""}. She has published benchmarks on these architectures.`,
        conceptualOverlap: `You both care about real-world scalability and code overhead for ${topic}.`,
        collaborationDirection:
          "Swap memory profiles or discuss creating a shared open-source baseline repository.",
        conversationDepth: "Deep Technical / Architecture",
        pullFactor: 0.85,
        energyPulse: true,
        suggestedAdjacentDirections: [
          `Benchmarking ${topic}`,
          `${topic} telemetry loops`,
          "Cold start optimization",
        ],
      },
      {
        id: "tara",
        name: "Tara",
        initial: "T",
        match: 91,
        quest: `Exploring commercialization and GTM playbooks for early products built on ${topic}.`,
        why: `Tara aligns on the strategic commercial dimensions of ${topic}. She recently closed an early round focused on these patterns.`,
        conceptualOverlap: `Both analyzing developer adoption constraints and cost monetization around ${topic}.`,
        collaborationDirection:
          "Compare pitch narratives, look for portfolio-level synergies, or trade early trial learnings.",
        conversationDepth: "Strategic / Product-Market Fit",
        pullFactor: 0.62,
        energyPulse: false,
        suggestedAdjacentDirections: [
          "Monetization models",
          "Developer acquisition",
          `${topic} seed funding`,
        ],
      },
      {
        id: "omar",
        name: "Omar",
        initial: "O",
        match: 87,
        quest: `Securing internal tooling pipelines using compliant sandbox modes around ${topic}.`,
        why: `Omar is exploring regulatory compliance and sandboxing, which acts as a major dependency for any deployment of ${topic}.`,
        conceptualOverlap:
          "Both investigating permission models, sandboxing, and compliance overhead.",
        collaborationDirection:
          "Review enterprise checklists or structure security sandboxes for active testing.",
        conversationDepth: "Security / Compliance / Tooling",
        pullFactor: 0.45,
        energyPulse: true,
        suggestedAdjacentDirections: [
          "Enterprise compliance",
          "Sandbox isolation",
          "Identity federations",
        ],
      },
      {
        id: "sarah",
        name: "Sarah",
        initial: "S",
        match: 84,
        quest: `Evaluating developer experience metrics and automated design loops for teams utilizing ${topic}.`,
        why: `Sarah analyzes design-to-development pipeline workflows, which can accelerate adoption of your ${topic} project.`,
        conceptualOverlap:
          "Both care about reducing adoption friction and improving daily developer ergonomics.",
        collaborationDirection:
          "Share UX feedback loops or plan a public developer-facing trial program.",
        conversationDepth: "UX Ergonomics / DX",
        pullFactor: 0.35,
        energyPulse: false,
        suggestedAdjacentDirections: [
          "Developer ergonomics",
          "Design token handoff",
          "Adoption analysis",
        ],
      },
    ];

    try {
      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        res.json({ matches: fallbackMatches });
        return;
      }

      const prompt = `You are an advanced AI networking intelligence engine for the Pulse app at a major tech conference.
User is interested in the topic: "${topic}" ${selectedCluster ? `focusing on the angle: "${selectedCluster}"` : ""}.

We need to generate customized matching metrics for 4 radar attendees who have high semantic overlap with this user.
The attendees to customize are:
1. Maya (Highly technical core match, match percent ~94-98%, innermost ring, very high pull factor. Needs technical discussion depth).
2. Tara (Product/Commercialization match, match percent ~90-93%, middle ring. Business angle).
3. Omar (Security/Compliance/Tooling match, match percent ~85-89%, middle/outer ring. Practical execution angle).
4. Sarah (UX/Ergonomics/Adoption match, match percent ~81-84%, outer ring. Human angle).

Generate a JSON object containing a 'matches' array. For EACH of the 4 attendees, specify:
- id (must match lowercase: 'maya', 'tara', 'omar', 'sarah')
- name (Maya, Tara, Omar, Sarah)
- initial (M, T, O, S)
- match (an integer match percentage)
- quest (a 1-sentence specific drop they wrote, reflecting high-agency interest in ${topic} related topics)
- why (a 1-2 sentence compelling reason of why the user matched with them)
- conceptualOverlap (1 clear sentence starting with 'You both care about...' or 'Both exploring...', e.g. "You both care about orchestration reliability under scale.")
- collaborationDirection (1 clear sentence describing potential next steps, e.g. "Compare orchestration latency tradeoffs or trade code configurations.")
- conversationDepth (e.g. 'Highly Technical', 'Strategic / Commercial', 'Infrastructure & Compliance', 'DX & Ergononomics')
- pullFactor (a float between 0.3 and 0.9 representing semantic gravity. High overlap maps close to 1)
- energyPulse (boolean, whether their topic has live active intellectual momentum right now)
- suggestedAdjacentDirections (array of 3 short snappy adjacent terms)

Ensure the output is strictly valid JSON conforming to this structure, without markdown decorators.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    initial: { type: Type.STRING },
                    match: { type: Type.INTEGER },
                    quest: { type: Type.STRING },
                    why: { type: Type.STRING },
                    conceptualOverlap: { type: Type.STRING },
                    collaborationDirection: { type: Type.STRING },
                    conversationDepth: { type: Type.STRING },
                    pullFactor: { type: Type.NUMBER },
                    energyPulse: { type: Type.BOOLEAN },
                    suggestedAdjacentDirections: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: [
                    "id",
                    "name",
                    "initial",
                    "match",
                    "quest",
                    "why",
                    "conceptualOverlap",
                    "collaborationDirection",
                    "conversationDepth",
                    "pullFactor",
                    "energyPulse",
                    "suggestedAdjacentDirections",
                  ],
                },
              },
            },
            required: ["matches"],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? "{}");
      if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
        res.json(parsed);
      } else {
        res.json({ matches: fallbackMatches });
      }
    } catch (e) {
      console.error("Gemini Semantic Matches generation failed:", e);
      res.json({ matches: fallbackMatches });
    }
  });

  // 5. Expand Topic Graph for Immersive Mind Map
  app.post("/api/gemini/expand-topic-graph", async (req, res) => {
    const { topic, parentTopic, existingNodes = [] } = req.body;
    if (!topic) {
      res.status(400).json({ error: "Missing topic" });
      return;
    }

    // Procedural fallback generator in case API key is missing or call fails
    const generateProceduralNodes = (baseTopic: string, pTopic?: string) => {
      const concepts = [
        {
          label: `${baseTopic} Orchestration`,
          type: "subtopic",
          summary: "Coordinating workflows across sub-modules in real-time.",
        },
        {
          label: `Agentic ${baseTopic} Patterns`,
          type: "subtopic",
          summary: "Autonomous, self-correcting design paradigms.",
        },
        {
          label: `${baseTopic} Security compliance`,
          type: "tech",
          summary: "Sandbox Isolation & safe execution principles.",
        },
        {
          label: "Cost-reduction scaling",
          type: "business-model",
          summary: "Monetizing and streamlining production overhead.",
        },
        {
          label: `${pTopic || baseTopic} Tooling pipelines`,
          type: "tech",
          summary: "Development environments, monitoring, and debugging.",
        },
        {
          label: "Enterprise deployment metrics",
          type: "use-case",
          summary: "KPI tracking, telemetry logs, and ROI models.",
        },
      ];

      return {
        relatedNodes: concepts.map((c, i) => ({
          label: c.label,
          type: c.type,
          summary: c.summary,
          rationale: `Direct downstream derivation of ${baseTopic} for advanced developers.`,
          confidence: 85 + ((i * 2) % 13),
          insight: {
            summary: `This represents a high-agency focus area surrounding ${baseTopic}. Industry leaders are actively centering investment and active research around these precise boundaries.`,
            useCases: [
              `Automating multi-layer architecture runs for ${baseTopic}`,
              `Telemetry tracking and latency profiling in enterprise systems`,
            ],
            startupOpportunities: [
              `Low-overhead middleware for monitoring ${baseTopic} performance`,
              `No-code playground suites supporting instant node deployments`,
            ],
            relatedTech: ["Docker Sandboxes", "OTel Telemetry", "NextJS Middleware"],
            trends: "Hyper-growth Category (+120% MoM)",
            prompts: [
              `How are you currently handling runtime constraints for ${baseTopic}?`,
              "What has been your biggest bottleneck in scaling these patterns?",
            ],
            learningRoadmap: [
              "Read standard container isolation specs",
              "Review open telemetry tracing logs",
              "Build a minor local emulator for performance tests",
            ],
          },
        })),
      };
    };

    try {
      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        res.json(generateProceduralNodes(topic, parentTopic));
        return;
      }

      const prompt = `You are an elite semantic knowledge graph architect and machine intelligence researcher.
Goal: Expand the semantic topic "${topic}" into exactly 5-6 adjacent, highly interesting, and specific knowledge nodes for a tech mind map.
Context:
- Current focus topic: "${topic}"
- Parent topic context (if exists): "${parentTopic || "None"}"
- Existing nodes to strictly avoid duplicating: ${JSON.stringify(existingNodes)}

We want a range of diverse node types:
- 'subtopic': Technical, mathematical, or scientific sub-disciplines
- 'tech': Real frameworks, systems, libraries, protocols, or concrete developer tools
- 'business-model': Commercial monetization avenues, GTM strategies, startup business models
- 'use-case': Actual real-world deployments, enterprise applications, or case studies
- 'people-archetype': Specific types of developers, builders, researchers, or founders dealing with this topic

For each of the 5-6 generated nodes, provide:
1. label: Snappy human label (2-4 words, e.g. "MCP Protocol" or "Agentic Browsers").
2. type: must be one of: 'subtopic', 'tech', 'business-model', 'use-case', 'people-archetype'
3. summary: Snappy 1-sentence description.
4. rationale: A crisp explanation of how/why this is connected or adjacent to "${topic}" (and parent "${parentTopic || ""}").
5. confidence: Integer relationship confidence score (e.g., 75 to 98) representing connection solidity.
6. insight: Deep detail information for the inspector panel:
   - summary: A detailed paragraphs overview of the concept and why it holds conference hype.
   - useCases: Array of exactly 2-3 genuine, practical corporate use cases.
   - startupOpportunities: Array of exactly 2 high-potential startup/commercialization ideas.
   - relatedTech: Array of exactly 3 relevant developer technologies, tools, or standards.
   - trends: Narrative momentum/market trajectory analysis (e.g. "Surging velocity, index +45%").
   - prompts: Array of exactly 2 deep, specific networking ice-breaker questions relating to this.
   - learningRoadmap: Array of exactly 3 sequential, high-value steps to master this node.

Ensure your output is strictly valid JSON matching the defined schema layout. Create unique, intellectually engaging, high-agency concepts rather than generic buzzwords.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              relatedNodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    type: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    confidence: { type: Type.INTEGER },
                    insight: {
                      type: Type.OBJECT,
                      properties: {
                        summary: { type: Type.STRING },
                        useCases: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        startupOpportunities: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        relatedTech: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        trends: { type: Type.STRING },
                        prompts: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        learningRoadmap: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                      required: [
                        "summary",
                        "useCases",
                        "startupOpportunities",
                        "relatedTech",
                        "trends",
                        "prompts",
                        "learningRoadmap",
                      ],
                    },
                  },
                  required: ["label", "type", "summary", "rationale", "confidence", "insight"],
                },
              },
            },
            required: ["relatedNodes"],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? "{}");
      if (parsed && Array.isArray(parsed.relatedNodes) && parsed.relatedNodes.length > 0) {
        res.json(parsed);
      } else {
        res.json(generateProceduralNodes(topic, parentTopic));
      }
    } catch (e) {
      console.error("Gemini Expand Topic Graph Failure:", e);
      res.json(generateProceduralNodes(topic, parentTopic));
    }
  });

  // Handle Vite middleware for local development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
