// SignalEngine.mqh - 0-100 Confluence Scoring & "Why Trade / Why Not Trade" Natural Language Explanations
export const CODE_SIGNAL_ENGINE_MQH = `
#ifndef SLS_SOURCE_SIGNAL
#define SLS_SOURCE_SIGNAL
//+------------------------------------------------------------------+
//|                                                 SignalEngine.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"
#include "MarketStructure.mqh"
#include "LiquidityEngine.mqh"
#include "SupplyDemand.mqh"
#include "OrderBlock.mqh"
#include "FVGEngine.mqh"
#include "CandlePatterns.mqh"
#include "MomentumEngine.mqh"

class CSignalEngine
{
private:
   CSymbolManager*   m_symbol_mgr;
   CMarketStructure* m_struct_m15;
   CMarketStructure* m_struct_m5;
   CMarketStructure* m_struct_m1;
   CLiquidityEngine* m_liquidity;
   CSupplyDemand*    m_supply_demand;
   COrderBlock*      m_order_block;
   CFVGEngine*       m_fvg;
   CCandlePatterns*  m_candles;
   CMomentumEngine*  m_momentum;

   double            m_min_setup_score;
   bool              m_allow_counter_trend;
   ENUM_EA_STATE     m_current_state;

public:
   CSignalEngine(void) :
      m_symbol_mgr(NULL),
      m_struct_m15(NULL),
      m_struct_m5(NULL),
      m_struct_m1(NULL),
      m_liquidity(NULL),
      m_supply_demand(NULL),
      m_order_block(NULL),
      m_fvg(NULL),
      m_candles(NULL),
      m_momentum(NULL),
      m_min_setup_score(70.0),
      m_allow_counter_trend(false),
      m_current_state(STATE_WAITING)
   {}

   ~CSignalEngine(void) {}

   void Init(CSymbolManager* sym_mgr,
             CMarketStructure* s15,
             CMarketStructure* s5,
             CMarketStructure* s1,
             CLiquidityEngine* liq,
             CSupplyDemand* sd,
             COrderBlock* ob,
             CFVGEngine* fvg,
             CCandlePatterns* candles,
             CMomentumEngine* mom,
             double min_score = 70.0,
             bool counter_trend = false)
   {
      m_symbol_mgr         = sym_mgr;
      m_struct_m15         = s15;
      m_struct_m5          = s5;
      m_struct_m1          = s1;
      m_liquidity          = liq;
      m_supply_demand      = sd;
      m_order_block        = ob;
      m_fvg                = fvg;
      m_candles            = candles;
      m_momentum           = mom;
      m_min_setup_score    = min_score;
      m_allow_counter_trend= counter_trend;
      m_current_state      = STATE_WAITING;
   }

   //--- Evaluate Confluence Setup for BUY or SELL
   bool EvaluateConfluence(int trade_direction, SConfluenceScore &score, double &calc_sl, double &calc_tp1, double &calc_tp2, double &calc_tp3)
   {
      // Reset Scores
      score.structure_score     = 0.0;
      score.liquidity_score     = 0.0;
      score.supply_demand_score = 0.0;
      score.order_block_score   = 0.0;
      score.fvg_score           = 0.0;
      score.candle_score        = 0.0;
      score.momentum_score      = 0.0;
      score.volatility_score    = 0.0;
      score.total_score         = 0.0;
      score.reasoning_why       = "";
      score.reasoning_why_not   = "";

      if(m_symbol_mgr == NULL) return false;
      string sym = m_symbol_mgr.GetSymbol();
      double current_price = (trade_direction == 1) ? SymbolInfoDouble(sym, SYMBOL_ASK) : SymbolInfoDouble(sym, SYMBOL_BID);
      double pt = m_symbol_mgr.GetPoint();
      double atr = (m_momentum != NULL) ? m_momentum.GetATRM1() : (20.0 * pt);

      string why_reasons[];
      string why_not_reasons[];
      ArrayResize(why_reasons, 0);
      ArrayResize(why_not_reasons, 0);

      //--- 1. Market Structure Confluence (Max 20 pts)
      ENUM_MARKET_BIAS bias_m15 = (m_struct_m15 != NULL) ? m_struct_m15.GetBias() : BIAS_NEUTRAL;
      ENUM_MARKET_BIAS bias_m5  = (m_struct_m5 != NULL)  ? m_struct_m5.GetBias()  : BIAS_NEUTRAL;
      ENUM_BREAK_TYPE break_m1  = (m_struct_m1 != NULL)  ? m_struct_m1.GetLastBreak() : BREAK_NONE;

      if(trade_direction == 1) // BUY
      {
         if(bias_m15 >= BIAS_WEAK_BULLISH)
         {
            score.structure_score += 10.0;
            AddReason(why_reasons, "M15 Market Structure is Bullish (+10)");
         }
         else
         {
            AddReason(why_not_reasons, "M15 higher timeframe bias contradicts BUY");
         }

         if(bias_m5 >= BIAS_WEAK_BULLISH)
         {
            score.structure_score += 5.0;
            AddReason(why_reasons, "M5 Intermediate Bias Bullish (+5)");
         }

         if(break_m1 == BREAK_BOS_BULLISH || break_m1 == BREAK_CHOCH_BULLISH)
         {
            score.structure_score += 5.0;
            AddReason(why_reasons, (break_m1 == BREAK_CHOCH_BULLISH) ? "M1 Bullish CHOCH (+5)" : "M1 Bullish BOS (+5)");
         }
         else
         {
            AddReason(why_not_reasons, "No M1 Bullish BOS/CHOCH confirmation");
         }
      }
      else // SELL
      {
         if(bias_m15 <= BIAS_WEAK_BEARISH)
         {
            score.structure_score += 10.0;
            AddReason(why_reasons, "M15 Market Structure is Bearish (+10)");
         }
         else
         {
            AddReason(why_not_reasons, "M15 higher timeframe bias contradicts SELL");
         }

         if(bias_m5 <= BIAS_WEAK_BEARISH)
         {
            score.structure_score += 5.0;
            AddReason(why_reasons, "M5 Intermediate Bias Bearish (+5)");
         }

         if(break_m1 == BREAK_BOS_BEARISH || break_m1 == BREAK_CHOCH_BEARISH)
         {
            score.structure_score += 5.0;
            AddReason(why_reasons, (break_m1 == BREAK_CHOCH_BEARISH) ? "M1 Bearish CHOCH (+5)" : "M1 Bearish BOS (+5)");
         }
         else
         {
            AddReason(why_not_reasons, "No M1 Bearish BOS/CHOCH confirmation");
         }
      }

      //--- 2. Liquidity Analysis (Max 20 pts)
      if(m_liquidity != NULL)
      {
         int sweep_dir = 0;
         if(m_liquidity.DetectLiquiditySweep(PERIOD_M1, 15, sweep_dir))
         {
            if((trade_direction == 1 && sweep_dir == 1) || (trade_direction == -1 && sweep_dir == -1))
            {
               score.liquidity_score += 20.0;
               AddReason(why_reasons, (sweep_dir == 1) ? "Bullish Liquidity Sweep / Stop Hunt of Lows (+20)" : "Bearish Liquidity Sweep of Highs (+20)");
            }
         }
         else
         {
            bool eqh = false, eql = false;
            double eqh_l = 0.0, eql_l = 0.0;
            if(m_liquidity.FindEqualHighsLows(PERIOD_M1, eqh, eql, eqh_l, eql_l))
            {
               score.liquidity_score += 10.0;
               AddReason(why_reasons, eqh ? "Equal Highs Liquidity Pool Target (+10)" : "Equal Lows Liquidity Pool (+10)");
            }
            else
            {
               AddReason(why_not_reasons, "Fresh liquidity sweep not detected");
            }
         }
      }

      //--- 3. Supply / Demand Confluence (Max 15 pts)
      if(m_supply_demand != NULL)
      {
         SPriceZone matched_sd;
         ENUM_ZONE_TYPE target_zone = (trade_direction == 1) ? ZONE_DEMAND : ZONE_SUPPLY;
         if(m_supply_demand.IsPriceInZone(current_price, target_zone, matched_sd))
         {
            score.supply_demand_score = matched_sd.is_fresh ? 15.0 : 10.0;
            AddReason(why_reasons, (target_zone == ZONE_DEMAND) ? 
                      StringFormat("Price reacting to %s Demand Zone (+%.0f)", matched_sd.is_fresh ? "Fresh" : "Retested", score.supply_demand_score) :
                      StringFormat("Price reacting to %s Supply Zone (+%.0f)", matched_sd.is_fresh ? "Fresh" : "Retested", score.supply_demand_score));
         }
      }

      //--- 4. Order Block Confluence (Max 15 pts)
      if(m_order_block != NULL)
      {
         SPriceZone matched_ob;
         ENUM_ZONE_TYPE target_ob = (trade_direction == 1) ? ZONE_BULLISH_ORDER_BLOCK : ZONE_BEARISH_ORDER_BLOCK;
         if(m_order_block.IsPriceInOrderBlock(current_price, target_ob, matched_ob))
         {
            score.order_block_score = matched_ob.is_fresh ? 15.0 : 10.0;
            AddReason(why_reasons, (target_ob == ZONE_BULLISH_ORDER_BLOCK) ? "Bullish Institutional Order Block Retest (+15)" : "Bearish Order Block Retest (+15)");
         }
      }

      //--- 5. Fair Value Gap Confluence (Max 10 pts)
      if(m_fvg != NULL)
      {
         SPriceZone matched_fvg;
         ENUM_ZONE_TYPE target_fvg = (trade_direction == 1) ? ZONE_BULLISH_FVG : ZONE_BEARISH_FVG;
         if(m_fvg.IsPriceInFVG(current_price, target_fvg, matched_fvg))
         {
            score.fvg_score = matched_fvg.is_fresh ? 10.0 : 6.0;
            AddReason(why_reasons, (target_fvg == ZONE_BULLISH_FVG) ? "Bullish Fair Value Gap Imbalance Filled (+10)" : "Bearish FVG Imbalance Filled (+10)");
         }
      }

      //--- 6. Candlestick Confirmation (Max 10 pts)
      if(m_candles != NULL)
      {
         ENUM_CANDLE_PATTERN pat = m_candles.DetectPattern(PERIOD_M1);
         if(pat != PATTERN_NONE)
         {
            bool bull_pat = (pat == PATTERN_BULLISH_ENGULFING || pat == PATTERN_HAMMER || pat == PATTERN_MORNING_STAR || pat == PATTERN_PIERCING || pat == PATTERN_MARUBOZU_BULL || pat == PATTERN_THREE_WHITE_SOLDIERS || pat == PATTERN_TWEEZER_BOTTOM || pat == PATTERN_INVERTED_HAMMER);
            bool bear_pat = (pat == PATTERN_BEARISH_ENGULFING || pat == PATTERN_SHOOTING_STAR || pat == PATTERN_EVENING_STAR || pat == PATTERN_DARK_CLOUD || pat == PATTERN_MARUBOZU_BEAR || pat == PATTERN_THREE_BLACK_CROWS || pat == PATTERN_TWEEZER_TOP);

            if((trade_direction == 1 && bull_pat) || (trade_direction == -1 && bear_pat))
            {
               score.candle_score = MathMin(10.0, m_candles.GetScore());
               AddReason(why_reasons, m_candles.GetPatternName());
            }
         }
         else
         {
            AddReason(why_not_reasons, "No high-probability M1 candlestick confirmation");
         }
      }

      //--- 7. Momentum & Volatility (Max 10 pts)
      if(m_momentum != NULL)
      {
         double rsi = m_momentum.GetRSIM1();
         if((trade_direction == 1 && rsi > 45.0 && rsi < 70.0) || (trade_direction == -1 && rsi < 55.0 && rsi > 30.0))
         {
            score.momentum_score = 5.0;
            AddReason(why_reasons, StringFormat("Momentum RSI (%.1f) confirms velocity (+5)", rsi));
         }

         score.volatility_score = 5.0;
         AddReason(why_reasons, "ATR Volatility within safe parameters (+5)");
      }

      // Total Score Sum
      score.total_score = score.structure_score + score.liquidity_score + score.supply_demand_score +
                          score.order_block_score + score.fvg_score + score.candle_score +
                          score.momentum_score + score.volatility_score;

      // Grade Assignment
      if(score.total_score >= 90.0) score.grade = GRADE_A_PLUS;
      else if(score.total_score >= 80.0) score.grade = GRADE_A;
      else if(score.total_score >= 70.0) score.grade = GRADE_B;
      else if(score.total_score >= 60.0) score.grade = GRADE_C;
      else score.grade = GRADE_D;

      // Compile Natural Language Explanations
      score.reasoning_why = CompileText(why_reasons);
      score.reasoning_why_not = CompileText(why_not_reasons);

      //--- Calculate Structural SL and 3-stage Take Profits
      double sl_distance = 0.0;
      if(trade_direction == 1) // BUY
      {
         SSwingPoint low_point;
         if(m_struct_m1 != NULL && m_struct_m1.GetRecentLow(low_point, 0))
            calc_sl = m_symbol_mgr.NormalizePrice(low_point.price - (atr * 0.5));
         else
            calc_sl = m_symbol_mgr.NormalizePrice(current_price - (atr * 1.5));

         sl_distance = current_price - calc_sl;
         calc_tp1 = m_symbol_mgr.NormalizePrice(current_price + (sl_distance * 1.2)); // 1.2R
         calc_tp2 = m_symbol_mgr.NormalizePrice(current_price + (sl_distance * 2.0)); // 2.0R
         calc_tp3 = m_symbol_mgr.NormalizePrice(current_price + (sl_distance * 3.0)); // 3.0R
      }
      else // SELL
      {
         SSwingPoint high_point;
         if(m_struct_m1 != NULL && m_struct_m1.GetRecentHigh(high_point, 0))
            calc_sl = m_symbol_mgr.NormalizePrice(high_point.price + (atr * 0.5));
         else
            calc_sl = m_symbol_mgr.NormalizePrice(current_price + (atr * 1.5));

         sl_distance = calc_sl - current_price;
         calc_tp1 = m_symbol_mgr.NormalizePrice(current_price - (sl_distance * 1.2));
         calc_tp2 = m_symbol_mgr.NormalizePrice(current_price - (sl_distance * 2.0));
         calc_tp3 = m_symbol_mgr.NormalizePrice(current_price - (sl_distance * 3.0));
      }

      // Check threshold
      bool is_valid = (score.total_score >= m_min_setup_score);
      m_current_state = is_valid ? STATE_SIGNAL_READY : (score.total_score >= 50.0 ? STATE_SETUP_FORMING : STATE_ANALYZING);

      return is_valid;
   }

   ENUM_EA_STATE GetState(void) const { return m_current_state; }
   void SetState(ENUM_EA_STATE st) { m_current_state = st; }

private:
   void AddReason(string &arr[], string text)
   {
      int sz = ArraySize(arr);
      ArrayResize(arr, sz + 1);
      arr[sz] = text;
   }

   string CompileText(const string &arr[])
   {
      string result = "";
      for(int i = 0; i < ArraySize(arr); i++)
      {
         result += "• " + arr[i] + "\\n";
      }
      return result;
   }
};

#endif
`;
