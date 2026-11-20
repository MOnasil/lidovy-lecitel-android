import { createFileRoute } from "@tanstack/react-router";
import { Lekarnik } from "@/components/ll/Lekarnik";

export const Route = createFileRoute("/lekarnik")({
  head: () => ({
    meta: [
      { title: "Zeptejte se lékárníka – Lidový léčitel" },
      {
        name: "description",
        content: "Zeptejte se lékárníka na byliny, houby a jejich kombinaci s léky.",
      },
      { property: "og:title", content: "Zeptejte se lékárníka – Lidový léčitel" },
      { property: "og:description", content: "Dotaz na lékárníka k bylinám a lékům." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lekarnik,
});
