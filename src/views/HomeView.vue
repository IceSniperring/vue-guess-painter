<script setup>
import { ref } from 'vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';

const mode = ref('home');
const roomCode = ref('');
const playerName = ref('');
const targetWord = ref('');
const error = ref('');
const loading = ref(false);

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
</script>

<template>
  <div class="home-view">
    <div class="home-container">
      <div class="home-logo">
        <div class="logo-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect width="80" height="80" rx="20" fill="var(--accent)"/>
            <path d="M20 50C20 50 30 30 40 30C50 30 60 50 60 50" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <circle cx="30" cy="40" r="4" fill="white"/>
            <circle cx="50" cy="40" r="4" fill="white"/>
            <path d="M35 55C35 55 40 60 45 55" stroke="white" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="home-title">你画我猜</h1>
        <p class="home-subtitle">多人在线绘画猜词游戏</p>
      </div>

      <div v-if="mode === 'home'" class="home-actions">
        <Button variant="primary" size="large" @click="mode = 'create'">
          创建房间
        </Button>
        <Button variant="default" size="large" @click="mode = 'join'">
          加入房间
        </Button>
      </div>

      <div v-else class="home-form">
        <div class="form-group">
          <label class="form-label">您的昵称</label>
          <Input 
            v-model="playerName" 
            placeholder="请输入昵称" 
            :disabled="loading"
          />
        </div>

        <div v-if="mode === 'create'" class="form-group">
          <label class="form-label">猜题目标</label>
          <Input 
            v-model="targetWord" 
            placeholder="请输入本轮猜题目标（如：小猫）" 
            :disabled="loading"
          />
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

        <p v-if="error" class="form-error">{{ error }}</p>

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

<style scoped>
.home-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.home-container {
  width: 100%;
  max-width: 360px;
}

.home-logo {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  margin-bottom: 16px;
}

.home-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.home-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
}

.home-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home-form {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
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

.form-error {
  font-size: 14px;
  color: var(--accent-red);
  margin-bottom: 16px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.form-actions button {
  flex: 1;
}
</style>
