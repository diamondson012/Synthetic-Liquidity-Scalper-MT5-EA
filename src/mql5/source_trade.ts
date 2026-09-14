// TradeEngine.mqh - Order Execution, Anti-Chasing, Anti-Duplicate Signal ID, Boom/Crash Execution
export const CODE_TRADE_ENGINE_MQH = `//+------------------------------------------------------------------+
//|                                                  TradeEngine.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include <Trade\\Trade.mqh>
#include "Defines.mqh"
#include "SymbolManager.mqh"
#include "RiskManager.mqh"

class CTradeEngine
{
private:
   CSymbolManager*   m_symbol_mgr;
   CRiskManager*     m_risk_mgr;
   CTrade            m_trade;
   ulong             m_magic;
   string            m_last_signal_id;
   datetime          m_last_trade_time;
   int               m_cooldown_seconds;
   bool              m_buy_enabled;
   bool              m_sell_enabled;

public:
   CTradeEngine(void) :
      m_symbol_mgr(NULL),
      m_risk_mgr(NULL),
      m_magic(MAGIC_NUMBER_DEFAULT),
      m_last_signal_id(""),
      m_last_trade_time(0),
      m_cooldown_seconds(180),
      m_buy_enabled(true),
      m_sell_enabled(true)
   {}

   ~CTradeEngine(void) {}

   void Init(CSymbolManager* sym_mgr, CRiskManager* risk_mgr, ulong magic = MAGIC_NUMBER_DEFAULT, int cooldown_sec = 180)
   {
      m_symbol_mgr = sym_mgr;
      m_risk_mgr   = risk_mgr;
      m_magic      = magic;
      m_cooldown_seconds = cooldown_sec;

      m_trade.SetExpertMagicNumber(m_magic);
      m_trade.SetDeviationInPoints(15);
      m_trade.SetTypeFilling(ORDER_FILLING_FOK);
   }

   //--- Execute Buy or Sell with Full Guardrails
   bool ExecuteTrade(int direction, double sl_price, double tp1_price, double tp2_price, double tp3_price, string signal_id, SConfluenceScore &score)
   {
      if(m_symbol_mgr == NULL || m_risk_mgr == NULL) return false;
      string sym = m_symbol_mgr.GetSymbol();

      // Check Direction Enablement
      if(direction == 1 && !m_buy_enabled)
      {
         Print("[CTradeEngine] BUY is currently disabled by user.");
         return false;
      }
      if(direction == -1 && !m_sell_enabled)
      {
         Print("[CTradeEngine] SELL is currently disabled by user.");
         return false;
      }

      // 1. Anti-Duplicate Signal ID Check
      if(signal_id == m_last_signal_id && signal_id != "")
      {
         PrintFormat("[CTradeEngine] Trade Blocked: Signal ID %s has already been executed.", signal_id);
         return false;
      }

      // 2. Cooldown Check
      datetime now = TimeCurrent();
      if(m_last_trade_time > 0 && (now - m_last_trade_time) < m_cooldown_seconds)
      {
         PrintFormat("[CTradeEngine] Trade Blocked: In cooldown period (%d sec remaining).", m_cooldown_seconds - (int)(now - m_last_trade_time));
         return false;
      }

      // 3. Execution Health Check
      string fail_reason = "";
      if(!m_symbol_mgr.IsExecutionValid(30.0, fail_reason))
      {
         PrintFormat("[CTradeEngine] Execution Blocked: %s", fail_reason);
         return false;
      }

      double current_ask = SymbolInfoDouble(sym, SYMBOL_ASK);
      double current_bid = SymbolInfoDouble(sym, SYMBOL_BID);
      double entry_price = (direction == 1) ? current_ask : current_bid;

      // 4. Calculate Risk-Adjusted Position Size
      double lot_size = 0.0;
      double monetary_risk = 0.0;
      if(!m_risk_mgr->CalculateLotSize(entry_price, sl_price, lot_size, monetary_risk, fail_reason))
      {
         PrintFormat("[CTradeEngine] Risk Blocked: %s", fail_reason);
         return false;
      }

      // 5. Place Market Order with Retries
      bool success = false;
      string comment = StringFormat("SLS_%s_Sc%.0f", (direction == 1 ? "B" : "S"), score.total_score);

      for(int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++)
      {
         if(direction == 1)
            success = m_trade.Buy(lot_size, sym, entry_price, sl_price, tp2_price, comment);
         else
            success = m_trade.Sell(lot_size, sym, entry_price, sl_price, tp2_price, comment);

         if(success)
         {
            ulong deal_ticket = m_trade.ResultDeal();
            PrintFormat("[CTradeEngine] ORDER FILLED! Deal: %d | %s %.2f lots @ %.5f | SL: %.5f | TP: %.5f | Risk: $%.2f",
                        deal_ticket, (direction == 1 ? "BUY" : "SELL"), lot_size, entry_price, sl_price, tp2_price, monetary_risk);
            m_last_signal_id = signal_id;
            m_last_trade_time = now;
            break;
         }
         else
         {
            PrintFormat("[CTradeEngine] Attempt %d failed: Code %d - %s", attempt, m_trade.ResultRetcode(), m_trade.ResultRetcodeDescription());
            Sleep(RETRY_DELAY_MS);
            entry_price = (direction == 1) ? SymbolInfoDouble(sym, SYMBOL_ASK) : SymbolInfoDouble(sym, SYMBOL_BID);
         }
      }

      return success;
   }

   //--- Direction and State Toggles
   void SetBuyEnabled(bool enable) { m_buy_enabled = enable; }
   void SetSellEnabled(bool enable) { m_sell_enabled = enable; }
   bool IsBuyEnabled(void) const { return m_buy_enabled; }
   bool IsSellEnabled(void) const { return m_sell_enabled; }
};
`;
