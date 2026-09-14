// Logger.mqh - CSV Trade Journal Exporter & Diagnostic Logging
export const CODE_LOGGER_MQH = `//+------------------------------------------------------------------+
//|                                                       Logger.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"

class CLogger
{
private:
   CSymbolManager*   m_symbol_mgr;
   string            m_file_name;
   bool              m_enable_csv;
   int               m_file_handle;

public:
   CLogger(void) :
      m_symbol_mgr(NULL),
      m_file_name("SLS_Trade_Journal.csv"),
      m_enable_csv(true),
      m_file_handle(INVALID_HANDLE)
   {}

   ~CLogger(void)
   {
      CloseCSV();
   }

   bool Init(CSymbolManager* sym_mgr, string filename = "SLS_Trade_Journal.csv", bool enable = true)
   {
      m_symbol_mgr = sym_mgr;
      m_file_name  = filename;
      m_enable_csv = enable;

      if(!m_enable_csv) return true;

      // Check if file exists, write header if new
      bool file_exists = FileIsExist(m_file_name, FILE_COMMON);
      m_file_handle = FileOpen(m_file_name, FILE_WRITE | FILE_READ | FILE_CSV | FILE_COMMON, ',');

      if(m_file_handle != INVALID_HANDLE)
      {
         if(!file_exists || FileSize(m_file_handle) == 0)
         {
            FileWrite(m_file_handle, 
                      "Date", "Time", "Symbol", "Direction", "Entry", "SL", "TP1", "TP2", "TP3",
                      "LotSize", "RiskPercent", "SetupScore", "MarketBias", "LiquidityCondition",
                      "BOS", "CHOCH", "OrderBlock", "SupplyDemand", "FVG", "CandlestickPattern",
                      "ATR", "RR", "ExitPrice", "Profit", "MFE", "MAE", "ReasonForEntry", "ReasonForExit");
         }
         FileSeek(m_file_handle, 0, SEEK_END);
      }
      return (m_file_handle != INVALID_HANDLE);
   }

   void CloseCSV(void)
   {
      if(m_file_handle != INVALID_HANDLE)
      {
         FileClose(m_file_handle);
         m_file_handle = INVALID_HANDLE;
      }
   }

   //--- Write Complete Trade Record to CSV Journal
   void LogTradeRecord(datetime open_time,
                       string symbol,
                       string direction,
                       double entry,
                       double sl,
                       double tp1,
                       double tp2,
                       double tp3,
                       double lot,
                       double risk_pct,
                       double score,
                       string bias,
                       string liq,
                       string bos,
                       string choch,
                       string ob,
                       string sd,
                       string fvg,
                       string candle_pat,
                       double atr,
                       double rr,
                       double exit_price,
                       double profit,
                       double mfe,
                       double mae,
                       string entry_reason,
                       string exit_reason)
   {
      if(m_file_handle == INVALID_HANDLE && m_enable_csv)
      {
         Init(m_symbol_mgr, m_file_name, m_enable_csv);
      }

      if(m_file_handle != INVALID_HANDLE)
      {
         MqlDateTime dt;
         TimeToStruct(open_time, dt);
         string date_str = StringFormat("%04d-%02d-%02d", dt.year, dt.mon, dt.day);
         string time_str = StringFormat("%02d:%02d:%02d", dt.hour, dt.min, dt.sec);

         FileWrite(m_file_handle,
                   date_str, time_str, symbol, direction,
                   DoubleToString(entry, 5), DoubleToString(sl, 5),
                   DoubleToString(tp1, 5), DoubleToString(tp2, 5), DoubleToString(tp3, 5),
                   DoubleToString(lot, 2), DoubleToString(risk_pct, 2),
                   DoubleToString(score, 1), bias, liq, bos, choch, ob, sd, fvg, candle_pat,
                   DoubleToString(atr, 5), DoubleToString(rr, 2),
                   DoubleToString(exit_price, 5), DoubleToString(profit, 2),
                   DoubleToString(mfe, 2), DoubleToString(mae, 2),
                   entry_reason, exit_reason);
         FileFlush(m_file_handle);
      }
   }
};
`;
