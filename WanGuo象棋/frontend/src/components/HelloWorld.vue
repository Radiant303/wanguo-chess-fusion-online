<template>
  <div class="chessboard" :style="{ '--cell-size': cellSize + 'px' }">
    <!-- 棋盘底层背景与网格 SVG -->
    <svg class="board-svg" :width="cellSize * 9" :height="cellSize * 10" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- 背景 -->
      <rect width="100%" height="100%" fill="rgba(255, 255, 255, 0.1)" rx="8" />

      <!-- 边框 -->
      <rect :x="cellSize * 0.5 - 2" :y="cellSize * 0.5 - 2" :width="cellSize * 8 + 4" :height="cellSize * 9 + 4"
        fill="none" stroke="rgba(0,0,0,1)" stroke-width="0" />

      <!-- 横线 (10条) -->
      <line v-for="i in 10" :key="'h-' + i" :x1="cellSize * 0.5" :y1="cellSize * (i - 0.5)" :x2="cellSize * 8.5"
        :y2="cellSize * (i - 0.5)" stroke="rgba(0,0,0,1)" stroke-width="0.5" />

      <!-- 竖线 (上半部分 5条) -->
      <line v-for="i in 7" :key="'v-top-' + i" :x1="cellSize * (i + 0.5)" :y1="cellSize * 0.5"
        :x2="cellSize * (i + 0.5)" :y2="cellSize * 4.5" stroke="rgba(0,0,0,1)" stroke-width="0.5" />

      <!-- 竖线 (下半部分 5条) -->
      <line v-for="i in 7" :key="'v-bottom-' + i" :x1="cellSize * (i + 0.5)" :y1="cellSize * 5.5"
        :x2="cellSize * (i + 0.5)" :y2="cellSize * 9.5" stroke="rgba(0,0,0,1)" stroke-width="0.5" />

      <!-- 左右两侧贯通的竖线 -->
      <line :x1="cellSize * 0.5" :y1="cellSize * 0.5" :x2="cellSize * 0.5" :y2="cellSize * 9.5" stroke="rgba(0,0,0,1)"
        stroke-width="0.5" />
      <line :x1="cellSize * 8.5" :y1="cellSize * 0.5" :x2="cellSize * 8.5" :y2="cellSize * 9.5" stroke="rgba(0,0,0,1)"
        stroke-width="0.5" />

      <!-- 九宫格斜线 (红方) -->
      <line :x1="cellSize * 3.5" :y1="cellSize * 0.5" :x2="cellSize * 5.5" :y2="cellSize * 2.5" stroke="rgba(0,0,0,1)"
        stroke-width="0.5" />
      <line :x1="cellSize * 5.5" :y1="cellSize * 0.5" :x2="cellSize * 3.5" :y2="cellSize * 2.5" stroke="rgba(0,0,0,1)"
        stroke-width="0.5" />

      <!-- 九宫格斜线 (黑方) -->
      <line :x1="cellSize * 3.5" :y1="cellSize * 7.5" :x2="cellSize * 5.5" :y2="cellSize * 9.5" stroke="rgba(0,0,0,1)"
        stroke-width="0.5" />
      <line :x1="cellSize * 5.5" :y1="cellSize * 7.5" :x2="cellSize * 3.5" :y2="cellSize * 9.5" stroke="rgba(0,0,0,1)"
        stroke-width="0.5" />

      <!-- 楚河汉界 文字 -->
      <text :x="cellSize * 2.5" :y="cellSize * 5 + 6" fill="rgba(0,0,0,0.3)" font-size="24" font-family="KaiTi"
        text-anchor="middle" dominant-baseline="middle" style="pointer-events: none;">楚 河</text>
      <text :x="cellSize * 6.5" :y="cellSize * 5 + 6" fill="rgba(0,0,0,0.3)" font-size="24" font-family="KaiTi"
        text-anchor="middle" dominant-baseline="middle" style="pointer-events: none;">汉 界</text>

      <!-- 炮和兵的特殊标记 (可选，这里只做简单的示例，可以添加十字标记) -->
    </svg>

    <!-- 棋盘网格 (Interactive Layer) -->
    <div v-for="y in 10" :key="'row-' + y" class="row">
      <div v-for="x in 9" :key="'cell-' + x + '-' + y" class="cell" @click="checkCamp(x - 1, y - 1)">
        <!-- 显示棋盘中的棋子 -->
        <div v-if="board[y - 1] && board[y - 1]![x - 1]" :class="['chess-piece',
          board[y - 1]![x - 1]!.isRed ? 'piece-red' : 'piece-black',
          possibleMoves.some(p => p.x === x - 1 && p.y === y - 1) ? 'targetable' : '',
          movePath.some(p => p.to.x === x - 1 && p.to.y === y - 1) ? 'last-move' : '']"
          :style="{ animationDelay: '-' + ((x + y * 9) % 10) + 's' }">
          <span :style="{ animationDelay: '-' + ((x + y * 13) % 10) + 's' }">{{ board[y - 1]![x - 1]!.name }}</span>
        </div>

        <!-- 起点标记：显示上一步的起始位置 -->
        <div v-if="movePath.some(p => p.from.x === x - 1 && p.from.y === y - 1)" class="start-marker"></div>

        <!-- 显示可落点位置（仅空格子显示绿点） -->
        <div v-if="possibleMoves.some(p => p.x === x - 1 && p.y === y - 1) && !(board[y - 1] && board[y - 1]![x - 1])"
          class="possible-move"></div>
      </div>
    </div>

    <!-- 路径图层：保留结构备用 -->
    <svg class="trajectory-overlay"></svg>
    <!-- 爆炸粒子容器 -->
    <div ref="explosionContainer" class="explosion-container"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import eatMusic from '../assets/audio/eat.mp3';
import fusionMusic from '../assets/audio/fusion.mp3';
import moveMusic from '../assets/audio/move.mp3';
// 坐标类型（移动规则中的x/y）
interface ChessPosition {
  x: number;
  y: number;
}
// 棋子移动规则类型
interface ChessRule {
  allowed: ChessPosition[];//允许移动的位置
  aparted: number;//允许间隔吃子，-1表示不允许，0表示允许任意间隔吃子，正数表示允许间隔N个子吃子
  isBlocked: boolean;//是否阻挡
  allowedRange: ChessPosition[];//允许活动的范围
  isOverRiver: boolean;//是否过河
  addAllowed: ChessPosition[];//过河后增加的允许移动的位置
}

// 单个棋子类型
interface ChessPiece {
  name: string;
  x: number;
  y: number;
  isRed: boolean;
  rules: ChessRule;
}

//棋盘中棋子模型
interface ChessPieceInBoard {
  name: string;
  x: number;
  y: number;
  isRed: boolean;
}
//棋子运动轨迹
interface MovePath {
  from: ChessPosition;
  to: ChessPosition;
}
// 棋子集合类型（键是棋子标识，如 car、horse 等）
interface ChessCollection {
  [key: string]: ChessPiece;
}

interface FusionCollection {
  [key: string]: string[];
}
//缓存选中的棋子
let selectedKey: string | null = null
//棋子运动轨迹

export default defineComponent({
  data() {
    return {
      // 棋盘基础尺寸配置
      cellSize: 50,

      //当前阵营
      currentCamp: true,//true表示红方，false表示黑方
      //轮到走棋的阵营
      runCamp: true,//true表示红方，false表示黑方
      board: [] as (ChessPieceInBoard | null)[][],//棋盘
      possibleMoves: [] as { x: number, y: number }[],//可落点位置
      movePath: [] as MovePath[], // 棋子运动轨迹
      //棋子集合
      qiZiArray: {
        car: {
          name: '车',
          x: 0,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        horse1: {
          name: '马',
          x: 1,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 1, y: 2 },//右上
              { x: 1, y: -2 },//右下
              { x: -1, y: 2 },//左上
              { x: -1, y: -2 },//左下
              { x: 2, y: 1 },//上右
              { x: 2, y: -1 },//下右
              { x: -2, y: 1 },//上左
              { x: -2, y: -1 }//下左
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        xiang1: {
          name: '相',
          x: 2,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 2, y: 2 },
              { x: -2, y: 2 },
              { x: 2, y: -2 },
              { x: -2, y: -2 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 4 }, { x: 8, y: 4 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        shi1: {
          name: '士',
          x: 3,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 1, y: 1 },
              { x: -1, y: 1 },
              { x: 1, y: -1 },
              { x: -1, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 3, y: 0 }, { x: 3, y: 2 }, { x: 5, y: 0 }, { x: 5, y: 2 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        shuai: {
          name: '帅',
          x: 4,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 1, y: 0 },
              { x: -1, y: 0 },
              { x: 0, y: 1 },
              { x: 0, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 3, y: 0 }, { x: 3, y: 2 }, { x: 5, y: 0 }, { x: 5, y: 2 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        shi2: {
          name: '士',
          x: 5,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 1, y: 1 },
              { x: -1, y: 1 },
              { x: 1, y: -1 },
              { x: -1, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 3, y: 0 }, { x: 3, y: 2 }, { x: 5, y: 0 }, { x: 5, y: 2 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        xiang2: {
          name: '相',
          x: 6,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 2, y: 2 },
              { x: -2, y: 2 },
              { x: 2, y: -2 },
              { x: -2, y: -2 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 4 }, { x: 8, y: 4 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        horse2: {
          name: '马',
          x: 7,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 1, y: 2 },
              { x: 1, y: -2 },
              { x: -1, y: 2 },
              { x: -1, y: -2 },
              { x: 2, y: 1 },
              { x: 2, y: -1 },
              { x: -2, y: 1 },
              { x: -2, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        car2: {
          name: '车',
          x: 8,
          y: 0,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        pao1: {
          name: '炮',
          x: 1,
          y: 2,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: 1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        pao2: {
          name: '炮',
          x: 7,
          y: 2,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: 1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        bing1: {
          name: "兵",
          x: 0,
          y: 3,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        bing2: {
          name: "兵",
          x: 2,
          y: 3,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        bing3: {
          name: "兵",
          x: 4,
          y: 3,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        bing4: {
          name: "兵",
          x: 6,
          y: 3,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        bing5: {
          name: "兵",
          x: 8,
          y: 3,
          isRed: true,
          rules: {
            allowed: [
              { x: 0, y: 1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        zu1: {
          name: "卒",
          x: 0,
          y: 6,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        zu2: {
          name: "卒",
          x: 2,
          y: 6,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        zu3: {
          name: "卒",
          x: 4,
          y: 6,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        zu4: {
          name: "卒",
          x: 6,
          y: 6,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        zu5: {
          name: "卒",
          x: 8,
          y: 6,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [{ x: 1, y: 0 }, { x: -1, y: 0 }],
            isOverRiver: false
          }
        },
        carb1: {
          name: "车",
          x: 0,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        carb2: {
          name: "车",
          x: 8,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        horseb1: {
          name: "马",
          x: 1,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 1, y: 2 },
              { x: 1, y: -2 },
              { x: -1, y: 2 },
              { x: -1, y: -2 },
              { x: 2, y: 1 },
              { x: 2, y: -1 },
              { x: -2, y: 1 },
              { x: -2, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        horseb2: {
          name: "马",
          x: 7,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 1, y: 2 },
              { x: 1, y: -2 },
              { x: -1, y: 2 },
              { x: -1, y: -2 },
              { x: 2, y: 1 },
              { x: 2, y: -1 },
              { x: -2, y: 1 },
              { x: -2, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        xiangb1: {
          name: "相",
          x: 2,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 2, y: 2 },
              { x: -2, y: 2 },
              { x: 2, y: -2 },
              { x: -2, y: -2 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 5 }, { x: 8, y: 5 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        xiangb2: {
          name: "相",
          x: 6,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 2, y: 2 },
              { x: -2, y: 2 },
              { x: 2, y: -2 },
              { x: -2, y: -2 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 0, y: 5 }, { x: 8, y: 5 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        shib1: {
          name: "士",
          x: 3,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 1, y: 1 },
              { x: -1, y: 1 },
              { x: 1, y: -1 },
              { x: -1, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 3, y: 9 }, { x: 3, y: 7 }, { x: 5, y: 9 }, { x: 5, y: 7 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        shib2: {
          name: "士",
          x: 5,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 1, y: 1 },
              { x: -1, y: 1 },
              { x: 1, y: -1 },
              { x: -1, y: -1 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 3, y: 9 }, { x: 3, y: 7 }, { x: 5, y: 9 }, { x: 5, y: 7 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        jiang: {
          name: "将",
          x: 4,
          y: 9,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: 1 },
              { x: 1, y: 0 },
              { x: 0, y: -1 },
              { x: -1, y: 0 }
            ],
            isBlocked: true,
            aparted: -1,
            allowedRange: [{ x: 3, y: 9 }, { x: 3, y: 7 }, { x: 5, y: 9 }, { x: 5, y: 7 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        paob1: {
          name: "炮",
          x: 1,
          y: 7,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: 1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        },
        paob2: {
          name: "炮",
          x: 7,
          y: 7,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: 1,
            allowedRange: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 9 }, { x: 8, y: 9 }],
            addAllowed: [],
            isOverRiver: false
          }
        }



      } as ChessCollection,
      //融合规则
      fusionArray: {
        "车": ['炮', '马']
      } as FusionCollection
    };
  },
  methods: {
    // 获取棋子在SVG画布上的坐标（中心点）
    getPieceCanvasPos(pos: ChessPosition) {
      return {
        x: pos.x * this.cellSize + this.cellSize / 2,
        y: pos.y * this.cellSize + this.cellSize / 2
      }
    },
    //阵营检测
    checkCamp(x: number, y: number) {
      if (this.currentCamp == this.runCamp) {
        this.handleCellClick(x, y);
      } else {
        return
      }
    },
    //切换阵营
    switchCamp() {
      this.currentCamp = !this.currentCamp
      this.runCamp = !this.runCamp
    },
    //触发爆炸动画
    triggerExplosion(droplets: HTMLElement[]) {
      requestAnimationFrame(() => {
        droplets.forEach(drop => {
          const dx = parseFloat(drop.dataset.dx || '0')
          const dy = parseFloat(drop.dataset.dy || '0')
          drop.style.transform = `translate(${dx}px, ${dy}px) scale(0)`
          drop.style.opacity = '0'
        })
      })
      // 动画结束后移除粒子
      setTimeout(() => {
        droplets.forEach(drop => drop.remove())
      }, 1500)
    },
    //执行爆炸效果
    performExplosion(pieceX: number, pieceY: number, isRed: boolean) {
      const container = this.$refs.explosionContainer as HTMLElement
      if (!container) return

      // 颜色设置
      let baseColor: string, glowColor: string
      if (isRed) {
        baseColor = '#ff3d00'
        glowColor = '#b71c1c'
      } else {
        baseColor = '#212121'
        glowColor = '#000000'
      }

      // 计算爆炸中心位置 (格子大小50px, 中心偏移25px)
      const cx = pieceX * 50 + 25
      const cy = pieceY * 50 + 25

      const droplets: HTMLElement[] = []
      const count = 16 + Math.random() * 8

      for (let i = 0; i < count; i++) {
        const drop = document.createElement('div')

        // 粒子大小
        const size = 3 + Math.random() * 9

        // 应用所有样式内联（因为scoped CSS不适用于动态创建的元素）
        Object.assign(drop.style, {
          position: 'absolute',
          borderRadius: '54% 46% 42% 58% / 50% 45% 55% 50%',
          pointerEvents: 'none',
          zIndex: '150',
          transformOrigin: 'center center',
          opacity: '1',
          transition: 'transform 1.2s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.2s ease-in 1.0s',
          boxShadow: `inset 2px 2px 4px rgba(255, 255, 255, 0.6), inset -2px -2px 4px rgba(0, 0, 0, 0.2), inset 0 0 6px ${glowColor}, 2px 2px 4px rgba(0, 0, 0, 0.15)`,
          backgroundColor: baseColor,
          width: size + 'px',
          height: size + 'px',
          left: (cx - size / 2) + 'px',
          top: (cy - size / 2) + 'px'
        })

        // 随机爆炸方向
        const angle = Math.random() * Math.PI * 2
        const dist = 50 + Math.random() * 70
        drop.dataset.dx = String(Math.cos(angle) * dist)
        drop.dataset.dy = String(Math.sin(angle) * dist)

        droplets.push(drop)
        container.appendChild(drop)
      }

      this.triggerExplosion(droplets)
    },
    // 播放音效
    playAudio(name: string) {
      const audio = new Audio(name)
      audio.play()
    },
    //处理点击事件
    handleCellClick(x: number, y: number) {
      const key = this.checkQiZiClick(x, y)
      //已有选中棋子且点击的是己方棋子且不可融合
      if (key && selectedKey && this.qiZiArray[key]!.isRed == this.currentCamp) {
        const fusion = this.canFusion(selectedKey, key)
        if (fusion === 3) {
          selectedKey = key
          const selectedQiZi = this.qiZiArray[key] as ChessPiece
          this.possibleMoves = this.checkMove(selectedQiZi)
        } else if (selectedKey && this.objectArrayIncludes(this.possibleMoves, { x, y })) {
          const selectedQiZi = this.qiZiArray[selectedKey] as ChessPiece
          this.moveQiZi(x, y, selectedQiZi)
          selectedKey = null
          this.possibleMoves = []
          //切换阵营
          this.switchCamp()
          return
        }
      }

      // 已有选中棋子，且点击的是“可落点”（包括敌方棋子）
      else if (selectedKey && this.objectArrayIncludes(this.possibleMoves, { x, y })) {
        const selectedQiZi = this.qiZiArray[selectedKey] as ChessPiece
        this.moveQiZi(x, y, selectedQiZi)
        selectedKey = null
        this.possibleMoves = []
        //切换阵营
        this.switchCamp()
        return
      }
      // 已有选中棋子，且点击的是“不可落点”（包括敌方棋子）
      else if (selectedKey && !this.objectArrayIncludes(this.possibleMoves, { x, y })) {
        selectedKey = null
        this.possibleMoves = []
        return
      }
      // 没有选中棋子，且点击的是棋子
      else if (key) {
        //检测所选棋子是否是当前阵营
        if (this.qiZiArray[key]!.isRed !== this.runCamp) {
          return
        }
        selectedKey = key
        const selectedQiZi = this.qiZiArray[key] as ChessPiece
        this.possibleMoves = this.checkMove(selectedQiZi)
      }
    },
    //检查是点击棋子还是点击空白位置,返回被点击的棋子
    checkQiZiClick(x: number, y: number): string | null {
      for (const key of Object.keys(this.qiZiArray)) {
        const p = this.qiZiArray[key]
        if (p!.x === x && p!.y === y) {
          return key
        }
      }
      return null
    },
    //移动棋子
    moveQiZi(x: number, y: number, chess: ChessPiece) {
      if (!this.objectArrayIncludes(this.possibleMoves, { x, y })) return

      // 记录起始位置
      const fromPos = { x: chess.x, y: chess.y }

      const result = this.resolveMove(x, y, chess)

      if (result === 'move' || result === 'eat') {
        chess.x = x
        chess.y = y
      }
      //过河检测
      if (this.checkOverRiver(chess, { x, y })) {
        chess.rules.isOverRiver = true
      } else {
        chess.rules.isOverRiver = false
      }

      //记录运动轨迹
      this.movePath = [{ from: fromPos, to: { x, y } }]
      this.playAudio(moveMusic);
      this.updateBoard()

      // 将军检测：每次移动后检测对方是否被将军
      const checkResult = this.checkIsInCheck(chess, { x, y })
      if (checkResult.isCheck) {
        console.log(`🚨 ${checkResult.message}`)
        if (checkResult.isCheckmate) {
          // 将死，游戏结束
          alert(checkResult.message)
        }
      }

      //绝杀检测:每次移动后检测对方是否还有子可以移动
      const checkResult2 = this.checkIsInCheckmate(chess, { x, y })
      if (checkResult2) {
        console.log(`🚨 ${chess.isRed ? '红方' : '黑方'}绝杀`)
        alert(chess.isRed ? '红方绝杀' : '黑方绝杀')
      }
    },
    //解析走子
    resolveMove(x: number, y: number, chess: ChessPiece) {
      const targetKey = this.findPieceKeyAt(x, y)
      const chessKey = this.findPieceKeyAt(chess.x, chess.y)!

      if (!targetKey) {
        return 'move'
      }

      const fusion = this.canFusion(chessKey, targetKey)

      if (fusion === 2) {
        this.doFusion(chessKey, targetKey)
        return 'fusion'
      }

      if (fusion === 3) {
        return 'blocked'
      }

      // 吃子
      console.log(`😋${chess.isRed ? '红' : '黑'}${chess.name}${chess.x},${chess.y}  吃掉了  ${this.qiZiArray[targetKey]!.isRed ? '红' : '黑'}${this.qiZiArray[targetKey]!.name}${this.qiZiArray[targetKey]!.x},${this.qiZiArray[targetKey]!.y}`)
      // 触发爆炸效果
      const targetPiece = this.qiZiArray[targetKey]!
      this.performExplosion(targetPiece.x, targetPiece.y, targetPiece.isRed)
      this.playAudio(eatMusic);
      delete this.qiZiArray[targetKey]
      return 'eat'
    },
    doFusion(chessKey: string, targetKey: string) {
      const chess = this.qiZiArray[chessKey] as ChessPiece
      const target = this.qiZiArray[targetKey] as ChessPiece

      for (const [resultName, needs] of Object.entries(this.fusionArray)) {
        if (needs[0] === chess.name && needs[1] === target.name) {
          delete this.qiZiArray[chessKey]
          delete this.qiZiArray[targetKey]
          const protoKey = this.findPieceKeyByName(resultName) as string
          const proto = this.qiZiArray[protoKey] as ChessPiece
          this.qiZiArray[protoKey + '_' + Date.now()] = {
            name: proto.name,
            x: target.x,
            y: target.y,
            isRed: chess.isRed,
            rules: {
              allowed: proto.rules.allowed,
              isBlocked: proto.rules.isBlocked,
              aparted: proto.rules.aparted,
              allowedRange: proto.rules.allowedRange,
              addAllowed: proto.rules.addAllowed,
              isOverRiver: target.rules.isOverRiver
            }
          }
          this.playAudio(fusionMusic);
          console.log('融合成功', resultName)
          return
        }
      }
    },
    //是否能够融合
    canFusion(chessKey: string, targetKey: string) {
      const chess = this.qiZiArray[chessKey]
      const target = this.qiZiArray[targetKey]

      if (!chess || !target) return 0

      // 同阵营
      if (chess.isRed !== target.isRed) return 0

      for (const needs of Object.values(this.fusionArray)) {
        if (needs[0] === chess.name && needs[1] === target.name) {
          return 2
        }
      }

      return 3
    },
    //判断是否能够吃子
    canEatLike(chess: ChessPiece, targetPos: ChessPosition): boolean {
      const path = this.getPath(
        chess.x,
        chess.y,
        targetPos.x,
        targetPos.y,
        chess.rules.isBlocked
      )

      const blockCount = path.filter(p => this.findPieceKeyAt(p.x, p.y)).length

      // 不允许隔子吃
      if (chess.rules.aparted === -1) {
        return blockCount === 0
      }

      // 炮 / 特殊棋
      return blockCount === chess.rules.aparted
    },
    //返回棋子可落点位置
    checkMove(chess: ChessPiece) {
      let moves = this.generateMoves(chess)
      moves = this.filterOutOfBoard(moves)//过滤出棋盘内的位置
      moves = this.filterEatRule(chess, moves)//过滤吃子规则
      moves = this.filterOutOfRange(chess, moves)//过滤掉不在活动范围内的路径

      // 过滤掉会让己方处于被将军状态的移动（不能送将或应将后仍被将）
      moves = this.filterMovesInCheck(chess, moves)

      console.log(
        chess.name,
        '当前位置', chess.x, chess.y,
        '可走点', moves
      )

      return moves
    },

    /**
     * 过滤掉会让己方处于被将军状态的移动
     * 1. 如果当前被将军，必须选择能解除将军的移动
     * 2. 即使当前没被将军，也不能走出让己方被将军的棋（送将）
     * @param chess - 要移动的棋子
     * @param moves - 当前可移动位置列表
     * @returns 过滤后的合法移动列表
     */
    filterMovesInCheck(chess: ChessPiece, moves: ChessPosition[]): ChessPosition[] {
      return moves.filter(move => {
        return !this.willMoveLeaveInCheck(chess, move)
      })
    },

    /**
     * 检测某次移动后己方是否会处于被将军状态（包括照面）
     * @param chess - 要移动的棋子
     * @param targetPos - 目标位置
     * @returns true 表示移动后己方会被将军或照面（不合法移动）
     */
    willMoveLeaveInCheck(chess: ChessPiece, targetPos: ChessPosition): boolean {
      // 保存原始状态
      const originalX = chess.x
      const originalY = chess.y

      // 检查目标位置是否有棋子（可能会被吃掉）
      const targetKey = this.findPieceKeyAt(targetPos.x, targetPos.y)
      const capturedPiece = targetKey ? this.qiZiArray[targetKey] : null

      // 模拟移动
      chess.x = targetPos.x
      chess.y = targetPos.y

      // 如果吃子，临时移除被吃的棋子
      if (targetKey && capturedPiece) {
        delete this.qiZiArray[targetKey]
      }

      // 检测己方是否会被将军（isInCheck 已包含照面检测）
      const willBeInCheck = this.isInCheck(chess.isRed)

      // 恢复状态
      chess.x = originalX
      chess.y = originalY

      // 恢复被吃的棋子
      if (targetKey && capturedPiece) {
        this.qiZiArray[targetKey] = capturedPiece
      }

      return willBeInCheck
    },
    //生成所有可走点
    generateMoves(chess: ChessPiece) {
      //判断是否过河
      if (chess.rules.isOverRiver) {
        let allowed = chess.rules.allowed.concat(chess.rules.addAllowed)
        return allowed.map(a => ({
          x: chess.x + a.x,
          y: chess.y + a.y
        }))
      } else {
        return chess.rules.allowed.map(a => ({
          x: chess.x + a.x,
          y: chess.y + a.y
        }))
      }
    },
    //过滤出棋盘内的位置
    filterOutOfBoard(moves: ChessPosition[]) {
      return moves.filter(p =>
        p.x >= 0 && p.x < 9 &&
        p.y >= 0 && p.y < 10
      )
    },
    //获取路径
    getPath(x1: number, y1: number, x2: number, y2: number, isBlocked: boolean) {
      if (!isBlocked) {
        return []
      }
      const path: ChessPosition[] = []

      const dx = x2 - x1
      const dy = y2 - y1

      //日字走法
      if (
        (Math.abs(dx) === 2 && Math.abs(dy) === 1) ||
        (Math.abs(dx) === 1 && Math.abs(dy) === 2)
      ) {
        // 横着走两格
        if (Math.abs(dx) === 2) {
          path.push({
            x: x1 + Math.sign(dx),
            y: y1
          })
        }
        // 竖着走两格
        else {
          path.push({
            x: x1,
            y: y1 + Math.sign(dy)
          })
        }
        return path
      }
      // 直线 & 对角线
      if (
        dx === 0 ||
        dy === 0 ||
        Math.abs(dx) === Math.abs(dy)
      ) {
        const stepX = Math.sign(dx)
        const stepY = Math.sign(dy)

        let cx = x1 + stepX
        let cy = y1 + stepY

        while (cx !== x2 || cy !== y2) {
          path.push({ x: cx, y: cy })
          cx += stepX
          cy += stepY
        }
      }

      // 其他棋子默认无路径
      return path
    },
    //计算路径上的棋子数量
    countPiecesOnPath(path: ChessPosition[]) {
      let count = 0
      for (const p of path) {
        if (this.findPieceKeyAt(p.x, p.y)) count++
      }
      return count
    },
    //过滤吃子规则
    filterEatRule(chess: ChessPiece, moves: ChessPosition[]) {
      return moves.filter(pos => {
        const targetKey = this.findPieceKeyAt(pos.x, pos.y)
        const target = targetKey ? this.qiZiArray[targetKey] : null

        // 空格：只能是正常移动（不能隔子）
        if (!target) {
          if (!chess.rules.isBlocked) return true

          const path = this.getPath(chess.x, chess.y, pos.x, pos.y, true)
          const blockCount = path.filter(p => this.findPieceKeyAt(p.x, p.y)).length

          return blockCount === 0
        }

        // 统一判断这一步像不像一次吃子
        if (!this.canEatLike(chess, pos)) {
          return false
        }

        // 敌方：吃
        if (target.isRed !== chess.isRed) {
          return true
        }

        // 己方：只能融合
        const chessKey = this.findPieceKeyAt(chess.x, chess.y)!
        return this.canFusion(chessKey, targetKey!) === 2
      })
    },
    //过滤掉不在活动范围内的路径
    filterOutOfRange(chess: ChessPiece, moves: ChessPosition[]) {
      const range = chess.rules.allowedRange
      // 从四个角点计算矩形边界
      const minX = Math.min(...range.map(p => p.x))
      const maxX = Math.max(...range.map(p => p.x))
      const minY = Math.min(...range.map(p => p.y))
      const maxY = Math.max(...range.map(p => p.y))

      return moves.filter(pos => {
        return pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY
      })
    },
    //检查是否过河
    checkOverRiver(chess: ChessPiece, pos: ChessPosition) {
      if (chess.isRed) {
        return pos.y > 4
      } else {
        return pos.y < 5
      }
    },
    //根据坐标查找棋子在棋子集合中的键
    findPieceKeyAt(x: number, y: number): string | null {
      for (const key of Object.keys(this.qiZiArray)) {
        const p = this.qiZiArray[key]
        if (p && p.x === x && p.y === y) {
          return key
        }
      }
      return null
    },
    //根据棋子名称查找棋子在棋子集合中的键
    findPieceKeyByName(name: string): string | null {
      for (const key of Object.keys(this.qiZiArray)) {
        const p = this.qiZiArray[key]
        if (p && p.name === name) {
          return key
        }
      }
      return null
    },
    //判断数组中是否包含某个对象
    objectArrayIncludes<T extends Record<string, any>>(array: T[], searchObj: Partial<T>): boolean {
      return array.some(item =>
        Object.entries(searchObj).every(([key, value]) => item[key as keyof T] === value)
      );
    },
    //更新棋盘函数
    updateBoard() {
      this.board = Array.from({ length: 10 }, () => new Array(9).fill(null));
      //将棋子数组中数据对应到borad中
      for (const key of Object.keys(this.qiZiArray)) {
        const piece = this.qiZiArray[key];
        const qizi = {} as ChessPieceInBoard;
        if (piece) {
          qizi.name = piece.name;
          qizi.x = piece.x;
          qizi.y = piece.y;
          qizi.isRed = piece.isRed;
          const col = this.board[piece.y];
          if (col) {
            col[piece.x] = qizi;
          }
        }
      }
      console.log("更新棋盘", this.board);
    },

    // ==================== 将军检测系统 ====================

    /**
     * 查找指定阵营的将/帅
     * @param isRed - true 查找红方帅，false 查找黑方将
     * @returns 将/帅棋子对象，未找到返回 null
     */
    findKing(isRed: boolean): ChessPiece | null {
      for (const key of Object.keys(this.qiZiArray)) {
        const piece = this.qiZiArray[key]
        if (piece && piece.isRed === isRed) {
          // 红方是"帅"，黑方是"将"
          if ((isRed && piece.name === '帅') || (!isRed && piece.name === '将')) {
            return piece
          }
        }
      }
      return null
    },

    /**
     * 获取某棋子的所有可攻击位置（用于检测将军）
     * 这类似于 checkMove，但专门用于判断攻击范围
     * @param chess - 棋子对象
     * @returns 该棋子所有可攻击到的位置数组
     */
    getAttackMoves(chess: ChessPiece): ChessPosition[] {
      let moves = this.generateMoves(chess)
      moves = this.filterOutOfBoard(moves)

      // 过滤路径阻挡和吃子规则
      return moves.filter(pos => {
        const targetKey = this.findPieceKeyAt(pos.x, pos.y)
        const target = targetKey ? this.qiZiArray[targetKey] : null

        // 对于空格位置，检查路径是否被阻挡（炮除外）
        if (!target) {
          if (!chess.rules.isBlocked) return true

          // 炮不能隔子走空格（但可以隔子吃子）
          if (chess.rules.aparted >= 0) {
            const path = this.getPath(chess.x, chess.y, pos.x, pos.y, true)
            const blockCount = path.filter(p => this.findPieceKeyAt(p.x, p.y)).length
            return blockCount === 0
          }

          const path = this.getPath(chess.x, chess.y, pos.x, pos.y, true)
          const blockCount = path.filter(p => this.findPieceKeyAt(p.x, p.y)).length
          return blockCount === 0
        }

        // 对于有目标的位置，使用吃子规则判断
        return this.canEatLike(chess, pos)
      })
    },

    /**
     * 获取能够攻击到指定位置的敌方棋子列表
     * @param targetPos - 目标位置
     * @param isTargetRed - 目标是否是红方（用于确定敌方阵营）
     * @returns 能攻击到该位置的敌方棋子键名数组
     */
    getAttackingPieces(targetPos: ChessPosition, isTargetRed: boolean): string[] {
      const attackers: string[] = []

      for (const key of Object.keys(this.qiZiArray)) {
        const piece = this.qiZiArray[key]
        // 只检查敌方棋子
        if (piece && piece.isRed !== isTargetRed) {
          const attackMoves = this.getAttackMoves(piece)
          // 检查是否能攻击到目标位置
          if (attackMoves.some(pos => pos.x === targetPos.x && pos.y === targetPos.y)) {
            attackers.push(key)
          }
        }
      }

      return attackers
    },

    /**
     * 检测指定阵营是否处于被将军状态
     * 包括两种情况：1. 被敌方棋子攻击  2. 将帅照面（同列无子阻挡）
     * @param isRed - true 检测红方是否被将军，false 检测黑方
     * @returns true 表示处于被将军状态
     */
    isInCheck(isRed: boolean): boolean {
      const king = this.findKing(isRed)
      if (!king) return false

      const kingPos: ChessPosition = { x: king.x, y: king.y }
      const attackers = this.getAttackingPieces(kingPos, isRed)

      // 情况1: 被敌方棋子攻击
      if (attackers.length > 0) {
        return true
      }

      // 情况2: 检查将帅照面（同列无子阻挡）
      const opponentKing = this.findKing(!isRed)
      if (opponentKing && king.x === opponentKing.x) {
        const minY = Math.min(king.y, opponentKing.y)
        const maxY = Math.max(king.y, opponentKing.y)

        // 检查中间是否有棋子阻挡
        let hasBlocker = false
        for (let y = minY + 1; y < maxY; y++) {
          if (this.findPieceKeyAt(king.x, y)) {
            hasBlocker = true
            break
          }
        }

        // 无阻挡 → 照面！视为被将军
        if (!hasBlocker) {
          return true
        }
      }

      return false
    },

    /**
     * 获取将军的攻击者列表
     * @param isRed - 被将军方的阵营
     * @returns 攻击将/帅的敌方棋子键名数组
     */
    getCheckingPieces(isRed: boolean): string[] {
      const king = this.findKing(isRed)
      if (!king) return []

      const kingPos: ChessPosition = { x: king.x, y: king.y }
      return this.getAttackingPieces(kingPos, isRed)
    },

    /**
     * 检测将/帅是否能通过移动来躲避将军
     * @param isRed - 被将军方的阵营
     * @returns true 表示将/帅可以通过移动来解除将军
     */
    canKingEscape(isRed: boolean): boolean {
      const king = this.findKing(isRed)
      if (!king) return false

      // 获取将/帅的所有合法移动位置
      const kingMoves = this.checkMove(king)

      // 模拟将/帅移动到每个位置，检测是否仍被将军
      for (const move of kingMoves) {
        // 检查移动后该位置是否安全
        const originalX = king.x
        const originalY = king.y

        // 临时移动
        king.x = move.x
        king.y = move.y

        // 检查移动后是否还被攻击
        const stillInCheck = this.getAttackingPieces(move, isRed).length > 0

        // 恢复位置
        king.x = originalX
        king.y = originalY

        if (!stillInCheck) {
          return true // 找到安全位置
        }
      }

      return false
    },

    /**
     * 检测是否能通过己方棋子移动到中间位置来阻挡将军
     * @param isRed - 被将军方的阵营
     * @param attackerKey - 发起将军的敌方棋子键名
     * @returns true 表示可以通过阻挡来解除将军
     */
    canBlockCheck(isRed: boolean, attackerKey: string): boolean {
      const king = this.findKing(isRed)
      const attacker = this.qiZiArray[attackerKey]
      if (!king || !attacker) return false

      // 获取攻击者到将/帅之间的路径
      const path = this.getPath(attacker.x, attacker.y, king.x, king.y, true)

      // 如果路径为空（马的攻击等），则无法阻挡
      if (path.length === 0) return false

      // 检查己方每个棋子是否能移动到路径上的任意位置
      for (const key of Object.keys(this.qiZiArray)) {
        const piece = this.qiZiArray[key]
        // 只检查己方棋子，且不是将/帅本身
        if (piece && piece.isRed === isRed && piece.name !== '帅' && piece.name !== '将') {
          const moves = this.checkMove(piece)

          // 检查是否能移动到路径上的任意位置
          for (const pathPos of path) {
            if (moves.some(m => m.x === pathPos.x && m.y === pathPos.y)) {
              // 模拟移动，检查移动后是否仍被将军
              const originalX = piece.x
              const originalY = piece.y

              piece.x = pathPos.x
              piece.y = pathPos.y

              const stillInCheck = this.isInCheck(isRed)

              piece.x = originalX
              piece.y = originalY

              if (!stillInCheck) {
                return true
              }
            }
          }
        }
      }

      return false
    },

    /**
     * 检测是否能通过吃掉攻击者来解除将军
     * @param isRed - 被将军方的阵营
     * @param attackerKey - 发起将军的敌方棋子键名
     * @returns true 表示可以通过吃掉攻击者来解除将军
     */
    canCaptureAttacker(isRed: boolean, attackerKey: string): boolean {
      const attacker = this.qiZiArray[attackerKey]
      if (!attacker) return false

      const attackerPos: ChessPosition = { x: attacker.x, y: attacker.y }

      // 检查己方每个棋子是否能吃掉攻击者
      for (const key of Object.keys(this.qiZiArray)) {
        const piece = this.qiZiArray[key]
        if (piece && piece.isRed === isRed) {
          const moves = this.checkMove(piece)

          if (moves.some(m => m.x === attackerPos.x && m.y === attackerPos.y)) {
            // 模拟吃子，检查吃子后是否仍被将军
            const originalX = piece.x
            const originalY = piece.y
            const capturedPiece = this.qiZiArray[attackerKey]

            // 临时移动
            piece.x = attackerPos.x
            piece.y = attackerPos.y
            delete this.qiZiArray[attackerKey]

            const stillInCheck = this.isInCheck(isRed)

            // 恢复状态
            piece.x = originalX
            piece.y = originalY
            if (capturedPiece) {
              this.qiZiArray[attackerKey] = capturedPiece
            }

            if (!stillInCheck) {
              return true
            }
          }
        }
      }

      return false
    },

    /**
     * 检测是否将死（无法解除将军状态）
     * @param isRed - 被将军方的阵营
     * @returns true 表示将死，游戏结束
     */
    isCheckmate(isRed: boolean): boolean {
      // 首先确认是否处于被将军状态
      if (!this.isInCheck(isRed)) {
        return false
      }

      const attackers = this.getCheckingPieces(isRed)

      // 检查三种解除将军的方式

      // 1. 将/帅能否逃跑
      if (this.canKingEscape(isRed)) {
        return false
      }

      // 2. 能否吃掉攻击者（如果只有一个攻击者）
      // 注意：如果有多个攻击者，通常只能通过移动将/帅来解除
      if (attackers.length === 1) {
        const attacker = attackers[0]
        if (attacker) {
          if (this.canCaptureAttacker(isRed, attacker)) {
            return false
          }

          // 3. 能否阻挡攻击
          if (this.canBlockCheck(isRed, attacker)) {
            return false
          }
        }
      }

      // 无法解除将军，判定为将死
      return true
    },

    /**
     * 综合检测将军状态（主入口函数）
     * 这个函数在每次移动后调用，检测对方是否被将军或将死
     * @param chess - 刚刚移动的棋子
     * @param pos - 移动到的位置
     * @returns { isCheck: boolean, isCheckmate: boolean, message: string }
     * isCheck: 是否被将军
     * isCheckmate: 是否将死
     * message: 消息
     */
    checkIsInCheck(chess: ChessPiece, _pos: ChessPosition): { isCheck: boolean; isCheckmate: boolean; message: string } {
      // 检测对方是否被将军（刚走棋的一方将对方）
      const opponentIsRed = !chess.isRed

      const isCheck = this.isInCheck(opponentIsRed)

      if (!isCheck) {
        return { isCheck: false, isCheckmate: false, message: '' }
      }

      const isCheckmate = this.isCheckmate(opponentIsRed)

      if (isCheckmate) {
        const winner = chess.isRed ? '红方' : '黑方'
        return {
          isCheck: true,
          isCheckmate: true,
          message: `将死！${winner}获胜！`
        }
      }

      return {
        isCheck: true,
        isCheckmate: false,
        message: `将军！${opponentIsRed ? '红方' : '黑方'}请应将！`
      }
    },
    checkIsInCheckmate(chess: ChessPiece, _pos: ChessPosition): boolean {
      // 检测对方是否被将军（刚走棋的一方将对方）
      const opponentIsRed = !chess.isRed
      //遍历对方所有棋子
      for (const key of Object.keys(this.qiZiArray)) {
        const piece = this.qiZiArray[key]
        if (piece && piece.isRed === opponentIsRed) {
          const moves = this.checkMove(piece)
          if (moves.length > 0) {
            return false
          }
        }
      }
      return true
    }
  },
  //mounted只在组件创建时执行一次
  mounted() {
    this.updateBoard();//初始化棋盘
  }
})
</script>

<style scoped>
/* 棋盘容器样式 */
/* 棋盘组件 */
.chessboard {
  /* 弹性布局让行垂直排列 */
  display: flex;
  flex-direction: column;
  /* 棋盘边框 */
  width: fit-content;
  margin: 20px auto;
  position: relative;
  padding: 0;
  border-radius: 16px;
  background: rgba(240, 230, 210, 0.3);
  /*   backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px); */
  border: 1.2px solid rgb(0, 0, 0);
}

.board-svg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
}

/* 每一行的样式 */
.row {
  /* 弹性布局让单元格水平排列 */
  display: flex;
}

/* 每个单元格的样式（核心：设置固定宽高，让空单元格也可点击） */
.cell {
  position: relative;
  /* 添加这一行 */
  width: 50px;
  height: 50px;
  box-sizing: border-box;
  /* 确保格子实际大小为50px */
  /* border: 1px solid #ccc;  Removed borders */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* background-color: #f9f9f9; Removed background */
}

/* 可能移动位置的样式 */
.possible-move {
  position: absolute;
  /* 绝对定位，避免影响布局 */
  top: 50%;
  /* 垂直居中 */
  left: 50%;
  /* 水平居中 */
  transform: translate(-50%, -50%);
  /* 精确居中 */
  width: 10px;
  height: 10px;
  background-color: rgba(0, 255, 0, 0.7);
  /* 绿色半透明背景 */
  border-radius: 50%;
  z-index: 1;
  /* 确保在棋子之下 */
  box-shadow: 0 0 5px rgba(0, 255, 0, 0.8);
}


/* 棋子样式 */
/* 棋子统一样式 - 为适配现有50px格子，调整尺寸 */
.chess-piece {
  --piece-size: 44px;
  width: var(--piece-size);
  height: var(--piece-size);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.4rem;
  font-family: "KaiTi", "楷体", "STKaiti", serif;
  font-weight: 900;
  cursor: pointer;
  z-index: 20;
  user-select: none;

  /* 果冻形状 */
  border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%;
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);

  /* 核心光影 */
  box-shadow:
    inset 4px 6px 10px rgba(0, 0, 0, 0.1),
    3px 3px 5px rgba(0, 0, 0, 0.1),
    inset -4px -4px 6px rgba(255, 255, 255, 0.6);

  /* 动画 */
  animation: fluid-morph 10s linear infinite;
  transition: transform 0.4s cubic-bezier(0.34, 1.38, 0.64, 1);
}

/* 交互微动 */
.chess-piece:hover {
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.5);
  box-shadow:
    inset 6px 12px 20px rgba(0, 0, 0, 0.15),
    8px 8px 15px rgba(0, 0, 0, 0.15),
    inset -6px -6px 8px rgba(255, 255, 255, 0.8);
  transform: scale(1.15);
}

/* 内部高光点 */
.chess-piece::after {
  content: '';
  width: 10px;
  height: 6px;
  position: absolute;
  top: 20%;
  left: 22%;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  filter: blur(1px);
  pointer-events: none;
  transform: rotate(-45deg);
}

/* 红方 */
.piece-red {
  color: #d50000;
  border: 1px solid rgba(255, 61, 0, 0.2);
  background-color: rgba(255, 200, 200, 0.15);
}

/* 黑方 */
.piece-black {
  color: #263238;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background-color: rgba(200, 220, 230, 0.15);
}

/* 上一步落点 - 黄色光环 */
.last-move {
  box-shadow:
    0 0 0 1px rgba(255, 215, 0, 0.4),
    0 0 12px 2px rgba(255, 215, 0, 0.3),
    inset 4px 6px 10px rgba(0, 0, 0, 0.1),
    inset -4px -4px 6px rgba(255, 255, 255, 0.6);
  animation: last-move-pulse 1.5s ease-in-out infinite, fluid-morph 10s linear infinite;
}

@keyframes last-move-pulse {

  0%,
  100% {
    box-shadow:
      0 0 0 1px rgba(0, 157, 255, 0.4),
      0 0 12px 2px rgba(0, 157, 255, 0.3),
      inset 4px 6px 10px rgba(0, 0, 0, 0.1),
      inset -4px -4px 6px rgba(255, 255, 255, 0.6);
  }

  50% {
    box-shadow:
      0 0 0 2px rgba(0, 157, 255, 0.6),
      0 0 12px 3px rgba(0, 157, 255, 0.4),
      inset 4px 6px 10px rgba(0, 0, 0, 0.1),
      inset -4px -4px 6px rgba(255, 255, 255, 0.6);
  }
}

/* 起点标记 - 类似旧印记 */
.start-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(0, 157, 255, 0.3);
  /* 淡橙色 */
  box-shadow: 0 0 4px rgba(0, 157, 255, 0.4);
  pointer-events: none;
  z-index: 1;
}

/* 可被吃的棋子 - 绿色光环 */
.targetable {
  box-shadow:
    0 0 0 1px rgba(0, 255, 0, 0.4),
    0 0 12px 2px rgba(0, 255, 0, 0.3),
    inset 4px 6px 10px rgba(0, 0, 0, 0.1),
    inset -4px -4px 6px rgba(255, 255, 255, 0.6);
  animation: targetable-pulse 1.5s ease-in-out infinite, fluid-morph 10s linear infinite;
}

@keyframes targetable-pulse {

  0%,
  100% {
    box-shadow:
      0 0 0 1px rgba(0, 255, 0, 0.4),
      0 0 12px 2px rgba(0, 255, 0, 0.3),
      inset 4px 6px 10px rgba(0, 0, 0, 0.1),
      inset -4px -4px 6px rgba(255, 255, 255, 0.6);
  }

  50% {
    box-shadow:
      0 0 0 2px rgba(0, 255, 0, 0.6),
      0 0 12px 3px rgba(0, 255, 0, 0.4),
      inset 4px 6px 10px rgba(0, 0, 0, 0.1),
      inset -4px -4px 6px rgba(255, 255, 255, 0.6);
  }
}

/* 棋子文字样式 - 增加漂浮动画 */
.chess-piece span {
  position: relative;
  z-index: 2;
  animation: text-float 10s ease-in-out infinite;
  display: inline-block;
}

/* 模拟文字在液体中的漂浮感 */
@keyframes text-float {

  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }

  20% {
    transform: translate(1.5px, -1.5px) rotate(2deg);
  }

  40% {
    transform: translate(-1px, 2px) rotate(-1deg);
  }

  60% {
    transform: translate(-2px, 0.5px) rotate(1deg);
  }

  80% {
    transform: translate(1px, -1px) rotate(-2deg);
  }
}

/* 核心动画定义 - 果冻变形 */
@keyframes fluid-morph {
  0% {
    border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%;
  }

  5% {
    border-radius: 42% 58% 61% 39% / 42% 39% 61% 58%;
  }

  10% {
    border-radius: 45% 55% 62% 38% / 45% 38% 62% 55%;
  }

  15% {
    border-radius: 49% 51% 62% 38% / 49% 38% 62% 51%;
  }

  20% {
    border-radius: 52% 48% 61% 39% / 52% 39% 61% 48%;
  }

  25% {
    border-radius: 58% 42% 60% 40% / 58% 40% 60% 42%;
  }

  30% {
    border-radius: 60% 40% 55% 45% / 60% 42% 58% 40%;
  }

  35% {
    border-radius: 62% 38% 50% 50% / 61% 48% 52% 39%;
  }

  40% {
    border-radius: 62% 38% 45% 55% / 61% 52% 48% 39%;
  }

  45% {
    border-radius: 60% 40% 42% 58% / 61% 58% 42% 39%;
  }

  50% {
    border-radius: 58% 42% 40% 60% / 58% 60% 40% 42%;
  }

  55% {
    border-radius: 52% 48% 40% 60% / 55% 61% 39% 45%;
  }

  60% {
    border-radius: 48% 52% 40% 60% / 52% 61% 39% 48%;
  }

  65% {
    border-radius: 44% 56% 41% 59% / 50% 61% 39% 50%;
  }

  70% {
    border-radius: 41% 59% 42% 58% / 48% 62% 38% 52%;
  }

  75% {
    border-radius: 40% 60% 45% 55% / 42% 60% 40% 58%;
  }

  80% {
    border-radius: 40% 60% 48% 52% / 40% 58% 42% 60%;
  }

  85% {
    border-radius: 40% 60% 50% 50% / 40% 52% 48% 60%;
  }

  90% {
    border-radius: 40% 60% 55% 45% / 40% 48% 52% 60%;
  }

  95% {
    border-radius: 40% 60% 58% 42% / 40% 42% 58% 60%;
  }

  100% {
    border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%;
  }
}

.trajectory-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* 确保不阻挡点击事件 */
  z-index: 2;
  /* 位于棋子上方或下方，视需求而定，这里放在上方以便看清 */
}

/* 爆炸粒子容器 */
.explosion-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 150;
  overflow: visible;
}

/* 爆炸水滴粒子 - 高质感液态模拟 */
.explosion-droplet {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 150;

  /* 初始状态 */
  transform-origin: center center;
  opacity: 1;

  /* 动画过渡 */
  transition:
    transform 1.2s cubic-bezier(0.1, 0.8, 0.2, 1),
    opacity 0.2s ease-in 1.0s;

  /* 光影层：模拟折射和高光 */
  box-shadow:
    inset 2px 2px 4px rgba(255, 255, 255, 0.6),
    inset -2px -2px 4px rgba(0, 0, 0, 0.2),
    inset 0 0 6px var(--droplet-color),
    2px 2px 4px rgba(0, 0, 0, 0.15);

  /* 增加一点形变，让它不像完美圆球 */
  border-radius: 54% 46% 42% 58% / 50% 45% 55% 50%;
}

/* 增加高光点 - 让水滴看起来湿润 */
.explosion-droplet::after {
  content: '';
  position: absolute;
  top: 20%;
  left: 20%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 100%);
  filter: blur(0.5px);
}
</style>