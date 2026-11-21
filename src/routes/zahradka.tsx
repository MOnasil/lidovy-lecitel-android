import { createFileRoute } from "@tanstack/react-router";
import { Zahradka } from "@/components/ll/Zahradka";

export const Route = createFileRoute("/zahradka")({
  head: () => ({
    meta: [
      { title: "Moje zahrádka – Lidový léčitel" },
      { name: "description", content: "Byliny, které máte doma, pěstujete a chcete pěstovat, a plánovač bylinné zahrádky podle potíží, místa a slunce." },
      { property: "og:title", content: "Plánovač bylinné zahrádky – Lidový léčitel" },
      { property: "og:description", content: "Plán bylinkové zahrádky na zahradu, balkon i parapet podle studií." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Zahradka,
});
