<script setup>
import { HelpCircle } from 'lucide-vue-next';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';

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
      <Input 
        :modelValue="answer" 
        @update:modelValue="$emit('update:answer', $event)" 
        placeholder="输入你的答案..." 
        @keyup.enter="$emit('submit')" 
      />
      <Button variant="primary" @click="$emit('submit')" :disabled="!answer.trim()">提交</Button>
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
  gap: 8px;
  align-items: stretch;
}

.guess-form :deep(.ios-button) {
  white-space: nowrap;
  flex-shrink: 0;
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
