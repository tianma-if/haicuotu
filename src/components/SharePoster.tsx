import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { getCreatureMeta, type Creature } from '../utils/data';
import { Share2, Sparkles, Smile } from 'lucide-react';

interface SharePosterProps {
  creature: Creature;
}

export default function SharePoster({ creature }: SharePosterProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const meta = getCreatureMeta(creature);

  const generatePoster = async () => {
    if (!cardRef.current) return;
    setRendering(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#fdfaf2',
        logging: false
      });
      
      const url = canvas.toDataURL('image/png');
      setDownloadUrl(url);
      
      const link = document.createElement('a');
      link.download = `海错图_${creature.name}.png`;
      link.href = url;
      link.click();
    } catch (e) {
      console.error('Failed to generate poster:', e);
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={generatePoster}
          disabled={rendering}
          className="stamp-btn flex items-center gap-2 px-6 py-3 border-2 border-cinnabar-red text-cinnabar-red font-display text-base font-bold shadow-sm hover:cursor-pointer disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />
          {rendering ? '正在雕琢字画...' : '一键生成收藏卡片'}
        </button>
      </div>

      <div className="border border-paper-dark/30 rounded-sm p-4 bg-paper-light/50 space-y-2">
        <h4 className="text-xs font-bold text-ink-black/50 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cinnabar-red animate-pulse" /> 卡片预览 (生成后可分享至小红书/微信)
        </h4>
        
        <div className="border border-paper-dark/20 max-w-sm mx-auto overflow-hidden shadow-md rounded-sm">
          <div
            ref={cardRef}
            className="bg-[#fdfaf2] p-6 space-y-5 font-sans relative text-ink-black w-[360px]"
            style={{ fontFamily: '"Outfit", "Inter", sans-serif' }}
          >
            <div className="flex justify-between items-center border-b border-[#ebdcb9] pb-3">
              <div>
                <span className="font-display text-lg font-black tracking-wider text-[#1f3b37]">
                  《海錯圖》圖鑑
                </span>
                <span className="text-[9px] text-ink-black/50 block font-sans tracking-widest uppercase">
                  Ancient Marine Album
                </span>
              </div>
              <div className="border-2 border-[#b83b3b] text-[#b83b3b] font-display text-xs font-bold px-1.5 py-0.5 rounded-sm">
                聂璜 绘
              </div>
            </div>

            <div className="border border-[#ebdcb9] aspect-[4/3] bg-white rounded-sm overflow-hidden flex items-center justify-center relative">
              {creature.image ? (
                <img
                  src={creature.image}
                  alt={creature.name}
                  className="object-cover w-full h-full"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="text-center p-4">
                  <p className="font-display text-base text-ink-black/40">水墨白描图</p>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-[#b83b3b] text-[#fdfaf2] px-1.5 py-0.5 text-[8px] font-display font-bold rounded-sm">
                第一册 • 第 {creature.page_idx} 开
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div className="font-display text-2xl font-black text-[#b83b3b] tracking-wider">
                  {creature.name}
                </div>
                <div className="text-[10px] bg-[#1f3b37]/10 text-[#1f3b37] px-2 py-0.5 rounded-full font-bold">
                  {meta.category}
                </div>
              </div>

              <div className="bg-[#fbf7eb] border border-[#ebdcb9]/60 p-3 rounded-sm">
                <p className="text-[11px] leading-relaxed text-ink-black/85 font-display tracking-wide italic">
                  {creature.description.slice(0, 100)}
                  {creature.description.length > 100 ? '...' : ''}
                </p>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-ink-black/60 border-t border-[#ebdcb9] pt-3">
              <div className="flex items-center gap-0.5">
                <span className="font-bold text-ink-black">美味指数:</span>
                <span className="text-[#b83b3b] font-bold">{'★'.repeat(meta.delicious)}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="font-bold text-ink-black">危险指数:</span>
                <span className="text-[#1f3b37] font-bold">{'★'.repeat(meta.danger)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[8px] text-ink-black/40 border-t border-[#ebdcb9]/40 pt-2">
              <span>海错图数字化共享计划</span>
              <span className="flex items-center gap-0.5"><Smile className="w-2.5 h-2.5 text-[#b83b3b]" /> 扫码或搜索线上访问</span>
            </div>
          </div>
        </div>
      </div>

      {downloadUrl && (
        <div className="bg-deep-sea/10 border border-deep-sea/25 p-3 rounded-sm text-xs font-sans text-deep-sea text-center">
          <p className="font-bold">✨ 卡片生成成功！</p>
          <p className="text-[10px] mt-0.5 opacity-90">移动端用户可长按卡片或点击浏览器下载，将其保存至相册分享。</p>
        </div>
      )}
    </div>
  );
}
