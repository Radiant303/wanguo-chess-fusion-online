"""
AIMAX 象棋联机服务器
基于 WebSocket 实现真正的跨设备联机对战
"""

import asyncio
import json
import websockets
from typing import Dict, Set, Optional
from dataclasses import dataclass, field
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 服务器配置
HOST = "0.0.0.0"  # 监听所有网络接口
PORT = 9191


@dataclass
class Player:
    """玩家信息"""
    websocket: websockets.WebSocketServerProtocol
    color: Optional[str] = None  # 'red' 或 'black'
    name: str = "玩家"


@dataclass
class Room:
    """房间信息"""
    id: str
    host: Player
    guest: Optional[Player] = None
    game_started: bool = False
    
    @property
    def is_full(self) -> bool:
        return self.guest is not None
    
    @property
    def players(self) -> list:
        players = [self.host]
        if self.guest:
            players.append(self.guest)
        return players


class ChessServer:
    """象棋联机服务器"""
    
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.player_room: Dict[websockets.WebSocketServerProtocol, str] = {}
    
    async def register(self, websocket: websockets.WebSocketServerProtocol):
        """新玩家连接"""
        logger.info(f"新玩家连接: {websocket.remote_address}")
    
    async def unregister(self, websocket: websockets.WebSocketServerProtocol):
        """玩家断开连接"""
        logger.info(f"玩家断开: {websocket.remote_address}")
        
        # 查找并处理该玩家所在的房间
        if websocket in self.player_room:
            room_id = self.player_room[websocket]
            await self.leave_room(websocket, room_id, notify=True)
    
    async def create_room(self, websocket: websockets.WebSocketServerProtocol, room_id: str):
        """创建房间"""
        if room_id in self.rooms:
            await self.send_message(websocket, {
                "type": "error",
                "message": "房间已存在，请更换房间号"
            })
            return
        
        player = Player(websocket=websocket, color="red", name="房主")
        room = Room(id=room_id, host=player)
        self.rooms[room_id] = room
        self.player_room[websocket] = room_id
        
        logger.info(f"房间创建: {room_id}")
        
        await self.send_message(websocket, {
            "type": "room_created",
            "roomId": room_id,
            "color": "red"
        })
    
    async def join_room(self, websocket: websockets.WebSocketServerProtocol, room_id: str):
        """加入房间"""
        if room_id not in self.rooms:
            await self.send_message(websocket, {
                "type": "error",
                "message": "房间不存在"
            })
            return
        
        room = self.rooms[room_id]
        
        if room.is_full:
            await self.send_message(websocket, {
                "type": "error",
                "message": "房间已满"
            })
            return
        
        player = Player(websocket=websocket, color="black", name="对手")
        room.guest = player
        self.player_room[websocket] = room_id
        
        logger.info(f"玩家加入房间: {room_id}")
        
        # 通知加入者
        await self.send_message(websocket, {
            "type": "join_accepted",
            "roomId": room_id,
            "color": "black"
        })
        
        # 通知房主
        await self.send_message(room.host.websocket, {
            "type": "opponent_joined",
            "roomId": room_id
        })
        
        # 游戏开始
        room.game_started = True
        await self.broadcast_to_room(room_id, {
            "type": "game_start",
            "message": "游戏开始！红方先行"
        })
    
    async def leave_room(self, websocket: websockets.WebSocketServerProtocol, room_id: str, notify: bool = True):
        """离开房间"""
        if room_id not in self.rooms:
            return
        
        room = self.rooms[room_id]
        
        # 移除玩家与房间的关联
        if websocket in self.player_room:
            del self.player_room[websocket]
        
        # 通知对手并清理房间
        if room.host.websocket == websocket:
            # 房主离开，通知客人并关闭房间
            if room.guest and notify:
                await self.send_message(room.guest.websocket, {
                    "type": "opponent_disconnected",
                    "message": "房主已离开，游戏结束"
                })
                if room.guest.websocket in self.player_room:
                    del self.player_room[room.guest.websocket]
            del self.rooms[room_id]
            logger.info(f"房间关闭: {room_id}")
        elif room.guest and room.guest.websocket == websocket:
            # 客人离开
            if notify:
                await self.send_message(room.host.websocket, {
                    "type": "opponent_disconnected",
                    "message": "对手已离开"
                })
            room.guest = None
            room.game_started = False
            logger.info(f"客人离开房间: {room_id}")
    
    async def handle_move(self, websocket: websockets.WebSocketServerProtocol, move: dict):
        """处理走棋"""
        if websocket not in self.player_room:
            return
        
        room_id = self.player_room[websocket]
        room = self.rooms.get(room_id)
        
        if not room or not room.is_full:
            return
        
        # 转发给对手
        if room.host.websocket == websocket:
            await self.send_message(room.guest.websocket, {
                "type": "move",
                "move": move
            })
        elif room.guest.websocket == websocket:
            await self.send_message(room.host.websocket, {
                "type": "move",
                "move": move
            })
    
    async def handle_chat(self, websocket: websockets.WebSocketServerProtocol, message: str):
        """处理聊天消息"""
        if websocket not in self.player_room:
            return
        
        room_id = self.player_room[websocket]
        room = self.rooms.get(room_id)
        
        if not room:
            return
        
        # 转发给对手
        if room.host.websocket == websocket:
            if room.guest:
                await self.send_message(room.guest.websocket, {
                    "type": "chat",
                    "message": message,
                    "from": "opponent"
                })
        elif room.guest and room.guest.websocket == websocket:
            await self.send_message(room.host.websocket, {
                "type": "chat",
                "message": message,
                "from": "opponent"
            })
    
    async def handle_restart_request(self, websocket: websockets.WebSocketServerProtocol):
        """处理重新开始请求"""
        if websocket not in self.player_room:
            return
        
        room_id = self.player_room[websocket]
        room = self.rooms.get(room_id)
        
        if not room or not room.is_full:
            return
        
        # 转发给对手
        if room.host.websocket == websocket:
            await self.send_message(room.guest.websocket, {
                "type": "restart_request"
            })
        elif room.guest.websocket == websocket:
            await self.send_message(room.host.websocket, {
                "type": "restart_request"
            })
    
    async def handle_restart_accept(self, websocket: websockets.WebSocketServerProtocol):
        """处理同意重新开始"""
        if websocket not in self.player_room:
            return
        
        room_id = self.player_room[websocket]
        await self.broadcast_to_room(room_id, {
            "type": "restart_accepted"
        })
    
    async def send_message(self, websocket: websockets.WebSocketServerProtocol, data: dict):
        """发送消息给指定玩家"""
        try:
            await websocket.send(json.dumps(data, ensure_ascii=False))
        except websockets.exceptions.ConnectionClosed:
            pass
    
    async def broadcast_to_room(self, room_id: str, data: dict):
        """广播消息给房间内所有玩家"""
        if room_id not in self.rooms:
            return
        
        room = self.rooms[room_id]
        for player in room.players:
            await self.send_message(player.websocket, data)
    
    async def handler(self, websocket: websockets.WebSocketServerProtocol):
        """WebSocket 连接处理器"""
        await self.register(websocket)
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")
                    
                    if msg_type == "create_room":
                        await self.create_room(websocket, data.get("roomId"))
                    
                    elif msg_type == "join_room":
                        await self.join_room(websocket, data.get("roomId"))
                    
                    elif msg_type == "leave_room":
                        room_id = self.player_room.get(websocket)
                        if room_id:
                            await self.leave_room(websocket, room_id)
                    
                    elif msg_type == "move":
                        await self.handle_move(websocket, data.get("move"))
                    
                    elif msg_type == "chat":
                        await self.handle_chat(websocket, data.get("message"))
                    
                    elif msg_type == "restart_request":
                        await self.handle_restart_request(websocket)
                    
                    elif msg_type == "restart_accept":
                        await self.handle_restart_accept(websocket)
                    
                    elif msg_type == "ping":
                        await self.send_message(websocket, {"type": "pong"})
                    
                except json.JSONDecodeError:
                    logger.warning(f"无效的JSON消息: {message}")
                except Exception as e:
                    logger.error(f"处理消息时出错: {e}")
        
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)


async def main():
    """启动服务器"""
    server = ChessServer()
    
    async with websockets.serve(
        server.handler,
        HOST,
        PORT,
        ping_interval=30,
        ping_timeout=10
    ):
        logger.info(f"象棋联机服务器已启动")
        logger.info(f"监听地址: ws://{HOST}:{PORT}")
        logger.info(f"本机地址: ws://localhost:{PORT}")
        logger.info("按 Ctrl+C 停止服务器")
        
        await asyncio.Future()  # 永久运行


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("服务器已停止")
