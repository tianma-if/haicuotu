import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'src/data/modern-identifications.json');
const OUT_DIR = path.join(ROOT, 'public/images/modern');
const TMP_DIR = path.join(ROOT, 'tmp/modern-images');
const SOURCE_LEDGER = path.join(ROOT, 'research/modern-image-sources.json');
const USER_AGENT = 'haicuotu-modern-image-generator/1.0 (https://haicuotu.tianma-if.com)';

const LIMIT = Number.parseInt(process.env.LIMIT || '', 10) || Infinity;
const START = Number.parseInt(process.env.START || '', 10) || 0;
const FORCE = process.env.FORCE === '1';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanSearchTerm(term) {
  if (!term) return null;
  return term
    .replace(/spp\.$/i, '')
    .replace(/未定[:：]?/g, '')
    .replace(/传说化/g, '')
    .replace(/传说/g, '')
    .replace(/复合体/g, '')
    .replace(/夸饰/g, '')
    .replace(/可能为/g, '')
    .replace(/近似/g, '')
    .replace(/某种/g, '')
    .replace(/[，、（(].*/g, '')
    .replace(/类$/g, '')
    .trim();
}

function candidateTerms(term) {
  if (!term) return [];
  return term
    .split(/[，、,；;]|或|和|与/)
    .map(cleanSearchTerm)
    .filter(value => value && value.length >= 2 && !/未定|传说|复合体|夸饰/.test(value));
}

function searchTerms(item) {
  const terms = [
    cleanSearchTerm(item.scientificName),
    ...candidateTerms(item.candidateModernName),
    cleanSearchTerm(item.name)
  ].filter(Boolean);
  return [...new Set(terms)];
}

function expectedIconicTaxa(item) {
  const text = `${item.name} ${item.candidateModernName} ${item.scientificName || ''}`;
  if (/海市|蜃景|燕窝|鱼苗|卵|胶|肉$|粉$/.test(text)) return null;
  if (/紫菜|海带|石花菜|藻|菜|草|树|花菜/.test(text)) return new Set(['Plantae']);
  if (/鸟|鸥|燕|鹳|鸽|鹦鹉|鸡/.test(text)) return new Set(['Aves']);
  if (/鳄|海蛇|龙蛇|蛇|蜥/.test(text)) return new Set(['Reptilia']);
  if (/鲸|海豹|海獭|海狮|海狗|儒艮|江豚|海牛|海象|兽|豕|驴|牛/.test(text)) return new Set(['Mammalia']);
  if (/螺|贝|蚌|蚶|蛏|蛤|蛎|鲍|乌贼|章鱼|墨鱼|鱿|蛸|海兔|鹦鹉螺|柔鱼|锁管/.test(text)) return new Set(['Mollusca']);
  if (/蟹|虾|鲎|螂|蠘|蟛|蝤蛑|龙虱|蜈蚣|蜘蛛/.test(text)) return new Set(['Animalia', 'Insecta', 'Arachnida']);
  if (/海葵|珊瑚|水母|海蜇|海参|蛇尾|星虫|海肠|海鞘|沙蚕|海蚕|泥笋|泥丁|泥肠|土笋|土肉|石乳/.test(text)) return new Set(['Animalia']);
  if (/鱼|鲨|鲈|鲻|鳅|鳚|鲚|鲷|虎鱼|鱘|银鱼|鲳|鳐|鲶|鲇|石首|鲈|鲫|鳎|鱵|电鳐|马鲛|鳓|比目|鳗|带鱼|针鱼|弹涂|鳝|刺鲀|河鲀/.test(text)) {
    return new Set(['Actinopterygii', 'Elasmobranchii']);
  }
  return new Set(['Animalia']);
}

function taxonMatchesExpectation(item, taxon) {
  const expected = expectedIconicTaxa(item);
  if (!expected) return true;
  const iconic = taxon.iconic_taxon_name;
  if (!iconic) return false;
  if (expected.has(iconic)) return true;
  if (expected.has('Animalia') && !['Plantae', 'Fungi', 'Protozoa'].includes(iconic)) return true;
  return false;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function findINaturalistImage(item) {
  for (const term of searchTerms(item)) {
    const url = new URL('https://api.inaturalist.org/v1/taxa');
    url.searchParams.set('q', term);
    url.searchParams.set('per_page', '8');
    url.searchParams.set('locale', 'zh-CN');

    const data = await fetchJson(url);
    const taxon = data.results?.find(result => (
      result.default_photo?.medium_url && taxonMatchesExpectation(item, result)
    ));
    if (!taxon) continue;

    const photo = taxon.default_photo;
    const imageUrl = photo.medium_url || photo.original_url || photo.url;
    if (!imageUrl) continue;

    return {
      provider: 'iNaturalist',
      query: term,
      url: imageUrl.replace('/medium.', '/large.'),
      pageUrl: taxon.wikipedia_url || `https://www.inaturalist.org/taxa/${taxon.id}`,
      credit: photo.attribution || photo.native_realname || photo.native_username || 'iNaturalist contributor',
      license: photo.license_code || 'unknown'
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
    url.searchParams.set('gsrsearch', `${term} filetype:bitmap`);
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
        url: info.thumburl || info.url,
        pageUrl: meta.UsageTerms?.value ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.title.replace(/^File:/, ''))}` : info.descriptionurl,
        credit: meta.Artist?.value?.replace(/<[^>]*>/g, '').trim() || 'Wikimedia Commons contributor',
        license
      };
    }
  }
  return null;
}

async function download(url, outPath) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!response.ok) throw new Error(`download failed: ${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, buffer);
}

async function toWebp(inputPath, outputPath) {
  await sharp(inputPath)
    .rotate()
    .resize({ width: 1200, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76, effort: 5 })
    .toFile(outputPath);
}

async function findImage(item) {
  try {
    const inat = await findINaturalistImage(item);
    if (inat) return inat;
  } catch (error) {
    console.warn(`  iNaturalist lookup failed: ${error.message}`);
  }

  try {
    return await findCommonsImage(item);
  } catch (error) {
    console.warn(`  Commons lookup failed: ${error.message}`);
    return null;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  const items = JSON.parse(await readFile(DATA_PATH, 'utf8'));
  const ledger = [];
  let generated = 0;
  let skipped = 0;
  let missing = 0;

  const slice = items.slice(START, START + LIMIT);
  for (const [offset, item] of slice.entries()) {
    const index = START + offset + 1;
    const finalPath = path.join(OUT_DIR, `${item.id}.webp`);
    console.log(`[${index}/${items.length}] ${item.name} -> ${item.candidateModernName}`);

    if (!FORCE && existsSync(finalPath)) {
      item.modernImage = `/images/modern/${item.id}.webp`;
      skipped++;
      continue;
    }

    const image = await findImage(item);
    if (!image) {
      item.modernImage = null;
      item.modernImageSource = null;
      item.modernImageCredit = null;
      item.modernImageLicense = null;
      missing++;
      console.warn('  no open image found');
      await sleep(250);
      continue;
    }

    const tempPath = path.join(TMP_DIR, `${item.id}.source`);
    try {
      await download(image.url, tempPath);
      await toWebp(tempPath, finalPath);
      item.modernImage = `/images/modern/${item.id}.webp`;
      item.modernImageSource = image.pageUrl;
      item.modernImageCredit = image.credit;
      item.modernImageLicense = image.license;
      ledger.push({ id: item.id, name: item.name, ...image, localPath: item.modernImage });
      generated++;
      console.log(`  saved ${item.modernImage} (${image.provider}, ${image.query})`);
    } catch (error) {
      item.modernImage = null;
      item.modernImageSource = null;
      item.modernImageCredit = null;
      item.modernImageLicense = null;
      missing++;
      console.warn(`  failed: ${error.message}`);
    } finally {
      await rm(tempPath, { force: true });
      await sleep(350);
    }
  }

  await writeFile(DATA_PATH, `${JSON.stringify(items, null, 2)}\n`);
  await writeFile(SOURCE_LEDGER, `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(`done: generated=${generated}, skipped=${skipped}, missing=${missing}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
