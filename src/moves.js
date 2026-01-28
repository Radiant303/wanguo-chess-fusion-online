/**
 * AIMAX 象棋联机版 - 移动生成与验证
 */

import {
    ROWS, COLS, EMPTY, RED, BLACK,
    R_KING, B_KING, R_SHI, B_SHI, PIECE_TYPES
} from './constants.js';
import { getPieceColor, isInsidePalace, upgradePiece } from './board.js';

// 检查己方棋盘上是否存在仕
function hasOwnShi(currBoard, color) {
    const shiPiece = color === RED ? R_SHI : B_SHI;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (currBoard[r][c] === shiPiece) return true;
        }
    }
    return false;
}

export function getLegalMoves(currBoard, color) {
    let moves = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let piece = currBoard[r][c];
            if (getPieceColor(piece) !== color) continue;
            let type = PIECE_TYPES[piece];

            const tryAdd = (tr, tc) => {
                if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS) return;
                let target = currBoard[tr][tc];
                let targetColor = getPieceColor(target);
                if (target === EMPTY || targetColor !== color) {
                    moves.push({ from: { r, c }, to: { r: tr, c: tc } });
                } else {
                    if (upgradePiece(piece, target) !== piece) {
                        moves.push({ from: { r, c }, to: { r: tr, c: tc } });
                    }
                }
            };

            if (type === "KING") {
                // 当己方有仕存在时，将帅无法移动
                if (!hasOwnShi(currBoard, color)) {
                    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        if (isInsidePalace(nr, nc, color)) tryAdd(nr, nc);
                    });
                }
            } else if (type === "ADVISOR") {
                [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
                    let nr = r + dr, nc = c + dc;
                    if (isInsidePalace(nr, nc, color)) tryAdd(nr, nc);
                });
            } else if (type === "ELEPHANT") {
                [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(([dr, dc]) => {
                    let nr = r + dr, nc = c + dc;
                    let eyeR = r + dr / 2, eyeC = c + dc / 2;
                    if (eyeR >= 0 && eyeR < ROWS && eyeC >= 0 && eyeC < COLS && currBoard[eyeR][eyeC] === EMPTY) {
                        if (color === RED && nr >= 5) return;
                        if (color === BLACK && nr <= 4) return;
                        tryAdd(nr, nc);
                    }
                });
            } else {
                if (type === "HORSE" || type === "HORSE_CAR") {
                    [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let legR = r + (Math.abs(dr) === 2 ? Math.sign(dr) : 0);
                        let legC = c + (Math.abs(dc) === 2 ? Math.sign(dc) : 0);
                        if (legR >= 0 && legR < ROWS && legC >= 0 && legC < COLS && currBoard[legR][legC] === EMPTY) {
                            tryAdd(nr, nc);
                        }
                    });
                }
                if (type === "CAR" || type === "HORSE_CAR") {
                    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            let target = currBoard[nr][nc];
                            if (target === EMPTY) {
                                moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                            } else {
                                if (getPieceColor(target) !== color) {
                                    moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                                } else if (upgradePiece(piece, target) !== piece) {
                                    moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                                }
                                break;
                            }
                            nr += dr; nc += dc;
                        }
                    });
                }
                if (type === "CANNON") {
                    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let hasJump = false;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            let target = currBoard[nr][nc];
                            if (target === EMPTY) {
                                if (!hasJump) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                            } else {
                                if (!hasJump) { hasJump = true; }
                                else {
                                    if (getPieceColor(target) !== color) {
                                        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                                    }
                                    break;
                                }
                            }
                            nr += dr; nc += dc;
                        }
                    });
                }
                if (type === "CHONG") {
                    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let jumpCount = 0;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            let target = currBoard[nr][nc];
                            if (target === EMPTY) {
                                if (jumpCount === 0) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                            } else {
                                if (jumpCount === 0) { jumpCount = 1; }
                                else if (jumpCount === 1) {
                                    if (getPieceColor(target) !== color) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                                    jumpCount = 2;
                                } else if (jumpCount === 2) {
                                    if (getPieceColor(target) !== color) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                                    break;
                                }
                            }
                            nr += dr; nc += dc;
                        }
                    });
                }
                if (type === "KUI") {
                    [[0, 1], [0, -1]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let hasJump = false;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            let target = currBoard[nr][nc];
                            if (target === EMPTY) {
                                if (!hasJump) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                            } else {
                                if (!hasJump) { hasJump = true; }
                                else {
                                    if (getPieceColor(target) !== color) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                                    break;
                                }
                            }
                            nr += dr; nc += dc;
                        }
                    });
                }
                // 轀（WEN）：车的走法，但不能后退，每次最多移动两格
                if (type === "WEN") {
                    // 红方：可以向前（增大r）、左右移动，不能后退（减小r）
                    // 黑方：可以向前（减小r）、左右移动，不能后退（增大r）
                    let directions = [];
                    if (color === RED) {
                        // 红方不能后退（向上，r减小方向）
                        directions = [[1, 0], [0, 1], [0, -1]]; // 向下、左、右
                    } else {
                        // 黑方不能后退（向下，r增大方向）
                        directions = [[-1, 0], [0, 1], [0, -1]]; // 向上、左、右
                    }
                    const MAX_STEPS = 2; // 每次最多移动两格
                    directions.forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let steps = 0;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && steps < MAX_STEPS) {
                            steps++;
                            let target = currBoard[nr][nc];
                            if (target === EMPTY) {
                                moves.push({ from: { r, c }, to: { r: nr, c: nc }, canContinue: true });
                            } else {
                                if (getPieceColor(target) !== color) {
                                    moves.push({ from: { r, c }, to: { r: nr, c: nc }, canContinue: true });
                                } else if (upgradePiece(piece, target) !== piece) {
                                    moves.push({ from: { r, c }, to: { r: nr, c: nc }, canContinue: true });
                                }
                                break;
                            }
                            nr += dr; nc += dc;
                        }
                    });
                }
                // 骏（JUN）：兼具马和象的走法，两者都会被蹩腿
                if (type === "JUN") {
                    // 马的走法（会被蹩马腿）
                    [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let legR = r + (Math.abs(dr) === 2 ? Math.sign(dr) : 0);
                        let legC = c + (Math.abs(dc) === 2 ? Math.sign(dc) : 0);
                        if (legR >= 0 && legR < ROWS && legC >= 0 && legC < COLS && currBoard[legR][legC] === EMPTY) {
                            tryAdd(nr, nc);
                        }
                    });
                    // 象的走法（会被蹩象眼，且不能过河）
                    [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let eyeR = r + dr / 2, eyeC = c + dc / 2;
                        if (eyeR >= 0 && eyeR < ROWS && eyeC >= 0 && eyeC < COLS && currBoard[eyeR][eyeC] === EMPTY) {
                            // 骏不能过河
                            if (color === RED && nr >= 5) return;
                            if (color === BLACK && nr <= 4) return;
                            tryAdd(nr, nc);
                        }
                    });
                }
                if (type === "PAWN") {
                    let dirs = [];
                    if (color === RED) {
                        if (r < 5) dirs.push([1, 0]);
                        else dirs.push([1, 0], [0, 1], [0, -1]);
                    } else {
                        if (r > 4) dirs.push([-1, 0]);
                        else dirs.push([-1, 0], [0, 1], [0, -1]);
                    }
                    dirs.forEach(([dr, dc]) => tryAdd(r + dr, c + dc));
                }
                // 仕（SHI）：全棋盘斜向一格移动，无九宫限制
                if (type === "SHI") {
                    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        tryAdd(nr, nc);
                    });
                }
            }
        }
    }
    return moves;
}

export function makeMove(currBoard, move) {
    let newBoard = currBoard.map(row => [...row]);
    let f = move.from, t = move.to;
    let movingPiece = newBoard[f.r][f.c];
    let capturedPiece = newBoard[t.r][t.c];
    if (capturedPiece !== EMPTY && getPieceColor(movingPiece) === getPieceColor(capturedPiece)) {
        newBoard[t.r][t.c] = upgradePiece(movingPiece, capturedPiece);
    } else {
        newBoard[t.r][t.c] = movingPiece;
    }
    newBoard[f.r][f.c] = EMPTY;
    return newBoard;
}

export function isInCheck(currBoard, color) {
    let kingType = (color === RED) ? R_KING : B_KING;
    let kingPos = null;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (currBoard[r][c] === kingType) { kingPos = { r, c }; break; }
        }
    }
    if (!kingPos) return true;
    let oppColor = (color === RED) ? BLACK : RED;
    let moves = getLegalMoves(currBoard, oppColor);
    return moves.some(m => m.to.r === kingPos.r && m.to.c === kingPos.c);
}

export function kingsFacing(currBoard) {
    let rK, bK;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (currBoard[r][c] === R_KING) rK = { r, c };
            if (currBoard[r][c] === B_KING) bK = { r, c };
        }
    }
    if (!rK || !bK) return false;
    if (rK.c !== bK.c) return false;
    for (let r = Math.min(rK.r, bK.r) + 1; r < Math.max(rK.r, bK.r); r++) {
        if (currBoard[r][rK.c] !== EMPTY) return false;
    }
    return true;
}

export function getSafeMoves(currBoard, color) {
    let pseudoMoves = getLegalMoves(currBoard, color);
    let safeMoves = [];
    for (let m of pseudoMoves) {
        let nextBoard = makeMove(currBoard, m);
        if (!isInCheck(nextBoard, color) && !kingsFacing(nextBoard)) {
            safeMoves.push(m);
        }
    }
    return safeMoves;
}

export function isCheckmate(currBoard, color) {
    if (!isInCheck(currBoard, color)) return false;
    let moves = getSafeMoves(currBoard, color);
    return moves.length === 0;
}
