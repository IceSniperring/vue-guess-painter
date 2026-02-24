<script setup>
import { Crown } from 'lucide-vue-next';

const props = defineProps({
  players: Array
});

const getAvatarColor = (name) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};
</script>

<template>
  <div class="card players-card">
    <h3 class="card-title">
      <span class="title-icon">👥</span>
      玩家列表
    </h3>
    <ul class="players-list">
      <li v-for="player in players" :key="player.socket_id" class="player-item">
        <div class="player-avatar" :style="{ background: getAvatarColor(player.player_name) }">
          {{ player.player_name.charAt(0).toUpperCase() }}
        </div>
        <span class="player-name">{{ player.player_name }}</span>
        <Crown v-if="player.is_host" :size="16" class="host-badge" />
      </li>
    </ul>
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

.title-icon {
  font-size: 16px;
}

.players-list {
  list-style: none;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.player-item:not(:last-child) {
  border-bottom: 1px solid var(--separator);
}

.player-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.player-name {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.host-badge {
  color: #FFD700;
  flex-shrink: 0;
}
</style>
