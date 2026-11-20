// Medicine catalogue for the signed-in profile. Each entry is a drug or drug group a person
// may take; `flags` reuse the profile categories already present in the herb warnings
// (krev, tlak, cukr, imuno, onko) and `rx` matches warning texts that name the drug class.
// A herb warning that hits a medicine is shown as a possible interaction ("možný střet").

export type Med = {
  k: string;
  /** Name shown in the profile */
  n: string;
  /** Group heading in the picker */
  g: string;
  /** Brand and active-substance names used for searching */
  aka: string;
  flags: string[];
  rx?: RegExp;
};

const BLEED = /krvácen|srážen|destič|ředění krve/;

export const MEDS: Med[] = [
  // Krev
  { k: "warfarin", n: "Warfarin", g: "Ředění krve", aka: "warfarin orion lawarin", flags: ["krev"], rx: /warfarin/ },
  { k: "noak", n: "Xarelto, Eliquis, Pradaxa, Lixiana", g: "Ředění krve", aka: "rivaroxaban apixaban dabigatran edoxaban noak doak", flags: ["krev"] },
  { k: "heparin", n: "Fraxiparine, Clexane (heparin)", g: "Ředění krve", aka: "heparin enoxaparin nadroparin injekce", flags: ["krev"] },
  { k: "aspirin", n: "Anopyrin, Godasal, Aspirin", g: "Ředění krve", aka: "kyselina acetylsalicylova asa stacyl", flags: ["krev"], rx: /aspirin/ },
  { k: "klopidogrel", n: "Plavix, Trombex, Brilique", g: "Ředění krve", aka: "klopidogrel clopidogrel tikagrelor prasugrel", flags: ["krev"] },
  // Bolest
  { k: "nsaid", n: "Ibuprofen, Nurofen, Diklofenak, Naproxen", g: "Bolest a záněty", aka: "ibalgin brufen voltaren olfen aulin nimesulid nalgesin ketoprofen", flags: [], rx: BLEED },
  // Srdce a tlak
  { k: "tlak", n: "Léky na vysoký tlak", g: "Srdce a tlak", aka: "amlodipin ramipril perindopril prestarium tritace telmisartan losartan valsartan lozap metoprolol bisoprolol concor nebivolol nebilet betaloc", flags: ["tlak"], rx: /léků? na (srdce|tlak)|léky na tlak/ },
  { k: "digoxin", n: "Digoxin", g: "Srdce a tlak", aka: "digoxin", flags: ["tlak"], rx: /digoxin|léků na srdce/ },
  { k: "diuretika", n: "Léky na odvodnění (Furon, Hydrochlorothiazid, Verospiron)", g: "Srdce a tlak", aka: "furosemid furon hydrochlorothiazid indapamid tertensif spironolakton verospiron diuretika", flags: ["tlak"], rx: /odvodnění|draslík/ },
  { k: "statiny", n: "Statiny na cholesterol (Atoris, Sortis, Rosucard)", g: "Srdce a tlak", aka: "atorvastatin rosuvastatin simvastatin atoris sortis rosucard torvacard cholesterol", flags: [], rx: /statin/ },
  // Cukrovka
  { k: "metformin", n: "Metformin (Glucophage, Siofor)", g: "Cukrovka", aka: "metformin glucophage siofor stadamet", flags: ["cukr"], rx: /metformin/ },
  { k: "inzulin", n: "Inzulin", g: "Cukrovka", aka: "inzulin insulin lantus novorapid humalog toujeo", flags: ["cukr"] },
  { k: "antidiab", n: "Jiné léky na cukrovku (Diaprel, Jardiance, Ozempic)", g: "Cukrovka", aka: "gliklazid diaprel glimepirid amaryl sitagliptin januvia empagliflozin jardiance dapagliflozin forxiga semaglutid ozempic trulicity", flags: ["cukr"] },
  // Hormony
  { k: "antikoncepce", n: "Hormonální antikoncepce", g: "Hormony a štítná žláza", aka: "pilulka antikoncepce prasky tablety kruzek naplast", flags: [], rx: /antikoncep/ },
  { k: "hrt", n: "Hormonální léčba (v přechodu, po rakovině prsu)", g: "Hormony a štítná žláza", aka: "estrogen estradiol hormonalni substitucni tamoxifen letrozol", flags: [], rx: /hormonální (léčb|substit)/ },
  { k: "stitna", n: "Léky na štítnou žlázu (Euthyrox, Letrox)", g: "Hormony a štítná žláza", aka: "levothyroxin euthyrox letrox thyrozol tyreoidea stitna", flags: [], rx: /štítn/ },
  // Psychika a spánek
  { k: "antidepresiva", n: "Antidepresiva (Zoloft, Cipralex, Trittico…)", g: "Psychika a spánek", aka: "sertralin zoloft asentra citalopram escitalopram cipralex elicea fluoxetin prozac paroxetin venlafaxin mirtazapin trazodon trittico", flags: [], rx: /antidepres/ },
  { k: "spani", n: "Léky na spaní a uklidnění (Stilnox, Neurol, Lexaurin)", g: "Psychika a spánek", aka: "zolpidem stilnox hypnogen alprazolam neurol xanax diazepam bromazepam lexaurin klonazepam rivotril oxazepam benzodiazepiny", flags: [], rx: /léky na spaní|léků na spaní|ospal/ },
  { k: "epilepsie", n: "Léky na epilepsii (Tegretol, Lamictal, Keppra)", g: "Psychika a spánek", aka: "karbamazepin tegretol valproat depakine lamotrigin lamictal levetiracetam keppra", flags: [], rx: /epilep/ },
  // Imunita a nádory
  { k: "imunosupresiva", n: "Léky tlumící imunitu (cyklosporin, takrolimus)", g: "Imunita a nádory", aka: "cyklosporin sandimmun takrolimus prograf mykofenolat cellcept azathioprin imuran metotrexat transplantace", flags: ["imuno"], rx: /transplant|imunosup|cyklospor/ },
  { k: "chemo", n: "Onkologická léčba (chemoterapie, biologická léčba)", g: "Imunita a nádory", aka: "chemoterapie cytostatika onkologie biologicka lecba", flags: ["onko"] },
];

export const MED: Record<string, Med> = Object.fromEntries(MEDS.map((m) => [m.k, m]));
export const MED_GROUPS: string[] = [...new Set(MEDS.map((m) => m.g))];

/** Medicines are stored inside the profile set as "med:<key>" so every warning check sees them. */
export const MED_PREFIX = "med:";
export const medsIn = (prof: ReadonlySet<string>): Med[] => {
  const out: Med[] = [];
  for (const f of prof) if (f.startsWith(MED_PREFIX)) {
    const m = MED[f.slice(MED_PREFIX.length)];
    if (m) out.push(m);
  }
  return out;
};

/** Medicines whose interaction rules match a herb warning in category `f` with text `t`. */
export function medsHitting(meds: Med[], f: string, t: string): Med[] {
  const low = t.toLowerCase();
  return meds.filter((m) => (f != "*" && m.flags.includes(f)) || (m.rx != null && m.rx.test(low)));
}

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
export function searchMeds(q: string): Med[] {
  const n = fold(q.trim());
  if (!n) return MEDS;
  return MEDS.filter((m) => fold(m.n + " " + m.aka + " " + m.g).includes(n));
}
