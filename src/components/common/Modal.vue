<script setup>
import { watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  closable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close']);

const handleBackdropClick = () => {
  if (props.closable) {
    emit('close');
  }
};

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.closable) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="ios-modal-overlay" @click="handleBackdropClick">
        <div class="ios-modal" @click.stop>
          <div v-if="title || closable" class="ios-modal-header">
            <h3 v-if="title" class="ios-modal-title">{{ title }}</h3>
            <button v-if="closable" class="ios-modal-close" @click="$emit('close')">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="ios-modal-content">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ios-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: var(--modal-blur);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.ios-modal {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.ios-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--separator);
}

.ios-modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.ios-modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 50%;
  transition: all 0.2s;
}

.ios-modal-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.ios-modal-content {
  padding: 20px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .ios-modal,
.modal-leave-active .ios-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .ios-modal,
.modal-leave-to .ios-modal {
  transform: scale(0.9);
}
</style>
