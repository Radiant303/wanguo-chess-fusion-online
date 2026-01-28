/**
 * AIMAX 象棋联机版 - 工具函数
 * 包含：日志输出、棋盘哈希等通用工具函数
 */

import { ROWS, COLS } from './constants.js';

/**
 * 日志输出函数
 * @param {string} msg - 日志消息
 * @param {string} type - 日志类型：normal (普通), highlight (高亮), info (信息)
 */
export function log(msg, type = 'normal') {
    const panel = document.getElementById('logPanel');
    if (!panel) return;

    // 限制日志条数，超过100条时删除最早的日志
    if (panel.childElementCount > 100) {
        panel.removeChild(panel.firstElementChild);
    }
    const div = document.createElement('div');
    div.className = 'log-entry';
    // 根据类型添加不同的样式
    if (type === 'highlight') div.classList.add('log-highlight');
    if (type === 'info') div.classList.add('log-info');
    // 添加时间戳
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    div.innerText = `[${time}] ${msg}`;
    panel.appendChild(div);
    // 自动滚动到底部
    panel.scrollTop = panel.scrollHeight;
}

/**
 * 清空日志面板
 */
export function clearLog() {
    const panel = document.getElementById('logPanel');
    if (panel) {
        panel.innerHTML = '';
    }
}

/**
 * 将棋盘状态转换为哈希值，用于检测重复局面
 * @param {Array} currBoard - 当前棋盘状态
 * @returns {string} 棋盘状态的哈希值
 */
export function boardToHash(currBoard) {
    let hash = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            hash += currBoard[r][c] + ',';
        }
    }
    return hash;
}
