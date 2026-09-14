// SupplyDemand.mqh - Supply & Demand Zone Detection and Scoring (+20 fresh, +15 rejection, +20 BOS etc.)
export const CODE_SUPPLY_DEMAND_MQH = `//+------------------------------------------------------------------+
//|                                                 SupplyDemand.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"

class CSupplyDemand
{
private:
   CSymbolManager*   m_symbol_mgr;
   SPriceZone        m_zones[MAX_ZONES_BUFFER];
   int               m_zone_count;
   double            m_min_impulse_atr_mult;

public:
   CSupplyDemand(void) :
      m_symbol_mgr(NULL),
      m_zone_count(0),
      m_min_impulse_atr_mult(1.8)
   {}

   ~CSupplyDemand(void) {}

   void Init(CSymbolManager* sym_mgr, double impulse_atr_mult = 1.8)
   {
      m_symbol_mgr = sym_mgr;
      m_min_impulse_atr_mult = impulse_atr_mult;
      m_zone_count = 0;
   }

   //--- Detect Supply and Demand zones on timeframe
   bool ScanZones(ENUM_TIMEFRAMES tf, int lookback_bars = 60, double current_atr = 0.0)
   {
      if(m_symbol_mgr == NULL) return false;
      string sym = m_symbol_mgr.GetSymbol();

      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      int copied = CopyRates(sym, tf, 0, lookback_bars, rates);
      if(copied < lookback_bars) return false;

      m_zone_count = 0;
      double min_displacement = (current_atr > 0.0) ? (current_atr * m_min_impulse_atr_mult) : (50.0 * m_symbol_mgr.GetPoint());

      for(int i = 3; i < copied - 3 && m_zone_count < MAX_ZONES_BUFFER; i++)
      {
         //--- Check Demand Zone (Origin of strong bullish displacement)
         double bull_displacement = rates[i - 2].close - rates[i].low;
         if(bull_displacement >= min_displacement && rates[i - 1].close > rates[i].high && rates[i - 2].close > rates[i - 1].high)
         {
            SPriceZone demand_zone;
            demand_zone.type = ZONE_DEMAND;
            demand_zone.top_price = MathMax(rates[i].open, rates[i].close);
            demand_zone.bottom_price = rates[i].low;
            demand_zone.start_time = rates[i].time;
            demand_zone.end_time = 0;
            demand_zone.timeframe = tf;
            demand_zone.retest_count = 0;

            // Check if tested by subsequent candles up to index 0
            bool mitigated = false;
            for(int k = i - 1; k >= 0; k--)
            {
               if(rates[k].low <= demand_zone.top_price)
               {
                  demand_zone.retest_count++;
                  if(rates[k].close < demand_zone.bottom_price)
                  {
                     mitigated = true; // Broken through
                     break;
                  }
               }
            }

            if(!mitigated)
            {
               demand_zone.is_fresh = (demand_zone.retest_count == 0);
               // Calculate Score: Fresh (+20), Strong Rejection (+15), BOS origin (+20)
               double score = 10.0;
               if(demand_zone.is_fresh) score += 20.0;
               else if(demand_zone.retest_count == 1) score += 10.0;
               if(bull_displacement > min_displacement * 1.5) score += 15.0;

               demand_zone.strength_score = score;
               m_zones[m_zone_count++] = demand_zone;
            }
         }

         //--- Check Supply Zone (Origin of strong bearish displacement)
         double bear_displacement = rates[i].high - rates[i - 2].close;
         if(bear_displacement >= min_displacement && rates[i - 1].close < rates[i].low && rates[i - 2].close < rates[i - 1].low)
         {
            SPriceZone supply_zone;
            supply_zone.type = ZONE_SUPPLY;
            supply_zone.top_price = rates[i].high;
            supply_zone.bottom_price = MathMin(rates[i].open, rates[i].close);
            supply_zone.start_time = rates[i].time;
            supply_zone.end_time = 0;
            supply_zone.timeframe = tf;
            supply_zone.retest_count = 0;

            bool mitigated = false;
            for(int k = i - 1; k >= 0; k--)
            {
               if(rates[k].high >= supply_zone.bottom_price)
               {
                  supply_zone.retest_count++;
                  if(rates[k].close > supply_zone.top_price)
                  {
                     mitigated = true; // Broken through
                     break;
                  }
               }
            }

            if(!mitigated)
            {
               supply_zone.is_fresh = (supply_zone.retest_count == 0);
               double score = 10.0;
               if(supply_zone.is_fresh) score += 20.0;
               else if(supply_zone.retest_count == 1) score += 10.0;
               if(bear_displacement > min_displacement * 1.5) score += 15.0;

               supply_zone.strength_score = score;
               m_zones[m_zone_count++] = supply_zone;
            }
         }
      }

      return (m_zone_count > 0);
   }

   //--- Test if current price is inside or reacting to a zone
   bool IsPriceInZone(double current_price, ENUM_ZONE_TYPE zone_type, SPriceZone &matched_zone)
   {
      for(int i = 0; i < m_zone_count; i++)
      {
         if(m_zones[i].type == zone_type)
         {
            if(current_price >= m_zones[i].bottom_price && current_price <= m_zones[i].top_price)
            {
               matched_zone = m_zones[i];
               return true;
            }
         }
      }
      return false;
   }

   int GetZoneCount(void) const { return m_zone_count; }
   bool GetZone(int index, SPriceZone &zone) const
   {
      if(index >= 0 && index < m_zone_count) { zone = m_zones[index]; return true; }
      return false;
   }
};
`;
