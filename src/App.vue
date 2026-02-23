<script setup>
import { ref, onMounted } from 'vue';
import HomeView from '@/views/HomeView.vue';
import GameView from '@/views/GameView.vue';

const currentView = ref('home');
const gameRef = ref(null);

const handleCreateRoom = (data) => {
  currentView.value = 'game';
  setTimeout(() => {
    gameRef.value?.init({ createRoom: true, ...data });
  }, 100);
};

const handleJoinRoom = (data) => {
  currentView.value = 'game';
  setTimeout(() => {
    gameRef.value?.init({ createRoom: false, ...data });
  }, 100);
};

const handleLeave = () => {
  currentView.value = 'home';
};

onMounted(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
});
</script>

<template>
  <div class="app">
    <HomeView 
      v-if="currentView === 'home'"
      @create-room="handleCreateRoom"
      @join-room="handleJoinRoom"
    />
    <GameView 
      v-else 
      ref="gameRef"
      @leave="handleLeave"
    />
  </div>
</template>

<style>
@import './assets/styles/main.css';

.app {
  min-height: 100vh;
}
</style>
