import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entryAllowed, riskLots, settle, advanceTrade } from '../src/utils/trading';
import type { AccountState, ActiveTrade } from '../src/types';
const account: AccountState = {balance:100, equity:100, startingTargetBalance:100,targetBalance:250,dailyTarget:0,weeklyTarget:0,dailyProfit:0,weeklyProfit:0,dailyLossLimitPercent:5,maxConsecutiveLosses:3,consecutiveLosses:0,tradesToday:0,maxTradesPerDay:10,riskPercent:1,status:'ACTIVE',isMicroAccountMode:true,buyEnabled:true,sellEnabled:true};
const trade = (type: 'BUY'|'SELL'): ActiveTrade => ({ticket:1,symbol:'test',type,lotSize:1,openPrice:100,currentPrice:100,sl:type==='BUY'?90:110,initialSL:type==='BUY'?90:110,tp1:112,tp2:type==='BUY'?120:80,tp3:130,openTime:0,profit:0,pips:0,rMultiple:0,stage:'OPEN',tp1ClosedPercent:0,tp2ClosedPercent:0,setupScore:90,entryReason:'test'});
for (const side of ['BUY','SELL'] as const) {
 test(`${side} stop, target, ambiguous bar and gap fills`,()=>{
  const t=trade(side), buy=side==='BUY';
  const bar=(open:number,high:number,low:number,close:number)=>({open,high,low,close,time:1,volume:1});
  assert.equal(advanceTrade(t,bar(100,121,79,100),1,1,1).exit,t.sl);
  assert.equal(advanceTrade(t,buy?bar(100,121,99,120):bar(100,101,79,80),1,1,1).exit,t.tp2);
  const gap=buy?80:120;
  assert.equal(advanceTrade(t,bar(gap,gap+1,gap-1,gap),1,1,1).exit,gap);
 });
 test(`${side} protection retains initial R and never loosens stop`,()=>{
  const t=trade(side); const buy=side==='BUY';
  t.tp2=buy?200:0;
  const b={open:100,high:buy?116:101,low:buy?99:84,close:buy?115:85,time:1,volume:1};
  const first=advanceTrade(t,b,1,1,1).trade;
  assert.equal(first.rMultiple,1.5);
  assert.equal(first.sl,buy?105:95);
  const second=advanceTrade(first,{...b,open:buy?115:85,low:buy?114:74,high:buy?126:86,close:buy?125:75},1,1,1).trade;
  assert.equal(second.rMultiple,2.5); assert.equal(second.sl,buy?110:90);
 });
}
test('direction, pause, target and risk gates',()=>{
 assert.ok(entryAllowed(account,'BUY'));
 for(const patch of [{buyEnabled:false},{status:'PAUSED'},{consecutiveLosses:3},{tradesToday:10},{equity:95},{equity:250}]) assert.equal(entryAllowed({...account,...patch} as AccountState,'BUY'),false);
 assert.equal(entryAllowed({...account,sellEnabled:false},'SELL'),false);
});
test('minimum lots cannot inflate risk; steps floor; invalid specs reject',()=>{
 assert.equal(riskLots(10,1,10,1,1,0.2,50,0.01),0);
 assert.equal(riskLots(100,1,3,1,1,0.2,50,0.01),0.33);
 assert.equal(riskLots(100,1,3,0,1,0.2,50,0.01),0);
});
test('settlement uses actual loss without invented balance floor',()=>{
 assert.equal(settle(account,-110).balance,-10);
 assert.equal(settle(account,-5).status,'RISK_LIMIT');
 assert.equal(settle({...account,consecutiveLosses:2},-1).status,'RISK_LIMIT');
 assert.equal(settle(account,150).status,'TARGET_ACHIEVED');
});
