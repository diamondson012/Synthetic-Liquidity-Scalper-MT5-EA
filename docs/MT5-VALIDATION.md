# Candidate acceptance record

## Changes
- Symmetric BUY/SELL simulated stop/target exits using candle high/low, stop-first on ambiguous bars and adverse opening gaps; original risk retained for protection.
- Simulated direction, pause, loss streak, daily equity, trade-count and target gates; conservative lot rounding. Manual close settles actual P/L, without an invented balance floor.
- Removed hardcoded backtest statistics. Simulator is explicitly labelled; changing symbol/timeframe resets its session. The simulator is not the MQL strategy and has no daily calendar rollover (reset starts a new session).
- Correct MQL include paths, include guards, pointer method syntax and GetPointer calls.
- MQL sizing uses OrderCalcProfit; minimum lot cannot inflate configured risk. Only confirmed server fill retcodes count as success; no blind retry after an ambiguous response.
- Daily loss/trade/streak checks; daily baseline and counters persisted in terminal globals. Scoped trade events and deal CSV (including commission/swap/fee). Original position risk persists when stops move.
- Demo/tester-only candidate, two symbols, single position cap; partial closing unsupported and rejected.

## Required evidence — currently pending

Record git commit, source-manifest hashes, EX5 hash, MetaTrader/MetaEditor build, broker server, account currency/leverage, exact symbol contract details, deposit, timeframe, dates and complete input SET file. Keep raw reports and journals; do not replace them with screenshots of selected profits.

1. **Compile**: all 17 generated files installed, zero errors/warnings, fresh EX5.
2. **Tester per symbol**: available real ticks (record if unavailable), costs, spread and execution assumptions documented. Distinct development and unseen evaluation periods. Report total trades, net result, drawdown, profit factor and loss streak, including losing runs. No profit threshold has been established.
3. **Execution**: BUY/SELL SL and TP2, invalid stop distances, minimum/step volume, insufficient margin, rejected orders, price gaps and no duplicate orders.
4. **Risk**: configured daily limit, trade cap, loss streak, target, pause/resume, direction switches. Restart terminal/EA with a moved stop and after hitting a risk limit. Verify limits remain in effect. Observe midnight rollover.
5. **Demo forward run**: both symbols separately, connection loss/recovery, restart and closed-market behaviour. Reconcile every EA deal with broker history and `MQL5/Files/SLS_Deals_<account>.csv` (tester files live under the tester agent). Fields: deal ID, time, symbol, entry enum, type enum, volume, price, profit, commission, swap, fee. Events may require deduplication by deal ID; failures are logged.
6. **Website**: mobile/desktop navigation, playback, pause, reset, spike, switches, manual close and ZIP download; verify downloaded source hashes. Test actual deployed URL. No browser end-to-end or Google deployment acceptance has been performed here.

## Remaining engineering constraints

Source checks cannot establish MQL compilation or strategy profitability. The generated EA retains legacy inputs whose full behaviour is not implemented: partial closes, TP1/TP3 staging, several SL/target profile knobs and rich SMC journal fields. Only default candidate settings are in scope; do not advertise unsupported controls. TP2 ratios are currently strategy-defined. Real trading remains blocked until those settings are wired or removed and acceptance is reviewed.

Terminal-global risk state is local to this terminal; it is not a central account-wide risk service. Do not operate duplicate instances or multiple terminals on the same account during this candidate test. Counter persistence does not reconstruct missing events from broker history after a crash; this must be reconciled before a live release. The one-position gate is account-wide. Costs and slippage can exceed nominal stop risk. Stop modifications must be checked against broker stop/freeze levels during validation.

Use broker history as the authoritative financial record, including opening commissions and fees. The EA's closed-deal diagnostic P/L is not a complete account statement. Do not unlock real-account operation until compiler, tester, forward execution, reconciliation and browser evidence have been reviewed against the same source manifest.

References: https://www.mql5.com/en/docs/trading/ordercalcprofit ; https://www.mql5.com/en/docs/standardlibrary/tradeclasses/ctrade/ctraderesultretcode ; https://www.mql5.com/en/docs/basis/preprosessor/include ; https://www.mql5.com/en/docs/common/getpointer
