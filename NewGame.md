# AIMAX 象棋联机版 - 终极系统架构与实施手册 (V4.0)

本手册不仅是设计文档，更是**开发实施的行动指南**。涵盖代码结构、数据库实体操作、通信协议字节级细节、核心算法伪代码及异常处理机制。

---

## 1. 项目目录结构规划 (Project Structure)

前端采用 **Vue 3 + TypeScript**，后端采用严格的分层架构：**Controller, Service, Mapper, Entity, Utils**。

```text
/backend
├── app
│   ├── controller         # 【控制层】 接收 HTTP/WS 请求，参数校验，调用 Service
│   │   ├── user_controller.py
│   │   ├── room_controller.py
│   │   ├── rule_controller.py
│   │   └── websocket_controller.py
│   ├── service            # 【服务层】 核心业务逻辑，事务控制，算法实现
│   │   ├── user_service.py
│   │   ├── room_service.py
│   │   ├── rule_service.py
│   │   └── fusion_service.py  # 【核心】自定义规则与本身逻辑校验引擎
│   ├── mapper             # 【持久层】 数据库访问接口 (ORM/SQL)
│   │   ├── user_mapper.py
│   │   └── rule_mapper.py
│   ├── entity             # 【实体层】 数据库映射模型 (Models)
│   │   ├── user_entity.py
│   │   └── rule_entity.py
│   ├── utils              # 【工具层】 通用工具/加密/配置
│   │   ├── config.py
│   │   ├── security_utils.py
│   │   └── math_utils.py
│   └── main.py            # 程序入口 (注入依赖，启动APP)
├── tests                  # 单元测试
├── requirements.txt
└── Dockerfile
/frontend
├── src
│   ├── api                # Axios 请求封装
│   ├── assets             # 静态资源
│   ├── logic              # 游戏核心逻辑 (TypeScript)
│   │   ├── Board.ts       # 棋盘渲染与交互
│   │   ├── FusionAI.ts    # 【核心】适配动态规则的 AI 类
│   │   └── Socket.ts      # WS 客户端封装
│   ├── views
│   │   ├── Lobby.vue      # 大厅
│   │   ├── Game.vue       # 对战页
│   │   └── RuleEditor.vue # 规则编辑器
│   ├── main.ts
│   └── shims-vue.d.ts
└── index.html
```
```
以下是 AIMAX 象棋联机版的严格设计风格与配色规范。请在后续开发中严格遵守此标准。

1. 设计哲学 (Design Philosophy)
风格定位：新中式极简 (Modern Zen)。结合现代 Web 的清爽扁平感与中国象棋的传统韵味。
核心触感：
纸质感：背景采用柔和米灰，棋盘采用淡纸色。
木纹感：棋子边缘与线条使用深褐色调，模拟实木质感。
呼吸感：大圆角卡片、柔和投影、适度的留白。
2. 核心配色表 (Color Palette)
此配色表为系统唯一真理，所有组件必须使用变量或对应的十六进制码。

类别 (Category)	变量名 / 描述	色值 (Hex/RGB)	用途
背景色	--bg-color	#f2f2ef	全局背景 (柔和米灰)
面板色	--panel-bg	#ffffff	面板/卡片背景 (纯白)
主文字	--text-primary	#2c2c2c	标题、强调文字 (深灰)
次文字	--text-secondary	#666666	说明、辅助文字 (中灰)
红方/强调	--accent-red	#c0392b	红方棋子、选中态、印泥红
黑方/主色	--accent-black	#262626	黑方棋子、主按钮 (纯墨色)
警告/错误	(Custom)	#e74c3c	将军警告、断开连接、删除按钮
成功/提示	(Dot)	#27ae60	合法落点 (半透明)
边框线	--border-color	#e0e0e0	卡片边框、分割线
3. 棋盘与棋子组件 (Board & Pieces)
棋盘 (Board)
基调：rgba(240, 230, 210, 0.3) (极淡古纸色)
线条：#5a4a42 (深褐色，模拟木纹/墨线)
楚河汉界：#8b5a2b (铜褐色)，字体 KaiTi / STKaiti。
棋子 (Piece)
本体：#fcfcfc (象牙白/暖白)，严禁使用冷白。
边框：2px solid #e6dcd0 (浅木色)。
文字：KaiTi (楷体)，字号 28px，加粗。
投影：box-shadow: 0 2px 5px rgba(90, 70, 60, 0.2) (暖褐色投影)。
选中态：放大 1.1 倍，外发光 rgba(192, 57, 43, 0.4)。
4. UI 组件规范 (UI Components)
容器 (Container)
圆角：border-radius: 12px (卡片), 8px (列表项)。
阴影：0 4px 20px rgba(0, 0, 0, 0.04) (极轻微浮起)。
按钮 (Buttons)
圆角：6px。
主按钮：背景 --accent-black，文字 #fff。
次级按钮：背景 #fff，边框 #ddd，文字 #444。
交互：点击时 transform: scale(0.98)。
规则列表 (List)
默认：背景 #f8f9fa，边框 #eee。
激活：背景 #fff，左侧红边，右侧阴影，文字变 --accent-red。
交互反馈 (Feedback)
落点提示：绿色圆点 (rgba(39, 174, 96, 0.6))。
吃子提示：绿色空心框 (border: 4px)。
将军警告：全屏/局部红色闪烁动画 (animation: flash-red)，以及磨砂玻璃质感的黑色浮层。
5. 字体排印 (Typography)
UI 字体：-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif。
文化字体："KaiTi", "STKaiti", serif (仅用于棋子、楚河汉界、极少数装饰性标题)。
```
---

## 2. 实体层设计 (Entity Layer)

后端使用 Python `SQLAlchemy` 2.0+ 风格定义。

### 2.1 用户模型 (`User`)
```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    # 扩展字段：保留积分、胜率等扩展性
    elo_rating = Column(Integer, default=1200) 
    created_at = Column(DateTime, default=func.now())
    
    rules = relationship("CustomRule", back_populates="creator")
```

### 2.2 规则模型 (`CustomRule`)
```python
class CustomRule(Base):
    __tablename__ = "custom_rules"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100), nullable=False)
    
    # 核心：存储可视化编辑器生成的 JSON 配置
    # 用户通过拖拽、点击、滑块等交互方式定义规则，而非编写文本
    config_json = Column(JSON, nullable=False) 
    
    is_public = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    
    creator = relationship("User", back_populates="rules")
```

#### 2.2.1 规则校验与保留字约束 (Rule Validation)
为了防止混淆，用户在“规则编辑器”创建新棋子时，后端 **Rules Service** 将执行严格校验。

**保留名称列表 (Reserved Names):**
用户自定义的新棋子 `name` **严禁** 使用以下名称（包含简体/繁体/拼音）：
*   帅, 将, King, General
*   士, 仕, Advisor, Guard
*   相, 象, Elephant, Minister
*   马, 傌, Horse, Knight
*   车, 俥, Car, Rook, Chariot
*   炮, 砲, Cannon
*   兵, 卒, Pawn, Soldier

**校验逻辑示例 (Python):**
```python
RESERVED_NAMES = {"帅", "将", "士", "相", "象", "马", "车", "炮", "兵", "卒", ...}

def validate_rule_config(config: dict):
    # 1. 检查棋子名称冲突
    for pid, piece in config.get("piece_definitions", {}).items():
        if piece["name"].strip() in RESERVED_NAMES:
            raise ValueError(f"棋子名称 '{piece['name']}' 是保留字，不可用于自定义棋子。")
        
        # 检查是否与已有的自定义棋子重名
        # ...

    # 2. 检查融合闭环
    # 确保融合产生的新 ID 在 piece_definitions 中有定义
    for rule in config.get("fusion_logic", {}).get("rules", []):
        output_id = str(rule["output"])
        if output_id not in config["piece_definitions"]:
             raise ValueError(f"融合产物 ID {output_id} 未定义属性")
```

#### 2.2.2 游戏化规则锻造系统 (Gamified Rule Forge)

系统摒弃枯燥的文本配置，提供了一个**全可视化的、类似 RPG 装备打造的“规则锻造台”**。玩家通过点击、拖拽、绘图等游戏化操作来创造新棋子，**完全不需要编写任何文字规则**。

**核心交互体验：**

1.  **“绘卷”模式定义走法 (Pattern Painting)**：
    *   界面展示一个微缩棋盘。
    *   玩家直接在棋盘上**点击格子**，高亮的点即为棋子的落点（例如：点击“日”字对角，即可定义马的走法）。
    *   **手势绘制**：直接画出线条（横/竖/斜），代表“无限延伸”的能力（如车的走法）。
    *   **开关特效**：点击“穿透”图标，立刻赋予棋子“也是马但不会被蹩脚”的特性。

2.  **“熔炉”模式定义融合 (The Forge)**：
    *   **拖拽合成**：玩家将“马”和“象”的图标拖入中央的熔炉插槽，炉火升起，生成预览的新棋子。
    *   **参数滑块**：不输入数字，而是拖动“蓄能”滑块。滑块拉得越长（回合数越多），允许赋予的攻击力越高。
    *   **符文镶嵌**：将代表“雷电”、“自爆”的图形符文拖入棋子凹槽，赋予其被动技能。

3.  **所见即所得 (Live Preview)**：
    *   右侧实时显示一个迷你沙盘。
    *   每当你修改一个规则，沙盘里的 AI 会立即演示这个新棋子是如何移动和吃子的，直观展示规则的实际效果。

**(底层数据结构 - 仅供开发者参考)**
以下 JSON 是锻造台输出的标准产物，**对玩家完全透明**，由前端生成后传给后端：
```json
{
  "piece_definitions": {
    "35": {
        "name": "天马", 
        "value": 1500, 
        "asset_key": "pegasus",
        "move_logic": {
            // 前端“绘卷”模式：用户点击了日字形8个点 + 开启了“穿透”开关
            // 系统自动翻译为以下配置
            "type": "CUSTOM",
            "move_mode": { 
                "type": "VECTOR", 
                "vectors": [[1,2]], 
                "symmetrical": true,      // 用户勾选了“对称”
                "ignore_block": true      // 用户开启了“穿透”
            }
        }
    }
  },
  "fusion_logic": {
    "trigger_type": "EAT_SELF", 
    "rules": [
      {
        "input": [14, 13],        // 拖拽操作
        "output": 35,             // 生成结果
        "condition": {
            "min_turn": 10,       // 滑块位置
            "zone": "enemy_side", // 区域选择器状态
            "protected": false    // 保护开关状态
        },
        "effect": "thunder_strike" // 符文插槽
      }
    ]
  }
}
```

**可视化锻造台界面示意：**
```
┌─────────────────────────────────────────────────────────────┐
│  ✨ 棋魂锻造台 (Spirit Forge)                                │
├─────────────────────────────────────────────────────────────┤
│  [ 素材库 ]        [ 🔥 熔炉核心 🔥 ]         [ 预览沙盘 ]    │
│                 👇 拖拽素材进入                               │
│  ┌───┐ ┌───┐      ╔═══════════╗        ♟️ 实时演示...      │
│  │马 │ │象 │  ➔   ║  🐴 + 🐘  ║        (AI正在演示天马     │
│  └───┘ └───┘      ╚═══════════║         的无视蹩脚走位)    │
│                        ⚡                                  │
│                   [ 🦄 天马 ]                              │
│                                                             │
│  ┌─ 规则附魔 ────────────────────────────────────────┐      │
│  │  🕒 充能时间 (回合数):                                   │
│  │  [无] ━━━⦿━━━━━ [强] (10回合)                        │
│  │                                                         │
│  │  🗺️ 触发区域 (在棋盘上涂抹):                             │
│  │  [🟥 敌方阵地] [⬜ 己方阵地] (已选中敌方半场)           │
│  │                                                         │
│  │  🔮 特效符文 (拖拽至插槽):                               │
│  │  (⚡雷击) (💣自爆) (🛡️护盾) [ ⚡ ] < 已镶嵌雷击          │
│  └─────────────────────────────────────────────────────┘      │
│                                                             │
│         [ ✅ 铸造完成 ]       [ 🗑️ 熔毁重做 ]                 │
└─────────────────────────────────────────────────────────────┘

**符文特效详解 (Rune Codec):**
系统内置了物理引擎钩子，支持以下通过拖拽赋予的技能：

1.  **⚡ 雷击 (Thunder)**
    *   **触发时机**: 吃子瞬间 (OnCapture)。
    *   **代码逻辑**: `applyAoE(pos, pattern="CROSS", radius=1, effect="FREEZE")`
    *   **效果**: 以落点为中心触发十字闪电，**冻结**上下左右相邻的棋子 1 回合。

2.  **💣 自爆 (Explosion)**
    *   **触发时机**: 被吃瞬间 (OnDeath)。
    *   **代码逻辑**: `applyAoE(pos, pattern="SQUARE_3x3", effect="DESTROY_ALL")`
    *   **效果**: 这是一个“亡语”技能。当棋子被吃掉时，它会引爆自身，**炸毁**周围 3x3 范围内所有的单位（包括吃它的那个棋子）。

3.  **🛡️ 护盾 (Divine Shield)**
    *   **触发时机**: 受到攻击 (OnUnderAttack)。
    *   **代码逻辑**: `if (shield_active) { cancelDamage(); shield_active = false; }`
    *   **效果**: 免疫第一次被吃或被炸。当敌方试图吃这个棋子时，棋子不会死，只是护盾破碎（变为无特效棋子），由于落点被占，敌方此次攻击无效（被弹回原位）。

4.  **🌪️ 穿透 (Wind Walk)**
    *   **触发时机**: 移动路径计算 (PathFinding)。
    *   **代码逻辑**: `ignore_collision = true`
    *   **效果**: 赋予棋子**无视蹩脚**的能力。在“绘卷模式”中画出的任何路径，都可以像“天马”一样直接飞越障碍物。

```

#### 2.2.3 进阶配置：走法与吃子规则详解 (Move & Capture Schema)
为了支持极高自由度的棋子设计，系统将**“移动(Locomotion)”**与**“吞噬(Capture)”**逻辑解耦。

**`move_logic` 完整配置参数：**

```json
"move_logic": {
    // A. 基础移动模式
    "move_mode": {
        // 枚举值: 
        // "ORTHOGONAL" (直走: 车/卒)
        // "DIAGONAL"   (斜走: 象/士)
        // "VECTOR"     (自定义坐标: 马)
        // "MIXED"      (混合)
        "type": "VECTOR", 
        
        // 坐标向量 (当 type=VECTOR 时必填)
        // [r, c]: [1, 2] 代表 row+1, col+2 (马步)
        "vectors": [[1, 2], [2, 1]], 
        
        // 自动对称 (Symmetry)
        // true: 自动生成四个象限的镜像坐标 (如马的8个落点)
        "symmetrical": true,
        
        // 步长限制 (Stride)
        // 1: 仅走一步 (马/士/象/兵)
        // -1: 无限距离 (车/炮)
        // N: 固定走 N 格
        "distance": 1,
        
        // 穿透能力 (Blocking)
        // false: 遇子即停 (会被蹩脚)
        // true: 无视障碍 (如：拐脚马 -> 天马)
        "ignore_block": false,
        "block_point": [0, 1] // 蹩脚点相对坐标 (如马腿)
    },
    
    // B. 吞噬模式 (可选，默认同移动模式)
    // 典型案例：炮 (移动时像车，吃子时要跳)
    "capture_mode": {
        "type": "JUMP", // "NORMAL"(同移动), "JUMP"(炮式隔打), "SWAP"(换位吃), "EXPLODE"(自爆)
        
        // 下面是 JUMP 模式专用参数
        "min_interval": 1, // 至少隔 1 个子 (普通炮)
        "max_interval": 1, // 最多隔 1 个子 (若为 -1 则不仅限隔一个)
        
        // 目标限制
        "can_eat_unprotected_only": false // true=只能吃无根子
    },

    // C. 特殊约束 (Constraints)
    "constraints": [
        "NO_BACKWARD", // 永远不可向后移动 (兵/卒)
        "RIVER_CROSSING_UPGRADE", // 过河后解除 NO_BACKWARD 限制 (只是能横走了)
        "LOCKED_PALACE" // 也就是九宫格限制 (士/帅)
    ]
}
```

**典型棋子配置示例：**

1.  **“石” (投石车 - 只能直走，隔2子打)**
    *   `move_mode`: `{ type: "ORTHOGONAL", distance: -1 }`
    *   `capture_mode`: `{ type: "JUMP", min_interval: 2, max_interval: 2 }`

2.  **“鬼” (幽灵马 - 马步，无视蹩脚)**
    *   `move_mode`: `{ type: "VECTOR", vectors: [[1,2]], symmetrical: true, ignore_block: true }`

3.  **“轀” (自定义 - 直走，不可后退，融合后)**
    *   `move_mode`: `{ type: "ORTHOGONAL", distance: -1 }`
    *   `constraints`: [`NO_BACKWARD`]

---

## 3. 核心算法：融合规则引擎 (`Fusion Engine`)

这是后端最复杂的模块，位于 `app/service/fusion_service.py`。

### 3.1 验证与融合逻辑伪代码

```python
class ChessFusionEngine:
    def __init__(self, rule_config: dict):
        self.rules = rule_config
        
    def validate_and_apply_move(self, board_state: dict, move: dict, player_color: str):
        """
        输入: 当前棋盘, 移动指令, 玩家颜色
        输出: (新棋盘, 事件列表, 错误信息)
        """
        start_pos = move['from']
        end_pos = move['to']
        piece = board_state.get(start_pos)
        target_piece = board_state.get(end_pos)
        
        # 1. 基础合法性 (轮次、棋子归属)
        if not piece or piece.color != player_color:
            return None, [], "Not your turn or invalid piece"
            
        # 2. 获取该棋子的移动逻辑 (Standard 或 Custom)
        piece_def = self.rules['piece_definitions'].get(str(piece.type_id))
        move_vectors = self._get_move_vectors(piece_def)
        
        # 3. 路径验证 (Path Blocking Check)
        if not self._check_path_clear(board_state, start_pos, end_pos, move_vectors):
            return None, [], "Path blocked or invalid move"

        # 4. 目标判定与融合检测 (Fusion Logic)
        events = []
        new_piece_type = piece.type_id
        
        if target_piece:
            if target_piece.color == player_color:
                # 尝试融合 (Eat Self)
                fusion_result = self._check_fusion_rule(piece.type_id, target_piece.type_id)
                if fusion_result:
                    new_piece_type = fusion_result['output_id']
                    events.append({
                        "type": "FUSION", 
                        "pos": end_pos, 
                        "effect": fusion_result['effect']
                    })
                else:
                    return None, [], "Cannot eat own piece without fusion rule"
            else:
                # 吃子 (Capture)
                events.append({"type": "CAPTURE", "captured": target_piece.type_id})
        
        # 5. 更新状态
        new_board = board_state.copy()
        new_board[start_pos] = None
        new_board[end_pos] = Piece(type_id=new_piece_type, color=player_color)
        
        return new_board, events, None

    def _check_fusion_rule(self, p1_id, p2_id):
        # 遍历 JSON 中的 fusion_rules 数组
        for rule in self.rules['fusion_logic']['rules']:
            # 检查集合是否匹配，无视顺序
            if set(rule['input']) == {p1_id, p2_id}:
                return rule
        return None
```

---

## 4. 通信协议：WebSocket 深度规范

### 4.1 错误代码表 (Error Codes)
当 `RESPONSE` 或 `ERROR` 消息返回时，使用标准错误码。

| 错误码 | 含义                | 处理建议                         |
| :----- | :------------------ | :------------------------------- |
| `1001` | Token 无效/过期     | 强制弹窗跳转登录页               |
| `2001` | 房间已满            | 提示用户不可加入                 |
| `2002` | 房间不存在          | 提示房间已解散                   |
| `3001` | 非法移动 (规则限制) | 前端回滚棋子位置，并显示红色警告 |
| `3002` | 不是你的回合        | 忽略或提示                       |
| `3003` | 融合条件不满足      | 提示“需要过河才能融合”等具体原因 |

### 4.2 完整消息生命周期示例

#### 场景：红方车(15) 移动并吃掉己方兵(17)，融合为轀(37)

**1. 客户端发送 (Request)**
```json
{
  "type": "MOVE",
  "seq": 15,
  "payload": {
    "from": 80, // 一维数组索引或 {r:9, c:0}
    "to": 81
  }
}
```

**2. 服务端广播 (Broadcast - Success)**
```json
{
  "type": "STATE_UPDATE",
  "timestamp": 1716182000,
  "data": {
    "red_remaining_time": 582,
    "last_move": {
      "from": 80,
      "to": 81,
      "color": "RED",
      "special_effect": "FUSION_FLASH" // 前端触发闪光特效
    },
    // 增量更新 (Differential Update) 以减少流量
    "diff": {
      "80": null,
      "81": 37 // 37 代表 轀
    },
    "current_fen": "..." // 同时提供完整 FEN 用于校准
  }
}
```

---

## 5. AI 系统适配详解 (AI Adaptation Logic)

为了让**现有 AI**（Alpha-Beta 搜索算法）能够理解用户自定义的规则，不仅需要告诉 AI 棋子值多少钱，更需要教会 AI **如何移动这些怪异的棋子**以及**为什么要去合成**。

### 5.1 动态走法生成：“让 AI 会走” (Dynamic Move Generation)
目前的 `moves.ts` 是硬编码的。我们需要将其改为**配置驱动 (Config-Driven)** 的通用生成器，以便 AI 能计算新棋子的攻击范围。

**适配逻辑 (伪代码):**

```javascript
// src/logic/GenericMoveGen.ts

function getMoves(board, r, c, pieceConfig) {
    const moves = [];
    const logic = pieceConfig.move_logic;

    // 1. 处理直走/直飞 (ORTHOGONAL / DIAGONAL)
    // 类似于车、炮、相
    if ( logic.move_mode.distance === -1 ) { // 无限距离
         // 遍历每个方向：上下左右 (或斜向)
         for (let dir of logic.move_mode.vectors) { 
             scanDirection(board, r, c, dir, logic, moves);
         }
    } 
    // 2. 处理跳跃/步进 (VECTOR)
    // 类似于马、士、兵
    else {
        for (let vec of logic.move_mode.vectors) {
            let nr = r + vec[0];
            let nc = c + vec[1];
            
            // 检查边界
            if (!isInBoard(nr, nc)) continue;
            
            // 检查蹩脚 (ignore_block)
            if (!logic.move_mode.ignore_block) {
                let br = r + logic.move_mode.block_point[0];
                let bc = c + logic.move_mode.block_point[1];
                if (board[br][bc] !== EMPTY) continue;
            }
            
            // 生成合法移动
            if (canLand(board, nr, nc, player.color)) {
                moves.push({from: [r,c], to: [nr,nc]});
            }
        }
    }
    return moves;
}
```
**实施要点：**
*   **前端改造**：在 `Board.ts` 初始化时，将 `NewGame.md` 2.2.3 节的 JSON 配置解析为内存对象。
*   **AI 调用**：AI 搜索每一层时，不再调用 `getHorseMoves()`，而是调用 `getMoves(..., customConfig)`。

### 5.2 估值与合成激励：“让 AI 想走” (Incentive & Valuation)
AI 本质是贪婪的。只要合成后的收益足够大，它就会像“贪吃子”一样去“贪合成”。

#### A. 价值顺差原则 (Value Surplus)
**公式：** `Value(新棋子) > Value(素材A) + Value(素材B) + 转移成本(50)`

*   **例子**：马(350) + 象(200) = 550。
*   **设定**：如果融合出的“骏”价值**远高于** 550（例如设定为 **1200**，接近车的价值），AI 会发现：
    *   保持现状：总分 550。
    *   执行融合：走一步后，总分变为 1200。
    *   **决策**：AI 会像“吃掉对方一个车”那样兴奋地去执行这步融合。

#### B. 搜索剪枝优化 (Search Heuristics)
为了防止合成步骤在深层搜索中被剪枝（Pruning）剪掉，必须提升其优先级。

**修改 `ai-helpers.ts` 中的 `generateMoves`：**
```javascript
function generateAllMoves(board, color) {
    let allMoves = [];
    
    // ... 生成所有常规移动 ...

    // 【关键】增加融合移动生成
    // 允许走到“己方”棋子上，前提是符合融合规则
    for (let p of myPieces) {
         let targets = getFusionTargets(p); // 查找能融合的己方目标
         for (let t of targets) {
             allMoves.push({
                 from: p.pos, 
                 to: t.pos, 
                 isFusion: true, 
                 scoreBonus: 10000 // 【PV 优先搜索】
             });
         }
    }
    
    // 排序：先搜融合，再搜吃子，最后搜普通移动
    allMoves.sort((a, b) => b.scoreBonus - a.scoreBonus);
    
    return allMoves;
}
```

### 5.3 进阶引擎优化 (Advanced Engine Optimizations)
为了确保 AI 在面对千奇百怪的自定义棋子时依然保持大师级水准，我们将现有的算法升级为**现代博弈引擎架构**。

#### 1. 动态搜索深度 (Dynamic Search Depth)
**机制**：随着棋局进行，棋子减少，搜索分支变少，AI 应看得更远。
*   **公式**：`CurrentDepth = BaseDepth + (32 - TotalPieces) / 4`
*   **适配融合版**：由于“融合”会显著加快棋子消耗速度（2合1），这套机制天然适配新玩法。
    *   *开局*：32子 -> 搜4层。
    *   *残局*：剩10子 -> 搜 4 + (22/4) ≈ **9层**（此时 AI 极其强力）。

#### 2. 重复局面检测 (Repetition Detection)
**目标**：防止 AI 在优势时来回“长捉”或劣势时无意义“闲着”。
*   **实现**：维护一个简单的 `PositionHistory` 栈。
*   **伪代码**：
    ```javascript
    if (history.includes(currentBoardHash)) {
        // 如果是单纯的重复局面，给予重罚，逼迫 AI 变招
        return -9999; 
    }
    // 针对“长将”判负逻辑，复用中国象棋标准规则
    ```

#### 3. 位置奖励与过河机制 (PST & River Bonus)
传统的“兵过河+30分”逻辑将升级为 **Configurable PST (Piece-Square Table)**。
*   **默认逻辑**：检测到 `move_logic.constraints` 包含 `NO_BACKWARD` 的棋子（类兵种），只要 `r < 5` (红方视角)，自动给予 **+30 过河奖励**，且越靠近九宫格分数越高。
*   **自定义逻辑**：在 `config_json` 中支持 `position_bonus` 字段，允许用户定义新棋子在特定区域（如对方底线）的额外加分。

#### 4. 启发式搜索增强 (Heuristics)
为了在有限时间内剪除更多无用分支（Pruning）：
*   **杀手走法 (Killer Moves)**：
    记录某一层深度中曾引发“由于太好而被剪枝”的走法。比如 AI 发现“跳马”能绝杀，下次搜到该深度时，**先试跳马**。
*   **历史启发 (History Heuristic)**：
    维护一张 `[90][90]` 的大表，记录所有“好棋”的起止点频率。
    *   *融合适配*：如果“车+炮=軳”这步操作在之前被判定为好棋，它的历史得分会极高，从而在后续搜索中被优先遍历。

### 5.4 总结：如何保证？
1.  **能力保证**：通过 **GenericMoveGen**，AI 知道“骏”能一下跳半个棋盘，能算出行棋路径。
2.  **动力保证**：通过 **价值顺差 (1200 > 550)**，AI 认为合成是极其赚的买卖。
3.  **计算保证**：通过 **PV 优先搜索** 以及 **杀手/历史启发**，将“融合”动作视为最高优先级的关键步，确保不会因为搜索深度不够而被忽略。


---

## 6. 异常与断线重连机制 (Resilience)

### 6.1 心跳检测
- **Server**: 每 15 秒发送 `{"type": "PING" }`。
- **Client**: 必须在 5 秒内回复 `{"type": "PONG"}`，否则断开连接。

### 6.2 断线重连流程
1.  **网络中断**: 客户端监测到 WS `onclose`。
2.  **自动重试**: 客户端进入 `RECONNECTING` 状态，每 2s 尝试重连（指数退避）。
3.  **连接恢复**:
    - 发送 `JOIN_ROOM` 消息，携带 `last_message_id`。
    - Server 检查 Redis。
    - 如果房间仍在且用户仍在列表中，返回 `SYNC_STATE` 消息，补发丢失的任何走子记录。
    - 如果房间已因超时销毁，返回错误 `ROOM_EXPIRED`。

---

## 7. 部署与环境

- **运行环境**: Python 3.10+, Redis 6.0+, MySQL 8.0+.
- **服务器依赖**: `uvicorn`, `fastapi`, `websockets`, `sqlalchemy`, `aioredis`.
- **并发策略**: 使用 `Gunicorn` 管理 Uvicorn workers，搭配 Nginx 反向代理 WebSocket (需配置 `Upgrade` 头)。
