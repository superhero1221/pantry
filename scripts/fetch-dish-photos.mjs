#!/usr/bin/env node
/**
 * Find a real photograph for every dish that only has a drawing.
 *
 * The original fourteen dishes have photographs from Wikimedia Commons,
 * credited by photographer in public/pix/manifest.json. The rest were given
 * generated tiles because there was no honest way to invent a photograph. This
 * script closes that gap the same way the first fourteen were done: it asks
 * Wikipedia for the dish's own article, takes the lead image, checks that the
 * licence actually permits reuse, and records who took it.
 *
 *   node scripts/fetch-dish-photos.mjs            # fetch everything missing
 *   node scripts/fetch-dish-photos.mjs --dry      # report, download nothing
 *   node scripts/fetch-dish-photos.mjs --only=moussaka,paella_mixta
 *   node scripts/fetch-dish-photos.mjs --limit=20
 *
 * IT NEEDS NETWORK ACCESS TO WIKIMEDIA, and nothing else — no image library,
 * no headless browser, just Node. That is deliberate: it means the same script
 * runs on a laptop, on a CI runner, or in .github/workflows/dish-photos.yml,
 * which is how it gets run when the machine you are sitting at cannot reach
 * Wikimedia. The sandbox this was written in allows only npm and GitHub, so it
 * has never been run against the live API from there.
 *
 * It is safe to re-run. Anything already photographed is skipped, so an
 * interrupted run costs nothing but the requests it already made.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { RECIPES } from '../src/data/cookbook.js';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const limit = Number((args.find((a) => a.startsWith('--limit=')) || '').slice(8)) || Infinity;

const WIKI = 'https://en.wikipedia.org/w/api.php';
const UA = 'PantryCookbook/1.0 (https://pantryglobe.com; recipe photo attribution)';

/**
 * Licences we may actually use.
 *
 * Everything here allows commercial reuse with attribution, which is what a
 * live site needs. Anything else — fair use, non-commercial, "permission
 * granted for Wikipedia only" — is refused, and the dish keeps its drawing.
 * A missing photograph costs nothing; an improperly licensed one is somebody
 * else's work taken without the terms they set.
 */
const FREE = /^(cc0|cc[- ]by([- ]sa)?([- ]\d(\.\d)?)?|public domain|pd([- ]|$)|no restrictions|attribution)/i;

/**
 * Checked before FREE, and it has to be.
 *
 * "CC BY-NC 3.0" starts with "CC BY", and the allow-list above is anchored
 * only at the start — so on its own it accepts the one clause that forbids
 * exactly what this site does. NC is non-commercial and ND forbids the resize
 * this script performs. Both are refusals, and finding that out from a
 * takedown notice would be an expensive way to learn it.
 */
const RESTRICTED = /\b(nc|nd|non[- ]?commercial|noderiv\w*|share[- ]?alike only|fair use|non[- ]free)\b/i;

const usable = (licence) => Boolean(licence) && !RESTRICTED.test(licence) && FREE.test(licence);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${WIKI}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} for ${params.titles ?? params.srsearch}`);
  return res.json();
}


/**
 * The Wikipedia article each dish actually lives at.
 *
 * Searching for the dish name finds the wrong page more often than you would
 * hope: "Red Lentil Kofte" is filed under "Mercimek köftesi", "Groundnut Stew"
 * under "Maafe", and a search for "Fish Pie" will happily return something
 * that is neither. Pinning the title is the difference between a hundred and
 * thirty-nine correct photographs and a hundred and thirty-nine plausible
 * ones. Anything not listed here falls back to searching.
 */
const ARTICLE = {
  "ragu_bolognese": "Bolognese sauce",
  "cacio_e_pepe": "Cacio e pepe",
  "risotto_milanese": "Risotto alla milanese",
  "spaghetti_puttanesca": "Pasta alla puttanesca",
  "parmigiana_melanzane": "Parmigiana",
  "minestrone": "Minestrone",
  "chicken_saltimbocca": "Saltimbocca",
  "panzanella": "Panzanella",
  "pasta_e_fagioli": "Pasta e fagioli",
  "chana_masala": "Chana masala",
  "rajma_masala": "Rajma",
  "palak_paneer": "Palak paneer",
  "chicken_karahi": "Karahi",
  "keema_matar": "Keema",
  "aloo_gobi": "Aloo gobi",
  "chicken_biryani": "Biryani",
  "lamb_nihari": "Nihari",
  "chole_bhature": "Chole bhature",
  "sarson_saag": "Sarson da saag",
  "sambar": "Sambar (dish)",
  "tomato_rasam": "Rasam",
  "lemon_rice": "Lemon rice",
  "fish_white_curry": "Fish curry",
  "egg_hoppers": "Appam",
  "rava_dosa": "Dosa",
  "pumpkin_kootu": "Kootu",
  "parippu": "Dal",
  "devilled_chicken": "Sri Lankan cuisine",
  "cabbage_mallum": "Mallung",
  "mapo_tofu": "Mapo tofu",
  "kung_pao_chicken": "Kung Pao chicken",
  "hong_shao_rou": "Red braised pork belly",
  "egg_fried_rice": "Egg fried rice",
  "dan_dan_noodles": "Dan dan noodles",
  "char_siu_pork": "Char siu",
  "tomato_and_egg": "Stir-fried tomato and scrambled eggs",
  "dry_fried_green_beans": "Dry-fried green beans",
  "cumin_lamb": "Cumin lamb",
  "wonton_soup": "Wonton",
  "oyakodon": "Oyakodon",
  "katsu_curry": "Japanese curry",
  "miso_soup_rice": "Miso soup",
  "yakisoba": "Yakisoba",
  "teriyaki_salmon": "Teriyaki",
  "bibimbap": "Bibimbap",
  "kimchi_jjigae": "Kimchi-jjigae",
  "bulgogi": "Bulgogi",
  "japchae": "Japchae",
  "tteokbokki": "Tteok-bokki",
  "green_curry_tofu": "Green curry",
  "larb_gai": "Larb",
  "tom_yum": "Tom yum",
  "banh_mi": "Bánh mì",
  "bun_cha": "Bún chả",
  "caramel_pork": "Thịt kho",
  "nasi_goreng": "Nasi goreng",
  "beef_rendang": "Rendang",
  "prawn_laksa": "Laksa",
  "gado_gado": "Gado-gado",
  "chilaquiles_rojos": "Chilaquiles",
  "chicken_tinga": "Tinga (food)",
  "black_bean_enchiladas": "Enchilada",
  "pozole_rojo": "Pozole",
  "esquites": "Esquites",
  "black_bean_soup": "Black bean soup",
  "lomo_saltado": "Lomo saltado",
  "feijoada": "Feijoada",
  "chimichurri_steak": "Chimichurri",
  "arroz_con_pollo": "Arroz con pollo",
  "mujadara": "Mujaddara",
  "fattoush_halloumi": "Fattoush",
  "kofta_siniyeh": "Kofta",
  "maqluba": "Maqluba",
  "hummus_dinner": "Hummus",
  "fesenjan": "Fesenjān",
  "ghormeh_sabzi": "Ghormeh sabzi",
  "tabbouleh_plate": "Tabbouleh",
  "chicken_shawarma": "Shawarma",
  "batata_harra": "Batata harra",
  "chicken_tagine": "Tagine",
  "harira": "Harira",
  "koshari": "Kushari",
  "chermoula_fish": "Chermoula",
  "misir_wot": "Wat (food)",
  "doro_wot": "Doro wat",
  "gomen": "Gomen wat",
  "zaalouk": "Zaalouk",
  "merguez_couscous": "Merguez",
  "ojja_prawns": "Ojja",
  "egusi_stew": "Egusi",
  "suya_chicken": "Suya",
  "waakye": "Waakye",
  "thieboudienne": "Thieboudienne",
  "groundnut_stew": "Maafe",
  "kelewele": "Kelewele",
  "ugali_sukuma": "Ugali",
  "chapati_beans": "Chapati",
  "yassa_poulet": "Yassa (food)",
  "moin_moin": "Moin moin",
  "shepherds_pie": "Shepherd's pie",
  "toad_in_the_hole": "Toad in the hole",
  "fish_pie": "Fish pie",
  "bangers_and_mash": "Bangers and mash",
  "cauliflower_cheese": "Cauliflower cheese",
  "lancashire_hotpot": "Lancashire hotpot",
  "kedgeree": "Kedgeree",
  "coronation_chicken": "Coronation chicken",
  "colcannon": "Colcannon",
  "lentil_cottage_pie": "Cottage pie",
  "coq_au_vin": "Coq au vin",
  "ratatouille": "Ratatouille",
  "croque_monsieur": "Croque monsieur",
  "boeuf_bourguignon": "Beef bourguignon",
  "soupe_a_loignon": "French onion soup",
  "tortilla_espanola": "Spanish omelette",
  "paella_mixta": "Paella",
  "patatas_bravas": "Patatas bravas",
  "pisto_manchego": "Pisto",
  "gambas_al_ajillo": "Gambas al ajillo",
  "moussaka": "Moussaka",
  "gemista": "Gemista",
  "chicken_souvlaki": "Souvlaki",
  "briam": "Briam",
  "spanakopita": "Spanakopita",
  "menemen": "Menemen (food)",
  "mercimek_koftesi": "Mercimek köftesi",
  "karniyarik": "Karnıyarık",
  "mercimek_corbasi": "Lentil soup",
  "cevapi": "Ćevapi",
  "chicken_gumbo": "Gumbo",
  "jambalaya": "Jambalaya",
  "chilli_con_carne": "Chili con carne",
  "mac_and_cheese": "Macaroni and cheese",
  "cornbread_greens": "Cornbread",
  "jerk_chicken": "Jerk (cooking)",
  "rice_and_peas": "Rice and peas",
  "cuban_black_beans": "Frijoles negros",
  "sloppy_joes": "Sloppy joe",
  "buttermilk_chicken": "Roast chicken"
};

/** The article title Wikipedia thinks this dish is, or null. */
async function findArticle(recipe) {
  if (ARTICLE[recipe.id]) return ARTICLE[recipe.id];
  // Unpinned dishes fall back to searching: the dish's own name, then the name
  // with its cuisine, then the native-script name.
  const tries = [recipe.name, `${recipe.name} ${recipe.cuisine}`, recipe.local].filter(
    (t) => t && /\S/.test(t),
  );
  for (const t of tries) {
    const j = await api({ action: 'query', list: 'search', srsearch: t, srlimit: '3', srnamespace: '0' });
    const hit = (j.query?.search ?? [])[0];
    if (hit) return hit.title;
    await sleep(120);
  }
  return null;
}

/**
 * The article's lead image, already scaled by Wikimedia.
 *
 * `pithumbsize` makes their thumbnailer do the resizing, which removes the
 * only reason this script ever needed a browser: the originals on Commons are
 * routinely four thousand pixels wide, and downloading a hundred and forty of
 * them to shrink them locally was several hundred megabytes of waste. It also
 * means the script now runs anywhere Node runs — a CI runner, a laptop — with
 * no image library and no headless Chrome.
 */
async function leadImage(title) {
  const j = await api({
    action: 'query',
    prop: 'pageimages',
    piprop: 'thumbnail|original|name',
    pithumbsize: '900',
    titles: title,
  });
  const page = (j.query?.pages ?? [])[0];
  if (!page || !page.pageimage) return null;
  const url = page.thumbnail?.source ?? page.original?.source;
  if (!url) return null;
  return { file: `File:${page.pageimage}`, url, full: page.original?.source ?? url };
}

/** Photographer and licence, straight off the file description page. */
async function licenceOf(file) {
  const j = await api({ action: 'query', prop: 'imageinfo', iiprop: 'extmetadata|url|user', titles: file });
  const info = ((j.query?.pages ?? [])[0]?.imageinfo ?? [])[0];
  if (!info) return null;
  const m = info.extmetadata ?? {};
  const text = (v) =>
    v?.value == null
      ? ''
      : String(v.value)
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
  return {
    licence: text(m.LicenseShortName) || text(m.License) || '',
    author: text(m.Artist) || info.user || 'unknown',
    licenceUrl: text(m.LicenseUrl),
    page: info.descriptionurl,
    source: info.url,
  };
}

/** Download the bytes Wikimedia already scaled for us. */
async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} downloading the image`);
  return Buffer.from(await res.arrayBuffer());
}

/** Whatever Wikimedia's thumbnailer handed back — usually jpg, sometimes png. */
const extOf = (url) => (url.match(/\.(jpe?g|png|webp|gif)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');

const wanted = RECIPES.filter((r) => {
  if (only.length) return only.includes(r.id);
  // A recipe still pointing at an .svg is one that never got a photograph.
  return r.pic.endsWith('.svg') || !existsSync(`public/${r.pic}`);
}).slice(0, limit);

console.log(`${wanted.length} dishes without a photograph\n`);
if (!wanted.length) process.exit(0);

const manifestPath = 'public/pix/manifest.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const got = [];
const exts = {};
// Cottage pie and shepherd's pie share an article, and a cookbook where two
// dishes carry the same picture looks broken in exactly the way a drawing does
// not. First dish to claim a file keeps it; the second stays drawn.
const usedFiles = new Set(Object.values(manifest).map((m) => m.file).filter(Boolean));
const missed = [];


for (const r of wanted) {
  try {
    const title = await findArticle(r);
    if (!title) {
      missed.push(`${r.id}: no article found`);
      continue;
    }
    const lead = await leadImage(title);
    if (!lead) {
      missed.push(`${r.id}: "${title}" has no lead image`);
      continue;
    }
    const lic = await licenceOf(lead.file);
    if (!lic) {
      missed.push(`${r.id}: no file info for ${lead.file}`);
      continue;
    }
    if (usedFiles.has(lead.file)) {
      missed.push(`${r.id}: ${lead.file} is already another dish's photograph`);
      continue;
    }
    if (!usable(lic.licence)) {
      missed.push(`${r.id}: "${lic.licence}" is not a licence we can use`);
      continue;
    }

    console.log(`${r.id.padEnd(24)} ${title} — ${lic.licence} by ${lic.author.slice(0, 40)}`);
    if (dry) {
      got.push(r.id);
      continue;
    }

    const ext = extOf(lead.url);
    const bytes = await download(lead.url);
    writeFileSync(`public/pix/${r.id}.${ext}`, bytes);
    manifest[r.id] = {
      licence: lic.licence,
      author: lic.author,
      page: lic.page,
      file: lead.file,
      article: title,
      source: lead.source,
      licenceUrl: lic.licenceUrl,
      img: `${r.id}.${ext}`,
      bytes: bytes.length,
      fetched: new Date().toISOString().slice(0, 10),
    };
    got.push(r.id);
    exts[r.id] = ext;
    usedFiles.add(lead.file);
    // Wikimedia asks for a courteous request rate and it costs us nothing.
    await sleep(400);
  } catch (e) {
    missed.push(`${r.id}: ${e.message}`);
  }
}

if (!dry && got.length) {
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
  // Point each recipe at its new photograph. The drawing stays on disk, which
  // costs two kilobytes and means a photograph can be removed later without
  // leaving a dish with no picture at all.
  let cookbook = readFileSync('src/data/cookbook.js', 'utf8');
  for (const id of got) {
    cookbook = cookbook.replace(`pic: 'pix/${id}.svg'`, `pic: 'pix/${id}.${exts[id]}'`);
  }
  writeFileSync('src/data/cookbook.js', cookbook);
}

console.log(`\n${got.length} photographed, ${missed.length} still drawn`);
for (const m of missed) console.log('  ' + m);
if (!dry && got.length) console.log('\nnow run: npx vitest run && npx vite build');
