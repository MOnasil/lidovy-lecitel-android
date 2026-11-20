import { createFileRoute } from "@tanstack/react-router";
import { Profil } from "@/components/ll/Profil";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Můj profil – Lidový léčitel" },
      { name: "description", content: "Označte léky a zdravotní stav – aplikace upozorní na byliny a houby, které pro vás nejsou vhodné." },
      { property: "og:title", content: "Můj profil – Lidový léčitel" },
      { property: "og:description", content: "Osobní upozornění na nevhodné byliny a možné střety s vašimi léky." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profil,
});
