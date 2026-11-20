import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Druh } from "@/components/ll/Druh";
import { SP, unslug } from "@/lib/ll/data";

export const Route = createFileRoute("/atlas/$druh")({
  loader: ({ params }) => {
    const k = unslug(params.druh);
    const s = SP[k];
    if (!s) throw notFound();
    return { k, cz: s.cz, lat: s.lat, popis: s.popis };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.cz} (${loaderData.lat}) – Lidový léčitel` : "Atlas – Lidový léčitel";
    const description = loaderData
      ? `${loaderData.cz}: ${loaderData.popis} Co naznačují studie, na co si dát pozor a jak užívat.`
      : "Léčivá bylina nebo houba podle studií.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: DruhPage,
  notFoundComponent: () => (
    <div className="box">
      <h2>Tento druh v atlasu nemáme</h2>
      <p>
        <Link to="/atlas">← Zpět do atlasu</Link>
      </p>
    </div>
  ),
});

function DruhPage() {
  const { k } = Route.useLoaderData();
  // key resets the photo gallery and map selection when moving between species
  return <Druh key={k} k={k} />;
}
