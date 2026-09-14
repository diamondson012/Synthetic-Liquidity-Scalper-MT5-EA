import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  ShieldAlert, 
  TrendingUp, 
  FileSpreadsheet
} from 'lucide-react';
import { SetupConfluence, ActiveTrade } from '../types';

interface ExplanationEngineProps {
  confluence: SetupConfluence;
  activeTrade: ActiveTrade | null;
  minSetupScore: number;
}

export const ExplanationEngine: React.FC<ExplanationEngineProps> = ({
  confluence,
  activeTrade,
  minSetupScore
}) => {
  const isTradeActive = activeTrade !== null;
  const isSignalValid = confluence.totalScore >= minSetupScore;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* 1. "Why Did The EA Trade?" Panel */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl shadow-emerald-950/20 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wide">
                  "Why Did The EA Trade?" System
                </h3>
                <p className="text-[11px] text-slate-400">Rule-based quantitative confluence audit</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm shadow-sm">
              Score: {confluence.totalScore}/100
            </span>
          </div>

          <div className="space-y-2">
            {confluence.reasonsWhy.length > 0 ? (
              confluence.reasonsWhy.map((reason, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2 text-xs font-mono text-slate-300 bg-[#050811]/90 p-2.5 rounded-xl border border-white/[0.06] shadow-inner"
                >
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <span>{reason}</span>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-slate-500 italic p-3 text-center bg-[#050811]/80 rounded-xl border border-white/[0.04]">
                Awaiting market structure alignment and liquidity sweep events...
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Execution Type: <strong className="text-slate-200">Strict SMC Confluence</strong></span>
          <span>SL: <strong className="text-rose-400">Structure + ATR</strong></span>
          <span>R:R: <strong className="text-emerald-400">1:2.4+</strong></span>
        </div>
      </div>

      {/* 2. "Why Did The EA NOT Trade?" Panel */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-amber-950/20 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-sm shadow-amber-500/20">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wide">
                  "Why Did The EA NOT Trade?" System
                </h3>
                <p className="text-[11px] text-slate-400">Transparent execution filters & guardrails</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 backdrop-blur-sm shadow-sm">
              Filter Guard
            </span>
          </div>

          <div className="space-y-2">
            {isSignalValid ? (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/40 shadow-inner">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>All safety criteria passed: Confluence ({confluence.totalScore}) exceeds threshold ({minSetupScore}). Trade execution authorized.</span>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2 text-xs font-mono text-amber-300 bg-[#050811]/90 p-2.5 rounded-xl border border-white/[0.06] shadow-inner">
                  <span className="text-rose-400 font-bold mt-0.5">✗</span>
                  <span>Setup Score: {confluence.totalScore}/100 is below minimum threshold ({minSetupScore}/100 required).</span>
                </div>

                <div className="flex items-start gap-2 text-xs font-mono text-slate-300 bg-[#050811]/90 p-2.5 rounded-xl border border-white/[0.06] shadow-inner">
                  <span className="text-amber-400 font-bold mt-0.5">!</span>
                  <span>No signal chasing: Price has not returned to the 50% discount zone of the Bullish Order Block.</span>
                </div>

                <div className="flex items-start gap-2 text-xs font-mono text-slate-300 bg-[#050811]/90 p-2.5 rounded-xl border border-white/[0.06] shadow-inner">
                  <span className="text-cyan-400 font-bold mt-0.5">ℹ</span>
                  <span>Micro-Risk Filter: Lot calculation strictly bounded to avoid over-leveraging micro balances ($10-$100).</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Anti-Martingale: <strong className="text-emerald-400">ENFORCED</strong></span>
          <span>Duplicate Signal Lock: <strong className="text-cyan-400">ACTIVE</strong></span>
        </div>
      </div>

    </div>
  );
};
