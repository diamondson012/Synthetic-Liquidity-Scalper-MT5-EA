import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  ShieldCheck, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  FolderTree, 
  Download,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { generateMQL5Zip } from '../mql5';

export const Documentation: React.FC = () => {
  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const zipBlob = await generateMQL5Zip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SyntheticLiquidityScalper_MT5_Package.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Card */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BookOpen className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-mono">Expert Advisor Documentation & MT5 Deployment Guide</h2>
            <p className="text-xs text-slate-400">Step-by-step setup, Strategy Tester handbook, parameter index, and risk limits</p>
          </div>
        </div>

        <button
          id="docs-download-zip-btn"
          onClick={handleDownloadZip}
          disabled={downloadingZip}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Download MT5 Package (.zip)</span>
        </button>
      </div>

      {/* 1. Step-by-Step MT5 Installation Guide */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>1. MetaTrader 5 Installation & Compilation Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
          <div className="p-3.5 bg-[#050811]/90 rounded-xl border border-white/[0.06] space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[11px] text-cyan-300">1</span>
              <span>Open MT5 Data Folder</span>
            </div>
            <p className="text-[11px] text-slate-400">
              In MetaTrader 5, click <strong>File &rarr; Open Data Folder</strong>. Navigate into the <code className="text-slate-200">MQL5</code> directory.
            </p>
          </div>

          <div className="p-3.5 bg-[#050811]/90 rounded-xl border border-white/[0.06] space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[11px] text-cyan-300">2</span>
              <span>Extract MQL5 Files</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Extract the zip archive so that <code className="text-slate-200">SyntheticLiquidityScalper.mq5</code> is in <code className="text-cyan-300">MQL5/Experts/</code> and all 15 <code className="text-slate-200">.mqh</code> files are in <code className="text-cyan-300">MQL5/Include/SyntheticScalper/</code>.
            </p>
          </div>

          <div className="p-3.5 bg-[#050811]/90 rounded-xl border border-white/[0.06] space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[11px] text-cyan-300">3</span>
              <span>Compile in MetaEditor</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Press <strong>F4</strong> in MT5 to launch MetaEditor. Open <code className="text-slate-200">Experts/SyntheticLiquidityScalper.mq5</code> and click <strong>Compile (F7)</strong>. Verify: <em>0 errors, 0 warnings</em>.
            </p>
          </div>

          <div className="p-3.5 bg-[#050811]/90 rounded-xl border border-white/[0.06] space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[11px] text-cyan-300">4</span>
              <span>Attach & Enable Algo Trading</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Open a <strong>Boom 1000</strong> or <strong>Crash 1000</strong> chart on <strong>M1 timeframe</strong>. Drag the EA onto the chart and ensure <strong>"Allow Algo Trading"</strong> is enabled.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Input Parameters Reference */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span>2. User Input Parameters Handbook</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3">Default Value</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Operational Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-slate-300 text-[11px]">
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-400">InpTradingMode</td>
                <td className="py-2.5 px-3 text-purple-300">MODE_BALANCED</td>
                <td className="py-2.5 px-3">General</td>
                <td className="py-2.5 px-3 text-slate-400">Conservative (Score &ge;80), Balanced (&ge;70), Aggressive (&ge;60)</td>
              </tr>
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-400">InpRiskPerTradePct</td>
                <td className="py-2.5 px-3 text-purple-300">1.0%</td>
                <td className="py-2.5 px-3">Risk</td>
                <td className="py-2.5 px-3 text-slate-400">Percentage of account balance risked per trade based on SL distance</td>
              </tr>
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-400">InpDailyLossLimitPct</td>
                <td className="py-2.5 px-3 text-purple-300">5.0%</td>
                <td className="py-2.5 px-3">Risk</td>
                <td className="py-2.5 px-3 text-slate-400">Hard daily drawdown threshold. Halts all new entries once reached</td>
              </tr>
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-400">InpMaxConsecutiveLosses</td>
                <td className="py-2.5 px-3 text-purple-300">3</td>
                <td className="py-2.5 px-3">Risk</td>
                <td className="py-2.5 px-3 text-slate-400">Automatic circuit breaker after 3 straight losses to prevent tilt</td>
              </tr>
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-400">InpGrowthTargetBalance</td>
                <td className="py-2.5 px-3 text-purple-300">$250.00</td>
                <td className="py-2.5 px-3">Growth Goal</td>
                <td className="py-2.5 px-3 text-slate-400">Account target goal. When reached, displays TARGET ACHIEVED and pauses</td>
              </tr>
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-400">InpUseBreakEven</td>
                <td className="py-2.5 px-3 text-purple-300">true (+1.0R)</td>
                <td className="py-2.5 px-3">Profit Protection</td>
                <td className="py-2.5 px-3 text-slate-400">Moves SL to entry + 2 pts once price reaches +1.0R in profit</td>
              </tr>
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-400">InpUsePartialClose</td>
                <td className="py-2.5 px-3 text-purple-300">true (30/40/30)</td>
                <td className="py-2.5 px-3">Profit Protection</td>
                <td className="py-2.5 px-3 text-slate-400">Secures 30% volume at TP1 (1.2R), 40% at TP2 (2.0R), remainder trails to TP3</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Synthetic Index Mechanics: Boom vs Crash */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>3. Synthetic Index Mechanics (Boom & Crash Asymmetry)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <div className="p-4 bg-[#050811]/90 rounded-xl border border-emerald-500/30 space-y-2 shadow-inner">
            <span className="text-emerald-400 font-bold text-xs block">⚡ Boom Indices (Boom 1000, 500, 300)</span>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
              <li>Price slowly ticks downward and spikes <strong>suddenly upward</strong> in 1 tick.</li>
              <li>BUY setups align with the spike direction when demand zones & order blocks form.</li>
              <li>The EA enforces a cooldown period after explosive spike candles to avoid chasing at the top.</li>
            </ul>
          </div>

          <div className="p-4 bg-[#050811]/90 rounded-xl border border-rose-500/30 space-y-2 shadow-inner">
            <span className="text-rose-400 font-bold text-xs block">⚡ Crash Indices (Crash 1000, 500, 300)</span>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
              <li>Price slowly climbs upward and flash drops <strong>suddenly downward</strong>.</li>
              <li>SELL setups align with the drop direction when supply zones & bearish order blocks form.</li>
              <li>The EA calculates Stop Loss safely outside the institutional rejection wick.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Strategy Tester Optimization Checklist */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-3 font-mono text-xs">
        <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span>4. Strategy Tester & Quantitative Optimization Checklist</span>
        </h3>

        <div className="space-y-2 text-[11px] text-slate-300">
          <div className="flex items-start gap-2 bg-[#050811]/90 p-3 rounded-xl border border-white/[0.06] shadow-inner">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span><strong>Model:</strong> Use <em>"Every tick based on real ticks"</em> for authentic synthetic tick distribution.</span>
          </div>
          <div className="flex items-start gap-2 bg-[#050811]/90 p-3 rounded-xl border border-white/[0.06] shadow-inner">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span><strong>Optimization Metric:</strong> Select <em>"Custom criteria"</em> in MT5. The EA's built-in <code className="text-cyan-300">OnTester()</code> balances Profit Factor, Recovery Factor, and Loss Streak penalties.</span>
          </div>
          <div className="flex items-start gap-2 bg-[#050811]/90 p-3 rounded-xl border border-white/[0.06] shadow-inner">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span><strong>Walk-Forward Testing:</strong> Divide historical data into 70% In-Sample (optimization) and 30% Out-of-Sample (forward validation) to prevent curve-fitting.</span>
          </div>
        </div>
      </div>

    </div>
  );
};
