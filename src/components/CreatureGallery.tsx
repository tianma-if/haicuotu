import React, { useState, useMemo } from 'react';
import { getCreatureMeta, type Creature } from '../utils/data';
import { Search, Flame, ShieldAlert, Layers, Grid3X3 } from 'lucide-react';

interface CreatureGalleryProps {
  initialCreatures: Creature[];
}

export default function CreatureGallery({ initialCreatures }: CreatureGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolume, setSelectedVolume] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'delicious' | 'danger'>('id');

  const creaturesWithMeta = useMemo(() => {
    return initialCreatures.map(c => ({
      ...c,
      meta: getCreatureMeta(c)
    }));
  }, [initialCreatures]);

  const categories = useMemo(() => {
    const cats = new Set(creaturesWithMeta.map(c => c.meta.category));
    return ['all', ...Array.from(cats)];
  }, [creaturesWithMeta]);

  const filteredCreatures = useMemo(() => {
    let result = [...creaturesWithMeta];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term)
      );
    }

    if (selectedVolume !== 'all') {
      result = result.filter(c => c.volume === selectedVolume);
    }

    if (selectedCategory !== 'all') {
      result = result.filter(c => c.meta.category === selectedCategory);
    }

    if (sortBy === 'delicious') {
      result.sort((a, b) => b.meta.delicious - a.meta.delicious);
    } else if (sortBy === 'danger') {
      result.sort((a, b) => b.meta.danger - a.meta.danger);
    }

    return result;
  }, [creaturesWithMeta, searchTerm, selectedVolume, selectedCategory, sortBy]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-deep-sea">
          海錯圖譜 <span className="text-cinnabar-red">奇物大观</span>
        </h2>
        <p className="text-sm md:text-base text-ink-black/70 leading-relaxed font-sans">
          「错」者，杂也。清康熙年间，画家聂璜考察东南沿海，手绘数百种海洋异兽。本图鉴支持图文精准对应，还原前人笔下的神奇物产。
        </p>
      </div>

      <div className="bg-paper-light border border-paper-dark/30 p-6 rounded-sm shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-ink-black/40" />
            <input
              type="text"
              placeholder="搜索海怪名称、古文记载（例如：人鱼、沙鲨）..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-paper-dark/40 rounded-sm focus:outline-none focus:border-cinnabar-red transition-colors text-sm font-sans"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-black/60 whitespace-nowrap">排序方式：</span>
            <select
              className="bg-white border border-paper-dark/40 px-3 py-3 rounded-sm text-xs font-sans focus:outline-none focus:border-cinnabar-red"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="id">默认顺序</option>
              <option value="delicious">美味指数高至低</option>
              <option value="danger">危险度高至低</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-xs border-t border-paper-dark/20 pt-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-ink-black/50 flex items-center gap-0.5"><Layers className="w-3.5 h-3.5" /> 按册：</span>
            <button
              onClick={() => setSelectedVolume('all')}
              className={`px-2.5 py-1 rounded-sm border ${selectedVolume === 'all' ? 'bg-deep-sea text-paper-light border-deep-sea' : 'bg-white hover:bg-paper-dark/20 border-paper-dark/40'} transition-colors duration-200`}
            >
              全部四册
            </button>
            {[1, 2, 3, 4].map(vol => (
              <button
                key={vol}
                onClick={() => setSelectedVolume(vol)}
                className={`px-2.5 py-1 rounded-sm border ${selectedVolume === vol ? 'bg-deep-sea text-paper-light border-deep-sea' : 'bg-white hover:bg-paper-dark/20 border-paper-dark/40'} transition-colors duration-200`}
              >
                第 {vol} 册
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-ink-black/50 flex items-center gap-0.5"><Grid3X3 className="w-3.5 h-3.5" /> 分类：</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-sm border capitalize ${selectedCategory === cat ? 'bg-cinnabar-red text-paper-light border-cinnabar-red' : 'bg-white hover:bg-paper-dark/20 border-paper-dark/40'} transition-colors duration-200`}
              >
                {cat === 'all' ? '全部分类' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredCreatures.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreatures.map((creature) => (
            <a
              href={`/creatures/${creature.id}`}
              key={creature.id}
              className="group bg-paper-light ink-border p-4 flex flex-col justify-between hover:no-underline rounded-sm h-full"
            >
              <div className="space-y-4">
                <div className="bg-white border border-paper-dark/40 aspect-[4/3] rounded-sm overflow-hidden flex items-center justify-center relative">
                  {creature.image ? (
                    <img
                      src={creature.image}
                      alt={creature.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <p className="font-display text-lg text-ink-black/40">书卷白描图缺</p>
                      <p className="text-[10px] text-ink-black/30 font-sans mt-1">（序言段落或排版无插图）</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-cinnabar-red/10 border border-cinnabar-red/35 text-cinnabar-red px-1.5 py-0.5 text-[10px] font-display font-bold shadow-sm rounded-sm">
                    卷 {creature.volume}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-display text-xl font-black group-hover:text-cinnabar-red transition-colors duration-300">
                      {creature.name}
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-deep-sea/10 text-deep-sea font-sans">
                      {creature.meta.category}
                    </span>
                  </div>

                  <p className="text-xs text-ink-black/70 line-clamp-3 leading-relaxed font-sans">
                    {creature.description}
                  </p>
                </div>
              </div>

              <div className="border-t border-paper-dark/30 pt-3 mt-4 flex items-center justify-between text-[11px] font-sans text-ink-black/60">
                <div className="flex items-center gap-0.5">
                  <Flame className="w-3.5 h-3.5 text-cinnabar-red fill-current" />
                  <span>美味:</span>
                  <span className="font-bold text-ink-black">{'★'.repeat(creature.meta.delicious)}{'☆'.repeat(5 - creature.meta.delicious)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-deep-sea fill-current" />
                  <span>危险:</span>
                  <span className="font-bold text-ink-black">{'★'.repeat(creature.meta.danger)}{'☆'.repeat(5 - creature.meta.danger)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-paper-light border border-paper-dark/20 rounded-sm">
          <p className="font-display text-xl text-ink-black/50">未得见此等异兽</p>
          <p className="text-xs text-ink-black/40 mt-1 font-sans">可以尝试调整检索词或过滤条件</p>
        </div>
      )}
    </div>
  );
}
