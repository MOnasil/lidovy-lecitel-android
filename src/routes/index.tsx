import { createFileRoute } from "@tanstack/react-router";
import { Poradce } from "@/components/ll/Poradce";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Co mě trápí – Lidový léčitel" },
      {
        name: "description",
        content:
          "Popište, co vás trápí, a podívejte se, které byliny a léčivé houby studie s lidmi podporují nejvíc. Atlas bylin a plánovač bylinné zahrádky.",
      },
      { property: "og:title", content: "Lidový léčitel – byliny a houby podle studií" },
      {
        property: "og:description",
        content: "Napište, co vás trápí, a aplikace podle vědeckých studií ukáže, které byliny a houby na vaše potíže mohou pomoci.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Poradce,
});
