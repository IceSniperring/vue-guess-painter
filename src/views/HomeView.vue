<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import { useSocket } from '@/composables/useSocket';
import { Users, Plus, LogIn, RefreshCw, User } from 'lucide-vue-next';

const { socket, connect, on, off } = useSocket();

const mode = ref('home');
const roomCode = ref('');
const playerName = ref('');
const targetWord = ref('');
const error = ref('');
const loading = ref(false);
const roomList = ref([]);

const emit = defineEmits(['create-room', 'join-room']);

const handleCreate = () => {
  if (!playerName.value.trim()) {
    error.value = '请输入您的昵称';
    return;
  }
  if (!targetWord.value.trim()) {
    error.value = '请输入猜题目标';
    return;
  }
  error.value = '';
  emit('create-room', { playerName: playerName.value, targetWord: targetWord.value });
};

const handleJoin = () => {
  if (!playerName.value.trim()) {
    error.value = '请输入您的昵称';
    return;
  }
  if (!roomCode.value.trim() || roomCode.value.length !== 6) {
    error.value = '请输入6位房间号';
    return;
  }
  error.value = '';
  emit('join-room', { playerName: playerName.value, roomCode: roomCode.value });
};

const handleJoinByRoom = (room) => {
  if (!playerName.value.trim()) {
    error.value = '请先输入您的昵称';
    return;
  }
  error.value = '';
  emit('join-room', { playerName: playerName.value, roomCode: room.room_code });
};

const fetchRoomList = () => {
  if (socket.value?.connected) {
    socket.value.emit('get-room-list');
  }
};

const initSocket = () => {
  connect();
  
  setTimeout(() => {
    if (socket.value?.connected) {
      socket.value.emit('get-room-list');
    }
  }, 500);
  
  socket.value?.on('room-list', (data) => {
    roomList.value = data.rooms || [];
  });
  
  socket.value?.on('room-created', () => {
    fetchRoomList();
  });
  
  socket.value?.on('room-joined', () => {
    fetchRoomList();
  });
  
  socket.value?.on('room-closed', () => {
    fetchRoomList();
  });
  
  socket.value?.on('game-ended', () => {
    fetchRoomList();
  });
};

const goToCreate = () => {
  if (!playerName.value.trim()) {
    error.value = '请先输入您的昵称';
    mode.value = 'create';
    return;
  }
  mode.value = 'create';
};

const goToJoin = () => {
  if (!playerName.value.trim()) {
    error.value = '请先输入您的昵称';
    mode.value = 'join';
    return;
  }
  mode.value = 'join';
};

onMounted(() => {
  initSocket();
});

onUnmounted(() => {
  off('room-list');
  off('room-created');
  off('room-joined');
  off('room-closed');
  off('game-ended');
});
</script>

<template>
  <div class="home-view">
    <div class="home-bg-pattern"></div>
    
    <div class="home-container">
      <div class="home-header">
        <div class="logo-icon-large">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="24" fill="var(--accent)"/>
            <path d="M25 62C25 62 38 38 50 38C62 38 75 62 75 62" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <circle cx="38" cy="50" r="5" fill="white"/>
            <circle cx="62" cy="50" r="5" fill="white"/>
            <path d="M44 68C44 68 50 75 56 68" stroke="white" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="home-title">你画我猜</h1>
        <p class="home-subtitle">多人在线绘画猜词游戏</p>
      </div>

      <div class="name-input-section">
        <label class="input-label">
          <Users :size="18" />
          您的昵称
        </label>
        <Input 
          v-model="playerName" 
          placeholder="请输入昵称" 
          :disabled="loading"
          @focus="error = ''"
        />
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>

      <div v-if="mode === 'home'" class="main-actions">
        <div class="action-cards">
          <div class="action-card create-card" @click="goToCreate">
            <div class="card-icon">
              <Plus :size="32" />
            </div>
            <div class="card-content">
              <h3>创建房间</h3>
              <p>创建新房间并成为房主</p>
            </div>
          </div>

          <div class="action-card join-card" @click="goToJoin">
            <div class="card-icon">
              <LogIn :size="32" />
            </div>
            <div class="card-content">
              <h3>加入房间</h3>
              <p>输入房间号加入游戏</p>
            </div>
          </div>
        </div>

        <div v-if="roomList.length > 0" class="room-list-container">
          <h3 class="room-list-title">可用房间</h3>
          <div class="room-list">
            <div 
              v-for="room in roomList" 
              :key="room.room_code" 
              class="room-item"
              @click="handleJoinByRoom(room)"
            >
              <div class="room-left">
                <div class="room-code-display">
                  <span 
                    v-for="(digit, index) in room.room_code.split('')" 
                    :key="index" 
                    class="digit"
                  >{{ digit }}</span>
                </div>
                <div class="room-host">
                  <User :size="12" class="host-icon" />
                  {{ room.host_name }}
                </div>
              </div>
              <div class="room-right">
                <div class="player-count">
                  <span class="count-num">{{ room.player_count }}</span>
                  <span class="count-divider">/</span>
                  <span class="count-max">{{ room.max_players }}</span>
                </div>
                <span class="room-status" :class="room.status">
                  {{ room.status === 'playing' ? '进行中' : '等待中' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="home-form">
        <div v-if="mode === 'create'" class="form-group">
          <label class="form-label">猜题目标</label>
          <Input 
            v-model="targetWord" 
            placeholder="请输入本轮猜题目标（如：小猫）" 
            :disabled="loading"
          />
          <p class="form-hint">其他人需要猜测这个词</p>
        </div>

        <div v-if="mode === 'join'" class="form-group">
          <label class="form-label">房间号</label>
          <Input 
            v-model="roomCode" 
            placeholder="请输入6位房间号" 
            maxlength="6"
            :disabled="loading"
          />
        </div>

        <div class="form-actions">
          <Button variant="default" size="medium" @click="mode = 'home'" :disabled="loading">
            返回
          </Button>
          <Button 
            v-if="mode === 'create'" 
            variant="primary" 
            size="medium" 
            @click="handleCreate"
            :disabled="loading"
          >
            创建房间
          </Button>
          <Button 
            v-if="mode === 'join'" 
            variant="primary" 
            size="medium" 
            @click="handleJoin"
            :disabled="loading"
          >
            加入房间
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Users, Plus, LogIn, RefreshCw } from 'lucide-vue-next';
export default {
  components: { Users, Plus, LogIn, RefreshCw, User }
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: visible;
}

.home-bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(0, 122, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(88, 86, 214, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(52, 199, 89, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.home-container {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
  overflow: visible;
}

.home-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon-large {
  margin-bottom: 16px;
  filter: drop-shadow(0 8px 24px rgba(0, 122, 255, 0.3));
}

.home-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.home-subtitle {
  font-size: 16px;
  color: var(--text-tertiary);
}

.name-input-section {
  margin-bottom: 24px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-error {
  font-size: 14px;
  color: var(--accent-red);
  margin-bottom: 16px;
  text-align: center;
}

.main-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.create-card:hover {
  border-color: var(--accent);
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, var(--bg-card) 100%);
}

.join-card:hover {
  border-color: var(--accent-green);
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.08) 0%, var(--bg-card) 100%);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.create-card .card-icon {
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  color: white;
}

.join-card .card-icon {
  background: linear-gradient(135deg, #34C759 0%, #30D158 100%);
  color: white;
}

.card-content h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-content p {
  font-size: 12px;
  color: var(--text-tertiary);
}

.room-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-list-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-left: 4px;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.room-list::-webkit-scrollbar {
  width: 4px;
}

.room-list::-webkit-scrollbar-track {
  background: transparent;
}

.room-list::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 2px;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.room-item:hover {
  transform: translateX(4px);
  border-color: var(--accent-orange);
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.08) 0%, var(--bg-secondary) 100%);
}

.room-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.room-code-display {
  display: flex;
  gap: 4px;
}

.digit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 32px;
  padding: 0 5px;
  background: linear-gradient(180deg, #3A3A3C 0%, #1C1C1E 100%);
  border-radius: 6px;
  font-size: 20px;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

.room-host {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.host-icon {
  color: var(--text-tertiary);
}

.room-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.player-count {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.count-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
}

.count-divider {
  font-size: 14px;
  color: var(--text-tertiary);
}

.count-max {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.room-status {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.room-status.waiting {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.room-status.playing {
  background: rgba(255, 149, 0, 0.15);
  color: #FF9500;
}

.home-form {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--card-shadow);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.form-actions button {
  flex: 1;
}
</style>
