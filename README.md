# Synthetic Liquidity Scalper — demo release candidate

First release scope: **Boom 1000 Index and Crash 1000 Index**. The website is an illustrative simulator and source distributor, not a broker connection. Generated candles, confluence scores and contract specifications do not constitute trading evidence. Minimum-lot constraints can correctly block a $10 simulated account from trading.

## Repeatable readiness check

Use Node.js 22+:

```sh
npm ci
npm run readiness
```

Runs TypeScript checks, regression tests, production build, ZIP export and source hashes. Outputs `artifacts/readiness.json`, `artifacts/source-manifest.json`, `artifacts/MQL5/` and the MT5 ZIP. CI runs the same command. `npm run readiness:release` intentionally exits nonzero: this candidate is **not live-trading approved**, regardless of source-check success. No automatic deployment occurs.

## Windows / MT5 next steps

1. Run the readiness command and copy the exported Experts and Include folders into MT5's **File → Open Data Folder → MQL5**.
2. Press F4, open `Experts/SyntheticLiquidityScalper.mq5`, press F7. Save the compiler log. Require **zero errors and warnings**, plus a newly produced EX5. Source checks here are not a substitute for MetaEditor.
3. Use a **Deriv demo account**, exact symbol `Boom 1000 Index` or `Crash 1000 Index`, M1 chart. Real accounts and other symbols are rejected. Custom symbol must match chart. Keep `InpUsePartialClose=false` and `InpMaxOpenTrades=1`.
4. Follow [MT5 acceptance checklist](docs/MT5-VALIDATION.md). Send back compiler log first; then both symbols' tester reports and settings. Never send passwords or broker credentials.

Single TP2 exit is supported; partial closing is deliberately disabled rather than advertised as implemented. The terminal uses broker-calculated stop risk and refuses minimum lots above budget. It cannot guarantee a maximum loss through gaps/slippage. Daily limits gate new entries; existing trades continue stop/timeout management.

See [change notes and remaining limits](docs/MT5-VALIDATION.md). This candidate requires further broker testing before release. Profits are not guaranteed.
