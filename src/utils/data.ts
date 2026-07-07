import vol1 from '../data/vol1.json';
import vol2 from '../data/vol2.json';
import vol3 from '../data/vol3.json';
import vol4 from '../data/vol4.json';

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

// Map creature index to custom metadata (danger rating, flavor/edibility rating, types)
// Since we are SSG, we can define a deterministic mapping based on ID or name hash.
// This adds fun gamified parameters like "美味指数" (deliciousness) and "危险指数" (danger) which are perfect for social sharing!
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
  if (creature.name.includes('蟹') || creature.name.includes('蚶') || creature.name.includes('螺') || creature.name.includes('蛤')) {
    category = '介类'; // Shellfish/Crabs
  } else if (creature.name.includes('鸟') || creature.name.includes('禽') || creature.name.includes('羽')) {
    category = '羽类'; // Birds/Fliers
  } else if (creature.name.includes('兽') || creature.name.includes('马') || creature.name.includes('狗') || creature.name.includes('豹')) {
    category = '兽类'; // Beasts
  } else if (creature.name.includes('怪') || creature.name.includes('鬼') || creature.name.includes('神') || creature.name.includes('妖')) {
    category = '怪类'; // Monsters
  } else if (creature.name.includes('藻') || creature.name.includes('草') || creature.name.includes('树') || creature.name.includes('花')) {
    category = '草木类'; // Plants
  }
  
  // Fun short modern descriptions/interpretations based on category
  let modernInfo = '此物见于古籍，形态奇异。近代考证，多为远洋珍奇物种或古人对海洋生物的夸张想象。';
  if (category === '介类') {
    modernInfo = '类似于今日的某种螃蟹或双壳贝类，壳体坚硬，古人常赞其肉质肥美。';
  } else if (category === '鱼类') {
    modernInfo = '海洋鱼类的一种，从斑纹和身形推断，极有可能是某种鲨鱼、鳐鱼或比目鱼的近亲。';
  } else if (category === '怪类') {
    modernInfo = '带有强烈神话色彩的海洋“海怪”，可能是古人目击巨型乌贼、鲸鱼等生物后的艺术加工渲染。';
  }

  // Delicious commentary
  let deliciousComment = '味道寡淡或口感怪异，不推荐尝试。';
  if (delicious >= 4) {
    deliciousComment = '据记载肉质极其鲜美，适合蒸煮，乃海中珍馐！';
  } else if (delicious === 3) {
    deliciousComment = '口感尚可，或有特殊药用价值，但需谨慎烹饪。';
  }
  
  return {
    delicious,
    danger,
    category,
    modernInfo,
    deliciousComment
  };
}
