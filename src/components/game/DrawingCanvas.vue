<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isHost: Boolean,
  gameStatus: String,
  drawingColor: String,
  drawingWidth: Number,
  isEraser: Boolean,
  strokes: Array,
  currentStroke: Array,
  socketEmit: Function,
  roomCode: String
});

const canvasRef = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const lastPos = ref({ x: 0, y: 0 });
const canvasReady = ref(false);

const emit = defineEmits(['draw-sync']);

const initCanvas = () => {
  if (!canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = Math.min(500, containerWidth * 0.625);
  
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = containerWidth * dpr;
  canvas.height = containerHeight * dpr;
  canvas.style.width = containerWidth + 'px';
  canvas.style.height = containerHeight + 'px';
  
  ctx.value = canvas.getContext('2d');
  ctx.value.scale(dpr, dpr);
  ctx.value.lineCap = 'round';
  ctx.value.lineJoin = 'round';
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, containerWidth, containerHeight);
  
  canvasReady.value = true;
};

const getCanvasSize = () => {
  if (!canvasRef.value) return { width: 800, height: 500 };
  const canvas = canvasRef.value;
  return {
    width: parseInt(canvas.style.width) || canvas.width,
    height: parseInt(canvas.style.height) || canvas.height
  };
};

const redrawAll = () => {
  if (!ctx.value) return;
  const size = getCanvasSize();
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, size.width, size.height);
  
  for (const stroke of props.strokes) {
    for (const segment of stroke) {
      ctx.value.strokeStyle = segment.color;
      ctx.value.lineWidth = segment.width;
      ctx.value.beginPath();
      ctx.value.moveTo(segment.from.x, segment.from.y);
      ctx.value.lineTo(segment.to.x, segment.to.y);
      ctx.value.stroke();
    }
  }
};

const startDrawing = (e) => {
  if (!props.isHost || props.gameStatus !== 'playing') {
    isDrawing.value = false;
    return;
  }
  isDrawing.value = true;
  
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const size = getCanvasSize();
  
  lastPos.value = {
    x: (e.clientX - rect.left) * (size.width / rect.width),
    y: (e.clientY - rect.top) * (size.height / rect.height)
  };
};

const draw = (e) => {
  if (!isDrawing.value || !ctx.value || !lastPos.value) return;
  
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const size = getCanvasSize();
  
  const currentPos = {
    x: (e.clientX - rect.left) * (size.width / rect.width),
    y: (e.clientY - rect.top) * (size.height / rect.height)
  };

  const color = props.isEraser ? '#FFFFFF' : props.drawingColor;
  const width = props.isEraser ? props.drawingWidth * 3 : props.drawingWidth;

  ctx.value.strokeStyle = color;
  ctx.value.lineWidth = width;
  ctx.value.beginPath();
  ctx.value.moveTo(lastPos.value.x, lastPos.value.y);
  ctx.value.lineTo(currentPos.x, currentPos.y);
  ctx.value.stroke();

  const drawData = {
    type: 'segment',
    from: { ...lastPos.value },
    to: currentPos,
    color: color,
    width: width,
    isEraser: props.isEraser
  };

  props.socketEmit('draw', { roomCode: props.roomCode, drawData });
  
  lastPos.value = currentPos;
};

const stopDrawing = () => {
  isDrawing.value = false;
};

const handleDrawSync = (data) => {
  const drawData = data.drawData;
  const size = getCanvasSize();
  
  if (drawData.type === 'segment') {
    ctx.value.strokeStyle = drawData.color;
    ctx.value.lineWidth = drawData.width;
    ctx.value.beginPath();
    ctx.value.moveTo(drawData.from.x, drawData.from.y);
    ctx.value.lineTo(drawData.to.x, drawData.to.y);
    ctx.value.stroke();
  } else if (drawData.type === 'clear') {
    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fillRect(0, 0, size.width, size.height);
  } else if (drawData.type === 'undo') {
    emit('undo');
  } else if (drawData.type === 'stroke-end') {
    emit('stroke-end', drawData.stroke);
  }
};

const replayDrawHistory = (historyData) => {
  if (!ctx.value) {
    setTimeout(() => replayDrawHistory(historyData), 100);
    return;
  }
  if (!historyData || historyData.length === 0) return;
  
  const size = getCanvasSize();
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, size.width, size.height);
  
  for (const stroke of historyData) {
    for (const segment of stroke) {
      ctx.value.strokeStyle = segment.color;
      ctx.value.lineWidth = segment.width;
      ctx.value.beginPath();
      ctx.value.moveTo(segment.from.x, segment.from.y);
      ctx.value.lineTo(segment.to.x, segment.to.y);
      ctx.value.stroke();
    }
  }
};

const clearCanvas = () => {
  if (!ctx.value) return;
  const size = getCanvasSize();
  ctx.value.fillStyle = '#FFFFFF';
  ctx.value.fillRect(0, 0, size.width, size.height);
};

const resetCanvas = () => {
  if (ctx.value) {
    const size = getCanvasSize();
    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fillRect(0, 0, size.width, size.height);
  }
};

defineExpose({ initCanvas, redrawAll, handleDrawSync, replayDrawHistory, clearCanvas, resetCanvas });
</script>

<template>
  <div class="canvas-wrapper" ref="canvasWrapper">
    <div v-if="isHost" class="canvas-label">
      <Palette :size="16" />
      绘画区
    </div>
    <canvas
      ref="canvasRef"
      :class="{ 'cursor-eraser': isEraser && isHost && gameStatus === 'playing' }"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
    ></canvas>
  </div>
</template>

<script>
import { Palette } from 'lucide-vue-next';
export default {
  components: { Palette }
}
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

.canvas-wrapper canvas {
  width: 100%;
  height: auto;
  display: block;
  cursor: crosshair;
}

.canvas-wrapper canvas.cursor-eraser {
  cursor: cell;
}

.canvas-label {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
  z-index: 10;
}
</style>
