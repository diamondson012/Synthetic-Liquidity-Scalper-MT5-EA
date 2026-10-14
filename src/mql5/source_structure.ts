// MarketStructure.mqh - SMC Market Structure (HH, HL, LH, LL, BOS, CHOCH)
export const CODE_MARKET_STRUCTURE_MQH = `
#ifndef SLS_SOURCE_STRUCTURE
#define SLS_SOURCE_STRUCTURE
//+------------------------------------------------------------------+
//|                                              MarketStructure.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"

class CMarketStructure
{
private:
   CSymbolManager*   m_symbol_mgr;
   int               m_swing_left_bars;
   int               m_swing_right_bars;
   SSwingPoint       m_highs[MAX_STRUCTURE_POINTS];
   SSwingPoint       m_lows[MAX_STRUCTURE_POINTS];
   int               m_high_count;
   int               m_low_count;
   ENUM_BREAK_TYPE   m_last_break;
   ENUM_MARKET_BIAS  m_current_bias;

public:
   CMarketStructure(void) : 
      m_symbol_mgr(NULL),
      m_swing_left_bars(3),
      m_swing_right_bars(2),
      m_high_count(0),
      m_low_count(0),
      m_last_break(BREAK_NONE),
      m_current_bias(BIAS_NEUTRAL)
   {}

   ~CMarketStructure(void) {}

   void Init(CSymbolManager* mgr, int left_bars = 3, int right_bars = 2)
   {
      m_symbol_mgr = mgr;
      m_swing_left_bars = left_bars;
      m_swing_right_bars = right_bars;
      m_high_count = 0;
      m_low_count = 0;
   }

   //--- Analyze Market Structure on given timeframe
   bool Analyze(ENUM_TIMEFRAMES tf, int lookback_bars = 60)
   {
      if(m_symbol_mgr == NULL) return false;
      string sym = m_symbol_mgr.GetSymbol();

      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      int copied = CopyRates(sym, tf, 0, lookback_bars, rates);
      if(copied < lookback_bars) return false;

      m_high_count = 0;
      m_low_count = 0;

      //--- Detect Swings
      for(int i = m_swing_right_bars + 1; i < copied - m_swing_left_bars; i++)
      {
         //--- Check Swing High
         bool is_high = true;
         for(int l = 1; l <= m_swing_left_bars; l++)
         {
            if(rates[i].high <= rates[i + l].high) { is_high = false; break; }
         }
         for(int r = 1; r <= m_swing_right_bars; r++)
         {
            if(rates[i].high <= rates[i - r].high) { is_high = false; break; }
         }

         if(is_high && m_high_count < MAX_STRUCTURE_POINTS)
         {
            m_highs[m_high_count].time = rates[i].time;
            m_highs[m_high_count].price = rates[i].high;
            m_highs[m_high_count].is_high = true;
            m_highs[m_high_count].bar_index = i;
            m_high_count++;
         }

         //--- Check Swing Low
         bool is_low = true;
         for(int l = 1; l <= m_swing_left_bars; l++)
         {
            if(rates[i].low >= rates[i + l].low) { is_low = false; break; }
         }
         for(int r = 1; r <= m_swing_right_bars; r++)
         {
            if(rates[i].low >= rates[i - r].low) { is_low = false; break; }
         }

         if(is_low && m_low_count < MAX_STRUCTURE_POINTS)
         {
            m_lows[m_low_count].time = rates[i].time;
            m_lows[m_low_count].price = rates[i].low;
            m_lows[m_low_count].is_high = false;
            m_lows[m_low_count].bar_index = i;
            m_low_count++;
         }
      }

      //--- Classify Swing Labels (HH, HL, LH, LL)
      for(int h = 0; h < m_high_count - 1; h++)
      {
         if(m_highs[h].price > m_highs[h + 1].price)
            m_highs[h].label = "HH";
         else
            m_highs[h].label = "LH";
      }

      for(int l = 0; l < m_low_count - 1; l++)
      {
         if(m_lows[l].price > m_lows[l + 1].price)
            m_lows[l].label = "HL";
         else
            m_lows[l].label = "LL";
      }

      //--- Detect BOS and CHOCH
      m_last_break = DetectStructureBreaks(rates, copied);
      m_current_bias = EvaluateBias();

      return true;
   }

   //--- Identify Break of Structure (BOS) vs Change of Character (CHOCH)
   ENUM_BREAK_TYPE DetectStructureBreaks(const MqlRates &rates[], int total_bars)
   {
      if(m_high_count < 2 || m_low_count < 2) return BREAK_NONE;

      double latest_close = rates[0].close;
      double prev_recent_high = m_highs[0].price;
      double prev_recent_low  = m_lows[0].price;

      //--- Check Bullish Break
      if(latest_close > prev_recent_high)
      {
         // If previous structure was bearish (LH + LL) and now breaks high -> CHOCH
         if(m_high_count >= 2 && m_highs[0].price < m_highs[1].price)
            return BREAK_CHOCH_BULLISH;
         else
            return BREAK_BOS_BULLISH;
      }

      //--- Check Bearish Break
      if(latest_close < prev_recent_low)
      {
         // If previous structure was bullish (HH + HL) and now breaks low -> CHOCH
         if(m_low_count >= 2 && m_lows[0].price > m_lows[1].price)
            return BREAK_CHOCH_BEARISH;
         else
            return BREAK_BOS_BEARISH;
      }

      return BREAK_NONE;
   }

   //--- Determine Overall Market Bias
   ENUM_MARKET_BIAS EvaluateBias(void)
   {
      if(m_high_count < 2 || m_low_count < 2) return BIAS_NEUTRAL;

      bool bullish_highs = (m_highs[0].price > m_highs[1].price);
      bool bullish_lows  = (m_lows[0].price > m_lows[1].price);
      bool bearish_highs = (m_highs[0].price < m_highs[1].price);
      bool bearish_lows  = (m_lows[0].price < m_lows[1].price);

      if(bullish_highs && bullish_lows)
         return (m_last_break == BREAK_BOS_BULLISH || m_last_break == BREAK_CHOCH_BULLISH) ? BIAS_STRONG_BULLISH : BIAS_WEAK_BULLISH;

      if(bearish_highs && bearish_lows)
         return (m_last_break == BREAK_BOS_BEARISH || m_last_break == BREAK_CHOCH_BEARISH) ? BIAS_STRONG_BEARISH : BIAS_WEAK_BEARISH;

      return BIAS_NEUTRAL;
   }

   //--- Getters
   ENUM_MARKET_BIAS GetBias(void) const { return m_current_bias; }
   ENUM_BREAK_TYPE GetLastBreak(void) const { return m_last_break; }
   int GetHighsCount(void) const { return m_high_count; }
   int GetLowsCount(void) const { return m_low_count; }
   
   bool GetRecentHigh(SSwingPoint &high_point, int index = 0) const
   {
      if(index >= 0 && index < m_high_count) { high_point = m_highs[index]; return true; }
      return false;
   }

   bool GetRecentLow(SSwingPoint &low_point, int index = 0) const
   {
      if(index >= 0 && index < m_low_count) { low_point = m_lows[index]; return true; }
      return false;
   }
};

#endif
`;
