import { createFileRoute } from "@tanstack/react-router";
import { Soukromi } from "@/components/ll/Soukromi";

export const Route = createFileRoute("/soukromi")({
  head: () => ({
    meta: [
      { title: "Ochrana osobních údajů – Lidový léčitel" },
      { name: "description", content: "Jak aplikace Lidový léčitel zpracovává osobní údaje (GDPR)." },
    ],
  }),
  component: Soukromi,
});
