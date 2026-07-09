import vol1 from '../data/vol1.json';
import vol2 from '../data/vol2.json';
import vol3 from '../data/vol3.json';
import vol4 from '../data/vol4.json';
import modernIdentifications from '../data/modern-identifications.json';

export interface Creature {
  id: string;
  name: string;
  image: string | null;
  description: string;
  page_idx: number;
  volume: number;
}

export interface VolumeData {
  volume: number;
  title: string;
  preface: string;
  creatures: Creature[];
}

export type IdentificationConfidence = 'high' | 'medium' | 'low' | 'legendary';

export interface ModernIdentification {
  id: string;
  name: string;
  candidateModernName: string;
  scientificName: string | null;
  confidence: IdentificationConfidence;
  rationale: string;
  caveats: string;
  modernImage?: string | null;
  modernImageKind?: 'open-photo' | string | null;
  modernImageSource?: string | null;
  modernImageCredit?: string | null;
  modernImageLicense?: string | null;
  modernImageTaxon?: string | null;
  modernImageProvider?: string | null;
}

export const volumes: VolumeData[] = [
  { ...vol1, volume: 1 } as VolumeData,
  { ...vol3, volume: 2 } as VolumeData, // Swap physical Second Volume sharks (vol3.json) to Volume 2
  { ...vol2, volume: 3 } as VolumeData, // Swap physical Third Volume shells (vol2.json) to Volume 3
  { ...vol4, volume: 4 } as VolumeData
];

export const allCreatures: Creature[] = volumes.flatMap((v, idx) => 
  v.creatures.map(c => ({
    ...c,
    volume: idx + 1 // Assign correct displayed volume based on index (1, 2, 3, 4)
  }))
);

export const illustratedCreatures: Creature[] = allCreatures.filter(
  creature => Boolean(creature.image)
);

const modernIdentificationById = new Map(
  (modernIdentifications as ModernIdentification[]).map(item => [item.id, item])
);

export const confidenceLabels: Record<IdentificationConfidence, string> = {
  high: '较可靠',
  medium: '可参考',
  low: '存疑',
  legendary: '传说/非物种'
};

// Map creature index to custom metadata (danger rating, flavor/edibility rating, types)
// Since we are SSG, we can define a deterministic mapping based on ID or name hash.
// This adds fun gamified parameters like "美味指数" (deliciousness) and "危险指数" (danger) which are perfect for social sharing!
// Map creature index to custom metadata (danger rating, flavor/edibility rating, types)
// Since we are SSG, we can define a deterministic mapping based on ID or name hash.
// This adds fun gamified parameters like "美味指数" (deliciousness) and "危险指数" (danger) which are perfect for social sharing!

const FAMOUS_CREATURES_MAP: Record<string, string> = {
  // Volume 1
  "鲈鱼": "对应温带近海常见的花鲈（Lateolabrax japonicus）。背部有小黑点，口裂大，是我国沿海重要的经济鱼类，肉质细嫩。",
  "鱼虎": "指针齿鲀科的某种刺鲀（如六斑刺鲀）。体表密布硬刺，遇敌吸气膨胀如球，下颌齿板如喙，能轻易咬碎贝类。",
  "鲻鱼": "即鲻科的鲻鱼（Mugil cephalus），俗名乌头、鲻子，广泛分布于沿海和河口，肉质肥美，晒干为鲞，味极甘美。",
  "江鱼": "对应闽海常见的江鳀或某种小鳀科鱼类（如康氏侧带鳀），身体细小银白，常晒干为鱼苗食用，味极清甜。",
  "海鳅鱼": "可能是指鳚科或鰕虎鱼科中体型较长、栖息在礁石缝隙的底栖鱼类，形似泥鳅但生存于海中，肉质坚实。",
  "河豚": "对应东方鲀属（Takifugu）鱼类。体内含有极强的河豚毒素，但肌肉纤维细腻，在我国自古有拼死吃河豚的传统。",
  "七里香": "指某种鳀科或银鱼科的微小幼鱼。因体轻质嫩、风味清雅，闽人常赞其香飘七里。",
  "鱽鱼": "即鲱形目凤尾鱼科的鲚属鱼类（如刀鲚或凤鲚），身体侧扁呈刀刃状，后部渐细，肉质极为细嫩。",
  "划腮鱼": "可能是指某种鰕虎鱼或大口鳂。其口裂宽大，常在浅水沙滩上匍匐，鳃部开阖显著。",
  "小鱼": "泛指海洋中各种鱼类的幼苗（稚鱼或仔鱼），如鳀鱼苗、鲱鱼苗等，闽人常焙干做羹，味鲜咸。",
  "飞鱼": "对应飞鱼科（Exocoetidae）鱼类。其胸鳍特别宽大延长，能跃出海面在气流中滑翔长达数十米以避天敌。",
  "铜盆鱼": "可能是指丽棘鲷（Acanthopagrus latus）或某种红褐色的鲷科鱼类。其体型侧扁呈扁圆形，色泽红黄如古铜盆。",
  "蝘虎鱼": "指鰕虎鱼科（Gobiidae）鱼类，因其在海礁岩石上匍匐爬行如壁虎（蝘蜓），故名蝘虎。",
  "海鱘": "对应鲟形目鲟科鱼类（如中华鲟）。体表有五行骨板，口在腹面，属于珍稀的江海洄游性鱼类，肉多骨硬。",
  "鲨鱼": "即软骨鱼纲鲨总目（Selachimorpha）的各种中小型鲨鱼（如条纹斑竹鲨），齿利口腹，性暴鸷。",
  "海银鱼": "对应银鱼科（Salangidae）的某种海产银鱼，通体无鳞、洁白透明，肉质鲜美，食用价值极高。",
  "鲳鱼": "即鲳科的银鲳（Pampus argenteus）。体形侧扁呈菱形，无腹鳍，鳞极细，肉质细嫩，为海产名贵鱼类。",
  "毯鱼": "可能是指某种圆盘状的鳐鱼（如双鳍电鳐）或水母，其体圆扁平，随波漂流，状如地毯。",
  "松鱼": "可能指某种背部呈松树皮纹理的鲉科鱼类（如褐菖鲉），肉质极为鲜嫩细致，多生于海岩缝隙中。",
  "鹞毛鱼": "可能指某种胸鳍极度退化或延长的海龙目鱼类，其形态在海水中如鹞鹰之毛漂浮，随波逐流。",
  "青鲋": "即某种体呈青色、形似鲫鱼的近海鲷科或鲫科鱼类，味极清甜，多生于海滨浅水处。",
  "鳏鱼": "可能是指某种体表有盾甲的鲟类或大型甲壳类异兽，其背部斑纹如印，极罕见。",
  "印鱼": "即䲟鱼（Echeneis naucrates）。第一背鳍变形为吸盘，可吸附在鲨鱼、海龟或船底，借此迁徙和避敌。",
  "鳔鱼": "可能指某种鳀科或石首鱼科的微小鱼苗，其鳔特别发达，自古是熬制鱼鳔胶的优质原料。",
  "顶甲鱼": "可能是指某种头部具坚硬骨板的鲬科鱼类（如孔鲬）或某种棘背鱼，能紧贴岩石防范天敌。",
  "鳂鱼": "即金鳞鱼科（Holocentridae）鱼类。身体多呈绯红色，鳞片坚硬且有刺，是我国南方沿海的珍贵海产。",
  "枫叶鱼": "可能是指某种体色绯红、侧扁如枫叶的红色小鱼（如拟竺鲷），常在礁石间成群活动，色艳可玩。",
  "草蜢鱼": "指某种体细长、青绿色、游动极快的鳂科或鰕虎鱼科小鱼，因形态似草蜢而得名。",
  "石首鱼": "即石首鱼科的大黄鱼（Larimichthys crocea）或小黄鱼。脑中有两枚白色耳石（石首），肉质细嫩，为传统海产珍馐。",
  "黄鱨鱼": "即鲿科的某种海鲇或黄颡鱼的海洋近亲。体色金黄，无鳞多黏液，肉质细腻滑嫩。",
  "四腮鲈": "指著名的松江鲈（Trachidermus fasciatus）。鳃盖上有两条红色的斜带，形似有四鳃，肉质肥美冠绝天下。",
  "海鲫鱼": "指九棘立旗鲷或某种形似鲫鱼的鲷科鱼类。骨骼坚硬，肉质厚实，是我国近海常见的底栖鱼类。",
  "红鱼": "指某种身体全红的鲷科或石斑鱼类（如赤点石斑鱼），色彩绚丽，为粤港人喜爱的名贵食用鱼。",
  "鳎鱼": "即鳎科或鲽科的比目鱼类。两眼均位于身体右侧或左侧，形如鞋底，肉质细嫩无刺。",
  "箬鱼": "状如竹叶的比目鱼类（如舌鳎），扁薄多肉，口感极佳，俗称鞋底鱼。",
  "海鱵": "对应鱵科（Hemiramphidae）鱼类。下颌延长如针，身体细长呈银白色，在海面成群飞掠。",
  "井鱼": "即巨型须鲸（如蓝鲸、灰鲸）的幼体。头顶喷水如井，古人视其为海中神物，喷水高达数丈。",
  "麻鱼": "即电鳐目（Torpediniformes）的某种电鳐。胸鳍特化为发电器官，能产生电流击昏猎物，人触之则手麻。",
  "马鲛鱼": "即鲅科的蓝点马鲛（Scomberomorus niphonius）。身有暗色斑点，肉质紧实，制成的马鲛鱼丸极其鲜美。",
  "鳓鱼": "即鲱形目鳓科的鳓鱼（Ilisha elongata），俗名曹白鱼。多细刺但肉质极美，常暴干制为三黎鲞。",
  "比目鱼": "鲽形目（Pleuronectiformes）鱼类的总称。两眼在身体同一侧，古人因其须并游而视其为爱情和贞匹的象征。",
  "鳗鲡": "指鳗鲡目海鳗科的某种海鳗，体呈蛇状，性凶猛，齿尖，闽粤人多暴干食之。",
  "鳗腮鱼": "可能是指某种体滑无鳞、腮部多肉的底栖鱼类，肉质细腻味甘美。",
  "海鳗": "指海鳗科（Muraenesocidae）鱼类。身体呈蛇形，口裂大，牙齿尖利凶猛，肉质肥美，可晒制为鳗鲞。",
  "竹鱼": "可能是指某种体侧有横带斑纹的鲹科鱼类（如竹荚鱼）或笛鲷，其形态侧扁如竹节，多栖息在岩礁中。",
  "龙头鱼": "即仙女鱼目龙头鱼科的龙头鱼（Harpadon nehereus），俗名豆腐鱼、九肚鱼。极鲜嫩，骨软肉滑。",
  "水沫鱼": "指某种微小的银鱼幼苗或虾苗，晶莹剔透半透明如水沫，晒干后常用来作汤，味道清甜。",
  "鹤鱼": "指某种口裂细长如鹤嘴的鹤鱵科（Belonidae）鱼类，身青绿，有细齿，常飞跃海面。",
  "黄": "可能指某种身体金黄的近海鲷科或鲫科鱼类，鳞片细密，肉质脆嫩，味极鲜美。",
  "钱串鱼": "可能指某种身上有环状圆形花纹的蝶鱼或刺尾鱼，色泽艳丽，因环纹如钱币而得名。",
  "参蕉鱼": "可能指某种体细如芭蕉叶的近海小型鱼类，常见于江浙沿海，肉质鲜嫩。",
  "兜甲鱼": "可能是指某种有硬甲壳的鲎科幼体或三叶虫的遗存想象，头部呈兜状坚硬甲壳。",
  "带鱼": "即带鱼科的带鱼（Trichiurus lepturus）。身体长条带状，银白无鳞，尾细如鞭，为我国著名海产。",
  "针鱼": "对应鱵科（Hemiramphidae）鱼类。下颌延长如针，身体细长呈银白色，在海面成群飞掠。",
  "血鳗": "即体色赤红的合鳃鱼科或蛇鳗科鱼类（如红血鳗），生活在深泥沙中，肉质极补。",
  "空头鱼": "可能指某种头部坚硬中空的鲬科鱼类或三叶鱼，骨多肉少，形态奇特。",
  "跳鱼": "即弹涂鱼（Periophthalmus）。生于海滩泥涂中，善用胸鳍跳跃，甚至能爬上树根，肉质细嫩。",
  "蠓鱼": "可能指某种身体极其微小的海洋鰕虎鱼或幼鱼，长仅寸许，成群在海礁石缝中游动。",
  "鼠鲇鱼": "指某种头尾尖细如鼠的鲇形目海鲇或鼠鱚科鱼类，无鳞，底栖沙泥中。",
  "海翁": "指巨型须鲸（如蓝鲸、灰鲸）。其头顶喷水如井，古人视其为海中神物，背部积沙甚至能生草木。",
  "蛟龙": "中国古代神话中的鳞介之长或龙族异兽。在《海错图》中多代表古人对深海未知巨型生物或极端风暴天象的神格化想象。",
  "人鱼": "多被认为是海洋哺乳动物儒艮（Dugong dugon）的误传，其抱仔哺乳及浮出海面的姿态常被渔民误认为美人鱼。",
  "龙鱼": "吕宋或安南产的奇异海兽，可能对应现代某种大型深海海兽或鲟鱼的异化描述。",
  "螭虎鱼": "可能指带有虎斑花纹、身披坚硬骨板的鲉科或科鱼类，头大有四鳍如足。",
  "刺鲇": "即体侧长有硬刺的鲇形目海鲇科鱼类，常伏于底泥中，刺有微毒，需防范。",
  "虬龙": "传说中有角的幼龙，古人常以虬龙指代暴风雨中跃出海面的巨型海蛇或海兽。",
  "神龙": "古代神话图腾的巅峰，代表了风雨雷电等自然威能，聂璜将其收录代表了对海洋万物之源的敬畏。",
  "海鳝": "指鳝科或蛇鳗科的底栖鱼类。身长如蛇，牙齿尖利，常在岩礁缝隙中伺机捕食，性凶猛。",
  "盐龙": "指生活在高盐环境的蜥蜴类，或传说中可溶于盐的龙种幼体，体小呈龙形。",
  "刺鱼": "指鲀形目或刺背鱼科的多刺鱼类，伏于沙石之间，全身长有短刺御敌。",
  "海蛇": "即海蛇亚科（Hydrophiinae）动物。终生生活于海中，尾扁平如舵，具强烈的神经毒素。",
  "鳄鱼": "指湾鳄（Crocodylus porosus），现存最大的爬行类。身披厚重甲胄，性情极度残暴，能吞食人畜。",

  // Volume 3 (贝类与介类部分重要物种)
  "鲎鱼": "即鲎（Tachypleus tridentatus），被称为海洋活化石。其血液由于含有铜离子而呈现独特的蓝色，常雌雄相负而行。",
  "响螺": "即管角螺（Hemifusus tuba）。其壳巨大结实，口部宽阔，自古被渔民用作吹奏号角以联络，肉质脆嫩。",
  "鹦鹉螺": "即著名的鹦鹉螺（Nautilus pompilius），被称为“活化石”，拥有华丽的螺旋外壳和多气室结构，是极名贵的观赏贝类。",
  "泥螺": "即泥螺（Bullacta exarata），又名吐铁，壳极薄，主要栖息在滩涂中，是江浙沿海著名的腌制海鲜。",
  "寄居蟹": "即寄居蟹（Paguroidea），利用空的贝壳保护自己柔软的腹部，随着生长需要不断更换更大的贝壳，形成奇妙的共生现象。",
  "石决明": "即鲍鱼（Haliotidae）的贝壳，壳缘有九个孔洞，中药称石决明，具有明目通淋的功效，肉质极鲜美。",
  
  // Volume 2 (海鸟部分重要物种)
  "海鸥": "鸻形目鸥科鸟类的统称，羽毛多以白灰色为主，善于飞翔于海面，是海洋生态系统中最常见的鸟类之一。",
  "海燕": "鲱形目海燕科鸟类，体型较小，翅膀狭长，能顶着海上暴风飞翔，常在海面滑翔捕食小鱼。",
  "金丝燕": "雨燕目金丝燕属鸟类，其唾液与海藻胶结筑成的巢即为“燕窝”，自古被视为名贵的滋养补品。",
  "海鹦鹉": "指鸻形目海雀科的某种海雀（如花面角嘴海雀），其喙部鲜艳巨大形似鹦鹉，善于潜水捕鱼。"
};

export function getCreatureMeta(creature: Creature) {
  // Simple hash function of name to generate consistent random ratings
  let hash = 0;
  for (let i = 0; i < creature.name.length; i++) {
    hash = creature.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const delicious = Math.abs((hash % 5)) + 1; // 1 to 5 stars
  const danger = Math.abs(((hash >> 2) % 5)) + 1; // 1 to 5 stars
  
  // Categorize based on name keywords
  let category = '鱼类';
  if (creature.name.includes('蟹') || creature.name.includes('蚶') || creature.name.includes('螺') || creature.name.includes('蛤') || creature.name.includes('蛎') || creature.name.includes('蚌')) {
    category = '介类'; // Shellfish/Crabs
  } else if (creature.name.includes('鸟') || creature.name.includes('鸥') || creature.name.includes('燕') || creature.name.includes('鸭') || creature.name.includes('鸽') || creature.name.includes('鹰')) {
    category = '羽类'; // Birds/Fliers
  } else if (creature.name.includes('兽') || creature.name.includes('马') || creature.name.includes('狗') || creature.name.includes('豹') || creature.name.includes('驴') || creature.name.includes('猪') || creature.name.includes('牛') || creature.name.includes('獭') || creature.name.includes('豕')) {
    category = '兽类'; // Beasts
  } else if (creature.name.includes('怪') || creature.name.includes('鬼') || creature.name.includes('神') || creature.name.includes('妖') || creature.name.includes('蛟') || creature.name.includes('龙') || creature.name.includes('仙') || creature.name.includes('化生')) {
    category = '怪类'; // Monsters
  } else if (creature.name.includes('藻') || creature.name.includes('草') || creature.name.includes('树') || creature.name.includes('花') || creature.name.includes('笋') || creature.name.includes('乳')) {
    category = '草木类'; // Plants
  }
  
  const modernIdentification = modernIdentificationById.get(creature.id);
  const modernInfo = modernIdentification
    ? modernIdentification.rationale
    : FAMOUS_CREATURES_MAP[creature.name] || '暂未完成逐条考证；需回到原图、题记与地方名资料继续核验。';

  // Delicious commentary based on delicious rating and name hash
  let deliciousComment = '口感尚可，或有特殊药用价值，但需谨慎烹饪。';
  const commentOptions = {
    high: [
      `据史料记载肉质极其鲜美，适合清蒸或入羹，乃是海中珍馐！`,
      `味极甘美，肉质肥嫩，制为干鲞或生食皆为席上佳肴。`,
      `肉质紧实肥厚，风味浓郁，深受古今海人与饕餮之客喜爱。`
    ],
    mid: [
      `口感尚可，风味清淡，常用于熬汤或晒干作辅料以增鲜。`,
      `肉质细嫩但多细刺，食之需防鲠，宜作羹或煎炸以酥其骨。`,
      `口感平淡，肉粗骨硬，古人多剥皮或制为鱼丸以改善口感。`
    ],
    low: [
      `味道寡淡或腥气较重，口感怪异，现代多不推荐直接食用。`,
      `此物多有微毒或性寒，古书载食之不当可致疾，切忌擅自尝试。`,
      `肉质粗涩无味，古人多用于剥皮制鼓或作为药用，极少直接食用。`
    ]
  };
  
  if (delicious >= 4) {
    const list = commentOptions.high;
    deliciousComment = list[Math.abs(hash) % list.length];
  } else if (delicious === 3) {
    const list = commentOptions.mid;
    deliciousComment = list[Math.abs(hash) % list.length];
  } else {
    const list = commentOptions.low;
    deliciousComment = list[Math.abs(hash) % list.length];
  }
  
  return {
    delicious,
    danger,
    category,
    modernIdentification,
    modernInfo,
    deliciousComment
  };
}
