// "Co nekombinovat" guide: medicines by everyday name first (most commonly used first), then
// supplements, other medicine groups, herbs together, food and drink. Each group has short
// hand-written rules plus the matching study findings from the article analyses (D.ixg).
// Groups that concern the user's profile (medicines, conditions) are moved to the top.
// Texts written by Claude – to be reviewed by a pharmacist.
import { D } from "./data";
import { MED_PREFIX } from "./meds";
import type { IxItem } from "./types";

/** R riziko, Z zesiluje, O oslabuje, V snižuje vstřebávání, L zlepšuje, T doporučení */
export type GuideRule = {
  co: string;
  sp?: string[];
  t: "R" | "Z" | "O" | "V" | "L" | "T";
  proc: string;
};
export type GuideGroup = {
  k: string;
  icon: string;
  title: string;
  /** examples shown under the title */
  ex?: string;
  note?: string;
  /** profile entries (medicine keys without "med:", flags, "c:" conditions) that make it relevant */
  rel: string[];
  rules: GuideRule[];
  /** study findings whose drug/summary text matches */
  rx?: RegExp;
  /** whole D.ixg groups that belong here */
  ixg?: string[];
};

export const RULE_T: Record<GuideRule["t"], [string, string]> = {
  R: ["riziko", "ix-r"],
  Z: ["zesiluje účinek", "ix-z"],
  O: ["oslabuje účinek", "ix-o"],
  V: ["snižuje vstřebávání", "ix-v"],
  L: ["zlepšuje vstřebávání", "ix-l"],
  T: ["doporučení", "ix-l"],
};

const BLEEDERS = ["ginkgo_biloba", "allium_sativum", "curcuma_longa", "zingiber_officinale"];
const SEDATIVES = [
  "valeriana_officinalis",
  "humulus_lupulus",
  "melissa_officinalis",
  "passiflora_incarnata",
];

export const GUIDE: GuideGroup[] = [
  {
    k: "antibiotika",
    icon: "💊",
    title: "Antibiotika",
    ex: "doxycyklin, ciprofloxacin, amoxicilin, metronidazol",
    rel: [],
    rules: [
      {
        co: "Mléko, jogurty, sýry, minerálky s vápníkem",
        t: "V",
        proc: "Některá antibiotika (doxycyklin, ciprofloxacin) se s vápníkem naváží a vstřebají se hůř. Dodržte odstup aspoň 2 hodiny.",
      },
      {
        co: "Železo, hořčík, zinek (doplňky i léky na pálení žáhy)",
        t: "V",
        proc: "Stejně jako vápník brání vstřebání těchto antibiotik. Užijte je 2 hodiny před antibiotikem, nebo 4–6 hodin po něm.",
      },
      {
        co: "Alkohol",
        t: "R",
        proc: "U metronidazolu a některých dalších antibiotik hrozí nevolnost, zvracení a bušení srdce. Nepijte během léčby a ještě 2–3 dny po ní.",
      },
      {
        co: "Probiotika",
        t: "T",
        proc: "Studie naznačují, že mohou zmírnit průjem po antibiotikách. Užívejte je s odstupem 2–3 hodin od antibiotika.",
      },
    ],
    rx: /antibiot|ciproflox|fosfomycin|kolistin|beta-lakt/,
  },
  {
    k: "antikoncepce",
    icon: "🌸",
    title: "Antikoncepce",
    ex: "pilulky, kroužek, náplast",
    rel: ["antikoncepce"],
    rules: [
      {
        co: "Třezalka",
        sp: ["hypericum_perforatum"],
        t: "O",
        proc: "Urychluje odbourávání hormonů, antikoncepce pak nemusí spolehlivě chránit. Popsáno je krvácení mimo cyklus i nechtěná těhotenství.",
      },
      {
        co: "Silná projímadla (senna) a aktivní uhlí",
        sp: ["senna_alexandrina"],
        t: "V",
        proc: "Průjem nebo uhlí do 3–4 hodin po tabletě může snížit její vstřebání. Řiďte se příbalovým letákem.",
      },
      {
        co: "Grapefruit",
        sp: ["citrus"],
        t: "Z",
        proc: "Může mírně zvýšit hladinu estrogenu v krvi.",
      },
    ],
    rx: /antikoncep|hormony \(ugt\)/,
  },
  {
    k: "bolest",
    icon: "🤕",
    title: "Léky na bolest a horečku",
    ex: "ibuprofen (Ibalgin, Nurofen), paracetamol (Paralen), aspirin, diklofenak",
    rel: ["nsaid", "aspirin"],
    rules: [
      {
        co: "Alkohol s paracetamolem",
        t: "R",
        proc: "Spolu zatěžují játra. Kdo pravidelně pije, má paracetamol brát jen krátce a v nižších dávkách.",
      },
      {
        co: "Ginkgo, česnek, kurkuma, zázvor ve vyšších dávkách",
        sp: BLEEDERS,
        t: "Z",
        proc: "Studie naznačují, že spolu s ibuprofenem, diklofenakem nebo aspirinem mohou zvyšovat sklon ke krvácení.",
      },
      {
        co: "Vrbová kůra",
        sp: ["salix_alba"],
        t: "Z",
        proc: "Obsahuje salicyláty podobné aspirinu. S aspirinem nebo ibuprofenem hrozí zdvojení účinku a podráždění žaludku.",
      },
      {
        co: "Rybí tuk (omega-3) ve vysokých dávkách",
        t: "Z",
        proc: "Mírně ředí krev, s léky na bolest může zvýšit sklon ke krvácení.",
      },
    ],
    rx: /aspirin|ibuprofen|paracetamol|nsaid|diklofen/,
  },
  {
    k: "nos",
    icon: "👃",
    title: "Nosní kapky na ucpaný nos",
    ex: "Olynth, Nasivin, Sanorin (xylometazolin, oxymetazolin)",
    note: "Přímých studií o kombinaci nosních kapek s bylinami je málo. Upozornění vychází z podobného účinku – obě skupiny zužují cévy. Kapky samotné používejte nejvýš 5–7 dní.",
    rel: [],
    rules: [
      {
        co: "Hořký pomeranč (synefrin) a efedra",
        sp: ["citrus"],
        t: "R",
        proc: "Povzbuzující látky, které stejně jako nosní kapky zužují cévy. Spolu mohou zvyšovat tlak a zrychlovat tep.",
      },
      {
        co: "Kofein ve velkých dávkách (energetické nápoje, guarana)",
        sp: ["coffea_arabica", "paullinia_cupana"],
        t: "Z",
        proc: "Může zesílit bušení srdce a zvýšení tlaku.",
      },
    ],
    rx: /synefrin|stimulant|energetick/,
  },
  {
    k: "doplnky",
    icon: "🧲",
    title: "Doplňky stravy",
    ex: "železo, hořčík, vápník, zinek, vitaminy D a K, rybí tuk, jód",
    rel: [],
    rules: [
      {
        co: "Železo s čajem nebo kávou",
        sp: ["camellia_sinensis", "coffea_arabica"],
        t: "V",
        proc: "Polyfenoly z čaje a kávy snižují vstřebávání železa. Pijte je aspoň hodinu od železa.",
      },
      {
        co: "Železo s mlékem a vápníkem",
        t: "V",
        proc: "Vápník brání vstřebání železa. Užívejte je v různou denní dobu.",
      },
      {
        co: "Železo s vitaminem C",
        t: "L",
        proc: "Vitamin C (i z ovoce a zeleniny) vstřebání železa zlepšuje.",
      },
      {
        co: "Hořčík, vápník, zinek, železo a léky",
        t: "V",
        proc: "Snižují vstřebání léků na štítnou žlázu a některých antibiotik. Odstup aspoň 4 hodiny od levothyroxinu a 2 hodiny od antibiotik.",
      },
      {
        co: "Zinek ve vysokých dávkách dlouhodobě",
        t: "R",
        proc: "Může snížit měď v těle. Nepřekračujte doporučené dávky bez porady s lékařem.",
      },
      {
        co: "Vitamin K a warfarin",
        t: "O",
        proc: "Oslabuje účinek warfarinu. Při léčbě warfarinem nezačínejte s vitaminem K bez lékaře a jezte listovou zeleninu rovnoměrně.",
      },
      {
        co: "Rybí tuk a léky na ředění krve",
        t: "Z",
        proc: "Ve vyšších dávkách může zvýšit sklon ke krvácení.",
      },
      {
        co: "Jód a mořské řasy (kelp)",
        t: "R",
        proc: "Nadbytek jódu může rozhodit štítnou žlázu, hlavně u lidí s jejím onemocněním.",
      },
      {
        co: "Vláknina (psyllium, lněné semínko) a léky",
        sp: ["plantago_ovata", "linum_usitatissimum"],
        t: "V",
        proc: "Může zpomalit vstřebání léků i doplňků. Užívejte s odstupem aspoň 2 hodin.",
      },
    ],
    rx: /železo|zinek|hořčík|vápník|minerál|vitamin/,
    ixg: ["Vstřebávání železa, zinku a vápníku"],
  },
  {
    k: "krev",
    icon: "🩸",
    title: "Léky na ředění krve",
    ex: "warfarin, Xarelto, Eliquis, Pradaxa, Anopyrin, Godasal, Plavix",
    rel: ["warfarin", "noak", "heparin", "aspirin", "klopidogrel", "krev"],
    rules: [
      {
        co: "Ginkgo, česnek, kurkuma, zázvor, rybí tuk",
        sp: BLEEDERS,
        t: "Z",
        proc: "Studie naznačují, že mohou zvyšovat sklon ke krvácení. Některé studie účinek nepotvrdily, ale opatrnost se doporučuje, hlavně před operací.",
      },
      {
        co: "Třezalka",
        sp: ["hypericum_perforatum"],
        t: "O",
        proc: "Oslabuje warfarin i některé nové léky (rivaroxaban, apixaban) – hrozí sraženina.",
      },
      {
        co: "Listová zelenina (vitamin K)",
        t: "O",
        proc: "Oslabuje warfarin. Není nutné ji vynechat, ale jíst ji rovnoměrně bez velkých výkyvů.",
      },
      {
        co: "Brusinky ve velkém množství",
        sp: ["vaccinium_macrocarpon"],
        t: "Z",
        proc: "Popsány jsou případy zesílení warfarinu. Běžné množství je podle studií bez problému.",
      },
    ],
    rx: /warfarin|ředění|rivaroxab|klopidog|destič|aspirin|srážliv/,
    ixg: ["Léky na ředění krve"],
  },
  {
    k: "tlak",
    icon: "❤️",
    title: "Léky na tlak, srdce a cholesterol",
    ex: "amlodipin, ramipril, metoprolol, Furon, Verospiron, digoxin, statiny",
    rel: ["tlak", "digoxin", "diuretika", "statiny"],
    rules: [
      {
        co: "Lékořice a pendrek",
        sp: ["glycyrrhiza_glabra"],
        t: "R",
        proc: "Zvyšuje tlak, zadržuje vodu a snižuje draslík. Oslabuje léky na tlak a s léky na odvodnění hrozí nebezpečný pokles draslíku.",
      },
      {
        co: "Třezalka",
        sp: ["hypericum_perforatum"],
        t: "O",
        proc: "Snižuje hladinu digoxinu, některých léků na tlak a statinů.",
      },
      {
        co: "Grapefruit a pomelo",
        sp: ["citrus"],
        t: "Z",
        proc: "Zvyšují hladinu některých statinů (simvastatin, atorvastatin) a léků na tlak (felodipin, amlodipin).",
      },
      {
        co: "Draslík a náhražky soli",
        t: "R",
        proc: "S některými léky na tlak (ramipril, perindopril) a spironolaktonem hrozí příliš vysoký draslík.",
      },
    ],
    rx: /tlak|srdc|digoxin|statin|felodipin|furosemid|draslík|qt\b/,
    ixg: ["Draslík a krevní tlak"],
  },
  {
    k: "psych",
    icon: "🧠",
    title: "Antidepresiva, léky na spaní a epilepsii",
    ex: "sertralin, escitalopram, trazodon, zolpidem, alprazolam",
    rel: ["antidepresiva", "spani", "epilepsie"],
    rules: [
      {
        co: "Třezalka a antidepresiva",
        sp: ["hypericum_perforatum"],
        t: "R",
        proc: "Spolu mohou vyvolat serotoninový syndrom (neklid, pocení, třes, zrychlený tep). Nekombinujte.",
      },
      {
        co: "Kozlík, chmel, meduňka, mučenka, kava a léky na spaní",
        sp: [...SEDATIVES, "piper_methysticum"],
        t: "Z",
        proc: "Zesilují útlum a ospalost. Neřiďte a neužívejte je bez porady s lékařem.",
      },
      {
        co: "Alkohol",
        t: "Z",
        proc: "Zesiluje útlum po lécích na spaní a uklidnění.",
      },
      {
        co: "Zrající sýry, víno, fermentované potraviny (tyramin)",
        t: "R",
        proc: "Se staršími antidepresivy typu MAO inhibitorů mohou prudce zvýšit tlak.",
      },
    ],
    rx: /antidepres|\bmao\b|spaní|kratom/,
  },
  {
    k: "cukr",
    icon: "🍬",
    title: "Léky na cukrovku",
    ex: "metformin, inzulin, gliklazid, Jardiance, Ozempic",
    rel: ["metformin", "inzulin", "antidiab", "cukr"],
    rules: [
      {
        co: "Skořice, pískavice, gymnema, dřišťál (berberin), ženšen",
        sp: [
          "cinnamomum",
          "trigonella_foenum_graecum",
          "gymnema_sylvestre",
          "berberis_vulgaris",
          "panax_ginseng",
        ],
        t: "Z",
        proc: "Studie naznačují, že mohou snižovat cukr v krvi. S léky hrozí příliš nízký cukr – měřte si glykémii a poraďte se s lékařem.",
      },
      {
        co: "Alkohol",
        t: "R",
        proc: "Může nebezpečně snížit cukr v krvi, hlavně s inzulinem a gliklazidem.",
      },
    ],
    rx: /cukrov|akarbóz|metformin|nízký cukr/,
    ixg: ["Léky na cukrovku"],
  },
  {
    k: "stitna",
    icon: "🦋",
    title: "Léky na štítnou žlázu",
    ex: "Euthyrox, Letrox (levothyroxin), Thyrozol",
    rel: ["stitna", "c:stitna"],
    rules: [
      {
        co: "Káva, mléko, sója a vláknina",
        sp: ["coffea_arabica", "glycine_max"],
        t: "V",
        proc: "Snižují vstřebání levothyroxinu. Berte ho nalačno, 30–60 minut před snídaní a kávou.",
      },
      {
        co: "Vápník, železo, hořčík",
        t: "V",
        proc: "Odstup aspoň 4 hodiny od levothyroxinu.",
      },
      {
        co: "Mořské řasy a doplňky s jódem",
        t: "R",
        proc: "Nadbytek jódu může zhoršit onemocnění štítné žlázy.",
      },
    ],
    rx: /levothyrox|štítn|jód/,
    ixg: ["Štítná žláza a jód"],
  },
  {
    k: "imuno",
    icon: "🛡️",
    title: "Léky tlumící imunitu a léčba rakoviny",
    ex: "cyklosporin, takrolimus, metotrexát, chemoterapie, tamoxifen",
    rel: ["imunosupresiva", "chemo", "hrt", "imuno", "onko"],
    rules: [
      {
        co: "Třezalka",
        sp: ["hypericum_perforatum"],
        t: "O",
        proc: "Snižuje hladinu cyklosporinu, takrolimu a mnoha protinádorových léků. Hrozí odmítnutí transplantátu nebo selhání léčby.",
      },
      {
        co: "Grapefruit",
        sp: ["citrus"],
        t: "Z",
        proc: "Zvyšuje hladinu takrolimu a cyklosporinu, hrozí nežádoucí účinky.",
      },
      {
        co: "Echinacea a byliny „na imunitu“",
        sp: ["echinacea_purpurea"],
        t: "O",
        proc: "Mohou působit proti lékům, které imunitu záměrně tlumí.",
      },
      {
        co: "Extrakty zeleného čaje",
        sp: ["camellia_sinensis"],
        t: "O",
        proc: "V laboratoři oslabovaly některé protinádorové léky. Během léčby se poraďte s onkologem.",
      },
    ],
    rx: /takrolim|transplant|protinádor|tamoxifen|sorafenib|gefitinib|bortezomib|gemcitabin|cyklospor|tofacitinib|\bhiv\b|ritonavir|antiretro/,
  },
  {
    k: "byliny",
    icon: "🌿",
    title: "Byliny mezi sebou",
    rel: [],
    rules: [
      {
        co: "Více bylin na spaní najednou",
        sp: SEDATIVES,
        t: "Z",
        proc: "Kozlík, chmel, meduňka a mučenka se v účinku sčítají. Směsi jsou běžné, ale nepřidávejte k nim další přípravky na spaní.",
      },
      {
        co: "Více bylin ředících krev",
        sp: BLEEDERS,
        t: "Z",
        proc: "Ginkgo, česnek, kurkuma a zázvor najednou ve vysokých dávkách mohou zvyšovat sklon ke krvácení.",
      },
      {
        co: "Kofein se synefrinem nebo guaranou",
        sp: ["coffea_arabica", "citrus", "paullinia_cupana"],
        t: "R",
        proc: "Spalovače tuků a předtréninkové směsi s touto kombinací byly spojeny s bušením srdce a vysokým tlakem.",
      },
    ],
    ixg: ["Kombinace bylin a potravin"],
  },
  {
    k: "jidlo",
    icon: "🍷",
    title: "Jídlo a pití",
    ex: "grapefruit, alkohol, káva, čaj, mléko, sýry",
    rel: [],
    rules: [],
    ixg: [
      "Grapefruit a citrusy",
      "Tyramin a histamin (sýry, víno, fermentované potraviny)",
      "Kofein a povzbuzující látky",
      "Alkohol",
      "Šťavelany a ledviny",
      "Kumarin (skořice)",
    ],
  },
];

/** Remaining study groups shown at the end, with the profile entries that make them relevant. */
export const GUIDE_REST: { g: string; rel: string[] }[] = [
  { g: "Těhotenství, kojení a děti", rel: ["tehot"] },
  { g: "Poškození jater", rel: ["jatra"] },
  { g: "Těžké kovy a kontaminace", rel: [] },
  { g: "Ostatní léky", rel: ["leky"] },
  { g: "Obecně o interakcích a bezpečnosti bylin", rel: [] },
];

/** Does the profile (flags + "med:<key>") concern any of these entries? */
export function relevant(rel: readonly string[], prof: ReadonlySet<string>): boolean {
  return rel.some((r) => prof.has(r) || prof.has(MED_PREFIX + r));
}

/** Study findings for each guide group: whole groups first, then text matches (each finding used once). */
export function guideStudies(): Record<string, IxItem[]> {
  const used = new Set<IxItem>();
  const out: Record<string, IxItem[]> = {};
  const byG = new Map((D.ixg ?? []).map((g) => [g.g, g.it]));
  for (const g of GUIDE) {
    const list: IxItem[] = [];
    for (const name of g.ixg ?? [])
      for (const x of byG.get(name) ?? []) {
        if (used.has(x)) continue;
        used.add(x);
        list.push(x);
      }
    out[g.k] = list;
  }
  for (const g of GUIDE) {
    if (!g.rx) continue;
    for (const grp of D.ixg ?? [])
      for (const x of grp.it)
        if (!used.has(x) && g.rx.test(`${x.p ?? ""} ${x.s}`.toLowerCase())) {
          used.add(x);
          out[g.k]!.push(x);
        }
  }
  for (const r of GUIDE_REST)
    out["rest:" + r.g] = (byG.get(r.g) ?? []).filter((x) => {
      if (used.has(x)) return false;
      used.add(x);
      return true;
    });
  return out;
}

/** Guide groups in display order: the user's groups first (keeping the base order), then the rest. */
export function orderedGuide(prof: ReadonlySet<string>): { g: GuideGroup; mine: boolean }[] {
  const all = GUIDE.map((g) => ({ g, mine: relevant(g.rel, prof) }));
  return [...all.filter((x) => x.mine), ...all.filter((x) => !x.mine)];
}
