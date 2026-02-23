<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import Toast from '@/components/common/Toast.vue';
import { useSocket } from '@/composables/useSocket';
import { useGame } from '@/composables/useGame';
import { Play, Square, Vote, LogOut, Target } from 'lucide-vue-next';
import DrawingCanvas from '@/components/game/DrawingCanvas.vue';
import DrawingToolbar from '@/components/game/DrawingToolbar.vue';
import PlayerList from '@/components/game/PlayerList.vue';
import GuessInput from '@/components/game/GuessInput.vue';
import VotePanel from '@/components/game/VotePanel.vue';

const props = defineProps({
  socketUrl: {
    type: String,
    default: 'http://localhost:3001'
  }
});

const emit = defineEmits(['leave']);

const { socket, connect, disconnect, emit: socketEmit, on: socketOn } = useSocket();
const { 
  room, players, isHost, gameStatus, targetWord, 
  votes, candidates,
  roomCode, hostName, playerCount, maxPlayers,
  setRoom, setPlayers, setIsHost, updateGameStatus, setTargetWord,
  setVotes, setCandidates, reset
} = useGame();

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('info');

const showCorrectModal = ref(false);
const correctPlayerName = ref('');
const showVoteResultModal = ref(false);
const newHost = ref(null);

const answer = ref('');
const answerError = ref('');

const drawingColor = ref('#000000');
const drawingWidth = ref(4);
const isEraser = ref(false);
const strokes = ref([]);
const currentStroke = ref([]);

const voteCountdown = ref(30);
let voteTimer = null;

const canvasRef = ref(null);

const showNotification = (message, type = 'info') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

const submitAnswer = () => {
  if (!answer.value.trim()) {
    answerError.value = '请输入答案';
    return;
  }
  answerError.value = '';
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

const undo = () => {
  if (strokes.value.length === 0) return;
  strokes.value.pop();
  canvasRef.value?.redrawAll();
  const drawData = { type: 'undo', strokeCount: strokes.value.length };
  socketEmit('draw', { roomCode: roomCode.value, drawData });
};

const clearCanvas = () => {
  strokes.value = [];
  currentStroke.value = [];
  canvasRef.value?.clearCanvas();
  const drawData = { type: 'clear' };
  socketEmit('draw', { roomCode: roomCode.value, drawData });
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
    
    if (data.drawHistory && data.drawHistory.length > 0) {
      canvasRef.value?.replayDrawHistory(data.drawHistory);
      strokes.value = data.drawHistory;
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
    updateGameStatus('playing');
    setTargetWord(data.targetWord);
    strokes.value = [];
    currentStroke.value = [];
    canvasRef.value?.resetCanvas();
    showNotification('游戏开始！', 'success');
  });

  socketOn('game-ended', () => {
    updateGameStatus('waiting');
    showNotification('游戏结束', 'info');
  });

  socketOn('draw-sync', (data) => {
    canvasRef.value?.handleDrawSync(data);
  });

  socketOn('correct-answer', handleCorrectAnswer);

  socketOn('answer-submitted', (data) => {
    if (!isHost.value) {
      answerError.value = '答错啦，再试试～';
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

const handleCanvasUndo = () => {
  undo();
};

const handleCanvasStrokeEnd = (stroke) => {
  if (stroke && stroke.length > 0) {
    strokes.value.push(stroke);
  }
};

onMounted(() => {
  setTimeout(() => {
    canvasRef.value?.initCanvas();
  }, 100);
});

onUnmounted(() => {
  if (voteTimer) clearInterval(voteTimer);
  disconnect();
});

defineExpose({ init });
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
        <DrawingCanvas
          ref="canvasRef"
          :isHost="isHost"
          :gameStatus="gameStatus"
          :drawingColor="drawingColor"
          :drawingWidth="drawingWidth"
          :isEraser="isEraser"
          :strokes="strokes"
          :currentStroke="currentStroke"
          :socketEmit="socketEmit"
          :roomCode="roomCode"
          @undo="handleCanvasUndo"
          @stroke-end="handleCanvasStrokeEnd"
        />

        <DrawingToolbar
          :isHost="isHost"
          :gameStatus="gameStatus"
          v-model:drawingColor="drawingColor"
          v-model:drawingWidth="drawingWidth"
          v-model:isEraser="isEraser"
          :strokes="strokes"
          @undo="undo"
          @clear="clearCanvas"
        />

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
        <PlayerList :players="players" />

        <GuessInput
          v-if="!isHost && gameStatus === 'playing'"
          v-model:answer="answer"
          :answerError="answerError"
          @submit="submitAnswer"
        />

        <div v-if="isHost && gameStatus === 'playing'" class="card target-card">
          <h3 class="card-title">
            <Target :size="18" />
            猜题目标
          </h3>
          <p class="target-word">{{ targetWord }}</p>
        </div>

        <VotePanel
          :gameStatus="gameStatus"
          :candidates="candidates"
          :voteCountdown="voteCountdown"
          @vote="vote"
        />
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

.target-word {
  font-size: 26px;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.08));
  border-radius: 12px;
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
  
  .sidebar :deep(.card) {
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
}
</style>
