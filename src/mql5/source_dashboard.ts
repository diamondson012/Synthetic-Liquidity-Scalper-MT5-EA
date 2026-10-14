// Dashboard.mqh - On-Chart HUD, Interactive Buttons, Visual SMC Overlays (Zones, OBs, FVGs, BOS/CHOCH)
export const CODE_DASHBOARD_MQH = `
#ifndef SLS_SOURCE_DASHBOARD
#define SLS_SOURCE_DASHBOARD
//+------------------------------------------------------------------+
//|                                                    Dashboard.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

#include "Defines.mqh"
#include "SymbolManager.mqh"
#include "RiskManager.mqh"

class CDashboard
{
private:
   CSymbolManager*   m_symbol_mgr;
   CRiskManager*     m_risk_mgr;
   string            m_prefix;
   int               m_x_pos;
   int               m_y_pos;
   bool              m_show_dashboard;
   bool              m_show_chart_objects;

public:
   CDashboard(void) :
      m_symbol_mgr(NULL),
      m_risk_mgr(NULL),
      m_prefix("SLS_HUD_"),
      m_x_pos(20),
      m_y_pos(20),
      m_show_dashboard(true),
      m_show_chart_objects(true)
   {}

   ~CDashboard(void)
   {
      Destroy();
   }

   void Init(CSymbolManager* sym_mgr, CRiskManager* risk_mgr, bool show_hud = true, bool show_objects = true)
   {
      m_symbol_mgr = sym_mgr;
      m_risk_mgr   = risk_mgr;
      m_show_dashboard = show_hud;
      m_show_chart_objects = show_objects;
   }

   //--- Clean up chart objects
   void Destroy(void)
   {
      ObjectsDeleteAll(0, m_prefix);
      ObjectsDeleteAll(0, "SLS_OBJ_");
      ChartRedraw(0);
   }

   //--- Update On-Chart Decision HUD Panel
   void RenderHUD(ENUM_EA_STATE state,
                  ENUM_MARKET_BIAS bias_m15,
                  ENUM_MARKET_BIAS bias_m5,
                  ENUM_MARKET_BIAS bias_m1,
                  SConfluenceScore &score,
                  string next_action,
                  string why_text)
   {
      if(!m_show_dashboard || m_symbol_mgr == NULL || m_risk_mgr == NULL) return;

      string sym = m_symbol_mgr.GetSymbol();
      double balance = AccountInfoDouble(ACCOUNT_BALANCE);
      double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
      double daily_pl = m_risk_mgr.GetDailyPL();
      double target   = m_risk_mgr.GetGrowthTarget();
      double progress = m_risk_mgr.GetTargetProgressPct();

      int panel_w = 260;
      int panel_h = 420;
      int x_start = (int)ChartGetInteger(0, CHART_WIDTH_IN_PIXELS) - panel_w - 20;
      int y_start = 25;

      // Background Panel
      DrawRectangle(m_prefix + "BG", x_start, y_start, panel_w, panel_h, C'15,23,42', C'51,65,85');

      // Title Banner
      DrawLabel(m_prefix + "TITLE", "SYNTHETIC SCALPER PRO", x_start + 12, y_start + 12, "Segoe UI", 10, C'56,189,248', true);
      DrawLabel(m_prefix + "SYM", sym + " [" + EnumToString(_Period) + "]", x_start + 12, y_start + 30, "Segoe UI", 8, C'148,163,184');

      // Market Structure Matrix
      int y = y_start + 55;
      DrawLabel(m_prefix + "BIAS_LBL", "BIAS (M15 / M5 / M1):", x_start + 12, y, "Segoe UI", 8, C'203,213,225');
      string bias_str = StringFormat("%s / %s / %s", BiasToString(bias_m15), BiasToString(bias_m5), BiasToString(bias_m1));
      DrawLabel(m_prefix + "BIAS_VAL", bias_str, x_start + 12, y + 15, "Segoe UI", 8, C'248,250,252', true);

      // Confluence Score Thermometer
      y += 40;
      color score_col = (score.total_score >= 80.0) ? C'34,197,94' : (score.total_score >= 70.0 ? C'56,189,248' : C'239,68,68');
      DrawLabel(m_prefix + "SCORE_LBL", "SETUP SCORE:", x_start + 12, y, "Segoe UI", 8, C'203,213,225');
      DrawLabel(m_prefix + "SCORE_VAL", StringFormat("%.0f/100 (Grade %s)", score.total_score, GradeToString(score.grade)), x_start + 105, y, "Segoe UI", 9, score_col, true);

      // Action Signal
      y += 24;
      DrawLabel(m_prefix + "ACTION_LBL", "ACTION SIGNAL:", x_start + 12, y, "Segoe UI", 8, C'203,213,225');
      color act_col = (next_action == "BUY") ? C'34,197,94' : (next_action == "SELL" ? C'239,68,68' : C'234,179,8');
      DrawLabel(m_prefix + "ACTION_VAL", next_action, x_start + 105, y, "Segoe UI", 9, act_col, true);

      // Account & Growth Target Progress
      y += 30;
      DrawLabel(m_prefix + "ACC_LBL", StringFormat("EQUITY: $%.2f | P/L: %s$%.2f", equity, (daily_pl >= 0 ? "+" : ""), daily_pl), x_start + 12, y, "Segoe UI", 8, C'248,250,252');
      y += 18;
      DrawLabel(m_prefix + "TGT_LBL", StringFormat("GOAL: $%.2f (%.1f%% Done)", target, progress), x_start + 12, y, "Segoe UI", 8, C'168,85,247', true);

      // Progress Bar
      y += 16;
      DrawProgressBar(m_prefix + "PROG", x_start + 12, y, panel_w - 24, 6, progress);

      // State & Safety Status
      y += 20;
      DrawLabel(m_prefix + "STATE_LBL", "STATE: " + StateToString(state), x_start + 12, y, "Segoe UI", 8, m_risk_mgr.IsPaused() ? C'239,68,68' : C'56,189,248', true);

      // Interactive Control Buttons
      y += 30;
      int btn_w = (panel_w - 32) / 2;
      DrawButton(m_prefix + "BTN_PAUSE", m_risk_mgr.IsPaused() ? "RESUME" : "PAUSE", x_start + 12, y, btn_w, 24, m_risk_mgr.IsPaused() ? C'34,197,94' : C'234,179,8');
      DrawButton(m_prefix + "BTN_CLOSEALL", "CLOSE ALL", x_start + 16 + btn_w, y, btn_w, 24, C'225,29,72');

      y += 28;
      DrawButton(m_prefix + "BTN_BUY", "BUY: ON", x_start + 12, y, btn_w, 22, C'30,41,59');
      DrawButton(m_prefix + "BTN_SELL", "SELL: ON", x_start + 16 + btn_w, y, btn_w, 22, C'30,41,59');

      ChartRedraw(0);
   }

   //--- Draw Zone Rectangle on Chart
   void DrawChartZone(string id, ENUM_ZONE_TYPE type, double top, double bottom, datetime t1, datetime t2)
   {
      if(!m_show_chart_objects) return;

      string obj_name = "SLS_OBJ_ZONE_" + id;
      color zone_color = (type == ZONE_DEMAND || type == ZONE_BULLISH_ORDER_BLOCK || type == ZONE_BULLISH_FVG) ? C'16,185,129' : C'239,68,68';

      ObjectCreate(0, obj_name, OBJ_RECTANGLE, 0, t1, top, (t2 > 0 ? t2 : TimeCurrent() + 3600), bottom);
      ObjectSetInteger(0, obj_name, OBJPROP_COLOR, zone_color);
      ObjectSetInteger(0, obj_name, OBJPROP_BGCOLOR, zone_color);
      ObjectSetInteger(0, obj_name, OBJPROP_FILL, true);
      ObjectSetInteger(0, obj_name, OBJPROP_BACK, true);
      ObjectSetInteger(0, obj_name, OBJPROP_WIDTH, 1);
   }

private:
   void DrawRectangle(string name, int x, int y, int w, int h, color bg_col, color border_col)
   {
      if(ObjectFind(0, name) < 0) ObjectCreate(0, name, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
      ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
      ObjectSetInteger(0, name, OBJPROP_XSIZE, w);
      ObjectSetInteger(0, name, OBJPROP_YSIZE, h);
      ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bg_col);
      ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, border_col);
      ObjectSetInteger(0, name, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   }

   void DrawLabel(string name, string text, int x, int y, string font, int font_size, color col, bool bold = false)
   {
      if(ObjectFind(0, name) < 0) ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
      ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
      ObjectSetString(0, name, OBJPROP_TEXT, text);
      ObjectSetString(0, name, OBJPROP_FONT, font);
      ObjectSetInteger(0, name, OBJPROP_FONTSIZE, font_size);
      ObjectSetInteger(0, name, OBJPROP_COLOR, col);
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   }

   void DrawButton(string name, string text, int x, int y, int w, int h, color bg_col)
   {
      if(ObjectFind(0, name) < 0) ObjectCreate(0, name, OBJ_BUTTON, 0, 0, 0);
      ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
      ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
      ObjectSetInteger(0, name, OBJPROP_XSIZE, w);
      ObjectSetInteger(0, name, OBJPROP_YSIZE, h);
      ObjectSetString(0, name, OBJPROP_TEXT, text);
      ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bg_col);
      ObjectSetInteger(0, name, OBJPROP_COLOR, C'255,255,255');
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 8);
   }

   void DrawProgressBar(string name, int x, int y, int w, int h, double pct)
   {
      DrawRectangle(name + "_BG", x, y, w, h, C'30,41,59', C'51,65,85');
      int fill_w = (int)(w * (MathMin(100.0, MathMax(0.0, pct)) / 100.0));
      DrawRectangle(name + "_FILL", x, y, fill_w, h, C'168,85,247', C'168,85,247');
   }

   string BiasToString(ENUM_MARKET_BIAS b)
   {
      if(b >= BIAS_STRONG_BULLISH) return "STR-BULL";
      if(b == BIAS_WEAK_BULLISH)   return "BULL";
      if(b == BIAS_NEUTRAL)        return "NEUT";
      if(b == BIAS_WEAK_BEARISH)   return "BEAR";
      return "STR-BEAR";
   }

   string GradeToString(ENUM_SIGNAL_QUALITY g)
   {
      switch(g)
      {
         case GRADE_A_PLUS: return "A+";
         case GRADE_A:      return "A";
         case GRADE_B:      return "B";
         case GRADE_C:      return "C";
         default:           return "D";
      }
   }

   string StateToString(ENUM_EA_STATE st)
   {
      switch(st)
      {
         case STATE_WAITING:             return "WAITING";
         case STATE_ANALYZING:           return "ANALYZING";
         case STATE_SETUP_FORMING:       return "SETUP FORMING";
         case STATE_LIQUIDITY_DETECTED:  return "LIQUIDITY DETECTED";
         case STATE_CONFIRMATION_REQUIRED:return "CONFIRMATION REQ";
         case STATE_SIGNAL_READY:        return "SIGNAL READY";
         case STATE_TRADE_EXECUTED:      return "TRADE EXECUTED";
         case STATE_MANAGING_TRADE:      return "MANAGING TRADE";
         case STATE_PROFIT_PROTECTION:   return "PROFIT PROTECTION";
         case STATE_COOLDOWN:            return "COOLDOWN";
         case STATE_RISK_LIMIT:          return "RISK LIMIT PAUSE";
         case STATE_TARGET_ACHIEVED:     return "TARGET ACHIEVED";
         default:                        return "ACTIVE";
      }
   }
};

#endif
`;
