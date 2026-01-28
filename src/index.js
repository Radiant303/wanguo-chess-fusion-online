/**
 * AIMAX 象棋联机版 - 主入口文件
 * 整合所有模块并导出全局函数供HTML使用
 */

import { RED, BLACK } from './constants.js';
import { initBoard } from './board.js';
import * as state from './state.js';
import * as network from './network.js';
import * as ui from './ui.js';

// ==================== 游戏控制函数 ====================

// 设置游戏模式
export function setMode(mode) {
    if (mode === state.gameMode) return;
    if (mode !== 'online' && state.connectionState !== 'disconnected') {
        if (!confirm('切换模式将断开联机连接，确定吗？')) return;
        network.disconnect();
    }
    state.setGameMode(mode);
    ui.updateModeButtons();
    network.updatePlayerIndicators();
    if (mode !== 'online') restartGame();
}

// 重新开始游戏
export function restartGame() {
    clearTimeout(state.aiTimer);
    state.setBoard(initBoard());
    state.resetGameState();
    state.setCurrentTurn(RED);
    ui.updateModeButtons();
    network.updatePlayerIndicators();
    ui.renderPieces();
    if (state.gameMode === 'online' && state.connectionState === 'connected') {
        ui.updateStatus(state.myColor === RED ? "轮到你走棋" : "等待对手...");
    } else {
        ui.scheduleNextMove();
    }
}

// 创建房间
export function createRoom() {
    if (state.connectionState !== 'disconnected' && state.connectionState !== 'waiting') {
        alert('请先断开当前连接');
        return;
    }

    const inputRoomId = document.getElementById('roomIdInput').value.trim() || network.generateRoomId();
    document.getElementById('roomIdInput').value = inputRoomId;

    network.updateConnectionStatus('waiting', '正在连接服务器...');

    network.connectToServer(() => {
        network.sendToServer({
            type: 'create_room',
            roomId: inputRoomId
        });

        document.getElementById('btnDisconnect').style.display = 'inline-block';
        document.getElementById('chatPanel').style.display = 'block';
        setMode('online');
    }, gameCallbacks);
}

// 加入房间
export function joinRoom() {
    if (state.connectionState !== 'disconnected') {
        alert('请先断开当前连接');
        return;
    }

    const inputRoomId = document.getElementById('roomIdInput').value.trim();
    if (!inputRoomId) {
        alert('请输入房间号');
        return;
    }

    network.updateConnectionStatus('waiting', '正在连接服务器...');

    network.connectToServer(() => {
        network.sendToServer({
            type: 'join_room',
            roomId: inputRoomId
        });

        document.getElementById('btnDisconnect').style.display = 'inline-block';
        document.getElementById('chatPanel').style.display = 'block';
        setMode('online');
    }, gameCallbacks);
}

// 游戏回调函数集合，供网络模块调用
const gameCallbacks = {
    restartGame,
    createRoom,
    joinRoom,
    receiveMove: ui.receiveMove,
    showModal: ui.showModal
};

// ==================== 全局导出 ====================
// 将函数绑定到 window 对象供 HTML 调用

window.setMode = setMode;
window.restartGame = restartGame;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.disconnect = network.disconnect;
window.sendChat = network.sendChat;
window.updateServerUrl = network.updateServerUrl;
window.closeModal = ui.closeModal;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    ui.drawBoardLines();
    restartGame();
});
