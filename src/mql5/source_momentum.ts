// MomentumEngine.mqh - ATR, Volatility Filter, Multi-Timeframe Alignment
export const CODE_MOMENTUM_ENGINE_MQH = `
#ifndef SLS_SOURCE_MOMENTUM
#define SLS_SOURCE_MOMENTUM
//+------------------------------------------------------------------+
//|                                               MomentumEngine.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"

class CMomentumEngine
{
private:
   CSymbolManager*   m_symbol_mgr;
   int               m_atr_handle_m1;
   int               m_atr_handle_m5;
   int               m_atr_handle_m15;
   int               m_rsi_handle_m1;
   int               m_atr_period;
   double            m_current_atr_m1;
   double            m_current_atr_m15;
   double            m_current_rsi_m1;

public:
   CMomentumEngine(void) :
      m_symbol_mgr(NULL),
      m_atr_handle_m1(INVALID_HANDLE),
      m_atr_handle_m5(INVALID_HANDLE),
      m_atr_handle_m15(INVALID_HANDLE),
      m_rsi_handle_m1(INVALID_HANDLE),
      m_atr_period(14),
      m_current_atr_m1(0.0),
      m_current_atr_m15(0.0),
      m_current_rsi_m1(50.0)
   {}

   ~CMomentumEngine(void)
   {
      ReleaseHandles();
   }

   void ReleaseHandles(void)
   {
      if(m_atr_handle_m1 != INVALID_HANDLE) { IndicatorRelease(m_atr_handle_m1); m_atr_handle_m1 = INVALID_HANDLE; }
      if(m_atr_handle_m5 != INVALID_HANDLE) { IndicatorRelease(m_atr_handle_m5); m_atr_handle_m5 = INVALID_HANDLE; }
      if(m_atr_handle_m15 != INVALID_HANDLE) { IndicatorRelease(m_atr_handle_m15); m_atr_handle_m15 = INVALID_HANDLE; }
      if(m_rsi_handle_m1 != INVALID_HANDLE) { IndicatorRelease(m_rsi_handle_m1); m_rsi_handle_m1 = INVALID_HANDLE; }
   }

   bool Init(CSymbolManager* sym_mgr, int atr_period = 14)
   {
      m_symbol_mgr = sym_mgr;
      m_atr_period = atr_period;
      ReleaseHandles();

      string sym = m_symbol_mgr.GetSymbol();
      m_atr_handle_m1  = iATR(sym, PERIOD_M1, m_atr_period);
      m_atr_handle_m5  = iATR(sym, PERIOD_M5, m_atr_period);
      m_atr_handle_m15 = iATR(sym, PERIOD_M15, m_atr_period);
      m_rsi_handle_m1  = iRSI(sym, PERIOD_M1, 14, PRICE_CLOSE);

      if(m_atr_handle_m1 == INVALID_HANDLE || m_atr_handle_m15 == INVALID_HANDLE)
      {
         PrintFormat("[CMomentumEngine] Error: Failed to create indicator handles for %s", sym);
         return false;
      }
      return true;
   }

   //--- Update Current ATR and Momentum Metrics
   bool Update(void)
   {
      if(m_atr_handle_m1 == INVALID_HANDLE || m_atr_handle_m15 == INVALID_HANDLE) return false;

      double atr_buf_m1[1], atr_buf_m15[1], rsi_buf[1];
      if(CopyBuffer(m_atr_handle_m1, 0, 0, 1, atr_buf_m1) > 0)
         m_current_atr_m1 = atr_buf_m1[0];

      if(CopyBuffer(m_atr_handle_m15, 0, 0, 1, atr_buf_m15) > 0)
         m_current_atr_m15 = atr_buf_m15[0];

      if(m_rsi_handle_m1 != INVALID_HANDLE && CopyBuffer(m_rsi_handle_m1, 0, 0, 1, rsi_buf) > 0)
         m_current_rsi_m1 = rsi_buf[0];

      return (m_current_atr_m1 > 0.0);
   }

   //--- Validate Volatility bounds
   bool IsVolatilityValid(double min_atr_pts, double max_atr_pts, string &reason)
   {
      if(m_symbol_mgr == NULL) return false;
      double pt = m_symbol_mgr.GetPoint();
      double atr_pts = (pt > 0) ? (m_current_atr_m1 / pt) : 0.0;

      if(min_atr_pts > 0 && atr_pts < min_atr_pts)
      {
         reason = StringFormat("ATR too low (%.1f pts < min %.1f pts)", atr_pts, min_atr_pts);
         return false;
      }

      if(max_atr_pts > 0 && atr_pts > max_atr_pts)
      {
         reason = StringFormat("Extreme volatility anomaly (%.1f pts > max %.1f pts)", atr_pts, max_atr_pts);
         return false;
      }

      reason = "Volatility OK";
      return true;
   }

   double GetATRM1(void) const { return m_current_atr_m1; }
   double GetATRM15(void) const { return m_current_atr_m15; }
   double GetRSIM1(void) const { return m_current_rsi_m1; }
};

#endif
`;
