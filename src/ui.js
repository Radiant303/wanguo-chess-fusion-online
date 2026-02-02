/**
 * AIMAX 象棋联机版 - UI 渲染
 */

import { ROWS, COLS, CELL_SIZE, EMPTY, RED, BLACK, PIECE_NAMES, R_WEN, B_WEN, PIECE_TYPES } from './constants.js';
import { getPieceColor } from './board.js';
import { getSafeMoves, makeMove, isInCheck, isCheckmate } from './moves.js';
import { findBestMove } from './ai.js';
import * as state from './state.js';
import * as network from './network.js';

// 绘制棋盘线条
export function drawBoardLines() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        let line = document.createElement('div');
        line.className = 'grid-row';
        line.style.top = (r * CELL_SIZE + CELL_SIZE / 2) + 'px';
        line.style.left = (CELL_SIZE / 2) + 'px';
        line.style.right = (CELL_SIZE / 2) + 'px';
        boardEl.appendChild(line);
    }

    for (let c = 0; c < COLS; c++) {
        let lineTop = document.createElement('div');
        lineTop.className = 'grid-col';
        lineTop.style.left = (c * CELL_SIZE + CELL_SIZE / 2) + 'px';
        lineTop.style.top = (CELL_SIZE / 2) + 'px';
        lineTop.style.height = (4 * CELL_SIZE) + 'px';
        boardEl.appendChild(lineTop);

        let lineBot = document.createElement('div');
        lineBot.className = 'grid-col';
        lineBot.style.left = (c * CELL_SIZE + CELL_SIZE / 2) + 'px';
        lineBot.style.top = (5 * CELL_SIZE + CELL_SIZE / 2) + 'px';
        lineBot.style.height = (4 * CELL_SIZE) + 'px';
        boardEl.appendChild(lineBot);
    }

    let leftSide = document.createElement('div');
    leftSide.className = 'grid-col';
    leftSide.style.left = (CELL_SIZE / 2) + 'px';
    leftSide.style.top = (4 * CELL_SIZE + CELL_SIZE / 2) + 'px';
    leftSide.style.height = CELL_SIZE + 'px';
    boardEl.appendChild(leftSide);

    let rightSide = document.createElement('div');
    rightSide.className = 'grid-col';
    rightSide.style.left = (8 * CELL_SIZE + CELL_SIZE / 2) + 'px';
    rightSide.style.top = (4 * CELL_SIZE + CELL_SIZE / 2) + 'px';
    rightSide.style.height = CELL_SIZE + 'px';
    boardEl.appendChild(rightSide);

    drawDiagonal(3, 0, 5, 2);
    drawDiagonal(5, 0, 3, 2);
    drawDiagonal(3, 7, 5, 9);
    drawDiagonal(5, 7, 3, 9);
}

// 绘制九宫格对角线
export function drawDiagonal(c1, r1, c2, r2) {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    let x1 = c1 * CELL_SIZE + CELL_SIZE / 2;
    let y1 = r1 * CELL_SIZE + CELL_SIZE / 2;
    let x2 = c2 * CELL_SIZE + CELL_SIZE / 2;
    let y2 = r2 * CELL_SIZE + CELL_SIZE / 2;

    let length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    let line = document.createElement('div');
    line.className = 'palace-line';
    line.style.left = x1 + 'px';
    line.style.top = y1 + 'px';
    line.style.width = length + 'px';
    line.style.transform = `rotate(${angle}deg)`;
    boardEl.appendChild(line);
}

// 渲染棋子
export function renderPieces() {
    const container = document.getElementById('piecesLayer');
    if (!container) return;
    container.innerHTML = '';

    if (state.lastMove) {
        let fDiv = document.createElement('div');
        fDiv.className = 'move-trace trace-from';
        fDiv.style.left = (state.lastMove.from.c * CELL_SIZE + CELL_SIZE / 2) + 'px';
        fDiv.style.top = (state.lastMove.from.r * CELL_SIZE + CELL_SIZE / 2) + 'px';
        container.appendChild(fDiv);

        let tDiv = document.createElement('div');
        tDiv.className = 'move-trace trace-to';
        tDiv.style.left = (state.lastMove.to.c * CELL_SIZE + CELL_SIZE / 2) + 'px';
        tDiv.style.top = (state.lastMove.to.r * CELL_SIZE + CELL_SIZE / 2) + 'px';
        container.appendChild(tDiv);
    }

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let p = state.board[r][c];
            if (p !== EMPTY) {
                let div = document.createElement('div');
                div.className = `piece ${getPieceColor(p) === RED ? 'red' : 'black'}`;
                if (state.selectedPiece && state.selectedPiece.r === r && state.selectedPiece.c === c) {
                    div.classList.add('selected');
                }
                div.style.left = (c * CELL_SIZE + 4) + 'px';
                div.style.top = (r * CELL_SIZE + 4) + 'px';
                div.innerText = PIECE_NAMES[p];
                div.onclick = (e) => onPieceClick(r, c, e);
                container.appendChild(div);
            } else {
                let dummy = document.createElement('div');
                dummy.style.position = 'absolute';
                dummy.style.left = (c * CELL_SIZE) + 'px';
                dummy.style.top = (r * CELL_SIZE) + 'px';
                dummy.style.width = CELL_SIZE + 'px';
                dummy.style.height = CELL_SIZE + 'px';
                dummy.style.zIndex = 1;
                dummy.onclick = () => onEmptyClick(r, c);
                container.appendChild(dummy);
            }
        }

    }

    // 显示选中棋子的可行移动提示
    if (state.selectedPiece) {
        // 获取当前方所有合法走法（已排除会导致被将军的走法）
        const allSafeMoves = getSafeMoves(state.board, state.currentTurn);
        // 筛选出当前选中棋子的走法
        const pieceMoves = allSafeMoves.filter(m => m.from.r === state.selectedPiece.r && m.from.c === state.selectedPiece.c);

        pieceMoves.forEach(m => {
            let indicator = document.createElement('div');
            const targetPiece = state.board[m.to.r][m.to.c];
            if (targetPiece !== EMPTY) {
                indicator.className = 'legal-move-capture';
            } else {
                indicator.className = 'legal-move-dot';
            }
            indicator.style.left = (m.to.c * CELL_SIZE + CELL_SIZE / 2) + 'px';
            indicator.style.top = (m.to.r * CELL_SIZE + CELL_SIZE / 2) + 'px';
            container.appendChild(indicator);
        });
    }
}

// 点击棋子事件处理
export function onPieceClick(r, c, e) {
    e.stopPropagation();
    if (state.gameOver) return;

    // 处理轀连续移动状态（必须完成第二次移动）
    if (state.wenContinueState) {
        const wenMoves = getWenContinueMoves(state.wenContinueState.pos, state.wenContinueState.color);
        const validWenMove = wenMoves.find(m => m.to.r === r && m.to.c === c);

        if (validWenMove) {
            // 执行轀的第二次移动
            doMove(validWenMove, true);
        } else {
            // 点击无效位置，提示用户必须完成第二次移动
            updateStatus("轀必须完成第二次移动！请点击有效的目标位置");
        }
        return;
    }

    if (state.gameMode === 'online') {
        if (state.connectionState !== 'connected') return;
        if (state.currentTurn !== state.myColor) return;
    } else if (state.gameMode === 'player_vs_ai' && state.currentTurn !== RED) {
        return;
    } else if (state.gameMode === 'ai_vs_ai') {
        return;
    }

    let p = state.board[r][c];
    let pColor = getPieceColor(p);

    if (pColor === state.currentTurn) {
        if (state.selectedPiece) {
            let moves = getSafeMoves(state.board, state.currentTurn);
            let valid = moves.find(m => m.from.r === state.selectedPiece.r && m.from.c === state.selectedPiece.c && m.to.r === r && m.to.c === c);
            if (valid) {
                doMove(valid);
                return;
            }
        }
        state.setSelectedPiece({ r, c });
        renderPieces();
    } else {
        if (state.selectedPiece) {
            tryMove(state.selectedPiece, { r, c });
        }
    }
}

// 点击空位事件处理
export function onEmptyClick(r, c) {
    if (state.gameOver) return;

    // 处理轀连续移动状态（必须完成第二次移动）
    if (state.wenContinueState) {
        const wenMoves = getWenContinueMoves(state.wenContinueState.pos, state.wenContinueState.color);
        const validWenMove = wenMoves.find(m => m.to.r === r && m.to.c === c);

        if (validWenMove) {
            // 执行轀的第二次移动
            doMove(validWenMove, true);
        } else {
            // 点击无效位置，提示用户必须完成第二次移动
            updateStatus("轀必须完成第二次移动！请点击有效的目标位置");
        }
        return;
    }

    if (state.gameMode === 'online') {
        if (state.connectionState !== 'connected') return;
        if (state.currentTurn !== state.myColor) return;
    } else if (state.gameMode === 'player_vs_ai' && state.currentTurn !== RED) {
        return;
    }
    if (state.selectedPiece) {
        tryMove(state.selectedPiece, { r, c });
    }
}

// 尝试移动
export function tryMove(from, to) {
    let moves = getSafeMoves(state.board, state.currentTurn);
    let valid = moves.find(m => m.from.r === from.r && m.from.c === from.c && m.to.r === to.r && m.to.c === to.c);

    if (valid) {
        doMove(valid);
    } else {
        // 如果移动无效，检查是否是因为处于被将军状态
        if (isInCheck(state.board, state.currentTurn)) {
            // 提示用户
            updateStatus("警告：必须解除将军状态！");

            // 触发棋盘红色闪烁
            const boardArea = document.getElementById('boardArea');
            if (boardArea) {
                boardArea.classList.remove('flash-red');
                void boardArea.offsetWidth;
                boardArea.classList.add('flash-red');
                setTimeout(() => boardArea.classList.remove('flash-red'), 500);
            }

            // 显示盘面浮层提示
            const overlay = document.getElementById('checkWarningOverlay');
            if (overlay) {
                overlay.innerText = "必须阻止将军！"; // 确保文字正确
                overlay.classList.add('show');
                // 1.5秒后自动隐藏
                clearTimeout(state.warningOverlayTimer);
                if (overlay.hideTimer) clearTimeout(overlay.hideTimer);
                overlay.hideTimer = setTimeout(() => {
                    overlay.classList.remove('show');
                }, 3000);
            }

            // 保持选中状态，显示绿色可行落点
            renderPieces();

            // 2秒后如果还在将军状态则恢复提示
            setTimeout(() => {
                if (isInCheck(state.board, state.currentTurn) && document.getElementById('statusText').innerText.includes("警告")) {
                    // updateStatus("将军！"); 
                }
            }, 2000);
        } else {
            state.setSelectedPiece(null);
            renderPieces();
        }
    }
}

// 执行移动
export function doMove(move, isWenSecondMove = false) {
    const movingPiece = state.board[move.from.r][move.from.c];
    const pieceType = PIECE_TYPES[movingPiece];

    state.setBoard(makeMove(state.board, move));
    state.setLastMove(move);
    state.setSelectedPiece(null);

    // 如果是轀的第二次移动，清理连续移动状态
    if (isWenSecondMove) {
        state.setWenContinueState(null);
    }

    // 添加到移动历史
    state.pushMoveHistory(move);

    let oppColor = state.currentTurn === RED ? BLACK : RED;
    if (isInCheck(state.board, oppColor)) updateStatus("将军！"); else updateStatus("");

    if (isCheckmate(state.board, oppColor)) {
        state.setGameOver(true);
        state.setWenContinueState(null);
        showModal(state.currentTurn === RED ? "红方胜利！" : "黑方胜利！");
        renderPieces();
        return;
    }

    // 检查是否是轀的第一次移动，可以进行连续移动
    if (pieceType === "WEN" && move.canContinue && !isWenSecondMove) {
        // 检查轀是否还有可移动的位置
        const wenMoves = getWenContinueMoves(move.to, state.currentTurn);
        if (wenMoves.length > 0) {
            // 进入连续移动状态
            state.setWenContinueState({
                pos: move.to,
                color: state.currentTurn,
                firstMove: move
            });
            state.setSelectedPiece(move.to);

            // 联机模式：轀第一次移动也要发送棋盘状态（但不切换回合）
            if (state.gameMode === 'online') {
                network.sendMove({
                    board: state.board,
                    lastMove: move,
                    currentTurn: state.currentTurn,  // 保持当前回合不变
                    wenContinue: true  // 标记轀正在连续移动
                });
            }

            renderPieces();
            updateStatus("轀必须完成第二次移动！请选择目标位置");
            // 调用scheduleNextMove让AI处理连续移动
            scheduleNextMove();
            return; // 不切换回合
        }
    }

    // 正常结束回合
    state.setCurrentTurn(oppColor);

    // 联机模式：发送完整棋盘状态
    if (state.gameMode === 'online') {
        network.sendMove({
            board: state.board,
            lastMove: move,
            currentTurn: oppColor
        });
    }

    state.setWenContinueState(null);
    renderPieces();
    if (!state.gameOver) scheduleNextMove();
}

// 获取轀连续移动的可用走法
function getWenContinueMoves(pos, color) {
    const moves = [];
    // 轀的移动方向（与moves.js中一致）
    let directions = [];
    if (color === RED) {
        directions = [[1, 0], [0, 1], [0, -1]]; // 向下、左、右（红方不能向上）
    } else {
        directions = [[-1, 0], [0, 1], [0, -1]]; // 向上、左、右（黑方不能向下）
    }

    const MAX_STEPS = 2; // 每次最多移动两格
    directions.forEach(([dr, dc]) => {
        let nr = pos.r + dr, nc = pos.c + dc;
        let steps = 0;
        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && steps < MAX_STEPS) {
            steps++;
            let target = state.board[nr][nc];
            if (target === EMPTY) {
                moves.push({ from: pos, to: { r: nr, c: nc }, canContinue: false });
            } else {
                // 可以吃敌方的子
                if (getPieceColor(target) !== color) {
                    moves.push({ from: pos, to: { r: nr, c: nc }, canContinue: false });
                }
                break; // 遇到任何棋子都停止
            }
            nr += dr; nc += dc;
        }
    });

    // 过滤掉会导致自杀的走法
    return moves.filter(m => {
        const newBoard = makeMove(state.board, m);
        return !isInCheck(newBoard, color);
    });
}

// 接收对手走法
export function receiveMove(data) {
    console.log('收到对手移动:', data);

    if (state.gameOver) return;

    // 如果对方轀正在连续移动，允许接收消息（不检查回合）
    if (!data.wenContinue) {
        // 检查是否是对方回合
        let expectedColor = state.currentTurn;
        if (expectedColor === state.myColor) {
            console.log('收到无效移动：不是对方回合', 'currentTurn:', state.currentTurn, 'myColor:', state.myColor);
            return;
        }
    }

    // 直接使用接收到的棋盘状态
    if (data.board) {
        state.setBoard(data.board);
        console.log('更新棋盘状态');
    }

    // 设置最后一步移动（用于显示移动轨迹）
    if (data.lastMove) {
        state.setLastMove(data.lastMove);
        console.log('设置最后移动:', data.lastMove);
    }

    // 设置回合
    if (data.currentTurn !== undefined) {
        console.log('设置回合:', data.currentTurn);
        state.setCurrentTurn(data.currentTurn);
    } else {
        // 兼容旧版本：如果没有currentTurn，则切换回合
        let oppColor = state.currentTurn === RED ? BLACK : RED;
        state.setCurrentTurn(oppColor);
    }

    let oppColor = state.currentTurn === RED ? BLACK : RED;
    if (isInCheck(state.board, oppColor)) updateStatus("将军！"); else updateStatus("");

    if (isCheckmate(state.board, oppColor)) {
        state.setGameOver(true);
        showModal(state.currentTurn === RED ? "红方胜利！" : "黑方胜利！");
        renderPieces();
        return;
    }

    renderPieces();

    // 根据轀连续移动状态显示不同提示
    if (data.wenContinue) {
        updateStatus("对手轀正在连续移动中...");
    } else {
        updateStatus(state.currentTurn === state.myColor ? "轮到你走棋" : "等待对手...");
    }
}

// 安排下一步移动
export function scheduleNextMove() {
    clearTimeout(state.aiTimer);

    // 处理AI的轀连续移动
    if (state.wenContinueState && state.gameMode !== 'online') {
        const aiColor = state.wenContinueState.color;
        // 如果是AI回合（ai_vs_ai模式或player_vs_ai模式且当前是AI）
        const isAiTurn = state.gameMode === 'ai_vs_ai' ||
            (state.gameMode === 'player_vs_ai' && aiColor === BLACK);

        if (isAiTurn) {
            updateStatus("轀连续移动中...");
            state.setAiTimer(setTimeout(() => {
                handleAiWenContinue();
            }, 300));
            return;
        }
    }

    if (state.gameMode === 'online') {
        updateStatus(state.currentTurn === state.myColor ? "轮到你走棋" : "等待对手...");
    } else if (state.gameMode === 'ai_vs_ai') {
        updateStatus(state.currentTurn === RED ? "红方思考中..." : "黑方思考中...");
        state.setAiTimer(setTimeout(async () => {
            let move = await findBestMove(state.currentTurn);
            if (move) doMove(move);
            else {
                state.setGameOver(true);
                showModal((state.currentTurn === RED ? "黑方" : "红方") + "胜利 (无子可走)");
            }
        }, 100));
    } else if (state.gameMode === 'player_vs_ai') {
        if (state.currentTurn === BLACK) {
            updateStatus("AI思考中...");
            state.setAiTimer(setTimeout(async () => {
                let move = await findBestMove(BLACK);
                if (move) doMove(move);
                else {
                    state.setGameOver(true);
                    showModal("红方胜利 (AI无子可走)");
                }
            }, 100));
        } else {
            updateStatus("请红方走棋");
        }
    }
}

// AI处理轀的连续移动
function handleAiWenContinue() {
    if (!state.wenContinueState) return;

    const wenMoves = getWenContinueMoves(state.wenContinueState.pos, state.wenContinueState.color);

    if (wenMoves.length === 0) {
        // 这种情况理论上不应该发生，因为进入连续移动状态前已检查
        console.error('轀连续移动状态异常：没有可用的第二次移动');
        // 强制结束回合
        const oppColor = state.wenContinueState.color === RED ? BLACK : RED;
        state.setWenContinueState(null);
        state.setSelectedPiece(null);
        state.setCurrentTurn(oppColor);
        renderPieces();
        if (!state.gameOver) scheduleNextMove();
        return;
    }

    // AI选择最优的第二次移动（简单策略：优先吃子，否则前进）
    let bestMove = wenMoves[0];
    let bestScore = -Infinity;

    for (const move of wenMoves) {
        let score = 0;
        const target = state.board[move.to.r][move.to.c];

        // 吃子加分
        if (target !== EMPTY) {
            const targetColor = getPieceColor(target);
            if (targetColor !== state.wenContinueState.color) {
                score += 1000; // 吃敌方子加大分
            }
        }

        // 前进加分（红方向下增加r，黑方向上减少r）
        const color = state.wenContinueState.color;
        if (color === RED) {
            score += (move.to.r - state.wenContinueState.pos.r) * 10;
        } else {
            score += (state.wenContinueState.pos.r - move.to.r) * 10;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    // 执行第二次移动
    doMove(bestMove, true);
}

// 更新状态文本
export function updateStatus(msg) {
    const el = document.getElementById('statusText');
    if (el) el.innerText = msg || "游戏中";
}

// 显示模态框
export function showModal(msg) {
    const msgEl = document.getElementById('modalMessage');
    const overlay = document.getElementById('modalOverlay');
    if (msgEl) msgEl.innerText = msg;
    if (overlay) overlay.style.display = 'flex';
}

// 关闭模态框
export function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.style.display = 'none';
}

// 更新模式按钮状态
export function updateModeButtons() {
    const btnOnline = document.getElementById('btnOnline');
    const btnAiVsAi = document.getElementById('btnAiVsAi');
    const btnPlayerVsAi = document.getElementById('btnPlayerVsAi');
    if (btnOnline) btnOnline.className = state.gameMode === 'online' ? 'btn active' : 'btn';
    if (btnAiVsAi) btnAiVsAi.className = state.gameMode === 'ai_vs_ai' ? 'btn active' : 'btn';
    if (btnPlayerVsAi) btnPlayerVsAi.className = state.gameMode === 'player_vs_ai' ? 'btn active' : 'btn';
}
