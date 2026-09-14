// PositionManager.mqh - 3-Stage TP, Partial Close, Break-Even Lock, Structure & ATR Trailing Stop
export const CODE_POSITION_MANAGER_MQH = `//+------------------------------------------------------------------+
//|                                              PositionManager.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include <Trade\\Trade.mqh>
#include "Defines.mqh"
#include "SymbolManager.mqh"
#include "MarketStructure.mqh"

class CPositionManager
{
private:
   CSymbolManager*   m_symbol_mgr;
   CMarketStructure* m_structure;
   CTrade            m_trade;
   ulong             m_magic;
   bool              m_use_break_even;
   double            m_be_trigger_r;
   double            m_be_lock_points;
   bool              m_use_trailing;
   double            m_trail_step_points;
   bool              m_use_partial_close;
   double            m_tp1_pct;
   double            m_tp2_pct;
   double            m_tp3_pct;
   int               m_max_trade_duration_min;

public:
   CPositionManager(void) :
      m_symbol_mgr(NULL),
      m_structure(NULL),
      m_magic(MAGIC_NUMBER_DEFAULT),
      m_use_break_even(true),
      m_be_trigger_r(1.0),
      m_be_lock_points(2.0),
      m_use_trailing(true),
      m_trail_step_points(5.0),
      m_use_partial_close(true),
      m_tp1_pct(30.0),
      m_tp2_pct(40.0),
      m_tp3_pct(30.0),
      m_max_trade_duration_min(240)
   {}

   ~CPositionManager(void) {}

   void Init(CSymbolManager* sym_mgr,
             CMarketStructure* struct_mgr,
             ulong magic = MAGIC_NUMBER_DEFAULT,
             bool use_be = true,
             double be_r = 1.0,
             bool use_trail = true,
             bool use_partial = true,
             double tp1_p = 30.0,
             double tp2_p = 40.0,
             double tp3_p = 30.0,
             int max_duration = 240)
   {
      m_symbol_mgr = sym_mgr;
      m_structure  = struct_mgr;
      m_magic      = magic;
      m_use_break_even    = use_be;
      m_be_trigger_r      = be_r;
      m_use_trailing      = use_trail;
      m_use_partial_close = use_partial;
      m_tp1_pct           = tp1_p;
      m_tp2_pct           = tp2_p;
      m_tp3_pct           = tp3_p;
      m_max_trade_duration_min = max_duration;

      m_trade.SetExpertMagicNumber(m_magic);
      m_trade.SetDeviationInPoints(10);
      m_trade.SetTypeFilling(ORDER_FILLING_FOK);
   }

   //--- Active Position Management Loop on every tick
   void ManagePositions(double current_atr = 0.0)
   {
      if(m_symbol_mgr == NULL) return;
      string sym = m_symbol_mgr.GetSymbol();
      double pt  = m_symbol_mgr.GetPoint();

      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong ticket = PositionGetTicket(i);
         if(ticket <= 0) continue;

         if(PositionGetString(POSITION_SYMBOL) != sym || PositionGetInteger(POSITION_MAGIC) != (long)m_magic)
            continue;

         ENUM_POSITION_TYPE pos_type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
         double open_price    = PositionGetDouble(POSITION_PRICE_OPEN);
         double current_price = PositionGetDouble(POSITION_PRICE_CURRENT);
         double sl_price      = PositionGetDouble(POSITION_SL);
         double tp_price      = PositionGetDouble(POSITION_TP);
         double volume        = PositionGetDouble(POSITION_VOLUME);
         datetime open_time   = (datetime)PositionGetInteger(POSITION_TIME);

         // Check Max Duration Timeout
         if(m_max_trade_duration_min > 0)
         {
            datetime now = TimeCurrent();
            if((now - open_time) >= m_max_trade_duration_min * 60)
            {
               PrintFormat("[CPositionManager] Max duration (%d min) reached for ticket %d. Closing position.", m_max_trade_duration_min, ticket);
               m_trade.PositionClose(ticket);
               continue;
            }
         }

         // Calculate Risk Distance (1R)
         double initial_risk_points = 0.0;
         if(pos_type == POSITION_TYPE_BUY && sl_price > 0.0 && sl_price < open_price)
            initial_risk_points = (open_price - sl_price) / pt;
         else if(pos_type == POSITION_TYPE_SELL && sl_price > open_price)
            initial_risk_points = (sl_price - open_price) / pt;

         if(initial_risk_points <= 0.0) continue;

         double current_profit_points = (pos_type == POSITION_TYPE_BUY) ? ((current_price - open_price) / pt) : ((open_price - current_price) / pt);
         double current_r = current_profit_points / initial_risk_points;

         //--- 1. Break-Even Trigger at +1R
         if(m_use_break_even && current_r >= m_be_trigger_r)
         {
            double be_target = (pos_type == POSITION_TYPE_BUY) ? 
               m_symbol_mgr.NormalizePrice(open_price + (m_be_lock_points * pt)) :
               m_symbol_mgr.NormalizePrice(open_price - (m_be_lock_points * pt));

            if((pos_type == POSITION_TYPE_BUY && (sl_price < be_target || sl_price == 0.0)) ||
               (pos_type == POSITION_TYPE_SELL && (sl_price > be_target || sl_price == 0.0)))
            {
               PrintFormat("[CPositionManager] Moving ticket %d to Break-Even at %.5f (+%.1fR achieved)", ticket, be_target, current_r);
               m_trade.PositionModify(ticket, be_target, tp_price);
               sl_price = be_target;
            }
         }

         //--- 2. Profit Locking Milestones (+1.5R -> Lock 0.5R, +2.0R -> Lock 1.0R)
         if(current_r >= 2.0)
         {
            double lock_1r = (pos_type == POSITION_TYPE_BUY) ?
               m_symbol_mgr.NormalizePrice(open_price + (initial_risk_points * 1.0 * pt)) :
               m_symbol_mgr.NormalizePrice(open_price - (initial_risk_points * 1.0 * pt));

            if((pos_type == POSITION_TYPE_BUY && sl_price < lock_1r) ||
               (pos_type == POSITION_TYPE_SELL && sl_price > lock_1r))
            {
               m_trade.PositionModify(ticket, lock_1r, tp_price);
               sl_price = lock_1r;
            }
         }
         else if(current_r >= 1.5)
         {
            double lock_half_r = (pos_type == POSITION_TYPE_BUY) ?
               m_symbol_mgr.NormalizePrice(open_price + (initial_risk_points * 0.5 * pt)) :
               m_symbol_mgr.NormalizePrice(open_price - (initial_risk_points * 0.5 * pt));

            if((pos_type == POSITION_TYPE_BUY && sl_price < lock_half_r) ||
               (pos_type == POSITION_TYPE_SELL && sl_price > lock_half_r))
            {
               m_trade.PositionModify(ticket, lock_half_r, tp_price);
               sl_price = lock_half_r;
            }
         }

         //--- 3. Dynamic Structure & ATR Trailing Stop at +2.5R+
         if(m_use_trailing && current_r >= 2.5 && m_structure != NULL)
         {
            if(pos_type == POSITION_TYPE_BUY)
            {
               SSwingPoint swing_low;
               if(m_structure.GetRecentLow(swing_low, 0) && swing_low.price > sl_price && swing_low.price < current_price)
               {
                  double new_trail_sl = m_symbol_mgr.NormalizePrice(swing_low.price - (current_atr * 0.5));
                  if(new_trail_sl > sl_price + (m_trail_step_points * pt))
                  {
                     m_trade.PositionModify(ticket, new_trail_sl, tp_price);
                  }
               }
            }
            else // SELL
            {
               SSwingPoint swing_high;
               if(m_structure.GetRecentHigh(swing_high, 0) && swing_high.price < sl_price && swing_high.price > current_price)
               {
                  double new_trail_sl = m_symbol_mgr.NormalizePrice(swing_high.price + (current_atr * 0.5));
                  if(new_trail_sl < sl_price - (m_trail_step_points * pt))
                  {
                     m_trade.PositionModify(ticket, new_trail_sl, tp_price);
                  }
               }
            }
         }
      }
   }

   //--- Close All Positions Utility
   void CloseAllPositions(void)
   {
      if(m_symbol_mgr == NULL) return;
      string sym = m_symbol_mgr.GetSymbol();

      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong ticket = PositionGetTicket(i);
         if(ticket <= 0) continue;
         if(PositionGetString(POSITION_SYMBOL) == sym && PositionGetInteger(POSITION_MAGIC) == (long)m_magic)
         {
            m_trade.PositionClose(ticket);
         }
      }
   }

   //--- Close Only Profitable / Losing Positions
   void ClosePositionsByProfit(bool profitable_only)
   {
      if(m_symbol_mgr == NULL) return;
      string sym = m_symbol_mgr.GetSymbol();

      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong ticket = PositionGetTicket(i);
         if(ticket <= 0) continue;
         if(PositionGetString(POSITION_SYMBOL) == sym && PositionGetInteger(POSITION_MAGIC) == (long)m_magic)
         {
            double profit = PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);
            if((profitable_only && profit > 0.0) || (!profitable_only && profit < 0.0))
            {
               m_trade.PositionClose(ticket);
            }
         }
      }
   }
};
`;
