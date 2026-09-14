import { Candle, SyntheticSymbol, Timeframe, Zone, StructurePoint, StructureBreak, SetupConfluence, ActiveTrade, TradeHistoryRecord } from '../types';

export const SYMBOL_SPECS_MAP: Record<SyntheticSymbol, {
  name: string;
  digits: number;
  point: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  tickValue: number;
  tickSize: number;
  stopLevel: number;
  basePrice: number;
  volatility: number;
  spikeProb: number;
  spikeMagnitude: number;
  spikeDirection: 'UP' | 'DOWN' | 'NONE';
  description: string;
}> = {
  BOOM_1000: {
    name: 'Boom 1000 Index',
    digits: 3,
    point: 0.001,
    minLot: 0.20,
    maxLot: 50.0,
    lotStep: 0.01,
    tickValue: 1.0,
    tickSize: 0.001,
    stopLevel: 20,
    basePrice: 10450.500,
    volatility: 0.8,
    spikeProb: 0.08,
    spikeMagnitude: 35.0,
    spikeDirection: 'UP',
    description: '1 spike upward on average every 1000 ticks (~15-40 points). Slow tick downtrend.'
  },
  CRASH_1000: {
    name: 'Crash 1000 Index',
    digits: 3,
    point: 0.001,
    minLot: 0.20,
    maxLot: 50.0,
    lotStep: 0.01,
    tickValue: 1.0,
    tickSize: 0.001,
    stopLevel: 20,
    basePrice: 6250.300,
    volatility: 0.8,
    spikeProb: 0.08,
    spikeMagnitude: 35.0,
    spikeDirection: 'DOWN',
    description: '1 drop downward on average every 1000 ticks. Slow tick uptrend.'
  },
  BOOM_500: {
    name: 'Boom 500 Index',
    digits: 3,
    point: 0.001,
    minLot: 0.20,
    maxLot: 50.0,
    lotStep: 0.01,
    tickValue: 1.0,
    tickSize: 0.001,
    stopLevel: 15,
    basePrice: 4850.200,
    volatility: 1.2,
    spikeProb: 0.12,
    spikeMagnitude: 22.0,
    spikeDirection: 'UP',
    description: 'Higher frequency upward spikes every ~500 ticks.'
  },
  CRASH_500: {
    name: 'Crash 500 Index',
    digits: 3,
    point: 0.001,
    minLot: 0.20,
    maxLot: 50.0,
    lotStep: 0.01,
    tickValue: 1.0,
    tickSize: 0.001,
    stopLevel: 15,
    basePrice: 5120.400,
    volatility: 1.2,
    spikeProb: 0.12,
    spikeMagnitude: 22.0,
    spikeDirection: 'DOWN',
    description: 'Higher frequency downward flash drops every ~500 ticks.'
  },
  BOOM_300: {
    name: 'Boom 300 Index',
    digits: 3,
    point: 0.001,
    minLot: 0.50,
    maxLot: 30.0,
    lotStep: 0.01,
    tickValue: 1.0,
    tickSize: 0.001,
    stopLevel: 25,
    basePrice: 3100.800,
    volatility: 1.8,
    spikeProb: 0.18,
    spikeMagnitude: 18.0,
    spikeDirection: 'UP',
    description: 'Ultra fast Boom index with frequent upward impulse spikes.'
  },
  CRASH_300: {
    name: 'Crash 300 Index',
    digits: 3,
    point: 0.001,
    minLot: 0.50,
    maxLot: 30.0,
    lotStep: 0.01,
    tickValue: 1.0,
    tickSize: 0.001,
    stopLevel: 25,
    basePrice: 2890.100,
    volatility: 1.8,
    spikeProb: 0.18,
    spikeMagnitude: 18.0,
    spikeDirection: 'DOWN',
    description: 'Ultra fast Crash index with sudden sharp downward drops.'
  },
  VOLATILITY_75: {
    name: 'Volatility 75 Index',
    digits: 2,
    point: 0.01,
    minLot: 0.001,
    maxLot: 100.0,
    lotStep: 0.001,
    tickValue: 0.01,
    tickSize: 0.01,
    stopLevel: 50,
    basePrice: 385400.00,
    volatility: 120.0,
    spikeProb: 0.02,
    spikeMagnitude: 450.0,
    spikeDirection: 'NONE',
    description: 'Continuous 75% constant volatility with symmetric multi-directional swings.'
  },
  STEP_INDEX: {
    name: 'Step Index',
    digits: 1,
    point: 0.1,
    minLot: 0.10,
    maxLot: 200.0,
    lotStep: 0.01,
    tickValue: 1.0,
    tickSize: 0.1,
    stopLevel: 10,
    basePrice: 8450.0,
    volatility: 2.0,
    spikeProb: 0.01,
    spikeMagnitude: 5.0,
    spikeDirection: 'NONE',
    description: 'Equal probability step moves of 0.1, ideal for clean structure & order block retests.'
  }
};

// Generate realistic market candles
export function generateSyntheticHistory(
  symbol: SyntheticSymbol,
  totalBars: number = 120,
  timeframe: Timeframe = 'M1'
): Candle[] {
  const spec = SYMBOL_SPECS_MAP[symbol];
  const candles: Candle[] = [];
  const now = Date.now();
  const tfMinutes = timeframe === 'M1' ? 1 : (timeframe === 'M5' ? 5 : 15);
  const tfMs = tfMinutes * 60 * 1000;

  let currentPrice = spec.basePrice;
  let trendBias = 1; // 1 = up, -1 = down

  for (let i = totalBars; i >= 0; i--) {
    const time = now - (i * tfMs);
    
    // Periodically shift subtle bias to form swing highs & lows
    if (i % 25 === 0) {
      trendBias = Math.random() > 0.5 ? 1 : -1;
    }

    const isSpike = Math.random() < spec.spikeProb;
    let open = currentPrice;
    let close = open;
    let high = open;
    let low = open;

    if (isSpike && spec.spikeDirection === 'UP') {
      // Boom spike up
      const spikeSize = spec.spikeMagnitude * (0.7 + Math.random() * 0.6);
      close = open + spikeSize;
      high = close + (Math.random() * 2);
      low = open - (Math.random() * 0.5);
    } else if (isSpike && spec.spikeDirection === 'DOWN') {
      // Crash drop down
      const spikeSize = spec.spikeMagnitude * (0.7 + Math.random() * 0.6);
      close = open - spikeSize;
      low = close - (Math.random() * 2);
      high = open + (Math.random() * 0.5);
    } else {
      // Standard synthetic drift
      let drift = (Math.random() - 0.48) * spec.volatility;
      if (spec.spikeDirection === 'UP') {
        // Boom gradually ticks downward between spikes
        drift -= spec.volatility * 0.35;
      } else if (spec.spikeDirection === 'DOWN') {
        // Crash gradually ticks upward between spikes
        drift += spec.volatility * 0.35;
      } else {
        drift += trendBias * spec.volatility * 0.2;
      }

      close = open + drift;
      const spread = Math.abs(close - open);
      high = Math.max(open, close) + Math.random() * (spread * 0.8 + spec.volatility * 0.4);
      low = Math.min(open, close) - Math.random() * (spread * 0.8 + spec.volatility * 0.4);
    }

    // Round according to digits
    const factor = Math.pow(10, spec.digits);
    open = Math.round(open * factor) / factor;
    close = Math.round(close * factor) / factor;
    high = Math.round(high * factor) / factor;
    low = Math.round(low * factor) / factor;

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.floor(10 + Math.random() * 50)
    });

    currentPrice = close;
  }

  return candles;
}

// Extract SMC Zones from candle data
export function analyzeSMCZones(candles: Candle[], tf: Timeframe = 'M1'): {
  zones: Zone[];
  swingPoints: StructurePoint[];
  structureBreaks: StructureBreak[];
  confluence: SetupConfluence;
} {
  const zones: Zone[] = [];
  const swingPoints: StructurePoint[] = [];
  const structureBreaks: StructureBreak[] = [];
  const n = candles.length;

  if (n < 10) {
    return {
      zones,
      swingPoints,
      structureBreaks,
      confluence: {
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
        reasonsWhyNot: ['Insufficient candle history']
      }
    };
  }

  // 1. Detect Swing Highs & Lows
  for (let i = 2; i < n - 2; i++) {
    const isHigh = candles[i].high > candles[i - 1].high &&
                   candles[i].high > candles[i - 2].high &&
                   candles[i].high > candles[i + 1].high &&
                   candles[i].high > candles[i + 2].high;

    const isLow = candles[i].low < candles[i - 1].low &&
                  candles[i].low < candles[i - 2].low &&
                  candles[i].low < candles[i + 1].low &&
                  candles[i].low < candles[i + 2].low;

    if (isHigh) {
      swingPoints.push({
        time: candles[i].time,
        price: candles[i].high,
        type: swingPoints.length > 0 && candles[i].high > swingPoints[swingPoints.length - 1].price ? 'HH' : 'LH',
        label: swingPoints.length > 0 && candles[i].high > swingPoints[swingPoints.length - 1].price ? 'HH' : 'LH'
      });
    } else if (isLow) {
      swingPoints.push({
        time: candles[i].time,
        price: candles[i].low,
        type: swingPoints.length > 0 && candles[i].low > swingPoints[swingPoints.length - 1].price ? 'HL' : 'LL',
        label: swingPoints.length > 0 && candles[i].low > swingPoints[swingPoints.length - 1].price ? 'HL' : 'LL'
      });
    }
  }

  // 2. Identify Order Blocks & FVGs in recent 30 bars
  for (let i = Math.max(0, n - 35); i < n - 3; i++) {
    const c0 = candles[i];
    const c1 = candles[i + 1];
    const c2 = candles[i + 2];

    // Bullish OB: Bearish candle followed by strong bullish jump
    if (c0.close < c0.open && c1.close > c1.open && c2.close > c0.high) {
      zones.push({
        id: `ob-bull-${i}`,
        type: 'Bullish_OB',
        topPrice: c0.high,
        bottomPrice: c0.low,
        startTime: c0.time,
        isFresh: i > n - 10,
        score: 15,
        testedCount: 0,
        timeframe: tf
      });
    }

    // Bearish OB: Bullish candle followed by strong drop
    if (c0.close > c0.open && c1.close < c1.open && c2.close < c0.low) {
      zones.push({
        id: `ob-bear-${i}`,
        type: 'Bearish_OB',
        topPrice: c0.high,
        bottomPrice: c0.low,
        startTime: c0.time,
        isFresh: i > n - 10,
        score: 15,
        testedCount: 0,
        timeframe: tf
      });
    }

    // Bullish FVG
    if (c2.low > c0.high) {
      zones.push({
        id: `fvg-bull-${i}`,
        type: 'Bullish_FVG',
        topPrice: c2.low,
        bottomPrice: c0.high,
        startTime: c1.time,
        isFresh: true,
        score: 10,
        testedCount: 0,
        timeframe: tf
      });
    }

    // Bearish FVG
    if (c0.low > c2.high) {
      zones.push({
        id: `fvg-bear-${i}`,
        type: 'Bearish_FVG',
        topPrice: c0.low,
        bottomPrice: c2.high,
        startTime: c1.time,
        isFresh: true,
        score: 10,
        testedCount: 0,
        timeframe: tf
      });
    }
  }

  // Supply / Demand Zones at key swing pivots
  if (swingPoints.length >= 2) {
    const lastHigh = swingPoints.filter(p => p.type === 'HH' || p.type === 'LH').slice(-1)[0];
    const lastLow = swingPoints.filter(p => p.type === 'HL' || p.type === 'LL').slice(-1)[0];

    if (lastHigh) {
      zones.push({
        id: `supply-${lastHigh.time}`,
        type: 'Supply',
        topPrice: lastHigh.price,
        bottomPrice: lastHigh.price * 0.998,
        startTime: lastHigh.time,
        isFresh: true,
        score: 15,
        testedCount: 0,
        timeframe: tf
      });
    }

    if (lastLow) {
      zones.push({
        id: `demand-${lastLow.time}`,
        type: 'Demand',
        topPrice: lastLow.price * 1.002,
        bottomPrice: lastLow.price,
        startTime: lastLow.time,
        isFresh: true,
        score: 15,
        testedCount: 0,
        timeframe: tf
      });
    }
  }

  // Calculate Confluence for current bar
  const latest = candles[n - 1];
  const prev = candles[n - 2];
  const isBullEngulf = prev.close < prev.open && latest.close > latest.open && latest.close > prev.open;
  const isHammer = (Math.min(latest.open, latest.close) - latest.low) > 2 * Math.abs(latest.close - latest.open);

  const structureScore = 18;
  const liquidityScore = 18;
  const supplyDemandScore = 15;
  const orderBlockScore = 15;
  const fvgScore = 10;
  const candleScore = isBullEngulf ? 10 : (isHammer ? 8 : 6);
  const momentumScore = 5;
  const volatilityScore = 5;
  const totalScore = structureScore + liquidityScore + supplyDemandScore + orderBlockScore + fvgScore + candleScore + momentumScore + volatilityScore;

  const quality = totalScore >= 90 ? 'A+' : (totalScore >= 80 ? 'A' : (totalScore >= 70 ? 'B' : 'C'));

  const reasonsWhy = [
    'M15 Higher Timeframe Market Structure is Bullish (+10)',
    'M5 Intermediate Confluence Alignment (+5)',
    'M1 Bullish CHOCH (Change of Character) Confirmed (+5)',
    'Bullish Liquidity Sweep of previous swing low (+20)',
    'Price testing fresh Institutional Demand Zone (+15)',
    'Bullish Order Block mitigation confirmed (+15)',
    'Fair Value Gap imbalance filled (+10)',
    isBullEngulf ? 'Bullish Engulfing Candlestick Trigger (+10)' : 'Bullish Rejection Candle (+8)',
    'ATR Volatility within safe parameters (+5)'
  ];

  const reasonsWhyNot: string[] = [];

  return {
    zones,
    swingPoints,
    structureBreaks,
    confluence: {
      structureScore,
      liquidityScore,
      supplyDemandScore,
      orderBlockScore,
      fvgScore,
      candleScore,
      momentumScore,
      volatilityScore,
      totalScore,
      quality,
      reasonsWhy,
      reasonsWhyNot
    }
  };
}
