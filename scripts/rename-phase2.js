// Phase 2 systematic rename across data/mock-encounters/enc-*.json
// Same approach as Phase 1: longest/most-specific strings first, then word-boundary fallback.

const fs = require("fs");
const path = require("path");

const dir = path.resolve(__dirname, "..", "data", "mock-encounters");
const files = fs.readdirSync(dir).filter((f) => f.startsWith("enc-") && f.endsWith(".json"));

// Replacement pairs: [from, to]. Order matters — apply in this exact sequence.
const pairs = [
  // FAMILY / PROXY (longest first)
  ["Tamara Joy Aldington", "Talvikki Tunturi"],

  // ADMIN / SUPPORT
  ["Trisha Bertrand", "Trinity Sigurdsson"],
  ["Adelaide Westkander", "Aldonza Naranjo"],
  ["Phoebe Larkspur", "Pomona Kishimoto"],
  ["Jessica Pelc", "Jovita Vasilenko"],
  ["Genevieve Brindlewain", "Gisela Westergaard"],
  ["Marielle Tannenbaum", "Mireia Kovacs"],

  // MOCK-ONLY PATIENTS (Phase 2 additions)
  ["Crestwood, Lavinia", "Stojanović, Liviana"],
  ["Lavinia Crestwood", "Liviana Stojanović"],
  ["Mr. Crestwood", "Mr. Stojanović"],
  ["Mr Crestwood", "Mr Stojanović"],
  ["Mrs. Crestwood", "Mrs. Stojanović"],
  ["Mrs Crestwood", "Mrs Stojanović"],
  ["Ms. Crestwood", "Ms. Stojanović"],
  ["Ms Crestwood", "Ms Stojanović"],
  ["Crestwood's", "Stojanović's"],

  ["Marlowe, Theodore", "Vassiliou, Theron"],
  ["Theodore Marlowe", "Theron Vassiliou"],
  ["Mr. Marlowe", "Mr. Vassiliou"],
  ["Mr Marlowe", "Mr Vassiliou"],
  ["Mrs. Marlowe", "Mrs. Vassiliou"],
  ["Mrs Marlowe", "Mrs Vassiliou"],
  ["Ms. Marlowe", "Ms. Vassiliou"],
  ["Ms Marlowe", "Ms Vassiliou"],
  ["Marlowe's", "Vassiliou's"],

  ["Brindelhart, Vesper", "Beaumont-Akiyama, Verity"],
  ["Vesper Brindelhart", "Verity Beaumont-Akiyama"],
  ["Mr. Brindelhart", "Mr. Beaumont-Akiyama"],
  ["Mr Brindelhart", "Mr Beaumont-Akiyama"],
  ["Mrs. Brindelhart", "Mrs. Beaumont-Akiyama"],
  ["Mrs Brindelhart", "Mrs Beaumont-Akiyama"],
  ["Ms. Brindelhart", "Ms. Beaumont-Akiyama"],
  ["Ms Brindelhart", "Ms Beaumont-Akiyama"],
  ["Brindelhart's", "Beaumont-Akiyama's"],

  // PATIENTS — both "LastName, FirstName" and "FirstName LastName" variants
  ["Aldington, Charles", "Tunturi, Aleksanteri"],
  ["Charles Aldington", "Aleksanteri Tunturi"],
  ["Mr. Aldington", "Mr. Tunturi"],
  ["Mr Aldington", "Mr Tunturi"],
  ["Mrs. Aldington", "Mrs. Tunturi"],
  ["Mrs Aldington", "Mrs Tunturi"],
  ["Ms. Aldington", "Ms. Tunturi"],
  ["Ms Aldington", "Ms Tunturi"],
  ["Aldington's", "Tunturi's"],

  ["Besemer, Octavian", "Okonkwo-Vrieling, Octavian"],
  ["Octavian Besemer", "Octavian Okonkwo-Vrieling"],
  ["Mr. Besemer", "Mr. Okonkwo-Vrieling"],
  ["Mr Besemer", "Mr Okonkwo-Vrieling"],
  ["Mrs. Besemer", "Mrs. Okonkwo-Vrieling"],
  ["Mrs Besemer", "Mrs Okonkwo-Vrieling"],
  ["Ms. Besemer", "Ms. Okonkwo-Vrieling"],
  ["Ms Besemer", "Ms Okonkwo-Vrieling"],
  ["Besemer's", "Okonkwo-Vrieling's"],

  ["Brexley, Vivienne", "Yamashiro, Wynne"],
  ["Vivienne Brexley", "Wynne Yamashiro"],
  ["Mr. Brexley", "Mr. Yamashiro"],
  ["Mr Brexley", "Mr Yamashiro"],
  ["Mrs. Brexley", "Mrs. Yamashiro"],
  ["Mrs Brexley", "Mrs Yamashiro"],
  ["Ms. Brexley", "Ms. Yamashiro"],
  ["Ms Brexley", "Ms Yamashiro"],
  ["Brexley's", "Yamashiro's"],

  ["Hesperdale, Lorraine", "Petrosyan, Lorelei"],
  ["Lorraine Hesperdale", "Lorelei Petrosyan"],
  ["Mr. Hesperdale", "Mr. Petrosyan"],
  ["Mr Hesperdale", "Mr Petrosyan"],
  ["Mrs. Hesperdale", "Mrs. Petrosyan"],
  ["Mrs Hesperdale", "Mrs Petrosyan"],
  ["Ms. Hesperdale", "Ms. Petrosyan"],
  ["Ms Hesperdale", "Ms Petrosyan"],
  ["Hesperdale's", "Petrosyan's"],

  ["Crider, Kathy J.", "Demirci, Kallista J."],
  ["Crider, Kathy", "Demirci, Kallista"],
  ["Kathy J. Crider", "Kallista J. Demirci"],
  ["Kathy Crider", "Kallista Demirci"],
  ["Mr. Crider", "Mr. Demirci"],
  ["Mr Crider", "Mr Demirci"],
  ["Mrs. Crider", "Mrs. Demirci"],
  ["Mrs Crider", "Mrs Demirci"],
  ["Ms. Crider", "Ms. Demirci"],
  ["Ms Crider", "Ms Demirci"],
  ["Crider's", "Demirci's"],

  ["Czeschin, Florian", "Faroldi, Faustin"],
  ["Florian Czeschin", "Faustin Faroldi"],
  ["Mr. Czeschin", "Mr. Faroldi"],
  ["Mr Czeschin", "Mr Faroldi"],
  ["Mrs. Czeschin", "Mrs. Faroldi"],
  ["Mrs Czeschin", "Mrs Faroldi"],
  ["Ms. Czeschin", "Ms. Faroldi"],
  ["Ms Czeschin", "Ms Faroldi"],
  ["Czeschin's", "Faroldi's"],

  ["Wendelfaer, Catriona", "Lindqvist, Cassiel"],
  ["Catriona Wendelfaer", "Cassiel Lindqvist"],
  ["Mr. Wendelfaer", "Mr. Lindqvist"],
  ["Mr Wendelfaer", "Mr Lindqvist"],
  ["Mrs. Wendelfaer", "Mrs. Lindqvist"],
  ["Mrs Wendelfaer", "Mrs Lindqvist"],
  ["Ms. Wendelfaer", "Ms. Lindqvist"],
  ["Ms Wendelfaer", "Ms Lindqvist"],
  ["Wendelfaer's", "Lindqvist's"],

  ["Esselbach, Mathilda", "Nascimento, Maja"],
  ["Mathilda Esselbach", "Maja Nascimento"],
  ["Mr. Esselbach", "Mr. Nascimento"],
  ["Mr Esselbach", "Mr Nascimento"],
  ["Mrs. Esselbach", "Mrs. Nascimento"],
  ["Mrs Esselbach", "Mrs Nascimento"],
  ["Ms. Esselbach", "Ms. Nascimento"],
  ["Ms Esselbach", "Ms Nascimento"],
  ["Esselbach's", "Nascimento's"],

  ["Frazier, Maxwell", "Quiñones, Maximus"],
  ["Maxwell Frazier", "Maximus Quiñones"],
  ["Mr. Frazier", "Mr. Quiñones"],
  ["Mr Frazier", "Mr Quiñones"],
  ["Mrs. Frazier", "Mrs. Quiñones"],
  ["Mrs Frazier", "Mrs Quiñones"],
  ["Ms. Frazier", "Ms. Quiñones"],
  ["Ms Frazier", "Ms Quiñones"],
  ["Frazier's", "Quiñones's"],

  ["Halbrook, Theadora", "Karpinski, Thessaly"],
  ["Theadora Halbrook", "Thessaly Karpinski"],
  ["Mr. Halbrook", "Mr. Karpinski"],
  ["Mr Halbrook", "Mr Karpinski"],
  ["Mrs. Halbrook", "Mrs. Karpinski"],
  ["Mrs Halbrook", "Mrs Karpinski"],
  ["Ms. Halbrook", "Ms. Karpinski"],
  ["Ms Halbrook", "Ms Karpinski"],
  ["Halbrook's", "Karpinski's"],

  ["Halverson, Walter", "Volkov, Wendelin"],
  ["Walter Halverson", "Wendelin Volkov"],
  ["Mr. Halverson", "Mr. Volkov"],
  ["Mr Halverson", "Mr Volkov"],
  ["Mrs. Halverson", "Mrs. Volkov"],
  ["Mrs Halverson", "Mrs Volkov"],
  ["Ms. Halverson", "Ms. Volkov"],
  ["Ms Halverson", "Ms Volkov"],
  ["Halverson's", "Volkov's"],

  ["Lockner, Terri", "Rasmussen, Tessandra"],
  ["Terri Lockner", "Tessandra Rasmussen"],
  ["Mr. Lockner", "Mr. Rasmussen"],
  ["Mr Lockner", "Mr Rasmussen"],
  ["Mrs. Lockner", "Mrs. Rasmussen"],
  ["Mrs Lockner", "Mrs Rasmussen"],
  ["Ms. Lockner", "Ms. Rasmussen"],
  ["Ms Lockner", "Ms Rasmussen"],
  ["Lockner's", "Rasmussen's"],

  ["Kvalheim, Augustus", "Iwasaki, Auberon"],
  ["Augustus Kvalheim", "Auberon Iwasaki"],
  ["Mr. Kvalheim", "Mr. Iwasaki"],
  ["Mr Kvalheim", "Mr Iwasaki"],
  ["Mrs. Kvalheim", "Mrs. Iwasaki"],
  ["Mrs Kvalheim", "Mrs Iwasaki"],
  ["Ms. Kvalheim", "Ms. Iwasaki"],
  ["Ms Kvalheim", "Ms Iwasaki"],
  ["Kvalheim's", "Iwasaki's"],

  ["Maundrell, Reginald", "Solberg, Roderic"],
  ["Reginald Maundrell", "Roderic Solberg"],
  ["Mr. Maundrell", "Mr. Solberg"],
  ["Mr Maundrell", "Mr Solberg"],
  ["Mrs. Maundrell", "Mrs. Solberg"],
  ["Mrs Maundrell", "Mrs Solberg"],
  ["Ms. Maundrell", "Ms. Solberg"],
  ["Ms Maundrell", "Ms Solberg"],
  ["Maundrell's", "Solberg's"],

  ["Norreys, Wendell", "Fitzgerald-Ramos, Winslow"],
  ["Wendell Norreys", "Winslow Fitzgerald-Ramos"],
  ["Mr. Norreys", "Mr. Fitzgerald-Ramos"],
  ["Mr Norreys", "Mr Fitzgerald-Ramos"],
  ["Mrs. Norreys", "Mrs. Fitzgerald-Ramos"],
  ["Mrs Norreys", "Mrs Fitzgerald-Ramos"],
  ["Ms. Norreys", "Ms. Fitzgerald-Ramos"],
  ["Ms Norreys", "Ms Fitzgerald-Ramos"],
  ["Norreys's", "Fitzgerald-Ramos's"],

  ["Strathorne, Calliope", "Dimopoulos, Calantha"],
  ["Calliope Strathorne", "Calantha Dimopoulos"],
  ["Mr. Strathorne", "Mr. Dimopoulos"],
  ["Mr Strathorne", "Mr Dimopoulos"],
  ["Mrs. Strathorne", "Mrs. Dimopoulos"],
  ["Mrs Strathorne", "Mrs Dimopoulos"],
  ["Ms. Strathorne", "Ms. Dimopoulos"],
  ["Ms Strathorne", "Ms Dimopoulos"],
  ["Strathorne's", "Dimopoulos's"],

  ["Quennell, Cordelia", "Skarsgård, Coralie"],
  ["Cordelia Quennell", "Coralie Skarsgård"],
  ["Mr. Quennell", "Mr. Skarsgård"],
  ["Mr Quennell", "Mr Skarsgård"],
  ["Mrs. Quennell", "Mrs. Skarsgård"],
  ["Mrs Quennell", "Mrs Skarsgård"],
  ["Ms. Quennell", "Ms. Skarsgård"],
  ["Ms Quennell", "Ms Skarsgård"],
  ["Quennell's", "Skarsgård's"],

  ["Ravensdale, Cosmo", "Höglund, Cyriac"],
  ["Cosmo Ravensdale", "Cyriac Höglund"],
  ["Mr. Ravensdale", "Mr. Höglund"],
  ["Mr Ravensdale", "Mr Höglund"],
  ["Mrs. Ravensdale", "Mrs. Höglund"],
  ["Mrs Ravensdale", "Mrs Höglund"],
  ["Ms. Ravensdale", "Ms. Höglund"],
  ["Ms Ravensdale", "Ms Höglund"],
  ["Ravensdale's", "Höglund's"],

  ["Sellman, Cosmo", "Bellomo, Caspian"],
  ["Cosmo Sellman", "Caspian Bellomo"],
  ["Mr. Sellman", "Mr. Bellomo"],
  ["Mr Sellman", "Mr Bellomo"],
  ["Mrs. Sellman", "Mrs. Bellomo"],
  ["Mrs Sellman", "Mrs Bellomo"],
  ["Ms. Sellman", "Ms. Bellomo"],
  ["Ms Sellman", "Ms Bellomo"],
  ["Sellman's", "Bellomo's"],

  ["Quelthorne, Hilarion", "Yamashita, Hippolyte"],
  ["Hilarion Quelthorne", "Hippolyte Yamashita"],
  ["Mr. Quelthorne", "Mr. Yamashita"],
  ["Mr Quelthorne", "Mr Yamashita"],
  ["Mrs. Quelthorne", "Mrs. Yamashita"],
  ["Mrs Quelthorne", "Mrs Yamashita"],
  ["Ms. Quelthorne", "Ms. Yamashita"],
  ["Ms Quelthorne", "Ms Yamashita"],
  ["Quelthorne's", "Yamashita's"],

  ["Heldenmark, Wendell", "Drozdov, Werner"],
  ["Wendell Heldenmark", "Werner Drozdov"],
  ["Mr. Heldenmark", "Mr. Drozdov"],
  ["Mr Heldenmark", "Mr Drozdov"],
  ["Mrs. Heldenmark", "Mrs. Drozdov"],
  ["Mrs Heldenmark", "Mrs Drozdov"],
  ["Ms. Heldenmark", "Ms. Drozdov"],
  ["Ms Heldenmark", "Ms Drozdov"],
  ["Heldenmark's", "Drozdov's"],

  ["Underwell, Eleanora", "Klausen, Esperanza"],
  ["Eleanora Underwell", "Esperanza Klausen"],
  ["Mr. Underwell", "Mr. Klausen"],
  ["Mr Underwell", "Mr Klausen"],
  ["Mrs. Underwell", "Mrs. Klausen"],
  ["Mrs Underwell", "Mrs Klausen"],
  ["Ms. Underwell", "Ms. Klausen"],
  ["Ms Underwell", "Ms Klausen"],
  ["Underwell's", "Klausen's"],

  ["Larvendel, Carol N", "Adesanya, Coralina N"],
  ["Larvendel, Carol", "Adesanya, Coralina"],
  ["Carol N Larvendel", "Coralina N Adesanya"],
  ["Carol Larvendel", "Coralina Adesanya"],
  ["Mr. Larvendel", "Mr. Adesanya"],
  ["Mr Larvendel", "Mr Adesanya"],
  ["Mrs. Larvendel", "Mrs. Adesanya"],
  ["Mrs Larvendel", "Mrs Adesanya"],
  ["Ms. Larvendel", "Ms. Adesanya"],
  ["Ms Larvendel", "Ms Adesanya"],
  ["Larvendel's", "Adesanya's"],

  ["Vrabel, Octavia", "Hadjipateras, Olympia"],
  ["Octavia Vrabel", "Olympia Hadjipateras"],
  ["Mr. Vrabel", "Mr. Hadjipateras"],
  ["Mr Vrabel", "Mr Hadjipateras"],
  ["Mrs. Vrabel", "Mrs. Hadjipateras"],
  ["Mrs Vrabel", "Mrs Hadjipateras"],
  ["Ms. Vrabel", "Ms. Hadjipateras"],
  ["Ms Vrabel", "Ms Hadjipateras"],
  ["Vrabel's", "Hadjipateras's"],

  ["Wexbury, Henrietta", "Tikhonova, Hesper"],
  ["Henrietta Wexbury", "Hesper Tikhonova"],
  ["Mr. Wexbury", "Mr. Tikhonova"],
  ["Mr Wexbury", "Mr Tikhonova"],
  ["Mrs. Wexbury", "Mrs. Tikhonova"],
  ["Mrs Wexbury", "Mrs Tikhonova"],
  ["Ms. Wexbury", "Ms. Tikhonova"],
  ["Ms Wexbury", "Ms Tikhonova"],
  ["Wexbury's", "Tikhonova's"],

  ["Wood, Adelina", "Hartvigsen, Anouk"],
  ["Adelina Wood", "Anouk Hartvigsen"],
  ["Mr. Wood", "Mr. Hartvigsen"],
  ["Mr Wood", "Mr Hartvigsen"],
  ["Mrs. Wood", "Mrs. Hartvigsen"],
  ["Mrs Wood", "Mrs Hartvigsen"],
  ["Ms. Wood", "Ms. Hartvigsen"],
  ["Ms Wood", "Ms Hartvigsen"],
  ["Wood's", "Hartvigsen's"],

  // PROVIDERS — multi-token forms first
  ["Espelheim, Matthew, MD", "Espinosa, Mateus, MD"],
  ["Espelheim, Matthew", "Espinosa, Mateus"],
  ["Carter Espelheim, MD", "Mateus Espinosa, MD"],
  ["Carter Espelheim", "Mateus Espinosa"],
  ["Dr. Espelheim", "Dr. Espinosa"],
  ["Espelheim", "Espinosa"],

  ["Beckforth, Adler J, FNP-BC", "Mwangi, Atticus J, FNP-BC"],
  ["Beckforth, Adler J", "Mwangi, Atticus J"],
  ["Beckforth, Adler", "Mwangi, Atticus"],
  ["Adler J Beckforth", "Atticus J Mwangi"],
  ["Adler Beckforth", "Atticus Mwangi"],
  ["Dr. Beckforth", "Dr. Mwangi"],
  ["Beckforth", "Mwangi"],

  ["Vorhelden, Rashid H, MD", "Sokolov, Rashid H, MD"],
  ["Vorhelden, Rashid H", "Sokolov, Rashid H"],
  ["Vorhelden, Rashid", "Sokolov, Rashid"],
  ["Rashid H Vorhelden", "Rashid H Sokolov"],
  ["Rashid Vorhelden", "Rashid Sokolov"],
  ["Dr. Vorhelden", "Dr. Sokolov"],
  ["Vorhelden", "Sokolov"],

  ["Falkenrath, Felicity, MD", "Bjornsen, Fenella, MD"],
  ["Falkenrath, Felicity", "Bjornsen, Fenella"],
  ["Felicity Falkenrath", "Fenella Bjornsen"],
  ["Dr. Falkenrath", "Dr. Bjornsen"],
  ["Falkenrath", "Bjornsen"],

  ["Hardenkvist, Steven", "Henriksson, Stellan"],
  ["Hardenkvist, Steve R", "Henriksson, Stellan R"],
  ["Hardenkvist, Steve", "Henriksson, Stellan"],
  ["Steven Hardenkvist", "Stellan Henriksson"],
  ["Roland P Hardenkvist", "Stellan R Henriksson"],
  ["Roland P Hardenkvist", "Stellan Henriksson"],
  ["Dr. Hardenkvist", "Dr. Henriksson"],
  ["Hardenkvist", "Henriksson"],

  // Beckweldon → Voronova
  ["Roland P Beckweldon", "Roland P Voronova"],
  ["Beckweldon NP, Heart and Vascular Clinic", "Voronova NP, Heart and Vascular Clinic"],
  ["Beckweldon NP", "Voronova NP"],
  ["Beckweldon, Cardiology", "Voronova, Cardiology"],
  ["Dr. Beckweldon", "Dr. Voronova"],
  ["Beckweldon", "Voronova"],

  // Skarsdale → Halloran
  ["Dr. Skarsdale", "Dr. Halloran"],
  ["Skarsdale", "Halloran"],
  ["Dr. M ", "Dr. H "],
  ["Dr. M\\n", "Dr. H\\n"],
  ["Dr. M,", "Dr. H,"],
  ["Dr. M.", "Dr. H."],

  ["Dr. Tregarthen", "Dr. Onwuachi"],
  ["Tregarthen", "Onwuachi"],

  ["Dr. Vellacott", "Dr. Inwarden-Linder"],
  ["Vellacott", "Inwarden-Linder"],

  ["Dr. Birchington", "Dr. Yagami"],
  ["Birchington", "Yagami"],
];

// Word-boundary regex pass for bare last names in body text.
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
  [/\bStrathorne\b/g, "Dimopoulos"],
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
  // Mock-only patient bare last names
  [/\bCrestwood\b/g, "Stojanović"],
  [/\bMarlowe\b/g, "Vassiliou"],
  [/\bHolcombe\b/g, "Beaumont-Akiyama"],
];

let totalFiles = 0;
let totalReplacements = 0;
const fileChanges = {};

for (const fname of files) {
  const fpath = path.join(dir, fname);
  let content = fs.readFileSync(fpath, "utf8");
  const original = content;
  let count = 0;

  for (const [from, to] of pairs) {
    if (content.includes(from)) {
      const occurrences = content.split(from).length - 1;
      content = content.split(from).join(to);
      count += occurrences;
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
    fs.writeFileSync(fpath, content, "utf8");
    totalFiles++;
    totalReplacements += count;
    fileChanges[fname] = count;
  }
}

console.log(JSON.stringify({ totalFiles, totalReplacements, fileChanges }, null, 2));
