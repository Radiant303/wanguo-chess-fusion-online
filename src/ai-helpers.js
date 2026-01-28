/**
 * AIMAX 象棋联机版 - AI 逻辑 (第1部分：辅助函数)
 */

import {
    ROWS, COLS, EMPTY, RED, BLACK, SEARCH_DEPTH,
    R_PAWN, B_PAWN,
    R_UPGRADE_CANNON, R_UPGRADE_CAR, R_HORSE_CAR, R_CHONG, R_KUI, R_JUN, R_WEN, R_SHI,
    B_UPGRADE_CANNON, B_UPGRADE_CAR, B_HORSE_CAR, B_CHONG, B_KUI, B_JUN, B_WEN, B_SHI,
    PIECE_VALUES, PIECE_NAMES, PIECE_TYPES
} from './constants.js';
import { getPieceColor } from './board.js';
import { getSafeMoves, makeMove, isInCheck } from './moves.js';
import { log, clearLog } from './utils.js';
import * as state from './state.js';

// 计算棋盘上的棋子数量
export function countPieces(currBoard) {
    let count = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (currBoard[r][c] !== EMPTY) count++;
        }
    }
    return count;
}

// 根据棋子数量获取动态搜索深度
export function getDynamicSearchDepth(currBoard) {
    const pieceCount = countPieces(currBoard);

    // 分别统计红方和黑方棋子数量
    let redCount = 0, blackCount = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = currBoard[r][c];
            if (p === EMPTY) continue;
            const pColor = getPieceColor(p);
            if (pColor === RED) redCount++;
            else if (pColor === BLACK) blackCount++;
        }
    }

    // 当某方棋子数量≤5个时，深度8
    if (redCount <= 5 || blackCount <= 5) return 8;
    if (pieceCount < 10) return 8;
    if (pieceCount < 16) return 7;
    if (pieceCount < 18) return 6;
    return SEARCH_DEPTH;
}

// 检查是否为折返走法
export function isReverseMove(m1, m2) {
    if (!m1 || !m2) return false;
    return m1.from.r === m2.to.r && m1.from.c === m2.to.c &&
        m1.to.r === m2.from.r && m1.to.c === m2.from.c;
}

// 检查是否移动同一棋子
export function isSamePieceMoved(m1, m2) {
    if (!m1 || !m2) return false;
    return m1.to.r === m2.from.r && m1.to.c === m2.from.c;
}

// 检查两个走法是否相同
export function isSameMove(m1, m2) {
    if (!m1 || !m2) return false;
    return m1.from.r === m2.from.r && m1.from.c === m2.from.c &&
        m1.to.r === m2.to.r && m1.to.c === m2.to.c;
}

// 计算走法的重复惩罚分数
export function getRepetitionPenalty(move, history, isRedMove) {
    if (!history || history.length < 2) return 0;
    let penalty = 0;
    const len = history.length;
    const myLastMove = len >= 2 ? history[len - 2] : null;
    const mySecondLastMove = len >= 4 ? history[len - 4] : null;

    if (isReverseMove(move, myLastMove)) {
        penalty += 50000;
        if (mySecondLastMove && isReverseMove(myLastMove, mySecondLastMove)) {
            penalty += 500000;
        }
    }

    let samePieceCount = 0;
    let lastPos = move.from;
    for (let i = len - 2; i >= 0 && samePieceCount < 5; i -= 2) {
        const prevMove = history[i];
        if (prevMove && prevMove.to.r === lastPos.r && prevMove.to.c === lastPos.c) {
            samePieceCount++;
            lastPos = prevMove.from;
        } else { break; }
    }
    if (samePieceCount >= 2) {
        penalty += 30000 * samePieceCount;
    }
    return isRedMove ? penalty : -penalty;
}

// 评估走法的分数，用于排序
export function scoreMove(move, currBoard, depth) {
    let score = 0;
    const f = move.from;
    const t = move.to;
    const piece = currBoard[f.r][f.c];
    const target = currBoard[t.r][t.c];

    if (target !== EMPTY) {
        let victimVal = PIECE_VALUES[target] || 0;
        let attackerVal = PIECE_VALUES[piece] || 0;
        score = 1000000 + victimVal * 10 - attackerVal;
    } else {
        if (state.killerMoves[depth]) {
            if (isSameMove(move, state.killerMoves[depth][0])) score = 900000;
            else if (isSameMove(move, state.killerMoves[depth][1])) score = 800000;
        }
        if (score === 0) {
            let key = `${f.r},${f.c},${t.r},${t.c}`;
            score = state.historyMoves[key] || 0;
        }
    }

    let isRedMove = getPieceColor(piece) === RED;
    let repPenalty = getRepetitionPenalty(move, state.moveHistory, isRedMove);
    if (repPenalty !== 0) {
        score -= Math.abs(repPenalty) / 10;
    }
    return score;
}

// 评估函数
export function evaluateBoard(currBoard, depth, searchStack) {
    let score = 0, rBonus = 0, bBonus = 0;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let p = currBoard[r][c];
            if (p === EMPTY) continue;
            let val = PIECE_VALUES[p] || 0;
            let pColor = getPieceColor(p);
            let pieceType = PIECE_TYPES[p];

            // 兵/卒过河奖励
            if (p === R_PAWN || p === B_PAWN) {
                if ((p === R_PAWN && r >= 5) || (p === B_PAWN && r <= 4)) {
                    val += 50;
                    if (c >= 3 && c <= 5) val += 30; // 中路位置额外奖励
                }
            }

            // === 过河奖励机制 ===
            // 红方：r > 4 表示过河（进入黑方领地）
            // 黑方：r < 5 表示过河（进入红方领地）
            if (pColor === RED && r > 4) {
                // 红方棋子过河奖励
                let crossRiverBonus = 0;
                let depth_in_enemy = r - 4; // 深入程度 1-5

                if (pieceType === "HORSE" || pieceType === "HORSE_CAR") {
                    crossRiverBonus = 30 * depth_in_enemy; // 马过河
                } else if (pieceType === "CAR") {
                    crossRiverBonus = 20 * depth_in_enemy; // 车过河
                } else if (pieceType === "CANNON") {
                    crossRiverBonus = 15 * depth_in_enemy; // 炮过河
                } else if (pieceType === "JUN") {
                    crossRiverBonus = 40 * depth_in_enemy; // 骏过河（马+象的组合）
                } else if (pieceType === "WEN") {
                    crossRiverBonus = 35 * depth_in_enemy; // 轀过河
                } else if (pieceType === "KUI") {
                    crossRiverBonus = 25 * depth_in_enemy; // 軳过河
                } else if (pieceType === "CHONG") {
                    crossRiverBonus = 20 * depth_in_enemy; // 铳过河
                }
                rBonus += crossRiverBonus;
            } else if (pColor === BLACK && r < 5) {
                // 黑方棋子过河奖励
                let crossRiverBonus = 0;
                let depth_in_enemy = 5 - r; // 深入程度 1-5

                if (pieceType === "HORSE" || pieceType === "HORSE_CAR") {
                    crossRiverBonus = 30 * depth_in_enemy;
                } else if (pieceType === "CAR") {
                    crossRiverBonus = 20 * depth_in_enemy;
                } else if (pieceType === "CANNON") {
                    crossRiverBonus = 15 * depth_in_enemy;
                } else if (pieceType === "JUN") {
                    crossRiverBonus = 40 * depth_in_enemy;
                } else if (pieceType === "WEN") {
                    crossRiverBonus = 35 * depth_in_enemy;
                } else if (pieceType === "KUI") {
                    crossRiverBonus = 25 * depth_in_enemy;
                } else if (pieceType === "CHONG") {
                    crossRiverBonus = 20 * depth_in_enemy;
                }
                bBonus += crossRiverBonus;
            }

            // 升级棋子奖励
            if ([R_UPGRADE_CANNON, R_UPGRADE_CAR, R_HORSE_CAR, R_CHONG, R_KUI, R_JUN, R_WEN, R_SHI].includes(p)) rBonus += 800;
            if ([B_UPGRADE_CANNON, B_UPGRADE_CAR, B_HORSE_CAR, B_CHONG, B_KUI, B_JUN, B_WEN, B_SHI].includes(p)) bBonus += 800;

            if (pColor === RED) score += val;
            else score -= val;
        }
    }

    score += (rBonus - bBonus);
    score -= depth * 10;

    if (searchStack && searchStack.length > 0) {
        let totalLen = state.moveHistory.length + searchStack.length;
        const getMove = (idx) => {
            if (idx < state.moveHistory.length) return state.moveHistory[idx];
            return searchStack[idx - state.moveHistory.length];
        };

        if (totalLen >= 2) {
            let lastIdx = totalLen - 1;
            let m0 = getMove(lastIdx);
            let m2 = (lastIdx >= 2) ? getMove(lastIdx - 2) : null;
            let m4 = (lastIdx >= 4) ? getMove(lastIdx - 4) : null;
            let m6 = (lastIdx >= 6) ? getMove(lastIdx - 6) : null;

            if (m2 && isReverseMove(m0, m2)) {
                let basePenalty = 100000;
                let repeatCount = 1;
                if (m4 && isReverseMove(m2, m4)) repeatCount = 2;
                if (m6 && repeatCount >= 2 && isReverseMove(m4, m6)) repeatCount = 3;

                let penalty = basePenalty * Math.pow(10, repeatCount - 1);
                let isRedTurn = (searchStack.length % 2 === 1);
                if (state.moveHistory.length % 2 === 1) isRedTurn = !isRedTurn;

                if (isRedTurn) score -= penalty;
                else score += penalty;
            }

            if (m2 && isSamePieceMoved(m2, m0)) {
                let pieceRepeat = 1;
                if (m4 && isSamePieceMoved(m4, m2)) pieceRepeat = 2;
                if (m6 && pieceRepeat >= 2 && isSamePieceMoved(m6, m4)) pieceRepeat = 3;

                if (pieceRepeat >= 2) {
                    let penalty = 50000 * pieceRepeat;
                    let isRedTurn = (searchStack.length % 2 === 1);
                    if (state.moveHistory.length % 2 === 1) isRedTurn = !isRedTurn;
                    if (isRedTurn) score -= penalty;
                    else score += penalty;
                }
            }
        }
    }
    return score;
}
