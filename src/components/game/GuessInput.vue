<script setup>
import { HelpCircle, Check } from 'lucide-vue-next';

const props = defineProps({
  answer: String,
  answerError: String,
  answerSubmitted: Boolean
});

const emit = defineEmits(['update:answer', 'submit']);
</script>

<template>
  <div class="card guess-card">
    <h3 class="card-title">
      <HelpCircle :size="18" />
      提交答案
    </h3>
    <div class="guess-form">
      <div class="input-wrapper" :class="{ 'has-content': answer.trim() }">
        <input 
          :value="answer"
          @input="$emit('update:answer', $event.target.value)"
          type="text"
          placeholder="输入你的答案..."
          class="guess-input-field"
          @keyup.enter="$emit('submit')"
        />
        <button 
          class="submit-btn"
          :class="{ active: answer.trim() }"
          :disabled="!answer.trim()"
          @click="$emit('submit')"
        >
          <Check :size="20" />
        </button>
      </div>
    </div>
    <p v-if="answerError" class="guess-error">{{ answerError }}</p>
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

.guess-form {
  display: flex;
  align-items: stretch;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border: 2px solid var(--separator);
  border-radius: 12px;
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
}

.input-wrapper.has-content {
  border-color: var(--accent);
}

.guess-input-field {
  flex: 1;
  min-width: 0;
  padding: 12px 0 12px 16px;
  font-size: 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  outline: none;
}

.guess-input-field::placeholder {
  color: var(--text-tertiary);
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: not-allowed;
  transition: all 0.2s;
  flex-shrink: 0;
}

.submit-btn.active {
  color: #34C759;
  cursor: pointer;
}

.submit-btn.active:hover {
  color: #30D158;
}

.guess-error {
  margin-top: 10px;
  font-size: 13px;
  color: var(--accent-red);
  text-align: center;
  padding: 10px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 10px;
}
</style>
