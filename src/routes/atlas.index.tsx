import { createFileRoute } from "@tanstack/react-router";
import { Atlas } from "@/components/ll/Atlas";

export const Route = createFileRoute("/atlas/")({
  head: () => ({
    meta: [
      { title: "Atlas bylin a hub – Lidový léčitel" },
      { name: "description", content: "Atlas léčivých bylin, hub, dovážených rostlin a včelích produktů s fotkami a výsledky studií." },
      { property: "og:title", content: "Atlas bylin a hub – Lidový léčitel" },
      { property: "og:description", content: "Přes 200 bylin a léčivých hub s fotkami, výskytem v ČR a výsledky studií." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Atlas,
});
