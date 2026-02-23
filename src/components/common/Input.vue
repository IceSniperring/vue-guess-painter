<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:modelValue']);
</script>

<template>
  <input
    class="ios-input"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped>
.ios-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.ios-input::placeholder {
  color: var(--text-tertiary);
}

.ios-input:focus {
  box-shadow: 0 0 0 3px var(--accent);
}

.ios-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
