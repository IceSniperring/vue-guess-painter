<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Toast from '@/components/common/Toast.vue';
import { useSocket } from '@/composables/useSocket';
import { useGame } from '@/composables/useGame';

const props = defineProps({
  socketUrl: {
    type: String,
    default: 'http://localhost:3001'
  }
});

const emit = defineEmits(['leave']);

const { socket, connected, connect, disconnect, emit: socketEmit, on: socketOn, off: socketOff } = useSocket();
const { 
  room, players, isHost, gameStatus, targetWord, drawHistory, 
  votes, candidates, voteTimeLeft,
  roomCode, hostName, playerCount, maxPlayers,
  setRoom, setPlayers, setIsHost, updateGameStatus, setTargetWord,
  addDrawData, clearDrawHistory, setVotes, setCandidates, setVoteTimeLeft, reset
} = useGame();

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('info');

const showCreateModal = ref(false);
const showVoteModal = ref(false);
const showCorrectModal = ref(false);
const correctPlayerName = ref('');
const showVoteResultModal = ref(false);
const newHost = ref(null);

const answer = ref('');
const answerError = ref('');
const answerSubmitted = ref(false);

const canvasRef = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const lastPos = ref({ x: 0, y: 0 });

const drawingColor = ref('#000000');
const drawingWidth = ref(3);
const history = ref([]);
const historyIndex = ref(-1);

const voteCountdown = ref(30);
let voteTimer = null;

const initCanvas = () => {
  if (!canvasRef.value) return;
  ctx.value = canvasRef.value.getContext('2d');
  ctx.value.lineCap = 'round';
  ctx.value.lineJoin = 'round';
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, 800, 600);
};

const startDrawing = (e) => {
  console.log('[Draw] startDrawing called, isHost:', isHost.value, 'gameStatus:', gameStatus.value);
  if (!isHost.value || gameStatus.value !== 'playing') {
    isDrawing.value = false;
    return;
  }
  isDrawing.value = true;
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;
  lastPos.value = {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
};

const draw = (e) => {
  if (!isDrawing.value || !ctx.value || !lastPos.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;
  const currentPos = {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };

  ctx.value.strokeStyle = drawingColor.value;
  ctx.value.lineWidth = drawingWidth.value;
  ctx.value.beginPath();
  ctx.value.moveTo(lastPos.value.x, lastPos.value.y);
  ctx.value.lineTo(currentPos.x, currentPos.y);
  ctx.value.stroke();

  const drawData = {
    type: 'draw',
    from: { ...lastPos.value },
    to: currentPos,
    color: drawingColor.value,
    width: drawingWidth.value
  };

  socketEmit('draw', { roomCode: roomCode.value, drawData });
  
  lastPos.value = currentPos;
};

const stopDrawing = () => {
  if (isDrawing.value) {
    isDrawing.value = false;
    saveHistory();
  }
};

const saveHistory = () => {
  const imageData = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height);
  history.value = history.value.slice(0, historyIndex.value + 1);
  history.value.push(imageData);
  historyIndex.value = history.value.length - 1;
};

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    ctx.value.putImageData(history.value[historyIndex.value], 0, 0);
    const drawData = { type: 'undo' };
    socketEmit('draw', { roomCode: roomCode.value, drawData });
  }
};

const clearCanvas = () => {
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  saveHistory();
  const drawData = { type: 'clear' };
  socketEmit('draw', { roomCode: roomCode.value, drawData });
};

const handleDrawSync = (data) => {
  const drawData = data.drawData;
  
  if (drawData.type === 'draw') {
    ctx.value.strokeStyle = drawData.color;
    ctx.value.lineWidth = drawData.width;
    ctx.value.beginPath();
    ctx.value.moveTo(drawData.from.x, drawData.from.y);
    ctx.value.lineTo(drawData.to.x, drawData.to.y);
    ctx.value.stroke();
  } else if (drawData.type === 'clear') {
    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  }
};

const submitAnswer = () => {
  if (!answer.value.trim()) {
    answerError.value = '请输入答案';
    return;
  }
  
  answerError.value = '';
  answerSubmitted.value = true;
  socketEmit('submit-answer', { roomCode: roomCode.value, answer: answer.value });
};

const startGame = () => {
  socketEmit('start-game', { roomCode: roomCode.value });
};

const endGame = () => {
  socketEmit('end-game', { roomCode: roomCode.value });
};

const startVote = () => {
  socketEmit('start-vote', { roomCode: roomCode.value });
};

const vote = (candidateId) => {
  socketEmit('vote', { roomCode: roomCode.value, candidateId });
  showVoteModal.value = false;
};

const handleCorrectAnswer = (data) => {
  correctPlayerName.value = data.playerName;
  targetWord.value = data.targetWord;
  showCorrectModal.value = true;
  updateGameStatus('waiting');
};

const handleVoteStarted = (data) => {
  setCandidates(data.candidates);
  updateGameStatus('voting');
  
  voteCountdown.value = data.duration;
  if (voteTimer) clearInterval(voteTimer);
  
  voteTimer = setInterval(() => {
    voteCountdown.value--;
    if (voteCountdown.value <= 0) {
      clearInterval(voteTimer);
    }
  }, 1000);
};

const handleVoteEnded = (data) => {
  if (voteTimer) {
    clearInterval(voteTimer);
    voteTimer = null;
  }
  
  newHost.value = data.newHost;
  showVoteResultModal.value = true;
  updateGameStatus('waiting');
  
  if (data.newHost) {
    const isMeNewHost = data.newHost.socket_id === socket.value?.id;
    setIsHost(isMeNewHost);
    
    const updatedPlayers = players.value.map(p => ({
      ...p,
      is_host: p.socket_id === data.newHost.socket_id
    }));
    setPlayers(updatedPlayers);
  }
};

const handleVoteUpdated = (data) => {
  setVotes(data.votes);
};

const showNotification = (message, type = 'info') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

const leaveRoom = () => {
  socketEmit('leave-room', { roomCode: roomCode.value });
  disconnect();
  reset();
  emit('leave');
};

const setupSocketListeners = () => {
  socketOn('room-created', (data) => {
    setRoom(data.room);
    setIsHost(true);
    setPlayers([{ socket_id: socket.value.id, player_name: data.room.host_name, is_host: true }]);
  });

  socketOn('room-joined', (data) => {
    setRoom(data.room);
    setPlayers(data.players);
    setIsHost(data.isHost);
  });

  socketOn('player-joined', (data) => {
    if (data.player.socket_id === socket.value?.id) return;
    const exists = players.value.some(p => p.socket_id === data.player.socket_id);
    if (!exists) {
      setPlayers([...players.value, data.player]);
    }
    showNotification(`${data.player.player_name} 加入了房间`, 'info');
  });

  socketOn('player-left', (data) => {
    const newPlayers = players.value.filter(p => p.socket_id !== socket.value?.id);
    setPlayers(newPlayers);
    showNotification(`${data.playerName} 退出了房间`, 'info');
  });

  socketOn('room-closed', (data) => {
    showNotification(data.message, 'warning');
    disconnect();
    reset();
    emit('leave');
  });

  socketOn('room-error', (data) => {
    showNotification(data.message, 'error');
  });

  socketOn('game-started', (data) => {
    console.log('[Game] game-started received:', data);
    updateGameStatus('playing');
    setTargetWord(data.targetWord);
    clearCanvas();
    history.value = [];
    historyIndex.value = -1;
    console.log('[Game] gameStatus after update:', gameStatus.value);
    showNotification('游戏开始！', 'success');
  });

  socketOn('game-ended', () => {
    updateGameStatus('waiting');
    showNotification('游戏结束', 'info');
  });

  socketOn('draw-sync', handleDrawSync);
  socketOn('correct-answer', handleCorrectAnswer);
  socketOn('answer-submitted', (data) => {
    if (!isHost.value) {
      answerError.value = '答错啦，再试试～';
      answerSubmitted.value = false;
    }
  });

  socketOn('vote-started', handleVoteStarted);
  socketOn('vote-updated', handleVoteUpdated);
  socketOn('vote-ended', handleVoteEnded);
};

let playerName = '';

const init = (options) => {
  connect(props.socketUrl);
  
  const onConnected = () => {
    setupSocketListeners();
    
    if (options.createRoom) {
      playerName = options.playerName;
      socketEmit('create-room', { hostName: options.playerName, targetWord: options.targetWord });
    } else {
      playerName = options.playerName;
      socketEmit('join-room', { roomCode: options.roomCode, playerName: options.playerName });
    }
  };

  if (socket.value?.connected) {
    onConnected();
  } else {
    socket.value.once('connect', onConnected);
  }
};

defineExpose({ init });

onMounted(() => {
  initCanvas();
});

onUnmounted(() => {
  if (voteTimer) clearInterval(voteTimer);
  disconnect();
});
</script>

<template>
  <div class="game-view">
    <div class="game-header">
      <div class="header-info">
        <span class="info-item">房间号：{{ roomCode }}</span>
        <span class="info-item">房主：{{ hostName }}</span>
        <span class="info-item">人数：{{ playerCount }}/{{ maxPlayers }}</span>
        <span class="info-item status" :class="gameStatus">
          {{ gameStatus === 'waiting' ? '等待中' : gameStatus === 'playing' ? '进行中' : '投票中' }}
        </span>
      </div>
      <Button variant="danger" size="small" @click="leaveRoom">退出</Button>
    </div>

    <div class="game-content">
      <div class="game-main">
        <div class="canvas-container" :class="{ 'is-host': isHost }">
          <div v-if="isHost" class="canvas-label">房主专属绘画区</div>
          <canvas
            ref="canvasRef"
            width="800"
            height="600"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
          ></canvas>
          
          <div v-if="isHost && gameStatus === 'playing'" class="canvas-tools">
            <div class="tool-group">
              <input type="color" v-model="drawingColor" title="颜色" />
              <select v-model="drawingWidth" title="粗细">
                <option :value="2">细</option>
                <option :value="3">中</option>
                <option :value="5">粗</option>
                <option :value="8">特粗</option>
              </select>
            </div>
            <div class="tool-group">
              <Button size="small" @click="undo">撤销</Button>
              <Button size="small" variant="danger" @click="clearCanvas">清空</Button>
            </div>
          </div>
        </div>

        <div v-if="isHost" class="game-controls">
          <Button 
            v-if="gameStatus === 'waiting'" 
            variant="success" 
            @click="startGame"
          >
            开始游戏
          </Button>
          <Button 
            v-if="gameStatus === 'playing'" 
            variant="warning" 
            @click="endGame"
          >
            结束游戏
          </Button>
          <Button 
            v-if="gameStatus === 'waiting' && players.length > 1" 
            variant="primary" 
            @click="startVote"
          >
            发起投票
          </Button>
        </div>
      </div>

      <div class="game-sidebar">
        <div class="players-list">
          <h3 class="sidebar-title">玩家列表</h3>
          <ul>
            <li v-for="player in players" :key="player.socket_id" class="player-item">
              <span class="player-name">{{ player.player_name }}</span>
              <span v-if="player.is_host" class="player-badge">房主</span>
            </li>
          </ul>
        </div>

        <div v-if="!isHost && gameStatus === 'playing'" class="guess-section">
          <h3 class="sidebar-title">你的答案</h3>
          <div class="guess-input">
            <Input 
              v-model="answer" 
              placeholder="输入你的答案"
              @keyup.enter="submitAnswer"
            />
            <Button variant="primary" @click="submitAnswer">提交</Button>
          </div>
          <p v-if="answerError" class="guess-error">{{ answerError }}</p>
        </div>

        <div v-if="isHost && gameStatus === 'playing'" class="target-section">
          <h3 class="sidebar-title">猜题目标</h3>
          <p class="target-word">{{ targetWord }}</p>
        </div>

        <div v-if="gameStatus === 'voting'" class="vote-section">
          <h3 class="sidebar-title">投票选新房主</h3>
          <p class="vote-timer">剩余时间：{{ voteCountdown }}秒</p>
          <div class="vote-buttons">
            <Button 
              v-for="candidate in candidates" 
              :key="candidate.socket_id"
              variant="default"
              size="small"
              @click="vote(candidate.socket_id)"
            >
              {{ candidate.player_name }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Modal :show="showCorrectModal" title="猜对了！" @close="showCorrectModal = false">
      <div class="modal-result">
        <p class="result-text">{{ correctPlayerName }} 猜对了！</p>
        <p class="result-target">正确答案是：{{ targetWord }}</p>
      </div>
    </Modal>

    <Modal :show="showVoteResultModal" title="投票结果" @close="showVoteResultModal = false">
      <div class="modal-result">
        <p v-if="newHost" class="result-text">{{ newHost.player_name }} 当选新房主！</p>
        <p v-else class="result-text">无有效投票，房主身份不变</p>
        <p class="result-hint">即将进入新一轮游戏...</p>
      </div>
    </Modal>

    <Toast 
      v-model:show="showToast" 
      :message="toastMessage" 
      :type="toastType" 
    />
  </div>
</template>

<style scoped>
.game-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--separator);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.info-item {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-item.status {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.info-item.status.waiting {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.info-item.status.playing {
  background: var(--accent-green);
  color: white;
}

.info-item.status.voting {
  background: var(--accent-orange);
  color: white;
}

.game-content {
  display: flex;
  flex: 1;
  padding: 20px;
  gap: 20px;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.canvas-container {
  position: relative;
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

.canvas-container canvas {
  width: 100%;
  height: auto;
  display: block;
  cursor: crosshair;
  pointer-events: auto;
  position: relative;
  z-index: 5;
}

.canvas-label {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 12px;
  background: var(--accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  z-index: 10;
}

.canvas-tools {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-group input[type="color"] {
  width: 32px;
  height: 32px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.tool-group select {
  padding: 6px 10px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.game-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.game-sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.players-list,
.guess-section,
.target-section,
.vote-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--card-shadow);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.player-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--separator);
}

.player-item:last-child {
  border-bottom: none;
}

.player-name {
  font-size: 14px;
  color: var(--text-primary);
}

.player-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--accent);
  color: white;
  border-radius: 10px;
}

.guess-section {
  display: flex;
  flex-direction: column;
}

.guess-input {
  display: flex;
  gap: 8px;
}

.guess-input input {
  flex: 1;
}

.guess-error {
  margin-top: 8px;
  font-size: 13px;
  color: var(--accent-red);
  text-align: center;
}

.target-word {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
}

.vote-section {
  text-align: center;
}

.vote-timer {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent-orange);
  margin-bottom: 16px;
}

.vote-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-result {
  text-align: center;
}

.result-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.result-target {
  font-size: 16px;
  color: var(--accent);
  margin-bottom: 16px;
}

.result-hint {
  font-size: 14px;
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .game-content {
    flex-direction: column;
  }
  
  .game-sidebar {
    width: 100%;
  }
}
</style>
