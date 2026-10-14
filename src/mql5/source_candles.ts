// CandlePatterns.mqh - Comprehensive Candlestick Pattern Engine & Confidence Weighting
export const CODE_CANDLE_PATTERNS_MQH = `
#ifndef SLS_SOURCE_CANDLES
#define SLS_SOURCE_CANDLES
//+------------------------------------------------------------------+
//|                                               CandlePatterns.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"

class CCandlePatterns
{
private:
   CSymbolManager*       m_symbol_mgr;
   ENUM_CANDLE_PATTERN   m_last_pattern;
   double                m_pattern_score;
   string                m_pattern_name;

public:
   CCandlePatterns(void) :
      m_symbol_mgr(NULL),
      m_last_pattern(PATTERN_NONE),
      m_pattern_score(0.0),
      m_pattern_name("None")
   {}

   ~CCandlePatterns(void) {}

   void Init(CSymbolManager* sym_mgr)
   {
      m_symbol_mgr = sym_mgr;
      m_last_pattern = PATTERN_NONE;
      m_pattern_score = 0.0;
      m_pattern_name = "None";
   }

   //--- Identify Candle Patterns on recent 1-3 bars
   ENUM_CANDLE_PATTERN DetectPattern(ENUM_TIMEFRAMES tf)
   {
      if(m_symbol_mgr == NULL) return PATTERN_NONE;
      string sym = m_symbol_mgr.GetSymbol();

      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      int copied = CopyRates(sym, tf, 0, 5, rates);
      if(copied < 5) return PATTERN_NONE;

      // Candle 1 (completed previous bar), Candle 2 (bar before), Candle 3 (bar before that)
      const MqlRates c1 = rates[1];
      const MqlRates c2 = rates[2];
      const MqlRates c3 = rates[3];

      double c1_body = MathAbs(c1.close - c1.open);
      double c1_range = c1.high - c1.low;
      double c2_body = MathAbs(c2.close - c2.open);
      double c2_range = c2.high - c2.low;

      m_last_pattern = PATTERN_NONE;
      m_pattern_score = 0.0;
      m_pattern_name = "None";

      if(c1_range <= 0.0) return PATTERN_NONE;

      //--- 1. Morning Star (Bullish Reversal 3-candle)
      if(c3.close < c3.open && c1.close > c1.open && 
         c2_body <= (c3.high - c3.low) * 0.35 && 
         c1.close > (c3.open + c3.close) * 0.5)
      {
         m_last_pattern = PATTERN_MORNING_STAR;
         m_pattern_score = 12.0;
         m_pattern_name = "Morning Star (+12)";
         return m_last_pattern;
      }

      //--- 2. Evening Star (Bearish Reversal 3-candle)
      if(c3.close > c3.open && c1.close < c1.open && 
         c2_body <= (c3.high - c3.low) * 0.35 && 
         c1.close < (c3.open + c3.close) * 0.5)
      {
         m_last_pattern = PATTERN_EVENING_STAR;
         m_pattern_score = 12.0;
         m_pattern_name = "Evening Star (+12)";
         return m_last_pattern;
      }

      //--- 3. Three White Soldiers (Bullish)
      if(c3.close > c3.open && c2.close > c2.open && c1.close > c1.open &&
         c1.close > c2.close && c2.close > c3.close &&
         c1.open > c2.open && c2.open > c3.open)
      {
         m_last_pattern = PATTERN_THREE_WHITE_SOLDIERS;
         m_pattern_score = 12.0;
         m_pattern_name = "Three White Soldiers (+12)";
         return m_last_pattern;
      }

      //--- 4. Three Black Crows (Bearish)
      if(c3.close < c3.open && c2.close < c2.open && c1.close < c1.open &&
         c1.close < c2.close && c2.close < c3.close &&
         c1.open < c2.open && c2.open < c3.open)
      {
         m_last_pattern = PATTERN_THREE_BLACK_CROWS;
         m_pattern_score = 12.0;
         m_pattern_name = "Three Black Crows (+12)";
         return m_last_pattern;
      }

      //--- 5. Bullish Engulfing
      if(c2.close < c2.open && c1.close > c1.open && 
         c1.open <= c2.close && c1.close >= c2.open && c1_body > c2_body)
      {
         m_last_pattern = PATTERN_BULLISH_ENGULFING;
         m_pattern_score = 10.0;
         m_pattern_name = "Bullish Engulfing (+10)";
         return m_last_pattern;
      }

      //--- 6. Bearish Engulfing
      if(c2.close > c2.open && c1.close < c1.open && 
         c1.open >= c2.close && c1.close <= c2.open && c1_body > c2_body)
      {
         m_last_pattern = PATTERN_BEARISH_ENGULFING;
         m_pattern_score = 10.0;
         m_pattern_name = "Bearish Engulfing (+10)";
         return m_last_pattern;
      }

      //--- 7. Piercing Pattern (Bullish)
      if(c2.close < c2.open && c1.close > c1.open &&
         c1.open < c2.low && c1.close > (c2.open + c2.close) * 0.5 && c1.close < c2.open)
      {
         m_last_pattern = PATTERN_PIERCING;
         m_pattern_score = 9.0;
         m_pattern_name = "Piercing Pattern (+9)";
         return m_last_pattern;
      }

      //--- 8. Dark Cloud Cover (Bearish)
      if(c2.close > c2.open && c1.close < c1.open &&
         c1.open > c2.high && c1.close < (c2.open + c2.close) * 0.5 && c1.close > c2.open)
      {
         m_last_pattern = PATTERN_DARK_CLOUD;
         m_pattern_score = 9.0;
         m_pattern_name = "Dark Cloud Cover (+9)";
         return m_last_pattern;
      }

      //--- 9. Hammer (Bullish Reversal)
      double lower_wick1 = MathMin(c1.open, c1.close) - c1.low;
      double upper_wick1 = c1.high - MathMax(c1.open, c1.close);
      if(lower_wick1 >= 2.0 * c1_body && upper_wick1 <= 0.25 * c1_range)
      {
         m_last_pattern = PATTERN_HAMMER;
         m_pattern_score = 8.0;
         m_pattern_name = "Hammer (+8)";
         return m_last_pattern;
      }

      //--- 10. Shooting Star (Bearish Reversal)
      if(upper_wick1 >= 2.0 * c1_body && lower_wick1 <= 0.25 * c1_range)
      {
         m_last_pattern = PATTERN_SHOOTING_STAR;
         m_pattern_score = 8.0;
         m_pattern_name = "Shooting Star (+8)";
         return m_last_pattern;
      }

      //--- 11. Inverted Hammer (Bullish Reversal after downtrend)
      if(upper_wick1 >= 2.0 * c1_body && lower_wick1 <= 0.2 * c1_range && c2.close < c2.open)
      {
         m_last_pattern = PATTERN_INVERTED_HAMMER;
         m_pattern_score = 7.0;
         m_pattern_name = "Inverted Hammer (+7)";
         return m_last_pattern;
      }

      //--- 12. Marubozu Bullish / Bearish (Strong Momentum)
      if(c1_body >= 0.88 * c1_range)
      {
         if(c1.close > c1.open)
         {
            m_last_pattern = PATTERN_MARUBOZU_BULL;
            m_pattern_score = 8.0;
            m_pattern_name = "Bullish Marubozu (+8)";
            return m_last_pattern;
         }
         else
         {
            m_last_pattern = PATTERN_MARUBOZU_BEAR;
            m_pattern_score = 8.0;
            m_pattern_name = "Bearish Marubozu (+8)";
            return m_last_pattern;
         }
      }

      //--- 13. Tweezer Bottom (Bullish) / Top (Bearish)
      double pt = m_symbol_mgr.GetPoint();
      if(MathAbs(c1.low - c2.low) <= 2.0 * pt && lower_wick1 >= 1.5 * c1_body)
      {
         m_last_pattern = PATTERN_TWEEZER_BOTTOM;
         m_pattern_score = 8.0;
         m_pattern_name = "Tweezer Bottom (+8)";
         return m_last_pattern;
      }

      if(MathAbs(c1.high - c2.high) <= 2.0 * pt && upper_wick1 >= 1.5 * c1_body)
      {
         m_last_pattern = PATTERN_TWEEZER_TOP;
         m_pattern_score = 8.0;
         m_pattern_name = "Tweezer Top (+8)";
         return m_last_pattern;
      }

      return PATTERN_NONE;
   }

   ENUM_CANDLE_PATTERN GetLastPattern(void) const { return m_last_pattern; }
   double GetScore(void) const { return m_pattern_score; }
   string GetPatternName(void) const { return m_pattern_name; }
};

#endif
`;
