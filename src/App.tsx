import { entryAllowed, riskLots, settle, advanceTrade } from './utils/trading';
import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ChartSimulator } from './components/ChartSimulator';
import { DecisionPanel } from './components/DecisionPanel';
import { ExplanationEngine } from './components/ExplanationEngine';
import { CodeHub } from './components/CodeHub';
import { RiskCalculator } from './components/RiskCalculator';
import { BacktestAnalytics } from './components/BacktestAnalytics';
import { Documentation } from './components/Documentation';
import { 
  SyntheticSymbol, 
  Timeframe, 
  EAState, 
  Candle, 
  ActiveTrade, 
  AccountState, 
  SetupConfluence, 
  Zone, 
  StructurePoint, 
  StructureBreak 
} from './types';
import { 
  generateSyntheticHistory, 
  analyzeSMCZones, 
  SYMBOL_SPECS_MAP 
} from './utils/syntheticData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'risk' | 'backtest' | 'docs'>('simulator');
  const [selectedSymbol, setSelectedSymbol] = useState<SyntheticSymbol>('BOOM_1000');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('M1');
  const [eaState, setEaState] = useState<EAState>('ANALYZING');
  
  // Candle History & Analysis State
  const [candles, setCandles] = useState<Candle[]>(() => generateSyntheticHistory('BOOM_1000', 80, 'M1'));
  const [zones, setZones] = useState<Zone[]>([]);
  const [swingPoints, setSwingPoints] = useState<StructurePoint[]>([]);
  const [structureBreaks, setStructureBreaks] = useState<StructureBreak[]>([]);
  const [confluence, setConfluence] = useState<SetupConfluence>({
    structureScore: 0,
    liquidityScore: 0,
    supplyDemandScore: 0,
    orderBlockScore: 0,
    fvgScore: 0,
    candleScore: 0,
    momentumScore: 0,
    volatilityScore: 0,
    totalScore: 0,
    quality: 'D',
    reasonsWhy: [],
    reasonsWhyNot: []
  });

  // Active Trade State
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);

  // Account State
  const [accountState, setAccountState] = useState<AccountState>({
    balance: 10.0,
    equity: 10.0,
    dailyProfit: 0.0,
    dailyLossLimitPercent: 5,
    tradesToday: 0, maxTradesPerDay: 10, riskPercent: 1,
    dailyTarget: 0, weeklyTarget: 0, weeklyProfit: 0, isMicroAccountMode: true,
    consecutiveLosses: 0,
    maxConsecutiveLosses: 3,
    status: 'ACTIVE',
    targetBalance: 250.0,
    startingTargetBalance: 10.0,
    buyEnabled: true,
    sellEnabled: true
  });

  // Playback Simulation Engine
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);

  // Re-run SMC Analysis whenever candles or symbol change
  const refreshSMCAnalysis = useCallback((currentCandles: Candle[]) => {
    const analysis = analyzeSMCZones(currentCandles, selectedTimeframe);
    setZones(analysis.zones);
    setSwingPoints(analysis.swingPoints);
    setStructureBreaks(analysis.structureBreaks);
    setConfluence(analysis.confluence);
  }, [selectedTimeframe]);

  // Handle Symbol Change
  useEffect(() => {
    const newCandles = generateSyntheticHistory(selectedSymbol, 80, selectedTimeframe);
    setCandles(newCandles);
    refreshSMCAnalysis(newCandles);
    setActiveTrade(null);
    setAccountState(acc => ({...acc, balance:10, equity:10, dailyProfit:0, consecutiveLosses:0, tradesToday:0, status:'ACTIVE'}));
  }, [selectedSymbol, selectedTimeframe, refreshSMCAnalysis]);

  // Initial SMC Analysis
  useEffect(() => {
    refreshSMCAnalysis(candles);
  }, []);

  // Tick & Bar Step Generator
  const stepNewBar = useCallback((forceSpike: boolean = false) => {
    {
      const prev = candles;
      if (prev.length === 0) return;
      const last = prev[prev.length - 1];
      const spec = SYMBOL_SPECS_MAP[selectedSymbol];
      const tfMinutes = selectedTimeframe === 'M1' ? 1 : (selectedTimeframe === 'M5' ? 5 : 15);
      const nextTime = last.time + tfMinutes * 60 * 1000;

      let open = last.close;
      let close = open;
      let high = open;
      let low = open;

      const isSpike = forceSpike || (Math.random() < spec.spikeProb);

      if (isSpike && spec.spikeDirection === 'UP') {
        const spikeSize = spec.spikeMagnitude * (0.8 + Math.random() * 0.5);
        close = open + spikeSize;
        high = close + (Math.random() * 2);
        low = open - (Math.random() * 0.5);
      } else if (isSpike && spec.spikeDirection === 'DOWN') {
        const spikeSize = spec.spikeMagnitude * (0.8 + Math.random() * 0.5);
        close = open - spikeSize;
        low = close - (Math.random() * 2);
        high = open + (Math.random() * 0.5);
      } else {
        let drift = (Math.random() - 0.48) * spec.volatility;
        if (spec.spikeDirection === 'UP') {
          drift -= spec.volatility * 0.35; // Boom downtick
        } else if (spec.spikeDirection === 'DOWN') {
          drift += spec.volatility * 0.35; // Crash uptick
        }
        close = open + drift;
        const spread = Math.abs(close - open);
        high = Math.max(open, close) + Math.random() * (spread * 0.6 + spec.volatility * 0.3);
        low = Math.min(open, close) - Math.random() * (spread * 0.6 + spec.volatility * 0.3);
      }

      const factor = Math.pow(10, spec.digits);
      open = Math.round(open * factor) / factor;
      close = Math.round(close * factor) / factor;
      high = Math.round(high * factor) / factor;
      low = Math.round(low * factor) / factor;

      const newCandle: Candle = {
        time: nextTime,
        open,
        high,
        low,
        close,
        volume: Math.floor(15 + Math.random() * 40)
      };

      const updated = [...prev.slice(1), newCandle];
      refreshSMCAnalysis(updated);

      // Manage Active Trade on new price
      if (activeTrade) {
        const result = advanceTrade(activeTrade, newCandle, spec.tickSize, spec.tickValue, spec.point);
        if (result.exit !== null) {
          const next = settle(accountState, result.trade.profit);
          setAccountState(next);
          setActiveTrade(null);
          setEaState(next.status === 'TARGET_ACHIEVED' ? 'TARGET_ACHIEVED' : next.status === 'RISK_LIMIT' ? 'RISK_LIMIT' : 'ANALYZING');
        } else {
          setActiveTrade(result.trade);
          setAccountState(acc => ({...acc, equity: acc.balance + result.trade.profit}));
        }
      } else {
        // Auto-Trigger trade if score >= 80 and active
        const analysis = analyzeSMCZones(updated, selectedTimeframe);
        if (analysis.confluence.totalScore >= 80 && accountState.status === 'ACTIVE') {
          const isBuy = spec.spikeDirection === 'UP';
          const slDistance = spec.volatility * 15;
          const entry = close;
          const sl = isBuy ? entry - slDistance : entry + slDistance;
          const tp1 = isBuy ? entry + slDistance * 1.2 : entry - slDistance * 1.2;
          const tp2 = isBuy ? entry + slDistance * 2.0 : entry - slDistance * 2.0;
          const tp3 = isBuy ? entry + slDistance * 3.5 : entry - slDistance * 3.5;

          const lotSize = riskLots(accountState.balance, accountState.riskPercent, slDistance, spec.tickSize, spec.tickValue, spec.minLot, spec.maxLot, spec.lotStep);
          if (entryAllowed(accountState, isBuy ? 'BUY' : 'SELL') && lotSize > 0) {
          setActiveTrade({
            ticket: Math.floor(100000 + Math.random() * 900000),
            symbol: selectedSymbol,
            type: isBuy ? 'BUY' : 'SELL',
            openPrice: entry,
            sl,
            tp1,
            tp2,
            tp3,
            lotSize,
            initialSL: sl, currentPrice: entry, pips: 0, tp1ClosedPercent: 0, tp2ClosedPercent: 0, entryReason: "Simulated confluence",
            openTime: nextTime,
            profit: 0,
            rMultiple: 0,
            setupScore: analysis.confluence.totalScore,
            stage: 'OPEN'
          });
          setAccountState(acc => ({...acc, tradesToday: acc.tradesToday + 1}));
          setEaState('TRADE_EXECUTED');
          }
        }
      }

      setCandles(updated);
    }
  }, [selectedSymbol, selectedTimeframe, activeTrade, accountState, candles, refreshSMCAnalysis]);

  // Simulation Clock Timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(250, 1500 / speed);
    const timer = setInterval(() => {
      stepNewBar(false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, stepNewBar]);

  // HUD Action Handlers
  const handleTogglePause = () => {
    setAccountState(acc => ({
      ...acc,
      status: (acc.status === 'RISK_LIMIT' || acc.status === 'TARGET_ACHIEVED') ? acc.status : acc.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED'
    }));
  };

  const handleCloseAll = () => {
    if (activeTrade) {
      setAccountState(acc => settle(acc, activeTrade.profit));
      setActiveTrade(null);
      setEaState('ANALYZING');
    }
  };

  const handleToggleBuy = () => {
    setAccountState(acc => ({ ...acc, buyEnabled: !acc.buyEnabled }));
  };

  const handleToggleSell = () => {
    setAccountState(acc => ({ ...acc, sellEnabled: !acc.sellEnabled }));
  };

  const handleReset = () => {
    const newCandles = generateSyntheticHistory(selectedSymbol, 80, selectedTimeframe);
    setCandles(newCandles);
    refreshSMCAnalysis(newCandles);
    setActiveTrade(null);
    setAccountState(acc => ({
      ...acc,
      balance: 10.0,
      equity: 10.0,
      dailyProfit: 0.0,
      consecutiveLosses: 0,
      tradesToday: 0,
      status: 'ACTIVE'
    }));
    setEaState('ANALYZING');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      
      {/* Immersive Ambient Glow Highlights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[30rem] h-[30rem] bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        selectedTimeframe={selectedTimeframe}
        setSelectedTimeframe={setSelectedTimeframe}
        eaState={eaState}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        <p role="status" className="text-amber-300 text-sm">Demo candidate — generated prices and illustrative symbol specifications, no broker connection. Risk limits may prevent trades on small balances. Session resets on symbol/timeframe changes. MT5 validation pending.</p>
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Chart + Decision Panel Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              <ChartSimulator
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
                candles={candles}
                zones={zones}
                swingPoints={swingPoints}
                structureBreaks={structureBreaks}
                activeTrade={activeTrade}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onStepBar={() => stepNewBar(false)}
                onReset={handleReset}
                onTriggerSpike={() => stepNewBar(true)}
                speed={speed}
                setSpeed={setSpeed}
              />

              <DecisionPanel
                symbolName={SYMBOL_SPECS_MAP[selectedSymbol].name}
                timeframe={selectedTimeframe}
                confluence={confluence}
                activeTrade={activeTrade}
                accountState={accountState}
                onTogglePause={handleTogglePause}
                onCloseAll={handleCloseAll}
                onToggleBuy={handleToggleBuy}
                onToggleSell={handleToggleSell}
              />
            </div>

            {/* Natural-Language Explanation Engine */}
            <ExplanationEngine
              confluence={confluence}
              activeTrade={activeTrade}
              minSetupScore={70}
            />
          </div>
        )}

        {activeTab === 'code' && <CodeHub />}
        {activeTab === 'risk' && <RiskCalculator />}
        {activeTab === 'backtest' && <BacktestAnalytics />}
        {activeTab === 'docs' && <Documentation />}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md py-4 px-6 text-center text-xs font-mono text-slate-500">
        <p>Synthetic Liquidity Scalper MT5 EA • Quantitative Smart Money Concepts & Micro-Account Architecture</p>
      </footer>

    </div>
  );
}
