<script setup>
import { inject, computed } from 'vue';
import { Crown, Users } from 'lucide-vue-next';

const { isDark } = inject('theme');

const props = defineProps({
  players: Array
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

const getDuplicateIndex = (player) => {
  const duplicates = props.players.filter(p => 
    p.player_name.charAt(0).toUpperCase() === player.player_name.charAt(0).toUpperCase()
  );
  if (duplicates.length <= 1) return null;
  const index = duplicates.indexOf(player);
  return index + 1;
};
</script>

<template>
  <div class="card players-card">
    <h3 class="card-title">
      <Users :size="18" />
      玩家列表
    </h3>
    <ul class="players-list">
      <li v-for="player in players" :key="player.socket_id" class="player-item">
        <div class="avatar-wrapper" :style="getAvatarStyle">
          {{ player.player_name.charAt(0).toUpperCase() }}
          <span v-if="getDuplicateIndex(player)" class="duplicate-badge">
            {{ getDuplicateIndex(player) }}
          </span>
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

.avatar-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
  position: relative;
}

.duplicate-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--accent);
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
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
