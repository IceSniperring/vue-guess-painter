<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Toast from '@/components/common/Toast.vue';
import { useSocket } from '@/composables/useSocket';
import { useGame } from '@/composables/useGame';
import { 
  Pencil, Eraser, Undo2, Trash2, Play, Square, Vote, Users, 
  HelpCircle, Target, Timer, Crown, LogOut, Palette
} from 'lucide-vue-next';

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
const isEraser = ref(false);
const strokes = ref([]);
const currentStroke = ref([]);
const canvasReady = ref(false);

const voteCountdown = ref(30);
let voteTimer = null;

const initCanvas = () => {
  if (!canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = Math.min(500, containerWidth * 0.625);
  
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = containerWidth * dpr;
  canvas.height = containerHeight * dpr;
  canvas.style.width = containerWidth + 'px';
  canvas.style.height = containerHeight + 'px';
  
  ctx.value = canvas.getContext('2d');
  ctx.value.scale(dpr, dpr);
  ctx.value.lineCap = 'round';
  ctx.value.lineJoin = 'round';
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, containerWidth, containerHeight);
  
  canvasReady.value = true;
  console.log('[Canvas] Initialized:', containerWidth, 'x', containerHeight, 'DPR:', dpr);
};

const getCanvasSize = () => {
  if (!canvasRef.value) return { width: 800, height: 500 };
  const canvas = canvasRef.value;
  return {
    width: parseInt(canvas.style.width) || canvas.width,
    height: parseInt(canvas.style.height) || canvas.height
  };
};

const startDrawing = (e) => {
  if (!isHost.value || gameStatus.value !== 'playing') {
    isDrawing.value = false;
    return;
  }
  isDrawing.value = true;
  currentStroke.value = [];
  
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const size = getCanvasSize();
  
  lastPos.value = {
    x: (e.clientX - rect.left) * (size.width / rect.width),
    y: (e.clientY - rect.top) * (size.height / rect.height)
  };
};

const draw = (e) => {
  if (!isDrawing.value || !ctx.value || !lastPos.value) return;
  
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const size = getCanvasSize();
  
  const currentPos = {
    x: (e.clientX - rect.left) * (size.width / rect.width),
    y: (e.clientY - rect.top) * (size.height / rect.height)
  };

  const color = isEraser.value ? '#FFFFFF' : drawingColor.value;
  const width = isEraser.value ? drawingWidth.value * 3 : drawingWidth.value;

  ctx.value.strokeStyle = color;
  ctx.value.lineWidth = width;
  ctx.value.beginPath();
  ctx.value.moveTo(lastPos.value.x, lastPos.value.y);
  ctx.value.lineTo(currentPos.x, currentPos.y);
  ctx.value.stroke();

  const drawData = {
    type: 'segment',
    from: { ...lastPos.value },
    to: currentPos,
    color: color,
    width: width,
    isEraser: isEraser.value
  };

  currentStroke.value.push(drawData);
  socketEmit('draw', { roomCode: roomCode.value, drawData });
  
  lastPos.value = currentPos;
};

const stopDrawing = () => {
  if (isDrawing.value && currentStroke.value.length > 0) {
    const stroke = [...currentStroke.value];
    strokes.value.push(stroke);
    socketEmit('draw', { roomCode: roomCode.value, drawData: { type: 'stroke-end', stroke } });
    currentStroke.value = [];
  }
  isDrawing.value = false;
};

const redrawAll = () => {
  if (!ctx.value) return;
  const size = getCanvasSize();
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, size.width, size.height);
  
  for (const stroke of strokes.value) {
    for (const segment of stroke) {
      ctx.value.strokeStyle = segment.color;
      ctx.value.lineWidth = segment.width;
      ctx.value.beginPath();
      ctx.value.moveTo(segment.from.x, segment.from.y);
      ctx.value.lineTo(segment.to.x, segment.to.y);
      ctx.value.stroke();
    }
  }
};

const undo = () => {
  if (strokes.value.length === 0) return;
  
  strokes.value.pop();
  redrawAll();
  
  const drawData = { type: 'undo', strokeCount: strokes.value.length };
  socketEmit('draw', { roomCode: roomCode.value, drawData });
};

const clearCanvas = () => {
  strokes.value = [];
  currentStroke.value = [];
  const size = getCanvasSize();
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, size.width, size.height);
  
  const drawData = { type: 'clear' };
  socketEmit('draw', { roomCode: roomCode.value, drawData });
};

const toggleEraser = () => {
  isEraser.value = !isEraser.value;
};

const handleDrawSync = (data) => {
  const drawData = data.drawData;
  const size = getCanvasSize();
  
  if (drawData.type === 'segment') {
    ctx.value.strokeStyle = drawData.color;
    ctx.value.lineWidth = drawData.width;
    ctx.value.beginPath();
    ctx.value.moveTo(drawData.from.x, drawData.from.y);
    ctx.value.lineTo(drawData.to.x, drawData.to.y);
    ctx.value.stroke();
  } else if (drawData.type === 'clear') {
    strokes.value = [];
    currentStroke.value = [];
    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fillRect(0, 0, size.width, size.height);
  } else if (drawData.type === 'undo') {
    if (strokes.value.length > drawData.strokeCount) {
      strokes.value.pop();
    }
    redrawAll();
  } else if (drawData.type === 'stroke-end') {
    if (drawData.stroke && drawData.stroke.length > 0) {
      strokes.value.push(drawData.stroke);
    }
  }
};

const replayDrawHistory = (historyData) => {
  console.log('[Draw] replayDrawHistory called, ctx:', !!ctx.value, 'strokes length:', historyData?.length);
  if (!ctx.value) {
    console.log('[Draw] ctx not ready, waiting...');
    setTimeout(() => replayDrawHistory(historyData), 100);
    return;
  }
  if (!historyData || historyData.length === 0) return;
  
  strokes.value = historyData;
  
  const size = getCanvasSize();
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, size.width, size.height);
  
  for (const stroke of historyData) {
    for (const segment of stroke) {
      ctx.value.strokeStyle = segment.color;
      ctx.value.lineWidth = segment.width;
      ctx.value.beginPath();
      ctx.value.moveTo(segment.from.x, segment.from.y);
      ctx.value.lineTo(segment.to.x, segment.to.y);
      ctx.value.stroke();
    }
  }
  
  console.log('[Draw] replayDrawHistory completed, strokes length:', strokes.value.length);
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
    console.log('[Socket] room-joined received, drawHistory:', data.drawHistory?.length);
    setRoom(data.room);
    setPlayers(data.players);
    setIsHost(data.isHost);
    
    if (data.drawHistory && data.drawHistory.length > 0) {
      replayDrawHistory(data.drawHistory);
    }
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
    strokes.value = [];
    currentStroke.value = [];
    if (ctx.value && canvasRef.value) {
      const size = getCanvasSize();
      ctx.value.fillStyle = '#FFFFFF';
      ctx.value.fillRect(0, 0, size.width, size.height);
    }
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
    <header class="game-header">
      <div class="header-left">
        <div class="room-code-badge">{{ roomCode }}</div>
        <div class="header-info">
          <span class="info-label">房主</span>
          <span class="info-value">{{ hostName }}</span>
        </div>
        <div class="header-info">
          <span class="info-label">人数</span>
          <span class="info-value">{{ playerCount }}/{{ maxPlayers }}</span>
        </div>
      </div>
      <div class="header-right">
        <span class="status-badge" :class="gameStatus">
          {{ gameStatus === 'waiting' ? '等待中' : gameStatus === 'playing' ? '绘画中' : '投票中' }}
        </span>
        <Button variant="danger" size="small" @click="leaveRoom">
          <LogOut :size="16" />
          退出
        </Button>
      </div>
    </header>

    <main class="game-content">
      <section class="canvas-section">
        <div class="canvas-wrapper" ref="canvasWrapper">
          <div v-if="isHost" class="canvas-label">
            <Palette :size="16" />
            绘画区
          </div>
          <canvas
            ref="canvasRef"
            :class="{ 'cursor-eraser': isEraser && isHost && gameStatus === 'playing' }"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
          ></canvas>
        </div>

        <div v-if="isHost && gameStatus === 'playing'" class="toolbar-external">
          <div class="tool-group">
            <span class="tool-label">颜色</span>
            <div class="color-options">
              <button
                v-for="color in ['#000000', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55']"
                :key="color"
                class="color-btn"
                :class="{ active: drawingColor === color && !isEraser }"
                :style="{ background: color }"
                @click="drawingColor = color; isEraser = false"
              ></button>
              <label class="color-btn custom">
                <input type="color" v-model="drawingColor" @input="isEraser = false" />
                <span class="custom-color-icon">+</span>
              </label>
            </div>
          </div>

          <div class="tool-group">
            <span class="tool-label">粗细</span>
            <div class="size-options">
              <button
                v-for="size in 5"
                :key="size"
                class="size-btn"
                :class="{ active: drawingWidth === size * 2 }"
                @click="drawingWidth = size * 2"
              >
                <span class="size-indicator" :style="{ transform: `scale(${0.4 + size * 0.15})` }"></span>
              </button>
            </div>
          </div>

          <div class="tool-group">
            <span class="tool-label">工具</span>
            <div class="tool-options">
              <button class="tool-btn" :class="{ active: !isEraser }" @click="isEraser = false">
                <Pencil :size="18" />
                画笔
              </button>
              <button class="tool-btn" :class="{ active: isEraser }" @click="isEraser = true">
                <Eraser :size="18" />
                橡皮
              </button>
            </div>
          </div>

          <div class="tool-group">
            <span class="tool-label">操作</span>
            <div class="action-options">
              <button class="action-btn" @click="undo" :disabled="strokes.length === 0">
                <Undo2 :size="18" />
                撤销
              </button>
              <button class="action-btn danger" @click="clearCanvas">
                <Trash2 :size="18" />
                清空
              </button>
            </div>
          </div>
        </div>

        <div v-if="isHost" class="game-controls">
          <Button v-if="gameStatus === 'waiting'" variant="success" @click="startGame">
            <Play :size="18" />
            开始游戏
          </Button>
          <Button v-if="gameStatus === 'playing'" variant="warning" @click="endGame">
            <Square :size="18" />
            结束游戏
          </Button>
          <Button v-if="gameStatus === 'waiting' && players.length > 1" variant="primary" @click="startVote">
            <Vote :size="18" />
            发起投票
          </Button>
        </div>
      </section>

      <aside class="sidebar">
        <div class="card players-card">
          <h3 class="card-title">
            <Users :size="18" />
            玩家列表
          </h3>
          <ul class="players-list">
            <li v-for="player in players" :key="player.socket_id" class="player-item">
              <div class="player-avatar">{{ player.player_name.charAt(0).toUpperCase() }}</div>
              <span class="player-name">{{ player.player_name }}</span>
              <Crown v-if="player.is_host" :size="18" class="host-badge" />
            </li>
          </ul>
        </div>

        <div v-if="!isHost && gameStatus === 'playing'" class="card guess-card">
          <h3 class="card-title">
            <HelpCircle :size="18" />
            提交答案
          </h3>
          <div class="guess-form">
            <Input v-model="answer" placeholder="输入你的答案..." @keyup.enter="submitAnswer" />
            <Button variant="primary" @click="submitAnswer" :disabled="!answer.trim()">提交</Button>
          </div>
          <p v-if="answerError" class="guess-error">{{ answerError }}</p>
        </div>

        <div v-if="isHost && gameStatus === 'playing'" class="card target-card">
          <h3 class="card-title">
            <Target :size="18" />
            猜题目标
          </h3>
          <p class="target-word">{{ targetWord }}</p>
        </div>

        <div v-if="gameStatus === 'voting'" class="card vote-card">
          <h3 class="card-title">
            <Vote :size="18" />
            投票选新房主
          </h3>
          <div class="vote-timer">
            <div class="timer-bar" :style="{ width: (voteCountdown / 30 * 100) + '%' }"></div>
            <span class="timer-text">
              <Timer :size="14" />
              {{ voteCountdown }}秒
            </span>
          </div>
          <div class="vote-candidates">
            <button
              v-for="candidate in candidates"
              :key="candidate.socket_id"
              class="candidate-btn"
              @click="vote(candidate.socket_id)"
            >
              <div class="candidate-avatar">{{ candidate.player_name.charAt(0).toUpperCase() }}</div>
              <span>{{ candidate.player_name }}</span>
            </button>
          </div>
        </div>
      </aside>
    </main>

    <Modal :show="showCorrectModal" title="恭喜！" @close="showCorrectModal = false">
      <div class="modal-result">
        <p class="result-text">{{ correctPlayerName }} 猜对了！</p>
        <p class="result-target">答案是：<strong>{{ targetWord }}</strong></p>
      </div>
    </Modal>

    <Modal :show="showVoteResultModal" title="投票结果" @close="showVoteResultModal = false">
      <div class="modal-result">
        <p v-if="newHost" class="result-text">{{ newHost.player_name }} 当选新房主！</p>
        <p v-else class="result-text">无有效投票，房主身份不变</p>
        <p class="result-hint">即将进入新一轮游戏...</p>
      </div>
    </Modal>

    <Toast v-model:show="showToast" :message="toastMessage" :type="toastType" />
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
  background: var(--bg-primary);
  border-bottom: 1px solid var(--separator);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-code-badge {
  background: linear-gradient(135deg, var(--accent), #5856d6);
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 3px;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge.waiting {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.status-badge.playing {
  background: linear-gradient(135deg, #34C759, #30D158);
  color: white;
}

.status-badge.voting {
  background: linear-gradient(135deg, #FF9500, #FF6B00);
  color: white;
}

.game-content {
  display: flex;
  flex: 1;
  padding: 20px;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.canvas-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.canvas-wrapper {
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

.canvas-wrapper canvas {
  width: 100%;
  height: auto;
  display: block;
  cursor: crosshair;
}

.canvas-wrapper canvas.cursor-eraser {
  cursor: cell;
}

.canvas-label {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
  z-index: 10;
}

.toolbar-external {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: var(--bg-primary);
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
  margin-right: 4px;
}

.color-options {
  display: flex;
  gap: 6px;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--bg-primary);
}

.color-btn.custom {
  background: linear-gradient(135deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-btn.custom input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.custom-color-icon {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.size-options {
  display: flex;
  gap: 4px;
}

.size-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.size-btn:hover {
  background: var(--bg-tertiary);
}

.size-btn.active {
  background: var(--accent);
}

.size-indicator {
  width: 8px;
  height: 8px;
  background: var(--text-primary);
  border-radius: 50%;
}

.size-btn.active .size-indicator {
  background: white;
}

.tool-options {
  display: flex;
  gap: 6px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tool-btn:hover {
  background: var(--bg-tertiary);
}

.tool-btn.active {
  background: var(--accent);
  color: white;
}

.action-options {
  display: flex;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(255, 59, 48, 0.15);
  color: var(--accent-red);
}

.game-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card {
  background: var(--bg-primary);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.players-list {
  list-style: none;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.player-item:not(:last-child) {
  border-bottom: 1px solid var(--separator);
}

.player-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
}

.player-name {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.host-badge {
  color: #FFD700;
}

.guess-form {
  display: flex;
  gap: 8px;
}

.guess-error {
  margin-top: 10px;
  font-size: 13px;
  color: var(--accent-red);
  text-align: center;
  padding: 10px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 10px;
}

.target-word {
  font-size: 26px;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.08));
  border-radius: 12px;
}

.vote-timer {
  position: relative;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  margin-bottom: 24px;
  overflow: visible;
}

.timer-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #FF9500, #FF3B30);
  border-radius: 3px;
  transition: width 1s linear;
}

.timer-text {
  position: absolute;
  right: 0;
  top: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-orange);
}

.vote-candidates {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.candidate-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: var(--text-primary);
}

.candidate-btn:hover {
  background: rgba(0, 122, 255, 0.1);
  border-color: var(--accent);
}

.candidate-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #34C759, #30D158);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
}

.modal-result {
  text-align: center;
  padding: 10px 0;
}

.result-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.result-target {
  font-size: 15px;
  color: var(--text-secondary);
}

.result-target strong {
  color: var(--accent);
  font-size: 18px;
}

.result-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 12px;
}

@media (max-width: 1000px) {
  .game-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .sidebar .card {
    flex: 1;
    min-width: 240px;
  }
  
  .toolbar-external {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .game-header {
    padding: 10px 12px;
  }
  
  .header-info {
    display: none;
  }
  
  .game-content {
    padding: 12px;
  }
  
  .toolbar-external {
    padding: 12px;
    gap: 10px;
  }
  
  .tool-label {
    display: none;
  }
}
</style>
