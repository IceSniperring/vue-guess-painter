import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '192.168.31.200',
  port: 3306,
  user: 'guess-painter',
  password: 'p5BZRbB8REs4AxRR',
  database: 'guess-painter',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_code VARCHAR(6) NOT NULL UNIQUE,
        host_id VARCHAR(64) NOT NULL,
        host_name VARCHAR(50) NOT NULL,
        target_word VARCHAR(100),
        status ENUM('waiting', 'playing', 'voting') DEFAULT 'waiting',
        max_players INT DEFAULT 8,
        draw_history JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_room_code (room_code)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        socket_id VARCHAR(64) NOT NULL,
        player_name VARCHAR(50) NOT NULL,
        is_host BOOLEAN DEFAULT FALSE,
        is_online BOOLEAN DEFAULT TRUE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        voter_id INT NOT NULL,
        candidate_id INT NOT NULL,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS game_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        target_word VARCHAR(100),
        winner_id INT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        duration INT,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `);

    console.log('[Database] Tables initialized successfully');
  } catch (error) {
    console.error('[Database] Init error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
