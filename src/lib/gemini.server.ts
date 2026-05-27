/**
 * Client-side proxy for Gemini server APIs.
 * This routes all requests to our custom secure Express backend.
 * This completely isolates the client build from node-only modules like @tanstack/react-start or @google/genai.
 */

export async function analyzeTopicIntent({ data }: { data: string }) {
  const res = await fetch("/api/gemini/analyze-topic-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic: data }),
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function generateOpeners({
  data,
}: {
  data: {
    matchName: string;
    matchQuest: string;
    viewerQuest: string;
    personality: "introvert" | "balanced" | "extrovert";
    socialBattery: number;
  };
}) {
  const res = await fetch("/api/gemini/generate-openers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function generateMeetingRecap({
  data,
}: {
  data: {
    questsCount: number;
    connectionsCount: number;
    mainTopic: string;
    personality: string;
    energyLeft: number;
  };
}) {
  const res = await fetch("/api/gemini/generate-meeting-recap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function generateSemanticMatches({
  data,
}: {
  data: {
    topic: string;
    selectedCluster: string | null;
  };
}) {
  const res = await fetch("/api/gemini/generate-semantic-matches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function expandTopicGraph({
  data,
}: {
  data: {
    topic: string;
    parentTopic?: string;
    existingNodes?: string[];
  };
}) {
  const res = await fetch("/api/gemini/expand-topic-graph", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}
