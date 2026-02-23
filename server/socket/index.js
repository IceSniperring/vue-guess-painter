import { Server } from 'socket.io';
import { RoomService } from '../services/RoomService.js';

const rooms = new Map();

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('get-room-list', async () => {
      try {
        const roomList = [];
        for (const [roomCode, roomData] of rooms) {
          if (roomData.status === 'waiting' || roomData.status === 'playing') {
            roomList.push({
              room_code: roomCode,
              host_name: roomData.host_name || '未知',
              max_players: roomData.max_players || 8,
              status: roomData.status,
              player_count: roomData.players?.length || 0
            });
          }
        }
        socket.emit('room-list', { rooms: roomList });
      } catch (error) {
        socket.emit('room-error', { message: error.message });
      }
    });

    socket.on('create-room', async (data) => {
      try {
        const { targetWord, hostName } = data;
        const room = await RoomService.createRoom(socket.id, hostName, targetWord);
        
        socket.join(room.room_code);
        rooms.set(room.room_code, { 
          ...room, 
          draw_history: [],
          strokes: [],
          current_stroke: [],
          players: [{ socket_id: socket.id, player_name: hostName, is_host: true }],
          votes: {},
          voteTimer: null
        });

        socket.emit('room-created', {
          roomCode: room.room_code,
          room: { ...room, targetWord }
        });

        console.log(`[Room] Created: ${room.room_code} by ${hostName}`);
      } catch (error) {
        socket.emit('room-error', { message: error.message });
      }
    });

    socket.on('join-room', async (data) => {
      try {
        const { roomCode, playerName } = data;
        const room = await RoomService.getRoomByCode(roomCode);

        if (!room) {
          socket.emit('room-error', { message: '房间号不存在' });
          return;
        }

        const players = await RoomService.getPlayersByRoomId(room.id);
        if (players.length >= room.max_players) {
          socket.emit('room-error', { message: '房间人数已满，无法加入' });
          return;
        }

        await RoomService.addPlayer(room.id, socket.id, playerName);
        
        socket.join(roomCode);
        const updatedPlayers = await RoomService.getPlayersByRoomId(room.id);
        
        let roomData = rooms.get(roomCode);
        if (!roomData) {
          roomData = { 
            ...room, 
            draw_history: [],
            strokes: [],
            current_stroke: [],
            players: updatedPlayers, 
            votes: {},
            voteTimer: null 
          };
          rooms.set(roomCode, roomData);
        }
        roomData.players = updatedPlayers;

        socket.emit('room-joined', {
          room: roomData,
          players: updatedPlayers,
          isHost: false,
          drawHistory: roomData.strokes || []
        });

        io.to(roomCode).emit('player-joined', {
          player: { socket_id: socket.id, player_name: playerName, is_host: false },
          count: updatedPlayers.length
        });

        console.log(`[Room] ${playerName} joined ${roomCode}, strokes: ${roomData.strokes?.length || 0}`);
      } catch (error) {
        socket.emit('room-error', { message: error.message });
      }
    });

    socket.on('start-game', async (data) => {
      try {
        const { roomCode } = data;
        const roomData = rooms.get(roomCode);
        
        if (!roomData || roomData.host_id !== socket.id) {
          socket.emit('room-error', { message: '只有房主可以开始游戏' });
          return;
        }

        await RoomService.updateRoomStatus(roomData.id, 'playing');
        roomData.status = 'playing';
        
        socket.emit('game-started', {
          targetWord: roomData.target_word
        });
        
        socket.to(roomCode).emit('game-started', {
          targetWord: null
        });

        console.log(`[Game] Started in room ${roomCode}`);
      } catch (error) {
        socket.emit('room-error', { message: error.message });
      }
    });

    socket.on('draw', async (data) => {
      try {
        const { roomCode, drawData } = data;
        const roomData = rooms.get(roomCode);
        
        if (!roomData) return;

        roomData.draw_history = roomData.draw_history || [];
        roomData.current_stroke = roomData.current_stroke || [];

        if (drawData.type === 'segment') {
          roomData.current_stroke.push(drawData);
          roomData.draw_history.push(drawData);
        } else if (drawData.type === 'stroke-end') {
          if (roomData.current_stroke.length > 0) {
            roomData.strokes = roomData.strokes || [];
            roomData.strokes.push([...roomData.current_stroke]);
            roomData.current_stroke = [];
          }
        } else if (drawData.type === 'clear') {
          roomData.strokes = [];
          roomData.current_stroke = [];
          roomData.draw_history = [];
        } else if (drawData.type === 'undo') {
          roomData.strokes = roomData.strokes || [];
          if (roomData.strokes.length > 0) {
            roomData.strokes.pop();
            roomData.draw_history = [];
            for (const stroke of roomData.strokes) {
              roomData.draw_history.push(...stroke);
            }
          }
        }
        
        socket.to(roomCode).emit('draw-sync', { drawData });
      } catch (error) {
        console.error('[Draw] Error:', error);
      }
    });

    socket.on('submit-answer', async (data) => {
      try {
        const { roomCode, answer } = data;
        const roomData = rooms.get(roomCode);
        
        if (!roomData || roomData.status !== 'playing') return;

        const player = roomData.players?.find(p => p.socket_id === socket.id);
        if (!player) return;

        socket.emit('answer-submitted', { playerName: player.player_name });

        if (answer.trim() === roomData.target_word.trim()) {
          roomData.status = 'waiting';
          await RoomService.updateRoomStatus(roomData.id, 'waiting');
          
          io.to(roomCode).emit('correct-answer', { 
            playerName: player.player_name,
            targetWord: roomData.target_word
          });

          console.log(`[Game] ${player.player_name} guessed correctly in ${roomCode}`);
        }
      } catch (error) {
        console.error('[Answer] Error:', error);
      }
    });

    socket.on('end-game', async (data) => {
      try {
        const { roomCode } = data;
        const roomData = rooms.get(roomCode);
        
        if (!roomData || roomData.host_id !== socket.id) {
          socket.emit('room-error', { message: '只有房主可以结束游戏' });
          return;
        }

        roomData.status = 'waiting';
        await RoomService.updateRoomStatus(roomData.id, 'waiting');
        
        io.to(roomCode).emit('game-ended', {});

        console.log(`[Game] Ended in room ${roomCode}`);
      } catch (error) {
        socket.emit('room-error', { message: error.message });
      }
    });

    socket.on('start-vote', async (data) => {
      try {
        const { roomCode } = data;
        const roomData = rooms.get(roomCode);
        
        if (!roomData || roomData.host_id !== socket.id) {
          socket.emit('room-error', { message: '只有房主可以发起投票' });
          return;
        }

        const candidates = roomData.players?.filter(p => !p.is_host) || [];
        
        if (candidates.length === 0) {
          socket.emit('room-error', { message: '无猜题者可投票，房主身份不变' });
          return;
        }

        roomData.status = 'voting';
        roomData.votes = {};
        roomData.voteStartTime = Date.now();
        
        io.to(roomCode).emit('vote-started', {
          candidates,
          duration: 30
        });

        if (roomData.voteTimer) {
          clearTimeout(roomData.voteTimer);
        }

        roomData.voteTimer = setTimeout(async () => {
          await handleVoteEnd(io, roomCode);
        }, 30000);

        console.log(`[Vote] Started in room ${roomCode}`);
      } catch (error) {
        socket.emit('room-error', { message: error.message });
      }
    });

    socket.on('vote', async (data) => {
      try {
        const { roomCode, candidateId } = data;
        const roomData = rooms.get(roomCode);
        
        if (!roomData || roomData.status !== 'voting') return;
        if (!roomData.votes) roomData.votes = {};

        roomData.votes[socket.id] = candidateId;

        io.to(roomCode).emit('vote-updated', {
          votes: roomData.votes,
          voterId: socket.id
        });
      } catch (error) {
        console.error('[Vote] Error:', error);
      }
    });

    socket.on('leave-room', async (data) => {
      await handleLeaveRoom(io, socket, data.roomCode);
    });

    socket.on('disconnect', async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      
      const player = await RoomService.getPlayerBySocketId(socket.id);
      if (player) {
        const room = await RoomService.getRoomById(player.room_id);
        if (room) {
          await handleLeaveRoom(io, socket, room.room_code);
        }
      }
    });
  });
}

async function handleLeaveRoom(io, socket, roomCode) {
  if (!roomCode) return;
  
  const roomData = rooms.get(roomCode);
  if (!roomData) return;

  const player = roomData.players?.find(p => p.socket_id === socket.id);
  if (!player) return;

  if (player.is_host) {
    await RoomService.deleteRoom(roomData.id);
    rooms.delete(roomCode);
    
    io.to(roomCode).emit('room-closed', { message: '房主已退出，房间关闭' });
    console.log(`[Room] ${roomCode} closed by host`);
  } else {
    await RoomService.removePlayer(socket.id);
    const updatedPlayers = await RoomService.getPlayersByRoomId(roomData.id);
    roomData.players = updatedPlayers;
    
    io.to(roomCode).emit('player-left', {
      playerName: player.player_name,
      count: updatedPlayers.length
    });
    console.log(`[Room] ${player.player_name} left ${roomCode}`);
  }
}

async function handleVoteEnd(io, roomCode) {
  const roomData = rooms.get(roomCode);
  if (!roomData || roomData.status !== 'voting') return;

  const voteCounts = {};
  for (const candidateId of Object.values(roomData.votes || {})) {
    voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
  }

  const candidates = roomData.players?.filter(p => !p.is_host) || [];
  let maxVotes = 0;
  let winner = null;

  for (const candidate of candidates) {
    const votes = voteCounts[candidate.socket_id] || 0;
    if (votes > maxVotes) {
      maxVotes = votes;
      winner = candidate;
    } else if (votes === maxVotes && votes > 0) {
      if (Math.random() > 0.5) {
        winner = candidate;
      }
    }
  }

  if (winner) {
    await RoomService.updateHost(roomData.id, winner.socket_id);
    roomData.host_id = winner.socket_id;
    roomData.status = 'waiting';
    
    for (const p of roomData.players) {
      p.is_host = p.socket_id === winner.socket_id;
    }

    io.to(roomCode).emit('vote-ended', {
      newHost: winner,
      results: voteCounts
    });

    console.log(`[Vote] ${winner.player_name} became new host in ${roomCode}`);
  } else {
    roomData.status = 'waiting';
    io.to(roomCode).emit('vote-ended', {
      newHost: null,
      results: voteCounts,
      message: '无有效投票，房主身份不变'
    });
  }
}
