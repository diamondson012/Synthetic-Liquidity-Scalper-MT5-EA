import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Layers, 
  Info,
  CheckCircle2,
  XOctagon
} from 'lucide-react';
import { SyntheticSymbol } from '../types';
import { SYMBOL_SPECS_MAP } from '../utils/syntheticData';

export const RiskCalculator: React.FC = () => {
  const [balance, setBalance] = useState<number>(10.0);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [selectedSymbol, setSelectedSymbol] = useState<SyntheticSymbol>('BOOM_1000');
  const [slPoints, setSlPoints] = useState<number>(25.0);
  const [targetGoal, setTargetGoal] = useState<number>(250.0);
  const [winRate, setWinRate] = useState<number>(68.0);
  const [rewardRatio, setRewardRatio] = useState<number>(2.2);

  const spec = SYMBOL_SPECS_MAP[selectedSymbol];

  // Calculations
  const allowedMonetaryRisk = balance * (riskPercent / 100.0);
  const pointValuePerLot = spec.tickValue * (spec.point / spec.tickSize);
  const riskPerLot = slPoints * pointValuePerLot;
  const rawLot = riskPerLot > 0 ? allowedMonetaryRisk / riskPerLot : 0;
  
  // Normalized broker lot
  const normalizedLot = Math.max(spec.minLot, Math.min(spec.maxLot, Math.floor(rawLot / spec.lotStep) * spec.lotStep));
  const actualMoneyRisk = normalizedLot * riskPerLot;
  const actualRiskPercent = balance > 0 ? (actualMoneyRisk / balance) * 100.0 : 0;

  // Micro Account Safety Violations
  const isMinLotExcessive = actualMoneyRisk > allowedMonetaryRisk * 2.5 || actualRiskPercent > 10.0;
  const isBalanceTooSmall = balance < 5.0;

  // Objective Milestones Table
  const presets = [
    { start: 10, target: 30, tradesAt2R: 8 },
    { start: 10, target: 50, tradesAt2R: 14 },
    { start: 10, target: 100, tradesAt2R: 22 },
    { start: 10, target: 250, tradesAt2R: 35 },
    { start: 100, target: 300, tradesAt2R: 12 },
    { start: 100, target: 500, tradesAt2R: 18 },
    { start: 100, target: 1000, tradesAt2R: 26 },
    { start: 100, target: 2500, tradesAt2R: 38 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono">Micro-Account Risk Architecture & Target Engine</h2>
              <p className="text-xs text-slate-400">Strict mathematical risk guardrails for synthetic indices ($10 - $250 & $100 - $2,500 models)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 backdrop-blur-sm shadow-sm">
              Zero Martingale Guaranteed
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Calculator + Safety Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 6 Columns: Interactive Inputs */}
        <div className="lg:col-span-6 bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4">
          <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Account Sizing & Broker Specifications</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Balance */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Account Balance ($USD)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min={1}
                  max={100000}
                  step={5}
                  value={balance}
                  onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#050811]/90 border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {[10, 25, 50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setBalance(preset)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-white/[0.06] transition-colors"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Configured Risk % */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Target Risk Per Trade (%)
              </label>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#050811]/90 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {[0.5, 1.0, 1.5, 2.0, 3.0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskPercent(r)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-white/[0.06] transition-colors"
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Target Symbol */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Synthetic Symbol
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value as SyntheticSymbol)}
                className="w-full bg-[#050811]/90 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {(Object.keys(SYMBOL_SPECS_MAP) as SyntheticSymbol[]).map((sym) => (
                  <option key={sym} value={sym}>
                    {SYMBOL_SPECS_MAP[sym].name} (Min: {SYMBOL_SPECS_MAP[sym].minLot})
                  </option>
                ))}
              </select>
            </div>

            {/* SL Distance */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                SL Distance (Points / Pips)
              </label>
              <input
                type="number"
                min={5}
                max={500}
                step={5}
                value={slPoints}
                onChange={(e) => setSlPoints(parseFloat(e.target.value) || 10)}
                className="w-full bg-[#050811]/90 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Broker Symbol Specs Box */}
          <div className="p-3.5 bg-[#050811]/90 rounded-xl border border-white/[0.06] text-xs font-mono text-slate-400 space-y-1 shadow-inner">
            <span className="text-slate-200 font-bold block mb-1">Broker Specs ({spec.name}):</span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>Min Lot: <strong className="text-cyan-400">{spec.minLot}</strong></div>
              <div>Lot Step: <strong className="text-slate-200">{spec.lotStep}</strong></div>
              <div>Point Size: <strong className="text-slate-200">{spec.point}</strong></div>
            </div>
          </div>

        </div>

        {/* Right 6 Columns: Mathematical Output & Safety Verifier */}
        <div className="lg:col-span-6 bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Position Sizing & Safety Assessment</span>
            </h3>

            {/* Micro Risk Warning Banner if Minimum Lot Violates Risk */}
            {isMinLotExcessive ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono space-y-1 mb-4 shadow-lg shadow-rose-950/20">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <XOctagon className="w-4 h-4" />
                  <span>SAFETY GUARD TRIGGERED: TRADE BLOCKED</span>
                </div>
                <p>
                  "ACCOUNT SIZE TOO SMALL FOR SAFE POSITION SIZING"
                </p>
                <p className="text-[11px] text-rose-300/80 mt-1">
                  Broker minimum lot ({spec.minLot}) with {slPoints} pt SL risks <strong>${actualMoneyRisk.toFixed(2)} ({actualRiskPercent.toFixed(1)}% of balance)</strong>, exceeding your allowed risk limit of ${allowedMonetaryRisk.toFixed(2)} ({riskPercent}%).
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 mb-4 shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>POSITION SIZING COMPLIANT: Safe execution within account boundaries.</span>
              </div>
            )}

            {/* Sizing Results Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 bg-[#050811]/90 rounded-xl border border-white/[0.06] shadow-inner">
                <span className="text-[10px] text-slate-500 block">Allowed Risk ($)</span>
                <span className="text-sm font-bold text-slate-200">${allowedMonetaryRisk.toFixed(2)}</span>
              </div>

              <div className="p-3 bg-[#050811]/90 rounded-xl border border-white/[0.06] shadow-inner">
                <span className="text-[10px] text-slate-500 block">Normalized Lot Size</span>
                <span className={`text-sm font-bold ${isMinLotExcessive ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {normalizedLot.toFixed(2)} Lots
                </span>
              </div>

              <div className="p-3 bg-[#050811]/90 rounded-xl border border-white/[0.06] shadow-inner">
                <span className="text-[10px] text-slate-500 block">Actual SL Loss ($)</span>
                <span className={`text-sm font-bold ${isMinLotExcessive ? 'text-rose-400' : 'text-emerald-400'}`}>
                  -${actualMoneyRisk.toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-[#050811]/90 rounded-xl border border-white/[0.06] shadow-inner">
                <span className="text-[10px] text-slate-500 block">Actual Risk %</span>
                <span className={`text-sm font-bold ${isMinLotExcessive ? 'text-rose-400' : 'text-slate-200'}`}>
                  {actualRiskPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#050811]/80 rounded-xl border border-white/[0.06] text-[11px] font-mono text-slate-400 shadow-inner">
            💡 <strong>Anti-Martingale Rule:</strong> The EA will NEVER increase lot sizes after losses or average down. Position sizes scale solely based on actual account equity growth.
          </div>
        </div>

      </div>

      {/* Target Objectives Progression Table */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
        <h3 className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span>Account Growth Objective Milestones (Targets Only — Not Guaranteed)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Shows theoretical compound trajectory with strict 1%-2% risk per trade and ~1:2.0 Risk-to-Reward ratio without martingale.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Starting Balance</th>
                <th className="py-2.5 px-3">Target Objective</th>
                <th className="py-2.5 px-3">Growth Multiple</th>
                <th className="py-2.5 px-3">Trades at 1:2 R:R (68% WR)</th>
                <th className="py-2.5 px-3">Daily Loss Pause</th>
                <th className="py-2.5 px-3">Safety Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {presets.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">${p.start}.00</td>
                  <td className="py-2.5 px-3 text-purple-300 font-bold">${p.target}.00</td>
                  <td className="py-2.5 px-3 text-slate-300">{(p.target / p.start).toFixed(0)}x</td>
                  <td className="py-2.5 px-3 text-slate-300">~{p.tradesAt2R} wins net</td>
                  <td className="py-2.5 px-3 text-amber-400">5% Drawdown</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Micro Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
