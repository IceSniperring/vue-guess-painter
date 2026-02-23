<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'medium'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <button 
    class="ios-button" 
    :class="[`ios-button--${variant}`, `ios-button--${size}`]"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
</template>

<style scoped>
.ios-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.ios-button:active:not(:disabled) {
  transform: scale(0.98);
  opacity: 0.9;
}

.ios-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ios-button--primary {
  background: var(--accent);
  color: white;
}

.ios-button--success {
  background: var(--accent-green);
  color: white;
}

.ios-button--danger {
  background: var(--accent-red);
  color: white;
}

.ios-button--warning {
  background: var(--accent-orange);
  color: white;
}

.ios-button--small {
  padding: 8px 16px;
  font-size: 14px;
}

.ios-button--medium {
  padding: 12px 24px;
  font-size: 16px;
}

.ios-button--large {
  padding: 16px 32px;
  font-size: 18px;
}
</style>
