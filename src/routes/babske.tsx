import { createFileRoute } from "@tanstack/react-router";
import { Babske } from "@/components/ll/Babske";

export const Route = createFileRoute("/babske")({
  head: () => ({
    meta: [
      { title: "Babské rady – Lidový léčitel" },
      { name: "description", content: "Co používaly naše babičky a lidoví léčitelé – a co na to říká dnešní věda. Detox, vstřebávání, jedovaté rostliny." },
      { property: "og:title", content: "Babské rady – Lidový léčitel" },
      { property: "og:description", content: "Tradiční lidové léčitelství porovnané s výsledky vědeckých studií." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Babske,
});
