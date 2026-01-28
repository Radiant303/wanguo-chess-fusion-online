/**
 * AIMAX 象棋联机版 - 常量与配置
 * 包含：棋盘尺寸、颜色常量、棋子编码、棋子名称、棋子价值等
 */

// ==================== 棋盘配置 ====================
export const ROWS = 10;          // 棋盘行数
export const COLS = 9;           // 棋盘列数
export const CELL_SIZE = 60;     // 每个格子的大小（像素）
export const SEARCH_DEPTH = 5;   // AI基础搜索深度（实际深度根据棋子数量动态调整）

// ==================== 颜色常量 ====================
export const EMPTY = 0;  // 空格
export const RED = 1;    // 红方
export const BLACK = 2;  // 黑方

// ==================== 棋子编码 - 红方 ====================
export const R_KING = 11;        // 帅
export const R_ADVISOR = 12;     // 士
export const R_ELEPHANT = 13;    // 相
export const R_HORSE = 14;       // 马
export const R_CAR = 15;         // 车
export const R_CANNON = 16;      // 炮
export const R_PAWN = 17;        // 兵

// ==================== 棋子编码 - 黑方 ====================
export const B_KING = 21;        // 将
export const B_ADVISOR = 22;     // 士
export const B_ELEPHANT = 23;    // 象
export const B_HORSE = 24;       // 马
export const B_CAR = 25;         // 车
export const B_CANNON = 26;      // 炮
export const B_PAWN = 27;        // 卒

// ==================== 升级棋子 - 红方 ====================
export const R_UPGRADE_CANNON = 18;  // 升级炮
export const R_UPGRADE_CAR = 19;     // 升级车
export const R_HORSE_CAR = 20;       // 车马
export const R_CHONG = 31;           // 铳
export const R_KUI = 33;             // 軳
export const R_JUN = 35;             // 骏（马+象）
export const R_WEN = 37;             // 轀（车+兵）
export const R_SHI = 39;             // 仕（士+士）

// ==================== 升级棋子 - 黑方 ====================
export const B_UPGRADE_CANNON = 28;  // 升级炮
export const B_UPGRADE_CAR = 29;     // 升级车
export const B_HORSE_CAR = 30;       // 车马
export const B_CHONG = 32;           // 铳
export const B_KUI = 34;             // 軳
export const B_JUN = 36;             // 骏（马+象）
export const B_WEN = 38;             // 轀（车+兵）
export const B_SHI = 40;             // 仕（士+士）

// ==================== 棋子名称映射 ====================
export const PIECE_NAMES = {
    11: "帅", 12: "士", 13: "相", 14: "马", 15: "车", 16: "炮", 17: "兵", 18: "炮", 19: "车", 20: "骠", 31: "铳", 33: "軳", 35: "骏", 37: "轀", 39: "仕",
    21: "将", 22: "士", 23: "象", 24: "马", 25: "车", 26: "炮", 27: "卒", 28: "炮", 29: "车", 30: "骠", 32: "铳", 34: "軳", 36: "骏", 38: "轀", 40: "仕"
};

// ==================== 棋子类型映射 ====================
export const PIECE_TYPES = {
    11: "KING", 12: "ADVISOR", 13: "ELEPHANT", 14: "HORSE", 15: "CAR", 16: "CANNON", 17: "PAWN",
    21: "KING", 22: "ADVISOR", 23: "ELEPHANT", 24: "HORSE", 25: "CAR", 26: "CANNON", 27: "PAWN",
    18: "CANNON", 19: "CAR", 20: "HORSE_CAR", 31: "CHONG", 33: "KUI", 35: "JUN", 37: "WEN", 39: "SHI",
    28: "CANNON", 29: "CAR", 30: "HORSE_CAR", 32: "CHONG", 34: "KUI", 36: "JUN", 38: "WEN", 40: "SHI"
};

// ==================== 棋子价值评估 ====================
export const PIECE_VALUES = {
    [R_KING]: 10000, [B_KING]: 10000,              // 王/帅价值最高
    [R_ADVISOR]: 200, [B_ADVISOR]: 200,            // 士价值
    [R_ELEPHANT]: 200, [B_ELEPHANT]: 200,          // 象/相价值
    [R_HORSE]: 450, [B_HORSE]: 450,                // 马价值
    [R_CAR]: 900, [B_CAR]: 900,                    // 车价值
    [R_CANNON]: 500, [B_CANNON]: 500,              // 炮价值
    [R_PAWN]: 100, [B_PAWN]: 100,                  // 兵/卒价值
    [R_UPGRADE_CANNON]: 500, [B_UPGRADE_CANNON]: 500, // 升级炮价值
    [R_UPGRADE_CAR]: 900, [B_UPGRADE_CAR]: 900,       // 升级车价值
    [R_HORSE_CAR]: 1350, [B_HORSE_CAR]: 1350,           // 车马价值
    [R_CHONG]: 600, [B_CHONG]: 600,                   // 铳价值(兵+炮)
    [R_KUI]: 1400, [B_KUI]: 1400,                       // 軳价值(车+炮)
    [R_JUN]: 650, [B_JUN]: 650,                       // 骏价值(马+象)
    [R_WEN]: 1000, [B_WEN]: 1000,                     // 轀价值(车+兵，连续移动但无法后退)
    [R_SHI]: 350, [B_SHI]: 350                        // 仕价值(士+士，全盘斜走但锁定将帅)
};

// ==================== 网络配置 ====================
export const DEFAULT_WS_SERVER_URL = 'ws://localhost:9191';
export const MAX_RECONNECT_ATTEMPTS = 3;
