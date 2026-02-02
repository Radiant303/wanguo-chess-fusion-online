<template>
  <div class="chess-container">
    <h2>单个车的移动演示</h2>
    <div class="chessboard">
      <!-- 棋盘网格 -->
      <div v-for="y in 10" :key="'row-' + y" class="row">
        <div v-for="x in 9" :key="'cell-' + x + '-' + y" class="cell" @click="handleCellClick(x - 1, y - 1)">
          <!-- 显示棋盘中的棋子 -->
          <div v-if="board[y - 1] && board[y - 1]![x - 1]"
            :class="'piece' + (board[y - 1]![x - 1]!.isRed ? ' red' : ' black')">
            {{ board[y - 1]![x - 1]!.name }}
          </div>

          <!-- 显示可落点位置 -->
          <div v-if="possibleMoves.some(p => p.x === x - 1 && p.y === y - 1)" class="possible-move"></div>
        </div>
      </div>
    </div>
    <p>规则：点击车选中，再点击目标位置移动（横竖直走）</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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

// 棋子集合类型（键是棋子标识，如 car、horse 等）
interface ChessCollection {
  [key: string]: ChessPiece;
}

interface FusionCollection {
  [key: string]: string[];
}
//缓存选中的棋子
let selectedKey: string | null = null
export default defineComponent({
  data() {
    return {
      board: [] as (ChessPieceInBoard | null)[][],//棋盘
      possibleMoves: [] as { x: number, y: number }[],//可落点位置
      //棋子集合
      qiZiArray: {
        car: {
          name: '车',
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
            aparted: -1
          }
        },
        horse: {
          name: '马',
          x: 0,
          y: 2,
          isRed: false,
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
            aparted: -1
          }
        },
        car2: {
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
            aparted: -1
          }
        },
        pao: {
          name: '炮',
          x: 1,
          y: 4,
          isRed: false,
          rules: {
            allowed: [
              { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 0, y: 9 },//上
              { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }, { x: 0, y: -8 }, { x: 0, y: -9 },//下
              { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },//右
              { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }, { x: -8, y: 0 }, { x: -9, y: 0 }//左
            ],
            isBlocked: true,
            aparted: 1
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
    handleCellClick(x: number, y: number) {
      const key = this.checkQiZiClick(x, y)

      // 已有选中棋子，且点击的是“可落点”（包括敌方棋子）
      if (selectedKey && this.objectArrayIncludes(this.possibleMoves, { x, y })) {
        const selectedQiZi = this.qiZiArray[selectedKey] as ChessPiece
        this.moveQiZi(x, y, selectedQiZi)
        selectedKey = null
        this.possibleMoves = []
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

      const result = this.resolveMove(x, y, chess)

      if (result === 'move' || result === 'eat') {
        chess.x = x
        chess.y = y
      }

      this.updateBoard()
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
            rules: proto.rules
          }

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

      for (const [resultKey, needs] of Object.entries(this.fusionArray)) {
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
      console.log(
        chess.name,
        '当前位置', chess.x, chess.y,
        '可走点', moves
      )

      return moves
    },
    //生成所有可走点
    generateMoves(chess: ChessPiece) {
      return chess.rules.allowed.map(a => ({
        x: chess.x + a.x,
        y: chess.y + a.y
      }))
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
.chessboard {
  /* 弹性布局让行垂直排列 */
  display: flex;
  flex-direction: column;
  /* 棋盘边框 */
  border: 2px solid #333;
  width: fit-content;
  margin: 20px 0;
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
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #f9f9f9;
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
}

/* 奇偶行单元格背景色交替（可选，增强视觉效果） */
.row:nth-child(even) .cell:nth-child(odd),
.row:nth-child(odd) .cell:nth-child(even) {
  background-color: #e0e0e0;
}

/* 棋子样式 */
.piece {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f00;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}

.red {
  background-color: #f00;
}

.black {
  background-color: #000;
}
</style>