// SyntheticLiquidityScalper.mq5 - Master Expert Advisor for Synthetic Indices (Boom, Crash, Volatility)
export const CODE_SYNTHETIC_LIQUIDITY_SCALPER_MQ5 = `//+------------------------------------------------------------------+
//|                                SyntheticLiquidityScalper.mq5     |
//|                        Professional Synthetic Scalping EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"
#property description "Professional MetaTrader 5 Expert Advisor for Synthetic Indices (Boom, Crash, Volatility)"
#property description "Features Smart Money Concepts, Order Blocks, Liquidity Sweeps, Dynamic Risk & Micro Accounts"

//--- Include Modular Architecture
#include "Include/SyntheticScalper/Defines.mqh"
#include "Include/SyntheticScalper/SymbolManager.mqh"
#include "Include/SyntheticScalper/MarketStructure.mqh"
#include "Include/SyntheticScalper/LiquidityEngine.mqh"
#include "Include/SyntheticScalper/SupplyDemand.mqh"
#include "Include/SyntheticScalper/OrderBlock.mqh"
#include "Include/SyntheticScalper/FVGEngine.mqh"
#include "Include/SyntheticScalper/CandlePatterns.mqh"
#include "Include/SyntheticScalper/MomentumEngine.mqh"
#include "Include/SyntheticScalper/RiskManager.mqh"
#include "Include/SyntheticScalper/PositionManager.mqh"
#include "Include/SyntheticScalper/TradeEngine.mqh"
#include "Include/SyntheticScalper/SignalEngine.mqh"
#include "Include/SyntheticScalper/Dashboard.mqh"
#include "Include/SyntheticScalper/Logger.mqh"
#include "Include/SyntheticScalper/BacktestMetrics.mqh"

//+------------------------------------------------------------------+
//| USER INPUT PARAMETERS                                            |
//+------------------------------------------------------------------+

//=== 1. GENERAL SETTINGS ===
input group "=== GENERAL SETTINGS ==="
input ulong               InpMagicNumber          = MAGIC_NUMBER_DEFAULT;   // Magic Number
input ENUM_TRADING_MODE   InpTradingMode          = MODE_BALANCED;          // Trading Mode Profile
input string              InpCustomSymbol         = "";                     // Symbol Name (Empty = Current Chart)
input bool                InpAllowCounterTrend    = false;                  // Allow Counter-Trend Trading

//=== 2. RISK MANAGEMENT ===
input group "=== RISK MANAGEMENT (MICRO ACCOUNTS) ==="
input double              InpRiskPerTradePct      = 1.0;                    // Risk Per Trade (%)
input double              InpDailyLossLimitPct    = 5.0;                    // Daily Loss Limit (%)
input double              InpDailyProfitTargetPct = 10.0;                   // Daily Profit Target (%)
input int                 InpMaxConsecutiveLosses = 3;                      // Max Consecutive Losses
input int                 InpMaxTradesPerDay      = 10;                     // Max Trades Per Day
input int                 InpMaxOpenTrades        = 1;                      // Max Concurrently Open Trades
input bool                InpMicroAccountMode     = true;                   // Micro Account Mode ($10 - $100 Safety)

//=== 3. ACCOUNT GROWTH OBJECTIVES ===
input group "=== ACCOUNT GROWTH OBJECTIVES (TARGETS ONLY) ==="
input double              InpStartTargetBalance   = 10.0;                   // Starting Balance Target ($)
input double              InpGrowthTargetBalance  = 250.0;                  // Target Objective Balance ($)
input double              InpDailyTargetProfit    = 10.0;                   // Daily Target Profit ($)
input double              InpWeeklyTargetProfit   = 50.0;                   // Weekly Target Profit ($)

//=== 4. MARKET STRUCTURE & CONFLUENCE ===
input group "=== SMC MARKET STRUCTURE & CONFLUENCE ==="
input double              InpMinimumSetupScore    = 70.0;                   // Minimum Setup Score (0-100)
input int                 InpSwingLeftBars        = 3;                      // Swing Point Left Bars
input int                 InpSwingRightBars       = 2;                      // Swing Point Right Bars
input double              InpMinImpulseATRMult    = 1.8;                    // S/D Impulse Displacement (ATR Mult)
input double              InpOBImpulseRatio       = 1.5;                    // Order Block Displacement Ratio
input double              InpFVGMinPoints         = 2.0;                    // FVG Minimum Gap Size (Points)

//=== 5. STOP LOSS & PROFIT PROTECTION ===
input group "=== STOP LOSS & TRAILING STOP ==="
input ENUM_SL_MODE        InpSLMode               = SL_MODE_STRUCTURE_ATR;  // Stop Loss Mode
input double              InpSLBufferATRMult      = 0.5;                    // SL Buffer (ATR Multiplier)
input bool                InpUseBreakEven         = true;                   // Enable Break-Even at +1R
input double              InpBETriggerR           = 1.0;                    // Break-Even Trigger (R Multiple)
input double              InpBELockPoints         = 2.0;                    // Break-Even Profit Lock (Points)
input bool                InpUseTrailingStop      = true;                   // Enable Structure & ATR Trailing
input double              InpTrailStepPoints      = 5.0;                    // Trailing Step (Points)

//=== 6. TAKE PROFIT & PARTIAL CLOSING ===
input group "=== TAKE PROFIT & PARTIAL CLOSE ==="
input double              InpTP1_R_Ratio          = 1.2;                    // Take Profit 1 Target (R Multiple)
input double              InpTP2_R_Ratio          = 2.0;                    // Take Profit 2 Target (R Multiple)
input double              InpTP3_R_Ratio          = 3.0;                    // Take Profit 3 Target (R Multiple)
input bool                InpUsePartialClose      = true;                   // Enable Partial Profit Taking
input double              InpTP1_ClosePercent     = 30.0;                   // TP1 Partial Close (%)
input double              InpTP2_ClosePercent     = 40.0;                   // TP2 Partial Close (%)
input double              InpTP3_ClosePercent     = 30.0;                   // TP3 Partial Close (%)

//=== 7. BOOM & CRASH SPECIAL SETTINGS ===
input group "=== BOOM & CRASH PROFILES ==="
input double              InpBoomRiskMultiplier   = 1.0;                    // Boom Risk Multiplier
input double              InpCrashRiskMultiplier  = 1.0;                    // Crash Risk Multiplier
input int                 InpBoomCrashCooldownSec = 180;                    // Cooldown After Spike/Trade (Seconds)
input int                 InpMaxTradeDurationMin  = 240;                    // Max Trade Duration (Minutes)

//=== 8. DASHBOARD & LOGGING ===
input group "=== DASHBOARD & JOURNALING ==="
input bool                InpShowDashboard        = true;                   // Show On-Chart Decision HUD
input bool                InpShowChartObjects     = true;                   // Draw Zones / OBs / FVGs / BOS
input bool                InpEnableCSVJournal     = true;                   // Export Trade Journal to CSV
input string              InpCSVFileName          = "SLS_Trade_Journal.csv";// CSV Journal File Name

//+------------------------------------------------------------------+
//| GLOBAL OBJECT INSTANCES                                          |
//+------------------------------------------------------------------+
CSymbolManager    g_symbol_mgr;
CMarketStructure  g_struct_m15;
CMarketStructure  g_struct_m5;
CMarketStructure  g_struct_m1;
CLiquidityEngine  g_liquidity;
CSupplyDemand     g_supply_demand;
COrderBlock       g_order_block;
CFVGEngine        g_fvg;
CCandlePatterns   g_candles;
CMomentumEngine   g_momentum;
CRiskManager      g_risk_mgr;
CPositionManager  g_pos_mgr;
CTradeEngine      g_trade_engine;
CSignalEngine     g_signal_engine;
CDashboard        g_dashboard;
CLogger           g_logger;
CBacktestMetrics  g_backtest;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   EventSetTimer(1); // 1-second timer for dashboard & state machine

   // 1. Initialize Symbol Manager
   if(!g_symbol_mgr.Init(InpCustomSymbol))
   {
      Print("[OnInit] Fatal: Symbol initialization failed.");
      return INIT_FAILED;
   }

   // 2. Initialize SMC Sub-Engines
   g_struct_m15.Init(&g_symbol_mgr, InpSwingLeftBars, InpSwingRightBars);
   g_struct_m5.Init(&g_symbol_mgr, InpSwingLeftBars, InpSwingRightBars);
   g_struct_m1.Init(&g_symbol_mgr, InpSwingLeftBars, InpSwingRightBars);
   g_liquidity.Init(&g_symbol_mgr, &g_struct_m1, 5.0);
   g_supply_demand.Init(&g_symbol_mgr, InpMinImpulseATRMult);
   g_order_block.Init(&g_symbol_mgr, 50, InpOBImpulseRatio);
   g_fvg.Init(&g_symbol_mgr, InpFVGMinPoints);
   g_candles.Init(&g_symbol_mgr);
   g_momentum.Init(&g_symbol_mgr, 14);

   // 3. Initialize Risk & Position Managers
   double effective_risk = InpRiskPerTradePct;
   if(g_symbol_mgr.IsBoom()) effective_risk *= InpBoomRiskMultiplier;
   if(g_symbol_mgr.IsCrash()) effective_risk *= InpCrashRiskMultiplier;

   g_risk_mgr.Init(&g_symbol_mgr, effective_risk, InpDailyLossLimitPct, InpDailyProfitTargetPct,
                   InpMaxConsecutiveLosses, InpMaxTradesPerDay, InpMaxOpenTrades,
                   InpMicroAccountMode, InpStartTargetBalance, InpGrowthTargetBalance);

   g_pos_mgr.Init(&g_symbol_mgr, &g_struct_m1, InpMagicNumber, InpUseBreakEven, InpBETriggerR,
                  InpUseTrailingStop, InpUsePartialClose, InpTP1_ClosePercent, InpTP2_ClosePercent, InpTP3_ClosePercent,
                  InpMaxTradeDurationMin);

   g_trade_engine.Init(&g_symbol_mgr, &g_risk_mgr, InpMagicNumber, InpBoomCrashCooldownSec);

   double min_score = InpMinimumSetupScore;
   if(InpTradingMode == MODE_CONSERVATIVE) min_score = MathMax(min_score, 80.0);
   else if(InpTradingMode == MODE_AGGRESSIVE) min_score = MathMin(min_score, 60.0);

   g_signal_engine.Init(&g_symbol_mgr, &g_struct_m15, &g_struct_m5, &g_struct_m1,
                        &g_liquidity, &g_supply_demand, &g_order_block, &g_fvg,
                        &g_candles, &g_momentum, min_score, InpAllowCounterTrend);

   g_dashboard.Init(&g_symbol_mgr, &g_risk_mgr, InpShowDashboard, InpShowChartObjects);
   g_logger.Init(&g_symbol_mgr, InpCSVFileName, InpEnableCSVJournal);
   g_backtest.Init(AccountInfoDouble(ACCOUNT_BALANCE));

   Print("[OnInit] Synthetic Liquidity Scalper initialized successfully for ", g_symbol_mgr.GetSymbol());
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   g_dashboard.Destroy();
   g_logger.CloseCSV();
   PrintFormat("[OnDeinit] EA deinitialized (Reason code: %d)", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // 1. Refresh Daily Risk State
   g_risk_mgr.ResetDailySessionIfNeeded();

   // 2. Update Indicators & Volatility
   g_momentum.Update();
   double current_atr = g_momentum.GetATRM1();

   // 3. Manage Open Positions (Break-even, Trailing, Max Duration)
   g_pos_mgr.ManagePositions(current_atr);

   // 4. Check If New Trades Are Permitted
   if(g_risk_mgr.IsPaused()) return;
   if(PositionsTotal() >= InpMaxOpenTrades) return;

   // 5. Multi-Timeframe Structure Analysis
   g_struct_m15.Analyze(PERIOD_M15, 60);
   g_struct_m5.Analyze(PERIOD_M5, 60);
   g_struct_m1.Analyze(PERIOD_M1, 60);

   // 6. Scan SMC Confluence Zones
   g_supply_demand.ScanZones(PERIOD_M1, 60, current_atr);
   g_order_block.ScanOrderBlocks(PERIOD_M1, current_atr);
   g_fvg.ScanFVGs(PERIOD_M1, 40);

   // 7. Evaluate BUY Signal
   SConfluenceScore buy_score;
   double buy_sl = 0, buy_tp1 = 0, buy_tp2 = 0, buy_tp3 = 0;
   bool buy_valid = g_signal_engine.EvaluateConfluence(1, buy_score, buy_sl, buy_tp1, buy_tp2, buy_tp3);

   // 8. Evaluate SELL Signal
   SConfluenceScore sell_score;
   double sell_sl = 0, sell_tp1 = 0, sell_tp2 = 0, sell_tp3 = 0;
   bool sell_valid = g_signal_engine.EvaluateConfluence(-1, sell_score, sell_sl, sell_tp1, sell_tp2, sell_tp3);

   // 9. Execute Valid High-Score Signals
   string now_str = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);

   if(buy_valid && buy_score.total_score >= InpMinimumSetupScore)
   {
      string sig_id = "BUY_" + g_symbol_mgr.GetSymbol() + "_" + now_str;
      g_trade_engine.ExecuteTrade(1, buy_sl, buy_tp1, buy_tp2, buy_tp3, sig_id, buy_score);
   }
   else if(sell_valid && sell_score.total_score >= InpMinimumSetupScore)
   {
      string sig_id = "SELL_" + g_symbol_mgr.GetSymbol() + "_" + now_str;
      g_trade_engine.ExecuteTrade(-1, sell_sl, sell_tp1, sell_tp2, sell_tp3, sig_id, sell_score);
   }
}

//+------------------------------------------------------------------+
//| Timer function for Dashboard Updates                             |
//+------------------------------------------------------------------+
void OnTimer()
{
   SConfluenceScore current_score;
   double sl = 0, tp1 = 0, tp2 = 0, tp3 = 0;
   g_signal_engine.EvaluateConfluence(1, current_score, sl, tp1, tp2, tp3);

   string action = (current_score.total_score >= InpMinimumSetupScore) ? "BUY" : "WAIT";
   if(action == "WAIT")
   {
      SConfluenceScore sell_s;
      g_signal_engine.EvaluateConfluence(-1, sell_s, sl, tp1, tp2, tp3);
      if(sell_s.total_score >= InpMinimumSetupScore)
      {
         action = "SELL";
         current_score = sell_s;
      }
   }

   g_dashboard.RenderHUD(g_signal_engine.GetState(),
                         g_struct_m15.GetBias(),
                         g_struct_m5.GetBias(),
                         g_struct_m1.GetBias(),
                         current_score,
                         action,
                         current_score.reasoning_why);
}

//+------------------------------------------------------------------+
//| Trade Transaction Event for Journaling & Risk State Tracking     |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      if(HistoryDealSelect(trans.deal))
      {
         long deal_entry = HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
         if(deal_entry == DEAL_ENTRY_OUT)
         {
            double profit = HistoryDealGetDouble(trans.deal, DEAL_PROFIT) + 
                            HistoryDealGetDouble(trans.deal, DEAL_SWAP) + 
                            HistoryDealGetDouble(trans.deal, DEAL_COMMISSION);

            g_risk_mgr.OnTradeClosed(profit);
            g_backtest.OnTradeClosed(profit);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Chart Event Handler for Interactive HUD Buttons                  |
//+------------------------------------------------------------------+
void OnChartEvent(const int id,
                  const long &lparam,
                  const double &dparam,
                  const string &sparam)
{
   if(id == CHARTEVENT_OBJECT_CLICK)
   {
      if(sparam == "SLS_HUD_BTN_PAUSE")
      {
         bool is_now_paused = !g_risk_mgr.IsPaused();
         g_risk_mgr.SetPaused(is_now_paused, is_now_paused ? "MANUAL USER PAUSE" : "");
         Print("[Dashboard] User toggled EA Pause: ", is_now_paused ? "PAUSED" : "ACTIVE");
      }
      else if(sparam == "SLS_HUD_BTN_CLOSEALL")
      {
         g_pos_mgr.CloseAllPositions();
         Print("[Dashboard] User clicked CLOSE ALL positions.");
      }
      else if(sparam == "SLS_HUD_BTN_BUY")
      {
         bool buy_en = !g_trade_engine.IsBuyEnabled();
         g_trade_engine.SetBuyEnabled(buy_en);
         Print("[Dashboard] User toggled BUY Enablement: ", buy_en ? "ON" : "OFF");
      }
      else if(sparam == "SLS_HUD_BTN_SELL")
      {
         bool sell_en = !g_trade_engine.IsSellEnabled();
         g_trade_engine.SetSellEnabled(sell_en);
         Print("[Dashboard] User toggled SELL Enablement: ", sell_en ? "ON" : "OFF");
      }
   }
}

//+------------------------------------------------------------------+
//| Tester event for Custom Optimization in MT5 Strategy Tester      |
//+------------------------------------------------------------------+
double OnTester()
{
   return g_backtest.GetCustomOptimizationFitness();
}
`;
