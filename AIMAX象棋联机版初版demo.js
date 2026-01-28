/**
 * AIMAX 象棋联机版 - 游戏逻辑
 * 支持：联机对战(WebRTC)、AI对战、人机对战
 */

// ==================== 常量与配置 ====================
// 棋盘尺寸
const ROWS = 10; // 棋盘行数
const COLS = 9;  // 棋盘列数
const CELL_SIZE = 60; // 每个格子的大小（像素）
const SEARCH_DEPTH = 5; // AI搜索深度

// 颜色常量
const EMPTY = 0; // 空格
const RED = 1;   // 红方
const BLACK = 2; // 黑方

// 棋子编码 - 红方
const R_KING = 11;     // 帅
const R_ADVISOR = 12;  // 士
const R_ELEPHANT = 13; // 相
const R_HORSE = 14;    // 马
const R_CAR = 15;      // 车
const R_CANNON = 16;   // 炮
const R_PAWN = 17;     // 兵

// 棋子编码 - 黑方
const B_KING = 21;     // 将
const B_ADVISOR = 22;  // 士
const B_ELEPHANT = 23; // 象
const B_HORSE = 24;    // 马
const B_CAR = 25;      // 车
const B_CANNON = 26;   // 炮
const B_PAWN = 27;     // 卒

// 升级棋子 - 红方
const R_UPGRADE_CANNON = 18; // 升级炮
const R_UPGRADE_CAR = 19;    // 升级车
const R_HORSE_CAR = 20;      // 车马
const R_CHONG = 31;          // 铳
const R_KUI = 33;            // 軳

// 升级棋子 - 黑方
const B_UPGRADE_CANNON = 28; // 升级炮
const B_UPGRADE_CAR = 29;    // 升级车
const B_HORSE_CAR = 30;      // 车马
const B_CHONG = 32;          // 铳
const B_KUI = 34;            // 軳

// 棋子名称映射
const PIECE_NAMES = {
    11: "帅", 12: "士", 13: "相", 14: "马", 15: "车", 16: "炮", 17: "兵", 18: "炮", 19: "车", 20: "骠", 31: "铳", 33: "軳",
    21: "将", 22: "士", 23: "象", 24: "马", 25: "车", 26: "炮", 27: "卒", 28: "炮", 29: "车", 30: "骠", 32: "铳", 34: "軳"
};

// 棋子类型映射
const PIECE_TYPES = {
    11: "KING", 12: "ADVISOR", 13: "ELEPHANT", 14: "HORSE", 15: "CAR", 16: "CANNON", 17: "PAWN",
    21: "KING", 22: "ADVISOR", 23: "ELEPHANT", 24: "HORSE", 25: "CAR", 26: "CANNON", 27: "PAWN",
    18: "CANNON", 19: "CAR", 20: "HORSE_CAR", 31: "CHONG", 33: "KUI",
    28: "CANNON", 29: "CAR", 30: "HORSE_CAR", 32: "CHONG", 34: "KUI"
};

// 棋子价值评估
const PIECE_VALUES = {
    [R_KING]: 10000, [B_KING]: 10000,      // 王/帅价值最高
    [R_ADVISOR]: 200, [B_ADVISOR]: 200,    // 士价值
    [R_ELEPHANT]: 200, [B_ELEPHANT]: 200,  // 象/相价值
    [R_HORSE]: 450, [B_HORSE]: 450,        // 马价值
    [R_CAR]: 900, [B_CAR]: 900,            // 车价值
    [R_CANNON]: 500, [B_CANNON]: 500,      // 炮价值
    [R_PAWN]: 100, [B_PAWN]: 100,          // 兵/卒价值
    [R_UPGRADE_CANNON]: 450, [B_UPGRADE_CANNON]: 450, // 升级炮价值
    [R_UPGRADE_CAR]: 900, [B_UPGRADE_CAR]: 900,       // 升级车价值
    [R_HORSE_CAR]: 600, [B_HORSE_CAR]: 600,           // 车马价值
    [R_CHONG]: 600, [B_CHONG]: 600,                   // 铳价值
    [R_KUI]: 700, [B_KUI]: 700                       // 軳价值
};

// ==================== 状态变量 ====================
let board = [];              // 棋盘状态，二维数组
let currentTurn = RED;       // 当前回合，初始为红方
let gameMode = 'player_vs_ai'; // 游戏模式：player_vs_ai (人机对战), ai_vs_ai (AI对战), online (联机对战)
let gameOver = false;        // 游戏是否结束
let aiTimer = null;          // AI思考的定时器
let selectedPiece = null;    // 当前选中的棋子
let lastMove = null;         // 上一步移动
let checkCount = 0;          // 将军次数
let nodesSearched = 0;       // AI搜索的节点数
let moveHistory = [];        // 全局历史栈，记录所有移动
let positionHistory = {};    // 位置历史，用于检测重复局面

// AI 优化变量
let killerMoves = [];        // 杀手走法，用于AI搜索优化
let historyMoves = {};       // 历史走法，用于AI搜索优化

// 联机相关
let myColor = null;          // 我的颜色
let roomId = null;           // 房间ID
let isHost = false;          // 是否是房主
let connectionState = 'disconnected'; // 连接状态：disconnected, connected, waiting

// WebSocket 服务器配置
// 本地测试: ws://localhost:8765
// 局域网: ws://你的IP地址:8765 (例如 ws://192.168.1.100:8765)
let WS_SERVER_URL = 'ws://localhost:9191'; // WebSocket服务器地址
let wsConnection = null;     // WebSocket连接实例
let reconnectAttempts = 0;   // 重连尝试次数
const MAX_RECONNECT_ATTEMPTS = 3; // 最大重连尝试次数

// ==================== 工具函数 ====================
/**
 * 日志输出函数
 * @param {string} msg - 日志消息
 * @param {string} type - 日志类型：normal (普通), highlight (高亮), info (信息)
 */
function log(msg, type = 'normal') {
    const panel = document.getElementById('logPanel');
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
function clearLog() {
    document.getElementById('logPanel').innerHTML = '';
}

/**
 * 将棋盘状态转换为哈希值，用于检测重复局面
 * @param {Array} currBoard - 当前棋盘状态
 * @returns {string} 棋盘状态的哈希值
 */
function boardToHash(currBoard) {
    let hash = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            hash += currBoard[r][c] + ',';
        }
    }
    return hash;
}

// ==================== 棋盘初始化 ====================
/**
 * 初始化棋盘，设置初始布局
 * @returns {Array} 初始化后的棋盘状态
 */
function initBoard() {
    // 创建一个空棋盘
    let b = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));

    // 红方布局
    b[0][4] = R_KING;          // 帅放在第0行第4列
    b[0][3] = b[0][5] = R_ADVISOR; // 士放在第0行第3和5列
    b[0][2] = b[0][6] = R_ELEPHANT; // 相放在第0行第2和6列
    b[0][1] = b[0][7] = R_HORSE;    // 马放在第0行第1和7列
    b[0][0] = b[0][8] = R_CAR;      // 车放在第0行第0和8列
    b[2][1] = b[2][7] = R_CANNON;   // 炮放在第2行第1和7列
    for (let i = 0; i < 9; i += 2) b[3][i] = R_PAWN; // 兵放在第3行，间隔排列

    // 黑方布局
    b[9][4] = B_KING;          // 将放在第9行第4列
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
function getPieceColor(piece) {
    if (piece === EMPTY) return null;

    // 处理特殊升级棋子
    if (piece === R_HORSE_CAR) return RED;
    if (piece === B_HORSE_CAR) return BLACK;
    if (piece === R_CHONG) return RED;
    if (piece === B_CHONG) return BLACK;
    if (piece === R_KUI) return RED;
    if (piece === B_KUI) return BLACK;
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
function isInsidePalace(r, c, color) {
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
function upgradePiece(movingPiece, capturedPiece) {
    const mType = PIECE_TYPES[movingPiece];  // 移动棋子的类型
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
        } else if (mType === "CAR" && cType === "CANNON") {
            return R_KUI; // 车吃炮升级为軳
        }
    } else if (mColor === BLACK) {
        if (mType === "PAWN") {
            if (cType === "PAWN") return B_UPGRADE_CANNON; // 卒吃卒升级为升级炮
            if (cType === "HORSE") return B_UPGRADE_CAR;   // 卒吃马升级为升级车
            if (cType === "CANNON") return B_CHONG;        // 卒吃炮升级为铳
        } else if (mType === "HORSE" && cType === "CAR") {
            return B_HORSE_CAR; // 马吃车升级为车马
        } else if (mType === "CAR" && cType === "CANNON") {
            return B_KUI; // 车吃炮升级为軳
        }
    }
    // 不符合升级条件，返回原棋子
    return movingPiece;
}

// ==================== 移动生成 ====================
function getLegalMoves(currBoard, color) {
    let moves = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let piece = currBoard[r][c];
            if (getPieceColor(piece) !== color) continue;

            let type = PIECE_TYPES[piece];

            const tryAdd = (tr, tc) => {//尝试添加移动
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

            if (type === "KING") {//将和帅只能在九宫格内移动且每次只能移动一个格子
                [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                    let nr = r + dr, nc = c + dc;
                    if (isInsidePalace(nr, nc, color)) tryAdd(nr, nc);
                });
            } else if (type === "ADVISOR") {//士可以走斜方向但是只能在九宫格内移动
                [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
                    let nr = r + dr, nc = c + dc;
                    if (isInsidePalace(nr, nc, color)) tryAdd(nr, nc);
                });
            } else if (type === "ELEPHANT") {//相只能走田字方向且不能过河
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
                if (type === "HORSE" || type === "HORSE_CAR") {//马和车马能走日字
                    [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let legR = r + (Math.abs(dr) === 2 ? Math.sign(dr) : 0);
                        let legC = c + (Math.abs(dc) === 2 ? Math.sign(dc) : 0);
                        if (legR >= 0 && legR < ROWS && legC >= 0 && legC < COLS && currBoard[legR][legC] === EMPTY) {
                            tryAdd(nr, nc);
                        }
                    });
                }

                if (type === "CAR" || type === "HORSE_CAR") {//车和车马能走直线
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

                if (type === "CANNON") {//炮能跳过棋子
                    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let hasJump = false;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            let target = currBoard[nr][nc];
                            if (target === EMPTY) {
                                if (!hasJump) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                            } else {
                                if (!hasJump) {
                                    hasJump = true;
                                } else {
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

                if (type === "CHONG") {//铳能跳过棋子
                    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let jumpCount = 0;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            let target = currBoard[nr][nc];
                            if (target === EMPTY) {
                                if (jumpCount === 0) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                            } else {
                                if (jumpCount === 0) {
                                    jumpCount = 1;
                                } else if (jumpCount === 1) {
                                    if (getPieceColor(target) !== color) {
                                        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                                    }
                                    jumpCount = 2;
                                } else if (jumpCount === 2) {
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

                if (type === "KUI") {//軳能跳过棋子但是不能上下移动
                    [[0, 1], [0, -1]].forEach(([dr, dc]) => {
                        let nr = r + dr, nc = c + dc;
                        let hasJump = false;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            let target = currBoard[nr][nc];
                            if (target === EMPTY) {
                                if (!hasJump) moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                            } else {
                                if (!hasJump) {
                                    hasJump = true;
                                } else {
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

                if (type === "PAWN") {//兵卒能走直线
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
            }
        }
    }
    return moves;
}

/**
 * 执行移动，返回新的棋盘状态
 * @param {Array} currBoard - 当前棋盘状态
 * @param {Object} move - 移动信息
 * @returns {Array} 移动后的棋盘状态
 */
function makeMove(currBoard, move) {
    // 复制棋盘，避免修改原棋盘
    let newBoard = currBoard.map(row => [...row]);
    let f = move.from, t = move.to;
    let movingPiece = newBoard[f.r][f.c];
    let capturedPiece = newBoard[t.r][t.c];

    // 检查是否吃掉己方棋子，若是则升级
    if (capturedPiece !== EMPTY && getPieceColor(movingPiece) === getPieceColor(capturedPiece)) {
        newBoard[t.r][t.c] = upgradePiece(movingPiece, capturedPiece);
    } else {
        newBoard[t.r][t.c] = movingPiece;
    }
    // 原位置设为空
    newBoard[f.r][f.c] = EMPTY;
    return newBoard;
}

/**
 * 检查指定颜色是否被将军
 * @param {Array} currBoard - 当前棋盘状态
 * @param {number} color - 颜色
 * @returns {boolean} 是否被将军
 */
function isInCheck(currBoard, color) {
    let kingType = (color === RED) ? R_KING : B_KING;
    let kingPos = null;
    // 查找王的位置
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (currBoard[r][c] === kingType) { kingPos = { r, c }; break; }
        }
    }
    // 没有王，视为被将军
    if (!kingPos) return true;

    // 检查对方是否有棋子可以吃到王
    let oppColor = (color === RED) ? BLACK : RED;
    let moves = getLegalMoves(currBoard, oppColor);
    return moves.some(m => m.to.r === kingPos.r && m.to.c === kingPos.c);
}

/**
 * 检查将帅是否面对面
 * @param {Array} currBoard - 当前棋盘状态
 * @returns {boolean} 是否面对面
 */
function kingsFacing(currBoard) {
    let rK, bK;
    // 查找红帅和黑将的位置
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (currBoard[r][c] === R_KING) rK = { r, c };
            if (currBoard[r][c] === B_KING) bK = { r, c };
        }
    }
    // 没有找到帅或将，返回false
    if (!rK || !bK) return false;
    // 不在同一列，返回false
    if (rK.c !== bK.c) return false;
    // 检查中间是否有棋子
    for (let r = Math.min(rK.r, bK.r) + 1; r < Math.max(rK.r, bK.r); r++) {
        if (currBoard[r][rK.c] !== EMPTY) return false;
    }
    return true;
}

/**
 * 获取安全的走法（不会导致被将军）
 * @param {Array} currBoard - 当前棋盘状态
 * @param {number} color - 颜色
 * @returns {Array} 安全走法数组
 */
function getSafeMoves(currBoard, color) {
    let pseudoMoves = getLegalMoves(currBoard, color);
    let safeMoves = [];
    // 过滤掉会导致被将军或将帅对面的走法
    for (let m of pseudoMoves) {
        let nextBoard = makeMove(currBoard, m);
        if (!isInCheck(nextBoard, color) && !kingsFacing(nextBoard)) {
            safeMoves.push(m);
        }
    }
    return safeMoves;
}

// 移除 filterRepetitiveMoves，改为在evaluate里通过扣分控制
/**
 * 检查是否被将死
 * @param {Array} currBoard - 当前棋盘状态
 * @param {number} color - 颜色
 * @returns {boolean} 是否被将死
 */
function isCheckmate(currBoard, color) {
    // 首先检查是否被将军
    if (!isInCheck(currBoard, color)) return false;
    // 然后检查是否有安全走法
    let moves = getSafeMoves(currBoard, color);
    return moves.length === 0;
}

// ==================== AI 关键优化 ====================

/**
 * 检查是否为折返走法 (A->B 变成 B->A)
 * @param {Object} m1 - 第一个走法
 * @param {Object} m2 - 第二个走法
 * @returns {boolean} 是否为折返走法
 */
function isReverseMove(m1, m2) {
    if (!m1 || !m2) return false;
    return m1.from.r === m2.to.r && m1.from.c === m2.to.c &&
        m1.to.r === m2.from.r && m1.to.c === m2.from.c;
}

/**
 * 检查是否移动同一棋子
 * @param {Object} m1 - 第一个走法
 * @param {Object} m2 - 第二个走法
 * @returns {boolean} 是否移动同一棋子
 */
function isSamePieceMoved(m1, m2) {
    if (!m1 || !m2) return false;
    // m1 的终点应该是 m2 的起点（同一棋子）
    return m1.to.r === m2.from.r && m1.to.c === m2.from.c;
}

/**
 * 计算走法的重复惩罚分数
 * @param {Object} move - 当前走法
 * @param {Array} history - 历史走法
 * @param {boolean} isRedMove - 是否是红方走法
 * @returns {number} 惩罚分数
 */
function getRepetitionPenalty(move, history, isRedMove) {
    if (!history || history.length < 2) return 0;

    let penalty = 0;
    const len = history.length;

    // 获取己方最近一步（隔一步，因为上一步是对手的）
    const myLastMove = len >= 2 ? history[len - 2] : null;
    const mySecondLastMove = len >= 4 ? history[len - 4] : null;

    // 检测折返：当前走法是否是上次己方走法的反向
    if (isReverseMove(move, myLastMove)) {
        penalty += 50000; // 第一次折返就惩罚

        // 如果之前也在重复，指数级加重
        if (mySecondLastMove && isReverseMove(myLastMove, mySecondLastMove)) {
            penalty += 500000; // 第二次折返严重惩罚
        }
    }

    // 检测连续移动同一棋子（3次及以上）
    let samePieceCount = 0;
    let lastPos = move.from;
    for (let i = len - 2; i >= 0 && samePieceCount < 5; i -= 2) {
        const prevMove = history[i];
        if (prevMove && prevMove.to.r === lastPos.r && prevMove.to.c === lastPos.c) {
            samePieceCount++;
            lastPos = prevMove.from;
        } else {
            break;
        }
    }
    if (samePieceCount >= 2) {
        penalty += 30000 * samePieceCount; // 同一棋子移动过多次
    }

    return isRedMove ? penalty : -penalty;
}

/**
 * 评估走法的分数，用于排序
 * @param {Object} move - 走法
 * @param {Array} currBoard - 当前棋盘状态
 * @param {number} depth - 搜索深度
 * @returns {number} 走法分数
 */
function scoreMove(move, currBoard, depth) {
    let score = 0;
    const f = move.from;
    const t = move.to;
    const piece = currBoard[f.r][f.c];
    const target = currBoard[t.r][t.c];

    // 1. MVV-LVA (Most Valuable Victim - Least Valuable Aggressor) 最有价值的受害者 - 最没价值的攻击者
    if (target !== EMPTY) {
        let victimVal = PIECE_VALUES[target] || 0;
        let attackerVal = PIECE_VALUES[piece] || 0;
        score = 1000000 + victimVal * 10 - attackerVal;
    }
    else {
        // 2. 杀手启发 - 优先考虑之前导致剪枝的走法
        if (killerMoves[depth]) {
            if (isSameMove(move, killerMoves[depth][0])) score = 900000;
            else if (isSameMove(move, killerMoves[depth][1])) score = 800000;
        }

        // 3. 历史启发 - 优先考虑历史上表现好的走法
        if (score === 0) {
            let key = `${f.r},${f.c},${t.r},${t.c}`;
            score = historyMoves[key] || 0;
        }
    }

    // 4. 重复走法惩罚（降低排序优先级）
    let isRedMove = getPieceColor(piece) === RED;
    let repPenalty = getRepetitionPenalty(move, moveHistory, isRedMove);
    if (repPenalty !== 0) {
        // 降低分数，使重复走法排在后面
        score -= Math.abs(repPenalty) / 10;
    }

    return score;
}

/**
 * 检查两个走法是否相同
 * @param {Object} m1 - 第一个走法
 * @param {Object} m2 - 第二个走法
 * @returns {boolean} 是否相同
 */
function isSameMove(m1, m2) {
    if (!m1 || !m2) return false;
    return m1.from.r === m2.from.r && m1.from.c === m2.from.c &&
        m1.to.r === m2.to.r && m1.to.c === m2.to.c;
}

// ==================== AI 逻辑 ====================

/**
 * 评估函数：加入重复检测逻辑
 * @param {Array} currBoard - 当前棋盘状态
 * @param {number} depth - 搜索深度
 * @param {Array} searchStack - 搜索栈
 * @returns {number} 棋盘评估分数
 */
function evaluateBoard(currBoard, depth, searchStack) {
    let score = 0, rBonus = 0, bBonus = 0;

    // 基础棋子价值评估
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let p = currBoard[r][c];
            if (p === EMPTY) continue;

            let val = PIECE_VALUES[p] || 0;
            let pColor = getPieceColor(p);

            // 兵/卒过河和在九宫格内的额外价值
            if (p === R_PAWN || p === B_PAWN) {
                if ((p === R_PAWN && r >= 5) || (p === B_PAWN && r <= 4)) {
                    val += 50; // 过河加成
                    if (c >= 3 && c <= 5) val += 30; // 在九宫格内加成
                }
            }

            // 升级棋子的额外奖励
            if ([R_UPGRADE_CANNON, R_UPGRADE_CAR, R_HORSE_CAR, R_CHONG, R_KUI].includes(p)) rBonus += 800;
            if ([B_UPGRADE_CANNON, B_UPGRADE_CAR, B_HORSE_CAR, B_CHONG, B_KUI].includes(p)) bBonus += 800;

            // 累计分数（红方加分，黑方减分）
            if (pColor === RED) score += val;
            else score -= val;
        }
    }

    // 应用升级棋子的奖励
    score += (rBonus - bBonus);
    // 深度惩罚，鼓励更快结束游戏
    score -= depth * 10;

    // === 强化重复走子惩罚 (Anti-Stalemate Logic) ===
    if (searchStack && searchStack.length > 0) {
        let totalLen = moveHistory.length + searchStack.length;

        // 获取指定索引的走法（从历史记录或搜索栈中）
        const getMove = (idx) => {
            if (idx < moveHistory.length) return moveHistory[idx];
            return searchStack[idx - moveHistory.length];
        };

        // 只需要2步历史就开始检测折返
        if (totalLen >= 2) {
            let lastIdx = totalLen - 1;
            let m0 = getMove(lastIdx);     // 最近一步 (Current)
            let m2 = (lastIdx >= 2) ? getMove(lastIdx - 2) : null; // 上一步己方
            let m4 = (lastIdx >= 4) ? getMove(lastIdx - 4) : null; // 上上步己方
            let m6 = (lastIdx >= 6) ? getMove(lastIdx - 6) : null; // 上上上步己方

            // 检测折返
            if (m2 && isReverseMove(m0, m2)) {
                // 第一次折返就惩罚！
                let basePenalty = 100000;
                let repeatCount = 1;

                // 检查更早的重复
                if (m4 && isReverseMove(m2, m4)) {
                    repeatCount = 2;
                }
                if (m6 && repeatCount >= 2 && isReverseMove(m4, m6)) {
                    repeatCount = 3;
                }

                // 指数级惩罚
                let penalty = basePenalty * Math.pow(10, repeatCount - 1);

                // 确认是谁在走棋（根据搜索的奇偶性判断）
                // 栈中偶数深度是红方，奇数深度是黑方（假设红方先手）
                let isRedTurn = (searchStack.length % 2 === 1); // 刚push了一步
                if (moveHistory.length % 2 === 1) isRedTurn = !isRedTurn;

                if (isRedTurn) {
                    score -= penalty;
                } else {
                    score += penalty;
                }
            }

            // 检测同一棋子连续移动
            if (m2 && isSamePieceMoved(m2, m0)) {
                let pieceRepeat = 1;
                if (m4 && isSamePieceMoved(m4, m2)) {
                    pieceRepeat = 2;
                }
                if (m6 && pieceRepeat >= 2 && isSamePieceMoved(m6, m4)) {
                    pieceRepeat = 3;
                }

                if (pieceRepeat >= 2) {
                    let penalty = 50000 * pieceRepeat;
                    let isRedTurn = (searchStack.length % 2 === 1);
                    if (moveHistory.length % 2 === 1) isRedTurn = !isRedTurn;

                    if (isRedTurn) {
                        score -= penalty;
                    } else {
                        score += penalty;
                    }
                }
            }
        }
    }

    return score;
}

/**
 * Minimax算法带alpha-beta剪枝
 * @param {Array} currBoard - 当前棋盘状态
 * @param {number} depth - 搜索深度
 * @param {number} alpha - alpha值
 * @param {number} beta - beta值
 * @param {boolean} isMax - 是否是最大值玩家
 * @param {Array} stack - 搜索栈
 * @returns {Object} 最佳分数和走法
 */
function minimax(currBoard, depth, alpha, beta, isMax, stack = []) {
    nodesSearched++;
    let color = isMax ? RED : BLACK;
    // 到达搜索深度，返回评估分数
    if (depth === 0) {
        return { score: evaluateBoard(currBoard, depth, stack), move: null };
    }

    // 获取安全走法
    let moves = getSafeMoves(currBoard, color);

    // 没有走法
    if (moves.length === 0) {
        if (isInCheck(currBoard, color)) {
            // 被将死
            return { score: isMax ? -100000 : 100000, move: null };
        }
        // 和棋
        return { score: 0, move: null };
    }

    // 应用排序 (ScoreMove 已包含历史重复检测)
    moves.forEach(m => m.score = scoreMove(m, currBoard, depth));
    moves.sort((a, b) => b.score - a.score);

    let bestMove = moves[0];
    let bestVal = isMax ? -Infinity : Infinity;

    // 遍历所有走法
    for (let m of moves) {
        let nextBoard = makeMove(currBoard, m);

        // 递归搜索
        stack.push(m);
        let result = minimax(nextBoard, depth - 1, alpha, beta, !isMax, stack);
        stack.pop();

        let val = result.score;

        // 更新最佳值
        if (isMax) {
            if (val > bestVal) {
                bestVal = val;
                bestMove = m;
            }
            alpha = Math.max(alpha, bestVal);
        } else {
            if (val < bestVal) {
                bestVal = val;
                bestMove = m;
            }
            beta = Math.min(beta, bestVal);
        }

        // Alpha-beta剪枝
        if (beta <= alpha) {
            // 记录杀手走法
            if (currBoard[m.to.r][m.to.c] === EMPTY) {
                if (!killerMoves[depth]) killerMoves[depth] = [null, null];
                if (!isSameMove(killerMoves[depth][0], m)) {
                    killerMoves[depth][1] = killerMoves[depth][0];
                    killerMoves[depth][0] = m;
                }
                // 更新历史走法分数
                let key = `${m.from.r},${m.from.c},${m.to.r},${m.to.c}`;
                historyMoves[key] = (historyMoves[key] || 0) + depth * depth;
            }
            break;
        }
    }
    return { score: bestVal, move: bestMove };
}

/**
 * 寻找最佳走法
 * @param {number} color - 棋子颜色
 * @returns {Object} 最佳走法
 */
async function findBestMove(color) {
    clearLog();
    let name = color === RED ? "红方" : "黑方";
    log(`===========`, 'info');
    log(`${name} AI 思考中...`, 'info');
    let startTime = Date.now();
    nodesSearched = 0;

    // 重置杀手走法
    killerMoves = [];

    // 获取安全走法
    let moves = getSafeMoves(board, color);
    if (moves.length === 0) return null;

    // 根节点过滤：直接排除明显的折返走法（除非是唯一选择）
    let nonReverseMoves = moves.filter(m => {
        if (moveHistory.length < 2) return true;
        const myLastMove = moveHistory[moveHistory.length - 2];
        return !isReverseMove(m, myLastMove);
    });

    // 如果所有非折返走法都被排除，恢复使用全部走法
    if (nonReverseMoves.length > 0) {
        moves = nonReverseMoves;
    }

    // 根节点排序 (ScoreMove 已包含历史重复检测)
    moves.forEach(m => {
        m.score = scoreMove(m, board, SEARCH_DEPTH);
        // 在根节点直接应用重复惩罚
        let repPenalty = getRepetitionPenalty(m, moveHistory, color === RED);
        m.repetitionPenalty = repPenalty;
    });
    // 根据分数排序
    moves.sort((a, b) => b.score - a.score);

    let isMax = (color === RED);
    let bestMove = moves[0];
    let bestScore = isMax ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    let stack = [];

    // 遍历所有走法，找到最佳走法
    for (let i = 0; i < moves.length; i++) {
        let m = moves[i];
        let nextBoard = makeMove(board, m);

        // 每3步让出一次事件循环，避免UI卡顿
        if (i % 3 === 0) await new Promise(r => setTimeout(r, 0));

        // 递归搜索
        stack.push(m);
        let result = minimax(nextBoard, SEARCH_DEPTH - 1, alpha, beta, !isMax, stack);
        stack.pop();

        // 将重复惩罚直接应用到搜索结果中
        let score = result.score;
        if (m.repetitionPenalty !== 0) {
            score = isMax ? (score - Math.abs(m.repetitionPenalty)) : (score + Math.abs(m.repetitionPenalty));
        }

        let update = false;
        // 更新最佳走法和分数
        if (isMax) {
            if (score > bestScore) {
                bestScore = score; bestMove = m; update = true;
            }
            alpha = Math.max(alpha, bestScore);
        } else {
            if (score < bestScore) {
                bestScore = score; bestMove = m; update = true;
            }
            beta = Math.min(beta, bestScore);
        }

        // 记录走法信息
        if (update || i === 0) {
            let pName = PIECE_NAMES[board[m.from.r][m.from.c]];
            let repInfo = m.repetitionPenalty !== 0 ? ` [重复惩罚: ${m.repetitionPenalty}]` : '';
            log(`考虑: ${pName} (${m.from.r},${m.from.c})->(${m.to.r},${m.to.c}) | 分数: ${score}${repInfo} ${update ? '*' : ''}`);
        }

        // Alpha-beta剪枝
        if (beta <= alpha) break;
    }

    // 记录搜索信息
    let duration = Date.now() - startTime;
    log(`--- 思考结束 ---`);
    log(`耗时: ${duration}ms | 节点: ${nodesSearched}`);
    if (bestMove) {
        log(`最优解: ${PIECE_NAMES[board[bestMove.from.r][bestMove.from.c]]} 到 (${bestMove.to.r},${bestMove.to.c})`, 'highlight');
    }
    return bestMove;
}

// ==================== 联机功能 ====================
/**
 * 更新连接状态
 * @param {string} state - 连接状态
 * @param {string} text - 状态文本
 */
function updateConnectionStatus(state, text) {
    connectionState = state;
    const dot = document.getElementById('statusDot');
    const textEl = document.getElementById('connectionText');
    dot.className = 'status-dot ' + state;
    textEl.textContent = text;
}

/**
 * 生成房间号
 * @returns {string} 6位随机房间号
 */
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * 更新服务器地址
 */
function updateServerUrl() {
    const input = document.getElementById('serverUrlInput');
    const url = input.value.trim();
    if (url) {
        WS_SERVER_URL = url;
        log(`服务器地址已设置为: ${url}`, 'info');
    } else {
        WS_SERVER_URL = 'ws://localhost:9191';
        log('服务器地址已重置为默认: ws://localhost:9191', 'info');
    }
}

/**
 * 获取网络信息
 * @returns {string} 网络信息字符串
 */
function getNetworkInfo() {
    return `
局域网联机: ws://localhost:9191
    `.trim();
}

/**
 * 连接到 WebSocket 服务器
 * @param {Function} callback - 连接成功后的回调函数
 */
function connectToServer(callback) {
    // 如果已经连接，直接调用回调
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        callback();
        return;
    }

    try {
        // 创建新的WebSocket连接
        wsConnection = new WebSocket(WS_SERVER_URL);

        // 连接打开回调
        wsConnection.onopen = () => {
            log('已连接到服务器', 'info');
            reconnectAttempts = 0;
            callback();
        };

        // 接收消息回调
        wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (e) {
                console.error('解析消息失败:', e);
            }
        };

        // 连接关闭回调
        wsConnection.onclose = () => {
            log('与服务器断开连接', 'info');
            if (connectionState === 'connected' || connectionState === 'waiting') {
                updateConnectionStatus('disconnected', '连接已断开');
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    log(`尝试重连... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, 'info');
                    setTimeout(() => {
                        if (roomId && isHost) {
                            createRoom();
                        } else if (roomId) {
                            joinRoom();
                        }
                    }, 2000);
                } else {
                    handleDisconnect();
                }
            }
        };

        // 连接错误回调
        wsConnection.onerror = (error) => {
            log('服务器连接错误，请确保服务器已启动', 'highlight');
            console.error('WebSocket 错误:', error);
            updateConnectionStatus('disconnected', '连接失败');
        };

    } catch (e) {
        log('无法连接到服务器: ' + e.message, 'highlight');
        updateConnectionStatus('disconnected', '连接失败');
    }
}

/**
 * 发送消息到服务器
 * @param {Object} data - 要发送的数据
 */
function sendToServer(data) {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify(data));
    } else {
        log('未连接到服务器', 'highlight');
    }
}

/**
 * 处理服务器消息
 * @param {Object} data - 服务器发送的数据
 */
function handleServerMessage(data) {
    switch (data.type) {
        case 'room_created':
            // 房间创建成功
            roomId = data.roomId;
            myColor = data.color === 'red' ? RED : BLACK;
            isHost = true;
            updateConnectionStatus('waiting', '等待对手加入... 房间: ' + roomId);
            log(`房间已创建: ${roomId}，等待对手加入...`, 'info');
            updatePlayerIndicators();
            break;

        case 'join_accepted':
            // 加入房间成功
            roomId = data.roomId;
            myColor = data.color === 'red' ? RED : BLACK;
            isHost = false;
            updateConnectionStatus('connected', '已连接到房间!');
            log('已成功加入房间!', 'highlight');
            updatePlayerIndicators();
            restartGame();
            break;

        case 'opponent_joined':
            // 对手加入
            updateConnectionStatus('connected', '对手已连接!');
            log('对手已加入房间!', 'highlight');
            updatePlayerIndicators();
            restartGame();
            break;

        case 'game_start':
            // 游戏开始
            log(data.message, 'highlight');
            break;

        case 'move':
            // 接收对手走法
            receiveMove(data.move);
            break;

        case 'chat':
            // 接收聊天消息
            addChatMessage(data.message, false);
            break;

        case 'restart_request':
            // 对手请求重新开始
            log('对手请求重新开始', 'info');
            if (confirm('对手请求重新开始游戏，是否同意？')) {
                sendToServer({ type: 'restart_accept' });
                restartGame();
            }
            break;

        case 'restart_accepted':
            // 对手同意重新开始
            restartGame();
            break;

        case 'opponent_disconnected':
            // 对手断开连接
            handleOpponentDisconnect();
            log(data.message || '对手已断开连接', 'highlight');
            break;

        case 'error':
            // 错误消息
            log('错误: ' + data.message, 'highlight');
            alert(data.message);
            break;

        case 'pong':
            // 心跳响应
            break;
    }
}

/**
 * 创建房间
 */
function createRoom() {
    if (connectionState !== 'disconnected' && connectionState !== 'waiting') {
        alert('请先断开当前连接');
        return;
    }

    const inputRoomId = document.getElementById('roomIdInput').value.trim() || generateRoomId();
    document.getElementById('roomIdInput').value = inputRoomId;

    updateConnectionStatus('waiting', '正在连接服务器...');

    connectToServer(() => {
        sendToServer({
            type: 'create_room',
            roomId: inputRoomId
        });

        document.getElementById('btnDisconnect').style.display = 'inline-block';
        document.getElementById('chatPanel').style.display = 'block';
        setMode('online');
    });
}

/**
 * 加入房间
 */
function joinRoom() {
    if (connectionState !== 'disconnected') {
        alert('请先断开当前连接');
        return;
    }

    const inputRoomId = document.getElementById('roomIdInput').value.trim();
    if (!inputRoomId) {
        alert('请输入房间号');
        return;
    }

    updateConnectionStatus('waiting', '正在连接服务器...');

    connectToServer(() => {
        sendToServer({
            type: 'join_room',
            roomId: inputRoomId
        });

        document.getElementById('btnDisconnect').style.display = 'inline-block';
        document.getElementById('chatPanel').style.display = 'block';
        setMode('online');
    });
}

/**
 * 发送走法到服务器
 * @param {Object} move - 走法
 */
function sendMove(move) {
    if (connectionState === 'connected') {
        sendToServer({
            type: 'move',
            move: move
        });
    }
}

/**
 * 接收对手走法
 * @param {Object} move - 对手的走法
 */
function receiveMove(move) {
    if (gameOver) return;
    let expectedColor = currentTurn;
    if (expectedColor === myColor) {
        log('收到无效移动：不是对方回合', 'highlight');
        return;
    }
    board = makeMove(board, move);
    lastMove = move;
    moveHistory.push(move);

    let oppColor = currentTurn === RED ? BLACK : RED;
    if (isInCheck(board, oppColor)) updateStatus("将军！"); else updateStatus("");

    if (isCheckmate(board, oppColor)) {
        gameOver = true;
        showModal(currentTurn === RED ? "红方胜利！" : "黑方胜利！");
        renderPieces();
        return;
    }

    currentTurn = oppColor;
    renderPieces();
    updateStatus(currentTurn === myColor ? "轮到你走棋" : "等待对手...");
}

function handleOpponentDisconnect() {
    updateConnectionStatus('disconnected', '对手已断开连接');
    gameOver = true;
    showModal('对手已断开连接');
}

function handleDisconnect() {
    updateConnectionStatus('disconnected', '未连接');
    roomId = null;
    isHost = false;
    myColor = null;
    document.getElementById('btnDisconnect').style.display = 'none';
    document.getElementById('chatPanel').style.display = 'none';
}

function disconnect() {
    if (wsConnection) {
        sendToServer({ type: 'leave_room' });
        wsConnection.close();
        wsConnection = null;
    }
    handleDisconnect();
    document.getElementById('roomIdInput').value = '';
    log('已断开连接', 'info');
}

function sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    if (connectionState === 'connected') {
        sendToServer({
            type: 'chat',
            message: msg
        });
    }
    addChatMessage(msg, true);
    input.value = '';
}

function addChatMessage(msg, isMe) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.style.marginBottom = '4px';
    div.innerHTML = `<span style="color: ${isMe ? '#2c2c2c' : '#c0392b'}; font-weight: bold;">${isMe ? '我' : '对手'}:</span> ${msg}`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function updatePlayerIndicators() {
    const topEl = document.getElementById('topPlayerIndicator');
    const bottomEl = document.getElementById('bottomPlayerIndicator');

    if (gameMode === 'online') {
        if (myColor === RED) {
            bottomEl.textContent = '红方 (你)';
            topEl.textContent = connectionState === 'connected' ? '黑方 (对手)' : '黑方 (等待中...)';
        } else if (myColor === BLACK) {
            topEl.textContent = '黑方 (你)';
            bottomEl.textContent = connectionState === 'connected' ? '红方 (对手)' : '红方 (房主)';
        }
    } else if (gameMode === 'player_vs_ai') {
        bottomEl.textContent = '红方 (你)';
        topEl.textContent = '黑方 (AI)';
    } else {
        bottomEl.textContent = '红方 (AI)';
        topEl.textContent = '黑方 (AI)';
    }
}

// ==================== UI 渲染 ====================
function drawBoardLines() {
    const boardEl = document.getElementById('board');
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

function drawDiagonal(c1, r1, c2, r2) {
    const boardEl = document.getElementById('board');
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

function renderPieces() {
    const container = document.getElementById('piecesLayer');
    container.innerHTML = '';

    if (lastMove) {
        let fDiv = document.createElement('div');
        fDiv.className = 'move-trace trace-from';
        fDiv.style.left = (lastMove.from.c * CELL_SIZE + CELL_SIZE / 2) + 'px';
        fDiv.style.top = (lastMove.from.r * CELL_SIZE + CELL_SIZE / 2) + 'px';
        container.appendChild(fDiv);

        let tDiv = document.createElement('div');
        tDiv.className = 'move-trace trace-to';
        tDiv.style.left = (lastMove.to.c * CELL_SIZE + CELL_SIZE / 2) + 'px';
        tDiv.style.top = (lastMove.to.r * CELL_SIZE + CELL_SIZE / 2) + 'px';
        container.appendChild(tDiv);
    }

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let p = board[r][c];
            if (p !== EMPTY) {
                let div = document.createElement('div');
                div.className = `piece ${getPieceColor(p) === RED ? 'red' : 'black'}`;
                if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
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
}

function onPieceClick(r, c, e) {
    e.stopPropagation();
    if (gameOver) return;
    if (gameMode === 'online') {
        if (connectionState !== 'connected') return;
        if (currentTurn !== myColor) return;
    } else if (gameMode === 'player_vs_ai' && currentTurn !== RED) {
        return;
    } else if (gameMode === 'ai_vs_ai') {
        return;
    }

    let p = board[r][c];
    let pColor = getPieceColor(p);

    if (pColor === currentTurn) {
        if (selectedPiece) {
            let moves = getSafeMoves(board, currentTurn);
            // moves = filterRepetitiveMoves(board, moves, moveHistory); 
            let valid = moves.find(m => m.from.r === selectedPiece.r && m.from.c === selectedPiece.c && m.to.r === r && m.to.c === c);
            if (valid) {
                doMove(valid);
                return;
            }
        }
        selectedPiece = { r, c };
        renderPieces();
    } else {
        if (selectedPiece) {
            tryMove(selectedPiece, { r, c });
        }
    }
}

function onEmptyClick(r, c) {
    if (gameOver) return;
    if (gameMode === 'online') {
        if (connectionState !== 'connected') return;
        if (currentTurn !== myColor) return;
    } else if (gameMode === 'player_vs_ai' && currentTurn !== RED) {
        return;
    }
    if (selectedPiece) {
        tryMove(selectedPiece, { r, c });
    }
}

function tryMove(from, to) {
    let moves = getSafeMoves(board, currentTurn);
    // moves = filterRepetitiveMoves(board, moves, moveHistory);
    let valid = moves.find(m => m.from.r === from.r && m.from.c === from.c && m.to.r === to.r && m.to.c === to.c);

    if (valid) {
        doMove(valid);
    } else {
        selectedPiece = null;
        renderPieces();
    }
}

function doMove(move) {
    board = makeMove(board, move);
    lastMove = move;
    selectedPiece = null;
    moveHistory.push(move);

    // 移除 hash 检测

    let oppColor = currentTurn === RED ? BLACK : RED;
    if (isInCheck(board, oppColor)) updateStatus("将军！"); else updateStatus("");

    if (isCheckmate(board, oppColor)) {
        gameOver = true;
        showModal(currentTurn === RED ? "红方胜利！" : "黑方胜利！");
        renderPieces();
        return;
    }

    if (gameMode === 'online') sendMove(move);
    currentTurn = oppColor;
    renderPieces();
    if (!gameOver) scheduleNextMove();
}

function scheduleNextMove() {
    clearTimeout(aiTimer);
    if (gameMode === 'online') {
        updateStatus(currentTurn === myColor ? "轮到你走棋" : "等待对手...");
    } else if (gameMode === 'ai_vs_ai') {
        updateStatus(currentTurn === RED ? "红方思考中..." : "黑方思考中...");
        aiTimer = setTimeout(async () => {
            let move = await findBestMove(currentTurn);
            if (move) doMove(move);
            else {
                gameOver = true;
                showModal((currentTurn === RED ? "黑方" : "红方") + "胜利 (无子可走)");
            }
        }, 100);
    } else if (gameMode === 'player_vs_ai') {
        if (currentTurn === BLACK) {
            updateStatus("AI思考中...");
            aiTimer = setTimeout(async () => {
                let move = await findBestMove(BLACK);
                if (move) doMove(move);
                else {
                    gameOver = true;
                    showModal("红方胜利 (AI无子可走)");
                }
            }, 100);
        } else {
            updateStatus("请红方走棋");
        }
    }
}

function setMode(mode) {
    if (mode === gameMode) return;
    if (mode !== 'online' && connectionState !== 'disconnected') {
        if (!confirm('切换模式将断开联机连接，确定吗？')) return;
        disconnect();
    }
    gameMode = mode;
    updateModeButtons();
    updatePlayerIndicators();
    if (mode !== 'online') restartGame();
}

function updateModeButtons() {
    document.getElementById('btnOnline').className = gameMode === 'online' ? 'btn active' : 'btn';
    document.getElementById('btnAiVsAi').className = gameMode === 'ai_vs_ai' ? 'btn active' : 'btn';
    document.getElementById('btnPlayerVsAi').className = gameMode === 'player_vs_ai' ? 'btn active' : 'btn';
}

function restartGame() {
    clearTimeout(aiTimer);
    board = initBoard();
    currentTurn = RED;
    gameOver = false;
    lastMove = null;
    selectedPiece = null;
    checkCount = 0;
    moveHistory = [];
    positionHistory = {};
    updateModeButtons();
    updatePlayerIndicators();
    renderPieces();
    if (gameMode === 'online' && connectionState === 'connected') {
        updateStatus(myColor === RED ? "轮到你走棋" : "等待对手...");
    } else {
        scheduleNextMove();
    }
}

function updateStatus(msg) {
    document.getElementById('statusText').innerText = msg || "游戏中";
}

function showModal(msg) {
    document.getElementById('modalMessage').innerText = msg;
    document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

// ==================== 初始化 ====================
drawBoardLines();
restartGame();
