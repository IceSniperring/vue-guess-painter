<script setup>
import { inject, computed } from 'vue';
import { Vote, Timer, User } from 'lucide-vue-next';

const { isDark } = inject('theme');

const props = defineProps({
  gameStatus: String,
  candidates: Array,
  voteCountdown: Number,
  votes: Object,
  mySocketId: String
});

const getAvatarStyle = computed(() => {
  const bgColor = isDark.value ? '#2C2C2E' : '#F5F5F7';
  const textColor = isDark.value ? '#F5F5F7' : '#1C1C1E';
  return {
    background: bgColor,
    color: textColor,
    border: '1px solid var(--separator)'
  };
});

const getVoteCount = (socketId) => {
  if (!props.votes) return 0;
  return Object.values(props.votes).filter(v => v === socketId).length;
};

const getMyVote = computed(() => {
  if (!props.votes || !props.mySocketId) return null;
  return props.votes[props.mySocketId] || null;
});

const totalVotes = computed(() => {
  if (!props.votes) return 0;
  return Object.keys(props.votes).length;
});

const emit = defineEmits(['vote']);
</script>

<template>
  <div v-if="gameStatus === 'voting'" class="card vote-card">
    <div class="vote-header">
      <div class="vote-title">
        <Vote :size="18" />
        <span>投票选新房主</span>
      </div>
      <span class="vote-count">{{ totalVotes }} 票</span>
    </div>
    
    <div class="vote-timer">
      <div class="timer-bar" :style="{ width: (voteCountdown / 30 * 100) + '%' }"></div>
    </div>
    
    <div class="vote-hint">
      点击再次投票可取消，选择你认为可能是卧底的玩家
    </div>
    
    <div class="vote-list">
      <div
        v-for="candidate in candidates"
        :key="candidate.socket_id"
        class="vote-item"
        :class="{ selected: getMyVote === candidate.socket_id }"
        @click="$emit('vote', candidate.socket_id)"
      >
        <div class="vote-item-left">
          <div class="avatar" :style="getAvatarStyle">
            {{ candidate.player_name.charAt(0).toUpperCase() }}
          </div>
          <span class="name">{{ candidate.player_name }}</span>
        </div>
        <div class="vote-item-right">
          <span v-if="getVoteCount(candidate.socket_id) > 0" class="vote-num">
            {{ getVoteCount(candidate.socket_id) }}
          </span>
          <div 
            class="check-circle"
            :class="{ checked: getMyVote === candidate.socket_id }"
          >
            <span v-if="getMyVote === candidate.socket_id">✓</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.vote-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.vote-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.vote-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.vote-timer {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  margin-bottom: 12px;
}

.timer-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 1s linear;
}

.vote-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.vote-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vote-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.vote-item:hover {
  background: var(--bg-tertiary);
}

.vote-item.selected {
  border-color: var(--accent);
  background: rgba(0, 122, 255, 0.05);
}

.vote-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.vote-item-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.vote-num {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.check-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--separator);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: transparent;
  transition: all 0.15s;
}

.check-circle.checked {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
</style>
