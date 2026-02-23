<script setup>
import { ref, onMounted, provide } from 'vue';
import HomeView from '@/views/HomeView.vue';
import GameView from '@/views/GameView.vue';

const currentView = ref('home');
const gameRef = ref(null);
const isDark = ref(false);

provide('theme', { isDark, toggleTheme: () => {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
}});

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
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
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
  overflow: visible;
}
</style>
