<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info'
  },
  duration: {
    type: Number,
    default: 3000
  },
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:show']);

let timer = null;

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      emit('update:show', false);
    }, props.duration);
  }
});

const handleClose = () => {
  if (timer) clearTimeout(timer);
  emit('update:show', false);
};
</script>

<template>
  <Transition name="toast">
    <div v-if="show" class="ios-toast" :class="`ios-toast--${type}`">
      <span class="ios-toast-message">{{ message }}</span>
      <button class="ios-toast-close" @click="handleClose">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.ios-toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
  z-index: 2000;
  min-width: 280px;
  max-width: 90vw;
}

.ios-toast--info {
  border-left: 3px solid var(--accent);
}

.ios-toast--success {
  border-left: 3px solid var(--accent-green);
}

.ios-toast--error {
  border-left: 3px solid var(--accent-red);
}

.ios-toast--warning {
  border-left: 3px solid var(--accent-orange);
}

.ios-toast-message {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.ios-toast-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-tertiary);
  border-radius: 4px;
}

.ios-toast-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
