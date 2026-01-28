/**
 * AIMAX 象棋联机版 - AI 核心算法
 */

import { EMPTY, RED, BLACK, SEARCH_DEPTH, PIECE_NAMES } from './constants.js';
import { getPieceColor } from './board.js';
import { getSafeMoves, makeMove, isInCheck } from './moves.js';
import { log, clearLog } from './utils.js';
import * as state from './state.js';
import {
    isReverseMove, isSameMove, scoreMove, evaluateBoard, getRepetitionPenalty, getDynamicSearchDepth
} from './ai-helpers.js';

// Minimax算法带alpha-beta剪枝
export function minimax(currBoard, depth, alpha, beta, isMax, stack = []) {
    state.setNodesSearched(state.nodesSearched + 1);
    let color = isMax ? RED : BLACK;

    if (depth === 0) {
        return { score: evaluateBoard(currBoard, depth, stack), move: null };
    }

    let moves = getSafeMoves(currBoard, color);

    if (moves.length === 0) {
        if (isInCheck(currBoard, color)) {
            return { score: isMax ? -100000 : 100000, move: null };
        }
        return { score: 0, move: null };
    }

    moves.forEach(m => m.score = scoreMove(m, currBoard, depth));
    moves.sort((a, b) => b.score - a.score);

    let bestMove = moves[0];
    let bestVal = isMax ? -Infinity : Infinity;

    for (let m of moves) {
        let nextBoard = makeMove(currBoard, m);
        stack.push(m);
        let result = minimax(nextBoard, depth - 1, alpha, beta, !isMax, stack);
        stack.pop();

        let val = result.score;

        if (isMax) {
            if (val > bestVal) { bestVal = val; bestMove = m; }
            alpha = Math.max(alpha, bestVal);
        } else {
            if (val < bestVal) { bestVal = val; bestMove = m; }
            beta = Math.min(beta, bestVal);
        }

        if (beta <= alpha) {
            if (currBoard[m.to.r][m.to.c] === EMPTY) {
                if (!state.killerMoves[depth]) {
                    state.killerMoves[depth] = [null, null];
                }
                if (!isSameMove(state.killerMoves[depth][0], m)) {
                    state.killerMoves[depth][1] = state.killerMoves[depth][0];
                    state.killerMoves[depth][0] = m;
                }
                let key = `${m.from.r},${m.from.c},${m.to.r},${m.to.c}`;
                state.updateHistoryMoves(key, (state.historyMoves[key] || 0) + depth * depth);
            }
            break;
        }
    }
    return { score: bestVal, move: bestMove };
}

// 寻找最佳走法
export async function findBestMove(color) {
    //clearLog();
    let name = color === RED ? "红方" : "黑方";
    log(`===========`, 'info');
    log(`${name} AI 思考中...`, 'info');
    let startTime = Date.now();
    state.setNodesSearched(0);
    state.setKillerMoves([]);

    let moves = getSafeMoves(state.board, color);
    if (moves.length === 0) return null;

    // 获取动态搜索深度
    const searchDepth = getDynamicSearchDepth(state.board);
    log(`搜索深度: ${searchDepth}`, 'info');

    let nonReverseMoves = moves.filter(m => {
        if (state.moveHistory.length < 2) return true;
        const myLastMove = state.moveHistory[state.moveHistory.length - 2];
        return !isReverseMove(m, myLastMove);
    });

    if (nonReverseMoves.length > 0) {
        moves = nonReverseMoves;
    }

    moves.forEach(m => {
        m.score = scoreMove(m, state.board, searchDepth);
        let repPenalty = getRepetitionPenalty(m, state.moveHistory, color === RED);
        m.repetitionPenalty = repPenalty;
    });
    moves.sort((a, b) => b.score - a.score);

    let isMax = (color === RED);
    let bestMove = moves[0];
    let bestScore = isMax ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;
    let stack = [];

    for (let i = 0; i < moves.length; i++) {
        let m = moves[i];
        let nextBoard = makeMove(state.board, m);

        if (i % 3 === 0) await new Promise(r => setTimeout(r, 0));

        stack.push(m);
        let result = minimax(nextBoard, searchDepth - 1, alpha, beta, !isMax, stack);
        stack.pop();

        let score = result.score;
        if (m.repetitionPenalty !== 0) {
            score = isMax ? (score - Math.abs(m.repetitionPenalty)) : (score + Math.abs(m.repetitionPenalty));
        }

        let update = false;
        if (isMax) {
            if (score > bestScore) { bestScore = score; bestMove = m; update = true; }
            alpha = Math.max(alpha, bestScore);
        } else {
            if (score < bestScore) { bestScore = score; bestMove = m; update = true; }
            beta = Math.min(beta, bestScore);
        }

        if (update || i === 0) {
            const pieceCode = state.board[m.from.r][m.from.c];
            let pName = PIECE_NAMES[pieceCode] || `未知(${pieceCode})`;
            let repInfo = m.repetitionPenalty !== 0 ? ` [重复惩罚: ${m.repetitionPenalty}]` : '';
            log(`考虑: ${pName} (${m.from.r},${m.from.c})->(${m.to.r},${m.to.c}) | 分数: ${score}${repInfo} ${update ? '*' : ''}`);
        }

        if (beta <= alpha) break;
    }

    let duration = Date.now() - startTime;
    log(`--- 思考结束 ---`);
    log(`耗时: ${duration}ms | 节点: ${state.nodesSearched}`);
    if (bestMove) {
        // 获取棋子名称，如果找不到则显示棋子编码
        const pieceCode = state.board[bestMove.from.r][bestMove.from.c];
        const pieceName = PIECE_NAMES[pieceCode] || `未知棋子(${pieceCode})`;
        log(`最优解: ${pieceName} 到 (${bestMove.to.r},${bestMove.to.c})`, 'highlight');
    }
    return bestMove;
}
