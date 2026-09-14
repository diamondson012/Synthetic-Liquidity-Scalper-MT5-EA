// FVGEngine.mqh - 3-Candle Fair Value Gap & Imbalance Detection
export const CODE_FVG_ENGINE_MQH = `//+------------------------------------------------------------------+
//|                                                    FVGEngine.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"

class CFVGEngine
{
private:
   CSymbolManager*   m_symbol_mgr;
   SPriceZone        m_fvgs[MAX_ZONES_BUFFER];
   int               m_fvg_count;
   double            m_min_gap_points;

public:
   CFVGEngine(void) :
      m_symbol_mgr(NULL),
      m_fvg_count(0),
      m_min_gap_points(2.0)
   {}

   ~CFVGEngine(void) {}

   void Init(CSymbolManager* sym_mgr, double min_gap = 2.0)
   {
      m_symbol_mgr = sym_mgr;
      m_min_gap_points = min_gap;
      m_fvg_count = 0;
   }

   //--- Scan 3-Candle Imbalances (FVGs)
   bool ScanFVGs(ENUM_TIMEFRAMES tf, int lookback_bars = 40)
   {
      if(m_symbol_mgr == NULL) return false;
      string sym = m_symbol_mgr.GetSymbol();

      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      int copied = CopyRates(sym, tf, 0, lookback_bars, rates);
      if(copied < lookback_bars) return false;

      m_fvg_count = 0;
      double pt = m_symbol_mgr.GetPoint();
      double min_gap_distance = m_min_gap_points * pt;

      // Check 3-candle sets (Candle 1: i+2, Candle 2: i+1, Candle 3: i)
      for(int i = 1; i < copied - 2 && m_fvg_count < MAX_ZONES_BUFFER; i++)
      {
         //--- Bullish FVG: Low of Candle i > High of Candle i+2
         if(rates[i].low - rates[i + 2].high >= min_gap_distance && rates[i + 1].close > rates[i + 1].open)
         {
            SPriceZone fvg;
            fvg.type = ZONE_BULLISH_FVG;
            fvg.top_price = rates[i].low;
            fvg.bottom_price = rates[i + 2].high;
            fvg.start_time = rates[i + 1].time;
            fvg.end_time = 0;
            fvg.timeframe = tf;
            fvg.retest_count = 0;

            // Check mitigation by subsequent candles
            bool filled = false;
            for(int k = i - 1; k >= 0; k--)
            {
               if(rates[k].low <= fvg.bottom_price)
               {
                  filled = true; // Fully filled/mitigated
                  break;
               }
               else if(rates[k].low < fvg.top_price)
               {
                  fvg.retest_count++;
               }
            }

            if(!filled)
            {
               fvg.is_fresh = (fvg.retest_count == 0);
               fvg.strength_score = fvg.is_fresh ? 10.0 : 5.0;
               m_fvgs[m_fvg_count++] = fvg;
            }
         }

         //--- Bearish FVG: High of Candle i < Low of Candle i+2
         if(rates[i + 2].low - rates[i].high >= min_gap_distance && rates[i + 1].close < rates[i + 1].open)
         {
            SPriceZone fvg;
            fvg.type = ZONE_BEARISH_FVG;
            fvg.top_price = rates[i + 2].low;
            fvg.bottom_price = rates[i].high;
            fvg.start_time = rates[i + 1].time;
            fvg.end_time = 0;
            fvg.timeframe = tf;
            fvg.retest_count = 0;

            bool filled = false;
            for(int k = i - 1; k >= 0; k--)
            {
               if(rates[k].high >= fvg.top_price)
               {
                  filled = true;
                  break;
               }
               else if(rates[k].high > fvg.bottom_price)
               {
                  fvg.retest_count++;
               }
            }

            if(!filled)
            {
               fvg.is_fresh = (fvg.retest_count == 0);
               fvg.strength_score = fvg.is_fresh ? 10.0 : 5.0;
               m_fvgs[m_fvg_count++] = fvg;
            }
         }
      }

      return (m_fvg_count > 0);
   }

   //--- Test if current price is inside an active FVG
   bool IsPriceInFVG(double price, ENUM_ZONE_TYPE fvg_type, SPriceZone &matched_fvg)
   {
      for(int i = 0; i < m_fvg_count; i++)
      {
         if(m_fvgs[i].type == fvg_type)
         {
            if(price >= m_fvgs[i].bottom_price && price <= m_fvgs[i].top_price)
            {
               matched_fvg = m_fvgs[i];
               return true;
            }
         }
      }
      return false;
   }

   int GetFVGCount(void) const { return m_fvg_count; }
   bool GetFVG(int index, SPriceZone &fvg) const
   {
      if(index >= 0 && index < m_fvg_count) { fvg = m_fvgs[index]; return true; }
      return false;
   }
};
`;
