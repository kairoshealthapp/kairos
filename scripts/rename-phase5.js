// Phase 5 — genericize HVC chat files (knowledge.js + route.js).
// Same approach as prior phases: longest/most-specific strings first.
// Critical ordering rules:
//   1. "Brandon Lamberth" → "Brendan Lamberton-Vossi" BEFORE any bare-Brandon handling.
//      (We never alter bare "Brandon" — it always means Sterne.)
//   2. "Salli Lamberth" before bare "Lamberth".
//   3. Multi-word provider full names before bare last names.

const fs = require("fs");
const path = require("path");

const targets = [
  path.resolve(__dirname, "..", "app", "api", "hvc", "chat", "knowledge.js"),
  path.resolve(__dirname, "..", "app", "api", "hvc", "chat", "route.js"),
];

// Length-descending pairs. Most-specific first.
const pairs = [
  // ---- Phase-5-specific full-name pairs (Lamberth handling first to protect bare "Brandon") ----
  ["Brandon Lamberth, FNP-C", "Brendan Lamberton-Vossi, FNP-C"],
  ["Brandon Lamberth", "Brendan Lamberton-Vossi"],
  ["Salli Lamberth, FNP-C", "Sieglinde Lamberton-Vossi, FNP-C"],
  ["Salli Lamberth", "Sieglinde Lamberton-Vossi"],
  ["Lamberth", "Lamberton-Vossi"],

  // ---- Roland P Hardenkvist family — full forms first to handle ARNP/ANP/RN credentials precisely ----
  ["Steve R. Hardenkvist, ARNP", "Stellan R. Henriksson, ARNP"],
  ["Roland P Hardenkvist, ARNP", "Stellan R Henriksson, ARNP"],
  ["Steven Hardenkvist, ANP-BC", "Stellan Henriksson, ANP-BC"],
  ["Steve R. Hardenkvist", "Stellan R. Henriksson"],
  ["Roland P Hardenkvist", "Stellan R Henriksson"],
  ["Steven Hardenkvist", "Stellan Henriksson"],
  ["Roland P Hardenkvist", "Stellan Henriksson"],
  ['"Mr. Hardenkvist"', '"Mr. Henriksson"'],
  ['"Dr. Hardenkvist"', '"Dr. Henriksson"'],
  ["Mr. Hardenkvist", "Mr. Henriksson"],
  ["Dr. Hardenkvist", "Dr. Henriksson"],
  ["Hardenkvist", "Henriksson"],

  // ---- HVC providers (multi-word first) ----
  ["Konstantinos Manolinder", "Konstantinos Manolinder"],
  ["Dr. Manolinder", "Dr. Manolinder"],
  ["Manolinder", "Manolinder"],
  ["Konstantinos", "Aristarchos"],

  ["Curtis Holvenmark", "Curtis Holvenmark"],
  ["Dr. Holvenmark", "Dr. Holvenmark"],
  ["Holvenmark", "Holvenmark"],
  ["Curtis", "Kerensa"],

  ["Rashid Vorhelden", "Rashid Sokolov"],
  ["Dr. Vorhelden", "Dr. Sokolov"],
  ["Vorhelden", "Sokolov"],
  ["Rashid", "Rashid"],

  ["Rebecca Fryer, DO", "Renske Eldenfaer, DO"],
  ["Rebecca Fryer", "Renske Eldenfaer"],
  ["Sydney Fryer, FNP-C", "Sorenza Eldenfaer, FNP-C"],
  ["Sydney Fryer", "Sorenza Eldenfaer"],
  ["Sydney Baiter", "Sorenza Kelterling"],
  ["Dr. Fryer", "Dr. Eldenfaer"],
  ["Fryer", "Eldenfaer"],
  ["Baiter", "Kelterling"],
  ["Rebecca", "Renske"],

  ["Carter Espelheim, MD", "Mateus Espinosa, MD"],
  ["Carter Espelheim", "Mateus Espinosa"],
  ["Dr. Espelheim", "Dr. Espinosa"],
  ["Espelheim", "Espinosa"],
  ["Matthew", "Mateus"],

  ["Abby Blanc, FNP-C", "Astrid Marsbridge, FNP-C"],
  ["Abby Blanc", "Astrid Marsbridge"],
  ["Blanc", "Marsbridge"],
  ["Abby", "Astrid"],

  ["Saskia Magnusen", "Ariadne Magnusen"],
  ["Dr. Martin", "Dr. Magnusen"],
  ["Martin", "Magnusen"],
  ["Ariella", "Ariadne"],

  ["Barbie Fulton", "Bryndis Fjeldstad"],
  ["Fulton", "Fjeldstad"],
  ["Barbie", "Bryndis"],

  ["Sandra Headrick", "Saoirse Halvorsen"],
  ["Headrick", "Halvorsen"],
  ["Sandra", "Saoirse"],

  ["Miriam Brawley", "Mirthe Bjornholm"],
  ["Brawley", "Bjornholm"],
  ["Miriam", "Mirthe"],

  ["Tiffany Bland", "Tahirah Bonham-Vatu"],
  ["Bland", "Bonham-Vatu"],
  ["Tiffany", "Tahirah"],

  ["Rachelle Gorrell", "Roxana Goransson"],
  ["Gorrell", "Goransson"],
  ["Rachelle", "Roxana"],

  ["Jennifer O'Malley", "Jensine Onyemachi"],
  ["O'Malley", "Onyemachi"],
  ["Jennifer", "Jensine"],

  ["Chris Durbin", "Cassiano Damaskenos"],
  ["Durbin", "Damaskenos"],
  ["Chris", "Cassiano"],

  ["Megan McBride", "Maelis Mironenko"],
  ["McBride", "Mironenko"],
  ["Megan", "Maelis"],

  ["Adler Halverthorne", "Jorund Pilastros"],
  ["Halverthorne", "Pilastros"],
  ["Jordan", "Jorund"],

  ["Aaron Pendrelle", "Bertrand-Olu Bjorklund"],
  ["Dr. Pendrelle", "Dr. Bjorklund"],
  ["Pendrelle", "Bjorklund"],
  ["Bryan", "Bertrand-Olu"],

  // Joel Leon Becerril → Joaquim Leander Bartolomeu (3-token name)
  ["Joel Leon Becerril, MD", "Joaquim Leander Bartolomeu, MD"],
  ["Joel Leon Becerril", "Joaquim Leander Bartolomeu"],
  ["Becerril", "Bartolomeu"],
  ["Joel", "Joaquim"],

  // Alan Heincker → Aniol Hellesund (DO)
  ["Alan Heincker, DO", "Aniol Hellesund, DO"],
  ["Alan Heincker", "Aniol Hellesund"],
  ["Heincker", "Hellesund"],
  // NOTE: bare "Alan" — there is also a "Dr. Alan Zajarias" reference (line 1090) — that's
  // an outside provider already mapped via Phase 4 ("Zajarias" → "Zakharchenko").
  // Don't map bare "Alan" generically here — handle the two specific occurrences explicitly.
  ["Dr. Alan Zajarias", "Dr. Aniol Zakharchenko"],
  ["Alan Zajarias", "Aniol Zakharchenko"],
  // Now any remaining bare "Alan" (e.g. mid-prose) maps to Aniol.
  ["Alan", "Aniol"],

  // Andrea Phinney → Anouk Pernille
  ["Andrea Phinney, MD", "Anouk Pernille, MD"],
  ["Andrea Phinney", "Anouk Pernille"],
  ["Phinney", "Pernille"],
  ["Andrea", "Anouk"],

  // Michael Potter → Mikolas Pavlenko
  ["Michael Potter, MD", "Mikolas Pavlenko, MD"],
  ["Michael Potter", "Mikolas Pavlenko"],
  // "Michael Ryan Reidy, MD" (line 1153) — preserve full-name structure. Reidy was Phase-4-mapped
  // to Reinholdt; "Ryan" is a middle name not previously seen. Map it explicitly.
  ["Michael Ryan Reidy, MD", "Mikolas Ryne Reinholdt, MD"],
  ["Michael Ryan Reidy", "Mikolas Ryne Reinholdt"],
  ["Potter", "Pavlenko"],
  ["Reidy", "Reinholdt"],
  ["Michael", "Mikolas"],

  // Sylvester Youlo → Sylvain Yarrowsmith
  ["Sylvester Youlo, MD", "Sylvain Yarrowsmith, MD"],
  ["Sylvester Youlo", "Sylvain Yarrowsmith"],
  ["Youlo", "Yarrowsmith"],
  ["Sylvester", "Sylvain"],

  // Brett Clayton → Bjorn Caelum
  ["Brett Clayton, PA-C", "Bjorn Caelum, PA-C"],
  ["Brett Clayton", "Bjorn Caelum"],
  ["Clayton", "Caelum"],
  ["Brett", "Bjorn"],

  // Sherry Lynn Phippen → Sigrun Lyrika Orveldon (3-token)
  ["Dr. Sherry Lynn Phippen", "Dr. Sigrun Lyrika Orveldon"],
  ["Sherry Lynn Phippen", "Sigrun Lyrika Orveldon"],
  ["Phippen", "Orveldon"],
  ["Sherry Lynn", "Sigrun Lyrika"],
  ["Sherry", "Sigrun"],
  // "Lynn" alone — only appears inside "Sherry Lynn Phippen", which we've already replaced.
  // No standalone "Lynn" remains; no need to add a bare-Lynn pair.

  // Steven Fern → Stellan-Marek Pithenford (different from Roland P Hardenkvist's Stellan)
  ["Dr. Steven Fern, DO", "Dr. Stellan-Marek Pithenford, DO"],
  ["Steven Fern, DO", "Stellan-Marek Pithenford, DO"],
  ["Steven Fern", "Stellan-Marek Pithenford"],
  ["Fern", "Pithenford"],
  // Bare "Steven" was already consumed by "Steven Hardenkvist, ANP-BC" earlier.
  // Any remaining "Steven" → "Stelios" per spec (e.g. distant reference).
  ["Steven", "Stelios"],

  // Victor Strathorne → Vasco Dimopoulos (Strathorne already in Phase 1 mapping)
  ["Dr. Victor Strathorne", "Dr. Vasco Dimopoulos"],
  ["Victor Strathorne", "Vasco Dimopoulos"],
  ["Strathorne", "Dimopoulos"],
  ["Victor", "Vasco"],

  // Standalone first names from prior phases / additional support staff
  ["Melissa", "Melisande"],
  // "Sydney" alone — line 945 is "Sydney ext 8011" referring to Sydney Baiter.
  ["Sydney", "Sorenza"],

  // ---- Cross-phase consistency (already-mapped providers/admins) ----
  ["Beckweldon NP, Heart and Vascular Clinic", "Voronova NP, Heart and Vascular Clinic"],
  ["Dr. Beckweldon", "Dr. Voronova"],
  ["Beckweldon NP", "Voronova NP"],
  ["Beckweldon", "Voronova"],

  ["Dr. Skarsdale", "Dr. Halloran"],
  ["Skarsdale", "Halloran"],

  ["Beckforth, Adler J, FNP-BC", "Mwangi, Atticus J, FNP-BC"],
  ["Beckforth, Adler", "Mwangi, Atticus"],
  ["Adler J Beckforth", "Atticus J Mwangi"],
  ["Adler Beckforth", "Atticus Mwangi"],
  ["Dr. Beckforth", "Dr. Mwangi"],
  ["Beckforth", "Mwangi"],

  ["Dr. Falkenrath", "Dr. Bjornsen"],
  ["Felicity Falkenrath", "Fenella Bjornsen"],
  ["Falkenrath", "Bjornsen"],

  ["Dr. Brennelmark", "Dr. Aoki"],
  ["Brennelmark", "Aoki"],

  ["Dr. Tregarthen", "Dr. Onwuachi"],
  ["Tregarthen", "Onwuachi"],

  ["Dr. Vellacott", "Dr. Inwarden-Linder"],
  ["Vellacott", "Inwarden-Linder"],

  ["Dr. Birchington", "Dr. Yagami"],
  ["Birchington", "Yagami"],

  // Cross-phase: Carwelden (Phase-4 STAFF_NAMES mapping)
  ["Carwelden", "Henningsen"],

  // Admin / family (already mapped Phase 1)
  ["Trisha Bertrand", "Trinity Sigurdsson"],
  ["Adelaide Westkander", "Aldonza Naranjo"],
  ["Phoebe Larkspur", "Pomona Kishimoto"],
  ["Jessica Pelc", "Jovita Vasilenko"],
  ["Genevieve Brindlewain", "Gisela Westergaard"],
  ["Marielle Tannenbaum", "Mireia Kovacs"],
  ["Tamara Joy Aldington", "Talvikki Tunturi"],
  // "Anita" alone (admin) → Ainara
  // (handled by word-boundary pass below)
];

// Word-boundary regex pass for bare-last-name patient references (Phase 1 mapping)
const wordBoundaryPairs = [
  [/\bAnita\b/g, "Ainara"],
  [/\bAldington\b/g, "Tunturi"],
  [/\bBesemer\b/g, "Okonkwo-Vrieling"],
  [/\bBrexley\b/g, "Yamashiro"],
  [/\bHesperdale\b/g, "Petrosyan"],
  [/\bCrider\b/g, "Demirci"],
  [/\bCzeschin\b/g, "Faroldi"],
  [/\bWendelfaer\b/g, "Lindqvist"],
  [/\bEsselbach\b/g, "Nascimento"],
  [/\bFrazier\b/g, "Quiñones"],
  [/\bHalbrook\b/g, "Karpinski"],
  [/\bHalverson\b/g, "Volkov"],
  [/\bLockner\b/g, "Rasmussen"],
  [/\bKvalheim\b/g, "Iwasaki"],
  [/\bMaundrell\b/g, "Solberg"],
  [/\bNorreys\b/g, "Fitzgerald-Ramos"],
  [/\bQuennell\b/g, "Skarsgård"],
  [/\bRavensdale\b/g, "Höglund"],
  [/\bSellman\b/g, "Bellomo"],
  [/\bQuelthorne\b/g, "Yamashita"],
  [/\bHeldenmark\b/g, "Drozdov"],
  [/\bUnderwell\b/g, "Klausen"],
  [/\bLarvendel\b/g, "Adesanya"],
  [/\bVrabel\b/g, "Hadjipateras"],
  [/\bWexbury\b/g, "Tikhonova"],
  [/\bWood\b/g, "Hartvigsen"],
];

let totalReplacements = 0;
const perFile = {};

for (const target of targets) {
  const fname = path.basename(target);
  let content = fs.readFileSync(target, "utf8");
  const original = content;
  let count = 0;

  for (const [from, to] of pairs) {
    if (content.includes(from)) {
      const occ = content.split(from).length - 1;
      content = content.split(from).join(to);
      count += occ;
    }
  }
  for (const [re, to] of wordBoundaryPairs) {
    const matches = content.match(re);
    if (matches) {
      count += matches.length;
      content = content.replace(re, to);
    }
  }

  if (content !== original) {
    fs.writeFileSync(target, content, "utf8");
  }
  totalReplacements += count;
  perFile[fname] = count;
}

console.log(JSON.stringify({ totalReplacements, perFile }, null, 2));
