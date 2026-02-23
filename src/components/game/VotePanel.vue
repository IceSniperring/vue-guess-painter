<script setup>
import { Vote, Timer } from 'lucide-vue-next';

const props = defineProps({
  gameStatus: String,
  candidates: Array,
  voteCountdown: Number
});

const emit = defineEmits(['vote']);
</script>

<template>
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
        @click="$emit('vote', candidate.socket_id)"
      >
        <div class="candidate-avatar">{{ candidate.player_name.charAt(0).toUpperCase() }}</div>
        <span>{{ candidate.player_name }}</span>
      </button>
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

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
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
</style>
