import React, { useState, useCallback } from 'react';
import { History, X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

export default function ReplayMode({ historyData, onReplayFrame, onExit }) {
  const [sliderIndex, setSliderIndex] = useState(historyData.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = React.useRef(null);

  const total = historyData.length;
  const currentEntry = historyData[sliderIndex];
  const currentTime = currentEntry ? new Date(currentEntry.timestamp) : null;

  // Calculate uptime at this moment
  const results = currentEntry?.results || [];
  const upCount = results.filter(r => r.status === 'UP').length;
  const downCount = results.length - upCount;

  const goTo = useCallback((index) => {
    const clamped = Math.max(0, Math.min(total - 1, index));
    setSliderIndex(clamped);
    if (historyData[clamped]) {
      onReplayFrame(historyData[clamped].results);
    }
  }, [total, historyData, onReplayFrame]);

  const startPlay = () => {
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setSliderIndex(prev => {
        const next = prev + 1;
        if (next >= total) {
          clearInterval(playIntervalRef.current);
          setIsPlaying(false);
          return prev;
        }
        onReplayFrame(historyData[next].results);
        return next;
      });
    }, 400);
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => clearInterval(playIntervalRef.current);
  }, []);

  const handleSlider = (e) => {
    const index = parseInt(e.target.value, 10);
    goTo(index);
  };

  const formatTime = (date) => {
    if (!date) return '—';
    return date.toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const progressPercent = total > 1 ? (sliderIndex / (total - 1)) * 100 : 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:px-8 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="bento-card border-accent/20 border-2 bg-white/95 backdrop-blur-xl p-5 shadow-xl shadow-slate-200/50">

          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* DVR blinking indicator */}
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-orange-600 text-xs font-bold tracking-widest uppercase">Replay Mode</span>
              </div>
              <History size={16} className="text-slate-400" />
              <span className="text-slate-800 text-sm font-bold">
                {formatTime(currentTime)}
              </span>
            </div>

            {/* Status snapshot at this moment */}
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-success font-semibold">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                {upCount} UP
              </span>
              <span className="flex items-center gap-1.5 text-danger font-semibold">
                <span className="w-2 h-2 rounded-full bg-danger"></span>
                {downCount} DOWN
              </span>
              <span className="text-slate-500 font-medium">
                Check {sliderIndex + 1} / {total}
              </span>
            </div>

            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              title="Exit Replay Mode"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrubber Row */}
          <div className="flex items-center gap-3">
            {/* Step Back */}
            <button
              onClick={() => goTo(sliderIndex - 1)}
              disabled={sliderIndex === 0}
              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Play / Pause */}
            <button
              onClick={startPlay}
              className={`p-2 rounded-xl transition-colors ${isPlaying ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-blue-50 text-accent hover:bg-blue-100'}`}
              title={isPlaying ? 'Pause' : 'Play through history'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Step Forward */}
            <button
              onClick={() => goTo(sliderIndex + 1)}
              disabled={sliderIndex === total - 1}
              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>

            {/* The Slider Track */}
            <div className="flex-1 relative group">
              {/* Custom track background */}
              <div className="absolute inset-y-0 left-0 flex items-center w-full px-0 pointer-events-none">
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={total - 1}
                value={sliderIndex}
                onChange={handleSlider}
                className="
                  relative w-full h-2 appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-accent
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-125
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-accent
                  [&::-moz-range-thumb]:cursor-pointer
                "
              />
            </div>

            {/* Edge timestamps */}
            <div className="hidden lg:flex flex-col items-end text-[10px] text-slate-500 leading-tight shrink-0">
              <span>{formatTime(new Date(historyData[total - 1]?.timestamp))}</span>
              <span className="text-slate-400 font-medium">Latest</span>
            </div>
          </div>

          {/* Bottom hint */}
          <p className="text-[11px] text-slate-500 mt-3 text-center font-medium">
            You are viewing a historical snapshot — live data is paused. Drag the slider or press <kbd className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded shadow-sm">←</kbd> <kbd className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded shadow-sm">→</kbd> to scrub through time.
          </p>
        </div>
      </div>
    </div>
  );
}
