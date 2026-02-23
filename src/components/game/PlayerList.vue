<script setup>
import { Users, Crown } from 'lucide-vue-next';

const props = defineProps({
  players: Array
});
</script>

<template>
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
</style>
