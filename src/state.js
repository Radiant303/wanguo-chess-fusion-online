/**
 * AIMAX 象棋联机版 - 状态管理
 * 包含：游戏状态、联机状态、AI优化变量等
 */

import { RED, DEFAULT_WS_SERVER_URL } from './constants.js';

// ==================== 游戏状态变量 ====================
export let board = [];                    // 棋盘状态，二维数组
export let currentTurn = RED;             // 当前回合，初始为红方
export let gameMode = 'player_vs_ai';     // 游戏模式：player_vs_ai (人机对战), ai_vs_ai (AI对战), online (联机对战)
export let gameOver = false;              // 游戏是否结束
export let aiTimer = null;                // AI思考的定时器
export let selectedPiece = null;          // 当前选中的棋子
export let lastMove = null;               // 上一步移动
export let checkCount = 0;                // 将军次数
export let nodesSearched = 0;             // AI搜索的节点数
export let moveHistory = [];              // 全局历史栈，记录所有移动
export let positionHistory = {};          // 位置历史，用于检测重复局面
export let wenContinueState = null;       // 轀连续移动状态：{ pos: {r, c}, color, firstMove }

// ==================== AI 优化变量 ====================
export let killerMoves = [];              // 杀手走法，用于AI搜索优化
export let historyMoves = {};             // 历史走法，用于AI搜索优化

// ==================== 联机相关变量 ====================
export let myColor = null;                // 我的颜色
export let roomId = null;                 // 房间ID
export let isHost = false;                // 是否是房主
export let connectionState = 'disconnected'; // 连接状态：disconnected, connected, waiting

// ==================== WebSocket 状态 ====================
export let WS_SERVER_URL = DEFAULT_WS_SERVER_URL;
export let wsConnection = null;           // WebSocket连接实例
export let reconnectAttempts = 0;         // 重连尝试次数

// ==================== 状态更新函数 ====================
// 为了在模块化后能够更新状态，我们提供setter函数

export function setBoard(newBoard) {
    board = newBoard;
}

export function setCurrentTurn(turn) {
    currentTurn = turn;
}

export function setGameMode(mode) {
    gameMode = mode;
}

export function setGameOver(over) {
    gameOver = over;
}

export function setAiTimer(timer) {
    aiTimer = timer;
}

export function setSelectedPiece(piece) {
    selectedPiece = piece;
}

export function setLastMove(move) {
    lastMove = move;
}

export function setCheckCount(count) {
    checkCount = count;
}

export function setNodesSearched(count) {
    nodesSearched = count;
}

export function setMoveHistory(history) {
    moveHistory = history;
}

export function pushMoveHistory(move) {
    moveHistory.push(move);
}

export function setPositionHistory(history) {
    positionHistory = history;
}

export function setKillerMoves(moves) {
    killerMoves = moves;
}

export function setHistoryMoves(moves) {
    historyMoves = moves;
}

export function updateHistoryMoves(key, value) {
    historyMoves[key] = value;
}

export function setMyColor(color) {
    myColor = color;
}

export function setRoomId(id) {
    roomId = id;
}

export function setIsHost(host) {
    isHost = host;
}

export function setConnectionState(state) {
    connectionState = state;
}

export function setWsServerUrl(url) {
    WS_SERVER_URL = url;
}

export function setWsConnection(conn) {
    wsConnection = conn;
}

export function setReconnectAttempts(attempts) {
    reconnectAttempts = attempts;
}

export function incrementReconnectAttempts() {
    reconnectAttempts++;
}

// 重置游戏状态
export function resetGameState() {
    gameOver = false;
    lastMove = null;
    selectedPiece = null;
    checkCount = 0;
    moveHistory = [];
    positionHistory = {};
    currentTurn = RED;
    wenContinueState = null;
}

// 设置轀连续移动状态
export function setWenContinueState(state) {
    wenContinueState = state;
}

// 重置联机状态
export function resetOnlineState() {
    myColor = null;
    roomId = null;
    isHost = false;
    connectionState = 'disconnected';
    wsConnection = null;
    reconnectAttempts = 0;
}
