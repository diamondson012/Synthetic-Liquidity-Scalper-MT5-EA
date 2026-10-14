// LiquidityEngine.mqh - Equal Highs/Lows, Liquidity Pools, Liquidity Sweeps / Stop Hunts
export const CODE_LIQUIDITY_ENGINE_MQH = `
#ifndef SLS_SOURCE_LIQUIDITY
#define SLS_SOURCE_LIQUIDITY
//+------------------------------------------------------------------+
//|                                              LiquidityEngine.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"
#include "MarketStructure.mqh"

class CLiquidityEngine
{
private:
   CSymbolManager*   m_symbol_mgr;
   CMarketStructure* m_structure;
   double            m_eq_tolerance_points;
   bool              m_last_sweep_bullish;
   bool              m_last_sweep_bearish;
   datetime          m_last_sweep_time;
   double            m_last_swept_level;

public:
   CLiquidityEngine(void) :
      m_symbol_mgr(NULL),
      m_structure(NULL),
      m_eq_tolerance_points(5.0),
      m_last_sweep_bullish(false),
      m_last_sweep_bearish(false),
      m_last_sweep_time(0),
      m_last_swept_level(0.0)
   {}

   ~CLiquidityEngine(void) {}

   void Init(CSymbolManager* sym_mgr, CMarketStructure* struct_mgr, double eq_tolerance = 5.0)
   {
      m_symbol_mgr = sym_mgr;
      m_structure = struct_mgr;
      m_eq_tolerance_points = eq_tolerance;
   }

   //--- Scan for Equal Highs (EQH) and Equal Lows (EQL)
   bool FindEqualHighsLows(ENUM_TIMEFRAMES tf, bool &has_eqh, bool &has_eql, double &eqh_level, double &eql_level)
   {
      has_eqh = false;
      has_eql = false;
      eqh_level = 0.0;
      eql_level = 0.0;

      if(m_structure == NULL || m_symbol_mgr == NULL) return false;
      double pt = m_symbol_mgr.GetPoint();
      double tol = m_eq_tolerance_points * pt;

      int high_count = m_structure.GetHighsCount();
      int low_count  = m_structure.GetLowsCount();

      // Check Equal Highs in recent 4 swing highs
      for(int i = 0; i < MathMin(3, high_count - 1); i++)
      {
         SSwingPoint h1, h2;
         m_structure.GetRecentHigh(h1, i);
         m_structure.GetRecentHigh(h2, i + 1);

         if(MathAbs(h1.price - h2.price) <= tol)
         {
            has_eqh = true;
            eqh_level = MathMax(h1.price, h2.price);
            break;
         }
      }

      // Check Equal Lows in recent 4 swing lows
      for(int j = 0; j < MathMin(3, low_count - 1); j++)
      {
         SSwingPoint l1, l2;
         m_structure.GetRecentLow(l1, j);
         m_structure.GetRecentLow(l2, j + 1);

         if(MathAbs(l1.price - l2.price) <= tol)
         {
            has_eql = true;
            eql_level = MathMin(l1.price, l2.price);
            break;
         }
      }

      return (has_eqh || has_eql);
   }

   //--- Detect Liquidity Sweep / Stop Hunt (Wick pierced key level then closed back inside)
   bool DetectLiquiditySweep(ENUM_TIMEFRAMES tf, int lookback_bars = 10, int &sweep_direction)
   {
      sweep_direction = 0; // +1 = Bullish Sweep (pierced low & closed above), -1 = Bearish Sweep
      m_last_sweep_bullish = false;
      m_last_sweep_bearish = false;

      if(m_symbol_mgr == NULL || m_structure == NULL) return false;
      string sym = m_symbol_mgr.GetSymbol();

      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      int copied = CopyRates(sym, tf, 0, lookback_bars + 5, rates);
      if(copied < lookback_bars + 5) return false;

      SSwingPoint recent_low, recent_high;
      bool has_low  = m_structure.GetRecentLow(recent_low, 0);
      bool has_high = m_structure.GetRecentHigh(recent_high, 0);

      // Check latest 1 to 3 completed bars for sweep of key swing
      for(int i = 1; i <= 3; i++)
      {
         //--- Bullish Sweep: Candle pierced recent low with wick, but close is above the low
         if(has_low && rates[i].low < recent_low.price && rates[i].close > recent_low.price)
         {
            double lower_wick = MathMin(rates[i].open, rates[i].close) - rates[i].low;
            double candle_body = MathAbs(rates[i].close - rates[i].open);

            if(lower_wick >= candle_body * 0.8) // Significant rejection wick
            {
               m_last_sweep_bullish = true;
               m_last_sweep_time = rates[i].time;
               m_last_swept_level = recent_low.price;
               sweep_direction = 1;
               return true;
            }
         }

         //--- Bearish Sweep: Candle pierced recent high with wick, but close is below the high
         if(has_high && rates[i].high > recent_high.price && rates[i].close < recent_high.price)
         {
            double upper_wick = rates[i].high - MathMax(rates[i].open, rates[i].close);
            double candle_body = MathAbs(rates[i].close - rates[i].open);

            if(upper_wick >= candle_body * 0.8) // Significant rejection wick
            {
               m_last_sweep_bearish = true;
               m_last_sweep_time = rates[i].time;
               m_last_swept_level = recent_high.price;
               sweep_direction = -1;
               return true;
            }
         }
      }

      return false;
   }

   bool IsBullishSweep(void) const { return m_last_sweep_bullish; }
   bool IsBearishSweep(void) const { return m_last_sweep_bearish; }
   datetime GetSweepTime(void) const { return m_last_sweep_time; }
   double GetSweptLevel(void) const { return m_last_swept_level; }
};

#endif
`;
