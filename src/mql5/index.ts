import { MQL5File } from '../types';
import { CODE_DEFINES_MQH } from './source_defines';
import { CODE_SYMBOL_MANAGER_MQH } from './source_symbol';
import { CODE_MARKET_STRUCTURE_MQH } from './source_structure';
import { CODE_LIQUIDITY_ENGINE_MQH } from './source_liquidity';
import { CODE_SUPPLY_DEMAND_MQH } from './source_supplydemand';
import { CODE_ORDER_BLOCK_MQH } from './source_orderblock';
import { CODE_FVG_ENGINE_MQH } from './source_fvg';
import { CODE_CANDLE_PATTERNS_MQH } from './source_candles';
import { CODE_MOMENTUM_ENGINE_MQH } from './source_momentum';
import { CODE_RISK_MANAGER_MQH } from './source_risk';
import { CODE_POSITION_MANAGER_MQH } from './source_position';
import { CODE_TRADE_ENGINE_MQH } from './source_trade';
import { CODE_SIGNAL_ENGINE_MQH } from './source_signal';
import { CODE_DASHBOARD_MQH } from './source_dashboard';
import { CODE_LOGGER_MQH } from './source_logger';
import { CODE_BACKTEST_METRICS_MQH } from './source_backtest';
import { CODE_SYNTHETIC_LIQUIDITY_SCALPER_MQ5 } from './source_main';
import JSZip from 'jszip';

export const ALL_MQL5_FILES: MQL5File[] = [
  {
    name: 'SyntheticLiquidityScalper.mq5',
    path: 'Experts/SyntheticLiquidityScalper.mq5',
    description: 'Master Expert Advisor file with multi-timeframe orchestration, inputs, state machine & MT5 events.',
    category: 'Expert',
    code: CODE_SYNTHETIC_LIQUIDITY_SCALPER_MQ5
  },
  {
    name: 'Defines.mqh',
    path: 'Include/SyntheticScalper/Defines.mqh',
    description: 'Global enums, data structures, state definitions, scores, and macro constants.',
    category: 'Core',
    code: CODE_DEFINES_MQH
  },
  {
    name: 'SymbolManager.mqh',
    path: 'Include/SyntheticScalper/SymbolManager.mqh',
    description: 'Dynamic broker specification detector, contract sizing, tick values, Boom/Crash classification & normalization.',
    category: 'Core',
    code: CODE_SYMBOL_MANAGER_MQH
  },
  {
    name: 'MarketStructure.mqh',
    path: 'Include/SyntheticScalper/MarketStructure.mqh',
    description: 'Swing High/Low detection, Higher-High / Lower-Low labeling, BOS (Break of Structure), and CHOCH (Change of Character).',
    category: 'Engine',
    code: CODE_MARKET_STRUCTURE_MQH
  },
  {
    name: 'LiquidityEngine.mqh',
    path: 'Include/SyntheticScalper/LiquidityEngine.mqh',
    description: 'Equal Highs (EQH), Equal Lows (EQL), Liquidity Sweeps, stop-hunts, and break-and-reclaim price events.',
    category: 'Engine',
    code: CODE_LIQUIDITY_ENGINE_MQH
  },
  {
    name: 'SupplyDemand.mqh',
    path: 'Include/SyntheticScalper/SupplyDemand.mqh',
    description: 'Institutional Supply & Demand zone finder, fresh vs retested classification, and scoring algorithms.',
    category: 'Engine',
    code: CODE_SUPPLY_DEMAND_MQH
  },
  {
    name: 'OrderBlock.mqh',
    path: 'Include/SyntheticScalper/OrderBlock.mqh',
    description: 'Bullish & Bearish Order Block detection, displacement impulse validation, and mitigation tracking.',
    category: 'Engine',
    code: CODE_ORDER_BLOCK_MQH
  },
  {
    name: 'FVGEngine.mqh',
    path: 'Include/SyntheticScalper/FVGEngine.mqh',
    description: '3-Candle Fair Value Gaps (FVG) and price imbalance boundaries with fresh / filled state monitoring.',
    category: 'Engine',
    code: CODE_FVG_ENGINE_MQH
  },
  {
    name: 'CandlePatterns.mqh',
    path: 'Include/SyntheticScalper/CandlePatterns.mqh',
    description: 'Engulfing, Hammer, Morning Star, Three White Soldiers, Marubozu, Harami and Tweezer confirmation scanner.',
    category: 'Engine',
    code: CODE_CANDLE_PATTERNS_MQH
  },
  {
    name: 'MomentumEngine.mqh',
    path: 'Include/SyntheticScalper/MomentumEngine.mqh',
    description: 'Multi-timeframe ATR, RSI velocity, volatility filtering, and anomaly rejection guards.',
    category: 'Engine',
    code: CODE_MOMENTUM_ENGINE_MQH
  },
  {
    name: 'RiskManager.mqh',
    path: 'Include/SyntheticScalper/RiskManager.mqh',
    description: 'Micro-Account position sizing, $10-$250 / $100-$2500 target trackers, daily loss limits & no-martingale logic.',
    category: 'Management',
    code: CODE_RISK_MANAGER_MQH
  },
  {
    name: 'PositionManager.mqh',
    path: 'Include/SyntheticScalper/PositionManager.mqh',
    description: '3-Stage Take Profit partials (30%/40%/30%), Break-Even lock at +1R, profit locks, and dynamic trailing stop.',
    category: 'Management',
    code: CODE_POSITION_MANAGER_MQH
  },
  {
    name: 'TradeEngine.mqh',
    path: 'Include/SyntheticScalper/TradeEngine.mqh',
    description: 'Robust market execution, retry handlers, anti-signal chasing, and unique signal ID duplicate protection.',
    category: 'Management',
    code: CODE_TRADE_ENGINE_MQH
  },
  {
    name: 'SignalEngine.mqh',
    path: 'Include/SyntheticScalper/SignalEngine.mqh',
    description: '0-100 Confluence scoring matrix, letter grades (A+, A, B, C, D), and natural-language "Why Trade / Why Not Trade" engine.',
    category: 'Engine',
    code: CODE_SIGNAL_ENGINE_MQH
  },
  {
    name: 'Dashboard.mqh',
    path: 'Include/SyntheticScalper/Dashboard.mqh',
    description: 'Top-right on-chart GUI with interactive control buttons [PAUSE], [CLOSE ALL], [BUY], [SELL] and SMC visual overlays.',
    category: 'UI',
    code: CODE_DASHBOARD_MQH
  },
  {
    name: 'Logger.mqh',
    path: 'Include/SyntheticScalper/Logger.mqh',
    description: 'Comprehensive CSV trade journal exporter (with MFE, MAE, SMC reasons) and formatted terminal logs.',
    category: 'Analytics',
    code: CODE_LOGGER_MQH
  },
  {
    name: 'BacktestMetrics.mqh',
    path: 'Include/SyntheticScalper/BacktestMetrics.mqh',
    description: 'Strategy Tester fitness optimizer, recovery factor, expected payoff, and risk of ruin quantitative algorithms.',
    category: 'Analytics',
    code: CODE_BACKTEST_METRICS_MQH
  }
];

// Helper to generate the complete MT5 zip bundle
export async function generateMQL5Zip(): Promise<Blob> {
  const zip = new JSZip();

  ALL_MQL5_FILES.forEach((file) => {
    // Put into MQL5 directory layout
    zip.file(`MQL5/${file.path}`, file.code);
  });

  // Add README and Quickstart
  zip.file('MQL5/README_INSTALLATION.txt', 
`SYNTHETIC LIQUIDITY SCALPER PRO - MT5 EXPERT ADVISOR
=====================================================
Copyright 2026, Quant SMC Engineering

INSTALLATION INSTRUCTIONS:
1. Open MetaTrader 5.
2. Click File -> Open Data Folder.
3. Open the "MQL5" folder.
4. Copy the "Experts" and "Include" folders from this zip into your MT5 "MQL5" directory.
5. In MetaTrader 5, press F4 to open MetaEditor.
6. In MetaEditor Navigator, find Experts -> SyntheticLiquidityScalper.mq5.
7. Click Compile (or press F7). Ensure 0 errors and 0 warnings.
8. Return to MT5, find the EA in Navigator -> Expert Advisors, and drag it onto your Boom 1000 / Crash 1000 / Synthetic chart (M1 timeframe).
9. Make sure "Allow Algo Trading" is enabled in MT5 toolbar.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
