// RiskManager.mqh - Micro-Account Risk Architecture, Mathematical Safety, Target Objectives, No-Martingale
export const CODE_RISK_MANAGER_MQH = `
#ifndef SLS_SOURCE_RISK
#define SLS_SOURCE_RISK
//+------------------------------------------------------------------+
//|                                                  RiskManager.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"

class CRiskManager
{
private:
   CSymbolManager*   m_symbol_mgr;
   string m_state_key;
   double            m_risk_percent;
   double            m_daily_loss_limit_pct;
   double            m_daily_profit_target_pct;
   int               m_max_consecutive_losses;
   int               m_max_trades_per_day;
   int               m_max_open_trades;
   bool              m_micro_account_mode;
   
   //--- Target Tracking
   double            m_start_target_balance;
   double            m_growth_target_balance;
   double            m_daily_growth_target;
   double            m_weekly_growth_target;

   //--- Session State Counters
   datetime          m_current_day;
   double            m_day_start_equity;
   double            m_week_start_equity;
   int               m_trades_today_count;
   int               m_consecutive_losses;
   double            m_daily_realized_pl;
   bool              m_is_paused;
   string            m_pause_reason;

public:
   CRiskManager(void) :
      m_symbol_mgr(NULL),
      m_risk_percent(1.0),
      m_daily_loss_limit_pct(5.0),
      m_daily_profit_target_pct(10.0),
      m_max_consecutive_losses(3),
      m_max_trades_per_day(10),
      m_max_open_trades(1),
      m_micro_account_mode(true),
      m_start_target_balance(10.0),
      m_growth_target_balance(250.0),
      m_daily_growth_target(10.0),
      m_weekly_growth_target(50.0),
      m_current_day(0),
      m_day_start_equity(0.0),
      m_week_start_equity(0.0),
      m_trades_today_count(0),
      m_consecutive_losses(0),
      m_daily_realized_pl(0.0),
      m_is_paused(false),
      m_pause_reason("")
   {}

   ~CRiskManager(void) {}

   void Init(CSymbolManager* sym_mgr,
             double risk_pct = 1.0,
             double daily_loss_pct = 5.0,
             double daily_profit_pct = 10.0,
             int max_consec_losses = 3,
             int max_trades_day = 10,
             int max_open = 1,
             bool micro_mode = true,
             double start_target = 10.0,
             double growth_target = 250.0)
   {
      m_symbol_mgr = sym_mgr;
      m_risk_percent = risk_pct;
      m_daily_loss_limit_pct = daily_loss_pct;
      m_daily_profit_target_pct = daily_profit_pct;
      m_max_consecutive_losses = max_consec_losses;
      m_max_trades_per_day = max_trades_day;
      m_max_open_trades = max_open;
      m_micro_account_mode = micro_mode;
      m_start_target_balance = start_target;
      m_growth_target_balance = growth_target;

      m_state_key = StringFormat("SLS_%I64d_%s_", AccountInfoInteger(ACCOUNT_LOGIN), m_symbol_mgr.GetSymbol());
      if(MQLInfoInteger(MQL_TESTER))
      {
         m_state_key = "TEST_"+m_state_key;
         GlobalVariablesDeleteAll(m_state_key);
      }
      ResetDailySessionIfNeeded();
   }

   //--- Daily Session Refresh
   void ResetDailySessionIfNeeded(void)
   {
      datetime now = TimeCurrent();
      MqlDateTime dt;
      TimeToStruct(now, dt);
      dt.hour = 0; dt.min = 0; dt.sec = 0;
      datetime today_start = StructToTime(dt);

      if(m_current_day != today_start)
      {
         m_current_day = today_start;
         m_day_start_equity = AccountInfoDouble(ACCOUNT_EQUITY);
         string key = m_state_key + IntegerToString((long)today_start);
         if(GlobalVariableCheck(key)) m_day_start_equity = GlobalVariableGet(key);
         else GlobalVariableSet(key, m_day_start_equity);

         if(m_week_start_equity <= 0.0 || dt.day_of_week == 1) // Monday
            m_week_start_equity = m_day_start_equity;
         string count_key = m_state_key + "count_" + IntegerToString((long)today_start);
         m_trades_today_count = GlobalVariableCheck(count_key) ? (int)GlobalVariableGet(count_key) : 0;
         m_consecutive_losses = GlobalVariableCheck(m_state_key+"losses_"+IntegerToString((long)m_current_day)) ? (int)GlobalVariableGet(m_state_key+"losses_"+IntegerToString((long)m_current_day)) : 0;
         m_daily_realized_pl = 0.0;
         m_is_paused = false;
         m_pause_reason = "";
      }
   }

   //--- Position Sizing with Strict Micro-Account Math & Broker Constraints
   bool CalculateLotSize(double entry_price, double sl_price, double &calculated_lot, double &monetary_risk, string &fail_reason)
   {
      calculated_lot = 0.0;
      monetary_risk = 0.0;
      fail_reason = "";

      if(m_symbol_mgr == NULL)
      {
         fail_reason = "Symbol manager not initialized";
         return false;
      }

      double balance = AccountInfoDouble(ACCOUNT_BALANCE);
      double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
      if(balance <= 0.0)
      {
         fail_reason = "Account balance is zero or negative";
         return false;
      }

      CheckLimits();
      // Check daily risk pause
      if(m_is_paused)
      {
         fail_reason = m_pause_reason;
         return false;
      }

      // Target Achieved Check
      if(equity >= m_growth_target_balance && m_growth_target_balance > 0.0)
      {
         m_is_paused = true;
         m_pause_reason = "TARGET ACHIEVED ($" + DoubleToString(equity, 2) + " >= Target $" + DoubleToString(m_growth_target_balance, 2) + ")";
         fail_reason = m_pause_reason;
         return false;
      }

      // SL Distance Check
      double sl_dist = MathAbs(entry_price - sl_price);
      double point = m_symbol_mgr.GetPoint();
      if(sl_dist <= point)
      {
         fail_reason = "Stop Loss distance is too tight / invalid";
         return false;
      }

      // Desired Risk in Account Currency
      double allowed_risk_money = balance * (m_risk_percent / 100.0);

      double loss = 0;
      ENUM_ORDER_TYPE side = sl_price < entry_price ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
      if(!OrderCalcProfit(side, m_symbol_mgr.GetSymbol(), 1.0, entry_price, sl_price, loss) || loss >= 0)
      { fail_reason="Broker risk calculation failed"; return false; }
      double risk_per_lot = -loss;

      double raw_lot = allowed_risk_money / risk_per_lot;
      double min_lot = m_symbol_mgr.GetMinLot();
      double max_lot = m_symbol_mgr.GetMaxLot();

      // Normalize lots according to broker lot_step
      double step = SymbolInfoDouble(m_symbol_mgr.GetSymbol(), SYMBOL_VOLUME_STEP);
      if(step <= 0 || raw_lot < min_lot) { fail_reason = "Minimum lot exceeds risk budget"; return false; }
      double final_lot = MathFloor(MathMin(raw_lot, max_lot) / step) * step;

      // Calculate actual monetary loss if minimum lot is used
      double actual_money_risk = final_lot * risk_per_lot;

      // Micro Account Mathematical Safety Guard:
      // If the broker's minimum lot size would cause actual risk to exceed 2.5x allowed risk or 10% of account
      if(actual_money_risk > allowed_risk_money + 0.0000001 || actual_money_risk > balance * 0.10)
      {
         fail_reason = StringFormat("ACCOUNT SIZE TOO SMALL FOR SAFE POSITION SIZING (MinLot %.2f would risk $%.2f > Max Allowed $%.2f)",
                                    min_lot, actual_money_risk, allowed_risk_money);
         return false;
      }

      calculated_lot = final_lot;
      monetary_risk = actual_money_risk;
      return true;
   }

   //--- Update State on Trade Closed
   void OnTradeClosed(double profit_amount)
   {
      m_daily_realized_pl += profit_amount;


      if(profit_amount < 0.0)
      {
         m_consecutive_losses++;
         if(m_max_consecutive_losses > 0 && m_consecutive_losses >= m_max_consecutive_losses)
         {
            m_is_paused = true;
            m_pause_reason = StringFormat("MAX CONSECUTIVE LOSSES REACHED (%d losses)", m_consecutive_losses);
         }
      }
      else
      {
         m_consecutive_losses = 0;
      }

      GlobalVariableSet(m_state_key+"losses_"+IntegerToString((long)m_current_day), m_consecutive_losses);
      GlobalVariablesFlush();
      // Check Daily Loss Limit
      double current_equity = AccountInfoDouble(ACCOUNT_EQUITY);
      if(m_day_start_equity > 0.0)
      {
         double daily_drawdown_pct = ((m_day_start_equity - current_equity) / m_day_start_equity) * 100.0;
         if(daily_drawdown_pct >= m_daily_loss_limit_pct)
         {
            m_is_paused = true;
            m_pause_reason = StringFormat("DAILY RISK LIMIT REACHED (Drawdown %.2f%% >= Limit %.2f%%)", daily_drawdown_pct, m_daily_loss_limit_pct);
         }
      }
   }

   void OnTradeOpened(void)
   {
      m_trades_today_count++;
      GlobalVariableSet(m_state_key+"count_"+IntegerToString((long)m_current_day), m_trades_today_count);
      GlobalVariablesFlush();
   }
   void CheckLimits(void)
   {
      double eq = AccountInfoDouble(ACCOUNT_EQUITY);
      if((m_day_start_equity > 0 && (m_day_start_equity-eq)/m_day_start_equity*100 >= m_daily_loss_limit_pct) ||
         m_trades_today_count >= m_max_trades_per_day || m_consecutive_losses >= m_max_consecutive_losses)
      { m_is_paused=true; m_pause_reason="RISK LIMIT"; }
   }

   //--- Setters & Controls
   void SetPaused(bool paused, string reason = "MANUAL PAUSE") { m_is_paused = paused; m_pause_reason = reason; }
   bool IsPaused(void) const { return m_is_paused; }
   string GetPauseReason(void) const { return m_pause_reason; }

   double GetRiskPercent(void) const { return m_risk_percent; }
   double GetDailyPL(void) const { return m_daily_realized_pl; }
   int GetConsecutiveLosses(void) const { return m_consecutive_losses; }
   int GetTradesToday(void) const { return m_trades_today_count; }
   double GetStartTarget(void) const { return m_start_target_balance; }
   double GetGrowthTarget(void) const { return m_growth_target_balance; }
   double GetTargetProgressPct(void) const
   {
      double eq = AccountInfoDouble(ACCOUNT_EQUITY);
      if(m_growth_target_balance <= m_start_target_balance) return 0.0;
      double progress = ((eq - m_start_target_balance) / (m_growth_target_balance - m_start_target_balance)) * 100.0;
      return MathMax(0.0, MathMin(100.0, progress));
   }
};

#endif
`;
