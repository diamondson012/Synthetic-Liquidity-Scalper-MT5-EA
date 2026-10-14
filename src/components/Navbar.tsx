import React, { useState } from 'react';
import { 
  Activity, 
  Code2, 
  ShieldCheck, 
  BarChart3, 
  BookOpen, 
  Download, 
  Sparkles, 
  Terminal, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { SyntheticSymbol, Timeframe, EAState } from '../types';
import { SYMBOL_SPECS_MAP } from '../utils/syntheticData';
import { generateMQL5Zip } from '../mql5';

interface NavbarProps {
  activeTab: 'simulator' | 'code' | 'risk' | 'backtest' | 'docs';
  setActiveTab: (tab: 'simulator' | 'code' | 'risk' | 'backtest' | 'docs') => void;
  selectedSymbol: SyntheticSymbol;
  setSelectedSymbol: (sym: SyntheticSymbol) => void;
  selectedTimeframe: Timeframe;
  setSelectedTimeframe: (tf: Timeframe) => void;
  eaState: EAState;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedSymbol,
  setSelectedSymbol,
  selectedTimeframe,
  setSelectedTimeframe,
  eaState
}) => {
  const [downloading, setDownloading] = useState(false);
  const [symMenuOpen, setSymMenuOpen] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setDownloading(true);
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
      console.error('Failed to generate zip:', err);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = () => {
    switch (eaState) {
      case 'SIGNAL_READY':
      case 'TRADE_EXECUTED':
      case 'MANAGING_TRADE':
        return { text: 'SIGNAL ACTIVE', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'PROFIT_PROTECTION':
        return { text: 'PROFIT LOCKED', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'COOLDOWN':
        return { text: 'COOLDOWN', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'RISK_LIMIT':
        return { text: 'RISK LIMIT PAUSED', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'TARGET_ACHIEVED':
        return { text: 'TARGET ACHIEVED', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      default:
        return { text: 'ANALYZING SMC', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
  };

  const status = getStatusBadge();

  return (
    <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 lg:px-6 py-3 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand & EA Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/40">
            <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">Synthetic Liquidity Scalper</h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                MT5 v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Institutional SMC & Micro-Account Quantitative EA</p>
          </div>
        </div>

        {/* Center Controls: Symbol & Timeframe Quick Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbol Dropdown */}
          <div className="relative">
            <button
              id="symbol-select-btn"
              onClick={() => setSymMenuOpen(!symMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/[0.08] hover:border-cyan-500/40 text-xs font-medium text-slate-200 transition-all shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{SYMBOL_SPECS_MAP[selectedSymbol]?.name || selectedSymbol}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {symMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-[#0b0f19]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 z-50 py-1.5 overflow-hidden">
                {(['BOOM_1000', 'CRASH_1000'] as SyntheticSymbol[]).map((symKey) => (
                  <button
                    key={symKey}
                    onClick={() => {
                      setSelectedSymbol(symKey);
                      setSymMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      selectedSymbol === symKey 
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold' 
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{SYMBOL_SPECS_MAP[symKey].name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {SYMBOL_SPECS_MAP[symKey].spikeDirection === 'UP' ? '⚡ Spike UP' : 
                       SYMBOL_SPECS_MAP[symKey].spikeDirection === 'DOWN' ? '⚡ Drop DOWN' : '〰 Sym'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center rounded-lg bg-slate-900/90 p-0.5 border border-white/[0.08]">
            {(['M1', 'M5', 'M15'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                id={`tf-btn-${tf}`}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* State Badge */}
          <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium shadow-sm backdrop-blur-sm ${status.bg}`}>
            {status.text}
          </div>
        </div>

        {/* Navigation Tabs & MT5 Package Download */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center bg-slate-900/80 backdrop-blur-md rounded-xl p-1 border border-white/[0.08]">
            <button
              id="nav-tab-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-white/10 text-cyan-300 shadow-sm border border-white/[0.06]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live HUD</span>
            </button>

            <button
              id="nav-tab-code"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-white/10 text-cyan-300 shadow-sm border border-white/[0.06]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>MQL5 Suite (16)</span>
            </button>

            <button
              id="nav-tab-risk"
              onClick={() => setActiveTab('risk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'risk'
                  ? 'bg-white/10 text-cyan-300 shadow-sm border border-white/[0.06]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Micro-Risk Lab</span>
            </button>

            <button
              id="nav-tab-backtest"
              onClick={() => setActiveTab('backtest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'backtest'
                  ? 'bg-white/10 text-cyan-300 shadow-sm border border-white/[0.06]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tester Analytics</span>
            </button>

            <button
              id="nav-tab-docs"
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'docs'
                  ? 'bg-white/10 text-cyan-300 shadow-sm border border-white/[0.06]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Setup Guide</span>
            </button>
          </nav>

          {/* Download MT5 ZIP */}
          <button
            id="download-mt5-zip-btn"
            onClick={handleDownloadZip}
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            title="Download full MetaTrader 5 Expert Advisor & Include files ready for MetaEditor"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{downloading ? 'Packaging...' : 'Export MT5 Zip'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
