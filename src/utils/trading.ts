import type { AccountState, ActiveTrade, Candle } from '../types';

export function entryAllowed(a: AccountState, direction: 'BUY' | 'SELL') {
  const start = a.balance - a.dailyProfit;
  return a.status === 'ACTIVE' && a.balance > 0 && a.equity > 0 &&
    (direction === 'BUY' ? a.buyEnabled : a.sellEnabled) &&
    a.consecutiveLosses < a.maxConsecutiveLosses && a.tradesToday < a.maxTradesPerDay &&
    a.equity > start * (1 - a.dailyLossLimitPercent / 100) &&
    (a.targetBalance <= 0 || a.equity < a.targetBalance);
}
export function riskLots(balance: number, risk: number, distance: number, tickSize: number, tickValue: number, min: number, max: number, step: number) {
  if (![balance,risk,distance,tickSize,tickValue,min,max,step].every(x => Number.isFinite(x) && x > 0)) return 0;
  const budget = balance * risk / 100;
  const perLot = distance / tickSize * tickValue;
  const lots = Math.floor((Math.min(max, budget / perLot) + 1e-12) / step) * step;
  return lots >= min && lots * perLot <= budget + 1e-9 ? lots : 0;
}
export function settle(a: AccountState, profit: number): AccountState {
  const balance = a.balance + profit;
  const next = { ...a, balance, equity: balance, dailyProfit: a.dailyProfit + profit,
    consecutiveLosses: profit < 0 ? a.consecutiveLosses + 1 : profit > 0 ? 0 : a.consecutiveLosses };
  const start = next.balance - next.dailyProfit;
  if (balance <= start * (1-next.dailyLossLimitPercent/100) || next.consecutiveLosses >= next.maxConsecutiveLosses || next.tradesToday >= next.maxTradesPerDay) next.status = 'RISK_LIMIT';
  else if (next.targetBalance > 0 && balance >= next.targetBalance) next.status = 'TARGET_ACHIEVED';
  return next;
}
export function advanceTrade(t: ActiveTrade, bar: Candle, tickSize: number, tickValue: number, point: number) {
  const buy = t.type === 'BUY';
  // OHLC cannot reveal intrabar order: stop wins when both levels are touched.
  const stopped = buy ? bar.low <= t.sl : bar.high >= t.sl;
  const target = buy ? bar.high >= t.tp2 : bar.low <= t.tp2;
  const exit = stopped ? (buy ? Math.min(bar.open,t.sl) : Math.max(bar.open,t.sl)) : target ? t.tp2 : null;
  const price = exit ?? bar.close;
  const move = (price-t.openPrice)*(buy?1:-1);
  const risk = Math.abs(t.openPrice-t.initialSL);
  const r = risk > 0 ? move/risk : 0;
  let sl = t.sl;
  if(exit === null && r >= 1) {
    const lock = t.openPrice + (buy?1:-1)*(r >= 2 ? risk : r >= 1.5 ? risk*0.5 : 2*point);
    sl = buy ? Math.max(sl,lock) : Math.min(sl,lock);
  }
  return { exit, trade: { ...t, currentPrice:price, profit:move/tickSize*tickValue*t.lotSize,
    pips: move/point, rMultiple:r, sl, stage: (sl !== t.sl ? 'BREAK_EVEN' : t.stage) as ActiveTrade['stage'] } };
}
