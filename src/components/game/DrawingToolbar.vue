<script setup>
import { computed } from 'vue';

const props = defineProps({
  isHost: Boolean,
  gameStatus: String,
  drawingColor: String,
  drawingWidth: Number,
  isEraser: Boolean,
  strokes: Array
});

const emit = defineEmits(['update:drawingColor', 'update:drawingWidth', 'update:isEraser', 'undo', 'clear']);

const presetColors = ['#000000', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'];

const handleColorClick = (color) => {
  emit('update:drawingColor', color);
  emit('update:isEraser', false);
};

const handleSizeClick = (size) => {
  emit('update:drawingWidth', size * 2);
};

const handleToolClick = (tool) => {
  if (tool === 'pencil') {
    emit('update:isEraser', false);
  } else if (tool === 'eraser') {
    emit('update:isEraser', true);
  }
};

const handleUndo = () => {
  emit('undo');
};

const handleClear = () => {
  emit('clear');
};
</script>

<template>
  <div v-if="isHost && gameStatus === 'playing'" class="toolbar-external">
    <div class="tool-group">
      <span class="tool-label">颜色</span>
      <div class="color-options">
        <button
          v-for="color in presetColors"
          :key="color"
          class="color-btn"
          :class="{ active: drawingColor === color && !isEraser }"
          :style="{ background: color }"
          @click="handleColorClick(color)"
        ></button>
      </div>
    </div>

    <div class="tool-group">
      <span class="tool-label">粗细</span>
      <div class="size-options">
        <button
          v-for="size in 5"
          :key="size"
          class="size-btn"
          :class="{ active: drawingWidth === size * 2 }"
          @click="handleSizeClick(size)"
        >
          <span class="size-indicator" :style="{ transform: `scale(${0.4 + size * 0.15})` }"></span>
        </button>
      </div>
    </div>

    <div class="tool-group">
      <span class="tool-label">工具</span>
      <div class="tool-options">
        <button class="tool-btn" :class="{ active: !isEraser }" @click="handleToolClick('pencil')">
          <Pencil :size="18" />
          画笔
        </button>
        <button class="tool-btn" :class="{ active: isEraser }" @click="handleToolClick('eraser')">
          <Eraser :size="18" />
          橡皮
        </button>
      </div>
    </div>

    <div class="tool-group">
      <span class="tool-label">操作</span>
      <div class="action-options">
        <button class="action-btn" @click="handleUndo" :disabled="strokes.length === 0">
          <Undo2 :size="18" />
          撤销
        </button>
        <button class="action-btn danger" @click="handleClear">
          <Trash2 :size="18" />
          清空
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { Pencil, Eraser, Undo2, Trash2 } from 'lucide-vue-next';
export default {
  components: { Pencil, Eraser, Undo2, Trash2 }
}
</script>

<style scoped>
.toolbar-external {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: var(--bg-primary);
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
  margin-right: 4px;
}

.color-options {
  display: flex;
  gap: 6px;
}

.color-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.15);
}

.color-btn.active {
  border-color: var(--text-primary);
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.size-options {
  display: flex;
  gap: 4px;
}

.size-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.size-btn:hover {
  background: var(--bg-tertiary);
}

.size-btn.active {
  background: var(--accent);
}

.size-indicator {
  width: 8px;
  height: 8px;
  background: var(--text-primary);
  border-radius: 50%;
}

.size-btn.active .size-indicator {
  background: white;
}

.tool-options {
  display: flex;
  gap: 6px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tool-btn:hover {
  background: var(--bg-tertiary);
}

.tool-btn.active {
  background: var(--accent);
  color: white;
}

.action-options {
  display: flex;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(255, 59, 48, 0.15);
  color: var(--accent-red);
}
</style>
