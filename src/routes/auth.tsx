import { createFileRoute } from "@tanstack/react-router";
import { Prihlaseni } from "@/components/ll/Prihlaseni";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Přihlášení – Lidový léčitel" },
      { name: "description", content: "Přihlaste se nebo si vytvořte účet a zapište si léky – aplikace upozorní na možné střety s bylinami." },
      { property: "og:title", content: "Přihlášení – Lidový léčitel" },
      { property: "og:description", content: "Účet pro upozornění na střety vašich léků s bylinami a houbami." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Prihlaseni,
});
