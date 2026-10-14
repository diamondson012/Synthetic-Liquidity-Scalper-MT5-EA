// Defines.mqh - Global Enums, Constants and Data Structures
export const CODE_DEFINES_MQH = `
#ifndef SLS_SOURCE_DEFINES
#define SLS_SOURCE_DEFINES
//+------------------------------------------------------------------+
//|                                                      Defines.mqh |
//|                        Synthetic Liquidity Scalper MT5 EA        |
//|                        Copyright 2026, Quant SMC Engineering     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Quant SMC Engineering"
#property link      "https://ai.studio/build"
#property version   "2.00"

//--- Global Constants
#define MAGIC_NUMBER_DEFAULT     260901
#define MAX_ZONES_BUFFER         50
#define MAX_STRUCTURE_POINTS     100
#define MAX_EXPLANATION_LEN      512
#define MAX_RETRY_ATTEMPTS       3
#define RETRY_DELAY_MS           250

//--- EA Operational States
enum ENUM_EA_STATE
{
   STATE_WAITING = 0,             // Waiting for market conditions
   STATE_ANALYZING,               // Scanning multi-timeframe structure
   STATE_SETUP_FORMING,           // High probability zone approaching
   STATE_LIQUIDITY_DETECTED,      // Liquidity sweep or pool detected
   STATE_CONFIRMATION_REQUIRED,   // Waiting for M1 candlestick / BOS
   STATE_SIGNAL_READY,            // Confluence threshold met, executing
   STATE_TRADE_EXECUTED,          // Trade opened, monitoring fill
   STATE_MANAGING_TRADE,          // Managing active position / Trailing
   STATE_PROFIT_PROTECTION,       // Break-even and partials triggered
   STATE_COOLDOWN,                // Cooldown period after exit
   STATE_RISK_LIMIT,              // Daily loss or consecutive loss hit
   STATE_TARGET_ACHIEVED          // Growth objective reached - PAUSED
};

//--- Trading Execution Mode
enum ENUM_TRADING_MODE
{
   MODE_CONSERVATIVE = 0,         // Min Score 80, Strict Multi-TF alignment
   MODE_BALANCED,                 // Min Score 70, Standard SMC Rules
   MODE_AGGRESSIVE                // Min Score 60, Faster M1 Scalp Triggers
};

//--- Stop Loss Calculation Modes
enum ENUM_SL_MODE
{
   SL_MODE_STRUCTURE = 0,         // Beyond swing high/low or Order Block
   SL_MODE_ATR,                   // Strict ATR multiplier
   SL_MODE_STRUCTURE_ATR,         // Structure zone with ATR buffer (Recommended)
   SL_MODE_DYNAMIC                // Dynamic volatility & liquidity adjusted
};

//--- Market Bias Classification
enum ENUM_MARKET_BIAS
{
   BIAS_STRONG_BULLISH = 2,
   BIAS_WEAK_BULLISH   = 1,
   BIAS_NEUTRAL        = 0,
   BIAS_WEAK_BEARISH   = -1,
   BIAS_STRONG_BEARISH = -2
};

//--- Signal Quality Grade
enum ENUM_SIGNAL_QUALITY
{
   GRADE_D = 0,                   // 50-59 Score (Do Not Trade)
   GRADE_C,                       // 60-69 Score (Weak Setup)
   GRADE_B,                       // 70-79 Score (Valid Setup)
   GRADE_A,                       // 80-89 Score (Strong Setup)
   GRADE_A_PLUS                   // 90-100 Score (High Confluence)
};

//--- Candlestick Pattern Identifiers
enum ENUM_CANDLE_PATTERN
{
   PATTERN_NONE = 0,
   PATTERN_BULLISH_ENGULFING,
   PATTERN_BEARISH_ENGULFING,
   PATTERN_HAMMER,
   PATTERN_SHOOTING_STAR,
   PATTERN_MORNING_STAR,
   PATTERN_EVENING_STAR,
   PATTERN_PIERCING,
   PATTERN_DARK_CLOUD,
   PATTERN_MARUBOZU_BULL,
   PATTERN_MARUBOZU_BEAR,
   PATTERN_THREE_WHITE_SOLDIERS,
   PATTERN_THREE_BLACK_CROWS,
   PATTERN_BULLISH_HARAMI,
   PATTERN_BEARISH_HARAMI,
   PATTERN_INVERTED_HAMMER,
   PATTERN_TWEEZER_BOTTOM,
   PATTERN_TWEEZER_TOP
};

//--- Zone Types
enum ENUM_ZONE_TYPE
{
   ZONE_DEMAND = 0,
   ZONE_SUPPLY,
   ZONE_BULLISH_ORDER_BLOCK,
   ZONE_BEARISH_ORDER_BLOCK,
   ZONE_BULLISH_FVG,
   ZONE_BEARISH_FVG,
   ZONE_LIQUIDITY_HIGH,
   ZONE_LIQUIDITY_LOW
};

//--- Structure Break Type
enum ENUM_BREAK_TYPE
{
   BREAK_NONE = 0,
   BREAK_BOS_BULLISH,
   BREAK_BOS_BEARISH,
   BREAK_CHOCH_BULLISH,
   BREAK_CHOCH_BEARISH
};

//--- Confluence Setup Score Structure
struct SConfluenceScore
{
   double structure_score;    // 0 - 20
   double liquidity_score;    // 0 - 20
   double supply_demand_score;// 0 - 15
   double order_block_score;  // 0 - 15
   double fvg_score;          // 0 - 10
   double candle_score;       // 0 - 10
   double momentum_score;     // 0 - 5
   double volatility_score;   // 0 - 5
   double total_score;        // 0 - 100
   ENUM_SIGNAL_QUALITY grade;
   string reasoning_why;
   string reasoning_why_not;
};

//--- Price Zone Definition
struct SPriceZone
{
   ENUM_ZONE_TYPE type;
   double         top_price;
   double         bottom_price;
   datetime       start_time;
   datetime       end_time;
   bool           is_fresh;
   int            retest_count;
   double         strength_score;
   ENUM_TIMEFRAMES timeframe;
};

//--- Market Structure Swing Point
struct SSwingPoint
{
   datetime time;
   double   price;
   bool     is_high;          // true = High, false = Low
   string   label;            // HH, HL, LH, LL
   int      bar_index;
};

//--- Synthetic Symbol Characteristics
struct SSymbolProfile
{
   string  symbol_name;
   bool    is_boom;
   bool    is_crash;
   bool    is_synthetic;
   double  min_lot;
   double  max_lot;
   double  lot_step;
   double  point_value;
   int     digits_count;
   double  tick_size;
   double  tick_value;
   double  stop_level;
   double  freeze_level;
   double  contract_size;
   double  typical_spike_points;
};

#endif
`;
