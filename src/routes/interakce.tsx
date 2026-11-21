import { createFileRoute } from "@tanstack/react-router";
import { InterakcePage } from "@/components/ll/Babske";

export const Route = createFileRoute("/interakce")({
  head: () => ({
    meta: [
      { title: "Moje léky – Lidový léčitel" },
      {
        name: "description",
        content:
          "Co nekombinovat: byliny s léky, doplňky stravy a jídlem. Jak zlepšit vstřebávání a co věda říká o detoxu.",
      },
      { property: "og:title", content: "Moje léky – Lidový léčitel" },
      {
        property: "og:description",
        content: "Co nekombinovat s léky a jídlem, jak zlepšit vstřebávání, detox podle studií.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterakcePage,
});
