import React, { useState } from 'react';
import { getCreatureMeta, type Creature } from '../utils/data';
import { Sparkles, RefreshCw } from 'lucide-react';

interface FortuneCardProps {
  creatures: Creature[];
}

export default function FortuneCard({ creatures }: FortuneCardProps) {
  const [shaking, setShaking] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [fortuneText, setFortuneText] = useState<{ yi: string; ji: string; desc: string } | null>(null);

  const fortunePool = [
    { yi: '乘风破浪', ji: '缘木求鱼', desc: '宜开拓进取，大展拳脚。今日宜行水路，凡事皆如顺水推舟。' },
    { yi: '潜水摸鱼', ji: '急功近利', desc: '宜休养生息，积蓄力量。如同深海怪鱼，静待时机方是上策。' },
    { yi: '口吐芬芳', ji: '口舌之争', desc: '宜多赞美他人。如同蚌蛤含珠，多说吉利话，运势自然通达。' },
    { yi: '披坚执锐', ji: '委曲求全', desc: '宜直面困难，像巨螯神蟹一样，今日行事宜果断，忌优柔寡断。' },
    { yi: '翻江倒海', ji: '随波逐流', desc: '今日宜表达自我，发挥创意。切莫因循守旧，要敢于打破常规。' },
    { yi: '随遇而安', ji: '作茧自缚', desc: '宜放宽心态。海洋浩瀚，水滴皆有归宿，顺其自然则心安。' },
    { yi: '广结善缘', ji: '独断专行', desc: '宜与人合作，多听建议。如群鱼汇聚，众人拾柴火焰高。' }
  ];

  const drawFortune = () => {
    setShaking(true);
    setSelectedCreature(null);
    setFortuneText(null);

    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * creatures.length);
      const creature = creatures[randomIdx];
      setSelectedCreature(creature);

      const randomFortune = fortunePool[Math.floor(Math.random() * fortunePool.length)];
      setFortuneText(randomFortune);
      
      setShaking(false);
    }, 1200);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl md:text-4xl font-black text-deep-sea">
          每日海怪 <span className="text-cinnabar-red">运势求签</span>
        </h2>
        <p className="text-xs md:text-sm text-ink-black/60 font-sans">
          摇一摇签筒，抽取你的今日灵兽，探寻百年前奇妙海洋生灵赠予你的运势吉凶。
        </p>
      </div>

      <div className="bg-paper-light border-2 border-ink-black p-6 rounded-sm shadow-md text-center space-y-6 min-h-[360px] flex flex-col justify-center items-center relative">
        <div className="absolute top-2 left-2 text-paper-dark font-display text-xs">卍</div>
        <div className="absolute top-2 right-2 text-paper-dark font-display text-xs">卍</div>
        <div className="absolute bottom-2 left-2 text-paper-dark font-display text-xs">卍</div>
        <div className="absolute bottom-2 right-2 text-paper-dark font-display text-xs">卍</div>

        {!selectedCreature && !shaking && (
          <div className="space-y-6 py-6">
            <div className="w-24 h-24 bg-cinnabar-red/10 border border-cinnabar-red/35 flex items-center justify-center rounded-full text-cinnabar-red animate-float">
              <Sparkles className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-deep-sea">心诚则灵</h3>
              <p className="text-xs text-ink-black/50 font-sans">闭目静心三秒，点击下方按钮求签</p>
            </div>
            <button
              onClick={drawFortune}
              className="stamp-btn px-8 py-3.5 border-2 border-cinnabar-red text-cinnabar-red font-display text-lg font-bold shadow-md hover:cursor-pointer"
            >
              诚心求签
            </button>
          </div>
        )}

        {shaking && (
          <div className="space-y-6 py-12">
            <div className="w-20 h-20 bg-deep-sea/10 border border-deep-sea/40 flex items-center justify-center rounded-full text-deep-sea animate-bounce">
              <RefreshCw className="w-10 h-10 animate-spin" />
            </div>
            <p className="font-display text-lg font-bold text-deep-sea animate-pulse">
              签筒摇晃中，吉凶显现...
            </p>
          </div>
        )}

        {selectedCreature && fortuneText && (
          <div className="space-y-5 w-full animate-fade-in">
            <div className="bg-[#b83b3b]/10 border border-[#b83b3b]/40 text-[#b83b3b] font-display text-xs font-bold px-3 py-1 rounded-sm inline-block">
              今日守护海怪
            </div>

            <div className="border border-paper-dark/40 bg-white aspect-[4/3] max-w-[260px] mx-auto rounded-sm overflow-hidden flex items-center justify-center shadow-inner relative">
              {selectedCreature.image ? (
                <img
                  src={selectedCreature.image}
                  alt={selectedCreature.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-center p-4">
                  <p className="font-display text-sm text-ink-black/40">水墨白描图</p>
                </div>
              )}
            </div>

            <a
              href={`/creatures/${selectedCreature.id}`}
              className="font-display text-2xl font-black text-[#1f3b37] hover:text-[#b83b3b] inline-block border-b border-[#ebdcb9] pb-1"
            >
              {selectedCreature.name} ➔
            </a>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-paper-dark/30 py-3">
              <div className="text-center">
                <span className="inline-flex items-center gap-0.5 bg-cinnabar-red text-paper-light text-[10px] font-bold px-1.5 py-0.5 rounded-sm mb-1 font-display">
                  宜
                </span>
                <p className="font-display text-base font-bold text-cinnabar-red">{fortuneText.yi}</p>
              </div>
              <div className="text-center">
                <span className="inline-flex items-center gap-0.5 bg-deep-sea text-paper-light text-[10px] font-bold px-1.5 py-0.5 rounded-sm mb-1 font-display">
                  忌
                </span>
                <p className="font-display text-base font-bold text-deep-sea">{fortuneText.ji}</p>
              </div>
            </div>

            <p className="text-xs text-ink-black/70 leading-relaxed font-sans px-4">
              {fortuneText.desc}
            </p>

            <button
              onClick={drawFortune}
              className="text-xs text-cinnabar-red hover:underline font-display flex items-center justify-center gap-1 mx-auto pt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 觉得不准？重求一签
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
