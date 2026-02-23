<script setup>
import { ref, computed } from 'vue';

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

const customColor = ref('#000000');
const customWidth = ref(4);
const showCustomColor = ref(false);
const showCustomSize = ref(false);

const isCustomColorActive = computed(() => {
  return !presetColors.includes(props.drawingColor);
});

const isCustomSizeActive = computed(() => {
  const standardSizes = [2, 4, 6, 8, 10];
  return !standardSizes.includes(props.drawingWidth);
});

const handleColorClick = (color) => {
  emit('update:drawingColor', color);
  emit('update:isEraser', false);
};

const handleCustomColorChange = (e) => {
  const color = e.target.value;
  customColor.value = color;
  emit('update:drawingColor', color);
  emit('update:isEraser', false);
};

const handleSizeClick = (size) => {
  emit('update:drawingWidth', size * 2);
};

const handleCustomWidthChange = (e) => {
  const width = parseInt(e.target.value) || 4;
  customWidth.value = width;
  emit('update:drawingWidth', width);
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
        <div class="custom-color-wrapper">
          <button
            class="color-btn custom-color-btn"
            :class="{ active: isCustomColorActive && !isEraser }"
            :style="{ background: customColor }"
            @click="showCustomColor = !showCustomColor"
          >
            <span class="custom-icon">+</span>
          </button>
          <div v-if="showCustomColor" class="custom-popup">
            <input
              type="color"
              :value="isCustomColorActive ? drawingColor : customColor"
              @input="handleCustomColorChange"
              class="color-picker"
            />
            <input
              type="text"
              :value="isCustomColorActive ? drawingColor : customColor"
              @change="handleCustomColorChange"
              class="color-input"
              placeholder="#000000"
            />
          </div>
        </div>
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
        <div class="custom-size-wrapper">
          <button
            class="size-btn custom-size-btn"
            :class="{ active: isCustomSizeActive }"
            @click="showCustomSize = !showCustomSize"
          >
            <span class="size-custom-text">{{ drawingWidth }}</span>
          </button>
          <div v-if="showCustomSize" class="custom-popup custom-size-popup">
            <input
              type="range"
              min="1"
              max="30"
              :value="isCustomSizeActive ? drawingWidth : customWidth"
              @input="handleCustomWidthChange"
              class="size-slider"
            />
            <span class="size-value">{{ isCustomSizeActive ? drawingWidth : customWidth }}px</span>
          </div>
        </div>
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

.custom-color-wrapper {
  position: relative;
}

.custom-color-btn {
  position: relative;
  overflow: hidden;
}

.custom-color-btn .custom-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.custom-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-picker {
  width: 120px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
}

.color-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--bg-tertiary);
  border-radius: 8px;
  font-size: 13px;
  text-transform: uppercase;
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

.custom-size-wrapper {
  position: relative;
}

.custom-size-btn .size-custom-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.custom-size-popup {
  min-width: 140px;
  align-items: center;
}

.size-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  appearance: none;
  background: var(--bg-tertiary);
  cursor: pointer;
}

.size-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
}

.size-value {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
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
