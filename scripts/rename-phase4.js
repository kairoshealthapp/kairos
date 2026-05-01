// Phase 4 — genericize STAFF_NAMES allowlist in lib/hvc/phiGuard.js
// Reads the existing Set, applies explicit mappings + invented fictional replacements,
// then writes back as an alphabetized deduped block (lines 10..50).

const fs = require("fs");
const path = require("path");

const target = path.resolve(__dirname, "..", "lib", "hvc", "phiGuard.js");
const original = fs.readFileSync(target, "utf8");
const lines = original.split(/\r?\n/);
const eol = original.includes("\r\n") ? "\r\n" : "\n";

// --- Step 1: extract every quoted token between line 10 ("const STAFF_NAMES") and the closing line ");"
// Grab the original block text.
const startIdx = lines.findIndex((l) => l.includes("const STAFF_NAMES = new Set([")); // 0-based
if (startIdx < 0) throw new Error("Could not find STAFF_NAMES start");
let endIdx = -1;
for (let i = startIdx + 1; i < lines.length; i++) {
  if (lines[i].trim().startsWith("]);")) { endIdx = i; break; }
}
if (endIdx < 0) throw new Error("Could not find STAFF_NAMES end");

const blockText = lines.slice(startIdx, endIdx + 1).join("\n");

// Match either 'Single' or "Double" quoted tokens (handles O'Malley which is in double quotes).
const tokenRegex = /"([^"]+)"|'([^']+)'/g;
const tokens = [];
let m;
while ((m = tokenRegex.exec(blockText)) !== null) {
  tokens.push(m[1] !== undefined ? m[1] : m[2]);
}

// First token is the boilerplate "const STAFF_NAMES = new Set([" — but that has no quotes, so tokens[]
// only contains entry strings. Confirm.

// Dedupe original list (preserve first occurrence order for diagnostics).
const seen = new Set();
const original_unique = [];
for (const t of tokens) {
  if (!seen.has(t)) {
    seen.add(t);
    original_unique.push(t);
  }
}

// --- Step 2: explicit mapping table (deterministic). Keys are original names; values are replacements.
const mapping = {
  // ---- Preserved verbatim (real demo persona / already-mapped) ----
  "Brandon": "Brandon",
  "Sterne": "Sterne",
  "Anita": "Ainara",

  // ---- Already mapped in prior phases (providers / first names) ----
  "Marchetti": "Halloran",
  "Townsend": "Mwangi",
  "Loxley": "Voronova",
  "Ashbrook": "Bjornsen",
  "Hawkins": "Aoki",
  "Tregarthen": "Onwuachi",
  "Vellacott": "Petrov-Linder",
  "Birchington": "Yagami",
  "Roland": "Yelena",
  "Felicity": "Fenella",
  "Adler": "Atticus",

  // ---- Explicit deterministic mappings from Phase 4 spec ----
  "Ballard": "Henriksson",
  "Virk": "Sokolov",
  "Hurley": "Espinosa",
  "Phillips": "Dimopoulos",
  "Steve": "Stellan",
  "Steven": "Stellan",
  "Fawad": "Fawzi",
  "Matthew": "Mateus",
  "Stilianos": "Aristarchos",
  "Efstratiadis": "Vassilakos",
  "Morrison": "Engelbrecht",
  "Curtis": "Kerensa",
  "Davis": "Bjorklund",
  "Bryan": "Bertrand-Olu",
  "Jenkins": "Henningsen",
  "Martin": "Magnusen",
  "Ariella": "Ariadne",
  "Priest": "Pilastros",
  "Jordan": "Jorund",
  "Fryer": "Lieberberg",
  "Rebecca": "Renske",
  "Sydney": "Soraya",
  "Blanc": "Brouwer",
  "Abby": "Astrid",
  "Headrick": "Halvorsen",
  "Sandra": "Saoirse",
  "Brawley": "Bjornholm",
  "Miriam": "Mirthe",
  "Fulton": "Fjeldstad",
  "Barbie": "Bryndis",
  "Bland": "Bonham-Vatu",
  "Tiffany": "Tahirah",
  "Gorrell": "Goransson",
  "Rachelle": "Roxana",
  "O'Malley": "Onyemachi",
  "Jennifer": "Jensine",
  "Durbin": "Damaskenos",
  "Chris": "Cassiano",
  "McBride": "Mironenko",
  "Megan": "Maelis",

  // ---- Invented fictional replacements for ALL OTHER entries ----
  // International style (Slavic/Nordic/Greek/Lusophone/Filipino/Igbo/Yoruba/Persian/Polish/Basque/Catalan).
  // Each unique. Approximate phonetic feel of the original where possible to keep the allowlist
  // performant for similar-cardinality lookups (no impact on logic).

  "Abebe": "Ademola",
  "Abraman": "Akselsson",
  "Alan": "Aniol",
  "Alec": "Aleixo",
  "Aleto": "Alvedo",
  "Ali": "Anvar",
  "Allen": "Annwyl",
  "Allison": "Aletheia",
  "Almasalmeh": "Alkhatib-Vargas",
  "Alvarado": "Avalokita",
  "Amar": "Anand",
  "Ameer": "Arman",
  "Andrea": "Aniela",
  "Andrew": "Anders",
  "Angie": "Anouska",
  "Anooj": "Arnav",
  "April": "Aprilia",
  "Armstrong": "Arsenyev",
  "Arun": "Argyris",
  "Athina": "Aikaterini",
  "Bach": "Belyaev",
  "Baiter": "Borghese",
  "Baker": "Bekele",
  "Barton": "Bartolomeu",
  "Batchu": "Banerjee-Ekene",
  "Bauer": "Babic",
  "Bayless": "Brzezinski",
  "Becerril": "Bedoya",
  "Becky": "Beatrix",
  "Bohdan": "Bogomil",
  "Bourne": "Boroni",
  "Brady": "Branimir",
  "Brett": "Branko",
  "Brian": "Brynjar",
  "Britt": "Branwen",
  "Brittany": "Branka",
  "Buschman": "Burkhardt-Lwin",
  "Candace": "Calantha",
  "Candy": "Catalina",
  "Chafton": "Chmielewski",
  "Chakinala": "Chandrasekhar",
  "Christopher": "Christofor",
  "Clayton": "Clovis",
  "Coble": "Constantakis",
  "Cooper": "Czerny",
  "Coulter": "Costanza",
  "Courtney": "Cosima",
  "Cowell": "Cwiklinski",
  "Craig": "Crisanto",
  "Crawshaw": "Crveni",
  "Crystal": "Cressida",
  "Cuculich": "Czarnecki",
  "Dan": "Davorin",
  "Dana": "Dahlia",
  "David": "Daudi",
  "Derrick": "Drazen",
  "Deveney": "Devereux-Asanti",
  "Donni": "Doroteja",
  "Donny": "Domenico",
  "Elliotte": "Elspeth",
  "Emily": "Eleni",
  "Emmett": "Eskil",
  "Faddis": "Falconieri",
  "Feeler": "Fonseca",
  "Fern": "Faina",
  "Field": "Fjord",
  "Fleener": "Flores-Mihalache",
  "Floyd": "Flavian",
  "Freeman": "Friedrich",
  "French": "Fryderyk",
  "Garner": "Gavrilov",
  "Garrison": "Gunnarsson",
  "Gautam": "Govindan",
  "Gdowski": "Gajewski",
  "Gifford": "Gildardo",
  "Glenn": "Gellert",
  "Harden": "Halmaghi",
  "Harman": "Haroun",
  "Hartog": "Haavisto",
  "Hartupee": "Hatanaka",
  "Heincker": "Hjelmer",
  "Huang": "Hideo",
  "Huckla": "Hrubec",
  "Indrajeet": "Indravan",
  "Jason": "Jaromir",
  "Jasvindar": "Jaswant",
  "Jenny": "Jovanka",
  "Jeremy": "Jeronim",
  "Jinna": "Jovita-Nwosu",
  "Joel": "Jovan",
  "John": "Janusz",
  "Johnson": "Jankowicz",
  "Jonas": "Jorvik",
  "Jose": "Joaquim",
  "Joshua": "Joscelin",
  "Justin": "Jokubas",
  "Kan": "Kaito",
  "Kaneko": "Kanazawa",
  "Kao": "Kuznetsov",
  "Karen": "Kerstin",
  "Karuparthia": "Krishnamurti",
  "Katie": "Katarzyna",
  "Kelsey": "Klemensia",
  "Knetzer": "Konstantin",
  "Knobbe": "Korhonen",
  "Knox": "Kjellberg",
  "Kriete": "Krasimirov",
  "Krishnaswamy": "Krishnamoorthi",
  "Kristen": "Krystyna",
  "Kristin": "Kalindra",
  "Kunkel": "Kuusinen",
  "Lamberth": "Lautaro",
  "Larry": "Lazaros",
  "Lasala": "Latorre",
  "Lebedowicz": "Lubomirska",
  "Lee": "Liang",
  "Leidenfost": "Leitenberger",
  "Leidenfrost": "Leitmannova",
  "Leon": "Lothar",
  "Lisenbe": "Lipinski",
  "Logan": "Lukasz",
  "Luis": "Liutauras",
  "Lynn": "Liljana",
  "Maedgen": "Markovic",
  "Mahata": "Mahapatra",
  "Marc": "Mihai",
  "Marcee": "Marusha",
  "Marina": "Maitane",
  "Mark": "Marcjusz",
  "Masood": "Massoud",
  "Matt": "Matsumoto",
  "Mazzeo": "Mazurek",
  "Mella": "Mendoza-Iliev",
  "Melissa": "Melisande",
  "Michael": "Mikolaj",
  "Michele": "Mikaela",
  "Mitchell": "Mihailov",
  "Moore": "Moravec-Adeyemi",
  "Moravec": "Morgenstern",
  "Moshirzadeh": "Movsisyan",
  "Mueen": "Munir",
  "Muhammad": "Mehdi",
  "Murr": "Mostowicz",
  "Myers": "Maximovsky",
  "Mylhan": "Myrhager",
  "Nasser": "Nezami",
  "Nathan": "Natanael",
  "Nichole": "Nereida",
  "Nikolaos": "Nestoras",
  "Nurelign": "Nyirenda",
  "Oak": "Olufemi",
  "Orizu": "Onuoha",
  "Paige": "Pernille",
  "Pajeau": "Panayiotou",
  "Patel": "Pillai",
  "Patricia": "Petronela",
  "Patrick": "Patryk",
  "Paula": "Pelagia",
  "Pearson": "Pevtsov",
  "Pecos": "Petrov",
  "Peterson": "Pavlenko",
  "Phinney": "Pieniazek",
  "Phippen": "Phillipakos",
  "Potter": "Pomerantsev",
  "Prabhu": "Prashanth",
  "Qamar": "Qadir",
  "Rachel": "Radmila",
  "Ratchford": "Razuvaev",
  "Reidy": "Reinholdt",
  "Reiss": "Romanenko",
  "Richard": "Radoslav",
  "Robert": "Radomir",
  "Ronald": "Ragnar",
  "Rosa": "Rohini",
  "Roshan": "Rostam",
  "Rowden": "Rivkin",
  "Rusten": "Rasmussen-Otieno",
  "Saba": "Salomeya",
  "Sadler": "Saadawi",
  "Salli": "Solveig",
  "Sanchez": "Saavedra",
  "Sara": "Saskia",
  "Sasan": "Sirvan",
  "Schlesinger": "Schlumberger",
  "Schroeder": "Sigurdardottir",
  "Seeck": "Sienkiewicz",
  "Shams": "Shahriar",
  "Shang": "Shimazaki",
  "Shapiro": "Shamsuddin",
  "Shawna": "Shoshana",
  "Sherry": "Severine",
  "Shockley": "Sokoloff",
  "Shruti": "Sruthi",
  "Singh": "Sandhu",
  "Sinha": "Sankaran",
  "Sintek": "Sundberg",
  "Soberano": "Solorzano",
  "Speck": "Spasoyevich",
  "Spencer": "Stoyanov",
  "Stacie": "Sviatlana",
  "Sudhir": "Sumanth",
  "Susan": "Sigourney",
  "Swanson": "Sjoblom",
  "Syed": "Soroush",
  "Sylvester": "Stanislav",
  "Tasha": "Tanyana",
  "Terrance": "Tymoteusz",
  "Terrill": "Tegner",
  "Thompson": "Tomescu",
  "Toebben": "Tholstrup",
  "Tony": "Tadeusz",
  "Trikalinos": "Triantafyllos",
  "Ulrich": "Urbanowicz",
  "Vader": "Vukoslav",
  "Victor": "Vidmantas",
  "Voight": "Vrenne",
  "Vorhies": "Voskresensky",
  "Waterworth": "Wachowicz",
  "Watkins": "Witkowski",
  "Wes": "Wojtek",
  "Wiggins": "Witkoska",
  "William": "Wilhelmus",
  "Wilson": "Wojciechowski",
  "Wiseman": "Wieczorek",
  "Witham": "Wojnar",
  "Yaqoob": "Yusupov",
  "Youlo": "Yuvenaly",
  "Zahoor": "Zafarullah",
  "Zajarias": "Zakharchenko",
  "Zak": "Zenon",
  "Zaman": "Zikomo",
  "Zhu": "Zoltan",
  "Mikayla": "Mireia-Kalei",
  "Larison": "Lefkowicz",
  "Travis": "Tjorven",
  "Duke": "Damir",
  "Saltzman": "Sabatino",
  "Mia": "Maelle",
  "Seelig": "Strzelecki",
  "Missie": "Maeve-Sani",
  "Kim": "Kjeld",
  "Roach": "Rakitin",
  "Samantha": "Suvi",
  "Miller": "Mladenov",
  "Elizabeth": "Eulalia",
  "Oyadomari": "Okumura",
  "Dvorak": "Drobny",
  "Amanda": "Anouk",
  "McEntire": "Mihaylov",
  "Ashley": "Aniela-Soto",
  "Hoener": "Hjorth",
};

// --- Step 3: build new list (apply mapping, dedupe).
const newSet = new Set();
const fromMapping = [];
const invented = [];
const stillUnmapped = [];

for (const t of original_unique) {
  const replacement = mapping[t];
  if (replacement === undefined) {
    stillUnmapped.push(t);
    newSet.add(t); // fall back: keep original (script will fail verification step)
  } else {
    if (replacement === t) {
      // preserved verbatim
      fromMapping.push({ from: t, to: replacement, kind: "preserved" });
    } else if (
      ["Brandon","Sterne","Anita","Marchetti","Townsend","Loxley","Ashbrook","Hawkins",
       "Tregarthen","Vellacott","Birchington","Roland","Felicity","Adler",
       "Ballard","Virk","Hurley","Phillips","Steve","Steven","Fawad","Matthew",
       "Stilianos","Efstratiadis","Morrison","Curtis","Davis","Bryan","Jenkins",
       "Martin","Ariella","Priest","Jordan","Fryer","Rebecca","Sydney","Blanc",
       "Abby","Headrick","Sandra","Brawley","Miriam","Fulton","Barbie","Bland",
       "Tiffany","Gorrell","Rachelle","O'Malley","Jennifer","Durbin","Chris",
       "McBride","Megan"].includes(t)
    ) {
      fromMapping.push({ from: t, to: replacement, kind: "explicit" });
    } else {
      invented.push({ from: t, to: replacement });
    }
    newSet.add(replacement);
  }
}

// Sort alphabetized (case-insensitive, but preserve actual casing).
const finalEntries = [...newSet].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

// --- Step 4: format the new block. 8 entries per line, 2-space indent on continuation lines.
function formatEntry(e) {
  if (e.includes("'")) return `"${e}"`; // double-quote so apostrophes survive
  return `'${e}'`;
}

const perLine = 8;
const indent = "  ";
const linesOut = [];
linesOut.push("const STAFF_NAMES = new Set([");
for (let i = 0; i < finalEntries.length; i += perLine) {
  const chunk = finalEntries.slice(i, i + perLine).map(formatEntry).join(",");
  linesOut.push(indent + chunk + ",");
}
linesOut.push("]);");

// Splice replacement into original lines.
const before = lines.slice(0, startIdx);
const after = lines.slice(endIdx + 1);
const newLines = [...before, ...linesOut, ...after];
const newContent = newLines.join(eol);

fs.writeFileSync(target, newContent, "utf8");

// --- Step 5: report.
const sampleInvented = invented.slice(0, 10).map((x) => `${x.from} → ${x.to}`);
console.log(JSON.stringify({
  originalCount: tokens.length,
  uniqueOriginalCount: original_unique.length,
  finalUniqueCount: finalEntries.length,
  fromExplicitMapping: fromMapping.length,
  inventedCount: invented.length,
  stillUnmappedCount: stillUnmapped.length,
  stillUnmapped,
  sampleInvented,
  preserved: fromMapping.filter((x) => x.kind === "preserved").map((x) => x.from),
}, null, 2));
