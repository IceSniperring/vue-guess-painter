<script setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  duration: {
    type: Number,
    default: 3000
  }
});

const emit = defineEmits(['update:show']);

const toasts = reactive([]);
let toastId = 0;

const addToast = (message, type = 'info') => {
  const id = ++toastId;
  toasts.push({ id, message, type, show: true });
  
  setTimeout(() => {
    removeToast(id);
  }, props.duration);
};

const removeToast = (id) => {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
  }
};

const handleClose = (id) => {
  removeToast(id);
};

defineExpose({ addToast });
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id" 
          class="ios-toast" 
          :class="`ios-toast--${toast.type}`"
        >
          <div class="toast-content">
            <span class="toast-icon">
              <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#34C759"/>
                <path d="M6 10.5L8.5 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="toast.type === 'error'" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#FF3B30"/>
                <path d="M7 7L13 13M13 7L7 13" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="toast.type === 'warning'" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#FF9500"/>
                <path d="M10 6V11M10 14V14.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#007AFF"/>
                <path d="M10 6V11M10 14V14.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="ios-toast-message">{{ toast.message }}</span>
          </div>
          <button class="ios-toast-close" @click="handleClose(toast.id)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  z-index: 2000;
  pointer-events: none;
}

.ios-toast {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 18px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  min-width: 300px;
  max-width: 90vw;
  border: 1px solid rgba(255, 255, 255, 0.6);
  pointer-events: auto;
}

[data-theme="dark"] .ios-toast {
  background: rgba(40, 40, 40, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-icon svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

[data-theme="dark"] .toast-icon svg {
  filter: none;
}

.ios-toast-message {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #000;
  line-height: 1.4;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

[data-theme="dark"] .ios-toast-message {
  color: #fff;
  text-shadow: none;
}

.ios-toast--info .ios-toast-message {
  color: #007AFF;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}

[data-theme="dark"] .ios-toast--info .ios-toast-message {
  text-shadow: none;
}

.ios-toast--success .ios-toast-message {
  color: #34C759;
}

.ios-toast--error .ios-toast-message {
  color: #FF3B30;
}

.ios-toast--warning .ios-toast-message {
  color: #FF9500;
}

.ios-toast-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #8E8E93;
  border-radius: 8px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.ios-toast-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #000;
}

[data-theme="dark"] .ios-toast-close {
  color: #8E8E93;
}

[data-theme="dark"] .ios-toast-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
