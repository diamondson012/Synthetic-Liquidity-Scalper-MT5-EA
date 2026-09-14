export type SyntheticSymbol = 
  | 'BOOM_1000'
  | 'CRASH_1000'
  | 'BOOM_500'
  | 'CRASH_500'
  | 'BOOM_300'
  | 'CRASH_300'
  | 'VOLATILITY_75'
  | 'STEP_INDEX';

export type Timeframe = 'M1' | 'M5' | 'M15';

export type MarketBias = 'Strong Bullish' | 'Weak Bullish' | 'Neutral' | 'Weak Bearish' | 'Strong Bearish';

export type SignalQuality = 'A+' | 'A' | 'B' | 'C' | 'D';

export type EAState = 
  | 'WAITING'
  | 'ANALYZING'
  | 'SETUP_FORMING'
  | 'LIQUIDITY_DETECTED'
  | 'CONFIRMATION_REQUIRED'
  | 'SIGNAL_READY'
  | 'TRADE_EXECUTED'
  | 'MANAGING_TRADE'
  | 'PROFIT_PROTECTION'
  | 'COOLDOWN'
  | 'RISK_LIMIT'
  | 'TARGET_ACHIEVED';

export type TradingMode = 'Conservative' | 'Balanced' | 'Aggressive';

export type SLMode = 'Structure' | 'ATR' | 'Structure + ATR' | 'Dynamic';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Zone {
  id: string;
  type: 'Supply' | 'Demand' | 'Bullish_OB' | 'Bearish_OB' | 'Bullish_FVG' | 'Bearish_FVG' | 'Liquidity_High' | 'Liquidity_Low';
  topPrice: number;
  bottomPrice: number;
  startTime: number;
  endTime?: number;
  isFresh: boolean;
  score: number;
  testedCount: number;
  timeframe: Timeframe;
}

export interface StructurePoint {
  time: number;
  price: number;
  type: 'HH' | 'HL' | 'LH' | 'LL';
  label: string;
}

export interface StructureBreak {
  time: number;
  price: number;
  type: 'BOS' | 'CHOCH';
  direction: 'Bullish' | 'Bearish';
}

export interface SetupConfluence {
  structureScore: number;    // max 20
  liquidityScore: number;    // max 20
  supplyDemandScore: number; // max 15
  orderBlockScore: number;   // max 15
  fvgScore: number;          // max 10
  candleScore: number;       // max 10
  momentumScore: number;     // max 5
  volatilityScore: number;   // max 5
  totalScore: number;        // max 100
  quality: SignalQuality;
  reasonsWhy: string[];
  reasonsWhyNot: string[];
}

export interface ActiveTrade {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  initialSL: number;
  tp1: number;
  tp2: number;
  tp3: number;
  openTime: number;
  profit: number;
  pips: number;
  rMultiple: number;
  stage: 'OPEN' | 'TP1_HIT' | 'TP2_HIT' | 'TRAILING' | 'BREAK_EVEN';
  tp1ClosedPercent: number;
  tp2ClosedPercent: number;
  setupScore: number;
  entryReason: string;
}

export interface AccountState {
  balance: number;
  equity: number;
  startingTargetBalance: number;
  targetBalance: number;
  dailyTarget: number;
  weeklyTarget: number;
  dailyProfit: number;
  weeklyProfit: number;
  dailyLossLimitPercent: number;
  maxConsecutiveLosses: number;
  consecutiveLosses: number;
  tradesToday: number;
  maxTradesPerDay: number;
  riskPercent: number;
  status: 'ACTIVE' | 'PAUSED' | 'RISK_LIMIT' | 'TARGET_ACHIEVED';
  isMicroAccountMode: boolean;
  buyEnabled: boolean;
  sellEnabled: boolean;
}

export interface TradeHistoryRecord {
  id: string;
  date: string;
  time: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  lotSize: number;
  riskPercent: number;
  setupScore: number;
  marketBias: MarketBias;
  liquidityCondition: string;
  bos: string;
  choch: string;
  orderBlock: string;
  supplyDemand: string;
  fvg: string;
  candlestickPattern: string;
  atr: number;
  rr: number;
  exitPrice: number;
  exitTime: string;
  profit: number;
  profitPercent: number;
  mfe: number; // Max Favorable Excursion
  mae: number; // Max Adverse Excursion
  entryReason: string;
  exitReason: string;
}

export interface SymbolSpecs {
  symbol: string;
  name: string;
  digits: number;
  point: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  tickValue: number;
  tickSize: number;
  stopLevel: number;
  contractSize: number;
  defaultSpread: number;
  type: 'BOOM' | 'CRASH' | 'VOLATILITY' | 'STEP';
  spikeDirection?: 'UP' | 'DOWN';
}

export interface MQL5File {
  name: string;
  path: string;
  description: string;
  category: 'Expert' | 'Core' | 'Engine' | 'Management' | 'UI' | 'Analytics';
  code: string;
}
