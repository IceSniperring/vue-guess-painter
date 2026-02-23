import pool from '../config/database.js';

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateUniqueRoomCode() {
  let code;
  do {
    code = generateRoomCode();
  } while (false);
  return code;
}

export const RoomService = {
  async createRoom(hostId, hostName, targetWord, maxPlayers = 8) {
    const roomCode = generateRoomCode();
    
    const [result] = await pool.query(
      `INSERT INTO rooms (room_code, host_id, host_name, target_word, max_players, draw_history) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [roomCode, hostId, hostName, targetWord, maxPlayers, JSON.stringify([])]
    );

    const roomId = result.insertId;

    await pool.query(
      `INSERT INTO players (room_id, socket_id, player_name, is_host) VALUES (?, ?, ?, ?)`,
      [roomId, hostId, hostName, true]
    );

    return this.getRoomById(roomId);
  },

  async getRoomByCode(roomCode) {
    const [rooms] = await pool.query(
      `SELECT * FROM rooms WHERE room_code = ?`,
      [roomCode]
    );
    return rooms[0] || null;
  },

  async getRoomById(roomId) {
    const [rooms] = await pool.query(
      `SELECT * FROM rooms WHERE id = ?`,
      [roomId]
    );
    return rooms[0] || null;
  },

  async getPlayersByRoomId(roomId) {
    const [players] = await pool.query(
      `SELECT * FROM players WHERE room_id = ? AND is_online = TRUE`,
      [roomId]
    );
    return players;
  },

  async getPlayerBySocketId(socketId) {
    const [players] = await pool.query(
      `SELECT * FROM players WHERE socket_id = ?`,
      [socketId]
    );
    return players[0] || null;
  },

  async getAllActiveRooms() {
    const [rooms] = await pool.query(
      `SELECT r.*, COUNT(DISTINCT p.socket_id) as player_count 
       FROM rooms r 
       LEFT JOIN players p ON r.id = p.room_id AND p.is_online = TRUE 
       WHERE r.status IN ('waiting', 'playing')
       GROUP BY r.id
       ORDER BY r.created_at DESC`
    );
    return rooms;
  },

  async addPlayer(roomId, socketId, playerName) {
    const room = await this.getRoomById(roomId);
    if (!room) throw new Error('Room not found');

    const players = await this.getPlayersByRoomId(roomId);
    if (players.length >= room.max_players) {
      throw new Error('Room is full');
    }

    const isHost = players.length === 0;

    await pool.query(
      `INSERT INTO players (room_id, socket_id, player_name, is_host) VALUES (?, ?, ?, ?)`,
      [roomId, socketId, playerName, isHost]
    );

    return this.getPlayerBySocketId(socketId);
  },

  async removePlayer(socketId) {
    const player = await this.getPlayerBySocketId(socketId);
    if (!player) return null;

    await pool.query(`UPDATE players SET is_online = FALSE WHERE socket_id = ?`, [socketId]);
    return player;
  },

  async deletePlayer(socketId) {
    const player = await this.getPlayerBySocketId(socketId);
    if (!player) return null;

    await pool.query(`DELETE FROM players WHERE socket_id = ?`, [socketId]);
    return player;
  },

  async updateRoomStatus(roomId, status) {
    await pool.query(
      `UPDATE rooms SET status = ? WHERE id = ?`,
      [status, roomId]
    );
  },

  async updateTargetWord(roomId, targetWord) {
    await pool.query(
      `UPDATE rooms SET target_word = ? WHERE id = ?`,
      [targetWord, roomId]
    );
  },

  async updateHost(roomId, newHostId) {
    await pool.query(
      `UPDATE players SET is_host = FALSE WHERE room_id = ?`,
      [roomId]
    );
    await pool.query(
      `UPDATE players SET is_host = TRUE WHERE socket_id = ?`,
      [newHostId]
    );
    await pool.query(
      `UPDATE rooms SET host_id = ? WHERE id = ?`,
      [newHostId, roomId]
    );
  },

  async saveDrawHistory(roomId, drawHistory) {
    await pool.query(
      `UPDATE rooms SET draw_history = ? WHERE id = ?`,
      [JSON.stringify(drawHistory), roomId]
    );
  },

  async deleteRoom(roomId) {
    await pool.query(`DELETE FROM rooms WHERE id = ?`, [roomId]);
  },

  async addVote(roomId, voterId, candidateId) {
    const existing = await pool.query(
      `SELECT * FROM votes WHERE room_id = ? AND voter_id = ?`,
      [roomId, voterId]
    );
    
    if (existing[0].length > 0) {
      await pool.query(
        `UPDATE votes SET candidate_id = ? WHERE room_id = ? AND voter_id = ?`,
        [candidateId, roomId, voterId]
      );
    } else {
      await pool.query(
        `INSERT INTO votes (room_id, voter_id, candidate_id) VALUES (?, ?, ?)`,
        [roomId, voterId, candidateId]
      );
    }
  },

  async getVotes(roomId) {
    const [votes] = await pool.query(
      `SELECT * FROM votes WHERE room_id = ?`,
      [roomId]
    );
    return votes;
  },

  async clearVotes(roomId) {
    await pool.query(`DELETE FROM votes WHERE room_id = ?`, [roomId]);
  }
};
