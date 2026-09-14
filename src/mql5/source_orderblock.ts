// OrderBlock.mqh - Institutional Order Block Detection (Bullish & Bearish)
export const CODE_ORDER_BLOCK_MQH = `//+------------------------------------------------------------------+
//|                                                   OrderBlock.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"

class COrderBlock
{
private:
   CSymbolManager*   m_symbol_mgr;
   SPriceZone        m_order_blocks[MAX_ZONES_BUFFER];
   int               m_ob_count;
   int               m_lookback_bars;
   double            m_min_impulse_ratio;

public:
   COrderBlock(void) :
      m_symbol_mgr(NULL),
      m_ob_count(0),
      m_lookback_bars(50),
      m_min_impulse_ratio(1.5)
   {}

   ~COrderBlock(void) {}

   void Init(CSymbolManager* sym_mgr, int lookback = 50, double impulse_ratio = 1.5)
   {
      m_symbol_mgr = sym_mgr;
      m_lookback_bars = lookback;
      m_min_impulse_ratio = impulse_ratio;
      m_ob_count = 0;
   }

   //--- Scan for Bullish & Bearish Order Blocks
   bool ScanOrderBlocks(ENUM_TIMEFRAMES tf, double current_atr = 0.0)
   {
      if(m_symbol_mgr == NULL) return false;
      string sym = m_symbol_mgr.GetSymbol();

      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      int copied = CopyRates(sym, tf, 0, m_lookback_bars, rates);
      if(copied < m_lookback_bars) return false;

      m_ob_count = 0;
      double min_displacement = (current_atr > 0.0) ? (current_atr * m_min_impulse_ratio) : (30.0 * m_symbol_mgr.GetPoint());

      for(int i = 2; i < copied - 3 && m_ob_count < MAX_ZONES_BUFFER; i++)
      {
         //--- Bullish OB: Last Bearish candle before strong Bullish displacement
         bool is_bear_candle = (rates[i].close < rates[i].open);
         double bull_move = rates[i - 2].close - rates[i].low;
         bool strong_bull_break = (rates[i - 1].close > rates[i].high && rates[i - 2].close > rates[i - 1].high);

         if(is_bear_candle && bull_move >= min_displacement && strong_bull_break)
         {
            SPriceZone ob;
            ob.type = ZONE_BULLISH_ORDER_BLOCK;
            ob.top_price = rates[i].high;
            ob.bottom_price = rates[i].low;
            ob.start_time = rates[i].time;
            ob.end_time = 0;
            ob.timeframe = tf;
            ob.retest_count = 0;

            bool invalidated = false;
            for(int k = i - 1; k >= 0; k--)
            {
               if(rates[k].low <= ob.top_price)
               {
                  ob.retest_count++;
                  if(rates[k].close < ob.bottom_price)
                  {
                     invalidated = true; // Closed below OB invalidates it
                     break;
                  }
               }
            }

            if(!invalidated)
            {
               ob.is_fresh = (ob.retest_count == 0);
               ob.strength_score = ob.is_fresh ? 15.0 : 8.0;
               m_order_blocks[m_ob_count++] = ob;
            }
         }

         //--- Bearish OB: Last Bullish candle before strong Bearish displacement
         bool is_bull_candle = (rates[i].close > rates[i].open);
         double bear_move = rates[i].high - rates[i - 2].close;
         bool strong_bear_break = (rates[i - 1].close < rates[i].low && rates[i - 2].close < rates[i - 1].low);

         if(is_bull_candle && bear_move >= min_displacement && strong_bear_break)
         {
            SPriceZone ob;
            ob.type = ZONE_BEARISH_ORDER_BLOCK;
            ob.top_price = rates[i].high;
            ob.bottom_price = rates[i].low;
            ob.start_time = rates[i].time;
            ob.end_time = 0;
            ob.timeframe = tf;
            ob.retest_count = 0;

            bool invalidated = false;
            for(int k = i - 1; k >= 0; k--)
            {
               if(rates[k].high >= ob.bottom_price)
               {
                  ob.retest_count++;
                  if(rates[k].close > ob.top_price)
                  {
                     invalidated = true; // Closed above OB invalidates it
                     break;
                  }
               }
            }

            if(!invalidated)
            {
               ob.is_fresh = (ob.retest_count == 0);
               ob.strength_score = ob.is_fresh ? 15.0 : 8.0;
               m_order_blocks[m_ob_count++] = ob;
            }
         }
      }

      return (m_ob_count > 0);
   }

   //--- Test if price is within an active Order Block
   bool IsPriceInOrderBlock(double price, ENUM_ZONE_TYPE ob_type, SPriceZone &matched_ob)
   {
      for(int i = 0; i < m_ob_count; i++)
      {
         if(m_order_blocks[i].type == ob_type)
         {
            if(price >= m_order_blocks[i].bottom_price && price <= m_order_blocks[i].top_price)
            {
               matched_ob = m_order_blocks[i];
               return true;
            }
         }
      }
      return false;
   }

   int GetOrderBlockCount(void) const { return m_ob_count; }
   bool GetOrderBlock(int index, SPriceZone &ob) const
   {
      if(index >= 0 && index < m_ob_count) { ob = m_order_blocks[index]; return true; }
      return false;
   }
};
`;
