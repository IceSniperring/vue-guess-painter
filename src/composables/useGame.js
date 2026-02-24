import { ref, computed } from 'vue';

const room = ref(null);
const players = ref([]);
const isHost = ref(false);
const gameStatus = ref('waiting');
const targetWord = ref('');
const targetHint = ref('');
const drawHistory = ref([]);
const votes = ref({});
const candidates = ref([]);
const voteTimeLeft = ref(0);

export function useGame() {
  const setRoom = (data) => {
    room.value = data;
    gameStatus.value = data.status || 'waiting';
    targetWord.value = data.target_word || '';
    drawHistory.value = data.draw_history || [];
  };

  const setPlayers = (playerList) => {
    players.value = playerList;
  };

  const setIsHost = (value) => {
    isHost.value = value;
  };

  const updateGameStatus = (status) => {
    gameStatus.value = status;
  };

  const setTargetWord = (word) => {
    targetWord.value = word;
  };

  const setTargetHint = (hint) => {
    targetHint.value = hint;
  };

  const addDrawData = (data) => {
    drawHistory.value.push(data);
  };

  const clearDrawHistory = () => {
    drawHistory.value = [];
  };

  const setVotes = (voteData) => {
    votes.value = voteData;
  };

  const setCandidates = (candidateList) => {
    candidates.value = candidateList;
  };

  const setVoteTimeLeft = (time) => {
    voteTimeLeft.value = time;
  };

  const reset = () => {
    room.value = null;
    players.value = [];
    isHost.value = false;
    gameStatus.value = 'waiting';
    targetWord.value = '';
    targetHint.value = '';
    drawHistory.value = [];
    votes.value = {};
    candidates.value = [];
    voteTimeLeft.value = 0;
  };

  const currentPlayer = computed(() => {
    return players.value.find(p => p.is_host) || null;
  });

  const playerCount = computed(() => players.value.length);
  const maxPlayers = computed(() => room.value?.max_players || 8);
  const roomCode = computed(() => room.value?.room_code || '');
  const hostName = computed(() => room.value?.host_name || '');

  return {
    room,
    players,
    isHost,
    gameStatus,
    targetWord,
    targetHint,
    drawHistory,
    votes,
    candidates,
    voteTimeLeft,
    currentPlayer,
    playerCount,
    maxPlayers,
    roomCode,
    hostName,
    setRoom,
    setPlayers,
    setIsHost,
    updateGameStatus,
    setTargetWord,
    setTargetHint,
    addDrawData,
    clearDrawHistory,
    setVotes,
    setCandidates,
    setVoteTimeLeft,
    reset
  };
}
