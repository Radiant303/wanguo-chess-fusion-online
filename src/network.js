/**
 * AIMAX 象棋联机版 - 联机功能
 */

import { RED, BLACK, MAX_RECONNECT_ATTEMPTS } from './constants.js';
import { log } from './utils.js';
import * as state from './state.js';

// 更新连接状态UI
export function updateConnectionStatus(statusState, text) {
    state.setConnectionState(statusState);
    const dot = document.getElementById('statusDot');
    const textEl = document.getElementById('connectionText');
    if (dot) dot.className = 'status-dot ' + statusState;
    if (textEl) textEl.textContent = text;
}

// 生成房间号
export function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 更新服务器地址
export function updateServerUrl() {
    const input = document.getElementById('serverUrlInput');
    const url = input ? input.value.trim() : '';
    if (url) {
        state.setWsServerUrl(url);
        log(`服务器地址已设置为: ${url}`, 'info');
    } else {
        state.setWsServerUrl('ws://175.24.198.214:9191');
        log('服务器地址已重置为默认: ws://175.24.198.214:9191', 'info');
    }
}

// 获取网络信息
export function getNetworkInfo() {
    return `局域网联机: ws://175.24.198.214:9191`.trim();
}

// 发送消息到服务器
export function sendToServer(data) {
    if (state.wsConnection && state.wsConnection.readyState === WebSocket.OPEN) {
        state.wsConnection.send(JSON.stringify(data));
    } else {
        log('未连接到服务器', 'highlight');
    }
}

// 处理断开连接
export function handleDisconnect() {
    updateConnectionStatus('disconnected', '未连接');
    state.setRoomId(null);
    state.setIsHost(false);
    state.setMyColor(null);
    const btnDisconnect = document.getElementById('btnDisconnect');
    const chatPanel = document.getElementById('chatPanel');
    if (btnDisconnect) btnDisconnect.style.display = 'none';
    if (chatPanel) chatPanel.style.display = 'none';
}

// 断开连接
export function disconnect() {
    if (state.wsConnection) {
        sendToServer({ type: 'leave_room' });
        state.wsConnection.close();
        state.setWsConnection(null);
    }
    handleDisconnect();
    const roomIdInput = document.getElementById('roomIdInput');
    if (roomIdInput) roomIdInput.value = '';
    log('已断开连接', 'info');
}

// 发送聊天消息
export function sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;
    if (state.connectionState === 'connected') {
        sendToServer({ type: 'chat', message: msg });
    }
    addChatMessage(msg, true);
    if (input) input.value = '';
}

// 添加聊天消息到界面
export function addChatMessage(msg, isMe) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.style.marginBottom = '4px';
    div.innerHTML = `<span style="color: ${isMe ? '#2c2c2c' : '#c0392b'}; font-weight: bold;">${isMe ? '我' : '对手'}:</span> ${msg}`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// 发送走法到服务器
export function sendMove(move) {
    if (state.connectionState === 'connected') {
        sendToServer({ type: 'move', move: move });
    }
}

// 处理对手断开连接
export function handleOpponentDisconnect() {
    updateConnectionStatus('disconnected', '对手已断开连接');
    state.setGameOver(true);
}

// 更新玩家指示器
export function updatePlayerIndicators() {
    const topEl = document.getElementById('topPlayerIndicator');
    const bottomEl = document.getElementById('bottomPlayerIndicator');
    if (!topEl || !bottomEl) return;

    if (state.gameMode === 'online') {
        if (state.myColor === RED) {
            bottomEl.textContent = '红方 (你)';
            topEl.textContent = state.connectionState === 'connected' ? '黑方 (对手)' : '黑方 (等待中...)';
        } else if (state.myColor === BLACK) {
            topEl.textContent = '黑方 (你)';
            bottomEl.textContent = state.connectionState === 'connected' ? '红方 (对手)' : '红方 (房主)';
        }
    } else if (state.gameMode === 'player_vs_ai') {
        bottomEl.textContent = '红方 (你)';
        topEl.textContent = '黑方 (AI)';
    } else {
        bottomEl.textContent = '红方 (AI)';
        topEl.textContent = '黑方 (AI)';
    }
}

// 连接到 WebSocket 服务器 (需要传入回调和游戏控制函数)
export function connectToServer(callback, gameCallbacks) {
    if (state.wsConnection && state.wsConnection.readyState === WebSocket.OPEN) {
        callback();
        return;
    }

    try {
        const ws = new WebSocket(state.WS_SERVER_URL);
        state.setWsConnection(ws);

        ws.onopen = () => {
            log('已连接到服务器', 'info');
            state.setReconnectAttempts(0);
            callback();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data, gameCallbacks);
            } catch (e) {
                console.error('解析消息失败:', e);
            }
        };

        ws.onclose = () => {
            log('与服务器断开连接', 'info');
            if (state.connectionState === 'connected' || state.connectionState === 'waiting') {
                updateConnectionStatus('disconnected', '连接已断开');
                if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    state.incrementReconnectAttempts();
                    log(`尝试重连... (${state.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, 'info');
                    setTimeout(() => {
                        if (state.roomId && state.isHost) {
                            gameCallbacks.createRoom();
                        } else if (state.roomId) {
                            gameCallbacks.joinRoom();
                        }
                    }, 2000);
                } else {
                    handleDisconnect();
                }
            }
        };

        ws.onerror = (error) => {
            log('服务器连接错误，请确保服务器已启动', 'highlight');
            console.error('WebSocket 错误:', error);
            updateConnectionStatus('disconnected', '连接失败');
        };

    } catch (e) {
        log('无法连接到服务器: ' + e.message, 'highlight');
        updateConnectionStatus('disconnected', '连接失败');
    }
}

// 处理服务器消息
export function handleServerMessage(data, gameCallbacks) {
    switch (data.type) {
        case 'room_created':
            state.setRoomId(data.roomId);
            state.setMyColor(data.color === 'red' ? RED : BLACK);
            state.setIsHost(true);
            updateConnectionStatus('waiting', '等待对手加入... 房间: ' + data.roomId);
            log(`房间已创建: ${data.roomId}，等待对手加入...`, 'info');
            updatePlayerIndicators();
            break;

        case 'join_accepted':
            state.setRoomId(data.roomId);
            state.setMyColor(data.color === 'red' ? RED : BLACK);
            state.setIsHost(false);
            updateConnectionStatus('connected', '已连接到房间!');
            log('已成功加入房间!', 'highlight');
            updatePlayerIndicators();
            if (gameCallbacks.restartGame) gameCallbacks.restartGame();
            break;

        case 'opponent_joined':
            updateConnectionStatus('connected', '对手已连接!');
            log('对手已加入房间!', 'highlight');
            updatePlayerIndicators();
            if (gameCallbacks.restartGame) gameCallbacks.restartGame();
            break;

        case 'game_start':
            log(data.message, 'highlight');
            break;

        case 'move':
            if (gameCallbacks.receiveMove) gameCallbacks.receiveMove(data.move);
            break;

        case 'chat':
            addChatMessage(data.message, false);
            break;

        case 'restart_request':
            log('对手请求重新开始', 'info');
            if (confirm('对手请求重新开始游戏，是否同意？')) {
                sendToServer({ type: 'restart_accept' });
                if (gameCallbacks.restartGame) gameCallbacks.restartGame();
            }
            break;

        case 'restart_accepted':
            if (gameCallbacks.restartGame) gameCallbacks.restartGame();
            break;

        case 'opponent_disconnected':
            handleOpponentDisconnect();
            log(data.message || '对手已断开连接', 'highlight');
            if (gameCallbacks.showModal) gameCallbacks.showModal('对手已断开连接');
            break;

        case 'error':
            log('错误: ' + data.message, 'highlight');
            alert(data.message);
            break;

        case 'pong':
            break;
    }
}
