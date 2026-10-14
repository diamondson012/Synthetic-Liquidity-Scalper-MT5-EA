// SymbolManager.mqh - Dynamic Broker Symbol Specifications & Synthetic Classification
export const CODE_SYMBOL_MANAGER_MQH = `
#ifndef SLS_SOURCE_SYMBOL
#define SLS_SOURCE_SYMBOL
//+------------------------------------------------------------------+
//|                                                SymbolManager.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"

class CSymbolManager
{
private:
   string          m_symbol;
   SSymbolProfile  m_profile;
   bool            m_initialized;

public:
   CSymbolManager(void) : m_symbol(""), m_initialized(false) {}
   ~CSymbolManager(void) {}

   //--- Initialize symbol parameters dynamically
   bool Init(string symbol)
   {
      m_symbol = (symbol == "" || symbol == "CURRENT") ? _Symbol : symbol;
      
      if(!SymbolSelect(m_symbol, true))
      {
         PrintFormat("[CSymbolManager] Error: Unable to select symbol %s in Market Watch", m_symbol);
         return false;
      }

      m_profile.symbol_name   = m_symbol;
      m_profile.digits_count  = (int)SymbolInfoInteger(m_symbol, SYMBOL_DIGITS);
      m_profile.point_value   = SymbolInfoDouble(m_symbol, SYMBOL_POINT);
      m_profile.min_lot       = SymbolInfoDouble(m_symbol, SYMBOL_VOLUME_MIN);
      m_profile.max_lot       = SymbolInfoDouble(m_symbol, SYMBOL_VOLUME_MAX);
      m_profile.lot_step      = SymbolInfoDouble(m_symbol, SYMBOL_VOLUME_STEP);
      m_profile.tick_size     = SymbolInfoDouble(m_symbol, SYMBOL_TRADE_TICK_SIZE);
      m_profile.tick_value    = SymbolInfoDouble(m_symbol, SYMBOL_TRADE_TICK_VALUE);
      m_profile.stop_level    = (double)SymbolInfoInteger(m_symbol, SYMBOL_TRADE_STOPS_LEVEL) * m_profile.point_value;
      m_profile.freeze_level  = (double)SymbolInfoInteger(m_symbol, SYMBOL_TRADE_FREEZE_LEVEL) * m_profile.point_value;
      m_profile.contract_size = SymbolInfoDouble(m_symbol, SYMBOL_TRADE_CONTRACT_SIZE);

      //--- Detect Synthetic Boom & Crash Variants regardless of broker naming (e.g. BOOM1000, Boom 500 Index, B1000, Crash_300)
      string upper_sym = m_symbol;
      StringToUpper(upper_sym);

      m_profile.is_boom  = (StringFind(upper_sym, "BOOM") >= 0 || StringFind(upper_sym, "B1000") >= 0 || StringFind(upper_sym, "B500") >= 0 || StringFind(upper_sym, "B300") >= 0);
      m_profile.is_crash = (StringFind(upper_sym, "CRASH") >= 0 || StringFind(upper_sym, "C1000") >= 0 || StringFind(upper_sym, "C500") >= 0 || StringFind(upper_sym, "C300") >= 0);
      m_profile.is_synthetic = (m_profile.is_boom || m_profile.is_crash || StringFind(upper_sym, "VOLATILITY") >= 0 || StringFind(upper_sym, "VIX") >= 0 || StringFind(upper_sym, "STEP") >= 0 || StringFind(upper_sym, "JUMP") >= 0);

      //--- Determine typical spike magnitude
      if(m_profile.is_boom || m_profile.is_crash)
      {
         if(StringFind(upper_sym, "1000") >= 0) m_profile.typical_spike_points = 30.0 / m_profile.point_value;
         else if(StringFind(upper_sym, "500") >= 0) m_profile.typical_spike_points = 20.0 / m_profile.point_value;
         else if(StringFind(upper_sym, "300") >= 0) m_profile.typical_spike_points = 15.0 / m_profile.point_value;
         else m_profile.typical_spike_points = 25.0 / m_profile.point_value;
      }
      else
      {
         m_profile.typical_spike_points = 0.0;
      }

      m_initialized = true;
      PrintFormat("[CSymbolManager] Initialized %s | Digits: %d | MinLot: %.2f | LotStep: %.2f | TickValue: %.4f | Boom: %s | Crash: %s",
                  m_symbol, m_profile.digits_count, m_profile.min_lot, m_profile.lot_step, m_profile.tick_value,
                  m_profile.is_boom ? "YES" : "NO", m_profile.is_crash ? "YES" : "NO");
      return true;
   }

   //--- Getters
   string GetSymbol(void) const { return m_symbol; }
   SSymbolProfile GetProfile(void) const { return m_profile; }
   bool IsBoom(void) const { return m_profile.is_boom; }
   bool IsCrash(void) const { return m_profile.is_crash; }
   bool IsSynthetic(void) const { return m_profile.is_synthetic; }
   double GetMinLot(void) const { return m_profile.min_lot; }
   double GetMaxLot(void) const { return m_profile.max_lot; }
   double GetLotStep(void) const { return m_profile.lot_step; }
   double GetPoint(void) const { return m_profile.point_value; }
   int GetDigits(void) const { return m_profile.digits_count; }
   double GetTickValue(void) const { return m_profile.tick_value; }
   double GetTickSize(void) const { return m_profile.tick_size; }
   double GetStopLevel(void) const { return m_profile.stop_level; }

   //--- Normalization Helpers
   double NormalizePrice(double price) const
   {
      return NormalizeDouble(price, m_profile.digits_count);
   }

   double NormalizeLots(double lots) const
   {
      if(m_profile.lot_step <= 0.0) return m_profile.min_lot;
      double steps = MathFloor((lots - m_profile.min_lot) / m_profile.lot_step + 0.000001);
      double normalized = m_profile.min_lot + steps * m_profile.lot_step;
      normalized = MathMax(m_profile.min_lot, MathMin(m_profile.max_lot, normalized));
      return NormalizeDouble(normalized, 2);
   }

   //--- Spread & Execution Readiness Checks
   bool IsExecutionValid(double max_allowed_spread_points, string &fail_reason)
   {
      if(!SymbolInfoInteger(m_symbol, SYMBOL_SELECT))
      {
         fail_reason = "Symbol not selected in Market Watch";
         return false;
      }

      long trade_mode = SymbolInfoInteger(m_symbol, SYMBOL_TRADE_MODE);
      if(trade_mode == SYMBOL_TRADE_MODE_DISABLED)
      {
         fail_reason = "Trading is disabled for " + m_symbol;
         return false;
      }

      double ask = SymbolInfoDouble(m_symbol, SYMBOL_ASK);
      double bid = SymbolInfoDouble(m_symbol, SYMBOL_BID);
      if(ask <= 0.0 || bid <= 0.0)
      {
         fail_reason = "Invalid market price (Bid/Ask <= 0)";
         return false;
      }

      double current_spread = (ask - bid) / m_profile.point_value;
      if(max_allowed_spread_points > 0 && current_spread > max_allowed_spread_points)
      {
         fail_reason = StringFormat("Spread anomaly: %.1f pts > max %.1f pts", current_spread, max_allowed_spread_points);
         return false;
      }

      fail_reason = "OK";
      return true;
   }
};

#endif
`;
