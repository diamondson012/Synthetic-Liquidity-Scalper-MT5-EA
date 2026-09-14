import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Zap, 
  Eye, 
  Crosshair, 
  Maximize2,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { Candle, Zone, StructurePoint, StructureBreak, ActiveTrade, SyntheticSymbol, Timeframe } from '../types';
import { SYMBOL_SPECS_MAP } from '../utils/syntheticData';

interface ChartSimulatorProps {
  symbol: SyntheticSymbol;
  timeframe: Timeframe;
  candles: Candle[];
  zones: Zone[];
  swingPoints: StructurePoint[];
  structureBreaks: StructureBreak[];
  activeTrade: ActiveTrade | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepBar: () => void;
  onReset: () => void;
  onTriggerSpike: () => void;
  speed: number;
  setSpeed: (s: number) => void;
}

export const ChartSimulator: React.FC<ChartSimulatorProps> = ({
  symbol,
  timeframe,
  candles,
  zones,
  swingPoints,
  structureBreaks,
  activeTrade,
  isPlaying,
  onTogglePlay,
  onStepBar,
  onReset,
  onTriggerSpike,
  speed,
  setSpeed
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Overlay Visibility Filters
  const [showOrderBlocks, setShowOrderBlocks] = useState(true);
  const [showFVGs, setShowFVGs] = useState(true);
  const [showSupplyDemand, setShowSupplyDemand] = useState(true);
  const [showStructureBreaks, setShowStructureBreaks] = useState(true);
  const [showTradeLines, setShowTradeLines] = useState(true);

  const spec = SYMBOL_SPECS_MAP[symbol];

  // Draw Candlestick Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Determine Visible Price Bounds
    const visibleCount = Math.min(candles.length, 75);
    const visibleCandles = candles.slice(-visibleCount);

    let minPrice = Infinity;
    let maxPrice = -Infinity;

    visibleCandles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    // Add margin buffer
    const priceRange = maxPrice - minPrice || 1.0;
    const paddedMin = minPrice - priceRange * 0.12;
    const paddedMax = maxPrice + priceRange * 0.12;
    const totalPaddedRange = paddedMax - paddedMin;

    const priceToY = (price: number) => {
      return height - 30 - ((price - paddedMin) / totalPaddedRange) * (height - 60);
    };

    const barWidth = (width - 90) / visibleCount;
    const candleWidth = Math.max(3, barWidth * 0.68);

    // Helper for Candle X Coordinate
    const getCandleX = (index: number) => {
      return 20 + index * barWidth + barWidth / 2;
    };

    // 1. Draw SMC Zones (Supply, Demand, Order Blocks, FVGs)
    zones.forEach(zone => {
      const topY = priceToY(zone.topPrice);
      const bottomY = priceToY(zone.bottomPrice);
      const zoneHeight = Math.max(3, Math.abs(bottomY - topY));

      if (zone.type === 'Bullish_OB' && showOrderBlocks) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.fillRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);
        ctx.strokeRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);

        ctx.fillStyle = '#34d399';
        ctx.font = '10px monospace';
        ctx.fillText('Bullish OB [M1]', 25, Math.min(topY, bottomY) + 12);
      } else if (zone.type === 'Bearish_OB' && showOrderBlocks) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.fillRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);
        ctx.strokeRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);

        ctx.fillStyle = '#f87171';
        ctx.font = '10px monospace';
        ctx.fillText('Bearish OB [M1]', 25, Math.min(topY, bottomY) + 12);
      } else if (zone.type === 'Bullish_FVG' && showFVGs) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.fillRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);
        ctx.strokeRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);

        ctx.fillStyle = '#22d3ee';
        ctx.font = '9px monospace';
        ctx.fillText('Bullish FVG (Imbalance)', 30, Math.min(topY, bottomY) + 10);
      } else if (zone.type === 'Demand' && showSupplyDemand) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.fillRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);
        ctx.strokeRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);

        ctx.fillStyle = '#4ade80';
        ctx.font = '10px monospace';
        ctx.fillText('Institutional Demand Zone', 25, Math.min(topY, bottomY) + 12);
      } else if (zone.type === 'Supply' && showSupplyDemand) {
        ctx.fillStyle = 'rgba(225, 29, 72, 0.12)';
        ctx.strokeStyle = 'rgba(225, 29, 72, 0.5)';
        ctx.fillRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);
        ctx.strokeRect(20, Math.min(topY, bottomY), width - 110, zoneHeight);

        ctx.fillStyle = '#fb7185';
        ctx.font = '10px monospace';
        ctx.fillText('Institutional Supply Zone', 25, Math.min(topY, bottomY) + 12);
      }
    });

    // 2. Draw Candlesticks
    visibleCandles.forEach((c, idx) => {
      const x = getCandleX(idx);
      const isBull = c.close >= c.open;

      const openY = priceToY(c.open);
      const closeY = priceToY(c.close);
      const highY = priceToY(c.high);
      const lowY = priceToY(c.low);

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

      // Wick
      ctx.strokeStyle = isBull ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = isBull ? '#22c55e' : '#ef4444';
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // 3. Draw Swing High / Low Markers
    if (showStructureBreaks) {
      swingPoints.forEach(sp => {
        const candleIndex = visibleCandles.findIndex(c => Math.abs(c.time - sp.time) < 1000);
        if (candleIndex >= 0) {
          const x = getCandleX(candleIndex);
          const y = priceToY(sp.price);

          ctx.fillStyle = sp.type === 'HH' || sp.type === 'LH' ? '#f59e0b' : '#38bdf8';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(sp.label, x, sp.type.includes('H') ? y - 8 : y + 14);

          // Dot
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }

    // 4. Draw Active Trade Lines (Entry, SL, TP1, TP2, TP3)
    if (activeTrade && showTradeLines) {
      const entryY = priceToY(activeTrade.openPrice);
      const slY = priceToY(activeTrade.sl);
      const tp2Y = priceToY(activeTrade.tp2);

      // Entry line (Cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(20, entryY);
      ctx.lineTo(width - 80, entryY);
      ctx.stroke();

      // SL line (Rose)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(20, slY);
      ctx.lineTo(width - 80, slY);
      ctx.stroke();

      // TP line (Emerald)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(20, tp2Y);
      ctx.lineTo(width - 80, tp2Y);
      ctx.stroke();

      ctx.setLineDash([]); // reset

      // Labels on right axis
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`ENTRY: ${activeTrade.openPrice.toFixed(spec.digits)}`, width - 75, entryY + 3);

      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`SL: ${activeTrade.sl.toFixed(spec.digits)}`, width - 75, slY + 3);

      ctx.fillStyle = '#10b981';
      ctx.fillText(`TP2: ${activeTrade.tp2.toFixed(spec.digits)}`, width - 75, tp2Y + 3);
    }

    // 5. Draw Right Price Scale Axis
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(width - 80, 0, 80, height);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(width - 80, 0);
    ctx.lineTo(width - 80, height);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    const priceSteps = 6;
    for (let i = 0; i <= priceSteps; i++) {
      const p = paddedMin + (totalPaddedRange * i) / priceSteps;
      const y = priceToY(p);
      ctx.fillText(p.toFixed(spec.digits), width - 72, y + 4);
    }

    // Latest Current Price Marker
    const latestCandle = visibleCandles[visibleCandles.length - 1];
    if (latestCandle) {
      const currentY = priceToY(latestCandle.close);
      ctx.fillStyle = latestCandle.close >= latestCandle.open ? '#22c55e' : '#ef4444';
      ctx.fillRect(width - 80, currentY - 9, 80, 18);

      ctx.fillStyle = '#020617';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(latestCandle.close.toFixed(spec.digits), width - 74, currentY + 4);
    }

  }, [candles, zones, swingPoints, structureBreaks, activeTrade, showOrderBlocks, showFVGs, showSupplyDemand, showStructureBreaks, showTradeLines, symbol]);

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Top Chart Toolbar */}
      <div className="bg-[#050811]/90 border-b border-white/[0.08] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Playback & Simulation Controls */}
        <div className="flex items-center gap-2">
          <button
            id="chart-play-pause-btn"
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-400/20'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            <span>{isPlaying ? 'PAUSE TICK' : 'PLAY LIVE TICKS'}</span>
          </button>

          <button
            id="chart-step-btn"
            onClick={onStepBar}
            disabled={isPlaying}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-white/[0.06] disabled:opacity-40 transition-colors"
            title="Step to next synthetic bar"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next Bar</span>
          </button>

          <button
            id="chart-reset-btn"
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/[0.06] transition-colors"
            title="Reset history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-1 bg-slate-950 rounded-lg p-0.5 border border-white/[0.08]">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                  speed === s ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Spike Injection Button for Boom / Crash testing */}
          <button
            id="chart-trigger-spike-btn"
            onClick={onTriggerSpike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-mono font-bold shadow-md shadow-rose-500/20 transition-all active:scale-95"
            title="Simulate sudden synthetic index spike / flash drop"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>{spec.spikeDirection === 'UP' ? 'INJECT BOOM SPIKE' : spec.spikeDirection === 'DOWN' ? 'INJECT CRASH DROP' : 'INJECT VOLATILITY'}</span>
          </button>
        </div>

        {/* Right: SMC Overlay Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-white/[0.06] text-slate-300 cursor-pointer hover:border-emerald-500/40 transition-colors">
            <input
              type="checkbox"
              checked={showOrderBlocks}
              onChange={(e) => setShowOrderBlocks(e.target.checked)}
              className="rounded accent-emerald-500 w-3 h-3"
            />
            <span className="text-[11px] text-emerald-400 font-medium">Order Blocks</span>
          </label>

          <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-white/[0.06] text-slate-300 cursor-pointer hover:border-cyan-500/40 transition-colors">
            <input
              type="checkbox"
              checked={showFVGs}
              onChange={(e) => setShowFVGs(e.target.checked)}
              className="rounded accent-cyan-500 w-3 h-3"
            />
            <span className="text-[11px] text-cyan-400 font-medium">FVGs</span>
          </label>

          <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-white/[0.06] text-slate-300 cursor-pointer hover:border-purple-500/40 transition-colors">
            <input
              type="checkbox"
              checked={showSupplyDemand}
              onChange={(e) => setShowSupplyDemand(e.target.checked)}
              className="rounded accent-purple-500 w-3 h-3"
            />
            <span className="text-[11px] text-purple-300 font-medium">S/D Zones</span>
          </label>

          <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-white/[0.06] text-slate-300 cursor-pointer hover:border-amber-500/40 transition-colors">
            <input
              type="checkbox"
              checked={showStructureBreaks}
              onChange={(e) => setShowStructureBreaks(e.target.checked)}
              className="rounded accent-amber-500 w-3 h-3"
            />
            <span className="text-[11px] text-amber-400 font-medium">BOS / CHOCH</span>
          </label>
        </div>

      </div>

      {/* Candlestick Canvas Container */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[420px] bg-[#030712]">
        <canvas
          ref={canvasRef}
          width={840}
          height={460}
          className="w-full h-full block"
        />

        {/* Legend in Top-Left */}
        <div className="absolute top-3 left-3 bg-[#050811]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-2.5 text-[11px] font-mono text-slate-400 pointer-events-none space-y-0.5 shadow-2xl shadow-black">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <span className="text-cyan-400 font-bold">{spec.name}</span>
            <span className="text-slate-400">[{timeframe}]</span>
          </div>
          <p className="text-[10px] text-slate-500">{spec.description}</p>
          <div className="flex items-center gap-3 pt-1 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 inline-block" /> Demand / Bull OB
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50 inline-block" /> Supply / Bear OB
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 inline-block" /> FVG Imbalance
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
