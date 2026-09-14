// BacktestMetrics.mqh - Strategy Tester Quantitative Optimizer & Performance Metrics
export const CODE_BACKTEST_METRICS_MQH = `//+------------------------------------------------------------------+
//|                                              BacktestMetrics.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"

class CBacktestMetrics
{
private:
   int      m_total_trades;
   int      m_winning_trades;
   int      m_losing_trades;
   double   m_gross_profit;
   double   m_gross_loss;
   double   m_max_drawdown;
   double   m_peak_equity;
   double   m_initial_balance;
   int      m_max_consecutive_losses;
   int      m_curr_consecutive_losses;

public:
   CBacktestMetrics(void) :
      m_total_trades(0),
      m_winning_trades(0),
      m_losing_trades(0),
      m_gross_profit(0.0),
      m_gross_loss(0.0),
      m_max_drawdown(0.0),
      m_peak_equity(0.0),
      m_initial_balance(0.0),
      m_max_consecutive_losses(0),
      m_curr_consecutive_losses(0)
   {}

   ~CBacktestMetrics(void) {}

   void Init(double initial_deposit)
   {
      m_initial_balance = initial_deposit;
      m_peak_equity     = initial_deposit;
      m_total_trades    = 0;
      m_winning_trades  = 0;
      m_losing_trades   = 0;
      m_gross_profit    = 0.0;
      m_gross_loss      = 0.0;
      m_max_drawdown    = 0.0;
      m_max_consecutive_losses = 0;
      m_curr_consecutive_losses = 0;
   }

   void OnTradeClosed(double profit)
   {
      m_total_trades++;
      if(profit >= 0.0)
      {
         m_winning_trades++;
         m_gross_profit += profit;
         m_curr_consecutive_losses = 0;
      }
      else
      {
         m_losing_trades++;
         m_gross_loss += MathAbs(profit);
         m_curr_consecutive_losses++;
         if(m_curr_consecutive_losses > m_max_consecutive_losses)
            m_max_consecutive_losses = m_curr_consecutive_losses;
      }

      double current_equity = AccountInfoDouble(ACCOUNT_EQUITY);
      if(current_equity > m_peak_equity) m_peak_equity = current_equity;

      double current_dd = m_peak_equity - current_equity;
      if(current_dd > m_max_drawdown) m_max_drawdown = current_dd;
   }

   //--- Quantitative Summary Metrics
   double GetProfitFactor(void) const
   {
      return (m_gross_loss > 0.0) ? (m_gross_profit / m_gross_loss) : (m_gross_profit > 0 ? 99.9 : 0.0);
   }

   double GetWinRate(void) const
   {
      return (m_total_trades > 0) ? ((double)m_winning_trades / (double)m_total_trades * 100.0) : 0.0;
   }

   double GetExpectedPayoff(void) const
   {
      return (m_total_trades > 0) ? ((m_gross_profit - m_gross_loss) / (double)m_total_trades) : 0.0;
   }

   double GetRecoveryFactor(void) const
   {
      double net_profit = m_gross_profit - m_gross_loss;
      return (m_max_drawdown > 0.0) ? (net_profit / m_max_drawdown) : 0.0;
   }

   // Custom Fitness Criterion for MT5 Strategy Tester Optimization
   double GetCustomOptimizationFitness(void) const
   {
      if(m_total_trades < 10) return 0.0;
      double pf = GetProfitFactor();
      double wr = GetWinRate() / 100.0;
      double rf = GetRecoveryFactor();
      // Balanced fitness: Reward Profit Factor and Recovery Factor while penalizing large consecutive losses
      return (pf * 2.0 + rf * 1.5 + wr * 3.0) / (1.0 + m_max_consecutive_losses * 0.2);
   }
};
`;
