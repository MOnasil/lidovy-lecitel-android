import { createFileRoute } from "@tanstack/react-router";
import { NoveHeslo } from "@/components/ll/Prihlaseni";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nové heslo – Lidový léčitel" },
      { name: "description", content: "Nastavte si nové heslo k účtu v aplikaci Lidový léčitel." },
      { property: "og:title", content: "Nové heslo – Lidový léčitel" },
      { property: "og:description", content: "Obnova hesla k účtu Lidový léčitel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NoveHeslo,
});
