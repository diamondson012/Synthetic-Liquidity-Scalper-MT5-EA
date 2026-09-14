import React, { useState } from 'react';
import { 
  Pause, 
  Play, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Percent, 
  ShieldAlert, 
  Sliders, 
  Award,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SetupConfluence, ActiveTrade, AccountState, Timeframe } from '../types';

interface DecisionPanelProps {
  symbolName: string;
  timeframe: Timeframe;
  confluence: SetupConfluence;
  activeTrade: ActiveTrade | null;
  accountState: AccountState;
  onTogglePause: () => void;
  onCloseAll: () => void;
  onToggleBuy: () => void;
  onToggleSell: () => void;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  symbolName,
  timeframe,
  confluence,
  activeTrade,
  accountState,
  onTogglePause,
  onCloseAll,
  onToggleBuy,
  onToggleSell
}) => {
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const targetProgress = Math.max(0, Math.min(100, 
    ((accountState.equity - accountState.startingTargetBalance) / 
    (accountState.targetBalance - accountState.startingTargetBalance)) * 100
  ));

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 70) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="w-full lg:w-80 bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-2xl font-sans relative overflow-hidden">
      
      {/* Subtle top indicator glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Top Header Badge */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/80" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-cyan-300 uppercase">
              MT5 On-Chart HUD
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {symbolName} • {timeframe}
          </p>
        </div>

        <div className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border backdrop-blur-sm ${
          accountState.status === 'ACTIVE' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {accountState.status}
        </div>
      </div>

      {/* Market Structure Bias Matrix */}
      <div className="bg-[#050811]/90 rounded-xl p-2.5 border border-white/[0.06] shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5">
          <span>TF ALIGNMENT</span>
          <span>BIAS STATUS</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-slate-900/90 rounded-lg py-1 px-1.5 border border-white/[0.05]">
            <span className="text-[10px] text-slate-400 block font-mono">M15 Context</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">BULLISH</span>
          </div>
          <div className="bg-slate-900/90 rounded-lg py-1 px-1.5 border border-white/[0.05]">
            <span className="text-[10px] text-slate-400 block font-mono">M5 Intermed</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">BULLISH</span>
          </div>
          <div className="bg-slate-900/90 rounded-lg py-1 px-1.5 border border-white/[0.05]">
            <span className="text-[10px] text-slate-400 block font-mono">M1 Timing</span>
            <span className="text-xs font-bold text-cyan-400 font-mono">CHOCH + OB</span>
          </div>
        </div>
      </div>

      {/* Confluence Setup Score Thermometer */}
      <div className="bg-[#050811]/90 rounded-xl p-2.5 border border-white/[0.06] shadow-inner">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-slate-400 font-mono">SETUP SCORE</span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border backdrop-blur-sm ${getScoreColor(confluence.totalScore)}`}>
            {confluence.totalScore}/100 (Grade {confluence.quality})
          </span>
        </div>

        {/* Score Progress Track */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1.5 border border-white/[0.05]">
          <div 
            className={`h-full transition-all duration-500 shadow-sm ${
              confluence.totalScore >= 80 ? 'bg-emerald-400 shadow-emerald-500/50' :
              confluence.totalScore >= 70 ? 'bg-cyan-400 shadow-cyan-500/50' :
              confluence.totalScore >= 50 ? 'bg-amber-400 shadow-amber-500/50' : 'bg-rose-400 shadow-rose-500/50'
            }`}
            style={{ width: `${confluence.totalScore}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>0 (No Trade)</span>
          <span className="text-slate-400">Min: 70 (Valid)</span>
          <span>100 (A+)</span>
        </div>
      </div>

      {/* Active Trade / Signal Monitor */}
      {activeTrade ? (
        <div className="bg-gradient-to-br from-[#050811] to-slate-900/80 rounded-xl p-2.5 border border-cyan-500/40 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                activeTrade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {activeTrade.type} #{activeTrade.ticket}
              </span>
              <span className="text-xs font-mono text-slate-300 font-medium">
                {activeTrade.lotSize.toFixed(2)} Lots
              </span>
            </div>
            <span className={`text-xs font-mono font-bold ${activeTrade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeTrade.profit >= 0 ? '+' : ''}${activeTrade.profit.toFixed(2)} ({activeTrade.rMultiple.toFixed(1)}R)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400">
            <div>
              <span className="block text-slate-500">Entry</span>
              <span className="text-slate-200">{activeTrade.openPrice.toFixed(3)}</span>
            </div>
            <div>
              <span className="block text-slate-500">Stop Loss</span>
              <span className="text-rose-300">{activeTrade.sl.toFixed(3)}</span>
            </div>
            <div>
              <span className="block text-slate-500">TP2 (Main)</span>
              <span className="text-emerald-300">{activeTrade.tp2.toFixed(3)}</span>
            </div>
          </div>

          <div className="mt-2 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 p-1.5 rounded border border-cyan-500/30 flex items-center justify-between">
            <span>Stage: {activeTrade.stage}</span>
            <span>BE Lock: +1R (Active)</span>
          </div>
        </div>
      ) : (
        <div className="bg-[#050811]/90 rounded-xl p-2.5 border border-white/[0.06] text-center shadow-inner">
          <span className="text-xs text-slate-400 font-mono block">SIGNAL STATUS</span>
          <span className={`text-sm font-bold font-mono mt-0.5 block ${
            confluence.totalScore >= 70 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {confluence.totalScore >= 70 ? '🟢 BUY SIGNAL READY' : '🟡 WAITING FOR SMC CONFLUENCE'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            R:R Ratio: 1:2.4 • Dynamic SL: Structure + ATR
          </span>
        </div>
      )}

      {/* Account Growth & Micro Objective Tracker */}
      <div className="bg-[#050811]/90 rounded-xl p-2.5 border border-white/[0.06] shadow-inner">
        <div className="flex items-center justify-between text-xs font-mono mb-1">
          <span className="text-slate-400">EQUITY / TARGET</span>
          <span className="text-purple-300 font-bold">
            ${accountState.equity.toFixed(2)} → ${accountState.targetBalance.toFixed(2)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1 border border-white/[0.05]">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500 shadow-sm shadow-cyan-500/20"
            style={{ width: `${targetProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400 mt-2">
          <div>
            <span className="text-slate-500 block">Daily P/L</span>
            <span className={accountState.dailyProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {accountState.dailyProfit >= 0 ? '+' : ''}${accountState.dailyProfit.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Progress</span>
            <span className="text-purple-300 font-bold">{targetProgress.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-slate-500 block">Loss Streak</span>
            <span className={accountState.consecutiveLosses > 0 ? 'text-amber-400 font-bold' : 'text-slate-300 font-bold'}>
              {accountState.consecutiveLosses} / {accountState.maxConsecutiveLosses}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Control Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <button
          id="btn-hud-pause"
          onClick={onTogglePause}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            accountState.status === 'PAUSED'
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
          }`}
        >
          {accountState.status === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{accountState.status === 'PAUSED' ? 'RESUME EA' : 'PAUSE EA'}</span>
        </button>

        {showConfirmClose ? (
          <div className="flex items-center gap-1">
            <button
              id="btn-confirm-close"
              onClick={() => {
                onCloseAll();
                setShowConfirmClose(false);
              }}
              className="flex-1 py-2 rounded-xl text-[10px] font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-md shadow-rose-600/30"
            >
              CONFIRM
            </button>
            <button
              onClick={() => setShowConfirmClose(false)}
              className="px-2 py-2 rounded-xl text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              NO
            </button>
          </div>
        ) : (
          <button
            id="btn-hud-closeall"
            onClick={() => setShowConfirmClose(true)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all shadow-sm shadow-rose-500/10"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>CLOSE ALL</span>
          </button>
        )}
      </div>

      {/* Buy / Sell Direction Toggles */}
      <div className="grid grid-cols-2 gap-2">
        <button
          id="btn-toggle-buy"
          onClick={onToggleBuy}
          className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${
            accountState.buyEnabled
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-900/60 text-slate-600 border-white/[0.05] line-through'
          }`}
        >
          BUY: {accountState.buyEnabled ? 'ENABLED' : 'OFF'}
        </button>

        <button
          id="btn-toggle-sell"
          onClick={onToggleSell}
          className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${
            accountState.sellEnabled
              ? 'bg-rose-950/40 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/10'
              : 'bg-slate-900/60 text-slate-600 border-white/[0.05] line-through'
          }`}
        >
          SELL: {accountState.sellEnabled ? 'ENABLED' : 'OFF'}
        </button>
      </div>

    </div>
  );
};
