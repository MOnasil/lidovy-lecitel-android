/** Plain-language absorption summary per species: level, what to combine with, and a short how-to. */
export type Absorb = {
  v: "dobrá" | "střední" | "horší" | "nepředvídatelná";
  s: string;
  k?: string;
};

export const ABSV_CLS: Record<Absorb["v"], string> = {
  dobrá: "ok",
  střední: "mid",
  horší: "low",
  nepředvídatelná: "low",
};

export const ABSORB: Record<string, Absorb> = {
  curcuma_longa: {
    v: "horší",
    s: "Obyčejný kurkumin z prášku nebo běžných kapslí se do krve dostává jen málo.",
    k: "Černý pepř (piperin), jídlo s tukem nebo speciální formy (fytozom, micely, cyklodextrin) – vstřebání zvyšují mnohonásobně.",
  },
  panax_ginseng: {
    v: "střední",
    s: "Účinné látky (ginsenosidy) se vstřebávají postupně, fermentovaný ženšen rychleji.",
    k: "Užívat s jídlem, které obsahuje tuk.",
  },
  echinacea_purpurea: {
    v: "dobrá",
    s: "Účinné látky se z tablet vstřebávají, ale tělo je rychle vylučuje.",
    k: "Dávku rozdělit – užívat 3× denně.",
  },
  allium_sativum: {
    v: "střední",
    s: "Z tablet se allicin uvolňuje velmi různě.",
    k: "Spolehlivější je čerstvě rozdrcený syrový česnek; nechat ho 10 minut odpočinout a pak sníst.",
  },
  cannabis_sativa: {
    v: "nepředvídatelná",
    s: "CBD užité ústy se vstřebává nepředvídatelně a různé výrobky se hodně liší.",
    k: "Užívat s jídlem; emulzní a nanoemulzní formy se vstřebávají lépe než olej. Další dávku ne dřív než za 2 hodiny.",
  },
  brassica_oleracea_italica: {
    v: "střední",
    s: "Sulforafan vzniká jen tehdy, když zůstane zachován enzym myrosináza.",
    k: "Syrové nebo jen krátce vařené klíčky; k vařené brokolici přidat trochu hořčice nebo ředkvičky.",
  },
  olea_europaea: { v: "dobrá", s: "Hydroxytyrosol z oliv a olivového oleje se dobře vstřebává." },
  citrus: {
    v: "střední",
    s: "Flavonoidy z citrusů (hesperidin, diosmin) se v běžné formě vstřebávají jen částečně.",
    k: "Mikronizované formy (např. diosmin „Plus“) se vstřebávají lépe.",
  },
  crocus_sativus: { v: "dobrá", s: "Krocetin ze šafránu se vstřebává rychle." },
  salvia_miltiorrhiza: {
    v: "horší",
    s: "Tanshinony se v běžné formě vstřebávají málo.",
    k: "Speciální formy se vstřebávají lépe.",
  },
  theobroma_cacao: {
    v: "střední",
    s: "Kakaové flavanoly se vstřebávají středně dobře.",
    k: "Hořká čokoláda nebo kakao bez mléka – mléko může vstřebání zhoršit.",
  },
  prunus_dulcis: {
    v: "střední",
    s: "Z mandlí se živiny uvolní lépe, když se důkladně rozžvýkají.",
  },
  vitis_vinifera: {
    v: "horší",
    s: "Běžný resveratrol se vstřebává špatně, tělo ho rychle odbourá.",
    k: "Speciální formy nebo podání pod jazyk (přes sliznici) hladinu v krvi zvyšují.",
  },
  berberis_vulgaris: {
    v: "horší",
    s: "Běžný berberin se vstřebává jen málo.",
    k: "Dihydroberberin nebo micelární berberin se vstřebávají několikanásobně lépe; užívat s jídlem.",
  },
  mangifera_indica: {
    v: "horší",
    s: "Mangiferin se vstřebává málo.",
    k: "Lépe se vstřebává jeho sodná sůl.",
  },
  withania_somnifera: {
    v: "střední",
    s: "Vstřebání se liší podle typu extraktu.",
    k: "Užívat s jídlem, nejlépe s mlékem nebo tukem (tradičně s teplým mlékem).",
  },
  ginkgo_biloba: {
    v: "střední",
    s: "Běžný extrakt se vstřebává středně.",
    k: "Lipozomální forma se vstřebává asi 2× lépe; užívat s jídlem.",
  },
  beta_vulgaris: {
    v: "dobrá",
    s: "Dusičnany z červené řepy se dobře dostávají do krve.",
    k: "Šťávu pít asi 2–3 hodiny před výkonem; nepoužívat ústní vodu, která ničí bakterie potřebné k přeměně dusičnanů.",
  },
  vaccinium_myrtillus: {
    v: "horší",
    s: "Antokyany z borůvek se vstřebávají jen z malé části.",
    k: "Pravidelný příjem; enkapsulované formy mohou vstřebání zlepšit.",
  },
  humulus_lupulus: {
    v: "horší",
    s: "Xanthohumol z chmele se v běžné formě vstřebává málo.",
    k: "Micelární forma se vstřebává lépe.",
  },
  stevia_rebaudiana: {
    v: "dobrá",
    s: "Stévie jako sladidlo nápoje nezhoršila vstřebání polyfenolů, spíš pomohla.",
  },
  camellia_sinensis: {
    v: "střední",
    s: "Katechiny zeleného čaje se vstřebávají středně, nalačno lépe než s jídlem.",
    k: "Nepít k jídlu bohatému na železo – čaj snižuje jeho vstřebání. Přídavek citronu (vitamin C) katechiny stabilizuje.",
  },
};
