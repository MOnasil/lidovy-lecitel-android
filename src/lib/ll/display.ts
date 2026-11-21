import { D, SP, U, grade, norm } from "./data";

/** Price ranges of ready-made products, shown without further explanation. */
export const PRICE_KC: Record<string, string> = {
  L: "do 150 Kč",
  S: "150–400 Kč",
  D: "nad 400 Kč",
};

/** Non-native plants that are nevertheless grown in Czech gardens or fields. */
const GROWN_CZ = new Set([
  "shiitake",
  "mandlova",
  "glycine_max",
  "cynara_scolymus",
  "pimpinella_anisum",
  "chenopodium_quinoa",
  "glycyrrhiza_glabra",
  "cicer_arietinum",
]);

/** Growing label – never says "growing is manageable" for plants that cannot be grown in Czechia. */
export function growLabel(k: string): string | null {
  const u = U(k);
  if (!u) return null;
  const s = SP[k];
  const ok = !!s?.cr || k in D.garden || GROWN_CZ.has(k);
  return ok ? (D.grow[u[5]] ?? null) : "V ČR se nepěstuje";
}

/** Traditional Chinese medicine herbs and mushrooms (Atlas section). */
export const TCM = new Set([
  "reishi",
  "cordyceps_s",
  "cordyceps_m",
  "shiitake",
  "outkovka",
  "rosolovka",
  "maitake",
  "pornatka",
  "ginkgo_biloba",
  "panax_ginseng",
  "astragalus_membranaceus",
  "scutellaria_baicalensis",
  "pueraria_lobata",
  "salvia_miltiorrhiza",
  "schisandra_chinensis",
  "rheum_palmatum",
  "glycyrrhiza_glabra",
  "zingiber_officinale",
  "cinnamomum",
  "camellia_sinensis",
  "curcuma_longa",
  "morus_alba",
  "lycium_barbarum",
  "artemisia_annua",
  "crocus_sativus",
]);

/** "When" and "how often" merged into one sentence. */
export function whenHowOften(u: readonly unknown[]): string {
  const a = String(u[1] ?? "").trim();
  const b = String(u[2] ?? "").trim();
  if (!a) return b;
  if (!b) return a;
  return /[.!?]$/.test(a) ? `${a} ${b}` : `${a}. ${b.charAt(0).toUpperCase()}${b.slice(1)}`;
}

const LIGHT: Record<string, string> = { S: "na slunci", P: "v polostínu", T: "ve stínu" };
const MON = [
  "leden",
  "únor",
  "březen",
  "duben",
  "květen",
  "červen",
  "červenec",
  "srpen",
  "září",
  "říjen",
  "listopad",
  "prosinec",
];

/** Growing difficulty in Czechia plus a short explanation of how to grow it at home. */
export function growInfo(
  k: string,
): { lvl: "E" | "M" | "H" | "N"; label: string; text: string } | null {
  const u = U(k);
  const s = SP[k];
  if (!u || !s) return null;
  const gl = growLabel(k);
  const lvl = (gl == "V ČR se nepěstuje" ? "N" : u[5]) as "E" | "M" | "H" | "N";
  const label =
    { E: "Snadné", M: "Středně náročné", H: "Náročné", N: "V ČR se nepěstuje" }[lvl] ?? "—";
  const g = D.garden[k];
  const bits: string[] = [];
  if (lvl != "N" && g) {
    if (LIGHT[g[2]]) bits.push(`Daří se jí ${LIGHT[g[2]]}`);
    bits.push(g[1] ? `na záhonu i v truhlíku (od ${g[1]} l)` : "jen na záhonu");
    if (g[4].length) bits.push(`výsev: ${g[4].map((m) => MON[m - 1]).join(", ")}`);
  }
  const extra = bits.length ? `${bits.join(", ")}.` : "";
  const text = [s.pest, extra].filter(Boolean).join(" ");
  return { lvl, label, text };
}

const SUKL_FORM: [RegExp, string][] = [
  [/^SPC/, "čaj"],
  [/TBL/, "tablety"],
  [/CPS/, "kapsle"],
  [/SIR/, "sirup"],
  [/GTT|SOL/, "kapky"],
  [/PAS/, "pastilky"],
  [/SPR/, "sprej"],
  [/UNG|CRM|GEL/, "mast"],
];

/** Forms in which registered medicines with this plant are sold in pharmacies (most common first). */
export function pharmacyForms(k: string, max = 3): string[] {
  const list = D.sukl?.sp[k];
  if (!list || !list.length) return [];
  const n = new Map<string, number>();
  for (const p of list) {
    const hit = SUKL_FORM.find(([rx]) => rx.test(p.f));
    if (hit) n.set(hit[1], (n.get(hit[1]) ?? 0) + 1);
  }
  return [...n.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map((x) => x[0]);
}

/** "Možno koupit v lékárně jako čaj / kapky / tablety", or null when nothing is registered. */
export function pharmacyText(k: string): string | null {
  const f = pharmacyForms(k);
  return f.length ? `Možno koupit v lékárně jako ${f.join(" / ")}` : null;
}

/** External or unusual folk uses that are worth showing even when studies cover the same topic. */
const FOLK_EXTRA =
  /obklad|koup|výplach|vyplach|klokt|inhal|mast|zábal|pára|páru|potíral|natír|přikládal|vtíral|žvýk|salát|jedl|sbír|vlas|neht|polštář|kojící|miminka|otrav|kapal|mazal|marmelád|mniš|mnich|pastev|prý|„/i;

/**
 * Whether the "Babské léčitelství" section adds something new: a use studies do not back on human level,
 * an external/unusual folk preparation, or a use for a topic not already listed in "Na co pomáhá".
 */
export function interestingTrad(
  k: string,
  tr: readonly (readonly [string, string, string, string])[],
): boolean {
  return tr.some((t) => {
    const g = grade(k, t[2]);
    if (!g || g == "C") return true;
    return FOLK_EXTRA.test(t[1]);
  });
}

/** Which form of use (D.forms key) a SÚKL dosage form belongs to, in order of preference. */
const SUKL_TO_FORM: [RegExp, string[]][] = [
  [/^SPC/, ["caj"]],
  [/TBL|CPS/, ["kapsle", "extrakt", "prasek"]],
  [/SIR/, ["sirup"]],
  [/GTT|SOL/, ["tinktura", "tinkb"]],
  [/UNG|CRM|GEL/, ["zevne"]],
];

/** Package size from the SÚKL package text, e.g. "100ML" → "100 ml", "SPC 20 II" → "20 sáčků". */
function packSize(dop: string, f: string): string {
  const rest = dop.slice(dop.indexOf(f) >= 0 ? dop.indexOf(f) + f.length : 0).trim();
  const m =
    rest.match(/(\d+)\s*[Xx]\s*(\d+(?:[,.]\d+)?)\s*(ML|G)\b/i) ??
    rest.match(/(\d+(?:[,.]\d+)?)\s*(ML|G)\b/i);
  if (m && m.length == 4)
    return m[1] == "1"
      ? `${m[2]} ${m[3]!.toLowerCase()}`
      : `${m[1]} × ${m[2]} ${m[3]!.toLowerCase()}`;
  if (m) return `${m[1]} ${m[2]!.toLowerCase()}`;
  const n = rest.match(/^(\d+)/);
  if (n) {
    const c = Number(n[1]);
    return /^SPC/.test(f) ? `${c} ${c == 1 ? "sáček" : c < 5 ? "sáčky" : "sáčků"}` : `${c} ks`;
  }
  return rest.toLowerCase();
}

export type PharmItem = {
  name: string;
  sizes: string[];
  v: string;
  combo: boolean;
  latky: string[];
  form: string | null;
};

/** Registered medicines with this plant, packages of the same product merged, each assigned to a form of use. */
export function pharmacyItems(k: string, formy: readonly string[]): PharmItem[] {
  const list = D.sukl?.sp[k];
  if (!list) return [];
  const by = new Map<string, PharmItem>();
  for (const p of list) {
    const key = p.n + "|" + p.f;
    const rule = SUKL_TO_FORM.find(([rx]) => rx.test(p.f));
    const form = rule ? (rule[1].find((x) => formy.includes(x)) ?? null) : null;
    const it = by.get(key) ?? {
      name: p.n,
      sizes: [],
      v: p.v,
      combo: p.combo,
      latky: p.latky,
      form,
    };
    const sz = packSize(p.dop, p.f);
    if (sz && !it.sizes.includes(sz)) it.sizes.push(sz);
    by.set(key, it);
  }
  const num = (x: string) => parseFloat(x.replace(",", ".")) || 0;
  for (const it of by.values()) it.sizes.sort((a, b) => num(a) - num(b));
  return [...by.values()].sort(
    (a, b) => Number(a.combo) - Number(b.combo) || a.name.localeCompare(b.name, "cs"),
  );
}

/** What a medicine named in an interaction is used for (shown next to its name). */
const DRUG_USE: [RegExp, string][] = [
  [/warfarin/i, "na ředění krve"],
  [/rivaroxaban/i, "na ředění krve (Xarelto)"],
  [/klopidogrel/i, "proti srážení krevních destiček (Plavix)"],
  [/aspirin/i, "na bolest a proti srážení krve"],
  [/tamoxifen/i, "léčba rakoviny prsu"],
  [/levothyroxin/i, "na sníženou funkci štítné žlázy (Euthyrox)"],
  [/furosemid/i, "na odvodnění"],
  [/takrolimus/i, "po transplantaci, tlumí imunitu"],
  [/ritonavir/i, "na HIV a v Paxlovidu na covid"],
  [/akarbóza/i, "na cukrovku"],
  [/felodipin/i, "na vysoký tlak"],
  [/ciprofloxacin/i, "antibiotikum"],
  [/fosfomycin/i, "antibiotikum na močové infekce"],
  [/kolistin|beta-laktam/i, "antibiotika"],
  [/sorafenib|gefitinib|gemcitabin|bortezomib/i, "léky na rakovinu"],
  [/tofacitinib/i, "na revmatoidní artritidu"],
  [/doramektin/i, "veterinární lék proti parazitům"],
  [/\bCYP|P-glykoprotein|UGT/i, "ovlivňuje, jak játra a střevo odbourávají mnoho léků"],
  [/prodlužující QT/i, "léky ovlivňující srdeční rytmus"],
  [/MAO/i, "starší typ antidepresiv"],
  [/antimykotik/i, "léky na plísně"],
  [/antiretrovir|léky na HIV/i, "léky na HIV"],
];

/** "warfarin" → "warfarin – na ředění krve"; unknown partners stay as they are. */
export function drugLabel(p: string): string {
  const hit = DRUG_USE.find(([rx]) => rx.test(p));
  return hit ? `${p} – ${hit[1]}` : p;
}

/** Where the plant grows: wild in nature, only cultivated, or not in Czechia at all. */
export function habitat(k: string): { ic: string; t: string } | null {
  const h = D.hab?.[k];
  if (h == "W") return { ic: "🌳", t: "Roste volně v přírodě" };
  if (h == "G") return { ic: "🏡", t: "Jen pěstovaná – zahrady, pole, truhlíky, doma" };
  const s = SP[k];
  if (!s || s.kat == "vcela" || k == "houby" || k == "jablecny_ocet") return null;
  // A species listed as growing in the Czech Republic never gets a "does not grow here" label.
  if (s.cr) return { ic: "🌳", t: "Roste volně v přírodě" };
  const gi = growInfo(k);
  return gi && gi.lvl != "N"
    ? { ic: "🏡", t: "V přírodě v ČR neroste, dá se pěstovat" }
    : { ic: "🌍", t: "V ČR neroste – dovážená" };
}

/* ---------- Kde sehnat: icons for the places in the text ---------- */
const SOURCE_ICONS: [RegExp, string, string][] = [
  [/lékárn|předpis/i, "💊", "lékárna"],
  [/drogeri/i, "🧴", "drogerie"],
  [/e-shop|bylinkářstv|prodejn/i, "🛒", "e-shop"],
  [/obchod|supermarket|trh|tržnic/i, "🥬", "obchod"],
  [/včelař/i, "🐝", "včelaři"],
  [/vypěstovat|vypěstujete|pěstírn|pokojov|květináč/i, "🌱", "pěstování"],
  [/nasbírat|v přírodě/i, "🌳", "příroda"],
];
/** Icons (with labels) for the places mentioned in the "Kde sehnat" sentence. */
export function sourceIcons(text: string): { ic: string; t: string }[] {
  return SOURCE_ICONS.filter(([rx]) => rx.test(text)).map(([, ic, t]) => ({ ic, t }));
}

/** Where each form of use can be bought or got; home forms add growing / gathering from "Kde sehnat". */
const FORM_SRC: Record<string, { ic: string; t: string }[]> = {
  kapsle: [
    { ic: "💊", t: "lékárna" },
    { ic: "🧴", t: "drogerie" },
    { ic: "🛒", t: "e-shop" },
  ],
  extrakt: [
    { ic: "💊", t: "lékárna" },
    { ic: "🛒", t: "e-shop" },
  ],
  tinktura: [
    { ic: "💊", t: "lékárna" },
    { ic: "🌿", t: "bylinkářství" },
    { ic: "🛒", t: "e-shop" },
  ],
  sirup: [
    { ic: "💊", t: "lékárna" },
    { ic: "🧴", t: "drogerie" },
  ],
  olej: [
    { ic: "💊", t: "lékárna" },
    { ic: "🧴", t: "drogerie" },
    { ic: "🛒", t: "e-shop" },
  ],
  prasek: [
    { ic: "🌿", t: "bylinkářství" },
    { ic: "🛒", t: "e-shop" },
  ],
  caj: [
    { ic: "💊", t: "lékárna" },
    { ic: "🌿", t: "bylinkářství" },
  ],
  odvar: [
    { ic: "💊", t: "lékárna" },
    { ic: "🌿", t: "bylinkářství" },
  ],
  odvarb: [
    { ic: "💊", t: "lékárna" },
    { ic: "🌿", t: "bylinkářství" },
  ],
  tinkb: [{ ic: "🌿", t: "bylinkářství" }],
  koreni: [{ ic: "🥬", t: "obchod" }],
  jidlo: [{ ic: "🥬", t: "obchod" }],
  zevne: [{ ic: "🌿", t: "bylinkářství" }],
};
/** A home form bought ready-made (registered tea, ointment…) is sold in pharmacies. */
export const READY_SRC = [
  { ic: "💊", t: "lékárna" },
  { ic: "🛒", t: "e-shop" },
];
const HOME_FORMS = new Set(["caj", "odvar", "odvarb", "tinkb", "koreni", "jidlo", "zevne"]);
export function formSources(k: string, f: string): { ic: string; t: string }[] {
  const kde = String(U(k)?.[4] ?? "");
  const out = [...(FORM_SRC[f] ?? [])];
  const found = sourceIcons(kde);
  if (found.some((x) => x.t == "včelaři")) out.unshift({ ic: "🐝", t: "včelaři" });
  if (HOME_FORMS.has(f))
    for (const x of found) if (x.t == "pěstování" || x.t == "příroda") out.push(x);
  const seen = new Set<string>();
  return out.filter((x) => !seen.has(x.t) && (seen.add(x.t), true));
}

/* ---------- Jak zpracovat: steps from the data the app already has ---------- */
export type ProcStep = { ic: string; t: string; d: string };
const sentences = (t: string) => t.split(/(?<=\.)\s+/).filter(Boolean);
const HARD_PART = /kořen|oddenek|semen|semínk|kůr|plod|bobul|choroš|houb|plodnic/i;

/** Steps "získat → usušit → rozdrtit → připravit → skladovat"; steps that do not apply are left out. */
export function processSteps(k: string): ProcStep[] {
  const s = SP[k];
  const u = U(k);
  if (!s || !u) return [];
  const out: ProcStep[] = [];
  const g = D.garden[k];
  const gi = growInfo(k);
  const part = g?.[6] ?? "";
  const proc = String(u[6] ?? "");
  const mon = (ms: number[]) => ms.map((m) => MON[m - 1]).join(", ");
  // 1. get it
  const get: string[] = [];
  if (g && gi && gi.lvl != "N") {
    const when = [
      g[4].length ? `zasít ${mon(g[4])}` : "",
      g[5].length ? `sklízet ${mon(g[5])}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    get.push(`Vypěstovat: ${when}${part ? ` – sklízí se ${part}` : ""}.`);
  }
  if (D.hab?.[k] == "W" && s.kdy && s.kdy != "—")
    get.push(`Nasbírat v přírodě: ${s.kdy.charAt(0).toLowerCase()}${s.kdy.slice(1)}`);
  if (u[4] && u[4] != "—") get.push(u[4]);
  if (get.length) out.push({ ic: "🌱", t: "Získat", d: get.join(" ") });
  // 2. dry
  const dry = sentences(proc).filter((x) => /suš/i.test(x) && !/^Skladujte/i.test(x));
  if (dry.length) out.push({ ic: "☀️", t: "Usušit", d: dry.join(" ") });
  // 3. crush / grind
  const grindForms = s.formy.some((f) =>
    ["odvar", "odvarb", "prasek", "kapsle", "koreni", "caj"].includes(f),
  );
  if (dry.length && grindForms) {
    const hard = HARD_PART.test(part || proc);
    out.push({
      ic: "⚙️",
      t: hard ? "Rozdrtit nebo namlít" : "Rozdrobit",
      d: hard
        ? "Usušené kousky před použitím nadrťte v hmoždíři nebo nameťte v mlýnku na kávu – nejlépe těsně před přípravou, protože vonné a účinné látky z rozemleté drogy rychle vyprchávají."
        : "Listy a květy stačí před přípravou lehce rozdrobit v prstech. Nemelte je na prach, čaj by se špatně cedil a rychleji by ztrácel vůni.",
    });
  }
  // 4. prepare
  const homeForms = s.formy.filter((f) => !["kapsle", "extrakt"].includes(f) && D.forms[f]);
  if (homeForms.length)
    out.push({
      ic: "🍵",
      t: "Připravit",
      d: homeForms.map((f) => `${D.forms[f]![0]}: ${D.forms[f]![1]}`).join("\n"),
    });
  // 5. store
  const store = sentences(proc).filter((x) => /sklad|uchov|vydrž|spotřeb|lednic|zamra/i.test(x));
  const restAfterDry = store.map((x) => x.replace(/^.*?(Skladujte)/, "$1"));
  if (restAfterDry.length) out.push({ ic: "🫙", t: "Skladovat", d: restAfterDry.join(" ") });
  // processing text that fits no step stays visible
  const used = new Set([...dry, ...store]);
  const other = sentences(proc).filter((x) => !used.has(x));
  if (other.length)
    out.splice(Math.min(out.length, 1), 0, {
      ic: "✂️",
      t: "Očistit a připravit k sušení",
      d: other.join(" "),
    });
  return out;
}

/** The word that names the herb in a product title ("Echinacea", "Zázvor"…). */
export function nameTerm(k: string, product: string): string {
  const s = SP[k];
  if (!s) return k;
  const n = norm(product);
  const cands = [
    s.lat.split(" ")[0] ?? "",
    s.cz.split(" (")[0]?.split(" ")[0] ?? "",
    ...(s.ln ?? []),
  ];
  for (const c of cands) {
    const w = norm(c);
    if (w.length >= 4) {
      const m = n.match(new RegExp("\\b" + w.slice(0, Math.max(4, w.length - 2)) + "\\w*"));
      if (m) return product.slice(m.index, (m.index ?? 0) + m[0].length);
    }
  }
  return s.cz.split(" (")[0] ?? s.cz;
}
