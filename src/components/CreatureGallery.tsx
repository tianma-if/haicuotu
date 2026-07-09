import React, { useState, useMemo } from 'react';
import { getCreatureMeta, type Creature } from '../utils/data';
import { Search, Flame, ShieldAlert, Layers, Grid3X3, SlidersHorizontal } from 'lucide-react';

interface CreatureGalleryProps {
  initialCreatures: Creature[];
}

export default function CreatureGallery({ initialCreatures }: CreatureGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolume, setSelectedVolume] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'delicious' | 'danger'>('id');
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const activeFilterCount = [
    selectedVolume !== 'all',
    selectedCategory !== 'all',
    sortBy !== 'id'
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="text-center space-y-1.5 max-w-2xl mx-auto">
        <h2 className="font-display text-2xl md:text-3xl font-black tracking-tight text-deep-sea leading-tight">
          海错图谱 <span className="text-cinnabar-red">奇物大观</span>
        </h2>
        <p className="text-xs md:text-sm text-ink-black/70 leading-5 font-sans">
          「错」者，杂也。清康熙年间，画家聂璜考察东南沿海，手绘数百种海洋异兽。
        </p>
      </div>

      <div className="bg-paper-light border border-paper-dark/30 p-3 md:p-4 rounded-sm shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 h-4 w-4 text-ink-black/40" />
            <input
              type="text"
              placeholder="搜索海怪名称、古文记载（例如：人鱼、沙鲨）..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-paper-dark/40 rounded-sm focus:outline-none focus:border-cinnabar-red transition-colors text-sm font-sans"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(open => !open)}
            className="md:hidden inline-flex items-center justify-center gap-2 border border-paper-dark/50 bg-white px-3 py-2.5 rounded-sm text-xs font-bold text-deep-sea"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
            筛选排序
            {activeFilterCount > 0 && (
              <span className="bg-cinnabar-red text-paper-light px-1.5 py-0.5 rounded-full text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className={`${filtersOpen ? 'flex' : 'hidden'} md:flex items-center gap-2`}>
            <span className="text-xs font-bold text-ink-black/60 whitespace-nowrap">排序方式：</span>
            <select
              className="w-full md:w-auto bg-white border border-paper-dark/40 px-3 py-2.5 rounded-sm text-xs font-sans focus:outline-none focus:border-cinnabar-red"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="id">默认顺序</option>
              <option value="delicious">美味指数高至低</option>
              <option value="danger">危险度高至低</option>
            </select>
          </div>
        </div>

        <div className={`${filtersOpen ? 'flex' : 'hidden'} md:flex flex-wrap items-center gap-y-2 gap-x-5 text-xs border-t border-paper-dark/20 pt-3`}>
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredCreatures.map((creature) => (
            <a
              href={`/creatures/${creature.id}`}
              key={creature.id}
              className="group bg-paper-light ink-border p-2.5 sm:p-3.5 md:p-4 flex flex-col justify-between hover:no-underline rounded-sm h-full min-w-0"
            >
              <div className="space-y-3 md:space-y-4 min-w-0">
                <div className="bg-white border border-paper-dark/40 aspect-[4/3] rounded-sm overflow-hidden flex items-center justify-center relative">
                  {creature.image || creature.meta.modernIdentification?.modernImage ? (
                    <div className="grid grid-cols-2 w-full h-full">
                      {creature.image ? (
                        <div className="relative min-w-0 border-r border-paper-dark/25 flex items-center justify-center bg-white">
                          <img
                            src={creature.image}
                            alt={`${creature.name}海错图原图`}
                            className="object-contain w-full h-full p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <span className="absolute left-1.5 bottom-1.5 bg-paper-light/90 border border-paper-dark/35 px-1.5 py-0.5 text-[9px] font-bold text-ink-black/55">
                            古图
                          </span>
                        </div>
                      ) : (
                        <div className="relative min-w-0 border-r border-paper-dark/25 flex items-center justify-center bg-paper-light/50 p-2 text-center">
                          <span className="text-[10px] text-ink-black/30 font-display">古图缺</span>
                        </div>
                      )}

                      {creature.meta.modernIdentification?.modernImage ? (
                        <div className="relative min-w-0 flex items-center justify-center bg-ink-black/[0.03]">
                          <img
                            src={creature.meta.modernIdentification.modernImage}
                            alt={`${creature.name}现代候选真物图`}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                          />
                          <span className="absolute left-1.5 bottom-1.5 bg-deep-sea/90 px-1.5 py-0.5 text-[9px] font-bold text-paper-light">
                            真物
                          </span>
                        </div>
                      ) : (
                        <div className="relative min-w-0 flex items-center justify-center bg-paper-light/50 p-2 text-center">
                          <span className="text-[10px] text-ink-black/30 font-display">真物缺</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="font-display text-lg text-ink-black/40">书卷白描图缺</p>
                      <p className="text-[10px] text-ink-black/30 font-sans mt-1">（序言段落或排版无插图）</p>
                    </div>
                  )}
                  <div className="hidden sm:block absolute top-2 right-2 text-[10px] font-sans text-ink-black/25">
                    卷 {creature.volume}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-display text-lg md:text-xl leading-tight font-black group-hover:text-cinnabar-red transition-colors duration-300 min-w-0 break-words">
                      {creature.name}
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-deep-sea/10 text-deep-sea font-sans shrink-0">
                      {creature.meta.category}
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-ink-black/70 line-clamp-2 md:line-clamp-3 leading-relaxed font-sans">
                    {creature.description}
                  </p>
                </div>
              </div>

              <div className="border-t border-paper-dark/25 pt-2 sm:pt-3 mt-3 sm:mt-4 flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-sans text-ink-black/60">
                <div className="inline-flex min-w-0 items-center gap-0.5 sm:gap-1 rounded-full bg-cinnabar-red/8 border border-cinnabar-red/20 px-1.5 sm:px-2 py-1">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cinnabar-red shrink-0" />
                  <span><span className="hidden sm:inline">美味 </span>{creature.meta.delicious}/5</span>
                </div>
                <div className="inline-flex min-w-0 items-center gap-0.5 sm:gap-1 rounded-full bg-deep-sea/8 border border-deep-sea/20 px-1.5 sm:px-2 py-1">
                  <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-deep-sea shrink-0" />
                  <span><span className="hidden sm:inline">危险 </span>{creature.meta.danger}/5</span>
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
