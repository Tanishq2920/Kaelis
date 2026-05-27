import { createFileRoute } from "@tanstack/react-router";
import { PulseApp } from "@/components/pulse/PulseApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — Live radar for conference networking" },
      {
        name: "description",
        content:
          "Drop a 30-minute quest, find matching people in the room, wave to meet. Identity stays hidden until you both wave.",
      },
      {
        property: "og:title",
        content: "Pulse — Live radar for conference networking",
      },
      {
        property: "og:description",
        content: "Drop a quest. See who in the room is looking for the same thing. Wave to meet.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return <PulseApp />;
}
