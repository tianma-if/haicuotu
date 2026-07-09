import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'src/data/modern-identifications.json');
const OUT_DIR = path.join(ROOT, 'public/images/modern');
const TMP_DIR = path.join(ROOT, 'tmp/modern-images');
const WORK_DIR = path.join(ROOT, 'research/modern-image-work');
const USER_AGENT = 'haicuotu-modern-image-generator/2.0 (https://haicuotu.tianma-if.com)';

const partArg = process.argv[2];
if (!partArg) {
  console.error('Usage: node scripts/generate_modern_image_part.mjs research/modern-image-work/part-01.json');
  process.exit(1);
}

const TAXON_OVERRIDES = {
  vol1_9_2: ['Salangidae', 'Engraulidae'],
  vol1_9_3: ['Scorpaenidae', 'Sebastiscus marmoratus', 'Scorpaenopsis'],
  vol1_11_1: ['Ammodytidae', 'Hypoatherina valenciennei'],
  vol1_12_1: ['Gobiidae', 'Sillaginidae'],
  vol1_12_2: ['Engraulidae'],
  vol1_14_2: ['Elasmobranchii', 'Carcharhinidae', 'Chiloscyllium plagiosum'],
  vol1_15_3: ['Rajiformes', 'Myliobatiformes', 'Dasyatidae'],
  vol1_16_2: ['Exocoetidae', 'Atheriniformes'],
  vol1_16_3: ['Ditrema temminckii', 'Acanthopagrus schlegelii', 'Pomacentridae'],
  vol1_17_1: ['Cheloniidae', 'Chelonia mydas', 'Tachypleus tridentatus', 'Limulidae'],
  vol1_18_1: ['Echeneidae', 'Echeneis naucrates', 'Remora'],
  vol1_19_1: ['Platax teira', 'Taenianotus triacanthus'],
  vol1_19_2: ['Solenostomus paradoxus', 'Pegasidae'],
  vol1_22_2: ['Labridae', 'Scarinae', 'Scarus', 'Lutjanidae'],
  vol1_25_1: ['Torpediniformes', 'Narke japonica', 'Narcine timlei'],
  vol1_27_2: ['Muraenesox cinereus', 'Muraenesocidae', 'Congridae'],
  vol1_28_2: ['Fistulariidae', 'Fistularia commersonii', 'Fistularia petimba'],
  vol1_29_1: ['Salangidae', 'Engraulidae'],
  vol1_29_3: ['Acanthopagrus', 'Sparidae'],
  vol1_30_1: ['Chaetodon', 'Scatophagus argus'],
  vol1_30_2: ['Atherinidae', 'Engraulidae', 'Gobiidae'],
  vol1_32_2: ['Aulostomus chinensis', 'Aulostomidae', 'Chinese trumpetfish'],
  vol1_33_1: ['Tetraodontidae', 'Diodontidae', 'Tetraodontiformes'],
  vol1_34_1: ['Gobiidae', 'Echeneidae'],
  vol1_34_2: ['Macrouridae', 'Siluriformes'],
  vol1_36: ['Laticauda semifasciata', 'Regalecus glesne'],
  vol1_37_1: ['Dugong dugon', 'Phocidae'],
  vol1_37_2: ['Hippocampus', 'Syngnathidae'],
  vol1_38_1: ['Hippocampus', 'Syngnathidae'],
  vol1_39_1: ['Regalecus glesne', 'Laticauda'],
  vol1_39_2: ['Regalecus glesne', 'Laticauda'],
  vol1_40_2: ['Artemia', 'Branchiopoda'],
  vol1_41_1: ['Scorpaenidae', 'Diodontidae'],
  vol1_41_2: ['Laticauda semifasciata', 'Hydrophiinae'],
  vol2_2: ['Ciconia boyciana', 'Ardea alba', 'Ciconiidae', 'Ardeidae'],
  vol2_4: ['Hydrobates monorhis', 'Hydrobatidae'],
  vol2_17: ['Atmospheric refraction', 'mirage'],
  vol2_18: ['Pinctada fucata', 'Pinctada', 'Pteriidae'],
  vol2_33: ['Cybister chinensis', 'Cybister', 'Dytiscidae'],
  vol2_36: ['Actiniaria', 'Paracondylactis sinensis', 'Anthopleura'],
  vol3_3_1: ['Dasyatidae', 'Hemitrygon akajei', 'Myliobatiformes'],
  vol3_3_2: ['Dasyatidae', 'Hemitrygon akajei', 'Myliobatiformes'],
  vol3_4: ['Echeneis naucrates', 'Echeneidae'],
  vol3_7_1: ['Pristis zijsron', 'Pristis pectinata', 'Pristidae'],
  vol3_8_1: ['Engraulidae', 'Ammodytidae'],
  vol3_10: ['Elasmobranchii', 'Carcharhinidae', 'Somniosidae'],
  vol3_11_1: ['Rhinobatos hynnicephalus', 'Glaucostegus typus', 'Rhinopristiformes'],
  vol3_11_2: ['Sphyrna lewini', 'Sphyrna zygaena', 'Sphyrnidae'],
  vol3_12: ['Pristidae', 'Pristis', 'Anoxypristis cuspidata'],
  vol3_13_1: ['Sphyrna lewini', 'Sphyrna zygaena', 'Sphyrnidae'],
  vol3_13_2: ['Sphyrna lewini', 'Sphyrna zygaena', 'Sphyrnidae'],
  vol3_14_1: ['Scyliorhinidae', 'Chiloscyllium plagiosum'],
  vol3_14_2: ['Chiloscyllium plagiosum', 'Selachimorpha'],
  vol3_14_3: ['Sphyrna lewini', 'Sphyrna zygaena', 'Sphyrnidae'],
  vol3_15_1: ['Cetacea', 'Balaenoptera', 'Megaptera novaeangliae', 'Rhincodon typus'],
  vol3_15_2: ['Chiloscyllium plagiosum', 'Stegostoma tigrinum', 'Selachimorpha'],
  vol3_15_3: ['Carcharhiniformes', 'Triakidae', 'Scyliorhinidae'],
  vol3_16_1: ['Elasmobranchii', 'Carcharhinidae'],
  vol3_16_2: ['Diodontidae', 'Tetraodontidae', 'Tetraodontiformes'],
  vol3_16_3: ['Elasmobranchii', 'Carcharhinidae'],
  vol3_17: ['Galeocerdo cuvier', 'Carcharhinidae'],
  vol3_18: ['Phocidae', 'Otariidae'],
  vol3_19_1: ['Dugong dugon', 'Phocidae'],
  vol3_20_1: ['Enhydra lutris', 'Lutra lutra', 'Lutrinae'],
  vol3_20_2: ['Otariidae', 'Phocidae', 'Phoca largha'],
  vol3_20_3: ['Holothuroidea', 'Aplysiida'],
  vol3_24: ['Syngnathidae', 'Hippocampus'],
  vol3_25_2: ['Polychaeta', 'Nemertea', 'Sipuncula'],
  vol3_26_1: ['Ascidiacea', 'Styela clava', 'Halocynthia roretzi'],
  vol3_29_2: ['Phocidae', 'Dugong dugon'],
  vol3_29_3: ['Ascidiacea', 'Holothuroidea', 'Sipuncula'],
  vol3_30_2: ['Dendrochirotida', 'Cucumariidae', 'Holothuroidea'],
  vol3_31_2: ['Aplysia eggs', 'Opisthobranchia'],
  vol3_31_3: ['Antennariidae', 'Batrachoididae'],
  vol3_33_2: ['Sipuncula', 'Phascolosoma esculenta', 'Sipunculus nudus'],
  vol3_34_1: ['Scyphozoa', 'Aurelia', 'Rhizostomeae'],
  vol4_2: ['Tachypleus tridentatus', 'Limulidae'],
  vol4_3_1: ['Charonia tritonis', 'Ranellidae'],
  vol4_3_2: ['Neptunea cumingii', 'Buccinidae'],
  vol4_4_1: ['Dentalium', 'Scaphopoda', 'Dentaliidae'],
  vol4_5_1: ['Turritellidae', 'Cerithiidae', 'Batillariidae'],
  vol4_5_2: ['Chicoreus asianus', 'Muricidae', 'Murex pecten'],
  vol4_5_3: ['Patellogastropoda', 'Nipponacmea', 'Isognomon ephippium', 'Ostreidae'],
  vol4_6_1: ['Muricidae', 'Hexaplex cichoreum', 'Chicoreus ramosus'],
  vol4_6_2: ['Haliotis diversicolor', 'Haliotidae'],
  vol4_6_3: ['Cypraeidae', 'Monetaria'],
  vol4_7_1: ['Volutidae', 'Olividae'],
  vol4_7_3: ['Placuna placenta', 'Planorbidae'],
  vol4_8_3: ['Littorinidae', 'Batillaria'],
  vol4_8_4: ['Neritidae', 'Littorinidae', 'Trochidae'],
  vol4_9_1: ['Muricidae', 'Murex'],
  vol4_9_2: ['Nautilus pompilius', 'Nautilidae'],
  vol4_9_3: ['Vermetidae', 'Serpulidae', 'worm snail'],
  vol4_10_1: ['Cypraeidae', 'Marginellidae'],
  vol4_10_2: ['Janthina', 'Janthinidae'],
  vol4_10_3: ['Reishia luteostoma', 'Thais luteostoma', 'Muricidae'],
  vol4_11_1: ['Strombidae', 'Naticidae'],
  vol4_12_1: ['Spondylus', 'Plicatula', 'Ostreidae'],
  vol4_12_2: ['Muricidae', 'Hexaplex cichoreum', 'Chicoreus ramosus'],
  vol4_12_3: ['Argonauta argo', 'Argonauta hians', 'Nautilus pompilius'],
  vol4_13_1: ['Tonna perdix', 'Tonnidae'],
  vol4_14: ['Mollusca', 'Gastropoda', 'Bivalvia'],
  vol4_15_1: ['Bullacta exarata', 'Haminoeidae'],
  vol4_16_1: ['Babylonia areolata', 'Babylonia lutosa', 'Buccinidae'],
  vol4_16_3: ['Nerita', 'Neritidae'],
  vol4_16_4: ['Nassariidae', 'Nassarius'],
  vol4_17_1: ['Naticidae', 'Littorinidae'],
  vol4_17_3: ['Patellogastropoda', 'Lottiidae'],
  vol4_17_4: ['Naticidae', 'Neverita didyma'],
  vol4_18_1: ['Cassis cornuta', 'Cassidae'],
  vol4_18_3: ['Scaphopoda', 'Dentalium', 'Antalis'],
  vol4_19_1: ['Mollusca', 'Cypraeidae'],
  vol4_19_2: ['Paguroidea', 'Diogenidae', 'Paguridae'],
  vol4_21_2: ['Mictyris brevidactylus', 'Mictyris', 'Gelasiminae'],
  vol4_21_3: ['Calappidae', 'Dorippidae', 'Dorippe sinica'],
  vol4_22_1: ['Heikeopsis japonica', 'Dorippidae', 'Calappidae'],
  vol4_22_2: ['Scylla serrata', 'Portunidae', 'Eriocheir sinensis'],
  vol4_23_1: ['Pinnotheres', 'Zaops ostreus', 'Pinnotheridae'],
  vol4_24_2: ['Ocypodidae', 'Mictyris brevidactylus', 'Gelasiminae'],
  vol4_25_1: ['Portunus sanguinolentus', 'Portunus', 'Portunidae'],
  vol4_25_2: ['Ocypodidae', 'Ocypode', 'Gelasiminae', 'Austruca lactea'],
  vol4_30_1: ['Ocypodidae', 'Ocypode', 'Gelasiminae', 'Austruca lactea'],
  vol4_30_2: ['Grapsidae', 'Hemigrapsus sanguineus', 'Portunidae'],
  vol4_30_3: ['Charybdis feriata', 'crucifix crab', 'Portunidae'],
  vol4_31_1: ['Mictyris brevidactylus', 'Mictyris', 'Mictyridae'],
  vol4_33_3: ['Ocypodidae', 'Mictyris', 'Grapsidae'],
  vol4_33_2: ['Mictyris brevidactylus', 'Mictyris', 'Mictyridae'],
  vol4_34_1: ['Grapsus albolineatus', 'Percnon planissimum', 'Grapsidae'],
  vol4_38_1: ['Sergestidae', 'Acetes', 'Pasiphaeidae'],
  vol4_38_2: ['Macrobrachium rosenbergii', 'Palaemonidae', 'Metanephrops thomsoni'],
  vol4_38_3: ['Metanephrops japonicus', 'Metanephrops', 'Nephropidae'],
  vol4_43_1: ['Acetes', 'Sergestidae', 'Palaemon carinicauda'],
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanTerm(term) {
  if (!term) return null;
  return term
    .replace(/\bspp?\.$/i, '')
    .replace(/未定[:：]?|传说化|传说|复合体|夸饰|可能为|近似|某种/g, '')
    .replace(/[，、（(].*/g, '')
    .replace(/类$/g, '')
    .trim();
}

function splitTerms(term) {
  if (!term) return [];
  return term
    .split(/[，、,；;]|或|和|与/)
    .map(cleanTerm)
    .filter(value => value && value.length >= 2 && !/未定|传说|复合体|夸饰|蜃景/.test(value));
}

function searchTerms(item) {
  const overrides = TAXON_OVERRIDES[item.id] || [];
  if (overrides.length > 0) {
    return [...new Set([...overrides, cleanTerm(item.scientificName)].filter(Boolean))];
  }

  const terms = [
    cleanTerm(item.scientificName),
    ...splitTerms(item.candidateModernName),
    cleanTerm(item.name),
  ].filter(Boolean);
  return [...new Set(terms)];
}

function expectedIconicTaxa(item) {
  const text = `${item.name} ${item.candidateModernName} ${item.scientificName || ''}`;
  if (/海市|蜃景/.test(text)) return new Set(['unknown']);
  if (/紫菜|海带|石花菜|藻|菜|草/.test(text)) return new Set(['Plantae']);
  if (/鸟|鸥|燕|鹳|鹭|鸽|鹦鹉|鸡/.test(text)) return new Set(['Aves']);
  if (/鳄|海蛇|龙蛇|蛇|蜥/.test(text)) return new Set(['Reptilia']);
  if (/鲸|海豹|海獭|海狮|海狗|儒艮|江豚|海牛|海象|兽|豕|驴|牛|人鱼|和尚|海虎/.test(text)) return new Set(['Mammalia']);
  if (/螺|贝|蚌|蚶|蛏|蛤|蛎|鲍|乌贼|章鱼|墨鱼|鱿|蛸|海兔|鹦鹉螺|柔鱼|锁管|石鳖|帽贝/.test(text)) return new Set(['Mollusca']);
  if (/蟹|虾|鲎|螂|蠘|蟛|蝤蛑|龙虱|蜈蚣|蜘蛛|卤虫/.test(text)) return new Set(['Animalia', 'Insecta', 'Arachnida']);
  if (/海葵|珊瑚|水母|海蜇|海参|蛇尾|星虫|海肠|海鞘|沙蚕|海蚕|泥笋|泥丁|泥肠|土笋|土肉|石乳|龙肠/.test(text)) return new Set(['Animalia']);
  if (/鱼|鲨|鲈|鲻|鳅|鳚|鲚|鲷|虎鱼|鱘|银鱼|鲳|鳐|鲶|鲇|石首|鲫|鳎|鱵|电鳐|马鲛|鳓|比目|鳗|带鱼|针鱼|弹涂|鳝|刺鲀|河鲀/.test(text)) {
    return new Set(['Actinopterygii', 'Elasmobranchii']);
  }
  return new Set(['Animalia', 'Plantae']);
}

function taxonMatches(item, taxon) {
  const expected = expectedIconicTaxa(item);
  const iconic = taxon.iconic_taxon_name;
  if (expected.has('unknown')) return true;
  if (!iconic) return false;
  if (expected.has(iconic)) return true;
  if (TAXON_OVERRIDES[item.id]?.length && !['Fungi', 'Protozoa'].includes(iconic)) return true;
  if ((expected.has('Elasmobranchii') || expected.has('Actinopterygii')) && iconic === 'Animalia') return true;
  if (expected.has('Animalia') && !['Plantae', 'Fungi', 'Protozoa'].includes(iconic)) return true;
  return false;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function findINaturalistImage(item) {
  for (const term of searchTerms(item)) {
    const url = new URL('https://api.inaturalist.org/v1/taxa');
    url.searchParams.set('q', term);
    url.searchParams.set('per_page', '10');
    url.searchParams.set('locale', 'zh-CN');
    const data = await fetchJson(url);
    const results = data.results || [];
    const taxon = results
      .filter(result => result.default_photo?.medium_url && taxonMatches(item, result))
      .sort((a, b) => {
        const aExact = [a.name, a.preferred_common_name, a.matched_term].filter(Boolean).some(value => value.toLowerCase() === term.toLowerCase());
        const bExact = [b.name, b.preferred_common_name, b.matched_term].filter(Boolean).some(value => value.toLowerCase() === term.toLowerCase());
        return Number(bExact) - Number(aExact);
      })[0];
    if (!taxon) continue;

    const photo = taxon.default_photo;
    const imageUrl = photo.medium_url || photo.original_url || photo.url;
    if (!imageUrl) continue;
    return {
      provider: 'iNaturalist',
      query: term,
      taxonId: taxon.id,
      taxonName: taxon.name,
      commonName: taxon.preferred_common_name || null,
      url: imageUrl.replace('/medium.', '/large.'),
      pageUrl: `https://www.inaturalist.org/taxa/${taxon.id}`,
      credit: photo.attribution || photo.native_realname || photo.native_username || 'iNaturalist contributor',
      license: photo.license_code || 'unknown',
    };
  }
  return null;
}

async function findCommonsImage(item) {
  for (const term of searchTerms(item)) {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('generator', 'search');
    url.searchParams.set('gsrnamespace', '6');
    url.searchParams.set('gsrlimit', '12');
    url.searchParams.set('gsrsearch', `${term} animal OR organism filetype:bitmap`);
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url|mime|extmetadata');
    url.searchParams.set('iiurlwidth', '1400');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    const data = await fetchJson(url);
    const pages = Object.values(data.query?.pages || {});
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info || !/^image\/(jpeg|png|webp)$/i.test(info.mime || '')) continue;
      const meta = info.extmetadata || {};
      const license = meta.LicenseShortName?.value || meta.License?.value || 'unknown';
      if (/non[- ]?free|fair use|copyrighted/i.test(license)) continue;
      return {
        provider: 'Wikimedia Commons',
        query: term,
        taxonId: null,
        taxonName: term,
        commonName: null,
        url: info.thumburl || info.url,
        pageUrl: info.descriptionurl,
        credit: meta.Artist?.value?.replace(/<[^>]*>/g, '').trim() || 'Wikimedia Commons contributor',
        license,
      };
    }
  }
  return null;
}

async function download(url, outPath) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!response.ok) throw new Error(`download failed: ${response.status} ${response.statusText}`);
  await writeFile(outPath, Buffer.from(await response.arrayBuffer()));
}

async function toWebp(inputPath, outputPath) {
  await sharp(inputPath)
    .rotate()
    .resize({ width: 1200, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(outputPath);
}

async function findImage(item) {
  try {
    const inat = await findINaturalistImage(item);
    if (inat) return inat;
  } catch (error) {
    console.warn(`  iNaturalist lookup failed: ${error.message}`);
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });
  await mkdir(WORK_DIR, { recursive: true });

  const allItems = JSON.parse(await readFile(DATA_PATH, 'utf8'));
  const byId = new Map(allItems.map(item => [item.id, item]));
  const partPath = path.resolve(ROOT, partArg);
  const part = JSON.parse(await readFile(partPath, 'utf8'));
  const ledger = [];
  const missing = [];

  for (const brief of part) {
    const item = byId.get(brief.id) || brief;
    const finalPath = path.join(OUT_DIR, `${item.id}.webp`);
    console.log(`[${item.id}] ${item.name} -> ${item.candidateModernName}`);
    const image = await findImage(item);
    if (!image) {
      missing.push({ id: item.id, name: item.name, reason: 'no source found', terms: searchTerms(item) });
      console.warn('  no source found');
      continue;
    }
    const tempPath = path.join(TMP_DIR, `${item.id}.source`);
    try {
      await download(image.url, tempPath);
      await toWebp(tempPath, finalPath);
      ledger.push({
        id: item.id,
        name: item.name,
        modernImage: `/images/modern/${item.id}.webp`,
        modernImageKind: 'open-photo',
        modernImageSource: image.pageUrl,
        modernImageCredit: image.credit,
        modernImageLicense: image.license,
        ...image,
      });
      console.log(`  saved ${finalPath} (${image.provider}: ${image.query})`);
    } catch (error) {
      missing.push({ id: item.id, name: item.name, reason: error.message, terms: searchTerms(item), image });
      console.warn(`  failed: ${error.message}`);
    } finally {
      await rm(tempPath, { force: true });
      await sleep(650);
    }
  }

  const base = path.basename(partPath, '.json');
  await writeFile(path.join(WORK_DIR, `${base}-ledger.json`), `${JSON.stringify(ledger, null, 2)}\n`);
  await writeFile(path.join(WORK_DIR, `${base}-missing.json`), `${JSON.stringify(missing, null, 2)}\n`);
  console.log(`done ${base}: images=${ledger.length}, missing=${missing.length}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
