/**
 * AIMAX 象棋联机版 - 棋盘相关逻辑
 * 包含：棋盘初始化、棋子颜色判断、九宫格检查、棋子升级等
 */

import {
    ROWS, COLS, EMPTY, RED, BLACK,
    R_KING, R_ADVISOR, R_ELEPHANT, R_HORSE, R_CAR, R_CANNON, R_PAWN,
    B_KING, B_ADVISOR, B_ELEPHANT, B_HORSE, B_CAR, B_CANNON, B_PAWN,
    R_UPGRADE_CANNON, R_UPGRADE_CAR, R_HORSE_CAR, R_CHONG, R_KUI, R_JUN, R_WEN, R_SHI,
    B_UPGRADE_CANNON, B_UPGRADE_CAR, B_HORSE_CAR, B_CHONG, B_KUI, B_JUN, B_WEN, B_SHI,
    PIECE_TYPES
} from './constants.js';

/**
 * 初始化棋盘，设置初始布局
 * @returns {Array} 初始化后的棋盘状态
 */
export function initBoard() {
    // 创建一个空棋盘
    let b = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));

    let random = Math.floor(Math.random() * 5) + 13;
    // 红方布局
    b[0][4] = R_KING;              // 帅放在第0行第4列
    b[0][3] = b[0][5] = R_ADVISOR; // 士放在第0行第3和5列
    b[0][2] = b[0][6] = R_ELEPHANT; // 相放在第0行第2和6列
    b[0][1] = b[0][7] = R_HORSE;    // 马放在第0行第1和7列
    b[0][0] = b[0][8] = R_CAR;      // 车放在第0行第0和8列
    b[2][1] = b[2][7] = R_CANNON;   // 炮放在第2行第1和7列
    for (let i = 0; i < 9; i += 2) b[3][i] = R_PAWN; // 兵放在第3行，间隔排列

    /*     // 黑方布局
        b[9][4] = B_KING;              // 将放在第9行第4列
        b[9][3] = b[9][5] = B_ADVISOR; // 士放在第9行第3和5列
        b[9][2] = b[9][6] = B_ELEPHANT; // 象放在第9行第2和6列
        b[9][1] = b[9][7] = B_HORSE;    // 马放在第9行第1和7列
        b[9][0] = b[9][8] = B_CAR;      // 车放在第9行第0和8列
        b[7][1] = b[7][7] = B_CANNON;   // 炮放在第7行第1和7列 */
    // 黑方布局
    //每次都随机布局 
    b[9][4] = B_KING;              // 将放在第9行第4列
    b[9][3] = b[9][5] = B_ADVISOR; // 士放在第9行第3和5列
    b[9][2] = b[9][6] = B_ELEPHANT; // 象放在第9行第2和6列
    b[9][1] = b[9][7] = B_HORSE;    // 马放在第9行第1和7列
    b[9][0] = b[9][8] = B_CAR;      // 车放在第9行第0和8列
    b[7][1] = b[7][7] = B_CANNON;   // 炮放在第7行第1和7列
    for (let i = 0; i < 9; i += 2) b[6][i] = B_PAWN; // 卒放在第6行，间隔排列

    return b;
}

/**
 * 获取棋子的颜色
 * @param {number} piece - 棋子编码
 * @returns {number|null} 棋子颜色，EMPTY返回null
 */
export function getPieceColor(piece) {
    if (piece === EMPTY) return null;

    // 处理特殊升级棋子
    if (piece === R_HORSE_CAR) return RED;
    if (piece === B_HORSE_CAR) return BLACK;
    if (piece === R_CHONG) return RED;
    if (piece === B_CHONG) return BLACK;
    if (piece === R_KUI) return RED;
    if (piece === B_KUI) return BLACK;
    if (piece === R_JUN) return RED;
    if (piece === B_JUN) return BLACK;
    if (piece === R_WEN) return RED;
    if (piece === B_WEN) return BLACK;
    if (piece === R_SHI) return RED;
    if (piece === B_SHI) return BLACK;
    // 普通棋子通过编码判断颜色（十位为1是红方，2是黑方）
    return (Math.floor(piece / 10) === 1) ? RED : BLACK;
}

/**
 * 检查位置是否在九宫格内
 * @param {number} r - 行坐标
 * @param {number} c - 列坐标
 * @param {number} color - 颜色
 * @returns {boolean} 是否在九宫格内
 */
export function isInsidePalace(r, c, color) {
    if (color === RED) {
        // 红方九宫格：行0-2，列3-5
        return (r >= 0 && r <= 2 && c >= 3 && c <= 5);
    } else {
        // 黑方九宫格：行7-9，列3-5
        return (r >= 7 && r <= 9 && c >= 3 && c <= 5);
    }
}

/**
 * 升级棋子（当吃掉己方棋子时）
 * @param {number} movingPiece - 移动的棋子
 * @param {number} capturedPiece - 被吃掉的棋子
 * @returns {number} 升级后的棋子编码
 */
export function upgradePiece(movingPiece, capturedPiece) {
    const mType = PIECE_TYPES[movingPiece];   // 移动棋子的类型
    const cType = PIECE_TYPES[capturedPiece]; // 被吃棋子的类型
    const mColor = getPieceColor(movingPiece); // 移动棋子的颜色
    const cColor = getPieceColor(capturedPiece); // 被吃棋子的颜色

    // 只有吃掉己方棋子才会升级
    if (mColor !== cColor) return movingPiece;

    if (mColor === RED) {
        if (mType === "PAWN") {
            if (cType === "PAWN") return R_UPGRADE_CANNON; // 兵吃兵升级为升级炮
            if (cType === "HORSE") return R_UPGRADE_CAR;   // 兵吃马升级为升级车
            if (cType === "CANNON") return R_CHONG;        // 兵吃炮升级为铳
        } else if (mType === "HORSE" && cType === "CAR") {
            return R_HORSE_CAR; // 马吃车升级为车马
        } else if (mType === "HORSE" && cType === "ELEPHANT") {
            return R_JUN; // 马吃象升级为骏
        } else if (mType === "CAR" && cType === "CANNON") {
            return R_KUI; // 车吃炮升级为軳
        } else if (mType === "CAR" && cType === "PAWN") {
            return R_WEN; // 车吃兵升级为轀
        } else if (mType === "ADVISOR" && cType === "ADVISOR") {
            return R_SHI; // 士吃士升级为仕
        }
    } else if (mColor === BLACK) {
        if (mType === "PAWN") {
            if (cType === "PAWN") return B_UPGRADE_CANNON; // 卒吃卒升级为升级炮
            if (cType === "HORSE") return B_UPGRADE_CAR;   // 卒吃马升级为升级车
            if (cType === "CANNON") return B_CHONG;        // 卒吃炮升级为铳
        } else if (mType === "HORSE" && cType === "CAR") {
            return B_HORSE_CAR; // 马吃车升级为车马
        } else if (mType === "HORSE" && cType === "ELEPHANT") {
            return B_JUN; // 马吃象升级为骏
        } else if (mType === "CAR" && cType === "CANNON") {
            return B_KUI; // 车吃炮升级为軳
        } else if (mType === "CAR" && cType === "PAWN") {
            return B_WEN; // 车吃卒升级为轀
        } else if (mType === "ADVISOR" && cType === "ADVISOR") {
            return B_SHI; // 士吃士升级为仕
        }
    }
    // 不符合升级条件，返回原棋子
    return movingPiece;
}
